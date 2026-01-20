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
| *Status* | *Critical MVP* | *Status: Value Add* | *Status: Requirement* | *Status: Infrastructure* |


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
├── server_app.js
├── routes
│   ├── mood_routes.js
│   └── user_routes.js
├── controllers
│   ├── mood_controller.js
│   └── user_controller.js
├── models
│   ├── mood_model.js
│   └── user_model.js
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
