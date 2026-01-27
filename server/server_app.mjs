import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import moodRoutes from './routes/mood_routes.mjs';
import UserController from './controllers/user_controller.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

// To handle paths in ES Modules (replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, '../client'))); // Serve static frontend files

// Use mood routes
app.use('/api/moods', moodRoutes);

// --- API ENDPOINTS ---

// Route to create a user
app.post('/api/users', UserController.register);

// Route to delete a user by their ID
app.delete('/api/users/:id', UserController.deleteAccount);

// GET: Basic log message
app.get('/api/logs', (req, res) => {
    res.json({ message: "The logs from the database will appear here!" });
});

// POST: Create a new mood log (Scaffold)
app.post('/api/moods', (req, res) => {
    const { mood, context, solution } = req.body;

    // Logic for database saving will go here later
    console.log(`Received mood: ${mood}, Context: ${context}`);

    res.status(201).json({
        message: "Mood log received (Scaffold)",
        data: { mood, context, solution }
    });
});

// GET: All mood logs (Scaffold)
app.get('/api/moods', (req, res) => {
    res.json({ message: "This will return all mood logs from database." });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
