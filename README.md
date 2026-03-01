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

## Deployment & Persistence
The application is fully deployed in a production environment:
* **Live Web Service:** [https://moodmate-server-81ta.onrender.com](https://moodmate-server-81ta.onrender.com)
* **Database:** Externally hosted PostgreSQL on Render.
* **Persistence:** Data remains intact even if the server restarts or crashes.

## Technologies Used
* **Frontend:** HTML5, CSS3, JavaScript (ES modules)
* **Backend:** Node.js with Express
* **Database:** PostgreSQL (Hosted on Render)
* **Security:** JSON Web Tokens (JWT) for session management and bcrypt for password hashing.

## Database Architecture
The project uses a relational database to ensure data integrity and persistence:
* `users`: Stores unique nicknames, hashed secrets, roles, and consent status.
* `mood_logs`: Stores mood data linked to individual users via Foreign Keys with timestamps.

> **Architecture Reflection:** Thanks to the layered architecture (Controllers -> Services -> Models), the storage layer is decoupled from the business logic. Swapping the PostgreSQL database for a CSV file would only require modifying the Model files, leaving the API and Controllers untouched.

---

## Feature Map
The following table outlines the core features for the Minimum Viable Product (MVP).

| Priority | Pri 1: Core Loop (Mood) | Pri 2: Context & Solution | Pri 3: Persistence & PWA | Pri 4: User Accounts |
|:-------------------|:-------------------|:-------------------|:-------------------|:-------------------|
| *Main Feature* | **Interactive Logging** | **Contextualizing** | **Cloud & PWA** | **Access Control** |
| *Sub-features* | Visual mood icon selection for children | Linking emotions to activities and solutions | External data storage and offline support | Role-based login (Child/Parent) |
| *Requirement* | REST API & Mood Controller | Coping strategy suggestions | PostgreSQL (Render) & Service Worker | JWT Auth & PrivacyGuard Middleware |
| *Status* | *Critical MVP* | *Value Add* | *Infrastructure* | *Security* |


## Scaffolding & Folder Structure

### /client
```plaintext
/client
├── index.html
├── style.css
├── manifest.json
├── app.mjs                      # Main entry point for client logic
├── service_worker.js            # PWA capabilities & caching
├── assets/
│   ├── icons/
│   └── images/
└── modules/
    ├── singleton.mjs
    ├── api.mjs                       # Centralized fetch calls to backend
    ├── bootstrap.mjs`                # Lightweight bootstrap (dev API base, suppression)
    ├── models/                       # Client-side data models
    │   ├── mood_client_model.mjs
    │   ├── user_client_model.mjs
    │   └── profile_client_model.mjs     # Profile data operations (localStorage helpers)
    ├── controllers/                     # UI Logic and Event Handlers
    │   ├── auth_controller.mjs          # Login and consent validation
    │   ├── child_controller.mjs         # Mood-logging flow logic
    │   ├── child_login_controller.mjs   # Child PIN login controller
    │   ├── parent_controller.mjs        # Navigation hub for dashboard
    │   ├── user_ui_controller.mjs       # Parent account management (CRUD)
    │   ├── profile_controller.mjs       # Child profile management (client + server integration)
    │   └── mood_ui_controller.mjs       # Data visualization and insights
    ├── locales/
    │   └── no.json                   # Norwegian UI strings (i18n)
    └── views/                        # Norwegian HTML templates
        ├── login.html
        ├── privacyPolicy.html
        ├── termsOfService.html
        ├── childMenu.html
        ├── childProfiles.html        # Profile selection UI
        ├── childLogin.html           # Child PIN login view
        ├── moodCheckin.html
        ├── parentMenu.html
        ├── userManager.html
        ├── insights.html
        └── notFound.html             # 404 / not found view
```

### /server
```plaintext
/server
├── server_app.mjs                # Main entry point (Express)
├── messages.mjs
├── routes/                       # API Route definitions
│   ├── mood_routes.mjs
│   ├── user_routes.mjs
│   └── child_routes.mjs          # Child profile & child-login endpoints
├── controllers/                  # Request/Response handling (Logic)
│   ├── mood_api_handler.mjs
│   ├── user_api_handler.mjs
│   ├── child_api_handler.mjs     # Child create/login/get handlers
│   └── user_service.mjs          # Domain/service logic used by handlers
├── models/                       # SQL Queries (Database access)
│   ├── mood_server_model.mjs
│   ├── user_server_model.mjs
│   └── child_server_model.mjs`   # Child profiles model (pin hashing/verification)
├── utils
│   └── auth_crypto.mjs           # Hashing & verification helpers
├── middleware/                   # PrivacyGuard & Auth checks
│   └── privacyGuard.mjs
└── database
    ├── db.mjs                    # Postgres connection pool
    └── moodmate_db.sql           # Database schema / functions
```

---

### /tests
```
/tests
└── moodmate_api_tests.json
```

---

## Technical Architecture
- **Client:** HTML, CSS, JavaScript (ES modules — `.mjs` for client modules)
- **Server:** Node.js & Express (REST API)
- **Database:** PostgreSQL
- **Security:** Standard Node.js password handling and JWT for sessions.

---

## Local Installation & Setup

### 1. Clone & Install
```bash
git clone https://github.com/HannahEleenN/MM207_MoodMate_app.git
cd server
npm install
```

### 2. Environment Variables
Create a .env file in the /server folder:

```bash
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_secret_key
PORT=3000
```

### 3. Run the application
```bash
npm start
```

---

## API Documentation

### Mood Logs API

(*Folders:* tests/moodmate_api_tests.json,
*Link:* https://github.com/HannahEleenN/MM207_MoodMate_app/blob/main/tests/moodmate_api_tests.json)

Endpoints for tracking and managing emotional entries. 
*It should be able to add more than one solution, such as "puste dypt" (deep breathing), "høre på musikk" (listen to music) and "spør om en klem" (ask for a hug).* 

| Method | Endpoint | Description | Request Body (JSON) | Auth | Success Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/moods` | Create new mood entry | `{"mood": "trist", "context": "leken min ble ødelagt", "solutions": []}` | JWT Token | `201 Created` |
| **GET** | `/api/moods` | Get all mood entries for the user | *None* | JWT Token | `200 OK` |
| **GET** | `/api/moods/:id` | Get details for one entry | *None* | JWT Token | `200 OK` |
| **PATCH** | `/api/moods/:id` | Update log (e.g. add solution) | `{"solutions": ["snakk med en voksen", "klem"]}` | JWT Token | `200 OK` |
| **DELETE** | `/api/moods/:id` | Remove an entry | *None* | JWT Token | `204 No Content` |

**Authentication**
All requests to the `/api/moods` endpoints must include a Bearer Token in the Authorization header: `Authorization: Bearer <your_jwt_token>`

This token is used by the `privacyGuard` middleware to identify the user's `userId` and `familyId`.

---

## 🔒 Security: The Family & Sibling Privacy Guard
To protect sensitive emotional data, MoodMate uses a custom middleware as a security gatekeeper. This ensures that every request is verified for **Identity, Role, and Ownership** before any data is processed.

**Source Files:**
* **Middleware:** [`server/middleware/privacyGuard.mjs`](https://github.com/HannahEleenN/MM207_MoodMate_app/blob/main/server/middleware/privacyGuard.mjs)
* **Auth Logic:** [`server/utils/auth_crypto.mjs`](https://github.com/HannahEleenN/MM207_MoodMate_app/blob/main/server/utils/auth_crypto.mjs)

---

### The Need for Protection
MoodMate handles vulnerable data, which introduces three primary privacy risks that this middleware mitigates:

1. **Cross-Family Leaks:** Prevents User A from accessing logs belonging to Family B.
2. **Sibling Peeking:** Prevents children within the same family from seeing each other's logs, reducing potential conflict or teasing.
3. **Unauthorized Edits:** Ensures children cannot accidentally or intentionally delete parental reports or other sensitive entries.

### How it Works
The `privacyGuard` acts as a security interceptor that extracts the **JWT (JSON Web Token)** from the request headers to enforce the following access rules:

* **Children:** Are restricted to their own data. They can **POST** (log) and **GET** (view history) only if the `userId` in the request matches the `userId` stored in their token.
* **Parents:** Have broader **GET** (read) access to view logs for any child within their `familyId` for insights, but are strictly **restricted** from modifying the child's original emotional entries.

---

### Request Lifecycle
The following flow illustrates how the middleware handles a request:

1. **Client Request:** The user sends data (e.g., a new mood entry) along with their **JWT**.
2. **PrivacyGuard Middleware:** Validates the token and checks specific permissions based on the user's Role and IDs. If unauthorized, it returns a `401` or `403` error.
3. **Mood Controller:** Once validated, the controller receives the request and processes the business logic.
4. **Database:** Data is securely stored or retrieved from **PostgreSQL**.

`Client Request ➔ privacyGuard (Auth Check) ➔ Mood Controller ➔ Database`

---

## File Extensions:

| Location | Extension | Reason |
| :--- | :--- | :--- |
| **Server** (API, Middleware, Routes) | `.mjs` | Tells Node.js to use ECMAScript Modules (ESM). |
| **Client** (App logic, Service Worker) | `.mjs` | Client modules are ES modules (`.mjs`) and loaded as JavaScript modules in the browser. |
