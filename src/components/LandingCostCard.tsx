"use client"

import { FileText, Calendar, Package, Building2, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "../../context/theme"
import { useTranslation } from "react-i18next"

interface LandingCostCardProps {
  cost: any
  onClick: () => void
  index: number
}

export function LandingCostCard({ cost, onClick, index }: LandingCostCardProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()

  const getStatusColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case "posted":
        return colors.success
      case "draft":
        return colors.inProgress
      default:
        return colors.mutedBg
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: "0.75rem",
        padding: "1.25rem",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        animationDelay: `${index * 50}ms`,
      }}
      className="hover:shadow-lg hover:-translate-y-1 animate-fade-in-up"
    >
      <div
        style={{
          position: "absolute",
          top: "-2rem",
          right: "-2rem",
          width: "6rem",
          height: "6rem",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${colors.action}15, ${colors.action}05)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "3rem",
          height: "3rem",
          borderRadius: "0.625rem",
          background: colors.action,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1rem",
        }}
      >
        <FileText size={20} color="#FFFFFF" />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1.0625rem",
            fontWeight: "600",
            color: colors.textPrimary,
            marginBottom: "0.5rem",
            letterSpacing: "-0.01em",
          }}
        >
          {cost.name}
        </h3>
        <Badge
          style={{
            background: getStatusColor(cost.state),
            color: cost.state?.toLowerCase() === "posted" ? "#0A0A0A" : colors.textPrimary,
            border: "none",
            fontSize: "0.6875rem",
            padding: "0.125rem 0.5rem",
            fontWeight: "500",
          }}
        >
          {t(cost.state || "")}
        </Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1rem" }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.action}08, ${colors.action}03)`,
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ fontSize: "0.6875rem", color: colors.textSecondary, marginBottom: "0.25rem" }}>
            {t("Total Cost")}
          </div>
          <div style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary }}>
            {(cost.totalCost || cost.amount_total || 0).toLocaleString()}
          </div>
        </div>
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.success}08, ${colors.success}03)`,
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ fontSize: "0.6875rem", color: colors.textSecondary, marginBottom: "0.25rem" }}>
            {t("Currency")}
          </div>
          <div style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary }}>
            {cost.currency || "—"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={14} style={{ color: colors.textSecondary }} />
          <span style={{ fontSize: "0.8125rem", color: colors.textSecondary }}>
            {new Date(cost.date).toLocaleDateString()}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {(cost.applyOn || (cost.picking_ids?.length ? "Transfers" : "")) === "Transfers" ? (
            <Package size={14} style={{ color: colors.textSecondary }} />
          ) : (
            <Building2 size={14} style={{ color: colors.textSecondary }} />
          )}
          <span style={{ fontSize: "0.8125rem", color: colors.textSecondary }}>
            {t(cost.applyOn || (cost.picking_ids?.length ? "Transfers" : "Manufacturing Orders"))}
          </span>
        </div>
        {cost.vendorBill && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <DollarSign size={14} style={{ color: colors.textSecondary }} />
            <span style={{ fontSize: "0.8125rem", color: colors.textSecondary }}>
              {cost.vendorBill || cost.account_move_id?.[1] || "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
