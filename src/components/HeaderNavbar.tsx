"use client"

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronDown, Moon, Sun } from "lucide-react"
import { useTheme } from "../../context/theme"
import { useAuth } from "../../context/auth"

export default function HeaderNavbar() {
  const { t, i18n } = useTranslation()
  const { mode, setMode } = useTheme()
  const isDarkMode = mode === "dark"
  const { name, signOut } = useAuth()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const toggleTheme = () => setMode(isDarkMode ? "light" : "dark")

  const handleSignOut = () => {
    signOut()
    navigate("/signin", { replace: true })
  }

  const firstLetter = (name || "?").toString().charAt(0).toUpperCase()

  // Close menus on outside click and Esc key
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (showLangMenu && langRef.current && !langRef.current.contains(target)) setShowLangMenu(false)
      if (showUserMenu && userRef.current && !userRef.current.contains(target)) setShowUserMenu(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowLangMenu(false)
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [showLangMenu, showUserMenu])

  return (
    <div
      className={`sticky top-0 z-40 w-full`} // sticky keeps it fixed when scrolling
      style={{
        background: isDarkMode ? "#F2F3EC" : "#FFFFFF",
      }}
    >
      <div className="px-4 py-3 flex items-center justify-end gap-3">
        {/* Language selector */}
        <div ref={langRef} className="relative inline-block">
          <button
            onClick={() => {
              setShowUserMenu(false)
              setShowLangMenu((v) => !v)
            }}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm border shadow-sm ${
              isDarkMode ? "bg-[#FFF] border-white/20 text-grey-500" : "bg-white border-gray-200 text-[#242424]"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{i18n.resolvedLanguage === "ar" ? "🇦🇪" : "🇺🇸"}</span>
              <span>{i18n.resolvedLanguage === "ar" ? "Arabic" : "English"}</span>
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showLangMenu && (
            <div
              className={`absolute inset-x-0 mt-2 rounded-md border z-50 overflow-hidden ${
                isDarkMode
                  ? "bg-[#FFF] border-white/20 shadow-md text-grey-500"
                  : "bg-white border-gray-200 shadow-lg text-[#242424]"
              }`}
            >
              <button
                onClick={() => {
                  i18n.changeLanguage("ar")
                  setShowLangMenu(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  isDarkMode ? "hover:bg-[#FBD666]" : "hover:bg-gray-100"
                }`}
              >
                <span>🇦🇪</span>
                <span>Arabic</span>
              </button>
              <button
                onClick={() => {
                  i18n.changeLanguage("en")
                  setShowLangMenu(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  isDarkMode ? "hover:bg-[#FBD666]" : "hover:bg-gray-100"
                }`}
              >
                <span>🇺🇸</span>
                <span>English</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <div className="flex items-center gap-2">
          <Sun className={`w-4 h-4 ${isDarkMode ? "text-[#1B475D]" : "text-gray-500"}`} />
          <button
            onClick={toggleTheme}
            className={`inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
              isDarkMode ? "bg-[#A9E0BA] justify-end" : "bg-gray-300 justify-start"
            }`}
            aria-label="Toggle theme"
          >
            <span className="h-4 w-4 rounded-full bg-white shadow" />
          </button>
          <Moon className={`w-4 h-4 ${isDarkMode ? "text-[#1B475D]" : "text-gray-500"}`} />
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative inline-block">
          <button
            onClick={() => {
              setShowLangMenu(false)
              setShowUserMenu((v) => !v)
            }}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm border shadow-sm  ${
              isDarkMode ? "bg-[#FFF] border-white/20 text-gray-500" : "bg-white border-gray-200 text-[#242424]"
            }`}
          >
            <div className="w-6 h-6 bg-gradient-to-br from-[#A9E0BA] to-[#FBD666] rounded-full flex items-center justify-center">
              <span className="text-[12px] font-medium">{firstLetter}</span>
            </div>
            <span className="text-[12px] font-medium truncate">{name || t("Guest")}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showUserMenu && (
            <div
              className={`absolute inset-x-0 mt-1 rounded-md border z-50 overflow-hidden ${
                isDarkMode
                  ? "bg-[#FFF] border-white/20 shadow-md text-grey-500"
                  : "bg-white border-gray-200 shadow-lg text-[#242424]"
              }`}
            >
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  navigate("/settings")
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  isDarkMode ? "hover:bg-[#FBD666]" : "hover:bg-gray-100"
                }`}
              >
                {t("Settings")}
              </button>
              <button
                onClick={handleSignOut}
                className={`w-full text-left px-3 py-2 text-sm text-red-600 transition-colors ${
                  isDarkMode ? "hover:bg-[#FBD666]" : "hover:bg-gray-100"
                }`}
              >
                {t("Sign Out")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
