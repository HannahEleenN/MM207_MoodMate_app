const users = new Map(); 

function generateID() {
  let id;
  do {
    id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
  } while (users.has(id));  
  return id;
}

function mockHash(string) {
  return btoa(string).split("").reverse().join(""); 
}

export const User = {
    create: (userData) => {
        const id = generateID();
        
        const newUser = {
            id,
            nick: userData.nick,
            secretHash: mockHash(userData.secret),
            role: 'parent', 
            hasConsented: userData.hasConsented, 
            consentedAt: new Date().toISOString(),
          
            // Children-profiles underneath the parent
            children: userData.children || [] 
        };

        users.set(id, newUser);
        return newUser;
    },

    findById: (id) => users.get(id),
    
    // The right to be forgotten
    delete: (id) => users.delete(id),
    
    findAll: () => Array.from(users.values()),

    findByNick: (nick) => {
        return Array.from(users.values()).find(u => u.nick === nick);
    }
};

export default User;
