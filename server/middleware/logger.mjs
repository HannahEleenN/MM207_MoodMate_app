export default function logger(req, res, next)
{
    if (req.url.startsWith('/api/')) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - body:`, JSON.stringify(req.body));
    }
    next();
}
