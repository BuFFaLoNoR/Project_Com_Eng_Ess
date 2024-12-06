const express = require('express');
const Highscore = require('../models/Highscore');

const router = express.Router();

// Get top 10 highscores
router.get('/', async (req, res) => {
  try {
    const highscores = await Highscore.aggregate([
      { $group: { _id: "$playerName", highestScore: { $max: "$score" } } },
      { $sort: { highestScore: -1 } },
      { $limit: 10 },
    ]);

    const formattedScores = highscores.map((score, index) => ({
      rank: index + 1,
      playerName: score._id,
      score: score.highestScore,
    }));

    res.json(formattedScores);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch highscores' });
  }
});

// Post a new highscore
router.post('/', async (req, res) => {
  const { score, playerName } = req.body;

  if (!score || !playerName)
    return res.status(400).json({ error: 'Score and playerName are required' });

  try {
    const newHighscore = new Highscore({ playerName, score });
    await newHighscore.save();
    res.json({ message: 'Highscore saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save highscore' });
  }
});

module.exports = router;
