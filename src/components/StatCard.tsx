"use client"

import type { LucideIcon } from "lucide-react"
import { useTheme } from "../../context/theme"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  gradient: string
  delay?: number
}

export function StatCard({ label, value, icon: Icon, gradient, delay = 0 }: StatCardProps) {
  const { colors } = useTheme()

  return (
    <div
      className="animate-fade-in-up stat-card-hover"
      style={{
        background: colors.card,
        borderRadius: "1rem",
        padding: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: `1px solid ${colors.border}`,
        animationDelay: `${delay * 0.1}s`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          background: gradient,
          opacity: 0.1,
          borderRadius: "50%",
          transform: "translate(30%, -30%)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "0.75rem",
              background: gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={20} color="white" strokeWidth={2.5} />
          </div>
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: colors.textSecondary,
            marginBottom: "0.5rem",
            fontWeight: "500",
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: "2rem", fontWeight: "700", color: colors.textPrimary, letterSpacing: "-0.02em" }}>
          {value}
        </div>
      </div>
    </div>
  )
}
