import Mood from '../models/mood_model.mjs';

// Norwegian date format
const formatDate = (date) =>
{
    return date.toLocaleDateString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export const createMood = async (req, res) =>
{
    try {
        // Data from request body
        const { mood, context, solutions } = req.body;

        // Data from privacyGuard middleware (JWT)
        const userId = req.user.id;

        const dateForStorage = formatDate(new Date());

        // Scaffolding the creation logic
        const newEntry =
        {
            userId,
            mood,
            context,
            solutions: solutions || [], // Support for multiple solutions
            timestamp: dateForStorage
        };

        // TODO: Await database insertion via Mood model
        // await Mood.save(newEntry);

        res.status(201).json({
            message: "Mood log created successfully",
            data: newEntry
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to create mood log" });
    }
};

export const getAllMoods = async (req, res) =>
{
    try {
        // Use req.user.id from middleware to fetch only this user's moods
        res.status(200).json({
            message: `Fetched all moods for user ${req.user.id}`,
            data: [] // Placeholder for database results
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch moods" });
    }
};

export const getMoodById = async (req, res) => {
    res.status(200).json({ message: `Details for mood ${req.params.id}` });
};

export const updateMood = async (req, res) => {
    // Logic for adding solutions or updating the mood
    res.status(200).json({ message: "Mood updated" });
};

export const deleteMood = async (req, res) => {
    res.status(204).send();
};