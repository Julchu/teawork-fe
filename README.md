# TeaWork

Find nice environments to grab tea and work at.

Map-first Next.js app: browse places on Mapbox, sign in with Google to save preferences and locations (same session pattern as Pricey).

# Setup

### NodeJS, `npm`, `pnpm`

- You'll need to download [NodeJS](https://nodejs.org/en/) and add `npm` (Node Package Manager) to PATH so that
  you can run commands to download packages used to create React projects.

- The main package you'll need is a separate package manager called `pnpm`, which functions similarly (like a super
  layer) to `npm`

### Why `pnpm`

- `pnpm` installs packages locally in a global way, and symlinks across projects
- `pnpm` installs packages in parallel rather than one-by-one, like `npm` does

### Git

- You'll need [git](https://git-scm.com/downloads) installed to copy the project into your local directory

### Environment files

- You'll need a copy of `.env.example` as your development environment, as well as a production environment when
  deploying to live

```zsh
# From teawork-fe/
cp .env.example .env.development
# cp .env.example .env.production   # when deploying
```

Required for local dev (see `.env.example`):

- `TEAWORK_BACKEND_URL` — Express API (default `http://localhost:8001`)
- `TEAWORK_BASE_URL` / `NEXT_PUBLIC_TEAWORK_BASE_URL` — frontend origin (default `http://localhost:8000`)
- `ACCESS_TOKEN_KEY` / `REFRESH_TOKEN_KEY` — cookie names (must match teawork-be)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_REDIRECT_URIS` — Google OAuth (`http://localhost:8000/api/login/google`)
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox GL
- `MASTER_KEY` — optional dev-only bypass when no session cookie (must match backend if used)

Run the frontend on **port 8000** so the Google redirect URI matches.

### Cloning and installing the app

```zsh
# From your Projects directory
cd teawork/teawork-fe

pnpm install
pnpm dev
```

Dev server: [http://localhost:8000](http://localhost:8000) (Turbopack).

Start **teawork-be** on port 8001 before testing sign-in or `/user` prefetch.

### Prettier (format on save)

- In VSCode, install the extension Prettier
- Go to your VSCode JSON settings:
    - Command Palette -> Preferences: Open Settings (JSON)
- Add the following code to the JSON object
- Whenever you save a file, it'll run automatic formatting based on rules in `/.prettierrc` (add one when you wire Prettier for this app)

```json
// settings.json
{
  ...
  "editor.tabSize": 2,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  ...
}
```

- I also use file autosave whenever I switch to a different page/window, mimicking Webstorm

```json
{
  "files.autoSave": "onFocusChange"
}
```

## Testing

We're using ESLint to test for basic JavaScript and TypeScript errors

You can run `lint` and `type-check` to check for basic project syntax errors

```zsh
# In teawork-fe/
pnpm lint
pnpm type-check
```

Deploying app to test Google Auth on mobile, with `ngrok`

- ```
  npm install -g ngrok
  # Create ngrok account
  ngrok config add-authtoken <AuthToken>
  https://dashboard.ngrok.com/get-started/your-authtoken
  ngrok http 8000
  ```

Register the ngrok HTTPS origin + `/api/login/google` on the Google OAuth client and update env vars accordingly.

# Notes

Projects can be split into

- Front-end: React, Angular, Vue
- Back-end: NodeJS, "servers", Firebase
- Database: Firestore, MongoDB, Postgres

Front-end: how things look from a user's standpoint, or how data is displayed

Back-end: how data is sent to front-end, or how data is saved to database

Database: where data is stored, or locations of non-string data (like files) that are kept in storage

## Understanding React/NextJS

Building React apps involves turning web pages into components (kinda like an HTML Iframe)

Similar but opposite to PHP, where it's HTML structure with in-line code, React is code to structure HTML

Imagine a Discord text-channel as a website: it can be split into multiple pieces:

- Left side bar to view available servers
- Left-mid area to view available channels
- Main chat box w/ text input
- Right side bar to view available users

Each area can be a component, that can be a group of smaller components, which can be a group of smaller individual
components/HTML elements

Sometimes data must be able to appear in multiple components, or be manipulated within specific components and appear in
other components.

Data can be passed downwards to children pretty easily through `props`, tho cycling them back up and/or across is not as
easy.

If you understand `getters` and `setters`, we can also pass down `setter` functions that'll manipulate the
top-level `state` data that is also being passed down to other neighbouring child components

TeaWork uses **Zustand** stores created inside React context providers (see `src/providers/` and `src/stores/`) — same pattern as Pricey, not global singleton stores.

## NextJS layout (App Router)

### `/src/components`

- UI and map components (`map-box/`, `auth/`, etc.)

### `/src/app`

- `page.tsx` — home (full-screen map)
- `layout.tsx` — root layout + `Providers`
- `api/(auth)/` — thin proxies to teawork-be (login, logout, Google callback)

### `/src/proxy.ts`

- Session refresh before routes render (Next.js 16 proxy; same role as Pricey’s refresh middleware)

### `/package.json`

- Project information, node module dependencies, etc...
- Scripts: commands and aliases to run commands
    - Ex: `type-check` runs `tsc` when you call `pnpm type-check`
- Dependencies: `pnpm add <packageName>`
- Dev Dependencies: `pnpm add <packageName> -D`

Types or Interfaces?

- Interface for public API's definition when authoring a library or 3rd party ambient type definitions, as this allows a
  consumer to extend them via declaration merging if some definitions are missing.

- Type for your React Component Props and State, for consistency and because it is more constrained.

  > https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/basic_type_example/#types-or-interfaces

- Use Interface until You Need Type
  > https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces

Shared domain types: `src/utils/interfaces.ts`.
