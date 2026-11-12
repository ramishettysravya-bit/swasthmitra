const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendEmergencyWhatsApp } = require('../services/twilioService');

// Send Emergency Alert
router.post('/emergency', async (req, res) => {
  const { userId, symptoms, riskLevel, location } = req.body;

  if (!userId) {
    return res.status(400).json({ msg: 'User ID is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const contact = user.emergencyContactNumber || user.emergencyContact;

    if (!contact) {
      console.log(`[Notification Route] No emergency contact for user ${user.name} (${userId})`);
      return res.status(400).json({ msg: 'No emergency contact found for this user' });
    }

    console.log(`[Notification Route] Triggering Emergency WhatsApp for User: ${user.name}`);
    console.log(`[Notification Route] Target Contact Number: ${contact}`);
    
    // Use centralized service (riskLevel acts as score or context)
    const result = await sendEmergencyWhatsApp(userId, contact, 100); 
    // Passing 100 as score to force HIGH RISK alert template since this is explicit emergency button

    if (result.success) {
        return res.json({ msg: `Emergency WhatsApp sent to ${contact}`, detail: contact });
    } else {
        return res.status(500).json({ msg: 'Failed to send WhatsApp alert', detail: result.message });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
