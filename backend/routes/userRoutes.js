const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const alertController = require('../controllers/alertController');
const localUserStore = require('../services/localUserStore');

// Update user risk score manually (triggers potential alerts via middleware)
router.put('/:userId/risk-score', alertController.updateRiskScore);

// Update user profile (Profile Setup)
router.post('/profile', async (req, res) => {
  const { userId, ...profileData } = req.body;
  
  if (!userId) {
     return res.status(400).json({ msg: 'User ID is required' });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      const user = localUserStore.update(userId, profileData);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      return res.json(user);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: profileData },
      { new: true }
    );

    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Get User Profile
router.get('/:userId', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            const user = localUserStore.findById(req.params.userId);
            if (!user) return res.status(404).json({ msg: 'User not found' });
            return res.json(user);
        }

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
