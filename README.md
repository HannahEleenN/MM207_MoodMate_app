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

### Database Initialization
To set up the database locally or in the cloud, execute the SQL script `server/database/moodmate_db.sql`. This will create all necessary tables and stored procedures/functions required by the application:
* **Tables:** `users`, `child_profiles`, `mood_logs`, and `mood_drafts`.
* **Functions:** Includes logic for user registration, profile retrieval, and mood log persistence.

---

## Project Layout

```
server/                         # Backend (Express + PostgreSQL)
├── server_app.mjs              # Express app entry (routes & middleware)
├── database/db.mjs             # PostgreSQL pool (uses DATABASE_URL)
├── middleware/privacy_guard.mjs # JWT / ownership enforcement
├── routes/                     # Route registrations
├── controllers/                # HTTP handlers
└── models/                     # DB access layer

client/                         # Frontend (PWA, i18n)
├── index.html                  # SPA shell; mounts #app-root
├── app.mjs                     # App bootstrap, router, event wiring
├── style.css                   # Global styles & accessibility rules
├── service_worker.mjs           # PWA caching & offline fallback
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

- Robust service worker (`client/service_worker.mjs`) with cache versioning, activation/cleanup, offline fallback (`client/offline.html`), and runtime caching strategies.
- `manifest.json` provides icons and a sensible `start_url` so browsers can consider the app installable.

**How to test:**
1. Open the app in Chrome/Edge.
2. DevTools → Application → Manifest — check installability state.
3. DevTools → Application → Service Workers — verify registration and lifecycle events.
4. DevTools → Network → set Offline and reload; cached pages or `offline.html` should be served.

Additional offline behaviour (IndexedDB + automatic sync):

- The client includes `client/modules/offline.mjs`, which implements a small IndexedDB store (`moodmate-offline` → `moods`). When the network is unavailable, mood entries are saved locally instead of being lost. When the connection returns, the module attempts to sync stored entries to the server in a bulk POST and clears the local store on success.

- Public developer API exposed on the window namespace (useful for debugging / tests):
- `window.MoodMate.saveMoodOrSend(mood)` — attempts to POST a single mood; falls back to saving in IndexedDB on failure.
- `window.MoodMate.syncStoredMoods()` — attempts to send all locally stored moods to the server.
- `window.MoodMate.getAllStoredMoods()` — returns locally stored mood records.
- `window.MoodMate.clearStoredMoods()` — clears the local store.

- Auto-start & opt-out: by default the offline sync module auto-initialises on import. To disable auto-initialisation in tests or a debug page, set the opt-out flag before the client modules load: `window['__MOODMATE_DISABLE_AUTO_OFFLINE__'] = true` and then load the app. Alternatively, call `window.MoodMate.initOfflineSync()` manually when you want to start sync behaviour.

Testing offline mood persistence and sync:

1. Open DevTools → Application → IndexedDB and look for `moodmate-offline` → `moods`.
2. In DevTools → Network, set the network to `Offline`.
3. Use the app UI to create a mood entry (the app will call `saveMoodOrSend`). The entry should appear in the IndexedDB store.
4. Switch the network back to `Online` and either wait for the automatic sync or run `window.MoodMate.syncStoredMoods()` in the console. On successful sync, the IndexedDB store should be cleared and the server should receive the entries (check server logs or the API).

Notes and troubleshooting:
- If you can't see service worker registration locally, enable the service worker in development (`globalThis.__ENABLE_SW__ = true; location.reload();`) as documented above.
- The offline HTML fallback (`client/offline.html`) is used for navigations when the network is unavailable and a cached response isn't present.

---

## Security & Privacy Guard

MoodMate uses a custom middleware as a security gatekeeper, ensuring every request is verified for **Identity, Role, and Ownership** before any data is processed.

- **Middleware:** `server/middleware/privacy_guard.mjs`
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

The app prioritizes accessibility for children and parents:

**HTML & Semantic Structure:**
- Proper heading hierarchy (h1 → h2 → h3)
- Semantic form elements with associated labels
- Fieldset/legend for grouping related inputs
- Skip-to-content link hidden but available to keyboard users

**ARIA & Interactivity:**
- Interactive elements include proper ARIA roles (`radiogroup` for mood selection, `dialog` for modals)
- Live regions (`aria-live="polite"`) for status messages and notifications
- Proper `aria-label` and `aria-describedby` on form inputs
- Modal dialogs include `aria-modal="true"` and focus trapping

**Visual Accessibility:**
- Minimum contrast ratio of 4.5:1 for text
- Visible keyboard focus indicators on all interactive elements
- Color is not the only indicator (icons, text labels used with colors)
- Minimum touch target size of 44×44px for buttons

**Keyboard Navigation:**
- Full keyboard navigation support (Tab, Shift+Tab, Enter, Space)
- Logical tab order maintained throughout the app
- No keyboard traps (user can always escape)
- Escape key closes modals

**Performance & Loading:**
- Font preload/preconnect reduces layout shift (CLS optimization)
- Font fallback with size-adjust prevents FOUT (Flash of Unstyled Text)
- Critical CSS inlined in `<head>` for faster initial paint
- Static assets cached with appropriate Cache-Control headers

**Target:** Lighthouse accessibility score ≥ 90, performance ≥ 80.

---

## MVC Pattern Implementation

The app implements a clear separation of concerns following the Model-View-Controller pattern:

**Model Layer (M):** `client/modules/models/`, `server/models/`
- Client models (`*_client_model.mjs`): Manage in-memory state and API contracts
- Server models (`*_server_model.mjs`): Abstract database access, handle SQL queries
- Database schema (`server/database/moodmate_db.sql`): Tables for users, children, moods

**View Layer (V):** `client/modules/views/`
- HTML templates (`.html` files) with `data-i18n` attributes for internationalization
- Compiled markup loaded dynamically by controllers
- CSS styling in `client/style.css` (colors, typography, layout, accessibility)
- Responsive design with mobile-first approach

**Controller Layer (C):** `client/modules/controllers/`, `server/controllers/`
- Client controllers handle user events, coordinate models and views
- Server controllers (API handlers) process HTTP requests, enforce permissions
- Business logic separation: controllers manage state transitions and workflows
- Middleware (`server/middleware/`) enforces authentication/authorization

**Data Flow:**
```
User Input → Controller → Model → API Service → Server Handler → Server Model → Database
                ↓                                                      ↓
            View Updates ← Translations ← Response ← Query Results ← Tables
