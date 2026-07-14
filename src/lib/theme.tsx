"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = {
  mode: "light" | "dark";
  ink: string;
  canvas: string;
  surface: string;
  surfaceAlt: string;
  line: string;
  text: string;
  textMuted: string;
  brand: string;
  brandDark: string;
  overlay: string;
};

export const lightTheme: Theme = {
  mode: "light",
  ink: "#171A2B",
  canvas: "#F3F4F9",
  surface: "#FFFFFF",
  surfaceAlt: "#F8F9FC",
  line: "#E4E5F1",
  text: "#171A2B",
  textMuted: "#6B7086",
  brand: "#0F9D8B",
  brandDark: "#0B7A6C",
  overlay: "rgba(23,26,43,0.8)",
};

export const darkTheme: Theme = {
  mode: "dark",
  ink: "#0B0D16",
  canvas: "#13141F",
  surface: "#1B1E2E",
  surfaceAlt: "#232640",
  line: "#2C2F47",
  text: "#EDEEF5",
  textMuted: "#9296B5",
  brand: "#2BC7AF",
  brandDark: "#1FA491",
  overlay: "rgba(0,0,0,0.65)",
};

const ThemeContext = createContext<Theme>(lightTheme);
export const useTheme = () => useContext(ThemeContext);

const DarkModeContext = createContext<{ dark: boolean; setDark: (v: boolean | ((d: boolean) => boolean)) => void }>({
  dark: false,
  setDark: () => {},
});
export const useDarkMode = () => useContext(DarkModeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("crm-veron:dark");
    if (stored === "1") setDark(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("crm-veron:dark", dark ? "1" : "0");
  }, [dark, hydrated]);

  const theme = dark ? darkTheme : lightTheme;

  return (
    <DarkModeContext.Provider value={{ dark, setDark }}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </DarkModeContext.Provider>
  );
}
