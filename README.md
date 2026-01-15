# MoodMate - Interactive Emotion Journal

MoodMate is a full-stack Progressive Web App (PWA) designed for children (ages 6-7) to identify, log, and resolve emotions. Based on a multimedia research prototype, this app bridges the gap between emotional learning and digital journaling.

## 🚀 Feature Map & Requirements

1. **User Accounts:** Secure login for children and parents (PostgreSQL).
2. **Interactive Logging:** Children select core emotions (Glad, Sad, Angry) via an icon-based interface.
3. **Actionable Solutions:** Ability to update logs with solutions (e.g., "Talked to a friend") to promote emotional growth.
4. **Parental Insights:** A dashboard providing parents with advice based on the child's emotional trends.
5. **PWA & Offline Support:** Full functionality even without internet access.

## 🛠 Tech Stack & Architecture

- **Frontend:** HTML5, CSS3, JavaScript (PWA)
- **Backend:** Node.js & Express (REST API)
- **Database:** PostgreSQL (Cloud-ready persistent storage)
- **Project Management:** [Insert Link to GitHub Project Board here]

### Folder Structure (Scaffolding)
- `/client`: Frontend assets, Service Worker, and Manifest.
- `/server`: Node.js logic and API endpoints.
- `db.sql`: Database schema and table definitions.

---

## 📱 Technical Roadmap (PWA & Offline)

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

---

## 📅 Project Management
I am using **GitHub Projects** to break down features into work items. 
- [Link to my Project Board](https://github.com/users/HannahEleenN/projects/3)
