import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Shield, Stethoscope, Moon, Sun, Activity, ArrowRight } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import FloatingParticles from "@/components/landing/FloatingParticles";
import FloatingIcons from "@/components/landing/FloatingIcons";
import StatsSection from "@/components/landing/StatsSection";
import AboutSection from "@/components/landing/AboutSection";
import ContactSection from "@/components/landing/ContactSection";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const letterContainer = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const letter = {
  hidden: { opacity: 0, x: -20 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", damping: 12, stiffness: 100 }
  }
};

const LandingPage = () => {
  const { isDark, toggle } = useTheme();
  const { t, language } = useLanguage();

  const appName = t("app_name");
  
  // Custom optimal segmentation for Telugu title to ensure vathulu stay attached
  let titleSegments: string[];
  
  if (language === 'te' && appName.includes("స్వస్థమిత్ర")) {
    // Manually segment "Swa-stha-mi-thra" to keep ligatures intact during animation
    titleSegments = ["స్వ", "స్థ", "మి", "త్ర"];
  } else {
    // Use Intl.Segmenter if available, otherwise simple split
    titleSegments = typeof Intl !== "undefined" && (Intl as any).Segmenter
      ? Array.from(new (Intl as any).Segmenter(language === 'te' ? 'te' : 'en', { granularity: "grapheme" }).segment(appName)).map((s: any) => s.segment)
      : appName.split("");
  }

  return (
    <div id="home" className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-10 flex items-center justify-center">
            <Shield className="absolute h-full w-full text-primary opacity-20" strokeWidth={1.5} />
            <Heart className="h-5 w-5 text-primary fill-primary animate-heartbeat relative z-10" />
            <Stethoscope className="absolute -bottom-1 -right-1 h-5 w-5 text-accent z-20 drop-shadow-sm" />
          </div>
          <span className="text-xl font-bold font-display gradient-text">{t("app_name")}</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 font-medium ml-auto mr-8">
             <a href="#home" className="hover:text-primary transition-colors">{t("nav_home")}</a>
             <a href="#about" className="hover:text-primary transition-colors">{t("about_swasthmithra")}</a>
             <a href="#contact" className="hover:text-primary transition-colors">{t("nav_contact")}</a>
             <Link to="/login" className="hover:text-primary transition-colors">{t("nav_login")}</Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <button
            onClick={toggle}
            className="p-2 rounded-lg glass-card hover:scale-105 transition-transform"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
          </button>
          
          {/* Mobile Menu Button - Todo: Implement Sheet or Dropdown if needed, for now just links are hidden on mobile */}
        </div>
      </nav>

      {/* Hero */}
      <section>
      <FloatingParticles />
      <FloatingIcons />

      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 md:pt-28 md:pb-36">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl">
          <motion.div variants={item} className="mb-2">
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-primary" />
              {t("ai_powered_platform")}
            </div>
          </motion.div>

          <motion.h1
            variants={item}
            className={`font-extrabold font-display tracking-tight ${
              language === 'te' 
                ? "text-5xl sm:text-6xl md:text-8xl py-4 -mb-8 leading-snug" 
                : "text-4xl sm:text-5xl md:text-7xl mb-6"
            }`}
          >
            <motion.span 
              variants={letterContainer}
              className={`gradient-text inline-block ${language === 'te' ? 'gradient-text-lg' : ''}`}
            >
              {titleSegments.map((char, index) => (
                <motion.span
                  key={index}
                  variants={letter}
                  className={`inline-block ${language === 'te' ? 'mr-[0.05em]' : ''}`}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg md:text-2xl text-muted-foreground font-medium mb-10"
          >
            {t("health_anytime")}
          </motion.p>

          <motion.div variants={item}>
            <Link
              to="/login"
              className="btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold text-primary-foreground"
            >
              {t("get_started")}
              <ArrowRight className="ml-1 w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>
      </section>

      {/* Stats */}
      <div id="stats">
         <StatsSection />
      </div>

      <div className="w-full h-[1px] bg-primary/30" />

      {/* About */}
      <div id="about" className="bg-emerald-50 dark:bg-emerald-950/20">
         <AboutSection />
      </div>

      <div className="w-full h-[1px] bg-primary/30" />

      {/* Contact Section */}
      <section className="relative z-10 py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4 leading-relaxed pb-1">
            {t("ready_take_control_1")} <span className="gradient-text inline-block pb-2">{t("health")}</span>{t("ready_take_control_2")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t("join_thousands_desc")}
          </p>
          <Link
            to="/login"
            className="btn-glow inline-flex items-center gap-2 px-10 py-4 rounded-full text-lg font-semibold text-primary-foreground"
          >
            {t("get_started_now")}
          </Link>
        </motion.div>
      </section>

      <div className="w-full h-[1px] bg-primary/30" />

      {/* Contact Section */}
      <div id="contact" className="bg-emerald-50 dark:bg-emerald-950/20">
         <ContactSection />
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-muted-foreground border-t border-border/50">
        {t("all_rights_reserved")}
      </footer>
    </div>
  );
};

export default LandingPage;
