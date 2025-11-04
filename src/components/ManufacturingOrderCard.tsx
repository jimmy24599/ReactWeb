"use client"

import { Calendar, User, Factory } from "lucide-react"
import { useTheme } from "../../context/theme"
import { Badge } from "@/components/ui/badge"

interface ManufacturingOperation {
  name: string
  workCenter: string
  duration: number
  status: string
}

interface ManufacturingOrderCardProps {
  order: {
    id: number
    name: string
    reference: string
    product: string
    quantity: number
    uom: string
    scheduledDate: string
    responsible: string
    status: string
    operations: ManufacturingOperation[]
  }
  onClick: () => void
}

export function ManufacturingOrderCard({ order, onClick }: ManufacturingOrderCardProps) {
  const { colors } = useTheme()

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "draft":
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
      case "in progress":
      case "planned":
      case "ready":
        return { bg: colors.inProgress, text: "#0A0A0A", border: colors.inProgress }
      case "done":
        return { bg: colors.success, text: "#0A0A0A", border: colors.success }
      default:
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
    }
  }

  const statusStyle = getStatusStyle(order.status)

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.card,
        borderRadius: "1rem",
        padding: "1.5rem",
        border: `1px solid ${colors.border}`,
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
      }}
      className="lot-card-hover"
    >
      {/* Gradient circle overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          background: `linear-gradient(135deg, ${colors.action}, ${colors.success})`,
          opacity: 0.08,
          borderRadius: "50%",
          transform: "translate(30%, -30%)",
          transition: "all 0.3s ease",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header with icon and status */}
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}
        >
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "0.75rem",
              background: colors.action,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Factory size={20} color="white" strokeWidth={2.5} />
          </div>
          <Badge
            style={{
              borderRadius: "0.5rem",
              padding: "0.375rem 0.75rem",
              background: statusStyle.bg,
              border: `1px solid ${statusStyle.border}`,
              color: statusStyle.text,
              fontSize: "0.75rem",
              fontWeight: "600",
            }}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>

        {/* Title and product */}
        <div style={{ marginBottom: "1rem" }}>
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: "0.25rem",
              letterSpacing: "-0.01em",
            }}
          >
            {order.name}
          </h3>
          <p style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>{order.product}</p>
        </div>

        {/* Metric boxes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.action}15, ${colors.action}08)`,
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.25rem", fontWeight: "500" }}
            >
              Quantity
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary }}>
              {order.quantity} {order.uom}
            </div>
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.success}15, ${colors.success}08)`,
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.25rem", fontWeight: "500" }}
            >
              Operations
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary }}>
              {order.operations.length}
            </div>
          </div>
        </div>

        {/* Details */}
        <div
          style={{
            paddingTop: "1rem",
            borderTop: `1px solid ${colors.border}`,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>Responsible:</span>
            <span style={{ fontSize: "0.8rem", color: colors.textPrimary, fontWeight: "600" }}>
              {order.responsible}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>Scheduled:</span>
            <span style={{ fontSize: "0.8rem", color: colors.textPrimary, fontWeight: "600" }}>
              {order.scheduledDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
