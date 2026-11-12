const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const toNumber = '+917013118554'; // Your verified number

console.log('--- Twilio Configuration Check ---');
console.log(`SID: ${accountSid ? 'Present' : 'Missing'}`);
console.log(`Token: ${authToken ? 'Present' : 'Missing'}`);
console.log(`From Number: ${fromNumber}`);
console.log(`To Number: ${toNumber}`);
console.log('----------------------------------');

if (!fromNumber || !fromNumber.startsWith('+')) {
  console.error('ERROR: TWILIO_PHONE_NUMBER is invalid. It must start with "+" (e.g., +15550101234).');
  console.error('This number is found on your Twilio Console Dashboard under "Account Info".');
  process.exit(1);
}

if (fromNumber === toNumber) {
    console.error('ERROR: Sender and Receiver numbers are the same!');
    console.error('You cannot send an SMS from your personal number to yourself using Twilio.');
    console.error('The "From" number must be the virtual number provided by Twilio (usually US-based +1...).');
    process.exit(1);
}

console.log('Attempting to send test SMS...');

client.messages
  .create({
    body: 'Test message from SwasthMithra Debugger',
    from: fromNumber,
    to: toNumber
  })
  .then(message => console.log(`SUCCESS! SMS Sent. SID: ${message.sid}`))
  .catch(error => {
    console.error('FAILED to send SMS:');
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    
    if (error.code === 21608) {
      console.log('\n--> FIX: The "To" number is not verified. Go to Twilio Console > Phone Numbers > Verified Caller IDs.');
    } else if (error.code === 21211) {
      console.log('\n--> FIX: The "From" number is invalid. Ensure TWILIO_PHONE_NUMBER in .env is correct.');
    } else if (error.code === 20003) {
      console.log('\n--> FIX: Account SID or Auth Token is incorrect.');
    }
  });
