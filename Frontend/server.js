const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files (images, JavaScript, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html when the root URL is accessed
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'front.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
