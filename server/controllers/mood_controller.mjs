import Mood from '../models/mood_model.mjs';

// Norwegian format
function formatDate(date) 
{
    return date.toLocaleDateString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export const createMoodEntry = (req, res) => 
  {
    const { parentId, childName, mood, context } = req.body;

    const dateForStorage = formatDate(new Date()); 

    const newEntry = Mood.create({
        parentId,
        childName,
        mood,
        context,
        timestamp: dateForStorage
    });

    res.status(201).json(newEntry);
};

