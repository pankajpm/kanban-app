"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // After mount, read the actual theme from the DOM (set by the inline script).
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme;
    setTheme(current ?? "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  // Render nothing until mounted to avoid hydration mismatch.
  if (!theme) return null;

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      type="button"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="1" x2="9" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="15" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="9" x2="3" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.54" y1="13.54" x2="14.95" y2="14.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.05" y1="14.95" x2="4.46" y2="13.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.54" y1="4.46" x2="14.95" y2="3.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M15.5 10.5A7 7 0 0 1 7.5 2.5a7 7 0 1 0 8 8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
