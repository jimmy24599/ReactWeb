"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "../../context/theme"
import { useTranslation } from "react-i18next"
import {
  MapPin,
  ArrowRight,
  ArrowLeft,
  Calendar,
  FileText,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  User,
} from "lucide-react"

interface ReceiptCardProps {
  receipt: {
    id: number
    reference: string
    from: string
    to: string
    contact: string
    scheduledDate: string
    sourceDocument: string
    batchTransfer: string
    status: string
    operations: any[]
  }
  onClick: () => void
  index: number
}

export function ReceiptCard({ receipt, onClick, index }: ReceiptCardProps) {
  const { colors } = useTheme()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-4 h-4" />
      case "ready":
        return <Clock className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      case "draft":
        return <FileText className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "draft":
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
      case "ready":
        return { bg: colors.inProgress, text: "#0A0A0A", border: colors.inProgress }
      case "done":
        return { bg: colors.success, text: "#0A0A0A", border: colors.success }
      case "cancelled":
        return { bg: colors.cancel, text: "#FFFFFF", border: colors.cancel }
      default:
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
    }
  }

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
      {/* Gradient circle overlay */}
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
        {/* Header */}
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
              {receipt.reference}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <User size={14} style={{ color: colors.textSecondary }} />
              <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{receipt.contact}</span>
            </div>
          </div>
          <Badge
            style={{
              borderRadius: "8px",
              padding: "0.375rem 0.875rem",
              background: getStatusStyle(receipt.status).bg,
              border: `1px solid ${getStatusStyle(receipt.status).border}`,
              color: getStatusStyle(receipt.status).text,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "600",
              fontSize: "0.8125rem",
            }}
          >
            <span style={{ display: "flex", color: getStatusStyle(receipt.status).text }}>
              {getStatusIcon(receipt.status)}
            </span>
            {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
          </Badge>
        </div>

        {/* Transfer Flow */}
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.action}08, ${colors.action}03)`,
            padding: "1rem",
            borderRadius: "0.75rem",
            marginBottom: "1rem",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                <MapPin size={14} style={{ color: colors.textSecondary }} />
                <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>{t("From")}</span>
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: colors.textPrimary,
                  fontWeight: "600",
                  lineHeight: "1.4",
                }}
              >
                {receipt.from}
              </p>
            </div>
            {isRTL ? (
              <ArrowLeft size={20} style={{ color: colors.action, flexShrink: 0 }} />
            ) : (
              <ArrowRight size={20} style={{ color: colors.action, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, textAlign: isRTL ? "left" : "right" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.375rem",
                  justifyContent: "flex-end",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>{t("To")}</span>
                <MapPin size={14} style={{ color: colors.textSecondary }} />
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: colors.textPrimary,
                  fontWeight: "600",
                  lineHeight: "1.4",
                }}
              >
                {receipt.to}
              </p>
            </div>
          </div>
        </div>

        {/* Metric Boxes */}
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
              <Calendar size={14} style={{ color: colors.action }} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
                {t("Scheduled Date")}
              </span>
            </div>
            <p style={{ fontSize: "0.9375rem", color: colors.textPrimary, fontWeight: "700" }}>
              {receipt.scheduledDate === "2025-10-18" ? t("Today") : receipt.scheduledDate}
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
              <FileText size={14} style={{ color: colors.action }} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
                {t("Source Document")}
              </span>
            </div>
            <p style={{ fontSize: "0.9375rem", color: colors.textPrimary, fontWeight: "700" }}>
              {receipt.sourceDocument || "—"}
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
            <Package size={16} style={{ color: colors.textSecondary }} />
            <span style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>
              {receipt.operations.length} {receipt.operations.length === 1 ? t("Operation") : t("Operations")}
            </span>
          </div>
          {receipt.batchTransfer && (
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
              {receipt.batchTransfer}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
