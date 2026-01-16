# MoodMate - Interactive Emotion Journal

MoodMate is a full-stack Progressive Web App (PWA) designed for children (ages 6-7) to identify, log, and resolve emotions. Based on a multimedia PowerPoint prototype, this app bridges the gap between emotional learning and digital journaling. 
Note on Language: While the technical documentation and code are in English, the client interface will be in Norwegian to ensure accessibility for the target audience (children aged 6-7).

## Folder Structure (Scaffolding)

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

### Visual Feature Map
![MoodMate Feature Map](client/assets/images/feature_map_Moodmate.png)

## User Journey, Feature Map & Requirements
Following Agile principles, the features are organized by the user's flow, to ensure the pedagogical goals from the prototype are met with modern technical requirements:

1. **User Accounts:** 
   Features: Secure login for children and parents.
   Technical: Persistent storage handled by PostgreSQL.
   *Husk: Brukerkontoer som skiller mellom barnets logg og forelderens oversikt.*
   
2. **The "Check-in" (Interactive Logging, "Hva føler jeg nå?"):** 
   Features: Child identifies a core emotion (Glad, Sad, Angry, etc.) using icon-based visual cues.
   Technical: Supported by PWA offline caching, to ensure the app is available even without internet.
   *Husk: Dette er punkt 1: å sette ord (eller ikoner) på selve følelsen.*
   
3. **Contextualizing (The "Why", "Hvorfor føler jeg det sånn?"):**
   Features: Linking the emotion to an activity or reason (happy because of "Playing with friends" or afraid because of "Lightning and thunder").
   Technical: Data is captured via a REST API and stored in the cloud for later reflection.
   *Husk: Dette er punkt 2: å forstå årsaken bak følelsen ved hjelp av bilder.*
   
4. **The "Solution" (Actionable Growth, "Hva kan jeg gjøre?"):**
   Features: Children can select or update their log with a resolution strategy (e.g., "Get a hug", "Talk to a friend" or "Think of something funny") to promote emotional growth.
   Technical: Offline storage via IndexedDB allows for logging solutions even without internet, syncing later when online.
   *Husk: Dette er punkt 3: å finne utveier og mestringsstrategier når de vanskelige følelsene oppstår.*

5. **Parental Overview & Insights:**
   Features: A dashboard where parents can see emotional trends and receive advice.
   Technical: Data is fetched from the server and displayed in a clear, parent-friendly interface.
   *Husk: Foreldrene får innsikt i barnets "hva, hvorfor og løsning".*


## Tech Stack & Architecture
- **Frontend:** HTML5, CSS3, JavaScript (PWA)
- **Backend:** Node.js & Express (REST API)
- **Database:** PostgreSQL (Cloud-ready persistent storage)
- **Project Management:** https://github.com/users/HannahEleenN/projects/3


## User Accounts Architecture

### Overview
The MoodMate app will support two types of users:
- **Child:** Can log emotions, identify causes, and select resolutions.
- **Parent:** Can view child's logs and get insights.

### Authentication & Authorization
- **Login/Signup:** Users will create accounts with email/password.
- **Password Security:** Passwords will be hashed using bcrypt before storing in PostgreSQL.
- **Sessions:** Server will use JWT (JSON Web Tokens) for session management.
- **Access Control:** API endpoints are protected based on user role (child/parent).

### Database Schema
- **Users table:** Stores user_id, name, role (child/parent), email, hashed_password.
- **Logs table:** Each mood entry is linked to a user_id.
- **Sync & Privacy:** Child logs are private; parents can only access their linked child’s logs.

### Planned API Endpoints (REST-ish)
- `POST /api/signup` → create new account
- `POST /api/login` → authenticate user and return JWT
- `GET /api/user/:id` → retrieve user info (auth required)
- `GET /api/logs` → retrieve logs for the logged-in user
- `POST /api/logs` → create a new log entry
- `PATCH /api/logs/:id` → update log entry
- `DELETE /api/logs/:id` → remove log entry

### Notes
- Offline entries from child will be stored locally (IndexedDB) and synced once online.
- Role-based access ensures parents cannot edit child entries, only view them.


## How to run the project locally

### Prerequisites
- Node.js (v18+ recommended)
- npm
- PostgreSQL

### Clone repository
```bash
git clone https://github.com/HannahEleenN/MM207_MoodMate_app.git
cd MM207_MoodMate_app
```

### Server setup
```bash
cd server
npm install
npm start
```
- Runs on [http://localhost:3000](http://localhost:3000)
*The server exposes a basic REST API endpoint at `/api/logs` to verify that the scaffold works.*

### Client setup
- Open [http://localhost:3000/index.html](http://localhost:3000/index.html) to test the scaffold.
- Run server and client in separate terminals for full environment.

### Environment variables
Create a `.env` file in the server folder with:
```
DATABASE_URL=postgresql://username:password@localhost:5432/moodmate
```
*`.env` is excluded from GitHub for security reasons.*


## Technical Roadmap (PWA & Offline)
*The following roadmap outlines planned features for PWA, offline support, and IndexedDB integration.*
To meet the requirements for a modern PWA, the following will be implemented:

### 1. Service Worker (Caching Strategy)
- **Technical:** Implements a proxy to intercept network requests and cache core assets. This ensures the "App Shell" loads instantly without a network.
- *Husk: "Assistenten" som lagrer utseendet på mobilen så appen åpner i flymodus.*

### 2. IndexedDB (Local Persistence)
- **Technical:** A browser-based database used to store mood entries locally when offline. These entries will automatically sync with the PostgreSQL server once the connection is restored.
- *Husk: "Minneboka" som lagrer følelser midlertidig hvis nettet er borte.*

### 3. Web App Manifest
- **Technical:** A `manifest.json` file defining icons, theme colors, and display modes (standalone).
- *Husk: "ID-kortet" som gjør at appen kan installeres på hjemskjermen uten adressefelt.*

### Project Management
I am using **GitHub Projects** to manage the development process. You can follow the progress and see detailed work items here:
[MoodMate Project Board](https://github.com/users/HannahEleenN/projects/3)
