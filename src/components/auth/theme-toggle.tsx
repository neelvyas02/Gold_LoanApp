import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial theme from document class or localStorage
    const savedTheme = localStorage.getItem("theme");
    const hasDarkClass = document.documentElement.classList.contains("dark");

    if (savedTheme === "dark" || (!savedTheme && hasDarkClass)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      // Default to dark mode for luxury fintech look
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <>
          <Sun className="h-3.5 w-3.5 text-gold animate-in fade-in zoom-in-75 duration-200" />
          <span className="hidden sm:inline text-muted-foreground hover:text-foreground">Light</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-gold animate-in fade-in zoom-in-75 duration-200" />
          <span className="hidden sm:inline text-muted-foreground hover:text-foreground">Dark</span>
        </>
      )}
    </button>
  );
}
