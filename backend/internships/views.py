from datetime import datetime, time, timedelta
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from applications.models import Application
from .models import Internship, Project, ProjectAssignment, ProjectSubmissionAudit
from .serializers import (
    AdminInternshipSerializer,
    AdminProjectAssignmentSerializer,
    InternshipSerializer,
    ProjectAssignmentSerializer,
    ProjectSerializer,
    validate_github_repo_url,
)


class InternshipListCreateView(generics.ListCreateAPIView):
    serializer_class = InternshipSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Public view only shows published internships
        return Internship.objects.filter(status='published').order_by('-created_at')


class InternshipDetailView(generics.RetrieveAPIView):
    queryset = Internship.objects.all()
    serializer_class = InternshipSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        lookup = self.kwargs.get('slug', '')
        if str(lookup).isdigit():
            obj = Internship.objects.filter(id=int(lookup)).first()
            if obj:
                return obj
        return get_object_or_404(Internship, slug=lookup)


class AdminInternshipListCreateView(generics.ListCreateAPIView):
    serializer_class = AdminInternshipSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Internship.objects.all().prefetch_related('projects').order_by('-created_at')
        query = self.request.query_params.get('search', '').strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(slug__icontains=query)
                | Q(description__icontains=query)
                | Q(category__icontains=query)
                | Q(location__icontains=query)
            )
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        published = self.request.query_params.get('published')
        if published in ('true', '1'):
            queryset = queryset.filter(published=True)
        elif published in ('false', '0'):
            queryset = queryset.filter(published=False)
        return queryset


class AdminInternshipDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminInternshipSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = Internship.objects.all().prefetch_related('projects')

    def get_object(self):
        lookup = self.kwargs.get('slug', '')
        if str(lookup).isdigit():
            obj = Internship.objects.filter(id=int(lookup)).first()
            if obj:
                return obj
        return get_object_or_404(Internship, slug=lookup)


class AdminPaymentQrListView(APIView):
    """Staff endpoint to list unique payment QR codes previously uploaded across internships."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        india_qrs = []
        nepal_qrs = []
        seen_india = set()
        seen_nepal = set()

        internships = Internship.objects.all().order_by('-updated_at')
        for item in internships:
            if item.india_payment_qr and item.india_payment_qr.name and item.india_payment_qr.name not in seen_india:
                seen_india.add(item.india_payment_qr.name)
                try:
                    url = request.build_absolute_uri(item.india_payment_qr.url) if request else item.india_payment_qr.url
                except Exception:
                    url = str(item.india_payment_qr)
                india_qrs.append({
                    'internship_id': item.id,
                    'internship_title': item.title,
                    'file_name': item.india_payment_qr.name,
                    'url': url,
                    'updated_at': item.updated_at.isoformat() if item.updated_at else None,
                })
            if item.nepal_payment_qr and item.nepal_payment_qr.name and item.nepal_payment_qr.name not in seen_nepal:
                seen_nepal.add(item.nepal_payment_qr.name)
                try:
                    url = request.build_absolute_uri(item.nepal_payment_qr.url) if request else item.nepal_payment_qr.url
                except Exception:
                    url = str(item.nepal_payment_qr)
                nepal_qrs.append({
                    'internship_id': item.id,
                    'internship_title': item.title,
                    'file_name': item.nepal_payment_qr.name,
                    'url': url,
                    'updated_at': item.updated_at.isoformat() if item.updated_at else None,
                })

        return Response({
            'india_qrs': india_qrs,
            'nepal_qrs': nepal_qrs,
        })



# -------------------------------------------------------------
# Admin Projects Configuration (Up to 5 Projects per Internship)
# -------------------------------------------------------------

class AdminProjectListCreateView(generics.ListCreateAPIView):
    """Staff endpoint to list or create project templates for an internship."""
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        internship_id = self.kwargs.get('internship_id') or self.request.query_params.get('internship')
        if internship_id:
            return Project.objects.filter(internship_id=internship_id).order_by('order', 'id')
        return Project.objects.all().order_by('internship', 'order', 'id')

    def perform_create(self, serializer):
        internship_id = self.kwargs.get('internship_id') or self.request.data.get('internship')
        internship = get_object_or_404(Internship, pk=internship_id)
        serializer.save(internship=internship)


class AdminProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Staff endpoint to view, edit, or delete a project template."""
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Project.objects.all()


# -------------------------------------------------------------
# Candidate Project Portal (Only for Accepted Interns)
# -------------------------------------------------------------

class CandidateProjectAssignmentListView(generics.ListAPIView):
    """Returns assigned projects for the logged-in accepted candidate."""
    serializer_class = ProjectAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        # Strict isolation: Only accepted applications belonging to the user
        accepted_apps = Application.objects.filter(
            user=self.request.user,
            status='accepted'
        ).select_related('internship')
        for app in accepted_apps:
            app.init_project_assignments()

        return ProjectAssignment.objects.filter(
            application__user=self.request.user,
            application__status='accepted'
        ).select_related('project', 'application__internship').order_by('project__order', 'id')


