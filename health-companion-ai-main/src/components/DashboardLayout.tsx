import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Mic, Stethoscope, BarChart3, Bell, User,
  Moon, Sun, Heart, Activity, Menu, X, Shield, Lightbulb, ChevronLeft, ChevronRight
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

const navItems = [
  { icon: Home, labelKey: "nav_home", path: "/dashboard" },
  { icon: Mic, labelKey: "nav_describe", path: "/dashboard/describe" },
  { icon: Stethoscope, labelKey: "nav_symptoms", path: "/dashboard/symptoms" },
  { icon: BarChart3, labelKey: "nav_tracker", path: "/dashboard/tracker" },
  { icon: Lightbulb, labelKey: "nav_health_tips", path: "/dashboard/health-tips" },
  { icon: Bell, labelKey: "nav_notifications", path: "/dashboard/notifications" },
  { icon: User, labelKey: "nav_profile", path: "/dashboard/profile" },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { isDark, toggle } = useTheme();
  const { t, language } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen ${isCollapsed ? 'w-20' : 'w-72'} glass-card-strong border-r border-border/50 flex flex-col transition-all duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full"
        }`}
      >
        <div className={`p-3 lg:p-4 flex ${isCollapsed ? 'flex-col justify-center items-center gap-4' : 'flex-row items-center justify-between'} border-b border-border/50 transition-all duration-300`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative h-10 w-10 flex items-center justify-center shrink-0">
              <Shield className="absolute h-full w-full text-primary opacity-20" strokeWidth={1.5} />
              <Heart className="h-5 w-5 text-primary fill-primary animate-heartbeat relative z-10" />
              <Stethoscope className="absolute -bottom-1 -right-1 h-5 w-5 text-accent z-20 drop-shadow-sm" />
            </div>
            {!isCollapsed && (
              <span className="font-bold gradient-text text-lg hidden sm:inline whitespace-nowrap overflow-hidden">{t("app_name")}</span>
            )}
          </div>
          
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Desktop Toggle - Top Right */}
          <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="hidden lg:flex items-center justify-center p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          >
             {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map(({ icon: Icon, labelKey, path }) => {
            const active = location.pathname === path;
            const isTelugu = language === 'te';
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isTelugu ? "text-sm font-semibold leading-relaxed" : "text-sm font-semibold"
                } ${
                  active
                    ? "bg-primary/10 text-primary"
                    : isTelugu 
                      ? "text-slate-900 dark:text-slate-100 hover:bg-secondary" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-secondary hover:text-foreground"
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? t(labelKey) : ""}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="">{t(labelKey)}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-3">
          <div className={`hidden lg:block ${isCollapsed ? 'flex justify-center' : ''}`}>
             <LanguageSelector direction="up" showLabel={!isCollapsed} />
          </div>
          <button
            onClick={toggle}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
              language === 'te' 
                ? "text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-secondary" 
                : "text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-secondary"
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? (isDark ? t("mode_light") : t("mode_dark")) : ""}
          >
            {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {!isCollapsed && (isDark ? t("mode_light") : t("mode_dark"))}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border/50 glass-card-strong">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <span className="font-bold gradient-text">{t("app_name")}</span>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button onClick={toggle}>
              {isDark ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
