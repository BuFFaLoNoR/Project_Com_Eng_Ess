// server.js

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3221;

// Serve static files (images, JavaScript, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html when the root URL is accessed
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve table.html when the user visits /highscores
app.get('/highscores', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'table.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
