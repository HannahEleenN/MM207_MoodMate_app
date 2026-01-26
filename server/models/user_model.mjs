// Internal state to track active users (Note: this resets if the server restarts)
const users = new Map(); 

// Creates a new user object template
export function createUser(nick = "") 
{
  return {
    id: generateID(),
    nick: nick
  };
}

// Generates a unique hexadecimal ID and ensures no collisions
function generateID() 
{
  let id;
  do {
    // Generate a random hex string
    id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
  } while (users.has(id)); // Check if ID already exists in our map
  
  return id;
}

// Export the functions to be used in controllers or routes
export default {
  createUser,
  users
};
