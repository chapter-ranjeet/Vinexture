import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from blog.models import BlogPost
from internships.models import Internship

User = get_user_model()


class Command(BaseCommand):
    help = 'Create admin superuser and seed demo VINEXTURE content.'

    def handle(self, *args, **kwargs):
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
        self.stdout.write(self.style.SUCCESS(f'Admin user configured: {admin_email}'))

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

        self.stdout.write(self.style.SUCCESS('Seed data ready.'))
