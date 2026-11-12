# Bazaarly — Full-Stack E-Commerce (Amazon-Style)

Django REST API + Supabase PostgreSQL backend, plain HTML/CSS/JavaScript frontend.

## Folder Structure

```text
bazaarly-fullstack/
├── backend/
│   ├── bazaarly/       Django settings, URLs
│   ├── store/          Products, orders, seed command
│   ├── accounts/       Registration, login, JWT authentication
│   ├── manage.py
│   ├── requirements.txt
│   └── .env            Database and application configuration
└── frontend/
    ├── index.html
    ├── CSS files
    └── JavaScript files
```

## 1. Set Up Supabase PostgreSQL

1. Create a project at [Supabase](https://supabase.com/).
2. Open **Connect** in your Supabase project and get the PostgreSQL connection details.
3. Configure the database credentials in `backend/.env`.

Example `.env` configuration:

```env
DB_HOST=your-supabase-pooler-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=your-supabase-database-user
DB_PASSWORD=your-database-password

JWT_SECRET=your-secret-key
DEBUG=True
```

Replace the example values with your actual configuration. Keep `.env` private and never commit it to GitHub.

## 2. Backend Setup

Open the VS Code terminal and run:

```bat
cd backend
py -m venv venv
venv\Scripts\activate
py -m pip install -r requirements.txt
```

Check the Django configuration:

```bat
py manage.py check
```

Create and apply database migrations:

```bat
py manage.py makemigrations accounts store
py manage.py migrate
```

Add the demo products to PostgreSQL:

```bat
py manage.py seed_products
```

Start the Django development server:

```bat
py manage.py runserver
```

The backend runs at:

http://127.0.0.1:8000

Test the products API:

http://127.0.0.1:8000/api/products/

The endpoint should return product data in JSON format.

## 3. Frontend Setup

1. Open the `frontend` folder in VS Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html` and select **Open with Live Server**.
4. Check that the API base URL in your frontend API file points to the Django backend:

```javascript
const API_BASE = "http://127.0.0.1:8000/api";
```

## What's Implemented

- Products are stored in Supabase PostgreSQL and served through the Django REST API.
- Registration and login use JWT authentication.
- Passwords are hashed before being stored in the database.
- Authenticated users can place orders.
- Order prices are checked against database values on the server.
- Orders and order items are stored in PostgreSQL and associated with the logged-in customer.
- Cart data is stored in browser `localStorage` until checkout.

## Recommended Improvements

- Complete and test the My Orders page using `GET /api/orders/mine/`.
- Add password reset and email verification.
- Restrict `CORS_ALLOW_ALL_ORIGINS` before deployment.
- Use secure environment variables and `DEBUG=False` in production.
- Deploy the Django backend and frontend separately, for example on Render/Railway and Netlify/Vercel.
- Confirm that all MongoDB imports, dependencies, configuration variables, and database calls have been removed.

**Note:** This migration configures PostgreSQL for new application data. Existing MongoDB users and orders are not automatically transferred; migrate them separately if you need to preserve them.
