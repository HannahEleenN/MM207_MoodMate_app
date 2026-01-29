import { User } from '../models/user_model.mjs';

export const registerUser = (req, res) => {
    const { email, password, hasConsented } = req.body;

    // 1. Validation of consent
    if (hasConsented !== true) {
        return res.status(400).json({ 
            error: "Du må aktivt samtykke til vilkårene og personvernerklæringen for å opprette konto." 
        });
    }

    // 2. Check if the user exists?
    
    // 3. Create a new user
    const newUser = User.create({ email, password, hasConsented });

    res.status(201).json({
        message: "Bruker opprettet med foreldresamtykke.",
        user: { id: newUser.id, email: newUser.email }
    });
};

export const deleteUserAccount = (req, res) => 
  {
    const { userId } = req.params;

    const user = User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: "Bruker ikke funnet." });
    }

    // The right to be forgotten
    User.delete(userId);

    res.status(200).json({ 
        message: "Brukerkonto og alle tilknyttede data er slettet i tråd med GDPR." 
    });
};
