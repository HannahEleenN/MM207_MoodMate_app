import User from '../models/user_server_model.mjs';
import Mood from '../models/mood_server_model.mjs';

export const registerUser = (req, res) => 
    {
    const { nick, secret, hasConsented } = req.body;

    // 1. Validation of consent
    if (hasConsented !== true) {
        return res.status(400).json({ 
            error: "Du må aktivt samtykke til vilkårene og personvernerklæringen for å opprette konto." 
        });
    }

    // 2. Check if the nickname is taken
    if (User.findByNick(nick)) {
        return res.status(400).json({ error: "Dette kallenavnet er allerede i bruk." });
    }
    
    // 3. Create the new user
    const newUser = User.create({ nick, secret, hasConsented });

    res.status(201).json({
        message: "Bruker opprettet med foreldresamtykke.",
        user: { id: newUser.id, nick: newUser.nick }
    });
};

export const loginUser = (req, res) =>
{
    const { secret } = req.body;

    if (!secret) return res.status(400).json({ error: 'Missing secret' });

    const user = User.findBySecret(secret);
    if (!user) return res.status(404).json({ error: 'User not found or incorrect secret' });

    // Return minimal user object (GDPR / minimization)
    return res.status(200).json({ user: { id: user.id, nick: user.nick } });
};

export const deleteUserAccount = (req, res) =>
{
    const userId = req.params.id;

    const user = User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: "Bruker ikke funnet." });
    }

    // 1. Delete all children mood logs first
    Mood.deleteByParentId(userId);

    // 2. Delete the parent account (including profiles and consent)
    User.delete(userId);

    res.status(200).json({ 
        message: "Brukerkonto og alle tilknyttede humør-logger er slettet permanent." 
    });
};

const userController =
{
    register: registerUser,
    deleteAccount: deleteUserAccount,
    login: loginUser
};

export default userController;