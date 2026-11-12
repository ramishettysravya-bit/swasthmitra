
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Heart, MapPin, Shield, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

const ProfilePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();
        if (response.ok) {
           setProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="rounded-3xl p-8 border border-white/20 bg-white/10 backdrop-blur-lg">
             <div className="flex items-center gap-4 mb-8">
               <Skeleton className="h-16 w-16 rounded-2xl" />
               <div className="space-y-2">
                 <Skeleton className="h-6 w-32" />
                 <Skeleton className="h-4 w-48" />
               </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {[...Array(6)].map((_, i) => (
                 <Skeleton key={i} className="h-20 rounded-xl w-full" />
               ))}
             </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) return <div>Error loading profile.</div>;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t("nav_profile")}</h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-strong rounded-3xl p-8 shadow-2xl border-2 border-primary/20 hover:border-primary/40 transition-colors duration-300"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="glass-card bg-transparent shadow-md rounded-xl p-4 flex items-center gap-3">
              <User className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t("age")}</p>
                <p className="font-medium">{profile.age} {t("years_text")}</p>
              </div>
            </div>
            
            <div className="glass-card bg-transparent shadow-md rounded-xl p-4 flex items-center gap-3">
              <User className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t("gender")}</p>
                <p className="font-medium">{t(profile.gender)}</p>
              </div>
            </div>

            <div className="glass-card bg-transparent shadow-md rounded-xl p-4 flex items-center gap-3">
              <Heart className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t("blood_group")}</p>
                <p className="font-medium">{profile.bloodGroup}</p>
              </div>
            </div>

            <div className="glass-card bg-transparent shadow-md rounded-xl p-4 flex items-center gap-3">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t("existing_conditions")}</p>
                <p className="font-medium">{profile.conditions?.map((c: string) => t(c)).join(", ")}</p>
              </div>
            </div>

            <div className="glass-card bg-transparent shadow-md rounded-xl p-4 flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t("current_location")}</p>
                <p className="font-medium">{profile.location}</p>
              </div>
            </div>

            <div className="glass-card bg-transparent shadow-md rounded-xl p-4 flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t("emergency_contact") || "Emergency Contact"}</p>
                <p className="font-medium">{profile.emergencyContact}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate("/profile-setup")} 
              className="btn-glow px-6 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground"
            >
              {t("edit_profile")}
            </button>
            <Link
              to="/"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold glass-card hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </Link>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
