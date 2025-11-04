"use client"

import { ArrowRight, ArrowLeft, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../../context/theme"

interface Route {
  id: string
  name: string
  type: string
  sourceLocation: string
  destinationLocation: string
  rulesCount: number
  status: "active" | "inactive"
}

interface RouteCardProps {
  route: Route
  onClick: () => void
  index: number
}

export function RouteCard({ route, onClick, index }: RouteCardProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Receipt":
        return "#4A7FA7"
      case "Delivery":
        return "#0A1931"
      case "Transfer":
        return "#1A3D63"
      case "Manufacturing":
        return "#4A7FA7"
      default:
        return "#1A3D63"
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: "1rem",
        padding: "1.5rem",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
        boxShadow: "0 2px 8px rgba(10, 25, 49, 0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(10, 25, 49, 0.15)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(10, 25, 49, 0.08)"
      }}
    >
      {/* Route Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              marginBottom: "0.5rem",
              color: colors.textPrimary,
            }}
          >
            {route.name}
          </h3>
          <span
            style={{
              display: "inline-block",
              padding: "0.25rem 0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: "600",
              background: `${getTypeColor(route.type)}15`,
              color: getTypeColor(route.type),
            }}
          >
            {route.type}
          </span>
        </div>
        <span
          style={{
            padding: "0.375rem 0.75rem",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
            fontWeight: "600",
            background: route.status === "active" ? colors.success : colors.border,
            color: route.status === "active" ? "#FFFFFF" : colors.textSecondary,
          }}
        >
          {route.status === "active" ? t("Active") : t("Inactive")}
        </span>
      </div>

      {/* Route Flow */}
      <div
        style={{
          background: colors.background,
          padding: "1rem",
          borderRadius: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.75rem",
                marginBottom: "0.25rem",
                fontWeight: "500",
                color: colors.textSecondary,
              }}
            >
              {t("From")}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: colors.textPrimary,
              }}
            >
              {route.sourceLocation || "—"}
            </div>
          </div>
          {isRTL ? (
            <ArrowLeft size={20} style={{ flexShrink: 0, color: colors.textSecondary }} />
          ) : (
            <ArrowRight size={20} style={{ flexShrink: 0, color: colors.textSecondary }} />
          )}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.75rem",
                marginBottom: "0.25rem",
                fontWeight: "500",
                color: colors.textSecondary,
              }}
            >
              {t("To")}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: colors.textPrimary,
              }}
            >
              {route.destinationLocation || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Route Stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Settings size={16} style={{ color: colors.textSecondary }} />
          <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>
            {route.rulesCount} {route.rulesCount === 1 ? t("Rule") : t("Rules")}
          </span>
        </div>
        <div
          style={{
            fontSize: "0.875rem",
            color: colors.action,
            fontWeight: "500",
          }}
        >
          {t("Click to edit")} {isRTL ? "←" : "→"}
        </div>
      </div>
    </div>
  )
}
