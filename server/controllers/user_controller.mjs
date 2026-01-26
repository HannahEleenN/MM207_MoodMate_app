import UserModel from './user_model.mjs';

// Example usage in a route
const newUser = UserModel.createUser("HappyUser123");
UserModel.users.set(newUser.id, newUser);
