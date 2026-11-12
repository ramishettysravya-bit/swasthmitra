// controllers/alertController.js
const User = require('../models/User');
// Removed direct import, logic is in User model hooks
// const { sendEmergencyWhatsApp } = require('../services/twilioService');

// Update user risk score and trigger alert if high
exports.updateRiskScore = async (req, res) => {
  try {
    const { userId } = req.params;
    const { riskScore } = req.body;

    if (riskScore === undefined) {
      return res.status(400).json({ error: 'Risk score is required' });
    }

    // 1. Find user (don't update yet, we need contact info)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Simply update the user's risk score and let middleware handle the alert
    user.riskScore = riskScore;
    // user.emergencyContactNumber might be updated elsewhere or here if passed
    if (req.body.emergencyContact) {
      user.emergencyContact = req.body.emergencyContact;
    }
    
    // The middleware defined in User model will automatically trigger sendEmergencyWhatsApp
    // if riskScore >= 75
    await user.save();

    let alertStatus = 'Score updated';
    if (riskScore >= 75) {
      alertStatus = 'High risk detected. System processing emergency alert.';
    }

    res.json({
      success: true,
      message: 'Risk score updated successfully',
      riskScore: user.riskScore,
      alertStatus: alertStatus
    });

  } catch (error) {
    console.error("Alert Controller Error:", error);
    res.status(500).json({ error: 'Failed to update risk score' });
  }
};
