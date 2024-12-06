const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const highscoreRoutes = require('./routes/highscoreRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/highscores', highscoreRoutes);

module.exports = app;
