# Serein Studio development notes

## Project layout

There are two applications in this repository:

- `Backend/`: Django 6.1 REST API with JWT authentication, SQLite by default, and the `main`, `services`, and `appointments` apps.
- `Frontend/salon/`: Next.js 16 App Router frontend for customers and staff.

## Running the project

Start the backend from `Backend/`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Start the frontend from `Frontend/salon/`:

```powershell
npm install
npm run dev
```

The frontend uses `http://localhost:8000/api` unless `NEXT_PUBLIC_API_URL` is set
in `Frontend/salon/.env.local`.

## Auth and permissions

- Authentication uses JWT access tokens from `POST /api/login/`.
- The login response includes the user and `is_staff` flag.
- Customer routes are `/services` and `/appointments`.
- The frontend staff portal is `/admin`.
- A Django superuser has `is_staff=True` and can use the frontend staff portal.
- Django admin at `/admin/` is kept for technical data work. The normal staff workflow is the frontend `/admin` page.

## API notes

- Use the shared frontend client in `Frontend/salon/app/lib/api.ts` for API requests.
- Include `Authorization: Bearer <access-token>` for protected requests.
- Public service reads return available services to customers; staff can see hidden services.
- Customer-created appointments must be associated with the authenticated customer in the backend.
- Appointment datetimes are stored by Django as timezone-aware UTC values. Convert browser-local `datetime-local` input to UTC before submission and format API values for the user's local timezone when displaying them.

## Frontend notes

- Keep customer booking and staff management on separate routes.
- Preserve loading, validation, success, and error states for API forms.
- Reuse shared types and API helpers instead of duplicating fetch logic.
- Keep staff-only controls hidden for non-staff users, but retain backend permission checks as the source of truth.
- Keep responsive behavior intact for desktop and mobile layouts.

## Checks before finishing

Frontend:

```powershell
cd Frontend\salon
npm.cmd run lint
npm.cmd run build
```

Backend, with the virtual environment active:

```powershell
cd Backend
python manage.py check
python manage.py test
```

Do not commit `.env` files, local databases, secrets, or access tokens. Keep
changes focused and leave unrelated user work alone.
