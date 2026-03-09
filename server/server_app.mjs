import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import moodRoutes from './routes/mood_routes.mjs';
import userRoutes from './routes/user_routes.mjs';
import demoRoutes from './routes/demo_routes.mjs';

// ---------------------------------------------------------------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// ---------------------------------------------------------------------------------------------------------------------
// Simple CORS middleware for development to allow requests from preview servers (e.g., JetBrains)
app.use((req, res, next) =>
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// ---------------------------------------------------------------------------------------------------------------------
// Simple request logger to help debug incoming API calls

app.use((req, res, next) =>
{
    if (req.url.startsWith('/api/')) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - body:`, JSON.stringify(req.body));
    }
    next();
});

app.use(express.static(path.join(__dirname, '../client'),
{
    setHeaders: (res, filePath) =>
    {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.match(/\.(js|mjs|css)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// ---------------------------------------------------------------------------------------------------------------------

app.use('/api/moods', moodRoutes);
app.use('/api/users', userRoutes);
app.use('/api/demo', demoRoutes);

app.listen(PORT, () => {
    console.log(`MoodMate server is running on http://localhost:${PORT}`);
});