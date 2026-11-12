
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Simplified symptom data for preview
const getSymptomsPreview = (t: (key: string, params?: Record<string, string>) => string) => [
  { id: "headache", image: "/images/headache.jpg", label: t("headache") },
  { id: "fever", image: "/images/fever.jpg", label: t("fever") },
  { id: "chest_pain", image: "/images/chestpain.jpeg", label: t("chest_pain") },
  { id: "stomach", image: "/images/stomachpain.jpg", label: t("stomach_pain") },
  { id: "cough", image: "/images/cough.jpg", label: t("cough") },
  { id: "fatigue", image: "/images/fatigue.jpg", label: t("fatigue") },
  { id: "skin", image: "/images/skinrash.jpeg", label: t("skin_rash") },
];

const SymptomPreviewSection = () => {
  const { t } = useLanguage();
  const symptoms = getSymptomsPreview(t);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden" id="symptoms">
       <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold font-display mb-4 gradient-text"
          >
            {t("identify_symptoms")}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            {t("select_symptom_instruction") || "Select a symptom to get started with your health assessment."}
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {symptoms.map((symptom) => (
            <motion.div key={symptom.id} variants={item}>
              <Link to="/login">
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 border-none h-full group cursor-pointer">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={symptom.image} 
                      alt={symptom.label}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                    <div className="absolute bottom-3 left-3 text-white font-medium text-lg">
                      {symptom.label}
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
          
          {/* 'More' Card */}
          <motion.div variants={item}>
            <Link to="/login">
              <Card className="h-full bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors flex items-center justify-center min-h-[160px] group cursor-pointer">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-semibold text-primary">{t("view_more_symptoms")}</span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        <div className="mt-12 text-center">
          <Link to="/login">
            <Button size="lg" className="rounded-full px-8 text-lg hover:shadow-xl hover:shadow-primary/20 transition-all">
              {t("start_assessment")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SymptomPreviewSection;
