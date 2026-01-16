# MoodMate - Interactive Emotion Journal

MoodMate is a full-stack Progressive Web App (PWA) designed for children (ages 6-7) to identify, log, and resolve emotions. Based on a multimedia research prototype, this app bridges the gap between emotional learning and digital journaling. Note on Language: While the technical documentation and code are in English, the client interface will be in Norwegian to ensure accessibility for the target audience (children aged 6-7).


## User Journey, Feature Map & Requirements
Following Agile principles, the features are organized by the user's flow, to ensure the pedagogical goals from the prototype are met with modern technical requirements:

1. **User Accounts:** 
   Features: Secure login for children and parents.
   Technical: Persistent storage handled by PostgreSQL.
   *Husk: Brukerkontoer som skiller mellom barnets logg og forelderens oversikt.*
   
2. **The "Check-in" (Interactive Logging, "Hva føler jeg nå?"):** 
   Features: Child identifies a core emotion (Glad, Sad, Angry, etc.) using icon-based visual cues defined in the research prototype.
   Technical: Supported by PWA offline caching to ensure the app is available even without internet.
   *Husk: Dette er punkt 1 – å sette ord (eller ikoner) på selve følelsen.*
   
3. **Contextualizing (The "Why", "Hvorfor føler jeg det sånn?"):**
   Features: Linking the emotion to an activity or reason (e.g., "Playing with friends" or "Lightning and thunder").
   Technical: Data is captured via a REST'ish API and stored in the cloud for later reflection.
   *Husk: Dette er punkt 2 – å forstå årsaken bak følelsen ved hjelp av bildene fra prototypen.*
   
4. **The "Solution" (Actionable Growth, "Hva kan jeg gjøre?"):**
   Features: Based on the prototype's goals, children can select or update their log with a resolution strategy (e.g., "Get a hug", "Talk to a friend" or "Think of something funny") to promote emotional growth.
   Technical: Offline storage via IndexedDB allows for logging solutions even without internet, syncing later when online.
   *Husk: Dette er punkt 3 – å finne utveier og mestringsstrategier når de vanskelige følelsene oppstår.*

5. **Parental Overview & Insights:**
   Features: A data-driven dashboard where parents can see emotional trends and receive advice.
   Technical: Data is fetched from the server and displayed in a clear, parent-friendly interface.
   *Husk: Foreldrene får innsikt i barnets "hva, hvorfor og løsning" over tid.*


## Tech Stack & Architecture
- **Frontend:** HTML5, CSS3, JavaScript (PWA)
- **Backend:** Node.js & Express (REST API)
- **Database:** PostgreSQL (Cloud-ready persistent storage)
- **Project Management:** https://github.com/users/HannahEleenN/projects/3

### Folder Structure (Scaffolding)
- `/client`: Frontend assets, Service Worker, and Manifest.
- `/server`: Node.js logic and API endpoints.
- `db.sql`: Database schema and table definitions.


## How to run the project locally

### Prerequisites
- Node.js (v18+ recommended)
- npm
- PostgreSQL

### Clone repository
git clone https://github.com/HannahEleenN/MM207_MoodMate_app.git
cd MM207_MoodMate_app

### Server setup
cd server
npm install
npm start

*The server runs on http://localhost:3000 and exposes a basic REST API endpoint at `/api/logs` to verify that the scaffold works.*

### Client setup
cd client
npm install
npm start

### Environment variables
Create a `.env` file in the server folder with:
DATABASE_URL=...
*.env is excluded from GitHub for security reasons.*


## Technical Roadmap (PWA & Offline)
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


## Project Management
I am using **GitHub Projects** to break down features into work items. 
- [Link to my Project Board](https://github.com/users/HannahEleenN/projects/3)
