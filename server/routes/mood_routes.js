"use strict";

const express = require('express');
const router = express.Router();

// POST /api/moods - Create a new entry
router.post('/', (req, res) => {
    const { mood, context, solution } = req.body;
    
    // Basic validation check (Learning Outcome: Analyze interactions)
    if (!mood || !context) {
        return res.status(400).json({ error: "Mood and Context are required" });
    }

    console.log("Received mood:", mood);
    res.status(201).json({ message: "Mood entry created successfully" });
});

// GET /api/moods - Get all entries
router.get('/', (req, res) => {
    res.status(200).json([]); // Returning empty array for now (scaffold)
});

module.exports = router;
