from rest_framework import permissions, viewsets

from .models import Appointment
from .permissions import IsStaff
from .serializers import AppointmentSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create"):
            return [permissions.IsAuthenticated()]
        return [IsStaff()]

    def get_queryset(self):
        queryset = Appointment.objects.select_related("service", "customer", "booked_by")
        if not self.request.user.is_staff:
            queryset = queryset.filter(customer=self.request.user)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        customer_id = self.request.data.get("customer")
        customer = self.request.user
        if self.request.user.is_staff and customer_id:
            from django.contrib.auth import get_user_model

            customer = get_user_model().objects.filter(id=customer_id).first() or self.request.user
        serializer.save(booked_by=self.request.user, customer=customer)

    def perform_update(self, serializer):
        serializer.save()
