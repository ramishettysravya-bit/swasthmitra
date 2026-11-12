// services/twilioService.js
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Debug credentials presence (safely)
console.log(`[Twilio Service] Init - SID present: ${!!accountSid}, Token present: ${!!authToken}, Phone: ${process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER}`);

const client = twilio(accountSid, authToken);

const RiskAlert = require('../models/RiskAlert');

/**
 * Sends an emergency WhatsApp message if no recent alert exists
 * @param {string} userId - User ID being alerted
 * @param {string} to - Recipient phone number
 * @param {number} riskScore - Current risk score
 * @returns {Promise<{success: boolean, message: string}>}
 */
const sendEmergencyWhatsApp = async (userId, to, riskScore) => {
  console.log(`[Twilio Service] Request to send WhatsApp to ${to} for User ${userId}`);
  try {
    if (!to) {
      console.log('[Twilio Service] No "to" number provided.');
      return { success: false, message: 'No emergency contact provided' };
    }

    // Check for alerts in the last 2 MINUTES (to prevent spam but allow testing)
    // DISABLED per user request: "send whatsapp message any time score is high"
    /*
    const timeWindow = new Date(Date.now() - 2 * 60 * 1000);
    const existingAlert = await RiskAlert.findOne({
      userId: userId,
      sentAt: { $gte: timeWindow }
    });

    if (existingAlert) {
      console.log(`[Twilio Service] Alert suppressed: Recent alert sent at ${existingAlert.sentAt}`);
      return { success: true, message: 'Alert suppressed (duplicate within 2m)' };
    }
    */

    // 1. Sanitize Recipient Number
    // Remove "whatsapp:" if user manually entered it, and remove spaces/dashes/parentheses
    let cleanRecipient = to.replace(/^whatsapp:/i, '').replace(/[\s\-\(\)]/g, '');
    
    // Format recipient number (India default E.164)
    if (!cleanRecipient.startsWith('+')) {
      if (cleanRecipient.length === 10) {
        cleanRecipient = `+91${cleanRecipient}`;
        console.log(`[Twilio Service] Auto-formatted recipient to ${cleanRecipient}`);
      } else {
         console.warn(`[Twilio Service] Recipient number ${cleanRecipient} might be invalid (missing + country code). Sending anyway.`);
         // Add + just in case it's a raw number without it
         if (!cleanRecipient.startsWith('+')) cleanRecipient = `+${cleanRecipient}`;
      }
    }

    // Add 'whatsapp:' prefix for Twilio
    const recipientWhatsapp = `whatsapp:${cleanRecipient}`;

    const messageBody = `🚨 *Emergency Alert from SwasthMithra* 🚨\n\nYour registered user has a *HIGH health risk score (${riskScore})*.\nPlease check on them immediately. NOTE: This is an automated WhatsApp message.`;

    // 2. Sanitize Sender Number from Environment
    // Use TWILIO_WHATSAPP_NUMBER or fallback to TWILIO_PHONE_NUMBER
    let senderEnv = (process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || '').trim();
    // Remove "whatsapp:" if present in .env to avoid double prefix
    let cleanSender = senderEnv.replace(/^whatsapp:/i, '').replace(/[\s\-\(\)]/g, '');

    if (!cleanSender || cleanSender.length < 5) {
      console.error("[Twilio Config] ERROR: TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER in .env is missing or invalid.");
      console.error("-> Please update .env with the number from your Twilio Dashboard (e.g. +14155238886).");
    }

    // Ensure sender has + prefix
    if (!cleanSender.startsWith('+')) {
       cleanSender = `+${cleanSender}`;
    }
    
    // Add 'whatsapp:' prefix for Twilio
    const senderWhatsapp = `whatsapp:${cleanSender}`;

    console.log(`[Twilio Service] Prepared: From '${senderWhatsapp}' -> To '${recipientWhatsapp}'`);

    // Only send if credentials are set (or mock for dev)
    if (accountSid && authToken && cleanSender) {
      console.log(`[Twilio Service] Sending WhatsApp via Twilio from ${senderWhatsapp} to ${recipientWhatsapp}...`);
      
      try {
        const message = await client.messages.create({
          body: messageBody,
          from: senderWhatsapp,
          to: recipientWhatsapp
        });
        console.log(`[Twilio Service] Twilio WhatsApp sent successfully! SID: ${message.sid}`);
      } catch (twilioError) {
        console.error(`[Twilio Service] FAILED to send WhatsApp. Code: ${twilioError.code}, Message: ${twilioError.message}`);
        
        let errorMsg = 'Failed to send WhatsApp';
        
        // If it's a trial account error (21608), log a specific hint
        if (twilioError.code === 21608) {
           console.error("[Twilio Service] This is a Trial Account. The recipient number must be verified in your Twilio console.");
           errorMsg = 'Trial Account: Recipient not verified in Twilio console';
        }
        // If template error (63016) - free form messages only allowed within 24h window
        if (twilioError.code === 63016) {
            console.error("[Twilio Service] Failed to send freeform message outside 24h window. You must use a template.");
            errorMsg = 'Failed: Outside 24h window (Template required)';
        }
        // If not opted in (63015)
        if (twilioError.code === 63015) {
            console.error("[Twilio Service] Recipient not opted in to sandbox.");
            errorMsg = 'Recipient not joined to Sandbox (Send "join <keyword>" to sandbox number)';
        }

        return { success: false, message: errorMsg, code: twilioError.code };
      }

    } else {
      console.warn("[Twilio Service] Twilio credentials missing in .env - Simulate WhatsApp:", messageBody);
      console.warn(`SID: ${accountSid ? 'Set' : 'Missing'}, Token: ${authToken ? 'Set' : 'Missing'}, Phone: ${cleanSender ? 'Set' : 'Missing'}`);
      return { success: false, message: 'Twilio credentials missing (Simulation Mode)' };
    }

    // Log the alert
    const newAlert = new RiskAlert({
      userId,
      riskScore,
      message: messageBody,
      sentAt: new Date()
    });
    await newAlert.save();

    return { success: true, message: 'Emergency alert sent successfully' };

  } catch (error) {
    console.error("Twilio Error:", error);
    return { success: false, message: 'Failed to send WhatsApp' };
  }
};

module.exports = { sendEmergencyWhatsApp };
