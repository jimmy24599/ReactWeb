"use client"

import { useTheme } from "../../context/theme"
import { MapPin, Clock, FileText, Package, User, ArrowRight, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"

interface InternalTransferCardProps {
  transfer: {
    id: number
    reference: string
    contact: string
    from: string
    to: string
    sourceLocation: string
    destinationLocation: string
    scheduledDate: string
    sourceDocument: string
    batchTransfer: string
    operationType: string
    status: string
    operations: any[]
  }
  onClick: () => void
}

export function InternalTransferCard({ transfer, onClick }: InternalTransferCardProps) {
  const { colors } = useTheme()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "draft":
        return { bg: colors.todo, text: "#FFFFFF", border: colors.todo }
      case "waiting":
      case "ready":
        return { bg: colors.inProgress, text: "#FFFFFF", border: colors.inProgress }
      case "done":
        return { bg: colors.success, text: "#FFFFFF", border: colors.success }
      case "cancelled":
        return { bg: colors.cancel, text: "#FFFFFF", border: colors.cancel }
      default:
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        background: colors.card,
        borderRadius: "12px",
        padding: "1.5rem",
        cursor: "pointer",
        transition: "all 0.3s ease",
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

      {/* Header with icon box */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flex: 1 }}>
          <div
            style={{
              background: colors.action,
              padding: "0.75rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Package size={20} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "0.25rem" }}>
              {transfer.reference}
            </h3>
            {transfer.contact && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <User size={14} color={colors.textSecondary} />
                <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{transfer.contact}</span>
              </div>
            )}
          </div>
        </div>
        <Badge
          style={{
            borderRadius: "6px",
            padding: "0.25rem 0.75rem",
            background: getStatusStyle(transfer.status).bg,
            border: `1px solid ${getStatusStyle(transfer.status).border}`,
            color: getStatusStyle(transfer.status).text,
            flexShrink: 0,
          }}
        >
          {getStatusLabel(transfer.status)}
        </Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.action}08, ${colors.action}03)`,
            padding: "0.875rem",
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Clock size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
              {t("Scheduled")}
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "700" }}>
            {transfer.scheduledDate === "2025-10-18" ? t("Today") : transfer.scheduledDate}
          </p>
        </div>
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.action}08, ${colors.action}03)`,
            padding: "0.875rem",
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Package size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
              {t("Operations")}
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "700" }}>
            {transfer.operations.length} {transfer.operations.length === 1 ? t("Item") : t("Items")}
          </p>
        </div>
      </div>

      {/* Transfer Flow */}
      <div
        style={{
          background: colors.background,
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <MapPin size={14} color={colors.textSecondary} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>{t("From")}</span>
            </div>
            <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "600" }}>{transfer.from}</p>
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
              <MapPin size={14} color={colors.textSecondary} />
            </div>
            <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "600" }}>{transfer.to}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText size={14} color={colors.textSecondary} />
          <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>
            {transfer.sourceDocument || t("No source document")}
          </span>
        </div>
        {transfer.batchTransfer && (
          <Badge
            style={{ background: colors.background, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
          >
            {transfer.batchTransfer}
          </Badge>
        )}
      </div>
    </div>
  )
}
