"use client"

import type React from "react"

import { useTheme } from "../../context/theme"
import { Truck, MapPin, User, Calendar, FileText, Package, ArrowRight, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DeliveryCardProps {
  delivery: {
    id: number
    reference: string
    deliveryAddress: string
    sourceLocation: string
    scheduledDate: string
    sourceDocument: string
    batchTransfer: string
    status: string
    operations: any[]
  }
  onClick: () => void
  getStatusColor: (status: string) => { bg: string; text: string; border: string }
  getStatusIcon: (status: string) => React.ReactNode
  t: (key: string) => string
  isRTL: boolean
}

export function DeliveryCard({ delivery, onClick, getStatusColor, getStatusIcon, t, isRTL }: DeliveryCardProps) {
  const { colors } = useTheme()
  const statusColor = getStatusColor(delivery.status)

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        background: colors.card,
        borderRadius: "12px",
        padding: "1.5rem",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.12)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {/* Gradient circle overlay */}
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

      {/* Header with reference and status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem",
          position: "relative",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "0.5rem" }}>
            {delivery.reference}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{delivery.deliveryAddress}</span>
          </div>
        </div>
        <div
          style={{
            padding: "0.375rem 0.875rem",
            borderRadius: "8px",
            background: statusColor.bg,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ color: statusColor.text, display: "flex" }}>{getStatusIcon(delivery.status)}</span>
          <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: statusColor.text }}>{delivery.status}</span>
        </div>
      </div>

      

      {/* Transfer Flow */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.action}08, ${colors.action}03)`,
          padding: "1rem",
          borderRadius: "10px",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <MapPin size={14} color={colors.textSecondary} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>{t("From")}</span>
            </div>
            <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "600" }}>
              {delivery.sourceLocation}
            </p>
          </div>
          {isRTL ? (
            <ArrowLeft size={20} color={colors.action} style={{ flexShrink: 0 }} />
          ) : (
            <ArrowRight size={20} color={colors.action} style={{ flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, textAlign: isRTL ? "left" : "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.25rem",
                justifyContent: "flex-end",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>{t("To")}</span>
              <User size={14} color={colors.textSecondary} />
            </div>
            <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "600" }}>{t("Customer")}</p>
          </div>
        </div>
      </div>

      {/* Metric boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.action}10, ${colors.action}05)`,
            padding: "0.875rem",
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <Calendar size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
              {t("Scheduled Date")}
            </span>
          </div>
          <p style={{ fontSize: "0.9375rem", fontWeight: "700", color: colors.textPrimary }}>
            {new Date(delivery.scheduledDate).toLocaleDateString()}
          </p>
        </div>
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.action}10, ${colors.action}05)`,
            padding: "0.875rem",
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <FileText size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
              {t("Source Document")}
            </span>
          </div>
          <p style={{ fontSize: "0.9375rem", fontWeight: "700", color: colors.textPrimary }}>
            {delivery.sourceDocument || "—"}
          </p>
        </div>
      </div>

      {/* Footer */}
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
          <Package size={16} color={colors.textSecondary} />
          <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>
            {delivery.operations.length} {delivery.operations.length === 1 ? t("Operation") : t("Operations")}
          </span>
        </div>
        {delivery.batchTransfer && (
          <Badge style={{ background: colors.background, color: colors.textPrimary, border: "none" }}>
            {delivery.batchTransfer}
          </Badge>
        )}
      </div>
    </div>
  )
}
