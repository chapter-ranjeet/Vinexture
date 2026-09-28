from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Application
from .serializers import AdminApplicationSerializer, ApplicationSerializer


def sync_candidate_profile_from_application(user, app):
    """Automatically synchronizes candidate profile with updated application information."""
    if not user or not user.is_authenticated:
        return
    try:
        from candidates.models import CandidateProfile
        profile, _ = CandidateProfile.objects.get_or_create(user=user)
        updated = False

        field_mappings = [
            ('phone', 'phone'),
            ('qualification', 'qualification'),
            ('college_university', 'college_university'),
            ('course', 'course'),
            ('specialization', 'specialization'),
            ('semester_year', 'semester_year'),
            ('graduation_year', 'graduation_year'),
            ('cgpa', 'cgpa'),
            ('gender', 'gender'),
            ('dob', 'dob'),
            ('country', 'nationality'),
            ('technical_skills', 'technical_skills'),
            ('other_skills', 'other_skills'),
            ('projects', 'projects'),
            ('experience', 'experience'),
            ('certifications', 'certifications'),
            ('github_url', 'github_url'),
            ('linkedin_url', 'linkedin_url'),
            ('portfolio_url', 'portfolio_url'),
            ('preferred_mode', 'preferred_mode'),
            ('availability', 'availability'),
        ]

        for app_attr, prof_attr in field_mappings:
            val = getattr(app, app_attr, None)
            if val is not None and str(val).strip():
                if not getattr(profile, prof_attr, None) or getattr(profile, prof_attr, None) != val:
                    setattr(profile, prof_attr, val)
                    updated = True

        if app.resume and not profile.resume:
            profile.resume = app.resume
            updated = True

        if updated:
            profile.save()
    except Exception:
        pass


class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user).select_related('internship').prefetch_related('payments')

    def create(self, request, *args, **kwargs):
        internship_id = request.data.get('internship')
        # If user already has an existing draft for this internship, return it so they resume cleanly
        if internship_id:
            existing_draft = Application.objects.filter(
                user=request.user,
                internship_id=internship_id,
                status__in=['draft', 'payment_pending']
            ).first()
            if existing_draft:
                serializer = self.get_serializer(existing_draft, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                instance = serializer.save()
                sync_candidate_profile_from_application(request.user, instance)
                return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = self.request.user
        # Pre-fill email/name if empty
        full_name = serializer.validated_data.get('full_name') or user.get_full_name() or user.username
        email = serializer.validated_data.get('email') or user.email
        phone = serializer.validated_data.get('phone') or user.phone
        instance = serializer.save(user=user, full_name=full_name, email=email, phone=phone)
        sync_candidate_profile_from_application(user, instance)


class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user).select_related('internship').prefetch_related('payments')

    def perform_update(self, serializer):
        instance = serializer.save()
        sync_candidate_profile_from_application(self.request.user, instance)


