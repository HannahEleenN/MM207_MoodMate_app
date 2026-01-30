const moods = [];

export const Mood = 
{
    create: (data) => 
      {
        const newMood = 
        {
            id: Date.now().toString(),
            parentId: data.parentId,
            childName: data.childName,
            mood: data.mood,
            context: data.context,
            timestamp: data.timestamp || new Date().toISOString() 
        };
        moods.push(newMood);
        return newMood;
    }
};
