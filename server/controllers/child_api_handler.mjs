import * as Child from '../models/child_server_model.mjs';
import { HTTP } from '../utils/http_constants.mjs';

const verifyChildOwnership = async (childId, parentId) =>
{
    const child = await Child.getById(childId);
    if (!child) {
        return { valid: false, error: 'Child not found', statusCode: HTTP.NOT_FOUND };
    }
    
    if (child.parentId !== parentId && child['parent_id'] !== parentId) {
        return { valid: false, error: 'Unauthorized', statusCode: HTTP.UNAUTHORIZED };
    }
    
    return { valid: true, child };
};

const validateAndVerifyChild = async (childId, req) =>
{
    if (!childId) {
        return { valid: false, error: 'Child ID is required', statusCode: HTTP.BAD_REQUEST };
    }
    
    const parentId = req.user ? (req.user.id || req.user.userId) : null;
    return await verifyChildOwnership(childId, parentId);
};

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
        if (!payload.name) {
            return res.status(HTTP.BAD_REQUEST).json({ error: 'Name is required' });
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
        
        let child = null;
        const parentId = req.user ? (req.user.id || req.user.userId) : null;

        if (parentId)
        {
            child = await Child.findByPinWithParent(parentId, pin);
        } else {
            child = await Child.findByPin(pin);
        }
        
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
        
        const verification = await validateAndVerifyChild(childId, req);
        if (!verification.valid) {
            return res.status(verification.statusCode).json({ error: verification.error });
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
        
        const verification = await validateAndVerifyChild(childId, req);
        if (!verification.valid) {
            return res.status(verification.statusCode).json({ error: verification.error });
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
