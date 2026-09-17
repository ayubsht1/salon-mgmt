# Serein Studio frontend

This is the Next.js app for the salon. Customers can browse services, create an
account, book appointments, and see their bookings. Staff have a separate page
for managing the schedule and service menu.

## You will need

- Node.js 20 or newer
- The Django backend running locally on port 8000

## Install

From this directory:

```powershell
npm install
```

By default, the app looks for the API at `http://localhost:8000/api`. To point it
somewhere else, add `.env.local` in this folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Run locally

```powershell
npm run dev
```

Then open `http://localhost:3000` in a browser.

## Pages in the app

| URL | Purpose | Access |
| --- | --- | --- |
| `/` | Home page and sign in/register | Public |
| `/services` | Browse available services | Public |
| `/appointments` | Book and view appointments | Signed-in customers |
| `/admin` | Manage services and appointment statuses | Staff users |

Production checks:

```powershell
npm run lint
npm run build
npm run start
```

## How it works

- The services page reads from `GET /api/services/`.
- Visitors can register and sign in from the top navigation.
- Signed-in customers can book an available service and view their appointments.
- Staff can open `/admin` to add services, hide or enable services, and update appointment statuses.
- The booking form uses the visitor's local time. It is converted to UTC before being sent to the API and converted back when displayed.
- The current access token and user details are kept in browser local storage.

## Useful folders

```text
app/
  page.tsx       Home page and authentication
  services/      Service browsing and staff service creation
  appointments/  Customer booking and appointment history
  admin/         Staff Studio portal
  lib/api.ts     Shared API client and session types
  globals.css    Responsive visual styles
  layout.tsx     Metadata and root layout
public/          Static assets
```

The backend must allow this app's origin through CORS. See `Backend/README.md`
for the API setup.
