# Bazaarly — full-stack e-commerce (Amazon-style)

Django REST API + MongoDB backend, plain HTML/CSS/JS frontend.

## Folder structure

```
bazaarly-fullstack/
├── backend/       Django + PyMongo REST API
│   ├── bazaarly/  project settings, urls, mongo connection
│   ├── store/     products + orders endpoints, seed command
│   └── accounts/  register/login (JWT auth)
└── frontend/      plain HTML/CSS/JS, calls the API with fetch
```

## 1. Set up MongoDB

Easiest option: create a free cluster at mongodb.com/cloud/atlas and copy
the connection string. Or install MongoDB locally and use
`mongodb://localhost:27017`.

## 2. Backend setup (VS Code terminal)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

copy .env.example .env       # Windows
cp .env.example .env         # Mac/Linux
# now edit .env and paste your MONGO_URI

python manage.py seed_products
python manage.py runserver
```

Backend runs at http://localhost:8000 — test it by opening
http://localhost:8000/api/products/ in a browser, you should see JSON.

## 3. Frontend setup

Open the `frontend` folder in VS Code, install the "Live Server"
extension, right-click `index.html` → "Open with Live Server".

If your backend runs on a different host/port, update `API_BASE` at the
top of `frontend/js/api.js`.

## What's real here

- Products are stored in MongoDB and served through a real REST API
- Register/login issue a JWT token, stored in the browser and sent with
  every order request
- Placing an order re-checks prices against the database (never trusts
  the frontend) and saves the order in MongoDB, tied to the logged-in user
- Cart state lives in the browser (localStorage) until checkout, which
  is standard practice for guest-friendly carts

## Good next steps

- Add `GET /api/orders/mine/` to a proper "My orders" page
- Hash-check email format, add password reset
- Move `CORS_ALLOW_ALL_ORIGINS` to a specific origin before deploying
- Deploy backend (Railway/Render) + frontend (Netlify/Vercel) separately
