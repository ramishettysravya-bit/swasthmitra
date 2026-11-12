import { motion } from "framer-motion";
import { Users, Brain, BarChart3, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const StatsSection = () => {
  const { t } = useLanguage();

  const stats = [
    { icon: Users, label: t("trusted_users"), desc: t("trusted_users_desc") },
    { icon: Brain, label: t("ai_analysis"), desc: t("ai_analysis_desc") },
    { icon: BarChart3, label: t("smart_tracking"), desc: t("smart_tracking_desc") },
    { icon: Bell, label: t("smart_reminders"), desc: t("smart_reminders_desc") },
  ];

  return (
    <section className="relative z-10 px-6 md:px-12 py-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ icon: Icon, label, desc }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34,197,94,0.2)" }}
            className="glass-card-strong rounded-2xl p-6 cursor-default transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{label}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
