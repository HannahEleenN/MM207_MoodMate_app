import * as userService from './user_service.mjs';
import jwt from 'jsonwebtoken';
import { pickLocale, I18n } from '../utils/i18n.mjs';

// Thin HTTP handlers that translate service errors into HTTP responses.

export const registerUser = async (req, res) =>
{
    try {
        const payload = req.body;
        const user = await userService.registerUserData(payload);
        const locale = pickLocale(req.headers['accept-language']);
        const msg = (I18n[locale] && I18n[locale].info && I18n[locale].info.UserCreated) ? I18n[locale].info.UserCreated : 'User created.';
        return res.status(201).json({ message: msg, user });
    } catch (err) {
        const status = err.status || 500;
        const locale = pickLocale(req.headers['accept-language']);
        const errorMessage = (I18n[locale] && I18n[locale].errorCodes && I18n[locale].errorCodes.Unauthorized) ? I18n[locale].errorCodes.Unauthorized : err.message;
        return res.status(status).json({ error: errorMessage });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const createLoginResponse = (res, user, token, req) =>
{
    const locale = pickLocale(req.headers['accept-language']);
    const okMsg = (I18n[locale] && I18n[locale].info && I18n[locale].info.Hello) ? I18n[locale].info.Hello : 'OK';
    return res.status(200).json({ user, token, message: okMsg });
};

export const loginUser = async (req, res) =>
{
    try {
        const { email, secret } = req.body;
        const user = await userService.authenticateSecret(email, secret);
        const secretKey = process.env.JWT_SECRET || 'dev_secret';
        const token = jwt.sign({ id: user.id, role: user.role, familyId: user.familyId }, secretKey, { expiresIn: '8h' });
        return createLoginResponse(res, user, token, req);
    } catch (err) {
        const status = err.status || 500;
        const locale = pickLocale(req.headers['accept-language']);
        let errorMessage = err.message;
        if (err.message && err.message.includes('PIN')) {
            errorMessage = (I18n[locale] && I18n[locale].errorCodes && I18n[locale].errorCodes.Unauthorized) ? I18n[locale].errorCodes.Unauthorized : err.message;
        }
        return res.status(status).json({ error: errorMessage });
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
    listUsers,
    updateUser
};