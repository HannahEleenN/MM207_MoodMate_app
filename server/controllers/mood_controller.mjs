import { Mood } from '../models/mood_model.mjs';

export const createMoodEntry = (req, res) => 
  {
    const { parentId, childName, mood, context } = req.body;

    // Create Norwegian date format here
    const norDate = new Date().toLocaleDateString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const newEntry = Mood.create({
        parentId,
        childName,
        mood,
        context,
        timestamp: norDate
    });

    res.status(201).json(newEntry);
};
