import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Activity, Mail, Lock, Eye, EyeOff, User, Shield, Stethoscope } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const LoginPage = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const body = isLogin ? { email, password } : { email, password, name };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.msg || "Authentication failed");
        return;
      }

      localStorage.setItem("userId", data.userId);

      if (isLogin) {
        if (data.profileSetup) {
          localStorage.setItem("profileSetup", "done");
          window.location.href = "/dashboard";
        } else {
          localStorage.removeItem("profileSetup");
          window.location.href = "/profile-setup";
        }
      } else {
        // Signup successful, valid userId is returned.
        localStorage.removeItem("profileSetup");
        window.location.href = "/profile-setup";
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert(error instanceof Error ? error.message : "An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-6 right-6 z-50">
         <LanguageSelector />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card-strong rounded-3xl p-8 md:p-10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="relative h-12 w-12 flex items-center justify-center">
               <Shield className="absolute h-full w-full text-primary opacity-20" strokeWidth={1.5} />
               <Heart className="h-6 w-6 text-primary fill-primary animate-heartbeat relative z-10" />
               <Stethoscope className="absolute -bottom-1 -right-1 h-6 w-6 text-accent z-20 drop-shadow-sm" />
            </div>
            <span className="text-xl font-bold gradient-text">{t("app_name")}</span>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2">
            {isLogin ? t("welcome_back") : t("create_account")}
          </h2>
          <p className="text-center text-muted-foreground text-sm mb-8">
            {isLogin ? t("sign_in_continue") : t("start_journey")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="mb-4">
                <label className="text-sm font-medium mb-1.5 block">{t("name") || "Name"}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-glow py-3 rounded-xl font-semibold text-primary-foreground"
            >
              {isLogin ? t("sign_in") : t("create_account")}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? t("dont_have_account") : t("already_have_account")}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? t("sign_up") : t("sign_in")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
