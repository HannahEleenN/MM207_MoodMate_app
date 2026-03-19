import { HTTP, ClientErrors } from '../utils/http_constants.mjs';

export default function errorHandler(err, req, res, _next)
{
    const status = (err && (err.status || err.code)) ? (err.status || err.code) : HTTP.SERVER_ERROR;

    const responseBody = {};

    if (err && err.errorKey) responseBody.errorKey = err.errorKey;
    if (err && err.details) responseBody.details = err.details;

    if (ClientErrors.has(status))
    {
        console.warn(`[${new Date().toISOString()}] Client error:`, err && err.message ? err.message : err);
        responseBody.error = err && err.message ? err.message : 'Invalid request';
        return res.status(status).json(responseBody);
    }

    if (status === HTTP.UNAUTHORIZED || status === HTTP.FORBIDDEN)
    {
        console.warn(`[${new Date().toISOString()}] Auth error:`, err && err.message ? err.message : err);
        responseBody.error = err && err.message ? err.message : 'Access denied';
        return res.status(status).json(responseBody);
    }

    console.error(`[${new Date().toISOString()}] Server error:`, err && err.stack ? err.stack : err);
    responseBody.error = err && err.message ? err.message : 'Internal server error';
    return res.status(status >= 500 ? status : HTTP.SERVER_ERROR).json(responseBody);
}
