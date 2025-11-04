"use client"

import { useEffect } from "react"

export default function Toast({
  text,
  state = "success",
  onClose,
  duration = 2500,
}: { text: string; state?: "success" | "error"; onClose: () => void; duration?: number }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(), duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  const gradientBg =
    state === "success"
      ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
      : "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"

  const iconBg = state === "success" ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.2)"

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        background: gradientBg,
        color: "#FFFFFF",
        padding: "12px 16px",
        borderRadius: 12,
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)",
        fontSize: 14,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 280,
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {state === "success" ? "✓" : "✕"}
      </div>
      <span style={{ flex: 1 }}>{text}</span>
      <button
        onClick={onClose}
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          border: "none",
          borderRadius: 6,
          padding: "4px 8px",
          cursor: "pointer",
          color: "#FFFFFF",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1,
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  )
}
