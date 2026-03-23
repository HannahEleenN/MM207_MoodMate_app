import express from 'express';
import './utils/load_env.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import moodRoutes from './routes/mood_routes.mjs';
import parentRoutes from './routes/parent_routes.mjs';
import demoRoutes from './routes/demo_routes.mjs';
import childRoutes from './routes/child_routes.mjs';
import { cors } from './middleware/cors.mjs';
import logger from './middleware/logger.mjs';
import errorHandler from './middleware/error_handler.mjs';

// ---------------------------------------------------------------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------------------------------------------------

app.use(express.json());

app.use(cors);

app.use(logger);

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
app.use('/api/users', parentRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api', childRoutes);

app.use((err, req, res, next) => errorHandler(err, req, res, next));

// ---------------------------------------------------------------------------------------------------------------------

app.listen(PORT, () => {
    console.log(`MoodMate server is running on http://localhost:${PORT}`);
});