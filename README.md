# Service Management

This repository contains the salon frontend and Django backend in one Git repository.

## Backend

```powershell
cd Backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API runs at `http://localhost:8000/api/`.

## Frontend

In a second terminal:

```powershell
cd Frontend\salon
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and uses the backend API at
`http://localhost:8000/api` by default.

See [Backend/README.md](Backend/README.md) and
[Frontend/salon/README.md](Frontend/salon/README.md) for app-specific details.
