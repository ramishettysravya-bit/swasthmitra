import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Heart, Activity, User, MapPin, Phone, Mail, Droplets,
  ChevronRight, ChevronLeft, Upload, Check, Shield, Stethoscope,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

const stepsKeys = ["step_personal", "step_health", "step_location"];

const conditionsKeys = [
  "diabetes", "pcod_pcos", "hypertension", "thyroid",
  "asthma", "heart_disease", "arthritis", "none",
];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genderKeys = ["male", "female", "other"];

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    village: "",
    bloodGroup: "",
    conditions: [] as string[],
    reports: null as File | null,
    location: "",
    emergencyContact: "",
  });

  useEffect(() => {
    // Fetch user data to pre-fill
    const fetchUser = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const res = await fetch(`/api/user/${userId}`);
          if (res.ok) {
            const userData = await res.json();
            setForm((prev) => ({
              ...prev,
              name: userData.name || "",
              age: userData.age ? userData.age.toString() : "",
              gender: userData.gender || "",
              village: userData.village || "",
              bloodGroup: userData.bloodGroup || "",
              conditions: userData.conditions || [], 
              location: userData.location || "",
              emergencyContact: userData.emergencyContact || "",
            }));
          }
        } catch (err) {
            console.log("Error fetching user data", err);
        }
      }
    };
    fetchUser();
  }, []);

  const progress = ((step + 1) / stepsKeys.length) * 100;

  const update = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCondition = (c: string) => {
    // We store the keys for conditions to keep it language agnostic in state, 
    // or we can store the translated value. Storing keys is better for backend, 
    // but here we might just display what we select. 
    // The previous code stored "None" string.
    // Let's store the key for simplicity in logic.
    
    if (c === "none") {
      setForm((prev) => ({ ...prev, conditions: ["none"] }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(c)
        ? prev.conditions.filter((x) => x !== c)
        : [...prev.conditions.filter((x) => x !== "none"), c],
    }));
  };

  const canNext = () => {
    if (step === 0) return form.name && form.age && form.gender;
    if (step === 1) return form.bloodGroup;
      if (step === 2) {
          const isValidPhone = /^[6-9]\d{9}$/.test(form.emergencyContact);
          return form.location && isValidPhone && form.village;
      }
    return true;
  };

  const handleSubmit = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("User session not found. Please login again.");
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          ...form,
          age: parseInt(form.age) || 0, // Ensure age is a number
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.msg || "Failed to update profile");
        return;
      }

      localStorage.setItem("profileSetup", "done");
      navigate("/dashboard");
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Failed to connect to server");
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col relative">
      <div className="absolute top-6 right-6 z-50">
          <LanguageSelector />
      </div>

      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-10 flex items-center justify-center shrink-0">
             <Shield className="absolute h-full w-full text-primary opacity-20" strokeWidth={1.5} />
             <Heart className="h-5 w-5 text-primary fill-primary animate-heartbeat relative z-10" />
             <Stethoscope className="absolute -bottom-1 -right-1 h-5 w-5 text-accent z-20 drop-shadow-sm" />
          </div>
          <span className="font-bold gradient-text text-lg">{t("app_name")}</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="glass-card-strong rounded-3xl p-6 md:p-8">
            {/* Header */}
            <h1 className="text-2xl font-bold text-center mb-1">{t("setup_profile")}</h1>
            <p className="text-center text-muted-foreground text-sm mb-6">
              {t("profile_setup_step", { current: (step + 1).toString(), total: stepsKeys.length.toString(), step_name: t(stepsKeys[step]) })}
            </p>

            {/* Progress */}
            <Progress value={progress} className="h-2 mb-8" />

            {/* Steps */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {step === 0 && (
                  <>
                    <FieldInput
                      icon={<User className="h-4 w-4" />}
                      label={t("name")}
                      value={form.name}
                      onChange={(v) => update("name", v)}
                      placeholder=""
                    />
                    <FieldInput
                      icon={<User className="h-4 w-4" />}
                      label={t("age")}
                      value={form.age}
                      onChange={(v) => update("age", v)}
                      placeholder=""
                      type="number"
                    />
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("gender")}</label>
                      <div className="flex gap-2">
                        {genderKeys.map((g) => (
                          <button
                            key={g}
                            onClick={() => update("gender", g)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              form.gender === g
                                ? "bg-primary/15 text-primary border border-primary/30"
                                : "glass-card hover:bg-secondary/80"
                            }`}
                          >
                            {t(g)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("blood_group")}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {bloodGroups.map((bg) => (
                          <button
                            key={bg}
                            onClick={() => update("bloodGroup", bg)}
                            className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                              form.bloodGroup === bg
                                ? "bg-primary/15 text-primary border border-primary/30"
                                : "glass-card hover:bg-secondary/80"
                            }`}
                          >
                            <Droplets className="h-3 w-3 inline mr-1" />
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("existing_conditions")}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {conditionsKeys.map((c) => (
                          <button
                            key={c}
                            onClick={() => toggleCondition(c)}
                            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-2 ${
                              form.conditions.includes(c)
                                ? "bg-primary/15 text-primary border border-primary/30"
                                : "glass-card hover:bg-secondary/80"
                            }`}
                          >
                            {form.conditions.includes(c) && <Check className="h-3 w-3" />}
                            {t(c)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t("upload_reports")}
                      </label>
                      <label className="flex items-center gap-3 glass-card rounded-xl p-4 cursor-pointer hover:bg-secondary/80 transition-all">
                        <Upload className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {form.reports ? form.reports.name : "Choose file..."}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => update("reports", e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <FieldInput
                      icon={<MapPin className="h-4 w-4" />}
                      label={t("village")}
                      value={form.village}
                      onChange={(v) => update("village", v)}
                      placeholder=""
                    />
                    <FieldInput
                      icon={<MapPin className="h-4 w-4" />}
                      label={t("current_location")}
                      value={form.location}
                      onChange={(v) => update("location", v)}
                      placeholder="e.g. Bangalore, Karnataka"
                    />
                    <FieldInput
                      icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                      label="Emergency Contact Number (WhatsApp Active)"
                      value={form.emergencyContact}
                      onChange={(v) => {
                          // Allow digits, spaces, plus, dashes. Clean up for storage.
                          // But wait, backend logic expects 10 digits for auto +91.
                          // Or full E.164.
                          
                          // Let's just allow digits and + for now, and maybe limit length reasonably.
                          // If user pastes +91..., we want to keep it?
                          // The backend sanitizer handles +91... if length > 10.
                          
                          // New logic: allow + and digits. Max 15.
                          const val = v.replace(/[^0-9+]/g, '').slice(0, 15);
                          update("emergencyContact", val);
                      }}
                      placeholder="98765 43210"
                      type="tel"
                    />
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 rounded-xl glass-card font-semibold text-sm hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" /> {t("prev")}
                </button>
              )}
              {step < stepsKeys.length - 1 ? (
                <button
                  onClick={() => canNext() && setStep(step + 1)}
                  disabled={!canNext()}
                  className="flex-1 btn-glow py-3 rounded-xl font-semibold text-sm text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                   {t("next")} <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canNext()}
                  className="flex-1 btn-glow py-3 rounded-xl font-semibold text-sm text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" /> {t("complete")}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* Reusable field */
const FieldInput = ({
  icon, label, value, onChange, placeholder, type = "text",
}: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder: string; type?: string;
}) => (
  <div>
    <label className="text-sm font-medium mb-1.5 block">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
      />
    </div>
  </div>
);

export default ProfileSetupPage;
