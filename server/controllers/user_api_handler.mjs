import * as userService from './user_service.mjs';
import jwt from 'jsonwebtoken';
import { pickLanguage, I18n } from '../utils/i18n.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export const registerUser = async (req, res, next) =>
{
    try
    {
        const payload = req.body;
        const user = await userService.registerUserData(payload);
        const locale = pickLanguage(req.headers['accept-language']);
        const msg = (I18n[locale] && I18n[locale].info && I18n[locale].info.UserCreated) ? I18n[locale].info.UserCreated : 'User created.';
        return res.status(201).json({ message: msg, user });
    } catch (err)
    {
        return next(err);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const createLoginResponse = (res, user, token, req) =>
{
    const locale = pickLanguage(req.headers['accept-language']);
    const okMsg = (I18n[locale] && I18n[locale].info && I18n[locale].info.Hello) ? I18n[locale].info.Hello : 'OK';
    return res.status(200).json({ user, token, message: okMsg });
};

// ---------------------------------------------------------------------------------------------------------------------

export const loginUser = async (req, res, next) =>
{
    try
    {
        const { email, secret } = req.body;
        const user = await userService.authenticateSecret(email, secret);
        const secretKey = process.env.JWT_SECRET || 'dev_secret';
        const token = jwt.sign({ id: user.id, role: user.role, familyId: user.familyId }, secretKey, { expiresIn: '8h' });
        return createLoginResponse(res, user, token, req);
    } catch (err)
    {
        return next(err);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const logoutUser = async (req, res, next) =>
{
    try {
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const deleteUserAccount = async (req, res, next) =>
{
    try {
        const result = await userService.deleteUserById(req.params.id);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const listUsers = async (req, res, next) =>
{
    try {
        const rows = await userService.listAllUsers();
        return res.status(200).json({ data: rows });
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const updateUser = async (req, res, next) =>
{
    try
    {
        const id = req.params.id;
        const payload = req.body;
        const updated = await userService.updateUserById(id, payload);
        return res.status(200).json({ user: updated });
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default
{
    register: registerUser,
    login: loginUser,
    logout: logoutUser,
    deleteAccount: deleteUserAccount,
    listUsers,
    updateUser
};