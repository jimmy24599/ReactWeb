"use client"

import { Box, DollarSign, MapPin, Calendar, AlertTriangle, Wrench } from "lucide-react"
import { useTheme } from "../../context/theme"
import { useTranslation } from "react-i18next"

interface LotCardProps {
  lot: {
    id: string
    lotNumber: string
    internalReference: string
    product: string
    productCategory: string
    onHandQuantity: number
    totalValue: number
    location: string
    createdOn: string
    expiryDate?: string
    status: "Active" | "Expired" | "Reserved" | "Depleted"
  }
  onClick: () => void
  index: number
  onRepairs?: () => void
  onLocations?: () => void
}

export function LotCard({ lot, onClick, index, onRepairs, onLocations }: LotCardProps) {
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
                {lot.lotNumber}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: colors.textSecondary,
                  marginBottom: "0.25rem",
                }}
              >
                {lot.product}
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
                {lot.status}
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
              <Box size={14} color={colors.textSecondary} />
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "500" }}>
                {t("On Hand")}
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
              {lot.onHandQuantity.toLocaleString()}
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
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "500" }}>{t("Value")}</span>
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: colors.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              {((lot.totalValue || 0) / 1000).toFixed(0)}K
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MapPin size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>{lot.location}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={14} color={colors.textSecondary} />
            <span style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>
              {t("Created:")} {lot.createdOn}
            </span>
          </div>
          {lot.expiryDate && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertTriangle size={14} color={colors.cancel} />
              <span style={{ fontSize: "0.8rem", color: colors.cancel, fontWeight: "500" }}>
                {t("Expires:")} {lot.expiryDate}
              </span>
            </div>
          )}
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={(e)=>{ e.stopPropagation(); onRepairs && onRepairs() }}
            style={{
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'8px 12px', border:`1px solid ${colors.border}`, borderRadius:8,
              background: colors.mutedBg, color: colors.textPrimary, cursor:'pointer', fontWeight:600, fontSize:13
            }}
          >
            <Wrench size={16} />
            {t('Repairs')}
          </button>
          <button
            onClick={(e)=>{ e.stopPropagation(); onLocations && onLocations() }}
            style={{
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'8px 12px', border:`1px solid ${colors.border}`, borderRadius:8,
              background: colors.mutedBg, color: colors.textPrimary, cursor:'pointer', fontWeight:600, fontSize:13
            }}
          >
            <MapPin size={16} />
            {t('Locations')}
          </button>
        </div>
      </div>
    </div>
  )
}
