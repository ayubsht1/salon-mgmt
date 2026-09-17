from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Service


class ServiceApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="owner@example.com",
            password="strong-password",
            username="owner",
            first_name="Salon",
            last_name="Owner",
            phone="1234567890",
            is_active=True,
        )
        self.staff = get_user_model().objects.create_user(
            email="staff@example.com",
            password="strong-password",
            username="staff",
            first_name="Salon",
            last_name="Staff",
            phone="1234567891",
            is_active=True,
            is_staff=True,
        )
        self.service = Service.objects.create(
            name="Haircut",
            description="Classic haircut",
            price=Decimal("25.00"),
            duration_minutes=30,
        )

    def test_list_returns_available_services_only(self):
        Service.objects.create(
            name="Unavailable",
            price=Decimal("10.00"),
            duration_minutes=15,
            is_available=False,
        )

        response = self.client.get("/api/services/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Haircut")

    def test_staff_user_can_create_update_and_delete_service(self):
        self.client.force_authenticate(user=self.staff)
        payload = {
            "name": "Coloring",
            "description": "Full color treatment",
            "price": "80.00",
            "duration_minutes": 90,
        }

        create_response = self.client.post("/api/services/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        service_id = create_response.data["id"]

        update_response = self.client.patch(
            f"/api/services/{service_id}/",
            {"price": "85.00"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["price"], "85.00")

        delete_response = self.client.delete(f"/api/services/{service_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Service.objects.filter(id=service_id).exists())

    def test_regular_user_cannot_mutate_services(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/services/",
            {
                "name": "Massage",
                "price": "45.00",
                "duration_minutes": 45,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_mutate_services(self):
        response = self.client.post(
            "/api/services/",
            {
                "name": "Massage",
                "price": "45.00",
                "duration_minutes": 45,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
