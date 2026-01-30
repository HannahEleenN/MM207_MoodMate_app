const users = new Map(); 

/**
 * @section GDPR & Data Minimization
 * We only store what is strictly necessary for a functioning emotion journal. 
 * - Parent account: Nickname and scrambled secret. [cite: 3, 4]
 * - Child profiles: Name and 4-digit PIN (scrambled). [cite: 6]
 * - Legal: Consent flag and timestamp. 
 */

function generateID() {
  let id;
  do {
    id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
  } while (users.has(id));  
  return id;
}

function mockHash(string) {
  // Simple "scramble" to avoid plain text storage 
  return btoa(string).split("").reverse().join(""); 
}

export const User = {
    // 1. Create the main parent account 
    create: (userData) => {
        const id = generateID();
        const newUser = {
            id,
            nick: userData.nick,
            secretHash: mockHash(userData.secret), // 
            hasConsented: userData.hasConsented, // 
            consentedAt: new Date().toISOString(),
            profiles: [] // Container for child profiles [cite: 2]
        };
        users.set(id, newUser);
        return newUser;
    },

    // 2. Add a child profile to an existing parent account
    addChildProfile: (parentId, childName, pin) => {
        const user = users.get(parentId);
        if (!user) return null;

        const newProfile = {
            profileId: generateID(),
            name: childName,
            pinHash: mockHash(pin), // Sibling privacy protection 
            role: "child" // [cite: 2]
        };

        user.profiles.push(newProfile);
        return newProfile;
    },

    // 3. Helper functions for the controller
    findById: (id) => users.get(id),
    
    findByNick: (nick) => {
        return Array.from(users.values()).find(u => u.nick === nick);
    },

    findAll: () => Array.from(users.values()),

    // 4. "The Right to be Forgotten" - Deletes parent and all sub-profiles 
    delete: (id) => users.delete(id)
};

export default User;
