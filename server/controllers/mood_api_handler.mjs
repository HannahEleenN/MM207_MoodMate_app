import Mood from '../models/mood_server_model.mjs';
import Draft from '../models/draft_server_model.mjs';
import { pickLocale, I18n } from '../utils/i18n.mjs';

// ---------------------------------------------------------------------------------------------------------------------

const formatDate = (date) =>
{
    return date.toLocaleDateString('no-NO',
    {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const _draftStore = new Map();

// ---------------------------------------------------------------------------------------------------------------------

export const createMood = async (req, res) =>
{
    try
    {
        console.log('[createMood] incoming body:', req.body);
        console.log('[createMood] req.user:', req.user);

        const { mood, context, solution, note } = req.body;
        const userId = req.user && (req.user.userId || req.user.id);
        const dateForStorage = formatDate(new Date());

        const newEntry =
        {
            userId,
            mood,
            context,
            solution: solution || null,
            note: note || '',
            timestamp: dateForStorage
        };

        if (Mood && Mood.create)
        {
            console.log('[createMood] calling Mood.create with:', newEntry);
            await Mood.create(newEntry);
            console.log('[createMood] Mood.create succeeded');
        } else {
            console.warn('[createMood] Mood model not available');
        }

        const locale = pickLocale(req.headers['accept-language']);
        const msg = (I18n[locale] && I18n[locale].info && I18n[locale].info.MoodSaved) ? I18n[locale].info.MoodSaved : 'Mood saved';

        res.status(201).json
        ({
            message: msg,
            data: newEntry
        });
    } catch (error)
    {
        console.error('createMood error:', error);
        const locale = pickLocale(req.headers['accept-language']);
        const errMsg = (I18n[locale] && I18n[locale].errorCodes && I18n[locale].errorCodes.NotFound) ? I18n[locale].errorCodes.NotFound : 'Could not save mood';
        return res.status(500).json({ error: errMsg, message: error.message });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const getAllMoods = async (req, res) =>
{
    try
    {
        const userId = req.user && (req.user.userId || req.user.id);
        const rows = Mood && Mood.findByUser ? await Mood.findByUser(userId) : [];
        const locale = pickLocale(req.headers['accept-language']);
        const msg = (I18n[locale] && I18n[locale].info && I18n[locale].info.MoodsFetched) ? I18n[locale].info.MoodsFetched : `Fetched moods for user ${userId}`;
        res.status(200).json
        ({
            message: msg,
            data: rows
        });
    } catch (error)
    {
        console.error('getAllMoods error:', error);
        const locale = pickLocale(req.headers['accept-language']);
        const errMsg = (I18n[locale] && I18n[locale].errorCodes && I18n[locale].errorCodes.NotFound) ? I18n[locale].errorCodes.NotFound : 'Could not fetch moods';
        res.status(500).json({ error: errMsg });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const getMoodById = async (req, res) => {
    res.status(200).json({ message: `Detaljer for humør ${req.params.id}` });
};

// ---------------------------------------------------------------------------------------------------------------------

export const updateMood = async (req, res) => {
    res.status(200).json({ message: "Humør oppdatert" });
};

// ---------------------------------------------------------------------------------------------------------------------

export const deleteMood = async (req, res) => {
    res.status(204).send();
};

// ---------------------------------------------------------------------------------------------------------------------

export const saveDraft = async (req, res) =>
{
    try
    {
        const userId = req.user && (req.user.userId || req.user.id);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const profileId = req.query.profileId || (req.body && req.body.profileId) || null;
        const draft = req.body || {};

        try {
            await Draft.upsert(userId, profileId, draft);
            return res.status(200).json(draft);
        } catch (dbErr) {
            console.warn('Draft DB upsert failed, falling back to in-memory store', dbErr && dbErr.message ? dbErr.message : dbErr);
            _draftStore.set(profileId ? `${userId}:${profileId}` : `${userId}`, { draft, savedAt: new Date().toISOString() });
            return res.status(200).json(draft);
        }
    } catch (err) {
        console.error('saveDraft error:', err);
        return res.status(500).json({ error: 'Could not save draft' });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const getDraft = async (req, res) =>
{
    try
    {
        const userId = req.user && (req.user.userId || req.user.id);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const profileId = req.query.profileId || null;

        try {
            const row = await Draft.get(userId, profileId);
            if (!row || !row.draft) return res.status(404).json({ message: 'No draft found' });
            const draftObj = (typeof row.draft === 'string') ? JSON.parse(row.draft) : row.draft;
            return res.status(200).json(draftObj);
        } catch (dbErr) {
            console.warn('Draft DB read failed, falling back to in-memory store', dbErr && dbErr.message ? dbErr.message : dbErr);
            const item = _draftStore.get(profileId ? `${userId}:${profileId}` : `${userId}`) || null;
            if (!item) return res.status(404).json({ message: 'No draft found' });
            return res.status(200).json(item.draft);
        }
    } catch (err) {
        console.error('getDraft error:', err);
        return res.status(500).json({ error: 'Could not fetch draft' });
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const deleteDraft = async (req, res) =>
{
    try
    {
        const userId = req.user && (req.user.userId || req.user.id);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const profileId = req.query.profileId || null;

        try {
            await Draft.delete(userId, profileId);
            return res.status(204).send();
        } catch (dbErr) {
            console.warn('Draft DB delete failed, falling back to in-memory store', dbErr && dbErr.message ? dbErr.message : dbErr);
            _draftStore.delete(profileId ? `${userId}:${profileId}` : `${userId}`);
            return res.status(204).send();
        }
    } catch (err) {
        console.error('deleteDraft error:', err);
        return res.status(500).json({ error: 'Could not delete draft' });
    }
};