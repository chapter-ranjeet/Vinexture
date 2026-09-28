from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from blog.models import BlogPost
from internships.models import Internship

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed demo VINEXTURE content for local development.'

    def handle(self, *args, **kwargs):
        user, _ = User.objects.get_or_create(
            email='admin@vinexture.com',
            defaults={'username': 'vinexture-admin', 'role': 'admin', 'is_verified': True, 'is_staff': True, 'is_superuser': True},
        )
        if not user.has_usable_password():
            user.set_password('Admin@12345')
            user.save()

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
