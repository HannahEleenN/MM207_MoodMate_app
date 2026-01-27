const users = new Map(); 

// Creates a new user object template
// Added 'secret' for the "passwordless" requirement and 'consent' for GDPR
export function createUser(nick = "", secret = "", consent = false) {
  return {
    id: generateID(),
    nick: nick,
    secretHash: mockHash(secret), // "Never use passwords" -> Store a scramble instead
    consent: consent,             // Requirement: Must actively consent
    created: new Date().toISOString()
  };
}

export function deleteUser(id) {
  return users.delete(id);
}

function generateID() {
  let id;
  do {
    id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
  } while (users.has(id)); 
  
  return id;
}

// Helper to scramble the "password"
function mockHash(string) {
  return btoa(string).split("").reverse().join(""); 
}

export default {
  createUser,
  users,
  deleteUser
};
