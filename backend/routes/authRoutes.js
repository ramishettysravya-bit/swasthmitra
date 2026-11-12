const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const localUserStore = require('../services/localUserStore');

const useLocalStore = () => mongoose.connection.readyState !== 1;

// Signup
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (useLocalStore()) {
      if (localUserStore.findByEmail(email)) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      const user = localUserStore.create({ email, password, name });
      return res.status(201).json({
        msg: 'User created successfully',
        userId: user._id,
        profileSetup: false,
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      email,
      password, // Note: In production, password should be hashed!
      name
    });

    await user.save();

    res.status(201).json({ 
        msg: 'User created successfully',
        userId: user._id,
        profileSetup: false 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (useLocalStore()) {
      const user = localUserStore.findByEmail(email);
      if (!user || user.password !== password) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      return res.json({
        userId: user._id,
        profileSetup: !!user.name,
        user,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    if (user.password !== password) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Check if profile is complete (e.g. has a name)
    const isProfileSetup = !!user.name;

    const payload = {
      user: {
        id: user.id,
      },
      userId: user._id, 
      profileSetup: isProfileSetup,
      user: user
    };

    res.json(payload);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
