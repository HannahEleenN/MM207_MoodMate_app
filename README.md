# MoodMate App - MM207: Interactive Emotion Journal
*Individual university assignment for the course MM207 - UiA Grimstad, Norway.*

MoodMate is a Progressive Web App (PWA) designed for children (ages 6-7) to identify, log, and resolve emotions.

**Note on Language:** Technical documentation and code are in English. The client interface is in Norwegian to accommodate the target audience.

---

![MVC pattern](https://github.com/user-attachments/assets/7ef2653b-22a0-4015-a073-a5297a755ee7)

The project follows a strict MVC pattern to ensure a clean separation between the Norwegian UI (View), the English business logic (Controller), and the PostgreSQL data layer (Model).

---

## Table of Contents
- Introduction
- Feature Map
- Technologies Used
- Architecture & Database
- Scaffolding & Folder Structure
  - /server
  - /client
- Deployment & Persistence
- Local Installation & Quick Start
- PWA & Offline Support
- Security & Privacy Guard
- Internationalization (I18n)
- Accessibility
- Testing & Lighthouse
- Assignment Checklist
- Quick Manual Verification
- Key Files for Code Review
- Developer Notes

---

## Feature Map
The following table outlines the core features for the Minimum Viable Product (MVP).

| Priority | Pri 1: Core Loop (Mood) | Pri 2: Context & Solution | Pri 3: Persistence & PWA | Pri 4: User Accounts |
|:---|:---|:---|:---|:---|
| *Main Feature* | **Interactive Logging** | **Contextualizing** | **Cloud & PWA** | **Access Control** |
| *Sub-features* | Visual mood icon selection for children | Linking emotions to activities and solutions | External data storage and offline support | Role-based login (Child/Parent) |
| *Requirement* | REST API & Mood Controller | Coping strategy suggestions | PostgreSQL (Render) & Service Worker | JWT Auth & PrivacyGuard Middleware |
| *Status* | *Critical MVP* | *Value Add* | *Infrastructure* | *Security* |

---

## Technologies Used
* **Frontend:** HTML5, CSS3, JavaScript (ES modules)
* **Backend:** Node.js with Express
* **Database:** PostgreSQL (Hosted on Render)
* **Security:** JSON Web Tokens (JWT) for session management and bcrypt for password hashing.

---

## Architecture & Database
The project uses a layered MVC-style architecture which keeps controllers, services/domain logic, and models (DB layer) separated. This allows easy testing and the possibility to swap storage implementations without touching the API/controller code.

### Database
* `users`: Stores unique nicknames, hashed secrets, roles, and consent status.
* `mood_logs`: Stores mood data linked to individual users via Foreign Keys with timestamps.

> **Architecture Reflection:** Thanks to the layered architecture (Controllers → Services → Models), the storage layer is decoupled from the business logic. Swapping the PostgreSQL database for a CSV file would only require modifying the Model files, leaving the API and Controllers untouched.

---

### Project layout (concise)

- `server/` — Backend (Express + Postgres)
  - `server_app.mjs` — Express app entry (routes & middleware)
  - `database/db.mjs` — Postgres pool (uses `DATABASE_URL`)
  - `middleware/privacyGuard.mjs` — JWT / ownership enforcement
  - `routes/` — Route registrations (e.g., `parent_routes.mjs`, `mood_routes.mjs`)
  - `controllers/` — HTTP handlers (e.g., `user_api_handler.mjs`, `mood_api_handler.mjs`)
  - `models/` — DB access (e.g., `user_server_model.mjs`, `mood_server_model.mjs`)

- `client/` — Frontend (PWA, i18n)
  - `index.html` — SPA shell; mounts `#app-root`
  - `app.mjs` — App bootstrap, router, event wiring
  - `style.css` — Global styles & accessibility rules
  - `service_worker.js` — PWA caching & offline fallback
  - `manifest.json` — PWA manifest (icons, `start_url`)
  - `translations/` — Locale files (e.g., `en.json`, `no.json`)
  - `assets/flags/flags.json` — Locale manifest used by language switcher
  - `modules/` — Core client modules (e.g., `api.mjs`, `singleton.mjs`)

- `tests/` — API & integration test collections (Insomnia export)

---

## Deployment & Persistence
The application is fully deployed in a production environment:
* **Live Web Service:** [https://moodmate-server-81ta.onrender.com](https://moodmate-server-81ta.onrender.com)
* **Database:** Externally hosted PostgreSQL on Render.
* **Persistence:** Data remains intact even if the server restarts or crashes.

---

## Local Installation & Quick Start

### 1. Install and start the server
```powershell
cd server
npm install
npm start
```

### 2. Open the app in your browser
```
http://localhost:3000
```

### Service Worker in Development
By default the setup unregisters service workers on localhost. To test locally:
```js
// Enable
globalThis.__ENABLE_SW__ = true; location.reload();

// Disable
globalThis.__DISABLE_SW__ = true; location.reload();
```

---

## PWA & Offline Support

- Robust service worker (`client/service_worker.js`) with cache versioning, activation/cleanup, offline fallback (`client/offline.html`), and runtime caching strategies.
- `client/serviceWorkerSetup.mjs` registers the service worker in production and allows explicit enable/disable for development.
- `manifest.json` provides icons and a sensible `start_url` so browsers can consider the app installable.

**How to test:**
1. Open the app in Chrome/Edge.
2. DevTools → Application → Manifest — check installability state.
3. DevTools → Application → Service Workers — verify registration and watch lifecycle events.
4. Install the app if prompted.
5. DevTools → Network → set Offline and reload; cached pages or `offline.html` should be served.

---

## Security & Privacy Guard

MoodMate uses a custom middleware as a security gatekeeper, ensuring every request is verified for **Identity, Role, and Ownership** before any data is processed.

- **Middleware:** `server/middleware/privacyGuard.mjs`
- **Auth Logic:** `server/utils/auth_crypto.mjs`

The middleware validates the JWT and enforces role-based permissions: children are restricted to their own data; parents can view family data but cannot modify a child's original entries.

---

## Internationalization (I18n)

This document provides an overview of the internationalization (I18n) implementation in the app, including supported languages, file structure, and how to add new languages.

### Supported Languages
The app currently supports the following languages (minimum 2 required by assignment; five provided for convenience):

- Norwegian (no)
- English (en)
- Swedish (sv)
- Spanish (es)
- Danish (da)

## Language switcher & flags

The client ships with a simple language switcher that uses flag SVGs from `client/assets/flags/` and a small manifest file `client/assets/flags/flags.json` which lists available locales. Below are concise, practical steps to add a new language/flag and wire it into the app.

1) Add the flag image
- Place a small SVG (recommended 24×24 or 32×32) into `client/assets/flags/` and name it with the two-letter locale code (e.g. `es.svg` for Spanish). Use lightweight SVGs to keep the asset size small.

2) Update the `flags.json` manifest
- Edit `client/assets/flags/flags.json` to add an entry for the new locale. The manifest is an array of objects with these properties: `code` (locale code), `label` (human readable name), and `file` (file name of the SVG).
- Example manifest entry (JSON):

  {
    "code": "es",
    "label": "Español",
    "file": "es.svg"
  }

