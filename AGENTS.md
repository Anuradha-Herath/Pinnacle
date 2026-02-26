# Agents

## Cursor Cloud specific instructions

### Overview

Pinnacle is a single Next.js 15 (App Router) e-commerce application with React 19, TypeScript, Tailwind CSS, and MongoDB. There are no separate backend services — all API routes live under `app/api/`.

### Services

| Service | How to run | Port |
|---|---|---|
| Next.js dev server | `npm run dev` | 3000 |
| MongoDB | `mongod --dbpath /data/db --logpath /data/db/mongod.log --bind_ip 127.0.0.1 --port 27017 &` | 27017 |

MongoDB must be running before the dev server starts. Wait ~3 seconds after launching `mongod` for it to be ready.

### Environment variables

A `.env.local` file is required. At minimum:

```
MONGODB_URI=mongodb://localhost:27017/pinnacle
JWT_SECRET=dev-secret-key-for-local-development
NEXTAUTH_SECRET=dev-nextauth-secret-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
```

The Stripe placeholder is needed because the Stripe client initializes at module load time (`lib/stripe.ts`). Without it, `npm run build` and certain API routes will crash.

### Commands

- **Lint:** `npm run lint` (ESLint is configured to ignore all files, so this always passes)
- **Build:** `npm run build`
- **Dev:** `npm run dev`
- **Dev (Turbopack):** `npm run dev:turbo`

### Gotchas

- The signup API requires `firstName`, `lastName`, `email`, `password` (not `name`).
- Product detail pages are at `/product/[id]` — `/product` alone returns 404.
- External services (Cloudinary, Gemini AI, Google OAuth, Gmail SMTP) are optional. The app starts and core pages render without them; only their specific features degrade.
