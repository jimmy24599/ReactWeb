"use client"

import { Package, MapPin, User, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useTheme } from "../../context/theme"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"

interface PhysicalInventoryCardProps {
  item: {
    id: number
    location: string
    product: string
    lotSerialNumber: string
    package: string
    owner: string
    onHandQuantity: number
    uom: string
    countedQuantity: number
    difference: number
    scheduledDate: string
    user: string
    unitPrice: number
    productImage?: string
  }
  onClick: () => void
  onCountChange: (id: number, value: number) => void
  index: number
}

export function PhysicalInventoryCard({ item, onClick, onCountChange, index }: PhysicalInventoryCardProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()

  const getDifferenceStyle = (difference: number) => {
    if (difference > 0) return { bg: colors.success, icon: TrendingUp, text: "#0A0A0A" }
    if (difference < 0) return { bg: colors.inProgress, icon: TrendingDown, text: "#0A0A0A" }
    return { bg: colors.mutedBg, icon: Minus, text: colors.textSecondary }
  }

  const diffStyle = getDifferenceStyle(item.difference)
  const DiffIcon = diffStyle.icon

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
            {item.productImage ? (
              <img
                src={`data:image/png;base64,${item.productImage}`}
                alt={item.product}
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "0.75rem",
                  objectFit: "cover",
                  border: `1px solid ${colors.border}`,
                }}
              />
            ) : (
              <div
                style={{
                  borderRadius: "0.75rem",
                  background: `${colors.action}15`,
                  padding: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Package size={20} color={colors.action} strokeWidth={2.5} />
              </div>
            )}
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
                {item.product}
              </div>
              {item.lotSerialNumber && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: colors.textSecondary,
                    fontFamily: "monospace",
                    marginBottom: "0.25rem",
                  }}
                >
                  {item.lotSerialNumber}
                </div>
              )}
              <div
                style={{
                  fontSize: "0.75rem",
                  color: colors.textSecondary,
                  background: diffStyle.bg,
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.375rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontWeight: "600",
                }}
              >
                <DiffIcon size={12} />
                {item.difference > 0 ? `+${item.difference}` : item.difference}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.mutedBg}, ${colors.background})`,
              borderRadius: "0.75rem",
              padding: "0.75rem",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{ fontSize: "0.7rem", color: colors.textSecondary, fontWeight: "500", marginBottom: "0.25rem" }}
            >
              {t("On Hand")}
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: colors.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              {item.onHandQuantity}
            </div>
            <div style={{ fontSize: "0.65rem", color: colors.textSecondary }}>{item.uom}</div>
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.mutedBg}, ${colors.background})`,
              borderRadius: "0.75rem",
              padding: "0.75rem",
              border: `1px solid ${colors.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ fontSize: "0.7rem", color: colors.textSecondary, fontWeight: "500", marginBottom: "0.25rem" }}
            >
              {t("Counted")}
            </div>
            <Input
              value={item.countedQuantity}
              onChange={(e) => {
                const val = Number(e.target.value || 0)
                onCountChange(item.id, val)
              }}
              className="h-8 text-center font-bold text-base p-0"
              style={{
                borderColor: colors.border,
                background: colors.background,
                color: colors.textPrimary,
                fontSize: "1.25rem",
              }}
              type="number"
            />
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.mutedBg}, ${colors.background})`,
              borderRadius: "0.75rem",
              padding: "0.75rem",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{ fontSize: "0.7rem", color: colors.textSecondary, fontWeight: "500", marginBottom: "0.25rem" }}
            >
              {t("Value")}
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: colors.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              LE {(item.onHandQuantity * item.unitPrice).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MapPin size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>{item.location}</span>
          </div>
          {item.owner && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <User size={14} color={colors.textSecondary} />
              <span style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>{item.owner}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
