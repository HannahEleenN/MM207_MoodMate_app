import UserModel from './user_model.mjs';

const UserController = {
  
  // Create account (POST)
  register: (req, res) => {
    const { nick, secret, consent } = req.body;

    // 1. GDPR Requirement: Active Consent
    if (!consent) {
      return res.status(400).json({ error: "Consent to Terms of Service is required." });
    }

    // 2. Simple validation
    if (!nick || !secret) {
      return res.status(400).json({ error: "Nickname and secret are required." });
    }

    // 3. Check if user already exists
    const userExists = Array.from(UserModel.users.values()).some(u => u.nick === nick);
    if (userExists) {
      return res.status(400).json({ error: "This nickname is already taken." });
    }

    // 4. Create the user using the Hybrid Model logic
    const newUser = UserModel.createUser(nick, secret, consent);
    UserModel.users.set(newUser.id, newUser);

    // 5. Response (Don't send back the secretHash!)
    res.status(201).json({
      message: "User created successfully",
      user: { id: newUser.id, nick: newUser.nick }
    });
  },

  deleteAccount: (req, res) => {
    const { id } = req.params;

    if (UserModel.users.has(id)) {
      UserModel.deleteUser(id);
      return res.status(200).json({ message: "Account and all associated data deleted." });
    }

    res.status(404).json({ error: "User not found." });
  }
};

export default UserController;
