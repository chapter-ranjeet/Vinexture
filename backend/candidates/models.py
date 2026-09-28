from django.conf import settings
from django.db import models


class CandidateProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='candidate_profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True)
    qualification = models.CharField(max_length=150, blank=True)
    college_university = models.CharField(max_length=200, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=50, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    course = models.CharField(max_length=150, blank=True)
    specialization = models.CharField(max_length=150, blank=True)
    semester_year = models.CharField(max_length=50, blank=True)
    graduation_year = models.CharField(max_length=20, blank=True)
    cgpa = models.CharField(max_length=30, blank=True)
    technical_skills = models.TextField(blank=True)
    other_skills = models.TextField(blank=True)
    projects = models.TextField(blank=True)
    experience = models.TextField(blank=True)
    certifications = models.TextField(blank=True)
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    preferred_mode = models.CharField(max_length=30, blank=True, default='remote')
    availability = models.CharField(max_length=100, blank=True, default='Immediate')
    headline = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.email
