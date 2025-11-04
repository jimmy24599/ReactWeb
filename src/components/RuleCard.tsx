"use client"

import { ArrowRight, MapPin, Package, Truck, Clock, Route } from "lucide-react"
import { useTheme } from "../../context/theme"
import { useTranslation } from "react-i18next"

interface RuleCardProps {
  rule: {
    id: string | number
    name: string
    action: string
    operationType: string
    sourceLocation: string
    destinationLocation: string
    supplyMethod: string
    route: string
    leadTime: number
    raw?: any
  }
  onClick: () => void
  index: number
}

export function RuleCard({ rule, onClick, index }: RuleCardProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: "1rem",
        padding: "1.75rem",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        transition: "all 0.25s ease",
        opacity: 0,
        animation: `fadeInUp 0.4s ease forwards ${index * 0.05}s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.1)"
        e.currentTarget.style.borderColor = colors.action + "40"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)"
        e.currentTarget.style.borderColor = colors.border
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
          gap: "1rem",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: colors.textPrimary,
              margin: 0,
              marginBottom: "0.25rem",
              lineHeight: "1.4",
            }}
          >
            {rule.name}
          </h3>
          {rule.route && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                marginTop: "0.5rem",
              }}
            >
              <Route size={14} style={{ color: colors.textSecondary }} />
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: colors.textSecondary,
                }}
              >
                {rule.route}
              </span>
            </div>
          )}
        </div>
        <span
          style={{
            background: colors.action,
            color: "#FFFFFF",
            padding: "0.375rem 0.875rem",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
            fontWeight: "600",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <Package size={12} />
          {rule.action}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          padding: "1.25rem",
          background: colors.mutedBg,
          borderRadius: "0.75rem",
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              marginBottom: "0.375rem",
            }}
          >
            <MapPin size={14} style={{ color: colors.textSecondary }} />
            <span
              style={{
                fontSize: "0.6875rem",
                color: colors.textSecondary,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t("From")}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: colors.textPrimary,
              fontWeight: "500",
              lineHeight: "1.3",
            }}
          >
            {rule.sourceLocation || "—"}
          </div>
        </div>
        <ArrowRight
          size={20}
          style={{
            color: colors.action,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              marginBottom: "0.375rem",
            }}
          >
            <MapPin size={14} style={{ color: colors.textSecondary }} />
            <span
              style={{
                fontSize: "0.6875rem",
                color: colors.textSecondary,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t("To")}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: colors.textPrimary,
              fontWeight: "500",
              lineHeight: "1.3",
            }}
          >
            {rule.destinationLocation || "—"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Truck size={16} style={{ color: colors.textSecondary }} />
            <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Supply Method")}</span>
          </div>
          <span
            style={{
              fontSize: "0.875rem",
              color: colors.textPrimary,
              fontWeight: "500",
            }}
          >
            {rule.supplyMethod}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={16} style={{ color: colors.textSecondary }} />
            <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Lead Time")}</span>
          </div>
          <span
            style={{
              fontSize: "0.875rem",
              color: colors.textPrimary,
              fontWeight: "500",
            }}
          >
            {rule.leadTime} {t("days")}
          </span>
        </div>
      </div>
    </div>
  )
}