class ActiveDraftView(APIView):
    """Allows candidates to quickly find or initialize a draft for a specific internship."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        internship_id = request.query_params.get('internship')
        if not internship_id:
            return Response({'error': 'Internship ID required'}, status=status.HTTP_400_BAD_REQUEST)

        existing = Application.objects.filter(
            user=request.user,
            internship_id=internship_id
        ).order_by('-updated_at').first()

        if existing:
            serializer = ApplicationSerializer(existing, context={'request': request})
            return Response(serializer.data)

        return Response({'found': False}, status=status.HTTP_404_NOT_FOUND)


class CandidatePrefillView(APIView):
    """
    Returns smart auto-filled application fields for a candidate applying to an internship.
    Automatically aggregates details from:
    1. Candidate's existing draft for this specific internship (if present)
    2. Candidate's Profile (CandidateProfile)
    3. Candidate's most recent submitted Application (if present)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        internship_id = request.query_params.get('internship')
        user = request.user

        from candidates.models import CandidateProfile
        profile, _ = CandidateProfile.objects.get_or_create(user=user)

        # 1. Existing draft for this specific internship
        existing_draft = None
        if internship_id:
            existing_draft = Application.objects.filter(
                user=user,
                internship_id=internship_id
            ).order_by('-updated_at').first()

        # 2. Most recent application from any internship for fallback
        latest_app = Application.objects.filter(user=user).exclude(
            id=existing_draft.id if existing_draft else None
        ).order_by('-created_at').first()

        # Helpers
        def pick(attr_app, attr_prof, fallback=""):
            if existing_draft:
                val = getattr(existing_draft, attr_app, None)
                if val is not None and str(val).strip():
                    return str(val).strip()
            if hasattr(profile, attr_prof):
                val = getattr(profile, attr_prof, None)
                if val is not None and str(val).strip():
                    return str(val).strip()
            if latest_app:
                val = getattr(latest_app, attr_app, None)
                if val is not None and str(val).strip():
                    return str(val).strip()
            return fallback

        full_name = (
            (existing_draft.full_name if existing_draft and existing_draft.full_name else '')
            or user.get_full_name()
            or user.username
        )
        email = (
            (existing_draft.email if existing_draft and existing_draft.email else '')
            or user.email
        )
        phone = pick('phone', 'phone', fallback=user.phone or '')
        country = pick('country', 'nationality', fallback='India')
        if country and 'nepal' in country.lower():
            country = 'Nepal'
        elif country and 'india' in country.lower():
            country = 'India'

        dob = pick('dob', 'dob')
        gender = pick('gender', 'gender')
        qualification = pick('qualification', 'qualification')
        college_university = pick('college_university', 'college_university')
        course = pick('course', 'course')
        specialization = pick('specialization', 'specialization')
        semester_year = pick('semester_year', 'semester_year')
        graduation_year = pick('graduation_year', 'graduation_year')
        cgpa = pick('cgpa', 'cgpa')
        technical_skills = pick('technical_skills', 'technical_skills')
        other_skills = pick('other_skills', 'other_skills')
        projects = pick('projects', 'projects')
        experience = pick('experience', 'experience') or getattr(profile, 'bio', '') or (latest_app.experience if latest_app else '')
        certifications = pick('certifications', 'certifications')

        resume_url = None
        if existing_draft and existing_draft.resume:
            resume_url = request.build_absolute_uri(existing_draft.resume.url)
        elif profile.resume:
            resume_url = request.build_absolute_uri(profile.resume.url)
        elif latest_app and latest_app.resume:
            resume_url = request.build_absolute_uri(latest_app.resume.url)

        github_url = pick('github_url', 'github_url')
        linkedin_url = pick('linkedin_url', 'linkedin_url')
        portfolio_url = pick('portfolio_url', 'portfolio_url')
        preferred_mode = pick('preferred_mode', 'preferred_mode', fallback='remote')
        availability = pick('availability', 'availability', fallback='Immediate')
        expected_start_date = pick('expected_start_date', 'expected_start_date')
        why_join = pick('why_join', 'headline') or (latest_app.why_join if latest_app else '')
        learning_expectations = pick('learning_expectations', 'bio') or (latest_app.learning_expectations if latest_app else '')

        # Check if candidate profile or records have provided any matching data
        is_auto_filled = bool(
            phone or qualification or college_university or course
            or technical_skills or github_url or portfolio_url
            or resume_url or (latest_app is not None)
        )

        data = {
            'id': existing_draft.id if existing_draft else None,
            'application_number': existing_draft.application_number if existing_draft else None,
            'status': existing_draft.status if existing_draft else 'draft',
            'current_step': existing_draft.current_step if existing_draft else 1,
            'internship': existing_draft.internship_id if existing_draft else (int(internship_id) if internship_id and internship_id.isdigit() else None),
            'full_name': full_name,
            'email': email,
            'phone': phone,
            'country': country or 'India',
            'dob': dob,
            'gender': gender,
            'qualification': qualification,
            'college_university': college_university,
            'course': course,
            'specialization': specialization,
            'semester_year': semester_year,
            'graduation_year': graduation_year,
            'cgpa': cgpa,
            'technical_skills': technical_skills,
            'other_skills': other_skills,
            'projects': projects,
            'experience': experience,
            'certifications': certifications,
            'resume_url': resume_url,
            'github_url': github_url,
            'linkedin_url': linkedin_url,
            'portfolio_url': portfolio_url,
            'preferred_mode': preferred_mode or 'remote',
            'availability': availability or 'Immediate',
            'expected_start_date': expected_start_date,
            'why_join': why_join,
            'learning_expectations': learning_expectations,
            'is_auto_filled': is_auto_filled,
            'has_draft': bool(existing_draft),
            'latest_payment': ApplicationSerializer(existing_draft, context={'request': request}).data.get('latest_payment') if existing_draft else None,
        }
        return Response(data)


class AdminApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = AdminApplicationSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Application.objects.select_related('user', 'internship').prefetch_related('payments').order_by('-created_at')
        query = self.request.query_params.get('search', '').strip()
        if query:
            queryset = queryset.filter(
                Q(application_number__icontains=query)
                | Q(full_name__icontains=query)
                | Q(email__icontains=query)
                | Q(phone__icontains=query)
                | Q(user__email__icontains=query)
                | Q(internship__title__icontains=query)
                | Q(college_university__icontains=query)
            )
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        internship = self.request.query_params.get('internship')
        if internship:
            queryset = queryset.filter(internship_id=internship)
        return queryset


class AdminApplicationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminApplicationSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = Application.objects.select_related('user', 'internship').prefetch_related('payments').all()
