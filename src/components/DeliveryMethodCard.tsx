"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "../../context/theme"
import { useTranslation } from "react-i18next"
import { Truck, DollarSign, Package, TrendingUp, MapPin } from "lucide-react"

interface DeliveryMethodCardProps {
  method: {
    id: number
    name: string
    delivery_type: string
    fixed_price?: number
    margin?: number
    fixed_margin?: number
    tracking_url?: string
    website_published?: boolean
    active?: boolean
  }
  onClick: () => void
  index: number
  currencySymbol: string
}

export function DeliveryMethodCard({ method, onClick, index, currencySymbol }: DeliveryMethodCardProps) {
  const { colors } = useTheme()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"

  const isPublished = method.website_published || method.active !== false

  return (
    <Card
      style={{
        position: "relative",
        overflow: "hidden",
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: "1rem",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        animationDelay: `${index * 50}ms`,
      }}
      className="animate-fade-in-up hover:shadow-xl"
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = ""
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-2rem",
          right: isRTL ? "auto" : "-2rem",
          left: isRTL ? "-2rem" : "auto",
          width: "8rem",
          height: "8rem",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${colors.action}15, ${colors.action}05)`,
          pointerEvents: "none",
        }}
      />

      <CardContent style={{ padding: "1.5rem", position: "relative" }}>
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
                fontWeight: "700",
                color: colors.textPrimary,
                marginBottom: "0.5rem",
                letterSpacing: "-0.01em",
              }}
            >
              {method.name}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Truck size={14} style={{ color: colors.textSecondary }} />
              <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>
                {method.delivery_type === "base_on_rule" ? t("Based on Rules") : t("Fixed Price")}
              </span>
            </div>
          </div>
          <Badge
            style={{
              borderRadius: "8px",
              padding: "0.375rem 0.875rem",
              background: isPublished ? colors.success : colors.mutedBg,
              border: `1px solid ${isPublished ? colors.success : colors.border}`,
              color: isPublished ? "#0A0A0A" : colors.textSecondary,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "600",
              fontSize: "0.8125rem",
            }}
          >
            {isPublished ? t("Published") : t("Draft")}
          </Badge>
        </div>

        <div
          style={{
            background: `linear-gradient(135deg, ${colors.action}08, ${colors.action}03)`,
            padding: "1rem",
            borderRadius: "0.75rem",
            marginBottom: "1rem",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                <DollarSign size={14} style={{ color: colors.textSecondary }} />
                <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
                  {t("Fixed Price")}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: colors.textPrimary,
                  fontWeight: "700",
                }}
              >
                {currencySymbol}
                {Number(method.fixed_price || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                <TrendingUp size={14} style={{ color: colors.textSecondary }} />
                <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
                  {t("Margin")}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: colors.textPrimary,
                  fontWeight: "700",
                }}
              >
                {Number(method.margin || 0)}%
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.action}12, ${colors.action}05)`,
              padding: "0.875rem",
              borderRadius: "0.75rem",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
              <Package size={14} style={{ color: colors.action }} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
                {t("Fixed Margin")}
              </span>
            </div>
            <p style={{ fontSize: "0.9375rem", color: colors.textPrimary, fontWeight: "700" }}>
              {currencySymbol}
              {Number(method.fixed_margin || 0).toFixed(2)}
            </p>
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.action}12, ${colors.action}05)`,
              padding: "0.875rem",
              borderRadius: "0.75rem",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
              <MapPin size={14} style={{ color: colors.action }} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>{t("ID")}</span>
            </div>
            <p style={{ fontSize: "0.9375rem", color: colors.textPrimary, fontWeight: "700" }}>#{method.id}</p>
          </div>
        </div>

        {method.tracking_url && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "1rem",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={16} style={{ color: colors.textSecondary }} />
              <span style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>
                {t("Tracking Available")}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
