"use client"

import { Package, DollarSign, Layers, Tag } from "lucide-react"
import { useTheme } from "../../context/theme"
import { useTranslation } from "react-i18next"

interface ProductRecordCardProps {
  product: {
    id: number
    name: string
    default_code: string
    qty_available: number
    list_price: number
    image_1920?: string
    categ_id: [number, string]
    sale_ok: boolean
  }
  onClick: () => void
  index: number
}

export function ProductRecordCard({ product, onClick, index }: ProductRecordCardProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()

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
          right: 0,
          width: "100px",
          height: "100px",
          background: `linear-gradient(135deg, ${colors.action}15, transparent)`,
          borderRadius: "50%",
          transform: "translate(30%, -30%)",
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
                width: "60px",
                height: "60px",
              }}
            >
              {product.image_1920 ? (
                <img
                  src={`data:image/webp;base64,${product.image_1920}`}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "0.5rem" }}
                />
              ) : (
                <Package size={24} color={colors.action} strokeWidth={2.5} />
              )}
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
                {product.name}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: colors.textSecondary,
                  marginBottom: "0.25rem",
                }}
              >
                {product.default_code || t("No code")}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: colors.textSecondary,
                  background: colors.mutedBg,
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.375rem",
                  display: "inline-block",
                  fontWeight: "500",
                }}
              >
                {product.categ_id[1]}
              </div>
            </div>
          </div>
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
              <Layers size={14} color={colors.textSecondary} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "500" }}>
                {t("In Stock")}
              </span>
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: colors.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              {product.qty_available.toLocaleString()}
            </div>
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
              <DollarSign size={14} color={colors.textSecondary} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "500" }}>{t("Price")}</span>
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: colors.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              ${product.list_price.toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Tag size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>
              {product.sale_ok ? t("Available for Sale") : t("Not for Sale")}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>
              {t("Total Value:")} ${(product.list_price * product.qty_available).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
