from django.db import models


class CMSPage(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    excerpt = models.TextField(blank=True, default='')
    content = models.TextField()
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class CMSAnnouncement(models.Model):
    BANNER_TYPES = [
        ('info', 'Information'),
        ('alert', 'Alert / Urgent'),
        ('success', 'Success / Offer'),
        ('promo', 'Special Announcement'),
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    badge = models.CharField(max_length=60, default='Announcement')
    link_url = models.CharField(max_length=255, blank=True, default='')
    banner_type = models.CharField(max_length=20, choices=BANNER_TYPES, default='info')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.banner_type}] {self.title}"


class CMSFaq(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('internships', 'Internships & Projects'),
        ('payment', 'Payment & Verification'),
        ('certificates', 'Certificates & Offers'),
    ]

    question = models.CharField(max_length=300)
    answer = models.TextField()
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default='general')
    order = models.PositiveIntegerField(default=1)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return self.question


class CMSSiteSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    label = models.CharField(max_length=150, blank=True, default='')
    description = models.CharField(max_length=255, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['key']

    def __str__(self):
        return self.key

