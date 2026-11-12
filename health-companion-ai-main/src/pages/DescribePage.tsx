import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Bot, User, MicOff, AlertCircle, Loader2, CheckCircle2, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useToast } from "@/components/ui/use-toast";
import { saveHealthEvent } from "@/lib/tracker";
import { updateRiskScore, getCurrentUserId } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "ai";
  text: string;
}

interface HealthData {
  symptom: string | null;
  duration: string | null;
  severity: string | null;
}

const DescribePage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [healthData, setHealthData] = useState<HealthData>({
    symptom: null,
    duration: null,
    severity: null
  });
  const [healthHistory, setHealthHistory] = useState<HealthData[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // *** PERSISTENCE START ***
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Strategy: Only load from session if we have a flag "preserve_chat" (set by Recommendation Page navigation)
    // If flag is missing, we clear any stale session.
    
    // Wait... user wants "Back arrow" to work.
    // If I clear sessionStorage on mount, reloading the page will wipe chat.
    // But "Navigate to other page" should wipe chat.
    
    // Compromise:
    // We use sessionStorage to store.
    // We ADD a "session_start_time" or similar.
    // Better: We rely on the fact that if we navigate AWAY using React Router to "Dashboard" or "Logout", we can wipe it then.
    // But unmount happens on refresh too.
    
    // Improved Logic:
    // We only LOAD if sessionStorage has data.
    // We need to know if we arrived here "Fresh" (Sidebar click) or "Back" (History navigation).
    // It is hard to know "Fresh vs Back" robustly without passing state.
    // We can rely on `history.state`?
    
    // Let's implement the specific request: "only store when he get through back arrow".
    // This implies we should pass state FROM the Recommendation page.
    // If we land on DescribePage and `location.state.restoreChat` is true, we use it.
    // BUT `location.state` clears on refresh. If user hits "Back", then "Refresh", chat is gone.
    // User might accept that.
    
    // Let's try to stick to sessionStorage but clear it aggressively on "Exit".
    // But we can't detect "Exit" vs "Refresh" in cleanup easily.
    
    // Let's use the explicit "Save on Navigate to Rec, Load on mount" approach I planned.
    // But to handle "Navigate other page -> Clear", we basically say "If I mount and I did NOT come from Recommendation, Clear it."
    
    const savedSession = sessionStorage.getItem("arogya_chat_session");
    const cameFromRec = sessionStorage.getItem("coming_from_recommendation");
    
    if (savedSession && cameFromRec === "true") {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.healthData) setHealthData(parsed.healthData);
        if (parsed.healthHistory) setHealthHistory(parsed.healthHistory);
      } catch (e) {
        console.error("Failed to parse chat session", e);
      }
      // We consumed the flag, so clear it? 
      // If we clear it, a refresh will wipe the chat. Maybe we want that behavior (fresh start on refresh).
      // Or we keep it until we leave.
      // Let's KEEP it for this session, but user asked for "Logout or fresh sign in it should only store when he get through back arrow".
      // If they refresh, they are still on the page, so keeping it is fine.
    } else {
        // We did NOT come from recommendation (or flag expired). Clear everything.
        sessionStorage.removeItem("arogya_chat_session");
        // Also ensure state is empty (default state is empty)
    }
    
    // Clear flag? If I refresh, I want it to persist?
    // If I refresh, component remounts. `coming_from_recommendation` is still in sessionStorage.
    // So session persists on refresh.
    // If I click "Sidebar -> Describe", component remounts?
    // If I'm already on Describe, clicking Sidebar link does nothing or re-renders. 
    // If I go "Dashboard -> Describe", it mounts. "coming_from_recommendation" is still true from last time?
    // WE MUST CLEAR the flag when we Navigate AWAY to something OTHER than Recommendation.
    // This requires a Cleanup that checks destination? Impossible in useEffect cleanup.
    
    // ALTERNATIVE: Clear the flag on mount, immediately?
    // Load -> Clear Flag.
    // Refresh -> Flag is gone -> Chat wiped.
    // Rec -> Back -> Mount -> Flag Present -> Load -> Clear Flag.
    // This satisfies "Fresh sign in" (Flag gone), "Logout" (Flag gone), "Navigate other page" (Flag gone).
    // It strictly obeys "Back arrow" (which triggers mount immediately after flag set).
    // Side effect: Refresh clears chat. This is often acceptable for secure/strict apps.
    
    if (cameFromRec === "true") sessionStorage.removeItem("coming_from_recommendation");
    
    // Mark as loaded whether we found session or not, so we can start saving new updates (if we want to persist during THIS interaction)
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Only save to sessionStorage if we are loaded.
    // BUT wait, we only want to save "When he get through back arrow" implies we save BEFORE we leave to Rec.
    // We do NOT want to save constantly if we are just chatting.
    // WHY? Because if we save constantly, and then user goes "Dashboard -> Describe", the session is there.
    // We want the session to be ephemeral.
    
    // SO: REMOVE AUTO-SAVE EFFECT COMPLETELY.
    // We only save manually in `navigateToRecommendation`.
  }, []);
  // *** PERSISTENCE END ***

  // Use the library's hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  // Stop speaking when unmounting or navigating away
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    };
  }, []);

  useEffect(() => {
    // Fetch user profile for name
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const response = await fetch(`/api/user/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setUserName(data.name || "User");
          }
        }
      } catch (error) {
        console.error("Failed to fetch user name", error);
      }
    };
    fetchProfile();
  }, []);

// Initial Greeting based on name
  // Removed duplicate messages state declaration here
  // const [messages, setMessages] = useState<Message[]>([]);

  // We only run this logic if we are loaded and have no messages.
  useEffect(() => {
    if (!isLoaded) return;
    
    if (messages.length === 0) {
       // Only if no messages recovered
       if (userName) {
           // Use translation for greeting. 
           // We can combine a generic greeting with the name if the language structure allows, 
           // or just use the translated "chat_greeting" which is "Hello! I'm your SwasthMithra AI assistant."
           // The user specifically asked for "Hi Deepika, how can I help you today?" style in Telugu.
           // "నమస్తే దీపిక, ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?"
           
           // Simple approach: t('hello') + userName + ", " + t('help_today')
           // We don't have 'hello' key but we have 'welcome_user' or similar.
           // Let's use the hardcoded structure but with translated phrases if possible, 
           // or add a new key. For now, let's construct it:
           
           const greetingText = language === 'te' 
             ? `నమస్తే ${userName}, ${t("help_today")}` 
             : `Hi ${userName}, ${t("help_today")}`;
             
           setMessages([{ role: "ai", text: greetingText }]);
       } else {
           // Fallback with small delay to allow userName to load if feasible, but user might be "User"
           const timer = setTimeout(() => {
                if (messages.length === 0) { // check again
                     const greetingText = language === 'te' 
                        ? `నమస్తే, ${t("help_today")}` 
                        : `Hi, ${t("help_today")}`;
                    setMessages([{ role: "ai", text: greetingText }]);
                }
           }, 800);
           return () => clearTimeout(timer);
       }
    }
  }, [userName, isLoaded]); // Don't depend on messages.length to avoid loops, logic inside handles it





  // Handle errors or missing support on mount
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.warn("Browser requires polyfill or speech recognition is not supported.");
    }
  }, [browserSupportsSpeechRecognition]);

  const toggleListening = () => {
    if (!browserSupportsSpeechRecognition) {
       toast({
          title: t("voice_input_unavailable"),
          description: t("voice_input_desc"),
          variant: "destructive",
       });
       return;
    }

    if (listening) {
        SpeechRecognition.stopListening();
    } else {
        SpeechRecognition.startListening({ 
            continuous: true, 
            language: language === 'te' ? 'te-IN' : 'en-IN' 
        });
    }
  };
  
  // Sync transcript to input when listening stops
  useEffect(() => {
      if (!listening && transcript) {
          setInput(prev => {
              const output = prev ? `${prev} ${transcript}` : transcript;
              return output;
          });
          resetTranscript();
      }
  }, [listening, transcript, resetTranscript]);
  
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSpeak = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Text-to-speech not supported",
        description: "Your browser does not support text-to-speech functionality.",
        variant: "destructive",
      });
      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Select language based on context
      utterance.lang = language === 'te' ? 'te-IN' : 'en-US';
      
      utterance.onend = () => setSpeakingIndex(null);
      utterance.onerror = () => setSpeakingIndex(null);
      
      setSpeakingIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async () => {
    let currentText = input;
    
    if (listening) {
        // If listening, combine transcript
        currentText = (input + (input ? " " : "") + transcript).trim();
        SpeechRecognition.stopListening();
        resetTranscript();
    }

    if (!currentText.trim()) return;

    // Add user message immediately
    const userMsg: Message = { role: "user", text: currentText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
        // Prepare history for Gemini
        const history = messages.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: currentText,
                history: history,
                userName: userName,
                language: language 
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch response from AI');
        }

        const data = await response.json();
        
        // Backend returns { reply: string, data: { symptom, duration, severity } }
        // Note: The reply might be inside JSON string if raw text was returned improperly, but backend tries to parse.
        
        let aiText = "I'm having trouble connecting right now.";
        
        if (typeof data.reply === 'string') {
            aiText = data.reply;
        } else if (data.text) {
             aiText = data.text;
        }
        
        const aiMsg: Message = { role: "ai", text: aiText };
        setMessages(prev => [...prev, aiMsg]);

        // Update collected data if present in response
        if (data.data) {
            const returnedData = data.data;
// Fix: We need a side-effect to update history based on healthData changes, OR just manage it explicitly.
    // The "setHealthHistory inside setHealthData" is causing re-render loops or stale data issues.
    // Let's use a logic OUTSIDE the setState.
    // We can rely on `healthData` from the render closure if we trust handleSend runs on fresh closure?
    // Not safe if multiple async updates happen.
    // BUT since we just awaited `response.json()`, we are in an async continuation.
    // The `healthData` variable in scope is STALE (from when handleSend started).
    // We MUST use functional updates.
    
    // Simplest fix:
    // Read current value via a Ref to get current state synchronously? No.
    // Use a temp variable for the NEW state, then dispatch.
    // But we need the OLD state to know if we should archive it.
    
    // Correct approach:
    // Dispatch the history update using a functional update that reads the previous history AND we assume we are archiving the *previous* healthData. 
    // But we can't access previous healthData inside setHealthHistory easily.
    
    // WORKAROUND:
    // Use a useEffect that watches `healthData.symptom`? No, that triggers on every keystroke/update.
    
    // NEW APPROACH:
    // We will optimistically use the `healthData` from the closure (stale or not), because the user interaction is sequential.
    // Users don't type "fever" and "cold" in ms.
    // So `healthData` in scope is likely "the state before this message was sent".
    // If user says "Cold", `healthData` has "Fever...".
    // We can check `healthData` (closure).
    
        if (data.data) {
            const returnedData = data.data;
            let shouldArchive = false;
            let oldDataToArchive = null;

            // Check against the state visible at start of handleSend (which is usually accurate for chat apps)
            // Actually, wait, handleSend is async. The state might have changed if user typed fast? Unlikely.
            
            // We want to check if the NEW symptom (returnedData.symptom) is different from the OLD symptom (healthData.symptom).
            const newSym = returnedData.symptom;
            const currentSym = healthData.symptom;

            if (newSym && currentSym && newSym.toLowerCase() !== currentSym.toLowerCase()) {
                 if (healthData.duration && healthData.severity) {
                     shouldArchive = true;
                     oldDataToArchive = healthData;
                 }
            }

            if (shouldArchive && oldDataToArchive) {
                setHealthHistory(prev => [...prev, oldDataToArchive!]);
                // Start new
                setHealthData({
                    symptom: newSym,
                    duration: returnedData.duration || null,
                    severity: returnedData.severity || null
                });
            } else {
                // Just update/merge
                setHealthData(prev => ({
                    symptom: returnedData.symptom || prev.symptom,
                    duration: returnedData.duration || prev.duration,
                    severity: returnedData.severity || prev.severity
                }));
            }
        }
        }

    } catch (error) {
        console.error("Chat error:", error);
        toast({
            title: t("error_title"),
            description: t("ai_error_desc"),
            variant: "destructive"
        });
        setMessages(prev => [...prev, { role: "ai", text: (language === 'te' ? "క్షమించండి, లోపం సంభవించింది." : "Sorry, I encountered an error. Please try again.") }]);
    } finally {
        setIsLoading(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  }

  const navigateToRecommendation = () => {
    // Collect all valid health data (history + current)
    const allHealthData = [...healthHistory];
    
    // Check if current data is complete enough to include
    if (healthData.symptom && healthData.duration && healthData.severity) {
        allHealthData.push(healthData);
    }

    if (allHealthData.length === 0) {
        toast({
            title: t("info_missing_title"),
            description: t("info_missing_desc"),
            variant: "destructive"
        });
        return;
    }
    
      // *** Manually SAVE the session only when we navigate to Recommendation ***
      // This satisfies the "only store when he go back" requirement: meaning the storage is populated ONLY for this specific navigation event.
      sessionStorage.setItem("arogya_chat_session", JSON.stringify({
        messages,
        healthData,
        healthHistory
      }));
      sessionStorage.setItem("coming_from_recommendation", "true");

      const conversationText = messages.map(m => `${m.role}: ${m.text}`).join('\n');
      
      // Calculate aggregate risk based on the WORST severity found
      let maxRiskScore = 30; // Default Low
      
      allHealthData.forEach(d => {
          const sev = (d.severity || "").toLowerCase();
          let score = 30;
          if (sev.includes('severe') || sev.includes('high') || sev.includes('extreme')) score = 80; // High
          else if (sev.includes('moderate') || sev.includes('medium')) score = 55; // Moderate
          
          if (score > maxRiskScore) maxRiskScore = score;
      });
      
      const combinedSymptoms = allHealthData.map(d => d.symptom).join(", ");
      const combinedDuration = allHealthData.map(d => d.duration).join(", ");
      const combinedSeverity = allHealthData.map(d => d.severity).join(", ");

      saveHealthEvent({
        type: 'describe',
        severity: maxRiskScore >= 60 ? 'high' : maxRiskScore >= 40 ? 'medium' : 'low',
        details: combinedSymptoms,
        riskScore: maxRiskScore
      });

      // Automatically sync to backend for SOS/Alerts
      const userId = getCurrentUserId();
      if (userId) {
          updateRiskScore(userId, maxRiskScore).catch(err => console.error("Auto-sync failed", err));
      }

      navigate("/dashboard/recommendation", {
          state: {
            symptoms: combinedSymptoms,
            duration: combinedDuration,
            severity: combinedSeverity,
            fullContext: conversationText,
            riskScore: maxRiskScore 
          },
      });
  };
  
  const isDataComplete = !!(healthData.symptom && healthData.duration && healthData.severity) || healthHistory.length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] glass-card-strong rounded-3xl p-6 shadow-2xl border-2 border-primary/20 hover:border-primary/40 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div>
                 <h1 className="text-2xl font-bold">{t("ai_symptom_assistant")}</h1>
                 <p className="text-sm text-muted-foreground">{t("chat_subtitle")}</p>
            </div>
            
            {/* Live Data Status */}
            <div className="hidden sm:flex gap-2 text-xs">
                <Badge variant={healthData.symptom ? "default" : "outline"} className={healthData.symptom ? "bg-green-500 hover:bg-green-600" : ""}>
                    {healthData.symptom ? `${t("label_symptom")}: ${t(healthData.symptom.toLowerCase().replace(/ /g, '_'))}` : t("label_symptom")}
                </Badge>
                <Badge variant={healthData.duration ? "default" : "outline"} className={healthData.duration ? "bg-green-500 hover:bg-green-600" : ""}>
                    {healthData.duration ? `${t("label_duration")}: ${healthData.duration}` : t("label_duration")}
                </Badge>
                <Badge variant={healthData.severity ? "default" : "outline"} className={healthData.severity ? "bg-green-500 hover:bg-green-600" : ""}>
                    {healthData.severity ? `${t("label_severity")}: ${t(healthData.severity.toLowerCase())}` : t("label_severity")}
                </Badge>
            </div>

            <Button 
                variant={isDataComplete ? "default" : "secondary"} 
                size="sm" 
                onClick={navigateToRecommendation}
                disabled={!isDataComplete}
                className={isDataComplete ? "bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse" : "opacity-50"}
            >
                {isDataComplete ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
                {t("get_recommendation")}
            </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border relative">
          {/* Messages */}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20 dark:border-primary/20">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm flex flex-col gap-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none"
                }`}
              >
                <span>{msg.text}</span>
                 {msg.role === "ai" && (i === messages.length - 1 || speakingIndex === i) && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 self-end -mb-1 -mr-1 text-slate-400 hover:text-primary dark:text-slate-500 dark:hover:text-primary"
                      onClick={() => handleSpeak(msg.text, i)}
                    >
                      {speakingIndex === i ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
              )}
            </motion.div>
          ))}
          
          {isLoading && (
              <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
              </div>
          )}
          <div ref={bottomRef} />
        </div>
        
        {/* Info Box if data is partial */}
        {!isDataComplete && messages.length > 2 && (
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2"
             >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>
                    {t("need_know")}
                    {!healthData.symptom && <strong> {t("label_symptom")}</strong>}
                    {!healthData.symptom && (!healthData.duration || !healthData.severity) && ","}
                    {!healthData.duration && <strong> {t("label_duration")}</strong>}
                    {(!healthData.duration && !healthData.severity) && ` ${t("and")}`}
                    {!healthData.severity && <strong> {t("label_severity")}</strong>}
                    {" "}{t("to_provide_rec")}
                </span>
             </motion.div>
        )}

        <div className="flex gap-2 p-4 bg-white dark:bg-slate-950 border-t items-center">
           <div className="relative flex-1">
                <Input 
                        value={listening ? (input + (input ? " " : "") + transcript) : input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={listening ? t("listening") : t("type_placeholder")}
                        className="pr-12 py-6 rounded-full bg-slate-100 dark:bg-slate-900 border-none shadow-inner focus-visible:ring-primary"
                        disabled={isLoading}
                />
                <Button 
                    size="icon"
                    variant="ghost"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 ${listening ? "text-red-500 animate-pulse bg-red-100 dark:bg-red-900/20" : "text-slate-500"}`}
                    onClick={toggleListening}
                >
                    {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
           </div>
           
           <Button 
                onClick={handleSend} 
                disabled={(listening && !transcript && !input) || isLoading || (!input.trim() && !transcript)}
                size="icon"
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95 text-primary-foreground"
           >
               <Send className="w-5 h-5" />
           </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DescribePage;
