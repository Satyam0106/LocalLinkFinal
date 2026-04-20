# Local Link

Local Link is a full-stack local marketplace app that connects customers with nearby vendors. Customers can browse vendors, search and filter listings, add products to a cart, place orders, chat with vendors inside the app, and call vendors directly. Vendors can manage products, review incoming requests and orders, and reply to customer chats from their dashboard.

## Features

- Customer and vendor authentication
- Hero-style landing page with navbar and autoplay video
- Customer vendor discovery with working search and category filtering
- Vendor profile pages with product listings
- Cart-based ordering with quantity support
- Service requests between customers and vendors
- Vendor accept, decline, cancel, and delete request flow
- In-app customer/vendor chat
- Direct vendor calling via saved phone number
- Vendor product create, edit, and delete flow

## Tech Stack

- Frontend: React, React Router, Vite
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT

## Project Structure

```text
LocalLink-Main-main/
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ utils/
│  │  ├─ app.js
│  │  └─ server.js
│  ├─ package.json
│  └─ .env.example
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ services/
│  │  └─ main.jsx
│  ├─ package.json
│  └─ .env.example
├─ LOCALINK_MVP_DOC.md
└─ README.md
```

## Setup

### 1. Install dependencies

From the project root:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### 2. Configure environment variables

Backend: create `backend/.env`

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/localink
JWT_SECRET=replace_me_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
```

Frontend: create `frontend/.env`

```env
VITE_API_URL=http://localhost:4000
```

## Run the App

Start the backend:

```powershell
cd backend
npm start
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm run dev
```

App URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

## Important Note About the Database

If MongoDB is not running locally, the backend falls back to an in-memory MongoDB instance using `mongodb-memory-server`. This is useful for development, but the data is temporary and resets when the backend restarts.

## User Flows

### Customer

- Sign up or log in
- Browse nearby vendors
- Use the top search bar and category dropdown to filter vendors
- Open a vendor page
- Add products to cart with quantities
- Send the cart as an order
- Send a service request
- Chat with the vendor inside the app
- Call the vendor directly
- Track request and order status

### Vendor

- Sign up or log in as a vendor
- Add phone, category, and location during signup
- Open the vendor dashboard
- View incoming service requests and orders
- Accept, decline, or delete pending requests
- Reply to customer chats
- Add, edit, and delete products

## Main Backend Routes

### Auth

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`

### Vendors and products

- `GET /vendors`
- `GET /vendor/:id`
- `GET /products/:vendorId`
- `POST /product`
- `PATCH /product/:id`
- `DELETE /product/:id`

### Requests and orders

- `GET /requests`
- `POST /request`
- `PUT /request/:id`
- `PATCH /request/:id`
- `DELETE /request/:id`

### Chat

- `GET /chats`
- `GET /chat/:otherUserId`
- `POST /chat/:otherUserId/messages`

## Frontend Pages

- `/auth` - landing page plus login/signup
- `/vendors` - customer home and vendor discovery
- `/vendor/:id` - vendor profile, cart, in-app chat, call option
- `/vendor/dashboard` - vendor requests, chat inbox, and product management

## Scripts

### Frontend

```powershell
npm run dev
npm run build
npm run preview
```

### Backend

```powershell
npm start
npm run dev
```

## Current Status

This repo already includes:

- Responsive landing page
- Working frontend and backend integration
- Built-in in-app chat
- Quantity-based cart ordering
- Role-based vendor/customer flows

## Documentation

There is an additional project note file here:

- [LOCALINK_MVP_DOC.md](./LOCALINK_MVP_DOC.md)

## License

No license has been added yet.
