# Serein Studio API

This folder contains the Django API used by the salon app. It handles accounts,
services, and appointments.

## Before you start

- Python 3.12 or newer
- A virtual environment

## Set up the API

From the `Backend` directory:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

SQLite is used by default, so no separate database server is needed for local
development. The database file is `db.sqlite3`. Apply migrations:

```powershell
python manage.py migrate
```

Create the first administrator:

```powershell
python manage.py createsuperuser
```

This creates a Django superuser. A superuser has `is_staff=True`, so the same
account can sign in to the frontend Studio portal at
`http://localhost:3000/admin` and manage services and appointments.

The Django admin at `http://localhost:8000/admin/` is still available when you
need to inspect or edit data directly.

For local frontend development, create `Backend/.env`:

```env
DEBUG=True
CORS_ALLOW_ALL_ORIGINS=True
```

This setting is convenient locally. In production, allow only the actual
frontend domain instead of enabling every origin.

## Start it

```powershell
python manage.py runserver
```

The API runs at `http://localhost:8000/api/`. The customer app runs at
`http://localhost:3000`, and the staff page is at `http://localhost:3000/admin`.

## Endpoints

### Authentication

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/register/` | Public |
| POST | `/api/login/` | Public |
| POST | `/api/logout/` | Authenticated |
| POST | `/api/token/refresh/` | Public |
| POST | `/api/token/verify/` | Public |

Login returns an access token and refresh token. Send the access token on protected requests:

```text
Authorization: Bearer <access-token>
```

### Services

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/services/` | Public; available services only |
| GET | `/api/services/<id>/` | Public; available services only |
| POST | `/api/services/` | Staff |
| PUT/PATCH | `/api/services/<id>/` | Staff |
| DELETE | `/api/services/<id>/` | Staff |

Service fields are `name`, `description`, `price`, `duration_minutes`, and `is_available`.

### Appointments

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/appointments/` | Authenticated; customers see their own appointments |
| GET | `/api/appointments/<id>/` | Authenticated |
| POST | `/api/appointments/` | Authenticated |
| PUT/PATCH/DELETE | `/api/appointments/<id>/` | Staff |

Customers create an appointment with a service ID, ISO datetime, and customer name:

```json
{
  "service": 1,
  "appointment_datetime": "2026-09-20T14:00:00Z",
  "customer_name": "Alex Customer",
  "customer_email": "alex@example.com"
}
```

Appointments start with `pending` status. Staff can manage them from the frontend
Studio portal or through the API. Django admin is a fallback for technical administration.

## Django apps

```text
main/          Custom user model and JWT authentication
services/      Salon service model and API
appointments/ Appointment model and API
core/          Django project configuration and URL routing
```

## Checks

```powershell
python manage.py check
python manage.py test
```