- Keep the `code` value consistent with the translation file name in `client/translations/` (for example `es.json`). The client reads this manifest to render the language picker.

3) Add a flag button in the UI
- Add a focusable button in a header or toolbar (for example in `index.html` or a shared header view). A minimal accessible example:

  <button class="lang-btn" data-lang="es" aria-label="Switch to Spanish">
    <img src="/client/assets/flags/es.svg" alt="Español" width="24" height="24">
  </button>

- Use a real `<button>` (not a div) and include an `aria-label` and a descriptive `alt` on the image for screen readers.

4) Wire the button to the i18n loader
- The app exposes a translation loader/locale setter in `client/modules/singleton.mjs` (or via `bootstrap.mjs`). Hook your button's click handler to call the existing API rather than reimplementing the loader. Conceptually:

  // on click of .lang-btn
  const targetLocale = evt.currentTarget.dataset.lang;
  store.setLocale(targetLocale); // or call the project's applyTranslations/loader function

- If your app caches the chosen locale (localStorage), the existing `singleton` should already handle persistence; otherwise persist the value so the choice survives reloads.

5) Add the translation file
- Create or update `client/translations/<code>.json` (for example `client/translations/es.json`) using the same keys used by other locales. The legal copy for `privacy.*` and `terms.*` lives in these files too.

