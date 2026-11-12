const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error("Missing SID or Token");
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function findNumbers() {
  console.log("Fetching your Twilio phone numbers...");
  try {
    const numbers = await client.incomingPhoneNumbers.list({ limit: 5 });
    
    if (numbers.length === 0) {
      console.log("No numbers found!");
      console.log("You must purchase or claim a free trial number in Twilio Console.");
    } else {
      console.log(`Found ${numbers.length} numbers:`);
      numbers.forEach(n => {
        console.log(`- ${n.phoneNumber} (${n.friendlyName})`);
      });
    }
  } catch (error) {
    console.error("Error fetching numbers:", error.message);
    if (error.code === 20003) {
      console.log("Your Account SID or Auth Token seems incorrect.");
    }
  }
}

findNumbers();
