const mongoose = require('mongoose');

const highscoreSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Highscore', highscoreSchema, 'highscores');
