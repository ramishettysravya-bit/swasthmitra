import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { ShieldCheck, AlertTriangle, AlertCircle, Home, MapPin, ExternalLink, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const RecommendationPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate(); // Add navigate hook
  const state = (location.state as { 
    symptoms?: string; 
    duration?: string; 
    severity?: string;
    riskScore?: number;
  }) || {};
  const [score, setScore] = useState(0);

  // Use passed risk score or fallback to simple severity check
  const targetScore = Math.min(100, Math.max(0, state.riskScore !== undefined 
    ? state.riskScore 
    : (state.severity?.toLowerCase().includes("severe") ? 78 : state.severity?.toLowerCase().includes("moderate") ? 52 : 28)));

  const riskLevel =
    targetScore >= 60 ? "high" : targetScore >= 35 ? "moderate" : "low";

  const hasNotified = useRef(false);

  useEffect(() => {
    if (riskLevel === "high" && !hasNotified.current) {
      const userId = localStorage.getItem("userId");
      if (userId) {
        hasNotified.current = true;
        
        fetch('/api/notifications/emergency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            symptoms: state.symptoms || "High risk symptoms detected", 
            riskLevel, 
            location: "Unknown"
          }),
        })
        .then(async (res) => {
           const data = await res.json();
           if (res.ok) {
             toast({
               title: "Emergency Alert Sent",
               description: `Alert sent to emergency contact: ${data.detail || ""}`,
               variant: "destructive", // Actually success, but alarming so red/destructive fits context
             });
           } else {
             toast({
               title: "Failed to Send Alert",
               description: `Error: ${data.detail || data.msg || "Unknown error"}`,
               variant: "destructive", 
             });
           }
        })
        .catch(err => {
            console.error("Failed to make alert request", err);
            toast({
               title: "Network Error",
               description: "Failed to connect to server.",
               variant: "destructive",
            });
        });
      }
    }
  }, [riskLevel, state.symptoms, toast]);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= targetScore) {
        clearInterval(interval);
        setScore(targetScore);
      } else {
        setScore(current);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [targetScore]);

  const handleFindNearbyHospitals = () => {
    toast({
      title: "Opening Maps...",
      description: "Searching for hospitals near you.",
    });
    // Open immediately to avoid popup blockers and uses Google's own "near me" resolution
    window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank');
  };

  const colorClass =
    riskLevel === "high"
      ? "text-destructive"
      : riskLevel === "moderate"
      ? "text-amber-500"
      : "text-primary";

  const Icon =
    riskLevel === "high"
      ? AlertCircle
      : riskLevel === "moderate"
      ? AlertTriangle
      : ShieldCheck;

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto relative pt-12">
        <Button 
            variant="ghost" 
            className="absolute top-0 left-0 hover:bg-transparent p-0 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigate(-1)}
        >
            <ArrowLeft className="w-5 h-5" />
            {t("back_to_chat")}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-strong rounded-3xl p-8 md:p-12 text-center mb-6"
        >
          <h1 className="text-2xl font-bold mb-8">{t("health_risk_assessment")}</h1>

          {/* Circular progress */}
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="8"
              />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${colorClass} transition-all duration-100`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
              <span className="text-xs text-muted-foreground">{t("risk_score")}</span>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            riskLevel === "high" ? "bg-destructive/10 text-destructive" :
            riskLevel === "moderate" ? "bg-amber-500/10 text-amber-500" :
            "bg-primary/10 text-primary"
          }`}>
            <Icon className="h-4 w-4" />
            {riskLevel === "high" ? t("risk_level_high") : riskLevel === "moderate" ? t("risk_level_moderate") : t("risk_level_low")}
          </div>

          {state.symptoms && (
            <div className="mt-6 text-left glass-card rounded-2xl p-6">
              <p className="text-sm text-muted-foreground mb-1">{t("symptoms_reported")}</p>
              <p className="text-sm font-medium">{state.symptoms.split(',').map((s: string) => t(s.trim().toLowerCase().replace(/ /g, '_'))).join(', ')}</p>
              <p className="text-sm text-muted-foreground mt-3 mb-1">{t("label_duration")}: <span className="text-foreground font-medium">{state.duration}</span></p>
              <p className="text-sm text-muted-foreground">{t("label_severity")}: <span className="text-foreground font-medium">{state.severity.split(',').map((s: string) => t(s.trim().toLowerCase())).join(', ')}</span></p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-strong rounded-2xl p-6"
        >
          <h3 className="font-semibold mb-4">{t("ai_recommendations")}</h3>
          <ul className="space-y-3 text-sm text-muted-foreground mb-6">
            {riskLevel === "high" ? (
              <>
                <li>⚠️ {t("consult_healthcare")}</li>
                <li>🏥 {t("visit_hospital")}</li>
                <li>💊 {t("avoid_self_medication")}</li>
              </>
            ) : riskLevel === "moderate" ? (
              <>
                <li>🩺 {t("monitor_24_48")}</li>
                <li>💧 {t("stay_hydrated")}</li>
                <li>📞 {t("contact_if_worsens")}</li>
              </>
            ) : (
              <>
                <li>✅ {t("mild_symptoms")}</li>
                <li>💧 {t("maintain_diet")}</li>
                <li>🧘 {t("stress_management")}</li>
              </>
            )}
          </ul>

          {riskLevel === "high" && (
            <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-4 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
                 <MapPin className="h-5 w-5 text-destructive" />
              </div>
              <h4 className="font-semibold text-destructive mb-4">
                {t('card_hospital_title')}
              </h4>
              <Button 
                variant="destructive" 
                className="w-full gap-2"
                onClick={handleFindNearbyHospitals}
              >
                  <ExternalLink className="h-4 w-4" />
                  {t('btn_find_hospitals')}
              </Button>
            </div>
          )}
        </motion.div>

        <div className="text-center mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" /> {t("back_to_dashboard")}
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RecommendationPage;
