import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Activity, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { saveHealthEvent } from "@/lib/tracker";
import { updateRiskScore, getCurrentUserId } from "@/lib/api";

// Types
type Subtype = { id: string; label: string; emoji: string; desc: string; severity: number };
type Symptom = { id: string; image: string; label: string; baseSeverity: number; subtypes: Subtype[] };

const getSymptomsData = (t: (key: string, params?: Record<string, string>) => string): Symptom[] => [
  {
    id: "headache",
    image: "/images/headache.jpg", 
    label: t("headache"),
    baseSeverity: 30,
    subtypes: [
      { id: "migraine", label: t("migraine"), emoji: "⚡", desc: t("intense_pulsing"), severity: 20 },
      { id: "tension", label: t("tension"), emoji: "😫", desc: t("dull_aching"), severity: 10 },
      { id: "cluster", label: t("cluster"), emoji: "🔥", desc: t("severe_burning"), severity: 35 },
      { id: "sinus", label: t("sinus"), emoji: "👃", desc: t("pressure_cheekbones"), severity: 15 },
      { id: "thunderclap", label: t("thunderclap"), emoji: "💥", desc: t("sudden_severe"), severity: 60 },
    ]
  },
  {
    id: "fever",
    image: "/images/fever.jpg",
    label: t("fever"),
    baseSeverity: 25,
    subtypes: [
      { id: "low_grade", label: t("low_grade"), emoji: "🌡️", desc: t("temp_range_low"), severity: 5 },
      { id: "high_grade", label: t("high_grade"), emoji: "🔥", desc: t("temp_range_high"), severity: 40 },
      { id: "chills", label: t("with_chills"), emoji: "🥶", desc: t("shivering"), severity: 20 },
      { id: "night_sweats", label: t("night_sweats"), emoji: "🌙", desc: t("heavy_sweating"), severity: 25 },
    ]
  },
  {
    id: "chest_pain",
    image: "/images/chestpain.jpeg",
    label: t("chest_pain"),
    baseSeverity: 50,
    subtypes: [
      { id: "sharp", label: t("sharp_pain"), emoji: "🔪", desc: t("stabbing_sensation"), severity: 20 },
      { id: "tightness", label: t("tightness"), emoji: "🧱", desc: t("heavy_weight"), severity: 45 },
      { id: "burning", label: t("burning"), emoji: "🔥", desc: t("burning_breastbone"), severity: 10 },
      { id: "radiating", label: t("radiating_pain"), emoji: "💪", desc: t("pain_arm_jaw"), severity: 45 },
    ]
  },
  {
    id: "stomach",
    image: "/images/stomachpain.jpg",
    label: t("stomach_pain"),
    baseSeverity: 20,
    subtypes: [
      { id: "bloating", label: t("bloating"), emoji: "🎈", desc: t("feeling_full"), severity: 5 },
      { id: "cramps", label: t("cramps"), emoji: "🥨", desc: t("muscle_pain"), severity: 10 },
      { id: "nausea", label: t("nausea"), emoji: "🤮", desc: t("queasy"), severity: 15 },
      { id: "sharp_abdominal", label: t("sharp_abdominal_pain"), emoji: "🔪", desc: t("intense_localized"), severity: 35 },
      { id: "burning_stomach", label: t("burning_stomach"), emoji: "🔥", desc: t("gnawing_burning"), severity: 10 },
    ]
  },
  {
    id: "cough",
    image: "/images/cough.jpg",
    label: t("cough"),
    baseSeverity: 15,
    subtypes: [
      { id: "dry", label: t("dry_cough"), emoji: "🏜️", desc: t("tickly"), severity: 5 },
      { id: "wet", label: t("wet_cough"), emoji: "💧", desc: t("mucus_phlegm"), severity: 10 },
      { id: "barking", label: t("barking"), emoji: "🐶", desc: t("seal_sound"), severity: 15 },
      { id: "blood", label: t("coughing_blood"), emoji: "🩸", desc: t("blood_sputum"), severity: 50 },
      { id: "persistent", label: t("persistent"), emoji: "📅", desc: t("long_lasting"), severity: 25 },
    ]
  },
  {
    id: "fatigue",
    image: "/images/fatigue.jpg",
    label: t("fatigue"),
    baseSeverity: 10,
    subtypes: [
      { id: "general", label: t("general_weakness"), emoji: "🔋", desc: t("lack_energy"), severity: 10 },
      { id: "sleepy", label: t("drowsiness"), emoji: "💤", desc: t("abnormally_sleepy"), severity: 5 },
      { id: "exhaustion", label: t("exhaustion"), emoji: "😫", desc: t("extreme_tiredness"), severity: 15 },
      { id: "fainting", label: t("fainting"), emoji: "😵", desc: t("loss_consciousness"), severity: 40 },
    ]
  },
  {
    id: "skin",
    image: "/images/skinrash.jpeg",
    label: t("skin_rash"),
    baseSeverity: 10,
    subtypes: [
      { id: "itchy", label: t("itchy"), emoji: "🐜", desc: t("urge_scratch"), severity: 5 },
      { id: "painful", label: t("painful"), emoji: "⚡", desc: t("tender_touch"), severity: 15 },
      { id: "blister", label: t("blisters"), emoji: "🫧", desc: t("fluid_pockets"), severity: 20 },
      { id: "hives", label: t("hives"), emoji: "🔴", desc: t("raised_welts"), severity: 10 },
      { id: "spreading", label: t("rapidly_spreading"), emoji: "⏩", desc: t("rash_growing"), severity: 30 },
    ]
  },
  {
    id: "dizziness",
    image: "/images/dizziness.jpeg",
    label: t("dizziness"),
    baseSeverity: 20,
    subtypes: [
      { id: "lightheaded", label: t("lightheaded"), emoji: "☁️", desc: t("feeling_faint"), severity: 10 },
      { id: "vertigo", label: t("vertigo"), emoji: "🌀", desc: t("room_spinning"), severity: 20 },
      { id: "balance", label: t("off_balance"), emoji: "⚖️", desc: t("unsteady"), severity: 15 },
      { id: "confusion", label: t("with_confusion"), emoji: "😵‍💫", desc: t("mental_fogginess"), severity: 45 },
    ]
  },
  {
    id: "joint",
    image: "/images/jointpain.jpeg",
    label: t("joint_pain"),
    baseSeverity: 15,
    subtypes: [
      { id: "swollen", label: t("swollen"), emoji: "🐡", desc: t("puffy_tender"), severity: 15 },
      { id: "stiff", label: t("stiff"), emoji: "🪵", desc: t("hard_move"), severity: 10 },
      { id: "aching", label: t("deep_ache"), emoji: "😩", desc: t("constant_throbbing"), severity: 10 },
      { id: "redness", label: t("red_hot"), emoji: "🔥", desc: t("hot_touch"), severity: 25 },
    ]
  },
  {
    id: "anxiety",
    image: "/images/anxiety.jpg",
    label: t("anxiety"),
    baseSeverity: 15,
    subtypes: [
      { id: "panic", label: t("panic_attack"), emoji: "🙀", desc: t("sudden_fear"), severity: 20 },
      { id: "worry", label: t("excessive_worry"), emoji: "💭", desc: t("cant_stop_thinking"), severity: 10 },
      { id: "restless", label: t("restlessness"), emoji: "🏃", desc: t("feeling_edge"), severity: 5 },
      { id: "palpitations", label: t("heart_palpitations"), emoji: "💓", desc: t("heart_racing"), severity: 25 },
    ]
  },
  {
    id: "breathing",
    image: "/images/breathingissues.jpg",
    label: t("breathing_issues"),
    baseSeverity: 40,
    subtypes: [
      { id: "shortness", label: t("shortness_breath"), emoji: "😮‍💨", desc: t("cant_get_air"), severity: 30 },
      { id: "wheezing", label: t("wheezing"), emoji: "🔊", desc: t("whistling_sound"), severity: 20 },
      { id: "rapid", label: t("rapid_breathing"), emoji: "⏱️", desc: t("breathing_faster"), severity: 25 },
      { id: "choking", label: t("choking_sensation"), emoji: "🤐", desc: t("throat_blockage"), severity: 40 },
    ]
  },
  {
    id: "eye",
    image: "/images/eyeissue.jpeg",
    label: t("eye_problems"),
    baseSeverity: 15,
    subtypes: [
      { id: "blurred", label: t("blurred_vision"), emoji: "👓", desc: t("out_of_focus"), severity: 15 },
      { id: "redness", label: t("redness"), emoji: "🔴", desc: t("bloodshot"), severity: 5 },
      { id: "pain", label: t("eye_pain"), emoji: "😫", desc: t("hurts_move"), severity: 15 },
      { id: "vision_loss", label: t("sudden_vision_loss"), emoji: "🌑", desc: t("blindness"), severity: 55 },
    ]
  },
];

const SelectSymptomPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const symptomsData = getSymptomsData(t);

  const durations = [
    t("less_than_day"),
    t("1-3_days"),
    t("3-7_days"),
    t("more_than_week"),
  ];

  const severities = [
    { level: t("mild"), color: "bg-green-100 text-green-800", desc: t("interfere_none"), value: 0 },
    { level: t("moderate"), color: "bg-yellow-100 text-yellow-800", desc: t("interfere_some"), value: 15 },
    { level: t("severe"), color: "bg-red-100 text-red-800", desc: t("interfere_all"), value: 30 },
  ];

  const [step, setStep] = useState(1);
  const [selectedDetails, setSelectedDetails] = useState<{
    symptoms: Symptom[];
    subtypes: Record<string, Subtype>;
    durations: Record<string, string>;
    severities: Record<string, string>;
  }>({
    symptoms: [],
    subtypes: {},
    durations: {},
    severities: {},
  });

  const handleSymptomSelect = (symptom: Symptom) => {
    setSelectedDetails(prev => {
      const exists = prev.symptoms.find(s => s.id === symptom.id);
      if (exists) {
        // Remove
        const newSymptoms = prev.symptoms.filter(s => s.id !== symptom.id);
        const { [symptom.id]: _, ...newSubtypes } = prev.subtypes;
        const { [symptom.id]: __, ...newDurations } = prev.durations;
        const { [symptom.id]: ___, ...newSeverities } = prev.severities;
        return { ...prev, symptoms: newSymptoms, subtypes: newSubtypes, durations: newDurations, severities: newSeverities };
      } else {
        // Add
        return { ...prev, symptoms: [...prev.symptoms, symptom] };
      }
    });
  };

  const handleSubtypeSelect = (symptomId: string, subtype: Subtype) => {
    setSelectedDetails(prev => ({
      ...prev,
      subtypes: { ...prev.subtypes, [symptomId]: subtype }
    }));
  };

  const handleDetailSelect = (symptomId: string, key: 'durations' | 'severities', value: string) => {
    setSelectedDetails(prev => ({
        ...prev,
        [key]: { ...prev[key], [symptomId]: value }
    }));
  };

  const calculateRiskScore = () => {
    const { symptoms, subtypes, severities: selectedMagnitudes, durations: selectedDurations } = selectedDetails;
    if (symptoms.length === 0) return 0;
    
    let totalScore = 0;

    symptoms.forEach(sym => {
        const severityLvl = selectedMagnitudes[sym.id];
        const durationLvl = selectedDurations[sym.id];
        const sub = subtypes[sym.id];

        // Base + Subtype Score
        let localScore = sym.baseSeverity;
        if (sub) localScore += sub.severity;
        
        // Severity Score
        const severityObj = severities.find(s => s.level === severityLvl);
        if (severityObj) localScore += severityObj.value;

        // Duration Score
        if (durationLvl === durations[2]) localScore += 10;
        if (durationLvl === durations[3]) localScore += 20;
        
        totalScore += localScore;
    });

    // Normalize: If we just sum, scoring can go > 100 easily with multiple symptoms
    // Let's cap at 100 max
    return Math.min(100, totalScore);
  };
    
  const handleSubmit = () => {
    const { symptoms, subtypes, durations: selectedDurations, severities: selectedSeverities } = selectedDetails;
    const allComplete = symptoms.every(s => selectedDurations[s.id] && selectedSeverities[s.id]);
    
    if (!allComplete) return;
    
    const riskScore = calculateRiskScore();
    const combinedSymptoms = symptoms.map(s => {
        const sub = subtypes[s.id];
        return `${s.label}${sub ? ` (${sub.label})` : ''}`;
    }).join(", ");
    
    const aggregatedDuration = symptoms.map(s => `${s.label}: ${selectedDurations[s.id]}`).join("; ");
    const aggregatedSeverity = symptoms.map(s => `${s.label}: ${selectedSeverities[s.id]}`).join("; ");

    let sev: 'low' | 'medium' | 'high' = 'medium';
    if (riskScore >= 60) sev = 'high';
    else if (riskScore < 30) sev = 'low';

    saveHealthEvent({
       type: 'symptom_select',
       severity: sev,
       riskScore: riskScore,
       details: combinedSymptoms,
    });
    
    // Auto-sync risk score to backend
    const userId = getCurrentUserId();
    if (userId) {
        updateRiskScore(userId, riskScore).catch(e => console.error("Risk update failed", e));
    }

    navigate("/dashboard/recommendation", {
      state: { 
        symptoms: combinedSymptoms, 
        duration: aggregatedDuration, 
        severity: aggregatedSeverity,
        details: selectedDetails,
        riskScore 
      },
    });
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Progress Header */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <Button 
                    variant="ghost" 
                    onClick={goBack} 
                    disabled={step === 1}
                    className={`${step === 1 ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
                </Button>
                <div className="text-sm font-medium text-muted-foreground">
                    {t("step_of", { current: step.toString(), total: "3" })}
                </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                        s <= step ? "bg-primary" : "bg-muted"
                    }`} />
                ))}
            </div>
            
            <h1 className="text-3xl font-bold mt-4">
                {step === 1 && t("whats_bothering")}
                {step === 2 && t("what_kind_of", { symptom: selectedDetails.symptom?.label.toLowerCase() || "" })}
                {step === 3 && t("tell_us_more")}
            </h1>
            <p className="text-muted-foreground mt-2">
                {step === 1 && t("select_main_symptom")}
                {step === 2 && t("select_specific_type")}
                {step === 3 && t("help_understand")}
            </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Main Symptoms (IMAGES) */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {symptomsData.map((symptom) => {
                  const isSelected = selectedDetails.symptoms.some(s => s.id === symptom.id);
                  return (
                    <button
                      key={symptom.id}
                      onClick={() => handleSymptomSelect(symptom)} // toggle
                      className={`group relative flex flex-col overflow-hidden rounded-2xl transition-all hover:shadow-xl hover:-translate-y-1 border-2 ${
                        isSelected 
                          ? "border-primary ring-2 ring-primary ring-offset-2" 
                          : "border-transparent hover:border-primary/20 glass-card"
                      }`}
                    >
                      <div className="relative w-full aspect-[4/3] overflow-hidden">
                        <div className={`absolute inset-0 transition-colors z-10 ${isSelected ? 'bg-primary/20' : 'bg-black/10 group-hover:bg-black/0'}`} />
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-20 bg-primary text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        <img 
                            src={symptom.image} 
                            alt={symptom.label}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className={`p-4 text-center w-full ${isSelected ? 'bg-primary/10' : 'bg-card/50 backdrop-blur-sm'}`}>
                        <span className="font-bold text-lg text-foreground">{symptom.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                 <Button 
                    size="lg" 
                    onClick={() => setStep(2)} 
                    disabled={selectedDetails.symptoms.length === 0}
                    className="gap-2"
                 >
                    {t("next")} <ArrowRight className="w-4 h-4" />
                 </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Subtypes */}
          {step === 2 && selectedDetails.symptoms.length > 0 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-10 pb-20"
            >
              {selectedDetails.symptoms.map((symptom) => (
                <div key={symptom.id} className="glass-card-strong p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20">
                            <img src={symptom.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{t("what_kind_of", { symptom: symptom.label })}</h2>
                            <p className="text-sm text-muted-foreground">{t("select_specific_type")}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {symptom.subtypes.map((subtype) => {
                        const isSelected = selectedDetails.subtypes[symptom.id]?.id === subtype.id;
                        return (
                            <button
                            key={subtype.id}
                            onClick={() => handleSubtypeSelect(symptom.id, subtype)}
                            className={`text-left p-4 rounded-xl transition-all border-2 group relative overflow-hidden ${
                                isSelected 
                                ? "bg-primary/10 border-primary shadow-sm"
                                : "glass-card hover:bg-primary/5 border-transparent hover:border-primary/30"
                            }`}
                            >
                            <div className="flex items-start gap-4 z-10 relative">
                                <div className="text-2xl shrink-0 bg-background/50 p-2 rounded-lg">
                                    {subtype.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-semibold text-base mb-1 truncate ${isSelected ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>
                                            {subtype.label}
                                        </h3>
                                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{subtype.desc}</p>
                                </div>
                            </div>
                            </button>
                        );
                    })}
                    
                    {/* Fallback option */}
                    <button
                        onClick={() => handleSubtypeSelect(symptom.id, { id: 'unsure', label: t("not_sure"), emoji: '❓', desc: t("unsure_desc"), severity: 10 })}
                        className={`text-left p-4 rounded-xl border-2 border-dashed transition-all flex items-center gap-3 ${
                            selectedDetails.subtypes[symptom.id]?.id === 'unsure'
                            ? "border-primary bg-muted/50" 
                            : "border-muted hover:border-primary/50 hover:bg-muted/30"
                        }`}
                    >
                        <div className="text-2xl p-2">❓</div>
                        <div>
                            <span className="font-medium text-sm block">{t("not_sure")}</span>
                        </div>
                    </button>
                    </div>
                </div>
              ))}

              <div className="fixed bottom-0 left-0 right-0 p-4 glass-card border-t border-border/50 flex justify-between items-center z-50 lg:pl-64">
                    <div className="text-sm text-muted-foreground hidden sm:block px-4">
                        {Object.keys(selectedDetails.subtypes).length} / {selectedDetails.symptoms.length} {t("selected_condition")}
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto px-4 justify-end">
                        <Button variant="outline" onClick={() => setStep(1)}>{t("back")}</Button>
                        <Button 
                            onClick={() => setStep(3)} 
                            // Require at least one subtype selection? Or optional? Ideally optional but better UX is all.
                            // Let's require all for completeness as per logic
                            disabled={Object.keys(selectedDetails.subtypes).length !== selectedDetails.symptoms.length}
                        >
                            {t("next")} <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Duration & Severity */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto space-y-8"
            >
               {/* Header / Change Selection */}
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{t("selected_condition")}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}>{t("change")}</Button>
               </div>

               {/* Loop through each selected symptom for details */}
               {selectedDetails.symptoms.map((symptom) => {
                 const sub = selectedDetails.subtypes[symptom.id];
                 return (
                   <div key={symptom.id} className="glass-card-strong p-6 rounded-2xl border border-border/50">
                      {/* Symptom Header */}
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/20">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm">
                              <img src={symptom.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                              <div className="font-bold text-xl">{symptom.label}</div>
                              <div className="text-base text-primary flex items-center gap-2">
                                  <span className="text-xl">{sub?.emoji}</span> {sub?.label || t("not_sure")}
                              </div>
                          </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                          {/* Duration */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-base">{t("how_long")}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {durations.map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => handleDetailSelect(symptom.id, 'durations', d)}
                                        className={`px-3 py-3 text-sm rounded-xl border text-left transition-all flex items-center justify-between ${
                                            selectedDetails.durations[symptom.id] === d 
                                            ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm" 
                                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                                        }`}
                                    >
                                       <span className="font-medium truncate">{d}</span>
                                       {selectedDetails.durations[symptom.id] === d && <Check className="w-3 h-3 text-primary shrink-0" />}
                                    </button>
                                ))}
                            </div>
                          </div>

                          {/* Severity */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-base">{t("how_severe")}</h3>
                            </div>
                            <div className="space-y-3">
                                {severities.map((s) => (
                                    <button
                                        key={s.level}
                                        onClick={() => handleDetailSelect(symptom.id, 'severities', s.level)}
                                        className={`w-full px-4 py-3 rounded-xl border text-left transition-all group ${
                                            selectedDetails.severities[symptom.id] === s.level
                                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.color}`}>
                                            {s.level}
                                            </span>
                                            {selectedDetails.severities[symptom.id] === s.level && <Check className="w-4 h-4 text-primary" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{s.desc}</p>
                                    </button>
                                ))}
                            </div>
                          </div>
                      </div>
                   </div>
                 );
               })}

              <div className="pt-6 pb-20">
                <Button 
                    size="lg" 
                    className="w-full text-lg h-14 shadow-lg hover:shadow-primary/25 rounded-2xl"
                    disabled={!selectedDetails.symptoms.every(s => selectedDetails.durations[s.id] && selectedDetails.severities[s.id])}
                    onClick={handleSubmit}
                >
                    {t("get_detailed_analysis")} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default SelectSymptomPage;


