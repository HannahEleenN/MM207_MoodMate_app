import * as userService from './user_service.mjs';

 // Thin HTTP handlers that translate service errors into HTTP responses.

export const registerUser = async (req, res) =>
{
    try {
        const payload = req.body;
        const user = await userService.registerUserData(payload);
        return res.status(201).json({
            message: "Bruker opprettet med foreldresamtykke.",
            user
        });
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const loginUser = async (req, res) =>
{
    try {
        const { email, secret } = req.body;
        const user = await userService.authenticateSecret(email, secret);
        return res.status(200).json({ user });
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const deleteUserAccount = async (req, res) =>
{
    try {
        const result = await userService.deleteUserById(req.params.id);
        return res.status(200).json(result);
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default
{
    register: registerUser,
    login: loginUser,
    deleteAccount: deleteUserAccount
};