6) Accessibility & keyboard support
- Ensure the language buttons are reachable by Tab and operable with Enter/Space. If you use a grouped control, apply ARIA attributes (for example `role="radiogroup"` and `aria-checked`) for better assistive technology support.

7) Service Worker and caching
- If the service worker precaches assets, add the new SVG and `flags.json` to the precache list or bump the cache version so the new asset is available offline.

8) Testing
- After wiring, verify the UI updates immediately and the language selection persists (if supported). Manually inspect the `privacyPolicy` and `termsOfService` views to ensure the localized legal copy loads from `client/translations/*.json`.

## Troubleshooting
- 404 on the image: confirm the path `/client/assets/flags/<file>` exists and the `file` field in `flags.json` matches exactly.
- Missing translations: ensure `client/translations/<code>.json` exists and is valid JSON.
- Server-side messages: if the server reads `client/translations/en.json` at runtime (see `server/messages.mjs`), make sure the process can read the file.

---

## Accessibility

- Skip-to-content link in `index.html`.
- Visible keyboard focus styling in `client/style.css`.
- Modal ARIA attributes and focus-trap behavior when opening/closing legal dialogs.
- Interactive elements include ARIA roles (e.g. mood options marked as a `radiogroup`).

**Target:** Lighthouse accessibility score ≥ 90.

---

## Testing & Lighthouse

```powershell
npx lighthouse http://localhost:3000 --only-categories=accessibility --emulated-form-factor=mobile --output=json --output-path=lh-accessibility.json
```

Import `tests/moodmate_api_tests.json` into Postman or Insomnia and run against your local or deployed server. Update the environment URL and Authorization token where needed.

---

## Assignment Checklist

| Requirement | Status | Files / Notes |
|:---|:---|:---|
| Select app idea and feature map | ✅ Done | Feature Map section in this README; project board linked above |
| Document project and plan | ✅ Done | This README (all sections) |
| Client: scaffold, MVC separation, single fetch pattern | ✅ Done | `client/app.mjs`, `client/modules/api.mjs`, `client/modules/singleton.mjs`, controllers |
| Server: REST API, routes, controllers | ✅ Done | `server/server_app.mjs`, `server/routes/*.mjs`, `server/controllers/*.mjs` |
| User accounts (create, delete, consent + ToS/Privacy) | ✅ Done | `userController.mjs`, `user_api_handler.mjs`, `user_service.mjs`, `user_server_model.mjs` |
| Persistent cloud storage (PostgreSQL on Render) | ✅ Done | `server/database/db.mjs`, `server/models/*.mjs` — set `DATABASE_URL` in Render env vars |
| REST API scaffold & documentation | ✅ Done | `server/routes/*.mjs`, `client/modules/api.mjs`, Postman collection |
| Middleware (meaningful, not logging) | ✅ Done | `server/middleware/privacyGuard.mjs` — JWT identity/role enforcement |
| Client web component for user CRUD | ✅ Done | `user-manager` element in `client/app.mjs`, `userManager.html`, `userController.mjs` |
| PWA & offline support | ✅ Done | `client/manifest.json`, `client/service_worker.js`, `client/serviceWorkerSetup.mjs` |
| Accessibility (WCAG/ARIA) | 🔄 In progress | Skip link, focus styles, ARIA roles added — run Lighthouse and fix until score ≥ 90 |
| Project management & repository | ✅ Done | GitHub Project board linked above |
| Tests & test tools | ✅ Done | `tests/moodmate_api_tests.json` — import into Postman/Insomnia |

