# ForensicVault – Digital Forensics Evidence Management

Django + DRF + PostgreSQL backend, Next.js (App Router, TypeScript, Tailwind, Recharts) frontend.

## Quick start (Docker)
```bash
cp .env.example .env        # edit secrets
docker compose up --build
docker compose exec backend python manage.py seed_demo   # demo users/case (password: ChangeMe!2026 – change it!)
```
Frontend http://localhost:3000 · API http://localhost:8000/api · Swagger http://localhost:8000/api/docs/

## Local dev
```bash
cd backend && pip install -r requirements.txt
export DJANGO_DEBUG=1 DB_ENGINE=sqlite      # or configure POSTGRES_* and omit DB_ENGINE
python manage.py migrate && python manage.py seed_demo && python manage.py runserver
python manage.py test tests                 # 8 tests: auth, RBAC, upload validation, SHA-256, mismatch, missing, custody, audit, PDF
cd ../frontend && npm install && npm run dev
```
Demo logins: `admin`, `investigator`, `reviewer`.  libmagic (`apt install libmagic1`) enables MIME sniffing; without it only the extension allow-list applies.

## Design notes
- Evidence lives in `backend/media_private/` under random names; only served through permission-checked `/evidence/{id}/download/`.
- SHA-256 is computed server-side while streaming the upload; the original hash row (`EvidenceHash`) is immutable. Each verification adds a new immutable `HashVerification` row (VERIFIED / INTEGRITY_MISMATCH / FILE_MISSING).
- `CustodyEvent` and `AuditLog` refuse update/delete at the model layer and are read-only in the API. Custody entries are *recorded* events, not proof of real-world possession (shown in UI and PDF).
- Reports are versioned PDFs with a non-admissibility disclaimer; reviewers approve/reject.
