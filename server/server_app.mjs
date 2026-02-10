import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import moodRoutes from './routes/mood_routes.mjs';
import userController from './controllers/user_api_handler.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

// To handle paths in ES Modules (replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, '../client'))); // Serve static frontend files

// Use mood routes to handle /api/moods endpoints
app.use('/api/moods', moodRoutes);

// User endpoints
app.post('/api/users', userController.register);
app.delete('/api/users/:id', userController.deleteAccount);

// Start server
app.listen(PORT, () => {
    console.log(`MoodMate server is running on http://localhost:${PORT}`);
});