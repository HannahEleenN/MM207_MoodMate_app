# MoodMate - Interactive Emotion Journal

MoodMate is a Progressive Web App (PWA) designed for children (ages 6-7) to identify, log, and resolve emotions.
**Note on Language:** Technical documentation and code are in English. The client interface is in Norwegian to accommodate the target audience.

## Feature Map
The following table outlines the core features for the Minimum Viable Product (MVP).

| Priority | Pri 1: Core Loop (Mood) | Pri 2: Context & Solution | Pri 3: Offline & PWA | Pri 4: User Accounts |
|:-------------------|:-------------------|:-------------------|:-------------------|:-------------------|
| *Main Feature* | **Interactive Logging** | **Contextualizing** | **Persistence & PWA** | **Access Control** |
| *Sub-features* | Visual icon selection (Glad, Sad, etc.) | Linking emotion to activity (Why?) | Offline storage (IndexedDB) | Separate Child/Parent login |
| *Requirement* | REST API & PostgreSQL storage | Suggesting coping strategies | Service Worker (Caching) | Persistent Auth (JWT) |
| *Status* | *Critical MVP* | *Value Add* | *Requirement* | *Infrastructure* |


## Project Management
The project is managed using GitHub Projects. Detailed work items and task progress can be found here:
[MoodMate Project Board](https://github.com/users/HannahEleenN/projects/3)

## Scaffolding & Architecture

### Folder Structure

### /client
```plaintext
/client
├── index.html
├── style.css
├── manifest.json
├── client_app.js
├── service_worker.js
├── assets
│   ├── icons
│   └── images
└── modules
    ├── child_app
    │   ├── views
    │   │   ├── mood_checkin_view.js
    │   │   ├── context_view.js
    │   │   └── solution_view.js
    │   ├── child_main.js
    │   └── child_styles.css
    └── parent_app
        ├── views
        │   ├── dashboard_view.js
        │   └── insights_view.js
        ├── parent_main.js
        └── parent_styles.css
```

### /server
```
/server
├── server_app.mjs
├── routes
│   ├── mood_routes.mjs
│   └── user_routes.mjs
├── controllers
│   ├── mood_controller.mjs
│   └── user_controller.mjs
├── models
│   ├── mood_model.mjs
│   └── user_model.mjs
├── middleware
│   └── privacyGuard.mjs
└── database
    └── moodmate_db.sql
```

## Technical Architecture
- **Client:** HTML, CSS, JavaScript (PWA)
- **Server:** Node.js & Express (REST API)
- **Database:** PostgreSQL
- **Security:** Standard Node.js password handling and JWT for sessions.

## How to run the project locally

1. **Clone repository:**
   `git clone https://github.com/HannahEleenN/MM207_MoodMate_app.git`

2. **Server setup:**
   - Navigate to `/server`, run `npm install` and `npm start`.
   - Default port: `http://localhost:3000`

3. **Database:**
   - Configure your `.env` file with `DATABASE_URL`.


## API Documentation

### Mood Logs API

Endpoints for tracking and managing emotional entries. 
*It should be able to add more than one solution, like "deep breathing", "listen to music" and "ask for a hug".*

| Method | Endpoint | Description | Request Body (JSON) | Success Code |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/moods` | Create new mood entry | `{"mood": "sad", "context": "my toy got broken", "solution": "none"}` | `201 Created` |
| **GET** | `/api/moods` | Get all mood entries for the user | *None* | `200 OK` |
| **GET** | `/api/moods/:id` | Get details for one entry | *None* | `200 OK` |
| **PATCH** | `/api/moods/:id` | Update log (e.g. add solution) | `{"solution": "talk to an adult"}` | `200 OK` |
| **DELETE** | `/api/moods/:id` | Remove an entry | *None* | `204 No Content` |


## Creating a meaningful middleware: The Family & Sibling Privacy Guard

**The Need:** Sensitive Emotional Data Protection

**Problem:** MoodMate handles vulnerable data. We have three privacy risks:

- Cross-Family Leaks: Parent A seeing Child B's logs.

- Sibling Peeking: Sibling A seeing Sibling B's logs, which could lead to teasing or conflict.

- Unauthorized Edits: A child accidentally or intentionally deleting a parent’s insight report.

**Solution:** A privacyGuard middleware. It acts as a gatekeeper that verifies Role and Ownership.

- Children: Can only POST (log) their own data and GET their own history.
  In that way, siblings are also blocked from accessing any data where the userId doesn't match their own.

- Parents: Can GET data for any child within their familyId, but cannot modify the child's original logs.

**How it works:** The privacyGuard checks the incoming request headers for x-user-id and x-family-id. It compares these against the requested resource.
If a child attempts to access a userId that is not their own, the middleware terminates the request early with a `403 Forbidden status`.
Similarly, if a parent attempts to access data associated with a familyId other than their own, the request is blocked, preventing cross-family data leaks.

**Note to self about js and mjs:**

| Location | Extension | Reason |
| :--- | :--- | :--- |
| **Server** (API, Middleware, Routes) | `.mjs` | Tells Node.js to use ECMAScript Modules (ESM). |
| **Client** (App logic, Service Worker) | `.js` | Standard for browsers and ensures PWA features work smoothly. |
