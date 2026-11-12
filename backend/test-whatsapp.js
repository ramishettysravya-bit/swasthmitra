const twilio = require('twilio');
const path = require('path');
// Explicitly load .env from backend directory if running from root
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log('--- Twilio WhatsApp Configuration Check ---');
console.log(`Node Environment: ${process.env.NODE_ENV || 'default'}`);
if (accountSid) {
    console.log(`SID: ${accountSid.substring(0,6)}... (Present)`);
} else {
    console.log(`SID: MISSING! Check your .env file.`);
}
if (authToken) {
    console.log(`Token: ${authToken.substring(0,6)}... (Present)`);
} else {
    console.log(`Token: MISSING! Check your .env file.`);
}

// Get sender number (handle with or without whatsapp: prefix)
let fromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();
if (!fromNumber.startsWith('whatsapp:') && fromNumber) {
    fromNumber = `whatsapp:${fromNumber}`;
}
console.log(`From Number: ${fromNumber || 'MISSING'}`);

// Allow command line argument for recipient number
const args = process.argv.slice(2);
let recipientInput = args[0] || '9392265089'; // Default fallback if no arg

// Clean input
let cleanRecipient = recipientInput.replace(/^whatsapp:/i, '').replace(/[\s\-\(\)]/g, '');
if (!cleanRecipient.startsWith('+')) {
    // Assume India if no country code
    cleanRecipient = `+91${cleanRecipient}`; 
}
const toNumber = `whatsapp:${cleanRecipient}`;

console.log(`To Number: ${toNumber}`);
console.log('-------------------------------------------');

if (!accountSid || !authToken || !fromNumber) {
  console.error('ERROR: Missing Twilio credentials in backend/.env');
  console.log('Usage: node backend/test-whatsapp.js [recipient_number]');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

console.log('Attempting to send test WhatsApp message...');

client.messages
  .create({
    body: 'Test WhatsApp message from SwasthMithra Debugger',
    from: fromNumber,
    to: toNumber
  })
  .then(message => {
      console.log(`SUCCESS! WhatsApp Sent.`);
      console.log(`Message SID: ${message.sid}`);
      console.log(`Status: ${message.status}`);
  })
  .catch(error => {
    console.error('FAILED to send WhatsApp:');
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    
    if (error.code === 63015) {
        console.log('\n--> FIX: The "To" number has passed the 24-hour window or is not joined to sandbox.');
        console.log('    Ask the recipient to send "join <keyword>" to your sandbox number.');
    } else if (error.code === 21211) {
      console.log('\n--> FIX: The "From" number is invalid. Ensure TWILIO_PHONE_NUMBER in .env is correct.');
    } else if (error.code === 20003) {
      console.log('\n--> FIX: Account SID or Auth Token is incorrect.');
    } else if (error.code === 21608) {
       console.log('\n--> FIX: This is a Trial Account. The recipient number must be verified in your Twilio console.');
    }
  });
