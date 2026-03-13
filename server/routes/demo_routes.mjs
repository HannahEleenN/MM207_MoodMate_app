import express from 'express';
import { I18n, pickLocale } from '../utils/i18n.mjs';
import { HTTP } from '../utils/http_constants.mjs';

// ---------------------------------------------------------------------------------------------------------------------

const router = express.Router();

const MASTER_USER_ID = 'master-123';

// ---------------------------------------------------------------------------------------------------------------------

router.get('/:id', (req, res) =>
{
    const locale = pickLocale(req.headers['accept-language']);
    const L = I18n[locale];

    const id = req.params.id;
    if (!id) {
        return res.status(HTTP.BAD_REQUEST).json({ error: L.errorCodes.IncorrectId });
    }

    if (id === MASTER_USER_ID) {
        return res.status(HTTP.OK).json({ message: L.info.MasterUserFound });
    }

    return res.status(HTTP.NOT_FOUND).json({ error: L.errorCodes.NotFound });
});

// ---------------------------------------------------------------------------------------------------------------------

export default router;

