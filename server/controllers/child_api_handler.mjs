import * as Child from '../models/child_server_model.mjs';
import { HTTP } from '../utils/http_constants.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export const createChild = async (req, res, next) =>
{
    try
    {
        const parentId = req.params.parentId;
        const payload = req.body || {};
        payload.parentId = parentId;
        if (!payload.name || !payload.pin) {
            return res.status(HTTP.BAD_REQUEST).json({ error: 'Name and PIN are required' });
        }
        const created = await Child.create(payload);
        return res.status(HTTP.CREATED).json({ child: created });
    } catch (err) {
        return next(err);
    }
};

export const listByParent = async (req, res, next) =>
{
    try {
        const parentId = req.params.parentId;
        const rows = await Child.getByParent(parentId);
        return res.status(HTTP.OK).json({ data: rows });
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const loginByPin = async (req, res, next) =>
{
    try
    {
        const { pin } = req.body || {};
        if (!pin) {
            return res.status(HTTP.BAD_REQUEST).json({ error: 'PIN is required' });
        }
        const child = await Child.findByPin(pin);
        if (!child) {
            return res.status(HTTP.UNAUTHORIZED).json({ error: 'Invalid PIN' });
        }
        const result =
        {
            id: child.id,
            parentId: (child && (child.parentId || child.parent_id)) || null,
            name: child.name
        };
        return res.status(HTTP.OK).json({ child: result });
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default
{
    createChild,
    listByParent,
    loginByPin
};