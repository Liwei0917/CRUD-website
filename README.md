# CRUD Website — MERN Stack

A full-stack user management application built with the MERN stack, featuring JWT
authentication, role-based access control, and a user-management CRUD panel
designed to scale to **500,000+ user records**.

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (Bearer tokens) + bcrypt password hashing + role-based access

---

## Features

- 🔐 Register / Login with JWT authentication
- 🔑 Passwords hashed with bcrypt (never stored or returned in plaintext)
- 👥 Two roles — **user** and **admin** — with protected routes on both client and server
- 📊 **Dashboard** and **Profile** for all users
- 🛡️ **User Control** panel (admin only) with full CRUD, search, filtering and pagination
- 📱 Responsive UI (mobile → desktop) with a collapsible sidebar
- ✅ Server-side validation, centralized error handling, and rate-limited auth
- ⚡ MongoDB indexes + efficient pagination tuned for large datasets

---

## Project structure

```
CRUD website/
├── server/                 # Express API
│   ├── src/
│   │   ├── config/         # env + db connection
│   │   ├── models/         # Mongoose User model (+ indexes)
│   │   ├── middleware/     # auth, validation, error handling
│   │   ├── controllers/    # auth + user CRUD logic
│   │   ├── routes/         # /api/auth, /api/users
│   │   ├── utils/          # token, ApiError, asyncHandler
│   │   ├── app.js          # express app
│   │   ├── server.js       # bootstrap
│   │   └── seed.js         # admin + bulk demo data
│   ├── .env.example
│   └── package.json
└── client/                 # React app (Vite)
    ├── src/
    │   ├── api/            # axios client + user API
    │   ├── components/     # ui/, layout/, users/
    │   ├── context/        # AuthContext
    │   ├── hooks/          # useDebounce
    │   ├── pages/          # Login, Register, Dashboard, Profile, UserControl
    │   ├── routes/         # ProtectedRoute, PublicOnlyRoute
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    └── package.json
```

---

## Prerequisites

- Node.js **18+**
- A MongoDB instance — local (`mongodb://127.0.0.1:27017`) or MongoDB Atlas

---

## Getting started

### 1. Backend

```bash
cd server
cp .env.example .env      # then edit values (Windows: copy .env.example .env)
npm install
npm run seed              # creates the default admin + a few demo users
npm run dev               # starts API on http://localhost:5000
```

Default admin credentials (from `.env`):

```
email:    admin@example.com
password: Admin@12345
```

### 2. Frontend

```bash
cd client
cp .env.example .env      # optional; dev proxy works without it
npm install
npm run dev               # starts app on http://localhost:5173
```

Open http://localhost:5173 and sign in with the admin account above, or register
a new (regular user) account.

---

## Environment variables

### `server/.env`

| Variable              | Description                                        |
| --------------------- | -------------------------------------------------- |
| `PORT`                | API port (default 5000)                            |
| `NODE_ENV`            | `development` / `production`                       |
| `CLIENT_ORIGIN`       | Allowed CORS origin(s), comma-separated            |
| `MONGO_URI`           | MongoDB connection string                          |
| `JWT_SECRET`          | Secret for signing JWTs (**use a long random one**)|
| `JWT_EXPIRES_IN`      | Token lifetime, e.g. `7d`                           |
| `BCRYPT_SALT_ROUNDS`  | bcrypt cost factor (default 12)                    |
| `SEED_ADMIN_*`        | Default admin created by the seed script           |

### `client/.env`

| Variable            | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `VITE_API_BASE_URL` | API origin for production. Empty in dev (uses Vite proxy).   |

---

## API reference

Base URL: `/api`

### Auth

| Method | Endpoint         | Access  | Description                    |
| ------ | ---------------- | ------- | ------------------------------ |
| POST   | `/auth/register` | Public  | Register (creates a `user`)    |
| POST   | `/auth/login`    | Public  | Log in, returns `{ token }`    |
| GET    | `/auth/me`       | Auth    | Current user                   |
| PATCH  | `/auth/me`       | Auth    | Update own name/email/password |

### Users (admin only)

| Method | Endpoint        | Description                              |
| ------ | --------------- | ---------------------------------------- |
| GET    | `/users`        | Paginated list (`page,limit,search,role,sort,active`) |
| GET    | `/users/stats`  | Aggregate counts for the dashboard       |
| GET    | `/users/:id`    | Get one user                             |
| POST   | `/users`        | Create a user (can set role)             |
| PATCH  | `/users/:id`    | Update a user                            |
| DELETE | `/users/:id`    | Delete a user                            |

Send the JWT as `Authorization: Bearer <token>`.

---

## Scaling to 500,000+ users

The app is built to stay fast on a large `users` collection:

- **Indexes** (see [`server/src/models/User.js`](server/src/models/User.js)):
  - unique index on `email` (login + uniqueness)
  - text index on `name` + `email` for search
  - compound `{ role, createdAt }` for filtered, sorted pagination
  - `{ createdAt: -1 }` for the default newest-first listing
- **Search** uses a **prefix regex anchored with `^`** so it can leverage the
  indexes instead of scanning the whole collection.
- **Counting** uses `estimatedDocumentCount()` on the unfiltered listing (an
  O(1) metadata read) and only falls back to `countDocuments()` when filters are
  applied.
- **`.lean()`** is used for list queries to skip Mongoose document hydration.
- **`autoIndex`** is disabled in production so a restart doesn't trigger an
  expensive index rebuild; run `npm run seed` (which calls `syncIndexes()`) to
  create indexes ahead of time.

### Load-test with bulk data

```bash
cd server
npm run seed -- --users 500000    # batched insertMany, ~500k demo users
```

> Note on deep pagination: `skip/limit` is simple and fine for typical admin
> browsing. For jumping to very deep pages on huge datasets, a range/keyset
> query (`createdAt < lastSeen`) avoids `skip`'s linear cost — a natural next
> step if you expose deep page navigation.

---

## Security notes

- Passwords hashed with bcrypt; the `password` field is `select: false` and
  stripped from every JSON response.
- JWTs signed with a server secret; protected routes verify the token and reload
  the user on each request.
- Role checks are enforced **server-side** (`authorize('admin')`) — the client
  guards are for UX only.
- `helmet`, CORS allow-listing, request-size limits, and auth rate-limiting are
  enabled.
- Guardrails prevent deleting/demoting the last remaining admin or deleting your
  own account.

For production, consider moving the JWT to an httpOnly cookie to reduce XSS
token-theft risk, and serving the API over HTTPS.

---

## Production build

```bash
# Frontend
cd client && npm run build      # outputs to client/dist

# Backend
cd server && npm start          # NODE_ENV=production
```

Serve `client/dist` from any static host (or from Express) and point
`VITE_API_BASE_URL` at your deployed API.
