"use strict";

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('../client'));

// Eksempel på et API-endepunkt for å hente logger
app.get('/api/logs', (req, res) => {
    res.json({ message: "Her vil loggene fra databasen dukke opp!" });
});

app.listen(PORT, () => {
    console.log(`Serveren kjører på http://localhost:${PORT}`);
});