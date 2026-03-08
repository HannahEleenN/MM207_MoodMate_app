# MoodMate App - MM207: Interactive Emotion Journal
*Individual university assignment for the course MM207 - UiA Grimstad, Norway.*

MoodMate is a Progressive Web App (PWA) designed for children (ages 6-7) to identify, log, and resolve emotions.

**Note on Language:** Technical documentation and code are in English. The client interface is in Norwegian to accommodate the target audience.

---

![MVC pattern](https://github.com/user-attachments/assets/7ef2653b-22a0-4015-a073-a5297a755ee7)

The project follows a strict MVC pattern to ensure a clean separation between the Norwegian UI (View), the English business logic (Controller), and the PostgreSQL data layer (Model).

---

## Project Management
The project is managed using GitHub Projects. Detailed work items and task progress can be found here:
[MoodMate Project Board](https://github.com/users/HannahEleenN/projects/3/views/1)

---

## Deployment & Persistence
The application is fully deployed in a production environment:
* **Live Web Service:** [https://moodmate-server-81ta.onrender.com](https://moodmate-server-81ta.onrender.com)
* **Database:** Externally hosted PostgreSQL on Render.
* **Persistence:** Data remains intact even if the server restarts or crashes.

---

## Technologies Used
* **Frontend:** HTML5, CSS3, JavaScript (ES modules)
* **Backend:** Node.js with Express
* **Database:** PostgreSQL (Hosted on Render)
* **Security:** JSON Web Tokens (JWT) for session management and bcrypt for password hashing.

---

## Database Architecture
The project uses a relational database to ensure data integrity and persistence:
* `users`: Stores unique nicknames, hashed secrets, roles, and consent status.
* `mood_logs`: Stores mood data linked to individual users via Foreign Keys with timestamps.

> **Architecture Reflection:** Thanks to the layered architecture (Controllers → Services → Models), the storage layer is decoupled from the business logic. Swapping the PostgreSQL database for a CSV file would only require modifying the Model files, leaving the API and Controllers untouched.

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

## Scaffolding & Folder Structure

### /server
```
/server
├── server_app.mjs                # Main entry point (Express)
├── messages.mjs                  # Centralized server message keys
├── routes/
│   ├── mood_routes.mjs           # Mood-related endpoints (protected)
│   ├── user_routes.mjs           # User registration/login/CRUD endpoints
│   └── child_routes.mjs          # Child profile & child-login endpoints
├── controllers/
│   ├── mood_api_handler.mjs      # HTTP handlers for moods
│   ├── user_api_handler.mjs      # HTTP handlers for user flows
│   ├── child_api_handler.mjs     # Child create/login/get handlers
│   └── user_service.mjs          # Domain/service logic used by handlers
├── models/
│   ├── mood_server_model.mjs     # DB functions for mood logs
│   ├── user_server_model.mjs     # DB functions for users (create/find/update/delete)
│   └── child_server_model.mjs    # Child profiles model (pin hashing/verification)
├── utils/
│   └── auth_crypto.mjs           # Hashing & verification helpers (bcrypt wrapper)
├── middleware/
│   └── privacyGuard.mjs          # JWT-based privacy/ownership enforcement
└── database/
    ├── db.mjs                    # Postgres connection pool (uses DATABASE_URL)
    └── moodmate_db.sql           # Database schema / functions (reference)
```

### /client
```
/client
├── index.html                    # SPA shell; markup-only, mounts `#app-root`
├── style.css                     # All styles and focus/accessibility rules
├── manifest.json                 # PWA manifest (icons, start_url, display)
├── app.mjs                       # App bootstrap, router, and event wiring
├── service_worker.js             # Service worker (caching strategies and offline)
├── serviceWorkerSetup.mjs        # SW registration helper (dev/production flags)
├── offline.html                  # Offline fallback page
├── assets/
│   ├── icons/                    # App icons and flag placeholders (flag-nb/en/sv)
│   └── images/                   # Images used by views
└── modules/
    ├── api.mjs                   # Centralized ApiService (single fetch wrapper)
    ├── singleton.mjs             # Global store, universalFetch, i18n helpers, applyTranslations
    ├── bootstrap.mjs             # Small runtime helpers (dev API base, suppression)
    ├── controllers/
    │   ├── userController.mjs    # Registration/login/user management UI logic
    │   ├── child_controller.mjs  # Child mood check-in flow controller
    │   ├── parent_controller.mjs # Parent dashboard controller
    │   └── mood_ui_controller.mjs# Insights & data visualization
    ├── models/
    │   ├── user_client_model.mjs # Client user helpers
    │   └── mood_client_model.mjs # Client mood helpers (placeholder)
    ├── translations/
    │   ├── no.json               # Norwegian translations (keys)
    │   ├── en.json               # English translations (keys)
    │   └── sv.json               # Swedish translations (keys)
    └── views/
        ├── login.html            # Login view
        ├── userManager.html      # Registration + user CRUD view
        ├── childMenu.html        # Child mood menu view
        ├── moodCheckin.html      # Mood check-in flow view
        ├── childProfiles.html    # Child profile management view
        ├── insights.html         # Parent insights view
        ├── privacyPolicy.html    # Privacy policy (modal content)
        ├── termsOfService.html   # Terms of Service (modal content)
        └── notFound.html         # 404 / not found view
```

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

### 3. Environment Variables
Create a `.env` file in the `/server` folder:
```bash
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_secret_key
PORT=3000
```

### Service Worker in Development
By default the setup unregisters service workers on localhost. To test locally:
```js
// Enable
window.__ENABLE_SW__ = true; location.reload();

// Disable
window.__DISABLE_SW__ = true; location.reload();
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

- Norwegian (nb)
- English (en)
- Swedish (sv)
- Spanish (es)
- Danish (da)

### File Structure

The translation files the client loads at runtime live under `client/translations/` and each locale is a simple JSON file named after the language code (for example `no.json`, `en.json`, `sv.json`, `es.json`, `da.json`). The language-switcher uses a small manifest at `client/assets/flags/flags.json` to render flag buttons and to instruct the service worker which flag SVGs to cache for offline use.

Example minimal file layout (relevant parts):

```
client/
├── translations/
│   ├── no.json      # Norwegian
│   ├── en.json      # English
│   ├── sv.json      # Swedish
│   ├── es.json      # Spanish
│   └── da.json      # Danish
└── assets/
    └── flags/
        ├── no.svg
        ├── gb.svg
        ├── se.svg
        ├── es.svg
        ├── dk.svg
        ├── MoodMate_Favicon.svg
        └── flags.json  # manifest used by the app and SW
```

To add or update a language, add a JSON file in `client/translations/` and an entry in `client/assets/flags/flags.json` that points to the flag SVG file (see the Languages & Flags subsection below).

### Adding a New Language

To add a new language to the app, follow these steps:

1. Create a new JSON file in `client/translations/` using the ISO language code as the filename (e.g., `es.json` for Spanish). Copy the same keys as `no.json` and translate the values — the files should have the same keys and similar line structure so diffs are easy to review.
2. Add the flag SVG file to `client/assets/flags/` (for example `es.svg` or `dk.svg`). Keep file names short and lowercase.
3. Add or update an entry in `client/assets/flags/flags.json`. Each entry should include a language `code`, a `title` (human readable), the `file` path relative to the client root, and the `locale` used by the app. Example:

```json
{ "code": "es", "title": "Español", "file": "assets/flags/es.svg", "locale": "es" }
```

4. Ensure the new translation file is present in `client/translations/` and contains the same keys as `no.json` (see note below).
5. Update `client/manifest.json` (if you use the favicon or add icons) and `client/service_worker.js` so the new flag and any SVG icons are added to the cache list. The service worker is tolerant to missing files but keeping `flags.json` accurate ensures offline availability.
6. Reload the app (or clear site data) and click the new flag — the UI should switch languages.

Notes on translation file consistency:
- Use `no.json` as the canonical key source. Every translation file (e.g., `en.json`, `sv.json`, `es.json`, `da.json`) must contain the exact same keys as `no.json` (same number of lines where possible) — only the values should be translated. This makes runtime replacement reliable and reduces missing key bugs.
- Keep JSON files readable: use 2-space indentation, place each key/value pair on its own line, and avoid trailing commas.

### Language Switcher & Flags

The language switcher (flags) used by the app is data-driven and reads `client/assets/flags/flags.json` to build the UI. This keeps the HTML markup static and lets you add/remove languages by editing a single manifest.

- Flag SVGs must be stored under `client/assets/flags/`.
- `flags.json` is the single source of truth for available languages.
- The service worker reads `flags.json` at install time and attempts to cache any `file` paths listed there for offline use.

Example `flags.json` structure (array of entries):

```json
[
  { "code": "no", "title": "Norsk", "file": "assets/flags/no.svg", "locale": "no" },
  { "code": "en", "title": "English", "file": "assets/flags/gb.svg", "locale": "en" },
  { "code": "sv", "title": "Svenska", "file": "assets/flags/se.svg", "locale": "sv" },
  { "code": "es", "title": "Español", "file": "assets/flags/es.svg", "locale": "es" },
  { "code": "da", "title": "Dansk", "file": "assets/flags/dk.svg", "locale": "da" }
]
```

Notes and best practices:
- Keep flag SVGs small and optimized (prefer SVG with embedded shapes, not linked external images). In Illustrator, save SVGs with images embedded rather than linked so files remain portable across machines.
- The app includes `MoodMate_Favicon.svg` in `client/assets/icons/` (and the service worker/manifest should reference it). Ensure `manifest.json` lists the icon paths you want the browser to use for install.

**Server**
- `server/utils/i18n.mjs` provides a `pickLocale(acceptLanguageHeader)` function supporting `en | nb | sv`.
- API test:
```bash
  curl -H "Accept-Language: en" http://localhost:3000/api/moods
```

---

## Accessibility

- Skip-to-content link in `index.html`.
- Visible keyboard focus styling in `client/style.css`.
- Modal ARIA attributes and focus-trap behavior when opening/closing legal dialogs.
- Interactive elements include ARIA roles (e.g. mood options marked as a `radiogroup`).

**Target:** Lighthouse accessibility score ≥ 90.

---

## Language Switcher & Flags

Language switcher (flags) is located in the top-right of the app. Place flag images in `client/assets/icons/`:
- `flag-nb.png`
- `flag-en.png`
- `flag-sv.png`

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
    - Language switcher (top-right) changes UI text across all three languages.
    - You can register a user, accept ToS (required), and log in.
    - You can edit and delete users in the user manager.
3. API tests: import `tests/moodmate_api_tests.json` into Postman, run registration → login → protected requests.
4. PWA: DevTools → Application → Manifest (installability), Service Workers (lifecycle), Network → Offline (fallback).
5. Accessibility: run Lighthouse (Accessibility only) and fix flagged items.

---

## Key Files for Code Review

| File | What it shows |
|:---|:---|
| `server/routes/user_routes.mjs` + `server/controllers/user_api_handler.mjs` | API scaffold and endpoint structure |
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
