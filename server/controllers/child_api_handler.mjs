import * as Child from '../models/child_server_model.mjs';
import { HTTP } from '../utils/http_constants.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export const createChild = async (req, res, next) =>
{
    try
    {
        let parentId = req.params.parentId;
        if (!parentId && req.user) {
            parentId = req.user.id || req.user.userId;
        }
        
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
        let parentId = req.params.parentId;
        if (!parentId && req.user) {
            parentId = req.user.id || req.user.userId;
        }
        
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
            parentId: (child && (child.parentId || child['parent_id'])) || null,
            name: child.name
        };
        return res.status(HTTP.OK).json({ child: result });
    } catch (err) {
        return next(err);
    }
};

export const updateChild = async (req, res, next) =>
{
    try
    {
        const childId = req.params.childId;
        const payload = req.body || {};
        
        if (!childId) {
            return res.status(HTTP.BAD_REQUEST).json({ error: 'Child ID is required' });
        }

        const child = await Child.getById(childId);
        if (!child) {
            return res.status(HTTP.NOT_FOUND).json({ error: 'Child not found' });
        }
        
        const parentId = req.user ? (req.user.id || req.user.userId) : null;
        if (child.parentId !== parentId && child['parent_id'] !== parentId) {
            return res.status(HTTP.UNAUTHORIZED).json({ error: 'Unauthorized' });
        }
        
        const updated = await Child.update(childId, payload);
        return res.status(HTTP.OK).json({ child: updated });
    } catch (err) {
        return next(err);
    }
};

export const deleteChild = async (req, res, next) =>
{
    try
    {
        const childId = req.params.childId;
        
        if (!childId) {
            return res.status(HTTP.BAD_REQUEST).json({ error: 'Child ID is required' });
        }
        
        // Verify the child belongs to the authenticated user
        const child = await Child.getById(childId);
        if (!child) {
            return res.status(HTTP.NOT_FOUND).json({ error: 'Child not found' });
        }
        
        const parentId = req.user ? (req.user.id || req.user.userId) : null;
        if (child.parentId !== parentId && child['parent_id'] !== parentId) {
            return res.status(HTTP.UNAUTHORIZED).json({ error: 'Unauthorized' });
        }
        
        await Child.deleteChild(childId);
        return res.status(HTTP.OK).json({ success: true });
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default
{
    createChild,
    listByParent,
    loginByPin,
    updateChild,
    deleteChild
};