# MoodMate App - MM207- Interactive Emotion Journal (School Project, UiA Grimstad, Norway)

*This is an individual university assignment for the course MM207.*
*Contributions or collaborations are not accepted as it is a graded individual project.*

![MVC pattern](https://github.com/user-attachments/assets/7ef2653b-22a0-4015-a073-a5297a755ee7)


MoodMate is a Progressive Web App (PWA) designed for children (ages 6-7) to identify, log, and resolve emotions.
**Note on Language:** Technical documentation and code are in English. The client interface is in Norwegian to accommodate the target audience.

---

MoodMate is a mood-tracking application developed as part of the course MM-207.
The application is deployed and running in the cloud, integrated with a PostgreSQL database.

## Live Demo
You can access the live application here:
**https://moodmate-server-81ta.onrender.com**

## Technologies Used
- **Frontend:** HTML, CSS, JavaScript (ES modules)
- **Backend:** Node.js with Express
- **Database:** PostgreSQL hosted on Render
- **Authentication:** JSON Web Tokens (JWT) and bcrypt for password hashing

## Database Architecture
The project stores both user accounts and mood logs in the database:
- `users`: Stores unique nicknames, hashed secrets, roles, and consent status.
- `mood_logs`: Stores mood data linked to individual users with timestamps.

The application follows a layered architecture (Controllers, Services, Models). This modular approach makes it easy to swap the storage mechanism (e.g., from SQL to CSV) without modifying the API endpoints.

---

## Feature Map
The following table outlines the core features for the Minimum Viable Product (MVP).

| Priority | Pri 1: Core Loop (Mood) | Pri 2: Context & Solution | Pri 3: Offline & PWA | Pri 4: User Accounts |
|:-------------------|:-------------------|:-------------------|:-------------------|:-------------------|
| *Main Feature* | **Interactive Logging** | **Contextualizing** | **Persistence & PWA** | **Access Control** |
| *Sub-features* | Visual icon selection (e.g., "Glad", "Trist") | Linking emotion to activity (Hvorfor?) | Offline storage (IndexedDB) | Separate Child/Parent login |
| *Requirement* | REST API & PostgreSQL storage | Suggesting coping strategies | Service Worker (Caching) | Persistent Auth (JWT) |
| *Status* | *Critical MVP* | *Value Add* | *Requirement* | *Infrastructure* |

---

## Project Management
The project is managed using GitHub Projects. Detailed work items and task progress can be found here:
[MoodMate Project Board](https://github.com/users/HannahEleenN/projects/3)

---

## Scaffolding & Architecture

### Folder Structure

### /client
```plaintext
/client
├── index.html
├── style.css
├── manifest.json
├── app.mjs
├── service_worker.js
├── assets/
│   ├── icons/
│   └── images/
└── modules/
    ├── singleton.mjs
    ├── api.mjs
    ├── models/
    │   ├── mood_client_model.mjs
    │   ├── user_client_model.mjs
    │   └── profile_client_model.mjs        # (NEW) client-side Profile model (data operations)
    ├── controllers/
    │   ├── auth_controller.mjs       # App entry, login, and consent validation. (Logic for login.html)
    │   ├── child_controller.mjs      # Manages the linear child mood-logging flow. (Logic for childMenu.html & moodCheckin.html)
    │   ├── parent_controller.mjs     # Navigation hub for the parent dashboard. (Logic for parentMenu.html)
    │   ├── user_ui_controller.mjs    # Management of parent account (CRUD). (Logic for userManager.html)
    │   ├── profile_controller.mjs    # (NEW) Controller for child profile management (view: childProfiles.html)
    │   └── mood_ui_controller.mjs    # Historical data visualization and insights. (Logic for insights.html)
    ├── locales/
    │   └── no.json                   # (NEW) Norwegian UI strings used by controllers (keeps UI copy out of JS)
    └── views/
        ├── login.html
        ├── privacyPolicy.html
        ├── termsOfService.html
        ├── childMenu.html
        ├── childProfiles.html        # (NEW) View for creating/selecting child profiles
        ├── moodCheckin.html
        ├── parentMenu.html
        ├── userManager.html
        └── insights.html
```

Notes about the client changes:
- The MVC pattern is preserved: views (.html) contain all UI text in Norwegian; controllers (.mjs) contain the logic in English; models (.mjs) contain data manipulation.
- New files introduced to support parent-managed child profiles and i18n:
  - `modules/models/profile_client_model.mjs` — client-side model for profiles
  - `modules/controllers/profile_controller.mjs` — controller and UI glue for `childProfiles.html`
  - `modules/locales/no.json` — Norwegian copy for inline notices and messages
  - `modules/views/childProfiles.html` — profile manager UI (create, edit, delete, select)
- A global inline notice area (`#global-notice`) and i18n helpers were added to the client store to avoid alert()/prompt() usage in controllers and to centralize all user-facing copy.

### /server
```plaintext
/server
├── server_app.mjs
├── messages.mjs
├── routes
│   ├── mood_routes.mjs
│   └── user_routes.mjs
├── controllers
│   ├── user_service.mjs
│   ├── mood_api_handler.mjs
│   └── user_api_handler.mjs
├── models
│   ├── mood_server_model.mjs
│   └── user_server_model.mjs
├── utils
│   └── auth_crypto.mjs
├── middleware
│   └── privacyGuard.mjs
└── database
    ├── db.mjs
    └── moodmate_db.sql
```

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

## How to run the project locally

1. **Clone repository:**
   ```bash
   git clone https://github.com/HannahEleenN/MM207_MoodMate_app.git
   ```

2. **Server setup:**
   ```bash
   cd server
   npm install
   npm start
   ```
   - Default port: `http://localhost:3000`

3. **Client (optional local preview):**
   Serve the `client/` folder as a static site. Example using Python:
   ```bash
   python -m http.server 8080 -d client
   ```
   Then open `http://localhost:8080`.

4. **Database:**
   - Create a `.env` file in `/server` containing `DATABASE_URL` and `JWT_SECRET` (see `server/.env.example` if provided).

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

## Creating a meaningful middleware: The Family & Sibling Privacy Guard

(*Folders:* server/middleware/privacyGuard.mjs, 
*Link:* https://github.com/HannahEleenN/MM207_MoodMate_app/blob/main/server/middleware/privacyGuard.mjs)

**The Need:** Sensitive Emotional Data Protection

**Problem:** MoodMate handles vulnerable data. We have three privacy risks:

- Cross-Family Leaks: Parent A seeing Child B's logs.

- Sibling Peeking: Sibling A seeing Sibling B's logs, which could lead to teasing or conflict.

- Unauthorized Edits: A child accidentally or intentionally deleting a parent’s insight report.

**Solution:** A privacyGuard middleware. It acts as a gatekeeper that verifies Role and Ownership.

- Children: Can only POST (log) their own data and GET their own history.
  In that way, siblings are also blocked from accessing any data where the userId doesn't match their own.

- Parents: Can GET data for any child within their familyId, but cannot modify the child's original logs.

**How it works:** The `privacyGuard` acts as a security interceptor. It extracts the JWT from the request headers, verifies the user's identity, and ensures they have the right to access the specific resource.

**Request Lifecycle:**

1. Client Request: User sends data (e.g., a new mood entry) + JWT.

2. `privacyGuard` Middleware: Validates the token and checks permissions. If invalid, returns `401` or `403`.

3. Mood Controller: Receives the validated request and processes business logic.

4. Database: Data is securely stored in PostgreSQL.
   
`Client Request -> privacyGuard (Auth Check) -> Mood Controller -> Database`

---

## File Extensions:

| Location | Extension | Reason |
| :--- | :--- | :--- |
| **Server** (API, Middleware, Routes) | `.mjs` | Tells Node.js to use ECMAScript Modules (ESM). |
| **Client** (App logic, Service Worker) | `.mjs` | Client modules are ES modules (`.mjs`) and loaded as JavaScript modules in the browser. |
