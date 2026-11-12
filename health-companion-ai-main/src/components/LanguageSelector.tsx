import { useState } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const languages = [
  { code: "en", label: "English" },
  { code: "te", label: "తెలుగు" },
];

const LanguageSelector = ({ direction = "down", showLabel = true }: { direction?: "up" | "down", showLabel?: boolean }) => {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg glass-card hover:scale-105 transition-transform text-sm w-full ${showLabel ? 'justify-between' : 'justify-center'}`}
        aria-label="Select language"
        title={!showLabel ? current?.label : ""}
      >
        <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary shrink-0" />
            {showLabel && <span className="text-foreground">{current?.label}</span>}
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} z-50 w-full min-w-[140px] glass-card-strong rounded-xl border border-border/50 py-1 shadow-lg`}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as "en" | "te");
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-primary/10 ${
                  language === lang.code ? "text-primary font-semibold" : "text-foreground"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
