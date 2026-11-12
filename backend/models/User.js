const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  age: { type: Number },
  gender: { type: String },
  village: { type: String },
  bloodGroup: { type: String },
  conditions: [{ type: String }],
  location: { type: String },
  emergencyContact: { type: String },
  emergencyContactNumber: { type: String }, // specific field for WhatsApp
  riskScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Middleware to trigger WhatsApp Alert on high risk score
userSchema.post('save', async function(doc) {
  console.log(`[User Model] Post-save hook triggered for User: ${doc._id}, RiskScore: ${doc.riskScore}`);
  if (doc.riskScore >= 75) {
    console.log('[User Model] Risk score is HIGH (>= 75). Attempting to send WhatsApp Alert...');
    try {
      const { sendEmergencyWhatsApp } = require('../services/twilioService');
      // Use emergencyContactNumber if available, otherwise fallback to emergencyContact
      const contact = doc.emergencyContactNumber || doc.emergencyContact;
      console.log(`[User Model] Contact number found: ${contact}`);
      
      if (contact) {
        await sendEmergencyWhatsApp(doc._id, contact, doc.riskScore);
      } else {
        console.log('[User Model] No emergency contact number found. Alert skipped.');
      }
    } catch (err) {
      console.error('[User Model] Error in post-save Alert trigger:', err);
    }
  } else {
    console.log('[User Model] Risk score is below threshold. No Alert needed.');
  }
});

// Middleware for findOneAndUpdate
userSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.riskScore >= 75) {
     try {
      const { sendEmergencyWhatsApp } = require('../services/twilioService');
      const contact = doc.emergencyContactNumber || doc.emergencyContact;
      if (contact) {
        await sendEmergencyWhatsApp(doc._id, contact, doc.riskScore);
      }
    } catch (err) {
      console.error('Error in findOneAndUpdate WhatsApp trigger:', err);
    }
  }
});

module.exports = mongoose.model('User', userSchema);
