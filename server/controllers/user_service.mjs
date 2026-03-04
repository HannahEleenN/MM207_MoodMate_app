import * as userService from './user_service.mjs';
import jwt from 'jsonwebtoken';
import Child from '../models/child_server_model.mjs';

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

        // Authenticate using email + secret
        const user = await userService.authenticateSecret(email, secret);

        // Create a signed JWT so clients can call protected endpoints
        const secretKey = process.env.JWT_SECRET || 'dev_secret';
        const token = jwt.sign({ id: user.id, role: user.role || 'parent' }, secretKey, { expiresIn: '8h' });

        // Fetch children for this parent (if any)
        let kids = [];
        try {
            kids = await Child.getByParent(user.id);
        } catch (e) {
            kids = [];
        }

        const userPayload = {
            id: user.id,
            nick: user.nick,
            email: user.email || null,
            role: user.role || 'parent',
            profiles: (kids || []).map(k => ({ id: String(k.id), name: k.name }))
        };

        return res.status(200).json({ user: userPayload, token });
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

export const listUsers = async (req, res) =>
{
    try {
        const rows = await userService.listAllUsers();
        return res.status(200).json({ data: rows });
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const updateUser = async (req, res) =>
{
    try {
        const id = req.params.id;
        const payload = req.body;
        const updated = await userService.updateUserById(id, payload);
        return res.status(200).json({ user: updated });
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
    deleteAccount: deleteUserAccount,
    list: listUsers,
    update: updateUser
};