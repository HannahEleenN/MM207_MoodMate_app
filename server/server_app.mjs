import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import moodRoutes from './routes/mood_routes.mjs';
import userRoutes from './routes/user_routes.mjs';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Simple CORS middleware for development to allow requests from preview servers (e.g., JetBrains)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Simple request logger to help debug incoming API calls
app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - body:`, JSON.stringify(req.body));
    }
    next();
});

app.use(express.static(path.join(__dirname, '../client')));

app.use('/api/moods', moodRoutes);

// Mount user router (moved out of single controller file)
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
    console.log(`MoodMate server is running on http://localhost:${PORT}`);
});