from datetime import timedelta

from rest_framework import serializers

from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "customer",
            "customer_name",
            "customer_email",
            "customer_phone",
            "service",
            "service_name",
            "appointment_datetime",
            "status",
            "status_display",
            "booked_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "customer",
            "booked_by",
            "service_name",
            "status_display",
            "created_at",
            "updated_at",
        )

    def validate_service(self, value):
        if not value.is_available:
            raise serializers.ValidationError("This service is not available.")
        return value

    def validate(self, attrs):
        appointment_datetime = attrs.get(
            "appointment_datetime",
            self.instance.appointment_datetime if self.instance else None,
        )
        service = attrs.get("service", self.instance.service if self.instance else None)
        appointment_status = attrs.get(
            "status",
            self.instance.status if self.instance else Appointment.Status.PENDING,
        )

        if appointment_status in (Appointment.Status.CANCELLED, Appointment.Status.COMPLETED):
            return attrs

        appointment_end = appointment_datetime + timedelta(minutes=service.duration_minutes)
        existing_appointments = Appointment.objects.exclude(
            status__in=(Appointment.Status.CANCELLED, Appointment.Status.COMPLETED)
        ).select_related("service")

        if self.instance:
            existing_appointments = existing_appointments.exclude(pk=self.instance.pk)

        for existing in existing_appointments:
            existing_end = existing.appointment_datetime + timedelta(
                minutes=existing.service.duration_minutes
            )
            if (
                existing.appointment_datetime < appointment_end
                and existing_end > appointment_datetime
            ):
                raise serializers.ValidationError(
                    {
                        "appointment_datetime": (
                            "This appointment overlaps with an existing appointment."
                        )
                    }
                )

        return attrs
