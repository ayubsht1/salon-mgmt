from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from services.models import Service

from .models import Appointment


class AppointmentApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.staff = user_model.objects.create_user(
            email="staff@example.com",
            password="strong-password",
            username="staff",
            first_name="Salon",
            last_name="Staff",
            phone="1234567890",
            is_staff=True,
        )
        self.customer = user_model.objects.create_user(
            email="customer@example.com",
            password="strong-password",
            username="customer",
            first_name="Regular",
            last_name="Customer",
            phone="1234567891",
        )
        self.other_customer = user_model.objects.create_user(
            email="other@example.com",
            password="strong-password",
            username="other",
            first_name="Other",
            last_name="Customer",
            phone="1234567892",
        )
        self.service = Service.objects.create(
            name="Haircut",
            description="Classic haircut",
            price=Decimal("25.00"),
            duration_minutes=30,
        )
        self.url = "/api/appointments/"

    def appointment_payload(self):
        return {
            "customer": self.customer.id,
            "customer_name": "Regular Customer",
            "customer_email": self.customer.email,
            "customer_phone": self.customer.phone,
            "service": self.service.id,
            "appointment_datetime": (timezone.now() + timedelta(days=1)).isoformat(),
        }

    def test_staff_can_book_and_manage_appointment(self):
        self.client.force_authenticate(user=self.staff)

        create_response = self.client.post(self.url, self.appointment_payload(), format="json")

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        appointment_id = create_response.data["id"]
        self.assertEqual(create_response.data["status"], Appointment.Status.PENDING)
        self.assertEqual(create_response.data["service_name"], "Haircut")

        filter_response = self.client.get(f"{self.url}?status=pending")
        self.assertEqual(filter_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filter_response.data), 1)

        update_response = self.client.patch(
            f"{self.url}{appointment_id}/",
            {"status": Appointment.Status.CONFIRMED},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["status"], Appointment.Status.CONFIRMED)

        delete_response = self.client.delete(f"{self.url}{appointment_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Appointment.objects.filter(id=appointment_id).exists())

    def test_regular_user_can_only_view_own_appointments(self):
        own_appointment = Appointment.objects.create(
            customer=self.customer,
            customer_name="Regular Customer",
            service=self.service,
            appointment_datetime=timezone.now() + timedelta(days=1),
            booked_by=self.staff,
        )
        Appointment.objects.create(
            customer=self.other_customer,
            customer_name="Other Customer",
            service=self.service,
            appointment_datetime=timezone.now() + timedelta(days=2),
            booked_by=self.staff,
        )
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [own_appointment.id])

    def test_regular_user_can_book_but_cannot_delete_appointments(self):
        self.client.force_authenticate(user=self.customer)

        create_response = self.client.post(self.url, self.appointment_payload(), format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        appointment_id = create_response.data["id"]
        delete_response = self.client.delete(f"{self.url}{appointment_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_overlapping_active_appointments_are_rejected(self):
        self.client.force_authenticate(user=self.staff)
        start = timezone.now() + timedelta(days=3)
        first_payload = self.appointment_payload()
        first_payload["appointment_datetime"] = start.isoformat()
        first_response = self.client.post(self.url, first_payload, format="json")
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

        overlapping_payload = self.appointment_payload()
        overlapping_payload["appointment_datetime"] = (
            start + timedelta(minutes=15)
        ).isoformat()
        response = self.client.post(self.url, overlapping_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("appointment_datetime", response.data)

    def test_back_to_back_appointments_are_allowed(self):
        self.client.force_authenticate(user=self.staff)
        start = timezone.now() + timedelta(days=4)
        first_payload = self.appointment_payload()
        first_payload["appointment_datetime"] = start.isoformat()
        first_response = self.client.post(self.url, first_payload, format="json")
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

        next_payload = self.appointment_payload()
        next_payload["appointment_datetime"] = (
            start + timedelta(minutes=self.service.duration_minutes)
        ).isoformat()
        response = self.client.post(self.url, next_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
