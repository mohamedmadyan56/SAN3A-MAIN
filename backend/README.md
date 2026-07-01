# San3a Backend 🛠️

**San3a** (صنعة) is a Node.js REST API for a smart home-services marketplace. It connects customers with nearby craftsmen using geospatial search and a weighted match-scoring algorithm, then manages the full request lifecycle from matching through completion.

Built with **Express 5**, **MongoDB**, **Mongoose 9**, and **Docker**.

---

## Features

- **JWT authentication** — Signup, login, role-based access (`customer`, `craftsman`, `admin`)
- **Password reset** — Email-based forgot/reset flow via Nodemailer
- **Service catalog** — List and create home services (with seed script)
- **Service requests** — Customers create orders with location, notes, and scheduling
- **Dynamic pricing** — Base fee (120) + emergency fee (30) for immediate requests
- **Geospatial discovery** — Find nearby craftsmen with `$geoNear` (configurable radius)
- **Smart match scoring** — Rank craftsmen by distance (40%), rating (30%), response time (20%), and client history (10%)
- **Craftsman response tracking** — Accept/reject flows with running average response time
- **Request lifecycle** — Status tracking from `PENDING_MATCHING` through `COMPLETED`
- **Docker support** — Multi-stage production image + docker-compose with MongoDB

---

## Tech Stack

| Technology | Version |
|------------|---------|
| Node.js | >= 16 |
| Express | ^5.2.1 |
| MongoDB / Mongoose | ^9.6.3 |
| jsonwebtoken | ^9.0.3 |
| bcryptjs | ^3.0.3 |
| nodemailer | ^6.10.1 |
| cors | ^2.8.6 |
| dotenv | ^17.4.2 |
| validator | ^13.15.35 |

---

## Installation

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and email credentials
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `PORT` | No | Server port (default: `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `FRONTEND_URL` | No | CORS origin (default: `http://localhost:3000`) |
| `EMAIL_HOST` | For password reset | SMTP host |
| `EMAIL_PORT` | For password reset | SMTP port (default: `587`) |
| `EMAIL_USERNAME` | For password reset | SMTP username |
| `EMAIL_PASSWORD` | For password reset | SMTP password |

See `.env.example` for the full template.

---

## Running Locally

### Development (with auto-reload)

```bash
npm run dev
```

### Production

```bash
npm start
# or
npm run start:prod
```

### Seed services

```bash
node seed.js
```

Seeds: Cleaning, AC, Plumbing, Electricity.

### Docker

```bash
# Set MONGO_URI, JWT_SECRET, etc. in .env first
docker compose up --build
```

- API: `http://localhost:5000`
- MongoDB: `localhost:27017`

---

## API Overview

**Base URL:** `http://localhost:5000/api/v1`

### Authentication — `/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/signup` | No | Register |
| POST | `/users/login` | No | Login → JWT |
| POST | `/users/forgotPassword` | No | Send reset email |
| POST | `/users/resetPassword/:token` | No | Reset password |
| GET | `/users/profile` | Yes | Get profile |
| GET | `/users/admin-dashboard` | Admin | Admin test route |
| GET | `/users/craftsman-orders` | Craftsman | Craftsman test route |

### Services — `/services`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/services/` | No | List active services |
| POST | `/services/` | No | Create service |

### Requests — `/requests`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/requests/` | Yes | Create request |
| GET | `/requests/:id` | Yes | Get request |
| GET | `/requests/:requestId/nearby-craftsmen` | Yes | Nearby craftsmen (`?radius=` meters) |
| GET | `/requests/:requestId/match-results` | Yes | Ranked match scores (`?radius=` meters) |
| POST | `/requests/:requestId/accept` | Yes | Craftsman accepts |
| POST | `/requests/:requestId/reject` | Yes | Craftsman rejects |
| PATCH | `/requests/:requestId/status` | Yes | Update status |
| PATCH | `/requests/:requestId/complete` | Yes | Complete request |

### Auth Header

```
Authorization: Bearer <your_jwt_token>
```

---

## Folder Structure

```
backend/
├── server.js              # Entry point, DB connection
├── app.js                 # Express app setup
├── seed.js                # Service catalog seeder
├── Dockerfile             # Production container
├── docker-compose.yml     # MongoDB + backend
├── package.json
├── .env.example
├── SAN3A_BACKEND_DOCUMENTATION.md
└── src/
    ├── controllers/
    │   ├── authController.js
    │   ├── requestController.js
    │   └── serviceController.js
    ├── models/
    │   ├── userModel.js
    │   ├── requestModel.js
    │   └── serviceModel.js
    ├── routes/
    │   ├── userRoutes.js
    │   ├── requestRoutes.js
    │   └── serviceRoutes.js
    └── utils/
        └── email.js
```

---

## Match Scoring

Craftsmen are ranked using a weighted formula:

| Factor | Weight |
|--------|--------|
| Distance | 40% |
| Rating | 30% |
| Avg response time | 20% |
| Prior jobs with same client | 10% |

Endpoint: `GET /api/v1/requests/:requestId/match-results`

---

## Documentation

Full technical documentation (architecture, database schemas, auth flows, security review, deployment):

**[SAN3A_BACKEND_DOCUMENTATION.md](./SAN3A_BACKEND_DOCUMENTATION.md)**

---

## Known Limitations

- Password reset handler incomplete (no success response on reset)
- No review/rating submission API (rating field exists on User model)
- No payment gateway integration
- No notifications or real-time updates
- No logout endpoint (client-side token removal)
- No automated tests

---

## Future Improvements

- [ ] Complete password reset flow with JWT response
- [ ] Review and rating system after job completion
- [ ] Payment gateway integration
- [ ] Real-time request updates (WebSocket)
- [ ] Global error handler and middleware folder refactor
- [ ] Protect service creation with admin role
- [ ] Request ownership authorization on GET
- [ ] Automated tests (Jest + Supertest)
- [ ] Rate limiting and Helmet security headers
- [ ] Add `"seed": "node seed.js"` npm script

---

## Author

**Mohamed Madyan**  
Graduation Project — San3a Home Services Platform

---

## License

ISC
