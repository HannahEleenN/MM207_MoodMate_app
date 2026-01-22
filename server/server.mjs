"use strict";

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('../client'));

// Example of an API endpoint for retrieving logs
app.get('/api/logs', (req, res) => {
    res.json({ message: "The logs from the database will appear here!" });
});

app.listen(PORT, () => {
    console.log(`The server runs at http://localhost:${PORT}`);
});