```

**Benefits:**
- Models can be tested independently of UI
- Views can be redesigned without changing logic
- Controllers can be reused across different interfaces
- Database can be swapped (PostgreSQL ↔ SQLite) by only changing models

---

## Testing & Lighthouse

### Lighthouse Performance Audits

```powershell
# Run Lighthouse audit in Chrome DevTools
1. Open the app in Chrome/Edge.
2. Open DevTools (F12) → Lighthouse tab.
3. Select categories: Performance, Accessibility, Best Practices, SEO, PWA.
4. Click "Generate report" and review scores and recommendations.
```

**Target Scores:**
- **Accessibility:** ≥ 90 (WCAG AA compliance)
- **Performance:** ≥ 85 (optimized for children's devices)
- **Best Practices:** ≥ 90
- **SEO:** ≥ 90
- **PWA:** ✅ Installable

### API Testing

Import `tests/moodmate_api_tests.json` into Postman or Insomnia and run against your local or deployed server. Update the environment URL and Authorization token where needed.

**Test Collections Include:**
- User registration and authentication flows
- Child profile CRUD operations
- Mood check-in workflows
- Parent insights and reporting
- Offline sync validation
- Error handling scenarios

### Manual Accessibility Testing

**Keyboard Navigation:**
1. Use Tab to navigate through all interactive elements
2. Use Shift+Tab to navigate backwards
3. Verify focus indicators are always visible
4. Escape key should close modals
5. Enter/Space should activate buttons

**Screen Reader (NVDA/JAWS/VoiceOver):**
1. Test with a screen reader to ensure proper ARIA labels
2. Verify heading structure is logical
3. Check form fields have associated labels
4. Confirm skip-to-content link is available

**Color Contrast:**
1. Use a contrast checker tool (e.g., WebAIM) to verify 4.5:1 minimum for body text
2. Test with color blindness simulators

---

## Assignment Checklist

| Requirement                                            |     Status      | Files / Notes                                                                             |
|:-------------------------------------------------------|:---------------:|:------------------------------------------------------------------------------------------|
| Select app idea and feature map                        |     ✅ Done      | Feature Map section above                                                                 |
| Document project and plan                              |     ✅ Done      | This README                                                                               |
| Client: scaffold, MVC separation, single fetch pattern |     ✅ Done      | `client/app.mjs`, `client/modules/api.mjs`, `client/modules/singleton.mjs`                |
| Server: REST API, routes, controllers                  |     ✅ Done      | `server/server_app.mjs`, `server/routes/*.mjs`, `server/controllers/*.mjs`                |
| User accounts (create, delete, consent + ToS/Privacy)  |     ✅ Done      | `user_controller.mjs`, `user_api_handler.mjs`, `user_service.mjs`, `user_server_model.mjs` |
| Persistent cloud storage (PostgreSQL on Render)        |     ✅ Done      | `server/database/db.mjs`, `server/models/*.mjs`                                           |
| REST API scaffold & documentation                      |     ✅ Done      | `server/routes/*.mjs`, `client/modules/api.mjs`, Postman collection                       |
| Middleware (meaningful, not logging)                   |     ✅ Done      | `server/middleware/privacy_guard.mjs` — JWT identity/role enforcement                      |
| Client web component for user CRUD                     |     ✅ Done      | `user-manager` element in `client/app.mjs`, `userManager.html`, `user_controller.mjs`      |
| PWA & offline support                                  |     ✅ Done      | `client/manifest.json`, `client/service_worker.mjs`, `client/service_worker_setup.mjs`       |
| Accessibility (WCAG/ARIA)                              | ✅ Enhanced     | Skip link, focus styles, 44px touch targets, ARIA roles, live regions, high contrast       |
| Internationalization (I18n)                            | ✅ Complete     | 5 languages (Norwegian, English, Swedish, Spanish, Danish) with consistent terminology    |
| Project management & repository                        |     ✅ Done      | GitHub Project board                                                                      |
| Tests & test tools                                     |     ✅ Done      | `tests/moodmate_api_tests.json` — import into Postman/Insomnia                            |

## Key Files for Code Review

| File                                                                         | What it shows                                  |
|:-----------------------------------------------------------------------------|:-----------------------------------------------|
| `server/routes/parent_routes.mjs`, `server/controllers/user_api_handler.mjs` | API scaffold and endpoint structure            |
| `server/middleware/privacy_guard.mjs`                                         | Meaningful middleware (JWT + role enforcement) |
| `client/modules/api.mjs`, `client/modules/singleton.mjs`                     | Single-fetch pattern and i18n loader           |
| `client/modules/controllers/user_controller.mjs`, `views/userManager.html`    | Client CRUD and consent flow                   |
| `client/service_worker.mjs`, `client/manifest.json`                           | PWA evidence                                   |
| `tests/moodmate_api_tests.json`                                              | API test collection                            |
| `client/style.css`                                                            | Accessibility: 44px touch targets, contrast    |
| `client/translations/*.json`                                                  | 5 languages with complete key coverage         |

---

## Recent Improvements (v2.1)

### Accessibility Enhancements
- ✅ Increased all button touch targets to minimum 44×44px
- ✅ Improved color contrast on context/solution buttons (4.5:1+ ratio)
- ✅ Added `aria-live` regions for status updates
- ✅ Enhanced focus indicators and keyboard navigation
- ✅ Semantic HTML structure with proper heading hierarchy

### Lighthouse & Performance
- ✅ Added meta tags for SEO (keywords, author, mobile app support)
- ✅ Optimized font loading with preload/preconnect
- ✅ Service worker caching strategy for offline resilience
- ✅ Reduced layout shift (CLS) with proper font-size-adjust

### Translation Completeness
- ✅ Completed all 5 language files with consistent terminology
- ✅ Added missing keys: `emailHelper`, `passwordSection`, `passwordConfirmLabel`, `consentLabel`
- ✅ Verified terminology consistency across contexts

### CSS & UI Improvements
- ✅ Flexbox centering on buttons for better alignment
- ✅ Consistent touch target sizing throughout
- ✅ Improved visual hierarchy for form sections
- ✅ Better mobile responsiveness testing

### MVC Pattern Enhancements
- ✅ Controllers properly separated from views
- ✅ Models abstract database access cleanly
- ✅ Middleware enforces authorization at API layer
- ✅ Clear data flow from UI → Controllers → Models → Database

### Code Quality & Logic Improvements
- ✅ Extracted duplicated translation logic into `translateValue()` utility function
- ✅ Improved error handling in middleware with contextual error messages
- ✅ Enhanced security documentation in `auth_crypto.mjs` (scrypt KDF, timing-safe comparison)
- ✅ Single-fetch pattern documented in `ApiService` with clear authentication flow
- ✅ User model proxy pattern documented for reactive state management
- ✅ Privacy guard middleware documented with role-based access control examples
- ✅ Service worker caching strategy documented with performance optimization tips

### PWA Improvements
- ✅ Enhanced manifest.json with theme colors, categories, shortcuts
- ✅ Added maskable icon support for different device types
- ✅ Added PWA shortcuts for quick access to mood logging
- ✅ Added `scope` and `prefer_related_applications` properties

### Documentation Enhancements
- ✅ Added comprehensive comments explaining design patterns (Proxy, Single-Fetch, MVC)
- ✅ Documented security architecture (JWT, scrypt, timing-safe comparisons)
- ✅ Documented API authentication flow with examples
- ✅ Added Lighthouse testing guides with target scores
- ✅ Added manual accessibility testing procedures
- ✅ Documented offline sync API and IndexedDB usage

---

## Performance Tips for Lighthouse

### For Better Performance (85+):
1. **Font Loading:** Already optimized with preload/preconnect and size-adjust
2. **Cache Strategy:** Service worker uses Cache-First for static assets, Network-First for navigation
3. **Code Splitting:** Load translations on demand (current implementation uses lazy load)
4. **Asset Compression:** Ensure server applies gzip compression on responses

### For Better Accessibility (90+):
1. **Touch Targets:** All buttons now have minimum 44×44px (44px recommended for children)
2. **Contrast:** Verified 4.5:1 ratio on all text
3. **ARIA:** Proper labels, live regions, and semantic HTML
4. **Keyboard Navigation:** Full Tab/Shift+Tab support, focus trapping in modals

### For Better SEO (90+):
1. **Meta Tags:** Added keywords, author, description, theme-color
2. **Mobile Support:** Apple mobile-web-app tags added to index.html
3. **Structured Data:** Consider adding JSON-LD for mood-tracking app schema
4. **Canonical URLs:** Ensure each page has a canonical URL

### For Better Best Practices (90+):
1. **HTTPS:** Ensure production uses HTTPS (Render provides this)
2. **No Deprecated APIs:** Using modern ES modules, no old JS patterns
3. **Security Headers:** Ensure server sends proper HSTS, CSP headers
4. **Permissions:** Properly handle microphone/camera permissions (if needed in future)

---


