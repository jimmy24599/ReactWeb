"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "../../context/theme"
import { Package, Calendar, MapPin, Trash2, FileText, AlertTriangle } from "lucide-react"

interface ScrapCardProps {
  scrap: {
    id: number
    reference: string
    date: string
    product: string
    quantity: number
    unitOfMeasure: string
    sourceLocation: string
    scrapLocation: string
    scrapReason: string
    owner: string
    sourceDocument: string
    status: string
  }
  onClick: () => void
  getStatusStyle: (status: string) => { bg: string; text: string; border: string }
  getStatusLabel: (status: string) => string
}

export function ScrapCard({ scrap, onClick, getStatusStyle, getStatusLabel }: ScrapCardProps) {
  const { colors } = useTheme()

  return (
    <Card
      onClick={onClick}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        background: colors.card,
        border: `1px solid ${colors.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"
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

      <CardContent style={{ padding: "1.25rem", position: "relative" }}>
        {/* Header with Icon and Status */}
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1 }}>
            <div
              style={{
                background: colors.action,
                padding: "0.625rem",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Trash2 size={18} color="#FFFFFF" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: "0.25rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {scrap.reference}
              </h3>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: colors.textSecondary,
                  lineHeight: "1.4",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {scrap.product}
              </p>
            </div>
          </div>
        </div>


        {/* Metric Boxes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.action}08, ${colors.action}03)`,
              padding: "0.75rem",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
              <Package size={12} color={colors.textSecondary} />
              <span style={{ fontSize: "0.6875rem", color: colors.textSecondary, fontWeight: "600" }}>Quantity</span>
            </div>
            <p style={{ fontSize: "1rem", fontWeight: "700", color: colors.textPrimary }}>
              {scrap.quantity} <span style={{ fontSize: "0.75rem", fontWeight: "500" }}>{scrap.unitOfMeasure}</span>
            </p>
          </div>

          <div
            style={{
              background: `linear-gradient(135deg, ${colors.action}08, ${colors.action}03)`,
              padding: "0.75rem",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
              <Calendar size={12} color={colors.textSecondary} />
              <span style={{ fontSize: "0.6875rem", color: colors.textSecondary, fontWeight: "600" }}>Date</span>
            </div>
            <p style={{ fontSize: "1rem", fontWeight: "700", color: colors.textPrimary }}>
              {scrap.date === "2025-10-18" ? "Today" : scrap.date}
            </p>
          </div>
        </div>

        {/* Location Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MapPin size={14} color={colors.textSecondary} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "0.6875rem", color: colors.textSecondary, fontWeight: "600" }}>Source: </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: colors.textPrimary,
                  fontWeight: "600",
                }}
              >
                {scrap.sourceLocation}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Trash2 size={14} color={colors.textSecondary} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "0.6875rem", color: colors.textSecondary, fontWeight: "600" }}>Scrap: </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: colors.textPrimary,
                  fontWeight: "600",
                }}
              >
                {scrap.scrapLocation}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "0.75rem",
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <FileText size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "500" }}>
              {scrap.sourceDocument}
            </span>
          </div>
          <span style={{ fontSize: "0.6875rem", color: colors.textSecondary, fontWeight: "600" }}>{scrap.owner}</span>
        </div>
      </CardContent>
    </Card>
  )
}
