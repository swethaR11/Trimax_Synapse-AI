"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { getTheme, themeStyle } from "@/lib/themeEngine";
import type { ThemeDefinition } from "@/lib/types";

interface ThemeContextValue {
  themeId: string;
  theme: ThemeDefinition;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState("slate-tech");
  const theme = useMemo(() => getTheme(themeId), [themeId]);

  return (
    <ThemeContext.Provider value={{ themeId, theme, setThemeId }}>
      <div className="theme-root" style={themeStyle(theme)} data-theme={themeId}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}

