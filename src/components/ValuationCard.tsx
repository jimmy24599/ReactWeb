"use client"

import { useTheme } from "../../context/theme"
import { Package, TrendingUp } from "lucide-react"

interface ValuationCardProps {
  date: string
  reference: string
  product: string
  quantity: number
  totalValue: number
  category: string
  unitValue: number
  imageBase64?: string
  onClick?: () => void
}

export function ValuationCard({
  date,
  product,
  quantity,
  totalValue,
  category,
  unitValue,
  onClick,
}: ValuationCardProps) {
  const { colors } = useTheme()

  const getCategoryPill = (category: string) => {
    if (category === "Electronics") return { bg: colors.pillInfoBg, text: colors.pillInfoText }
    if (category === "Mens" || category === "Womens") return { bg: colors.pillSuccessBg, text: colors.pillSuccessText }
    if (category === "Luggage") return { bg: colors.inProgress, text: colors.textPrimary }
    return { bg: colors.todo, text: colors.textPrimary }
  }

  const sku = product.match(/\[(.*?)\]/)?.[1] || "N/A"
  const productName = product.split("]")[1]?.trim() || product

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        background: colors.card,
        borderRadius: "12px",
        padding: "1.5rem",
        border: `1px solid ${colors.border}`,
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.15)"
        e.currentTarget.style.borderColor = colors.action
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)"
        e.currentTarget.style.borderColor = colors.border
      }}
    >
      {/* Gradient Circle Overlay */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${colors.action}15, ${colors.action}05)`,
          pointerEvents: "none",
        }}
      />

      {/* Header with Category and Icon */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <span
          style={{
            display: "inline-block",
            padding: "0.375rem 0.75rem",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: "600",
            background: getCategoryPill(category).bg,
            color: getCategoryPill(category).text,
          }}
        >
          {category}
        </span>

        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: colors.action,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Package size={20} color="#FFFFFF" />
        </div>
      </div>

      {/* Product Info */}
      <h4
        style={{
          fontSize: "1rem",
          fontWeight: "600",
          color: colors.textPrimary,
          marginBottom: "0.5rem",
          lineHeight: "1.4",
        }}
      >
        {productName}
      </h4>

      <p style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "1rem", opacity: 0.7 }}>SKU: {sku}</p>

      {/* Metrics */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <div
          style={{
            flex: 1,
            padding: "0.75rem",
            borderRadius: "8px",
            background: `linear-gradient(135deg, ${colors.action}15, ${colors.action}08)`,
          }}
        >
          <div style={{ fontSize: "0.7rem", color: colors.textSecondary, marginBottom: "0.25rem", opacity: 0.7 }}>
            Unit Value
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: "700", color: colors.textPrimary }}>
            {unitValue.toLocaleString()} LE
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "0.75rem",
            borderRadius: "8px",
            background: `linear-gradient(135deg, ${colors.action}15, ${colors.action}08)`,
          }}
        >
          <div style={{ fontSize: "0.7rem", color: colors.textSecondary, marginBottom: "0.25rem", opacity: 0.7 }}>
            Quantity
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: "700", color: colors.textPrimary }}>{quantity.toFixed(2)}</div>
        </div>
      </div>

      {/* Total Value */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.875rem",
          borderRadius: "8px",
          background: colors.action,
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <TrendingUp size={16} color="#FFFFFF" />
          <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#FFFFFF" }}>Total Value</span>
        </div>
        <span style={{ fontSize: "1.125rem", fontWeight: "700", color: "#FFFFFF" }}>
          {totalValue.toLocaleString()} LE
        </span>
      </div>

      {/* Footer */}
      <div style={{ paddingTop: "0.75rem", borderTop: `1px solid ${colors.border}` }}>
        <div style={{ fontSize: "0.7rem", color: colors.textSecondary, opacity: 0.6 }}>{date}</div>
      </div>
    </div>
  )
}
