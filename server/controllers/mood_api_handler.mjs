import Mood from '../models/mood_server_model.mjs';
import { pickLocale, I18n } from '../utils/i18n.mjs';

// Norwegian date format
const formatDate = (date) =>
{
    return date.toLocaleDateString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// ---------------------------------------------------------------------------------------------------------------------
// Controller for Mood API endpoints (CRUD operations for mood logs).

export const createMood = async (req, res) =>
{
    try {
        console.log('[createMood] incoming body:', req.body);
        console.log('[createMood] req.user:', req.user);

        // Data from request body
        const { mood, context, solution, note } = req.body;

        // Data from privacyGuard middleware (JWT)
        const userId = req.user && (req.user.userId || req.user.id);

        const dateForStorage = formatDate(new Date());

        // Scaffolding the creation logic
        const newEntry =
        {
            userId,
            mood,
            context,
            solution: solution || null,
            note: note || '',
            timestamp: dateForStorage
        };

        // Persist via Mood model (ensure model supports solution)
        if (Mood && Mood.create) {
            console.log('[createMood] calling Mood.create with:', newEntry);
            await Mood.create(newEntry);
            console.log('[createMood] Mood.create succeeded');
        } else {
            console.warn('[createMood] Mood model not available');
        }

        const locale = pickLocale(req.headers['accept-language']);
        const msg = (I18n[locale] && I18n[locale].info && I18n[locale].info.MoodSaved) ? I18n[locale].info.MoodSaved : 'Mood saved';

        res.status(201).json({
            message: msg,
            data: newEntry
        });
    } catch (error) {
        console.error('createMood error:', error);
        const locale = pickLocale(req.headers['accept-language']);
        const errMsg = (I18n[locale] && I18n[locale].errorCodes && I18n[locale].errorCodes.NotFound) ? I18n[locale].errorCodes.NotFound : 'Could not save mood';
        return res.status(500).json({ error: errMsg, message: error.message });
    }
};

// ---------------------------------------------------------------------------------------------------------------------
// Additional endpoints for fetching, updating, and deleting mood logs.

export const getAllMoods = async (req, res) =>
{
    try {
        // Use req.user.id from middleware to fetch only this user's moods
        const userId = req.user && (req.user.userId || req.user.id);
        const rows = Mood && Mood.findByUser ? await Mood.findByUser(userId) : [];
        const locale = pickLocale(req.headers['accept-language']);
        const msg = (I18n[locale] && I18n[locale].info && I18n[locale].info.MoodsFetched) ? I18n[locale].info.MoodsFetched : `Fetched moods for user ${userId}`;
        res.status(200).json({
            message: msg,
            data: rows
        });
    } catch (error) {
        console.error('getAllMoods error:', error);
        const locale = pickLocale(req.headers['accept-language']);
        const errMsg = (I18n[locale] && I18n[locale].errorCodes && I18n[locale].errorCodes.NotFound) ? I18n[locale].errorCodes.NotFound : 'Could not fetch moods';
        res.status(500).json({ error: errMsg });
    }
};

// ---------------------------------------------------------------------------------------------------------------------
// Fetch a specific mood log by ID (for details view)

export const getMoodById = async (req, res) => {
    res.status(200).json({ message: `Detaljer for humør ${req.params.id}` });
};

// ---------------------------------------------------------------------------------------------------------------------
// Update a mood log (e.g., add solutions or edit context)

export const updateMood = async (req, res) => {
    // Logic for adding solutions or updating the mood
    res.status(200).json({ message: "Humør oppdatert" });
};

// ---------------------------------------------------------------------------------------------------------------------
// Delete a mood log.

export const deleteMood = async (req, res) => {
    res.status(204).send();
};