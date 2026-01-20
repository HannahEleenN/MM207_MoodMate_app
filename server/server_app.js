"use strict";

const express = require('express');
const app = express();
const PORT = 3000;

// Middleware for reading JSON from Insomnia
app.use(express.json());

// SCAFFOLD: Mood Logging Endpoint
app.post('/api/moods', (req, res) => 
{
    const { mood, context, solution } = req.body;
    
    // Later: saving to PostgreSQL will be handled here
    console.log(`Received mood: ${mood}, Context: ${context}`);

    res.status(201).json({
        message: "Mood log received (Scaffold)",
        data: { mood, context, solution }
    });
});

// SCAFFOLD: Get all moods
app.get('/api/moods', (req, res) => {
    res.json({ message: "This will return all mood logs from database." });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
