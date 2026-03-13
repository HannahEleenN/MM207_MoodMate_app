import * as Child from '../models/child_server_model.mjs';
import { pickLocale, I18n } from '../utils/i18n.mjs';
import { HTTP } from '../utils/http_constants.mjs';
import { authorizeUserIdentity } from '../middleware/privacyGuard.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export const createChild = async (req, res) =>
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
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
    }
};

export const listByParent = async (req, res) =>
{
    try {
        const parentId = req.params.parentId;
        const rows = await Child.getByParent(parentId);
        return res.status(HTTP.OK).json({ data: rows });
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const loginByPin = async (req, res) =>
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
            parentId: child.parent_id || child.parentId,
            name: child.name
        };
        return res.status(HTTP.OK).json({ child: result });
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default
{
    createChild,
    listByParent,
    loginByPin
};

