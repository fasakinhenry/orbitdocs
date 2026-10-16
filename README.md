# OrbitDocs frontend

OrbitDocs is a document workspace for individuals, teams, and community
organizations. The app provides a focused personal workspace as well as
organization spaces where people can discover, join, and manage shared
knowledge.


> Check it out here: https://orbitdoc.vercel.app

The idea came as a result of community managers like me struggling to manage folder access for their documents and Google Drive does not give much control for member access per folders or other cool features like approval workflow, notifications, and more. OrbitDocs is a solution to that problem. 

It initially started as an internal tool for my community(FUTA Techies) so we can manage files across different volunteers teams like events and partnership team files, technical team files amongst others.

Now, organizations, community managers, startups, individuals and any form of enterprise can use OrbitDocs to manage their files and documents in a more organized way.

## Product experience

Users can:

- Start with a private personal workspace without having to create an
  organization.
- Create or join organizations through invitations, usernames, email, public
  discovery, or shareable join links.
- Upload, preview, download, star, search, sort, copy, move, and inspect files.
- Organize files into public or private folders.
- Use either a detailed list view or a responsive grid view, with the preferred
  default saved to their profile.
- Submit files for approval and remove their own pending submissions.
- Receive in-app notifications for invitations, membership activity, approvals,
  and other workspace events.
- Manage their profile, avatar, bio, social links, profile visibility, and
  organization memberships.

Organization owners and authorized managers can:

- Invite members by email or username, or create a join link.
- Approve public organization join requests.
- Assign organization administrators and manage members.
- Give selected members folder-level view, upload, edit, delete, or folder
  manager access.
- Keep private team folders hidden from members who do not have access.
- Review file approvals and deletion requests.

The interface is responsive for desktop and mobile use. Folder actions are
available through visible mobile controls, while desktop hover interactions
remain compact.

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

The active workspace is selected from the user's organization memberships.
Personal workspaces intentionally do not expose organization-management
controls such as member administration, join requests, or organization
settings.

## Admin dashboard

Sign in with the account registered under the backend's `ADMIN_EMAIL` and open **Admin dashboard** from the account menu (or go to `/admin`). It shows platform totals, storage by workspace, and lets you suspend or delete workspaces and users, set storage limits, close sign ups, and review an admin log. Anyone else sees a 404.

## Usernames and invites

Every account has a unique username and can sign in with email or username. Admins can invite by email, by @username, or by a shareable link from the People page.

## File views and limits

Files support a detailed list view and a card-based grid view. The selected
default can be changed in Profile settings. Lists load up to 2,000 files per
view and display 50 at a time before progressive loading.

PDF and common image previews are available in the application. Office-file
previews and frontend tests are not currently included.

> Built with 💖 by [Fasakin Henry](https://github.com/fasakinhenry)