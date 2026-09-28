from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('reference', 'application', 'amount', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('reference', 'application__user__email')
