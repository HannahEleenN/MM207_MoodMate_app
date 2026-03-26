# MoodMate App - MM207: Interactive Emotion Journal
*Individual university assignment for the course MM207 - UiA Grimstad, Norway.*

MoodMate is a Progressive Web App (PWA) designed for children (ages 6–7) to identify, log, and resolve emotions.

**Note on Language:** Technical documentation and code are in English. The client interface is fully internationalized and supports **5 languages** (Norwegian, English, Swedish, Spanish, and Danish) to accommodate diverse users and target demographics across Scandinavian regions.

---

![MVC pattern](https://github.com/user-attachments/assets/7ef2653b-22a0-4015-a073-a5297a755ee7)

The project follows a strict MVC pattern to ensure a clean separation between the multilingual UI (View, supporting 5 languages), the English business logic (Controller), and the PostgreSQL data layer (Model).

---

## User Persona & Typical Usage Scenario

**Primary Users:** Children aged 6–7 and their parents/guardians.

### Example User Flow
1. **Parent Registration:** A parent creates an account with a nickname and password.
2. **Child Profile:** The parent adds a child profile (e.g., "Sophie") to the account.
3. **Child Login:** Sophie logs in using a simple 4-digit PIN (no complex passwords for children).
4. **Mood Check-in:** Sophie selects one of six colorful emojis: Happy 😊, Sad 😢, Angry 😡, Scared 😨, Calm 😌, Surprised 😲.
5. **Contextualizing:** After selecting an emotion, Sophie is asked "Why?". She can tap suggested reasons or write her own.
6. **Coping Strategy:** The app suggests age-appropriate actions (e.g., "Take deep breaths" or "Talk to a friend").
7. **Parent View:** The parent logs in to see emotional trends over the past week, helping identify stress points.

**Design Rationale:**
- **Large buttons (44×44px+):** Optimized for children's developing motor skills.
- **Visual-first:** Icons and emojis reduce the cognitive load for early readers.
- **Multilingual interface:** Supports Norwegian, English, Swedish, Spanish, and Danish to serve diverse Scandinavian demographics.

---

## Table of Contents
- [Feature Map](#feature-map)
- [Technologies Used](#technologies-used)
- [Architecture & Database](#architecture--database)
- [Evolution: From Memory to Persistence](#evolution-from-memory-to-persistence)
- [Project Layout](#project-layout)
- [Deployment & Persistence](#deployment--persistence)
- [Local Installation & Quick Start](#local-installation--quick-start)
- [Quick Start for Evaluation](#quick-start-for-evaluation)
- [How to Test the API](#how-to-test-the-api)
- [Known Limitations](#known-limitations)
- [PWA & Offline Support](#pwa--offline-support)
- [Security & Privacy Guard](#security--privacy-guard)
- [Internationalization (I18n)](#internationalization-i18n)
- [Accessibility](#accessibility)
- [Testing & Lighthouse](#testing--lighthouse)
- [MVC Pattern Implementation](#mvc-pattern-implementation)
- [Key Files for Code Review](#key-files-for-code-review)
- [Assignment Checklist](#assignment-checklist)

---

## Feature Map

| Priority    | Pri 1: Core Loop        | Pri 2: Context & Solution | Pri 3: Persistence & PWA    | Pri 4: Access Control |
|:------------|:------------------------|:--------------------------|:----------------------------|:----------------------|
| **Feature** | **Interactive Logging** | **Contextualizing**       | **Cloud & PWA**             | **Role-based Auth**   |
| **Tech**    | REST API & Controllers  | Suggestions & Reasons     | PostgreSQL & Service Worker | JWT & PrivacyGuard    |
| **Status**  | ✅ Complete              | ✅ Complete                | ✅ Complete                  | ✅ Complete            |

---

## Technologies Used
* **Frontend:** HTML5, CSS3, JavaScript (ES modules)
* **Backend:** Node.js with Express
* **Database:** PostgreSQL (Hosted on Render)
* **Security:** JSON Web Tokens (JWT) and bcrypt/salted hashing

---

## Architecture & Database

The project uses a layered MVC-style architecture. This decoupling allows the storage layer to be swapped (e.g., PostgreSQL to SQLite) without touching the API logic.

### Database Schema
* `users`: Stores nicknames, hashed secrets, roles, and consent timestamps.
* `child_profiles`: Stores child-specific nicknames and PINs linked to a parent.
* `mood_logs`: Stores time-stamped emotional entries linked to profiles via Foreign Keys.
* `mood_drafts`: Stores in-progress mood entries for draft recovery.

### Unified ID Strategy
The system uses a **Unified ID Strategy** to ensure data consistency across all layers:
- **Database Layer:** IDs (UUIDs) are generated and stored in PostgreSQL as the source of truth.
- **Controller Layer:** IDs are extracted from database results and propagated to the response objects.
- **Client Layer:** IDs are embedded in DOM elements (`data-id` attributes), CSS selectors, and translation key contexts.
- **Consistency Guarantee:** This unified approach prevents ID mismatches and ensures role-based access control (RBAC) works correctly across all user roles (parent, child).

---

## Evolution: From Memory to Persistence

**Architectural Growth:** The project demonstrates a real-world architectural evolution in response to requirements changes. 

Initially, the application relied on a **volatile in-memory store** (`_memoryDraftStore` Map in Node.js) for draft mood entries, which provided:
- Fast prototyping and immediate feedback
- No database setup overhead  
- Simple state management during development

However, as persistence requirements emerged, the architecture was refactored to use **PostgreSQL** for all data, with an intelligent fallback mechanism:
- **Primary Path:** All user data (users, child profiles, mood logs, and drafts) persist in PostgreSQL
- **Graceful Degradation:** If the database becomes temporarily unavailable, the in-memory store acts as a circuit-breaker fallback (see `server/controllers/mood_api_handler.mjs` lines 108–159)
- **Client-Side Offline:** IndexedDB handles offline scenarios on the client (`client/modules/offline.mjs`)

This layered persistence strategy demonstrates:
- **Separation of Concerns:** Models abstract database operations, leaving controllers database-agnostic
- **Resilience:** Multiple fallback layers ensure the app continues functioning even during network issues
- **Testability:** Controllers can be tested with mock models, then swapped to real database models in production

**Code Impact:** You can see this evolution in:
- `server/models/*_server_model.mjs` — Direct PostgreSQL queries (primary source of truth)
- `server/controllers/mood_api_handler.mjs` — Fallback to in-memory on database errors (graceful degradation)
- `PRIVACY.md` — Updated to reflect PostgreSQL persistence (clarification of outdated "in-memory RAM" references)

---

## Project Layout

```
server/                         # Backend (Express + PostgreSQL)
├── server_app.mjs              # Express app entry (routes & middleware)
├── database/
│   ├── db.mjs                  # PostgreSQL pool (uses DATABASE_URL)
│   └── moodmate_db.sql         # Database schema & functions
├── middleware/
│   ├── privacy_guard.mjs        # JWT / RBAC enforcement
│   ├── cors.mjs                 # CORS configuration
│   ├── error_handler.mjs        # Global error handling
│   └── logger.mjs               # Request logging
├── routes/                      # Route registrations
├── controllers/                 # HTTP handlers
└── models/                      # DB access layer

client/                         # Frontend (PWA, i18n)
├── index.html                  # SPA shell
├── app.mjs                     # App bootstrap
├── style.css                   # Global styles & accessibility
├── service_worker.mjs          # PWA caching
├── manifest.json               # PWA manifest
├── assets/                     # Images, icons, flags
├── translations/               # Locale files (5 languages)
└── modules/                    # Core client modules
```

---

## Deployment & Persistence

* **Live Web Service:** [https://moodmate-server-81ta.onrender.com](https://moodmate-server-81ta.onrender.com)
* **Database:** PostgreSQL hosted on Render's managed service.
* **Data Persistence:** ✅ **YES** — All accounts, profiles, and logs are permanently stored.
* **Backups:** Render provides automated daily backups.
* **Uptime:** 24/7 availability.

---

## Local Installation & Quick Start

### 1. Install and start the server

```powershell
cd server
npm install
npm start
```

The server runs on `http://localhost:3000`.

### 2. Open the app in a browser

Navigate to `http://localhost:3000`.

---

## Quick Start for Evaluation

To quickly test the application without creating a new account, use these pre-configured test credentials:

| Role       | Username/Email          | Password/PIN | Purpose                                                        |
|:-----------|:------------------------|:-------------|:---------------------------------------------------------------|
| **Parent** | `evaluator@example.com` | `Eval1234!`  | Access parent dashboard, view child profiles and mood insights |
| **Child**  | `Emma` (profile)        | `4321`       | Test child login and mood check-in flow                        |

### Test Flow
1. **Parent Login:** Enter `evaluator@example.com` / `Eval1234!`
2. **View Profiles:** Navigate to "Child Profiles" to see "Emma"
3. **Switch to Child:** Log out and login as "Emma" with PIN `4321`
4. **Test Mood Entry:** Go to "Mood Check-in" and select an emotion
5. **Parent Insights:** Log back in and navigate to "Insights" to see mood trends

---

## How to Test the API

### Using Postman or Insomnia

1. **Import:** Open `tests/moodmate_api_tests.json`
2. **Setup:** Ensure server runs on port 3000
3. **Execution Order:** Register → Create Profile → Post Mood → Retrieve Insights
4. **Validation:** Check HTTP status codes (200, 201, 401, etc.)

### Browser Console Testing

```javascript
await window.MoodMate.getAllStoredMoods();
window.MoodMate.syncStoredMoods();
window.MoodMate.clearStoredMoods();
```

---

## Known Limitations

* **Real-time Sync:** Requires refresh to see entries from other devices
* **Language Persistence:** Language choice is session-based
* **Export Features:** In-app visualization only; no CSV/PDF export yet
* **Parental PIN:** Parent accounts use standard password authentication

---

## PWA & Offline Support

The app uses Service Worker caching and IndexedDB for offline functionality:

- **Service Worker:** Caches critical assets and serves offline pages
- **IndexedDB:** Stores mood entries when network is unavailable
- **Auto-sync:** Syncs cached moods when connection returns

**Test offline mode:**
1. DevTools → Network → set to `Offline`
2. Create a mood entry (saves to IndexedDB)
3. Go back online and run `window.MoodMate.syncStoredMoods()`

---

## Security & Privacy Guard

### Identity, Role, and Ownership Enforcement

MoodMate uses `server/middleware/privacy_guard.mjs` to ensure:

- **JWT Validation:** Every request is verified before processing
- **Role-Based Access Control (RBAC):** 
  - `parent` role: View family data, manage profiles
  - `child` role: View only own data
- **Horizontal Privilege Escalation Prevention:** Users cannot access others' data
- **Child Data Isolation:** Children cannot access sibling profiles
- **GDPR Compliance:** Account creation requires active consent

### Secrets & Hashing
- Passwords hashed with bcrypt (no plain text storage)
- JWT secret from environment variables
- Salt rounds configured for brute-force resistance

---

## Internationalization (I18n)

### Supported Languages

| Code | Language  |
|:-----|:----------|
| `no` | Norwegian |
| `en` | English   |
| `sv` | Swedish   |
| `es` | Spanish   |
| `da` | Danish    |

Translation strings in `client/translations/<code>.json` are applied via `data-i18n` attributes or `store.t('key')` in JavaScript.

---

## Accessibility

### Core Accessibility Features
- **Touch Targets:** Minimum 44×44px for all buttons
- **ARIA:** Proper roles, labels, and live regions
- **Keyboard:** Full navigation support with logical tab order
- **Color:** Not the only visual indicator (icons + text used)
- **Contrast:** 4.5:1 minimum ratio
- **Performance:** Lighthouse accessibility ≥ 90, performance ≥ 80

---

## Testing & Lighthouse

Run audits using Chrome DevTools:

1. Open DevTools (F12)
2. Lighthouse tab
3. Run audit
4. Check Accessibility ≥ 90, Performance ≥ 80

---

## MVC Pattern Implementation

### Models
- **Server Models:** Direct PostgreSQL queries
- **Client Models:** In-memory state management

### Views
- HTML templates loaded dynamically by router
- Semantic markup with ARIA attributes

### Controllers
- HTTP request handlers (server)
- User interaction handlers (client)

---

## Key Files for Code Review

- **Auth & Security:** `server/middleware/privacy_guard.mjs`, `server/utils/auth_crypto.mjs`
- **API Logic:** `server/controllers/user_api_handler.mjs`, `mood_api_handler.mjs`
- **Database:** `server/database/moodmate_db.sql`, `server/models/*`
- **Client State:** `client/modules/singleton.mjs`, `offline.mjs`
- **PWA:** `client/service_worker.mjs`, `manifest.json`, `offline.html`

---

## Assignment Checklist

| Requirement                     | Status     | Key Files                                |
|:--------------------------------|:-----------|:-----------------------------------------|
| **MVC Separation**              | ✅ Complete | `server/controllers/`, `server/models/`  |
| **REST API**                    | ✅ Complete | `server/routes/*.mjs`                    |
| **Persistent Database**         | ✅ Complete | PostgreSQL, `moodmate_db.sql`            |
| **Middleware (Auth/Security)**  | ✅ Complete | `privacy_guard.mjs`                      |
| **PWA & Offline**               | ✅ Complete | `service_worker.mjs`, `offline.mjs`      |
| **I18n (5 languages)**          | ✅ Complete | `client/translations/`                   |
| **Accessibility (WCAG 2.1 AA)** | ✅ Complete | 44px targets, ARIA, contrast             |
| **Role-Based Access Control**   | ✅ Complete | Parent/child RBAC in `privacy_guard.mjs` |
| **Unified ID Strategy**         | ✅ Complete | UUID propagation across layers           |

---

*Last updated: March 2025*
