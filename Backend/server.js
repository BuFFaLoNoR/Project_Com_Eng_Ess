const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/quickcatch', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once('open', () => console.log('Connected to MongoDB'));

// Define Schemas
const playerSchema = new mongoose.Schema({
  username: String,
  passwordHash: String,
  highScore: { type: Number, default: 0 },
});

const scoreSchema = new mongoose.Schema({
  playerId: mongoose.Schema.Types.ObjectId,
  score: Number,
  timestamp: { type: Date, default: Date.now },
});

// Define Models
const Player = mongoose.model('Player', playerSchema);
const Score = mongoose.model('Score', scoreSchema);

// Save score
app.post('/score', async (req, res) => {
  const { playerId, score } = req.body;
  try {
    const newScore = new Score({ playerId, score });
    await newScore.save();

    // Update high score if this is the player's best score
    const player = await Player.findById(playerId);
    if (score > player.highScore) {
      player.highScore = score;
      await player.save();
    }

    res.json({ message: 'Score saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top scores
app.get('/highscores', async (req, res) => {
  try {
    const scores = await Score.find().sort({ score: -1 }).limit(10).populate('playerId', 'username');
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));