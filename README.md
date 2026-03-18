# MoodMate App - MM207: Interactive Emotion Journal
*Individual university assignment for the course MM207 - UiA Grimstad, Norway.*

MoodMate is a Progressive Web App (PWA) designed for children (ages 6–7) to identify, log, and resolve emotions.

**Note on Language:** Technical documentation and code are in English. The client interface is in Norwegian to accommodate the target audience.

---

![MVC pattern](https://github.com/user-attachments/assets/7ef2653b-22a0-4015-a073-a5297a755ee7)

The project follows a strict MVC pattern to ensure a clean separation between the Norwegian UI (View), the English business logic (Controller), and the PostgreSQL data layer (Model).

---

## Table of Contents
- [Feature Map](#feature-map)
- [Technologies Used](#technologies-used)
- [Architecture & Database](#architecture--database)
- [Project Layout](#project-layout)
- [Deployment & Persistence](#deployment--persistence)
- [Local Installation & Quick Start](#local-installation--quick-start)
- [PWA & Offline Support](#pwa--offline-support)
- [Security & Privacy Guard](#security--privacy-guard)
- [Internationalization (I18n)](#internationalization-i18n)
- [Accessibility](#accessibility)
- [Testing & Lighthouse](#testing--lighthouse)
- [Assignment Checklist](#assignment-checklist)
- [Key Files for Code Review](#key-files-for-code-review)

---

## Feature Map

| Priority       | Pri 1: Core Loop (Mood)                 | Pri 2: Context & Solution                    | Pri 3: Persistence & PWA                  | Pri 4: User Accounts               |
|:---------------|:----------------------------------------|:---------------------------------------------|:------------------------------------------|:-----------------------------------|
| *Main Feature* | **Interactive Logging**                 | **Contextualizing**                          | **Cloud & PWA**                           | **Access Control**                 |
| *Sub-features* | Visual mood icon selection for children | Linking emotions to activities and solutions | External data storage and offline support | Role-based login (Child/Parent)    |
| *Requirement*  | REST API & Mood Controller              | Coping strategy suggestions                  | PostgreSQL (Render) & Service Worker      | JWT Auth & PrivacyGuard Middleware |
| *Status*       | *Critical MVP*                          | *Value Add*                                  | *Infrastructure*                          | *Security*                         |

---

## Technologies Used
* **Frontend:** HTML5, CSS3, JavaScript (ES modules)
* **Backend:** Node.js with Express
* **Database:** PostgreSQL (Hosted on Render)
* **Security:** JSON Web Tokens (JWT) for session management and bcrypt for password hashing

---

## Architecture & Database

The project uses a layered MVC-style architecture which keeps controllers, services/domain logic, and models (DB layer) separated. This allows easy testing and the possibility to swap storage implementations without touching the API/controller code.

### Database
* `users`: Stores unique nicknames, hashed secrets, roles, and consent status.
* `mood_logs`: Stores mood data linked to individual users via Foreign Keys with timestamps.

> **Architecture Reflection:** Thanks to the layered architecture (Controllers → Services → Models), the storage layer is decoupled from the business logic. Swapping the PostgreSQL database for a CSV file would only require modifying the Model files, leaving the API and Controllers untouched.

---

## Project Layout

```
server/                         # Backend (Express + PostgreSQL)
├── server_app.mjs              # Express app entry (routes & middleware)
├── database/db.mjs             # PostgreSQL pool (uses DATABASE_URL)
├── middleware/privacyGuard.mjs # JWT / ownership enforcement
├── routes/                     # Route registrations
├── controllers/                # HTTP handlers
└── models/                     # DB access layer

client/                         # Frontend (PWA, i18n)
├── index.html                  # SPA shell; mounts #app-root
├── app.mjs                     # App bootstrap, router, event wiring
├── style.css                   # Global styles & accessibility rules
├── service_worker.js           # PWA caching & offline fallback
├── manifest.json               # PWA manifest (icons, start_url)
├── translations/               # Locale files (en.json, no.json, …)
└── modules/                    # Core client modules (api.mjs, singleton.mjs, …)

tests/                          # API & integration test collections (Insomnia export)
```

---

## Deployment & Persistence

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
By default, the setup unregisters service workers on localhost. To test locally:
```js
globalThis.__ENABLE_SW__ = true; location.reload();

globalThis.__DISABLE_SW__ = true; location.reload();
```

---

## PWA & Offline Support

- Robust service worker (`client/service_worker.js`) with cache versioning, activation/cleanup, offline fallback (`client/offline.html`), and runtime caching strategies.
- `manifest.json` provides icons and a sensible `start_url` so browsers can consider the app installable.

**How to test:**
1. Open the app in Chrome/Edge.
2. DevTools → Application → Manifest — check installability state.
3. DevTools → Application → Service Workers — verify registration and lifecycle events.
4. DevTools → Network → set Offline and reload; cached pages or `offline.html` should be served.

---

## Security & Privacy Guard

MoodMate uses a custom middleware as a security gatekeeper, ensuring every request is verified for **Identity, Role, and Ownership** before any data is processed.

- **Middleware:** `server/middleware/privacyGuard.mjs`
- **Auth Logic:** `server/utils/auth_crypto.mjs`

The middleware validates the JWT and enforces role-based permissions: children are restricted to their own data; parents can view family data but cannot modify a child's original entries.

---

## Internationalization (I18n)

### Supported Languages
| Code | Language  |
|:----:|:----------|
| `no` | Norwegian |
| `en` | English   |
| `sv` | Swedish   |
| `es` | Spanish   |
| `da` | Danish    |

The client ships a language switcher using flag SVGs from `client/assets/flags/` and a manifest file `client/assets/flags/flags.json`. Translation strings live in `client/translations/<code>.json` and are applied via `data-i18n` attributes or `store.t('key')` in JavaScript.

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

| Requirement                                            |     Status      | Files / Notes                                                                             |
|:-------------------------------------------------------|:---------------:|:------------------------------------------------------------------------------------------|
| Select app idea and feature map                        |     ✅ Done      | Feature Map section above                                                                 |
| Document project and plan                              |     ✅ Done      | This README                                                                               |
| Client: scaffold, MVC separation, single fetch pattern |     ✅ Done      | `client/app.mjs`, `client/modules/api.mjs`, `client/modules/singleton.mjs`                |
| Server: REST API, routes, controllers                  |     ✅ Done      | `server/server_app.mjs`, `server/routes/*.mjs`, `server/controllers/*.mjs`                |
| User accounts (create, delete, consent + ToS/Privacy)  |     ✅ Done      | `userController.mjs`, `user_api_handler.mjs`, `user_service.mjs`, `user_server_model.mjs` |
| Persistent cloud storage (PostgreSQL on Render)        |     ✅ Done      | `server/database/db.mjs`, `server/models/*.mjs`                                           |
| REST API scaffold & documentation                      |     ✅ Done      | `server/routes/*.mjs`, `client/modules/api.mjs`, Postman collection                       |
| Middleware (meaningful, not logging)                   |     ✅ Done      | `server/middleware/privacyGuard.mjs` — JWT identity/role enforcement                      |
| Client web component for user CRUD                     |     ✅ Done      | `user-manager` element in `client/app.mjs`, `userManager.html`, `userController.mjs`      |
| PWA & offline support                                  |     ✅ Done      | `client/manifest.json`, `client/service_worker.js`, `client/serviceWorkerSetup.mjs`       |
| Accessibility (WCAG/ARIA)                              | 🔄 In progress  | Skip link, focus styles, ARIA roles added — Lighthouse target ≥ 90                        |
| Project management & repository                        |     ✅ Done      | GitHub Project board                                                                      |
| Tests & test tools                                     |     ✅ Done      | `tests/moodmate_api_tests.json` — import into Postman/Insomnia                            |

## Key Files for Code Review

| File                                                                         | What it shows                                  |
|:-----------------------------------------------------------------------------|:-----------------------------------------------|
| `server/routes/parent_routes.mjs`, `server/controllers/user_api_handler.mjs` | API scaffold and endpoint structure            |
| `server/middleware/privacyGuard.mjs`                                         | Meaningful middleware (JWT + role enforcement) |
| `client/modules/api.mjs`, `client/modules/singleton.mjs`                     | Single-fetch pattern and i18n loader           |
| `client/modules/controllers/userController.mjs`, `views/userManager.html`    | Client CRUD and consent flow                   |
| `client/service_worker.js`, `client/manifest.json`                           | PWA evidence                                   |
| `tests/moodmate_api_tests.json`                                              | API test collection                            |