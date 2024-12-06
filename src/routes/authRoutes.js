const express = require('express');
const { hashPassword, verifyPassword } = require('../utils/passwordUtils');
const User = require('../models/User');

const router = express.Router();

// Check if username is available
router.post('/check-username', async (req, res) => {
  const { username } = req.body;

  if (!username) return res.status(400).json({ error: 'Username is required' });

  try {
    const existingUser = await User.findOne({ username });
    res.json({ exists: !!existingUser });
  } catch (error) {
    res.status(500).json({ error: 'Error checking username' });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await hashPassword(password);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  try {
    const user = await User.findOne({ username });
    if (!user || !(await verifyPassword(user.password, password)))
      return res.status(401).json({ error: 'Invalid username or password' });

    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

module.exports = router;