class CandidateProjectSubmitView(APIView):
    """Allows an accepted intern to submit their GitHub repository link before the assigned deadline."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        assignment = get_object_or_404(
            ProjectAssignment.objects.select_related('application', 'project'),
            pk=pk,
            application__user=request.user
        )

        if assignment.application.status != 'accepted':
            return Response(
                {'error': 'Only accepted interns can submit projects.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Enforce deadline
        if assignment.assigned_deadline and timezone.now() > assignment.assigned_deadline:
            return Response(
                {'error': 'The assigned deadline for this project has passed. Submissions are no longer accepted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        raw_url = request.data.get('github_url', '')
        try:
            valid_url = validate_github_repo_url(raw_url)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        prev_status = assignment.status
        assignment.github_url = valid_url
        assignment.submitted_at = timezone.now()
        assignment.status = ProjectAssignment.STATUS_SUBMITTED
        assignment.save()

        # Audit log
        ProjectSubmissionAudit.objects.create(
            assignment=assignment,
            action='candidate_submitted_project',
            previous_status=prev_status,
            new_status=ProjectAssignment.STATUS_SUBMITTED,
            github_url=valid_url,
            actor_email=request.user.email,
        )

        serializer = ProjectAssignmentSerializer(assignment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# -------------------------------------------------------------
# Admin Assignment & Review Management
# -------------------------------------------------------------

class AdminProjectAssignmentListView(generics.ListAPIView):
    """Staff endpoint to list, search, and filter intern project assignments."""
    serializer_class = AdminProjectAssignmentSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = ProjectAssignment.objects.select_related(
            'application__user', 'application__internship', 'project'
        ).order_by('-updated_at')

        app_id = self.request.query_params.get('application')
        if app_id:
            try:
                target_app = Application.objects.filter(pk=app_id, status='accepted').first()
                if target_app:
                    target_app.init_project_assignments()
            except Exception:
                pass
            queryset = queryset.filter(application_id=app_id)

        internship_id = self.request.query_params.get('internship')
        if internship_id:
            queryset = queryset.filter(application__internship_id=internship_id)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        query = self.request.query_params.get('search', '').strip()
        if query:
            queryset = queryset.filter(
                Q(application__application_number__icontains=query)
                | Q(application__user__email__icontains=query)
                | Q(application__full_name__icontains=query)
                | Q(project__title__icontains=query)
                | Q(github_url__icontains=query)
            )

        overdue = self.request.query_params.get('overdue')
        if overdue in ('true', '1'):
            queryset = queryset.filter(
                assigned_deadline__lt=timezone.now()
            ).exclude(status__in=[ProjectAssignment.STATUS_SUBMITTED, ProjectAssignment.STATUS_REVIEWED, ProjectAssignment.STATUS_COMPLETED])

        return queryset


class AdminProjectAssignmentDetailView(generics.RetrieveUpdateAPIView):
    """Staff endpoint to update project deadlines, durations, feedback, and review status."""
    serializer_class = AdminProjectAssignmentSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = ProjectAssignment.objects.select_related(
        'application__user', 'application__internship', 'project'
    ).all()


class AdminApplicationProjectAssignView(APIView):
    """Allows admin to assign/customize durations and deadlines for all projects of an accepted application."""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, app_id, *args, **kwargs):
        application = get_object_or_404(
            Application.objects.select_related('internship'),
            pk=app_id
        )

        if application.status != 'accepted':
            return Response(
                {'error': 'Deadlines can only be assigned to accepted interns.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure project assignments exist
        application.init_project_assignments()

        # Custom project assignments array in request:
        # [{ "project_id": 1, "duration_days": 5, "assigned_start_date": "2026-10-01" }, ...]
        assignments_data = request.data.get('assignments', [])
        updated_assignments = []

        now = timezone.now()
        for item in assignments_data:
            proj_id = item.get('project_id') or item.get('id')
            duration = int(item.get('duration_days', 7))
            start_str = item.get('assigned_start_date')
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date() if start_str else now.date()

            deadline_dt = datetime.combine(start_date + timedelta(days=duration), time(23, 59, 59))
            deadline = timezone.make_aware(deadline_dt)

            assignment = ProjectAssignment.objects.filter(
                application=application,
                project_id=proj_id
            ).first()

            if assignment:
                assignment.duration_days = duration
                assignment.assigned_start_date = start_date
                assignment.assigned_deadline = deadline
                if 'status' in item and item['status'] in [c[0] for c in ProjectAssignment.STATUS_CHOICES]:
                    assignment.status = item['status']
                assignment.save()

                ProjectSubmissionAudit.objects.create(
                    assignment=assignment,
                    action='admin_assigned_duration_and_deadline',
                    previous_status=assignment.status,
                    new_status=assignment.status,
                    notes=f"Duration set to {duration} days, deadline: {deadline}",
                    actor_email=request.user.email,
                )
                updated_assignments.append(assignment)

        all_assignments = ProjectAssignment.objects.filter(application=application).order_by('project__order')
        serializer = AdminProjectAssignmentSerializer(all_assignments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
