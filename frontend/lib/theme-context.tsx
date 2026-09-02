"use client";

// Light/dark theme toggle for the Nocturne UI — applies a `data-theme`
// attribute to <html> (not the shadcn `.dark` class already reserved by
// globals.css's dormant --background/--foreground scaffold), which every
// Nocturne surface/text/border in globals.css's `--nocturne-*` tokens
// reads from. Persisted to localStorage so the choice survives reloads;
// defaults to "dark" (the original, only design) when nothing is stored
// yet or localStorage is unavailable (SSR, privacy mode, etc).
//
// The blocking inline script in app/layout.tsx's <head> (see
// THEME_INIT_SCRIPT below, rendered there before hydration) sets the
// attribute synchronously on first paint so there's no flash of the wrong
// theme while React hydrates — this provider then just keeps state and
// <html> in sync on every toggle after that.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "resumate-theme";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable (privacy mode, etc) — fall through to default.
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy init reads the same synchronous source the inline script already
  // used to set data-theme before hydration, so this never has to "jump"
  // to a different value on mount.
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Best-effort persistence only.
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

// Inlined verbatim into a <script> tag in app/layout.tsx's <head>, before
// any hydration — reads the same localStorage key this module uses and
// sets data-theme on <html> synchronously, so the very first paint already
// has the right theme instead of flashing dark-then-light (or vice versa).
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("${STORAGE_KEY}");
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;
