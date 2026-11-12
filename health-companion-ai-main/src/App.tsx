import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardHome from "./pages/DashboardHome";
import DescribePage from "./pages/DescribePage";
import SelectSymptomPage from "./pages/SelectSymptomPage";
import RecommendationPage from "./pages/RecommendationPage";
import HealthTrackerPage from "./pages/HealthTrackerPage";
import HealthTipsPage from "./pages/HealthTipsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import NotFound from "./pages/NotFound";
import { LanguageProvider } from "./contexts/LanguageContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/describe" element={<DescribePage />} />
            <Route path="/dashboard/symptoms" element={<SelectSymptomPage />} />
            <Route path="/dashboard/recommendation" element={<RecommendationPage />} />
            <Route path="/dashboard/tracker" element={<HealthTrackerPage />} />
            <Route path="/dashboard/health-tips" element={<HealthTipsPage />} />
            <Route path="/dashboard/notifications" element={<NotificationsPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
