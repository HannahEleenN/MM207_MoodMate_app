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
app.use(express.static(path.join(__dirname, '../client')));

app.use('/api/moods', moodRoutes);

// Mount user router (moved out of single controller file)
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
    console.log(`MoodMate server is running on http://localhost:${PORT}`);
});