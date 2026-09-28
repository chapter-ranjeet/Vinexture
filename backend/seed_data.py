import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from blog.models import BlogPost
from internships.models import Internship

User = get_user_model()

def seed():
    admin_email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@vinexture.com')
    admin_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Admin@12345')
    admin_username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'vinexture-admin')

    user, created = User.objects.get_or_create(
        email=admin_email,
        defaults={
            'username': admin_username,
            'role': 'admin',
            'is_verified': True,
            'is_staff': True,
            'is_superuser': True,
        },
    )
    user.role = 'admin'
    user.is_staff = True
    user.is_superuser = True
    user.is_verified = True
    user.set_password(admin_password)
    user.save()
    print(f"Admin user configured: {admin_email}")

    BlogPost.objects.get_or_create(
        slug='building-digital-capability',
        defaults={
            'title': 'Building digital capability for growth teams',
            'excerpt': 'An overview of practical value creation through digital enablement.',
            'content': 'VINEXTURE helps organizations build systems that link technology, talent, and process execution.',
            'category': 'insights',
            'published': True,
        },
    )

    Internship.objects.get_or_create(
        slug='product-design-intern',
        defaults={
            'title': 'Product Design Intern',
            'description': 'Support research, prototyping, and user experience work for digital products.',
            'location': 'Remote',
            'is_remote': True,
            'published': True,
        },
    )

    from cms.models import CMSAnnouncement, CMSFaq, CMSPage, CMSSiteSetting

    CMSPage.objects.get_or_create(
        slug='about-us',
        defaults={
            'title': 'About VINEXTURE',
            'excerpt': 'Learn about VINEXTURE technology leadership, talent development, and innovation systems.',
            'content': 'VINEXTURE operates at the intersection of high-growth technology consulting, custom software delivery, and talent accelerator programs. Our mission is to bridge academic fundamentals with enterprise product engineering.',
            'is_published': True,
        },
    )

    CMSPage.objects.get_or_create(
        slug='terms-of-service',
        defaults={
            'title': 'Terms of Service & Program Guidelines',
            'excerpt': 'Official candidate guidelines, evaluation standards, and project delivery terms.',
            'content': 'All participants in VINEXTURE internship cohorts agree to adhere to intellectual property requirements, submission deadlines, and professional codes of conduct. Project assignments must represent original candidate contributions.',
            'is_published': True,
        },
    )

    CMSPage.objects.get_or_create(
        slug='selection-process',
        defaults={
            'title': 'Internship Selection & Verification Process',
            'excerpt': 'Transparent breakdown of application verification, payment confirmation, and project milestones.',
            'content': '1. Application Submission & Verification: Candidates submit credentials and verification fee.\n2. Admission & Offer Letter: Verified applicants receive a cryptographically signed Offer Letter.\n3. Milestone Projects: Interns complete up to 5 structured project templates.\n4. Certification: Successful delivery earns a verifiable Certificate of Completion.',
            'is_published': True,
        },
    )

    CMSAnnouncement.objects.get_or_create(
        title='Winter & Spring 2026 Internship Cohorts Now Open',
        defaults={
            'message': 'Applications are now open for remote AI, Full-Stack, and Cloud Engineering cohorts. Scan payment QR to finalize your verification.',
            'badge': 'New Cohort',
            'link_url': '/internships',
            'banner_type': 'promo',
            'is_active': True,
        },
    )

    CMSFaq.objects.get_or_create(
        question='How do I receive my verified Offer Letter?',
        defaults={
            'answer': 'Once your application fee and details are reviewed and accepted by our team, your official Offer Letter is generated with a cryptographic QR code and available for instant download in your portal.',
            'category': 'certificates',
            'order': 1,
            'is_published': True,
        },
    )

    CMSSiteSetting.objects.get_or_create(
        key='support_email',
        defaults={
            'value': 'support@vinexture.com',
            'label': 'Official Support Email',
            'description': 'Main contact address displayed across footers and candidate emails',
        },
    )

    print("Seed data completed successfully.")


if __name__ == '__main__':
    seed()
