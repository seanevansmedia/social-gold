"use client";

import { useEffect, useState } from "react";

const themes = [
  { name: "Gold Leaf", id: "gold-leaf", color: "#ca8a04" },
  { name: "Midnight Cyber", id: "midnight-cyber", color: "#a855f7" },
  { name: "Oceanic Depths", id: "oceanic-depths", color: "#0ea5e9" },
  { name: "Sunset Vibes", id: "sunset-vibes", color: "#f97316" },
  { name: "Rose Quartz", id: "rose-quartz", color: "#e11d48" },
  { name: "Slate Pro", id: "slate-pro", color: "#64748b" },
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState("gold-leaf");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("social-theme");
    if (saved) {
      setCurrentTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const changeTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    if (themeId === "gold-leaf") {
        document.documentElement.removeAttribute("data-theme");
    } else {
        document.documentElement.setAttribute("data-theme", themeId);
    }
    localStorage.setItem("social-theme", themeId);
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[280px] md:w-64 rounded-2xl border border-white/10 bg-secondary p-4 shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-bottom-5">
          <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">
              Switch Aesthetic
            </span>
            <button onClick={() => setIsOpen(false)} className="text-foreground/40 hover:text-foreground p-1">✕</button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => changeTheme(t.id)}
                className={`flex flex-col items-center justify-center rounded-xl p-3 transition-all ${
                  currentTheme === t.id 
                    ? "bg-primary/20 ring-2 ring-primary" 
                    : "bg-background/50 hover:bg-background border border-white/5"
                }`}
              >
                <div
                  className="h-8 w-8 rounded-full border border-white/20 shadow-lg mb-2"
                  style={{ background: `linear-gradient(135deg, ${t.color}, #ffffff55)` }}
                />
                <span className="text-[10px] font-bold text-foreground truncate w-full text-center">
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all hover:scale-110 active:scale-95"
      >
        <span className="text-xl md:text-2xl group-hover:rotate-12 transition-transform duration-300">🎨</span>
      </button>
    </div>
  );
}