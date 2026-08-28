# Volunteer Hub

A community volunteering platform where organizers post events ("missions") and volunteers sign up with one click. Built as a single-page React app on Firebase, with a cyberpunk black-and-neon theme.

## Features

- **Browse events** — public listing of upcoming volunteer events, no account needed
- **Date filter & auto-expire** — filter events by date; past events are hidden automatically
- **Accounts** — email/password sign-up, login, and password reset (Firebase Auth)
- **Post a mission** — organizers create events with a date, location, capacity, and an optional registration link (Google Form / Zoom)
- **One-click registration** — volunteers register for an event; full events close automatically
- **My Events** — see everything you've registered for

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 7 |
| Backend | Firebase (Cloud Firestore + Authentication) |
| Icons | lucide-react |
| Hosting | Vercel (frontend), Firebase (data/auth) |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Firebase project](https://console.firebase.google.com/) with:
  - **Authentication** → Email/Password sign-in enabled
  - **Cloud Firestore** database created

### Setup

1. Clone and install:

   ```bash
   git clone https://github.com/varshakodi/volunteer-hub.git
   cd volunteer-hub
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Fill in `.env.local` with your Firebase web app config (Firebase Console → Project settings → General → Your apps). `.env.local` is git-ignored — never commit it.

3. Deploy the Firestore security rules (required — see [Security](#security)):

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Security

This app talks to Firestore directly from the browser, so **the Firestore security rules in [`firestore.rules`](firestore.rules) are the real security boundary** — every check the UI performs is enforced again server-side. The rules ensure that:

- Events are publicly readable, but only signed-in users can create them (and only as themselves)
- Event data must match a strict schema (field types, lengths, `http(s)://`-only links)
- Non-owners can only add *their own* user ID to an event's volunteer list, once, and never past capacity
- Only an event's creator can edit or delete it

If you change the rules, redeploy them with `firebase deploy --only firestore:rules` or paste them into Firebase Console → Firestore Database → Rules.

A few notes:

- The `VITE_*` values in `.env.local` are Firebase **web app identifiers**, not secrets — they ship to every browser in the JS bundle. Real protection comes from the security rules above. Still, keep `.env.local` out of git and consider [restricting the API key](https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions) and enabling [App Check](https://firebase.google.com/docs/app-check).
- Event registration links are validated to `http://`/`https://` both when posting and when rendering, to block `javascript:`-style link injection.

## Deployment

The frontend deploys to [Vercel](https://vercel.com/): import the repo and add the six `VITE_*` variables from `.env.example` in Project Settings → Environment Variables. Firestore rules deploy separately via the Firebase CLI (step 3 above).

## Project Structure

```
├── src/
│   ├── App.jsx        # All pages and app logic (home, events, post, my events, auth)
│   ├── firebase.js    # Firebase initialization (reads config from env)
│   ├── index.css      # Global styles / theme
│   └── main.jsx       # Entry point
├── firestore.rules    # Firestore security rules (deploy to Firebase)
├── firebase.json      # Firebase CLI config
└── .env.example       # Template for required environment variables
```
