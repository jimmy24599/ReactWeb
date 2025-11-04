"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "../../context/theme"
import { useTranslation } from "react-i18next"
import { Box, Ruler, Scale, Truck, Package } from "lucide-react"

interface ProductPackageCardProps {
  pkg: any
  onClick: () => void
  index: number
}

export function ProductPackageCard({ pkg, onClick, index }: ProductPackageCardProps) {
  const { colors } = useTheme()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"

  const displayName = pkg.display_name || pkg.name || (pkg.id ? `Package Type #${pkg.id}` : "Package Type")
  const barcode = pkg.barcode || pkg.x_barcode || "-"
  const carrier =
    pkg.carrier ||
    (Array.isArray(pkg.delivery_carrier_id) ? pkg.delivery_carrier_id[1] : "") ||
    "No carrier integration"

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
              {displayName}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Box size={14} style={{ color: colors.textSecondary }} />
              <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{barcode}</span>
            </div>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: colors.pillInfoBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Package size={24} color={colors.pillInfoText} />
          </div>
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Ruler size={16} style={{ color: colors.action }} />
            <span style={{ fontSize: "0.875rem", fontWeight: "600", color: colors.textPrimary }}>
              {t("Dimensions")}
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.875rem", color: colors.textPrimary }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.25rem" }}>H</div>
              <div style={{ fontWeight: "600" }}>{pkg.height ?? pkg.package_height ?? "-"} mm</div>
            </div>
            <div style={{ color: colors.border, fontSize: "1.25rem" }}>×</div>
            <div>
              <div style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.25rem" }}>W</div>
              <div style={{ fontWeight: "600" }}>{pkg.width ?? pkg.package_width ?? "-"} mm</div>
            </div>
            <div style={{ color: colors.border, fontSize: "1.25rem" }}>×</div>
            <div>
              <div style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.25rem" }}>L</div>
              <div style={{ fontWeight: "600" }}>{pkg.length ?? pkg.package_length ?? "-"} mm</div>
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
              <Scale size={14} style={{ color: colors.action }} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>{t("Weight")}</span>
            </div>
            <p style={{ fontSize: "0.9375rem", color: colors.textPrimary, fontWeight: "700" }}>
              {pkg.weight ?? pkg.package_weight ?? "-"} kg
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
              <Scale size={14} style={{ color: colors.action }} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
                {t("Max Weight")}
              </span>
            </div>
            <p style={{ fontSize: "0.9375rem", color: colors.textPrimary, fontWeight: "700" }}>
              {pkg.maxWeight ?? pkg.max_weight ?? "-"} kg
            </p>
          </div>
        </div>

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
            <Truck size={16} style={{ color: colors.textSecondary }} />
            <span style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>{carrier}</span>
          </div>
          {pkg.carrierCode && (
            <Badge
              style={{
                background: colors.background,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                padding: "0.25rem 0.75rem",
                fontSize: "0.8125rem",
              }}
            >
              {pkg.carrierCode}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
