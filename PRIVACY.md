# Privacy Policy - MoodMate

This document outlines how MoodMate handles user data, ensuring compliance with GDPR principles and protecting the privacy of our young users and their guardians.

## 1. Data Collection & Minimization
In accordance with the principle of **Data Minimization**, we only collect the bare minimum of information required to provide the core functionality of the emotion journal.

### User Data Definition
The following fields are stored for each account:
* **ID:** A randomly generated hex-string (Anonymous internal identifier).
* **Nickname:** A display name for the parent/guardian (No full legal name required).
* **Scrambled Secret:** A mock-hashed version of the user's secret code to ensure security without storing plain-text passwords.
* **Consent Flag:** A boolean value and a timestamp (`consentedAt`) as legal proof of parental agreement.
* **Children Profiles:** A list of first names/nicknames to allow multiple children to use the same parent account without sharing logs.

## 2. Purpose of Processing
We process this data solely to:
* Allow parents and children to log emotional entries over time.
* Visualize mood trends and coping strategies for the family.

## 3. Parental Consent & Children's Privacy
MoodMate is designed for children aged 6-7. As children under 13 cannot legally provide their own consent, **active parental consent** is a prerequisite for account creation. 
* Registration is disabled until the guardian has explicitly checked the consent box.
* Guardians act as the primary account owners.

## 4. Security & Storage
* **No Plain-text Passwords:** All secrets are "scrambled" (hashed) before storage.
* **In-Memory Storage:** For this version of the application, data is stored in the server's volatile memory (RAM). This means data is not persisted if the server restarts, further limiting long-term data exposure.

## 5. Your Rights (GDPR)
* **The Right to be Forgotten:** Users can delete their account at any time. Deleting a parent account immediately purges all associated nicknames, secrets, and mood logs from our system.
* **Access & Portability:** Users can request to see the data associated with their ID.
