import os
from datetime import timedelta
from django.db.models import Q
from django.http import FileResponse, Http404, HttpResponse
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Offer
from .serializers import (
    OfferCreateSerializer,
    OfferSerializer,
    OfferVerificationSerializer,
)
from applications.models import Application
from notifications.models import Notification


class AdminOfferListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OfferCreateSerializer
        return OfferSerializer

    def get_queryset(self):
        queryset = Offer.objects.select_related('application__user', 'application__internship').order_by('-created_at')
        
        # Auto check expiration on queried items
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(candidate_name__icontains=search)
                | Q(candidate_email__icontains=search)
                | Q(offer_letter_number__icontains=search)
                | Q(verification_code__icontains=search)
                | Q(internship_title__icontains=search)
                | Q(application__user__email__icontains=search)
            )

        status_param = self.request.query_params.get('status', '').strip().lower()
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)

        return queryset

    def perform_create(self, serializer):
        offer = serializer.save()
        return offer


class AdminOfferDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OfferSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Offer.objects.select_related('application__user', 'application__internship')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.check_expiration()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class AdminEligibleApplicationsView(APIView):
    """
    Returns accepted applications that are eligible for offer letter generation.
    Only applications with status='accepted' can receive an offer letter.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # Applications with status 'accepted'
        accepted_apps = Application.objects.filter(status='accepted').select_related('user', 'internship')
        
        data = []
        for app in accepted_apps:
            has_offer = hasattr(app, 'offer') and app.offer is not None
            offer_data = None
            if has_offer:
                offer_data = {
                    'id': app.offer.id,
                    'offer_letter_number': app.offer.offer_letter_number,
                    'status': app.offer.status,
                }

            user = app.user
            internship = app.internship
            data.append({
                'id': app.id,
                'candidate_name': app.full_name or (user.get_full_name() if user else '') or (user.username if user else 'Candidate'),
                'candidate_email': app.email or (user.email if user else ''),
                'internship_title': internship.title if internship else 'Software Development',
                'duration': getattr(internship, 'duration', '4 Weeks') or '4 Weeks',
                'mode': (app.preferred_mode or getattr(internship, 'mode', 'remote')).title(),
                'stipend': getattr(internship, 'stipend', 'Unpaid') or 'Unpaid',
                'has_offer': has_offer,
                'offer': offer_data,
                'accepted_date': app.updated_at.strftime('%Y-%m-%d') if app.updated_at else None,
            })

        return Response(data)


class AdminOfferIssueView(APIView):
    """
    Issues an offer letter:
    - Sets status to 'issued'
    - Sets issue_date to today
    - Sets acceptance_deadline to today + 2 days
    - Generates official PDF
    - Sends candidate notification
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            offer = Offer.objects.select_related('application__user', 'application__internship').get(pk=pk)
        except Offer.DoesNotExist:
            return Response({'error': 'Offer letter not found.'}, status=status.HTTP_404_NOT_FOUND)

        if offer.status == 'revoked':
            return Response({'error': 'Revoked offers cannot be issued directly.'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        offer.status = 'issued'
        offer.issue_date = today
        offer.acceptance_deadline = today + timedelta(days=2)
        offer.save()

        # Generate / regenerate PDF
        try:
            offer.generate_pdf(force=True)
        except Exception as e:
            pass

        # Send notification to the candidate
        try:
            candidate_user = offer.application.user
            Notification.objects.create(
                recipient=candidate_user,
                title="Official Offer Letter Issued!",
                message=(
                    f"Congratulations {offer.candidate_name}! Your official offer letter for the "
                    f"{offer.internship_title} internship ({offer.offer_letter_number}) has been issued. "
                    f"Please review and accept your offer in the portal before {offer.acceptance_deadline.strftime('%d %B %Y')}."
                ),
            )
        except Exception:
            pass

        serializer = OfferSerializer(offer, context={'request': request})
        return Response(serializer.data)


class AdminOfferRevokeView(APIView):
    """
    Revokes an existing offer letter.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk)
        except Offer.DoesNotExist:
            return Response({'error': 'Offer letter not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '').strip()
        offer.status = 'revoked'
        offer.revoked_at = timezone.now()
        offer.revocation_reason = reason
        offer.save(update_fields=['status', 'revoked_at', 'revocation_reason', 'updated_at'])

        # Notify candidate of revocation
        try:
            candidate_user = offer.application.user
            Notification.objects.create(
                recipient=candidate_user,
                title="Offer Letter Revoked",
                message=f"Your offer letter {offer.offer_letter_number} has been revoked by VINEXTURE Administration. Reason: {reason or 'Administrative update'}.",
            )
        except Exception:
            pass

        serializer = OfferSerializer(offer, context={'request': request})
        return Response(serializer.data)


class OfferPdfDownloadView(APIView):
    """
    Serves the offer letter PDF for admin or the authorized candidate.
    Supports Authorization header, query parameter ?token=<jwt>, and both local/Cloudinary storage.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        user = request.user
        if not user or not user.is_authenticated:
            token = request.query_params.get('token')
            if token:
                from rest_framework_simplejwt.authentication import JWTAuthentication
                try:
                    jwt_auth = JWTAuthentication()
                    validated_token = jwt_auth.get_validated_token(token)
                    user = jwt_auth.get_user(validated_token)
                except Exception:
                    pass

        if not user or not user.is_authenticated:
            return Response({'error': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            offer = Offer.objects.select_related('application__user').get(pk=pk)
        except Offer.DoesNotExist:
            raise Http404("Offer not found")

        # Check permissions: Admin or candidate owner
        is_admin_user = bool(user.is_staff or getattr(user, 'role', '') == 'admin' or user.is_superuser)
        if not (is_admin_user or offer.application.user_id == user.id):
            return Response({'error': 'You do not have permission to access this offer letter.'}, status=status.HTTP_403_FORBIDDEN)

        from io import BytesIO
        file_stream = None

        if offer.pdf_file:
            try:
                # Open stream from file storage (compatible with local FileSystemStorage and Cloudinary)
                file_stream = offer.pdf_file.open('rb')
            except Exception:
                file_stream = None

        if not file_stream:
            try:
                from .pdf_generator import generate_offer_letter_pdf
                pdf_bytes = generate_offer_letter_pdf(offer)
                file_stream = BytesIO(pdf_bytes)
            except Exception as e:
                return Response({'error': f'Failed to generate PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response = FileResponse(file_stream, content_type='application/pdf')
        filename = f"VINEXTURE_Offer_Letter_{offer.offer_letter_number}.pdf"
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response


class CandidateMyOffersView(APIView):
    """
    Returns all offer letters belonging to the authenticated candidate.
    Checks expiration on all items before responding.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        offers = Offer.objects.filter(application__user=request.user).select_related(
            'application__user', 'application__internship'
        ).order_by('-created_at')

        # Check expiration on each
        for offer in offers:
            offer.check_expiration()

        serializer = OfferSerializer(offers, many=True, context={'request': request})
        return Response(serializer.data)


class CandidateAcceptOfferView(APIView):
    """
    Candidate accepts their issued offer letter before the deadline.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            offer = Offer.objects.select_related('application__user', 'application__internship').get(
                pk=pk, application__user=request.user
            )
        except Offer.DoesNotExist:
            return Response({'error': 'Offer letter not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check expiration
        if offer.check_expiration():
            return Response({'error': 'This offer letter has expired. The 2-day acceptance deadline has passed.'}, status=status.HTTP_400_BAD_REQUEST)

        if offer.status == 'revoked':
            return Response({'error': 'This offer has been revoked and cannot be accepted.'}, status=status.HTTP_400_BAD_REQUEST)

        if offer.status == 'accepted':
            return Response({'message': 'This offer has already been accepted.', 'offer': OfferSerializer(offer, context={'request': request}).data}, status=status.HTTP_200_OK)

        if offer.status != 'issued':
            return Response({'error': f'Offer is currently in {offer.status} status and cannot be accepted yet.'}, status=status.HTTP_400_BAD_REQUEST)

        # Accept offer
        offer.status = 'accepted'
        offer.accepted_at = timezone.now()
        offer.save(update_fields=['status', 'accepted_at', 'updated_at'])

        # Create confirmation notification
        try:
            Notification.objects.create(
                recipient=request.user,
                title="Offer Letter Accepted!",
                message=f"Congratulations! You have successfully accepted the offer for {offer.internship_title} ({offer.offer_letter_number}). Welcome to VINEXTURE!",
            )
        except Exception:
            pass

        serializer = OfferSerializer(offer, context={'request': request})
        return Response({
            'message': 'Offer successfully accepted! Welcome to the VINEXTURE Internship Program.',
            'offer': serializer.data
        }, status=status.HTTP_200_OK)


class OfferVerificationView(APIView):
    """
    Public verification endpoint accessed via dynamic QR code or direct code lookup.
    No authentication required.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, code):
        code = code.strip()
        offer = Offer.objects.filter(
            Q(verification_code__iexact=code) | Q(offer_letter_number__iexact=code)
        ).first()

        if not offer:
            return Response({
                'found': False,
                'is_valid': False,
                'message': f"No official VINEXTURE offer letter was found matching verification query '{code}'."
            }, status=status.HTTP_404_NOT_FOUND)

        offer.check_expiration()
        serializer = OfferVerificationSerializer(offer)
        
        return Response({
            'found': True,
            'is_valid': offer.status in ['issued', 'accepted'],
            'data': serializer.data
        }, status=status.HTTP_200_OK)
