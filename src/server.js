const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

// MongoDB connection string (replace with your own MongoDB Atlas URI)
const mongoURI = 'mongodb+srv://6630306821:18082547@cluster0.atcnc.mongodb.net/gameDB?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected to gameDB'))
  .catch((err) => console.log(err));

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Use express's built-in JSON parser

// MongoDB Schema and Models
const highscoreSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Highscore = mongoose.model('Highscore', highscoreSchema, 'highscores');
const User = mongoose.model('User', userSchema, 'users');

// Custom hash function (replacing bcrypt)
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, salt) => {
      if (err) return reject(err);

      salt = salt.toString('hex');
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);

        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  });
}

function verifyPassword(storedPassword, password) {
  return new Promise((resolve, reject) => {
    const [salt, hashed] = storedPassword.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);

      resolve(hashed === derivedKey.toString('hex'));
    });
  });
}

// API routes

// Check if username is available
app.post('/api/check-username', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ exists: true });  // Username is already taken
    } else {
      return res.json({ exists: false });  // Username is available
    }
  } catch (error) {
    res.status(500).json({ error: 'Error checking username' });
  }
});

// User Registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await verifyPassword(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get the top 10 highscores (without duplicates)
app.get('/api/highscores', async (req, res) => {
  try {
    const highscores = await Highscore.aggregate([
      { $group: { _id: "$playerName", highestScore: { $max: "$score" } } }, // Group by player and get the highest score
      { $sort: { highestScore: -1 } }, // Sort by highest score
      { $limit: 10 } // Limit to top 10
    ]);
    
    // Mapping the result to return in the required format
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
app.post('/api/highscores', async (req, res) => {
  const { score, playerName } = req.body;

  if (!score || !playerName) {
    return res.status(400).json({ error: 'Score and playerName are required' });
  }

  try {
    const newHighscore = new Highscore({ playerName, score });
    await newHighscore.save();
    res.json({ message: 'Highscore saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save highscore' });
  }
});

// Start server
const PORT = 3222;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
