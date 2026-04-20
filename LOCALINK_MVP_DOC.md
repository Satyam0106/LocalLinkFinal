# Localink MVP — Functional Documentation

This document describes the **exact functionality implemented** in this MVP across **backend** (Node/Express/MongoDB) and **frontend** (React).

---

## 1) What this MVP does (high level)

Localink connects **customers** with **nearby vendors**.

- **Customer can**
  - Signup / login
  - Browse vendors (discovery)
  - Open a vendor profile
  - View vendor products
  - Create a **service request** to a vendor

- **Vendor can**
  - Signup / login
  - View incoming requests
  - Accept a request (status changes to `accepted`)
  - Add products (visible on vendor profile)

---

## 2) End-to-end flow (must work)

1. Customer logs in
2. Customer views vendors (`GET /vendors`)
3. Customer opens vendor profile (`GET /vendor/:id`) + products (`GET /products/:vendorId`)
4. Customer creates request (`POST /request`) → status `pending`
5. Vendor logs in
6. Vendor views requests (`GET /requests`) → sees incoming requests for them
7. Vendor accepts request (`PUT /request/:id`) → status becomes `accepted`
8. Re-accepting the same request returns **409 conflict** (“already accepted”)

---

## 3) Backend

### 3.1 Folder structure

`backend/`

- `src/config/`
  - `env.js`: reads environment variables
  - `db.js`: MongoDB connection (Mongoose)
- `src/models/`
  - `User.js`
  - `Product.js`
  - `Request.js`
- `src/controllers/`
  - `authController.js`
  - `vendorController.js`
  - `productController.js`
  - `requestController.js`
- `src/routes/`
  - `authRoutes.js`
  - `vendorRoutes.js`
  - `productRoutes.js`
  - `requestRoutes.js`
- `src/middleware/`
  - `auth.js`: JWT auth + role gating
- `src/utils/`
  - `http.js`: consistent API error shape
- `src/app.js`: Express app wiring (middleware + routes)
- `src/server.js`: start server + connect DB

### 3.2 Environment variables

Backend reads these (see `backend/.env.example`):

- `PORT` (default `4000`)
- `MONGODB_URI` (default `mongodb://127.0.0.1:27017/localink`)
- `JWT_SECRET` (default `dev_secret_change_me`, you should set it)
- `CLIENT_ORIGIN` (default `http://localhost:5173`) used for CORS

### 3.3 Data models (MongoDB / Mongoose)

#### User (`backend/src/models/User.js`)

- **Common fields**
  - `name` (required)
  - `email` (required, unique)
  - `passwordHash` (required)
  - `role` (required): `customer` | `vendor`

- **Vendor profile fields** (used when role = vendor)
  - `category` (string)
  - `rating` (number, default 4.5)
  - `location` (string)

#### Product (`backend/src/models/Product.js`)

- `name` (required)
- `price` (required, number)
- `description` (optional)
- `vendorId` (required, ObjectId -> User)

#### Request (`backend/src/models/Request.js`)

- `customerId` (required, ObjectId -> User)
- `vendorId` (required, ObjectId -> User)
- `type` (enum): only `"service"` is supported in this MVP
- `status` (enum): `"pending"` | `"accepted"`

### 3.4 Authentication + Authorization

- Auth is **JWT** based:
  - Server returns a `token` on signup/login
  - Frontend stores token in localStorage
  - Authenticated requests send header:
    - `Authorization: Bearer <token>`

- Role checks:
  - Customer-only: `POST /request`
  - Vendor-only: `POST /product`, `PUT /request/:id`
  - Both roles can call: `GET /requests` (scoped results)

### 3.5 APIs (implemented endpoints)

Base: `http://localhost:4000`

#### Health
- `GET /health`
  - Response: `{ "ok": true }`

#### Auth
- `POST /auth/signup`
  - Body (customer):
    - `{ name, email, password, role: "customer", location? }`
  - Body (vendor):
    - `{ name, email, password, role: "vendor", category, location }`
  - Response:
    - `{ token, user }`

