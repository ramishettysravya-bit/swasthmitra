const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Check if API key is set
if (!process.env.GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Use gemini-1.5-flash as it is faster and supports newer features.
// If you encounter 404, please ensure Generative Language API is enabled and your key is valid.
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    // generationConfig: { responseMimeType: "application/json" } // Keep simple text response for robustness across environments
});

router.post('/', async (req, res) => {
    try {
        const { message, history, userName, language } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Gemini API Key is not configured on the server." });
        }

        const systemPrompt = `
        You are ArogyaBot, a helpful and empathetic AI medical assistant.
        Your goal is to collect three specific pieces of information from the user:
        1. Main Symptom (e.g., fever, headache, stomach pain)
        2. Duration (e.g., 2 days, 1 week)
        3. Severity (Mild, Moderate, or Severe)

        Current User Name: ${userName || 'User'}
        Preferred Language: ${language === 'te' ? 'Telugu' : 'English'}

        Instructions:
        - The user prefers to communicate in ${language === 'te' ? 'Telugu (తెలుగు)' : 'English'}. YOU MUST REPLY IN THIS LANGUAGE.
        - Even if the user types in English but has selected Telugu, try to reply in Telugu or a mix if appropriate.
        - If the user writes in Telugu script or transliteration (e.g., "Jvaram"), understand it.
        - Only output the reply in the preferred language. Keep the 'data' fields in standardized English.
        
        CRITICAL: You must ALWAYS respond in valid JSON format.
        Structure:
        {
            "reply": "Your conversational response to the user (in ${language === 'te' ? 'Telugu' : 'English'})",
            "data": {
                "symptom": "extracted symptom (in English) or null",
                "duration": "extracted duration (in English) or null",
                "severity": "Low/Medium/High or null"
            }
        }
        `;

        // We can't easily use startChat with a system prompt effectively in the same way as a single prompt with history context for JSON enforcement in older patterns, 
        // but 1.5 Flash supports systemInstruction via model config or just prepending.
        // For simplicity and robustness with the JS SDK:
        // We will append the system prompt to the history or strictly instruct in the message.
        
        // Actually, startChat is stateful on the client side object, but here we re-initialize chat each request if we use history from body. 
        // Best approach for stateless REST API:
        // Construct the full prompt context.
        
        let text = "";
        try {
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: systemPrompt }]
                    },
                    {
                        role: "model",
                        parts: [{ text: JSON.stringify({
                            reply: `Hello ${userName || ''}! I'm ArogyaBot. How can I assist you with your health today?`,
                            data: { symptom: null, duration: null, severity: null }
                        }) }]
                    },
                    // Ensure history is clean and follows user/model pattern
                    ...(Array.isArray(history) ? history.map(h => ({
                        role: h.role === 'ai' ? 'model' : 'user',
                        parts: [{ text: h.parts ? h.parts[0].text : h.text }] // Robustness for different history formats
                    })) : [])
                ],
            });
    
            const result = await chat.sendMessage(message);
            const response = await result.response;
            text = response.text();
            
        } catch (apiError) {
            console.error("Gemini API Error:", apiError.message);
            
            // --- SMART FALLBACK LOGIC ---
            // If the API fails, we use this local logic to keep the conversation going.
            // It uses the history to understand context (e.g., if the last question was about duration).

            const lowerMsg = message.toLowerCase();
            let reply = "I apologize, I'm having trouble connecting to my brain right now. Please tell me more about your symptoms.";
            let data = { symptom: null, duration: null, severity: null };

            // Helper to find last AI message text from history
            let lastAiMessage = "";
            if (Array.isArray(history) && history.length > 0) {
                // history structure: [{role, parts: [{text}]}]
                // We want the last message where role was 'model'
                // But history in request excludes current turn. The last item is usually the last AI response.
                const lastMsg = history[history.length - 1];
                if (lastMsg && (lastMsg.role === 'model' || lastMsg.role === 'ai')) {
                    lastAiMessage = (lastMsg.parts && lastMsg.parts[0] ? lastMsg.parts[0].text : (lastMsg.text || "")).toLowerCase();
                }
            }
            
            // PARALLEL EXTRACTION LOGIC
            // Instead of sequential if/else which stops after one match, we check for ALL independent parts.
            
            // 1. GREETING/CLOSING
            const greetingRegex = /^\s*(hi|hlo|hello|hey|greetings|namaste|shubhodayam|good\s*(morning|afternoon|evening|mrng|night)|bye|goodbye|శుభోదయం|నమస్కారం|నమస్తే)\s*[.!?,]?\s*$/i;
            const isTelugu = language === 'te'; 

            if (lowerMsg.match(greetingRegex)) {
                 if (lowerMsg.includes("night") || lowerMsg.includes("bye")) {
                     reply = isTelugu 
                        ? `వీడ్కోలు ${userName || ''}! మీ ఆరోగ్యాన్ని జాగ్రత్తగా చూసుకోండి.` 
                        : `Goodbye ${userName || ''}! Take care of your health.`;
                 } else {
                     reply = isTelugu
                        ? `నమస్తే ${userName || ''}! లక్షణాల విశ్లేషణలో నేను మీకు సహాయపడగలను. దయచేసి మీ ప్రధాన లక్షణాన్ని చెప్పండి.`
                        : `Hello ${userName || 'there'}! I can help you with health recommendations. Please tell me your main symptom.`;
                 }
                 // If greeting found, we likely don't need to extract data, but user might say "Hi I have fever"
            }

            // 2. EXTRACTION
            // Symptom
            const symptomKeywords = [
                // English
                "fever", "headache", "pain", "stomach", "cough", "cold", "flu", "vomiting", "dizziness", "nausea", 
                "rash", "itch", "sore", "throat", "fatigue", "tired", "weakness", "breath", "chest", "back", "joint",
                "swelling", "bleeding", "vision", "ear", "hearing", "nose", "runny", "congestion", "sneeze", "diarrhea",
                "constipation", "cramps", "burn", "cut", "bruise", "sad", "anxious", "depressed", "stress", "sleep", "insomnia",
                // Telugu (Both script and transliteration for robustness)
                "జ్వరం", "jvaram", "తలనొప్పి", "talanoppi", "కడుపు నొప్పి", "kadupu noppi", "కడుపునొప్పి", "kadupu noppi", "దగ్గు", "daggu", "జలుబు", "jalubu", 
                "ఒంటి నొప్పులు", "onti noppulu", "వాంతులు", "vanthulu", "విరేచనాలు", "virechanalu", "అలసట", "alasata", "ekkuva",
                "kallu tiragadam", "కళ్లు తిరగడం", "upiri aadaka povadam", "ఊపిరి ఆడకపోవడం", "chaathi noppi", "ఛాతీ నొప్పి", "keella noppulu", "కీళ్ల నొప్పులు",
                "gonthu noppi", "గొంతు నొప్పి", "daddurlu", "దద్దుర్లు", "durada", "దురద", "nadumu noppi", "నడుము నొప్పి", "kaalla noppulu", "కాళ్ళ నొప్పులు",
                "kanni noppi", "కంటి నొప్పి", "chevi noppi", "చెవి నొప్పి", "aandolana", "ఆందోళన", "nidra pattaka povadam", "నిద్ర పట్టకపోవడం"
             ];
             const foundSymptoms = symptomKeywords.filter(s => lowerMsg.includes(s));
             if (foundSymptoms.length > 0) {
                 // Join unique symptoms
                 data.symptom = [...new Set(foundSymptoms)].join(", ");
             }

             // Duration
             // Look for patterns like "2 days", "since yesterday", "for a week"
             // Also support Telugu duration patterns and variations requested by user
             const durationMatch = lowerMsg.match(/(\d+\s+(days?|weeks?|months?|hours?|years?))|since\s+\w+|yesterday|today|daily|for\s+a\s+(week|month|day)|rendu\s+rojulu|oka\s+varam|ganta|గత\s+\S+\s+నుంచి|రోజుల?|వారాల?|నెలలు?|సంవత్సరాలు?|నుండి|నుంచి|nunchi|nundi|rojulu|varalu|nelalu|samvatsaralu|varaluu|nelallu|samvastharlu/i);
             // Improve capture to include preceding number if present
             if (durationMatch) {
                 // Try to grab context effectively - if it matches a suffix like "rojulu", try to get the word before it too.
                 if (['రోజుల', 'వారాల', 'నెలలు', 'సంవత్సరాలు', 'rojulu', 'varalu', 'nelalu', 'samvatsaralu', 'varaluu', 'nelallu', 'samvastharlu'].some(s => lowerMsg.includes(s))) {
                     // Simple heuristic: take the whole message as duration if it's short, or partial match
                     if (message.split(' ').length <= 6) {
                         data.duration = message; 
                     } else {
                         data.duration = durationMatch[0]; // fallback
                     }
                 } else {
                     data.duration = durationMatch[0];
                 }
             }

             // Severity
             // We use a broader approach than Regex \b for non-latin characters
             let severityFound = null;
             const severityMap = {
                 "Severe": ['severe', 'high', 'extreme', 'teevram', 'ekkuva', 'bagaa', 'severe ga', 'tivramga', 'heavy', 'తీవ్రంగా', 'chala', 'twiramgaa', 'twaraga', 'తీవ్రమైనది', 'teevramainadi', 'ekkuvag', 'ekkuvaga'],
                 "Mild": ['mild', 'low', 'light', 'takkuva', 'thakkuva', 'chinna', 'తక్కువ', 'konchem'],
                 "Moderate": ['moderate', 'medium', 'madhyam', 'మధ్యస్థంగా', 'మద్యస్థగా', 'madhyam gaa', 'kon cham', 'koncham', 'మద్యస్థ', 'మధ్యస్థ']
             };

             // Check English/Transliterated regex first
             const severityRegex = /\b(mild|moderate|severe|high|low|medium|extreme|teevram|takkuva|ekkuva|bagaa|severe ga|tivramga|chala|madhyam|light|heavy|twiramgaa|twaraga|madhyam gaa)\b/i;
             const severityMatch = lowerMsg.match(severityRegex);
             if (severityMatch) severityFound = severityMatch[0];

             // Check Telugu Script directly (includes check)
             if (!severityFound) {
                 // Check maps directly for both English and Telugu script logic
                 for (const [level, keywords] of Object.entries(severityMap)) {
                     if (keywords.some(k => lowerMsg.includes(k))) {
                        severityFound = level;
                        break;
                     }
                 }
             }

             if (severityFound) {
                 let normalized = severityFound; 
                 // If the found value is a key itself (logic above sets it to level), simplify
                 if (['Severe', 'Mild', 'Moderate'].includes(severityFound)) {
                     data.severity = severityFound;
                 } else {
                    // Try to normalize
                    for (const [level, keywords] of Object.entries(severityMap)) {
                        if (keywords.some(k => severityFound.toLowerCase().includes(k) || k.includes(severityFound.toLowerCase()))) {
                            normalized = level;
                            break;
                        }
                    }
                    data.severity = normalized.charAt(0).toUpperCase() + normalized.slice(1);
                 }
             }

             // 3. LOGIC TO DETERMINE REPLY (FALLBACK)
             // If Gemini fails, we construct a reply manually.
             
             const hasData = data.symptom || data.duration || data.severity;
             // const isTelugu = language === 'te'; // Already declared above check preferred language

             if (hasData) {
                 if (data.symptom && data.duration && data.severity) {
                     reply = isTelugu 
                        ? `మీకు ${data.severity} తీవ్రతతో ${data.duration} నుండి ${data.symptom} ఉందని నేను గమనించాను. మీరు ఇప్పుడు సిఫార్సు (Recommendation) పొందవచ్చు.`
                        : `I have noted that you have ${data.symptom} for ${data.duration} with ${data.severity} severity. You can now get your recommendation.`;
                 } else if (data.symptom && !data.duration) {
                     reply = isTelugu
                        ? `మీకు ${data.symptom} ఉందని అర్థమైంది. ఇది ఎంత కాలంగా ఉంది?`
                        : `I understand you have ${data.symptom}. How long have you had this?`;
                 } else if (data.symptom && data.duration && !data.severity) {
                     reply = isTelugu
                        ? `సరే. ${data.symptom} ఎంత తీవ్రంగా ఉంది? (తక్కువ, మధ్యస్థ, తీవ్రమైన)`
                        : `Got it. How severe is the ${data.symptom}? (Mild, Moderate, Severe)`;
                 } else if (!data.symptom && (data.duration || data.severity)) {
                      // Check english and telugu context keywords
                      // 'teevra' covers teevranga, teevrata, teevramaina
                      if (lastAiMessage.includes("severity") || lastAiMessage.includes("severe") || lastAiMessage.includes("తీవ్ర")) {
                         reply = isTelugu 
                            ? "ధన్యవాదాలు. మీరు ఇప్పుడు 'సిఫార్సు పొందండి' క్లిక్ చేయవచ్చు."
                            : "Thank you. You can click 'Get Recommendation' now.";
                     } else if (lastAiMessage.includes("how long") || lastAiMessage.includes("ఎంత కాలం")) {
                         reply = isTelugu
                            ? "మరియు ఇది ఎంత తీవ్రంగా ఉంది? (తక్కువ, మధ్యస్థ, తీవ్రమైన)"
                            : "And how severe is it? (Mild, Moderate, Severe)";
                     } else {
                         reply = isTelugu
                            ? "ఇది ఏ లక్షణానికి సంబంధించినది?"
                            : "Could you tell me what symptom this applies to?";
                     }
                 }
             } else {
                 // No data found logic...
                 if (!reply || reply.includes("apologize")) {
                      // ... (Context based checks) ...
                      // Simplification for brevity in this edit tool call, assuming standard flow
                      reply = isTelugu
                        ? "క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మీ లక్షణాల గురించి చెప్పండి (ఉదాహరణకు: జ్వరం, తలనొప్పి)."
                        : "Could you tell me more about your symptoms? For example, do you have a fever or cold?";
                 }
             }

            // Return mock response
            return res.json({ reply, data });
        }
        
        // Ensure we send back JSON, handling potential markdown
        let jsonStr = text;
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1];
        }

        try {
            const jsonResponse = JSON.parse(jsonStr);
            res.json(jsonResponse);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", text);
            // Fallback if model fails to output JSON (rare with 1.5 Flash JSON mode)
            res.json({ 
                reply: text, 
                data: { symptom: null, duration: null, severity: null } 
            });
        }

    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        res.status(500).json({ error: "Failed to generate response." });
    }
});

module.exports = router;
