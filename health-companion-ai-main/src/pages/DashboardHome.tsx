import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mic, Stethoscope, Heart } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const DashboardHome = () => {
  const { t, language } = useLanguage();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">
            {language === "en" ? "Welcome to " : ""}
            <span className="gradient-text">{t("app_name")}</span>
            {language === "te" ? " కు స్వాగతం" : ""}
          </h1>
          <p className="text-muted-foreground">{t("help_today")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div whileHover={{ scale: 1.02 }} className="glass-card-strong rounded-2xl p-6 md:p-8 border-2 border-primary/20 hover:border-primary/40 transition-colors duration-300">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Mic className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("describe_speak")}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t("describe_desc")}
            </p>
            <Link
              to="/dashboard/describe"
              className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground"
            >
              {t("describe_speak")}
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="glass-card-strong rounded-2xl p-6 md:p-8 border-2 border-primary/20 hover:border-primary/40 transition-colors duration-300">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Stethoscope className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("select_symptom_btn")}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t("select_symptom_desc")}
            </p>
            <Link
              to="/dashboard/symptoms"
              className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground"
            >
              {t("select_symptom_btn")}
            </Link>
          </motion.div>
        </div>

        <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          {t("guided_check_promo")}
        </p>
      </motion.div>
    </DashboardLayout>
  );
};

export default DashboardHome;