- `POST /auth/login`
  - Body: `{ email, password }`
  - Response: `{ token, user }`

- `GET /auth/me` (auth required)
  - Response: `{ user }`

#### Vendor Discovery
- `GET /vendors`
  - Response:
    - `{ vendors: [{ id, name, category, rating, location }] }`

#### Vendor Profile
- `GET /vendor/:id`
  - Response:
    - `{ vendor: { id, name, category, rating, location } }`

#### Products
- `GET /products/:vendorId`
  - Response:
    - `{ products: [{ id, name, price, description, vendorId }] }`

- `POST /product` (auth required + vendor role)
  - Body: `{ name, price, description? }`
  - Vendor is derived from the token (`req.user`)
  - Response:
    - `{ product: { id, name, price, description, vendorId } }`

#### Requests (core flow)
- `POST /request` (auth required + customer role)
  - Body: `{ vendorId, type: "service" }`
  - Creates request with `status: "pending"`
  - Response:
    - `{ request: { id, customerId, vendorId, type, status, createdAt } }`

- `GET /requests` (auth required)
  - If role is **vendor**: returns requests where `vendorId = current user`
  - If role is **customer**: returns requests where `customerId = current user`
  - Response includes populated summaries:
    - `{ requests: [{ id, type, status, createdAt, customer, vendor }] }`

- `PUT /request/:id` (auth required + vendor role)
  - Accepts a request **only if**
    - request exists
    - request belongs to this vendor
    - request is not already accepted
  - If already accepted → **409**
  - Response:
    - `{ request: { id, customerId, vendorId, type, status, updatedAt } }`

### 3.6 Error handling format

Errors are returned as:

```json
{
  "error": {
    "message": "Human readable message",
    "details": { }
  }
}
```

---

## 4) Frontend

### 4.1 Folder structure

`frontend/`

- `src/app/`
  - `App.jsx`: routes + protected layout
  - `auth/`
    - `AuthContext.jsx`: login/signup/logout state
    - `storage.js`: localStorage persistence
- `src/pages/`
  - `AuthPage.jsx`
  - `CustomerHomePage.jsx`
  - `VendorProfilePage.jsx`
  - `VendorDashboardPage.jsx`
- `src/components/`
  - `Layout.jsx`: header + navigation + logout
  - `Field.jsx`: small form field helper
- `src/services/`
  - `api.js`: fetch wrapper + consistent error throwing
- `src/styles.css`: minimal clean styling

### 4.2 Environment variables

Frontend reads (see `frontend/.env.example`):

- `VITE_API_URL` (default `http://localhost:4000`)

### 4.3 Pages and behavior

#### `AuthPage` (`/auth`)

- Provides **Login** and **Signup**
- Signup supports roles:
  - `customer` (name/email/password; location optional)
  - `vendor` (name/email/password + **category + location required**)

On success:
- token + user stored locally
- user is redirected to their default home

#### Customer Home (`/vendors`)

- Fetches vendors from `GET /vendors`
- Shows vendor cards (name, category, rating, location)
- Clicking a vendor navigates to `/vendor/:id`

#### Vendor Profile (`/vendor/:id`)

Loads:
- `GET /vendor/:id` (vendor details)
- `GET /products/:vendorId` (vendor products)

Customer action:
- “Request Service” → calls `POST /request`

#### Vendor Dashboard (`/vendor/dashboard`)

Loads:
- `GET /requests` (vendor-scoped incoming requests)

Actions:
- Accept pending request → `PUT /request/:id`
  - After accept, list refreshes and status updates
- Add product → `POST /product`

### 4.4 Role-based navigation

After login:
- Vendor is routed to `/vendor/dashboard`
- Customer is routed to `/vendors`

---

## 5) What is intentionally NOT included (by design)

To keep the MVP minimal and aligned with requirements, this MVP does **not** include:

- Payments
- Chat
- Order tracking beyond request accept
- Admin panel
- Advanced search/filtering
- Image uploads

---

## 6) How to run

See `README.md` for the full run instructions.

