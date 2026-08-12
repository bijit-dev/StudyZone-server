# StudyZone Server

Express backend for StudyZone with MongoDB, Firebase Admin authentication, and Stripe payments.

## Project Structure

```text
src/
  app.js                    Express app and route registration
  config/
    database.js             MongoDB client and collections
    env.js                  Environment config
    firebase.js             Firebase Admin setup
    stripe.js               Stripe client setup
  middlewares/
    auth.js                 Firebase token and role guards
  routes/
    bookings.routes.js
    materials.routes.js
    notes.routes.js
    payments.routes.js
    reviews.routes.js
    sessions.routes.js
    users.routes.js
index.js                    Local server bootstrap and Vercel handler
converKey.js                Firebase service key base64 helper
```

## Setup

```bash
npm install
```

Create `.env` from `.env.example` and fill in the real values.

## Run

```bash
npm run dev
```

Production start:

```bash
npm start
```

The API root responds at:

```text
GET /
```

## Vercel Deploy

Add these environment variables in Vercel Project Settings:

```text
MONGODB_URI
FB_SERVICE_KEY
STRIPE_SECRET_KEY
```

Optional fallback variables:

```text
DB_USER
DB_PASS
PORT
```

For MongoDB Atlas, allow Vercel serverless access in Network Access. During development or class projects, `0.0.0.0/0` is commonly used, but a tighter allowlist is better for production.
