import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { calculateMonthlyScores, calculateYearlyScores } from "@/lib/tracker";
import { updateRiskScore, getCurrentUserId } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

const HealthTrackerPage = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [monthlyTasks, setMonthlyTasks] = useState<{label: string, score: number}[]>([]);
  const [yearlyTasks, setYearlyTasks] = useState<{label: string, score: number}[]>([]);

  // Removed manual sync logic as it is now automatic on event creation

  useEffect(() => {
    // Calculate and translate monthly labels (e.g. "Mar" -> "మార్చి")
    const monthly = calculateMonthlyScores().map(item => ({
       ...item,
       label: t(item.label.toLowerCase())
    }));
    setMonthlyTasks(monthly);
    setYearlyTasks(calculateYearlyScores());
  }, [language, t]);

  const currentData = viewMode === "monthly" ? monthlyTasks : yearlyTasks;
  const title = viewMode === "monthly" ? t("monthly_task_score") : t("yearly_task_score");

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 fade-in p-4 md:p-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("task_tracker_title")}</h1>
            <p className="text-muted-foreground mt-1">{t("monitor_tasks_desc")}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {/* View Mode Toggle */}
            <div className="flex p-1 bg-muted/50 rounded-xl w-full sm:w-auto justify-center">
              <button
                onClick={() => setViewMode("monthly")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all flex-1 sm:flex-none",
                  viewMode === "monthly"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("monthly")}
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all flex-1 sm:flex-none",
                  viewMode === "yearly"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("yearly")}
              </button>
            </div>

            {/* Tracking Switch */}
            <div className="flex items-center space-x-3 bg-card px-4 py-2.5 rounded-xl border border-border/40 shadow-sm w-full sm:w-auto justify-center">
              <Switch
                id="tracking-mode"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                className="data-[state=checked]:bg-primary"
              />
              <label
                htmlFor="tracking-mode"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {t("enable_task_tracking")}
              </label>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <AnimatePresence mode="wait">
          {isEnabled ? (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden bg-card/50 backdrop-blur-sm border-2 border-primary/30 hover:border-primary/50 transition-all duration-300">
                <CardHeader className="pb-2 border-b border-border/40">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
                       <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{t("performance_overview")}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 pb-8 px-6 md:px-8 space-y-7">
                  {currentData.map((item, index) => (
                    <motion.div 
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-sm font-medium w-12 text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                        <div className="flex-1 mx-5 h-3.5 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-sm relative group-hover:brightness-110 transition-all"
                          />
                        </div>
                        <span className="text-sm font-bold w-8 text-right text-foreground group-hover:text-primary transition-colors">
                          {item.score}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center"
            >
              <div className="p-4 rounded-full bg-muted mb-4 opacity-50">
                <Activity className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">{t("task_tracking_paused")}</p>
              <Button variant="link" onClick={() => setIsEnabled(true)} className="mt-2 text-primary">
                {t("resume_tracking")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
};

export default HealthTrackerPage;
