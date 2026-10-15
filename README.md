# OrbitDocs frontend

React 19, Vite, TypeScript, Tailwind v4, Phosphor icons.

## Run it

Start the backend first (see `../backend/README.md`), then:

```bash
bun install
cp .env.example .env   # only needed if the API is not on http://localhost:5000/api
bun run dev
```

## Build and deploy

```bash
bun run build
```

Deploy the `frontend/` folder to Vercel (framework preset: Vite) and set `VITE_API_URL` to your Render API URL, for example `https://orbitdocs-api.onrender.com/api`. Set the backend's `CLIENT_URL` to your Vercel URL.

## How it talks to the API

Everything goes through `src/lib/api.ts`. It keeps the access token in memory, restores the session from the httpOnly refresh cookie on load, and refetches the active organization after every change. The UI hides actions the member's role cannot perform, and the server enforces the same rules.

## Admin dashboard

Sign in with the account registered under the backend's `ADMIN_EMAIL` and open **Admin dashboard** from the account menu (or go to `/admin`). It shows platform totals, storage by workspace, and lets you suspend or delete workspaces and users, set storage limits, close sign ups, and review an admin log. Anyone else sees a 404.

## Usernames and invites

Every account has a unique username and can sign in with email or username. Admins can invite by email, by @username, or by a shareable link from the People page.

## Not built yet

Previews for Office files, and frontend tests. Lists load up to 2,000 files per view and the table shows 50 at a time.
