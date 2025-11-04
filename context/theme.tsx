"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

export type ThemeMode = "light" | "dark"

export type ThemeColors = {
  background: string
  card: string
  action: string
  cancel: string
  success: string
  inProgress: string
  todo: string
  textPrimary: string
  textSecondary: string
  border: string
  pillSuccessBg: string
  pillSuccessText: string
  pillInfoBg: string
  pillInfoText: string
  mutedBg: string
}

export type Theme = {
  mode: ThemeMode
  colors: ThemeColors
  setMode: (mode: ThemeMode) => void
}

const lightColors: ThemeColors = {
  background: "#FFF",
  card: "#FFF",
  action: "#5268ED",
  cancel: "#FA8787",      // Cancelled
  success: "#C9F5C5",     // Done
  inProgress: "#FFE5A8",  // In Progress
  todo: "#DBD2FC",        // To Do
  textPrimary: "#0A0A0A",
  textSecondary: "#4F4F4F",
  border: "#E6E6E6",
  pillSuccessBg: "#E8F5E9",
  pillSuccessText: "#2E7D32",
  pillInfoBg: "#E3F2FD",
  pillInfoText: "#1565C0",
  mutedBg: "#F6FAFD",
}

// Placeholder for future dark mode (will be filled later)
const darkColors: ThemeColors = {
  background: "#F2F3EC",
  card: "#FFFFFF",
  action: "#5268ED",
  cancel: "#FA8787",        // Cancelled
  success: "#C9F5C5",       // Done
  inProgress: "#FFE5A8",    // In Progress
  todo: "#DBD2FC",          // To Do
  textPrimary: "#1B475D",   // Card headers
  textSecondary: "#637F87", // Other text
  border: "#F2F3EC",
  pillSuccessBg: "#E8F5E9",
  pillSuccessText: "#2E7D32",
  pillInfoBg: "#E3F2FD",
  pillInfoText: "#1565C0",
  mutedBg: "#F6FAFD",
}

const ThemeContext = createContext<Theme>({
  mode: "light",
  colors: lightColors,
  setMode: () => {},
})

export const ThemeProvider: React.FC<{ initialMode?: ThemeMode; children: React.ReactNode }> = ({
  initialMode = "light",
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>(initialMode)

  const colors = useMemo(() => (mode === "light" ? lightColors : darkColors), [mode])

  const value = useMemo(() => ({ mode, colors, setMode }), [mode, colors])

  useEffect(() => {
    const root = document.documentElement
    if (mode === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [mode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
