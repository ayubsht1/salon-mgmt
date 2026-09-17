from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "customer_name",
        "service",
        "appointment_datetime",
        "status",
        "booked_by",
    )
    list_filter = ("status", "service")
    search_fields = ("customer_name", "customer_email", "customer_phone")
