import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Stethoscope, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AboutSection = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Stethoscope, title: t("ai_symptom_analysis"), desc: t("symptom_analysis_desc") },
    { icon: ShieldCheck, title: t("risk_score_class"), desc: t("risk_score_desc") },
    { icon: TrendingUp, title: t("health_tracking"), desc: t("health_tracking_desc") },
    { icon: Smartphone, title: t("digital_profile"), desc: t("digital_profile_desc") },
  ];

  return (
    <section className="relative z-10 px-6 md:px-12 py-20">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold font-display mb-4"
        >
          {t("about_swasthmithra")} <span className="gradient-text">{t("app_name")}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground max-w-2xl mx-auto"
        >
          {t("about_desc")}
        </motion.p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="glass-card rounded-2xl p-6 flex items-start gap-4"
          >
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default AboutSection;
