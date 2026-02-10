let moods = []; 

export const Mood = 
{
    create: (data) => {
        const newMood = 
        {
            id: Math.floor(Math.random() * 1000000).toString(16),
            parentId: data.parentId,
            childName: data.childName,
            mood: data.mood,
            context: data.context,
            timestamp: data.timestamp
        };
        moods.push(newMood);
        return newMood;
    },

    findByParent: (parentId) => moods.filter(m => m.parentId === parentId),

    deleteByParentId: (parentId) => 
    {
        const initialCount = moods.length;
        moods = moods.filter(m => m.parentId !== parentId);
        return initialCount - moods.length;
    },

    findAll: () => moods
};

export default Mood;