---

## Quick Manual Verification

1. Start the server:
```powershell
   cd server
   npm install
   npm start
```
2. Open `http://localhost:3000` and verify:
    - Language switcher (top-right) changes UI text across supported languages.
    - You can register a user, accept ToS (required), and log in.
    - You can edit and delete users in the user manager.
3. API tests: import `tests/moodmate_api_tests.json` into Postman, run registration → login → protected requests.
4. PWA: DevTools → Application → Manifest (installability), Service Workers (lifecycle), Network → Offline (fallback).
5. Accessibility: run Lighthouse (Accessibility only) and fix flagged items.

---

## Key Files for Code Review

| File | What it shows |
|:---|:---|
| `server/routes/parent_routes.mjs` + `server/controllers/user_api_handler.mjs` | API scaffold and endpoint structure |
| `server/middleware/privacyGuard.mjs` | Meaningful middleware (JWT + role enforcement) |
| `client/modules/api.mjs` + `client/modules/singleton.mjs` | Single-fetch pattern and i18n loader |
| `client/modules/controllers/userController.mjs` + `views/userManager.html` | Client CRUD and consent flow |
| `client/service_worker.js` + `client/manifest.json` | PWA evidence |
| `tests/moodmate_api_tests.json` | API test collection |

---

## Developer Notes

- Keep `index.html` strictly markup-only. All runtime code lives in `app.mjs` and `client/modules/`.
- Use `data-i18n` attributes in views for translatable strings; use `store.t('key')` when building strings in JS.
- To add new UI text: add the key to all translation files (`client/translations/*.json`) and reference it with `data-i18n` or `store.t(key)`.

This folder contains shared request/response handlers that are registered at the Express app level.

When to extract logic into a shared handler

- Cross-cutting concerns: request logging, CORS headers, authentication/token verification, rate-limiting, request size limiting, request body sanitization, request/response metrics.
- When the same code is used in multiple routes or when the code affects many endpoints and is not part of a single route's core business logic.
- When a piece of code needs to be tested independently (unit tests) or configured differently for environments.

What goes in this folder

- Small, focused handlers that accept (req, res, next) and either terminate the request by sending a response or call next() to continue.
- Handlers that return a function (factory) when configuration is required, e.g., rateLimiter({ windowMs, max }).

Examples in this project

- `cors.mjs` — Adds permissive CORS headers and handles preflight OPTIONS requests. Useful during development when the client runs on a different origin.
- `logger.mjs` — Logs basic API request information. Keeps the server_app file concise and makes logging behavior configurable or replaceable.
- `privacyGuard.mjs` — Verifies a JSON Web Token and normalizes the decoded payload onto `req.user` so downstream route handlers can rely on a single shape.

Naming guidance

- Name files by what they are (not "middleware"). For example: `logger.mjs`, `cors.mjs`, `privacyGuard.mjs`, `rateLimiter.mjs`.
- Export the handler as a default function when it is a single responsibility, or export factories/helpers as named exports when appropriate.

Documentation

- Keep small usage notes here. For larger handlers, include a short code example in the module file or add tests.

Registering handlers

- Register general handlers early in `server_app.mjs` (e.g., CORS, logging) so they run before route handlers.
- Register authentication/authorization closer to the routes that need them or mount them on specific route paths (e.g., `app.use('/api/users', privacyGuard, userRoutes)`).

Security note

- Avoid echoing sensitive information in logs (passwords, full auth tokens).
- Keep token secrets out of the repo and load them from environment variables.