"use client"

import { Package, Weight, Ruler, RulerDimensionLine, Barcode } from "lucide-react"
import { useTheme } from "../../context/theme"
import { useTranslation } from "react-i18next"

interface PackageCardProps {
  pkg: {
    id: number
    name?: string
    display_name?: string
    sequence?: number
    height?: number
    width?: number
    packaging_length?: number
    weight?: number
    max_weight?: number
    barcode?: string
    weight_uom_name?: string
    length_uom_name?: string
    company_id?: any
    storage_category_capacity_ids?: any[]
    create_uid?: any
    create_date?: string
    write_uid?: any
    write_date?: string
    shipper_package_code?: string
    package_carrier_type?: string
    package_type_id?: string
    shipping_weight?:string
  }
  onClick: () => void
  index: number
}

export function PackageCard({ pkg, onClick, index }: PackageCardProps) {
  const { colors } = useTheme()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"

  const title = pkg.display_name || pkg.name || `#${pkg.id}`
  const companyName = Array.isArray(pkg.company_id) ? pkg.company_id[1] : undefined
  const lengthUnit = pkg.length_uom_name || ""
  const weightUnit = pkg.weight_uom_name || ""
  const typeName = Array.isArray(pkg.package_type_id)
    ? pkg.package_type_id[1]
    : typeof pkg.package_type_id === "string"
      ? pkg.package_type_id.replace(/^[0-9]+\s*/, "").trim()
      : ""
  const weightVal = [pkg.shipping_weight, (pkg as any).shipping_weight, pkg.shipping_weight]
    .map((v) => (v === undefined || v === null ? undefined : Number(v)))
    .find((v) => typeof v === "number" && v > 0)
  const dimsAvailable = [pkg.width, pkg.height, pkg.packaging_length].some((v) => typeof v === "number")
  const dimsText = dimsAvailable
    ? `${pkg.width ?? "-"}×${pkg.height ?? "-"}×${pkg.packaging_length ?? "-"} ${lengthUnit}`
    : t("No dimensions")

  return (
    <div
      className="animate-fade-in-up"
      style={{
        background: colors.card,
        padding: "1.5rem",
        borderRadius: "1rem",
        border: `1px solid ${colors.border}`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        animationDelay: `${index * 0.05}s`,
        cursor: "pointer",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.borderColor = colors.action
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none"
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.borderColor = colors.border
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: isRTL ? undefined : 0,
          left: isRTL ? 0 : undefined,
          width: "100px",
          height: "100px",
          background: `linear-gradient(135deg, ${colors.action}15, transparent)`,
          borderRadius: "50%",
          transform: isRTL ? "translate(-30%, -30%)" : "translate(30%, -30%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
            <div
              style={{
                borderRadius: "0.75rem",
                background: `${colors.action}15`,
                padding: "0.625rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={18} color={colors.action} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "600",
                  color: colors.textPrimary,
                  marginBottom: "0.25rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: "0.85rem", color: colors.textSecondary }}>
                {typeName}
              </div>
            </div>
          </div>
          {typeof pkg.sequence === "number" && (
            <div
              style={{
                background: colors.mutedBg,
                color: colors.textSecondary,
                padding: "0.375rem 0.75rem",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                fontWeight: "600",
                whiteSpace: "nowrap",
              }}
            >
              {t("Seq")} #{pkg.sequence}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.mutedBg}, ${colors.background})`,
              borderRadius: "0.75rem",
              padding: "1rem",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Weight size={14} color={colors.textSecondary} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "500" }}>{t("Weight")}</span>
            </div>
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: "700",
                color: colors.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              {weightVal !== undefined ? weightVal : "-"} {weightUnit}
            </div>
            {typeof pkg.shipping_weight === "number" && (
              <div style={{ fontSize: "0.75rem", color: colors.textSecondary, marginTop: 4 }}>
                {t("Max")}: {pkg.max_weight} {weightUnit}
              </div>
            )}
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.mutedBg}, ${colors.background})`,
              borderRadius: "0.75rem",
              padding: "1rem",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <RulerDimensionLine size={14} color={colors.textSecondary} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "500" }}>
                {t("Dimensions")}
              </span>
            </div>
            <div
              style={{
                fontSize: "1.0rem",
                fontWeight: "700",
                color: colors.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              {dimsText}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          
          {companyName && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Ruler size={14} color={colors.textSecondary} />
              <span style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>{companyName}</span>
            </div>
          )}
          {(pkg.package_carrier_type || pkg.shipper_package_code) && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Ruler size={14} color={colors.textSecondary} />
              <span style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>
                {pkg.package_carrier_type || ""} {pkg.shipper_package_code ? `• ${pkg.shipper_package_code}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
