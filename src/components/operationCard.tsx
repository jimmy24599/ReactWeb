"use client"

import { Package } from "lucide-react"
import { useTheme } from "../../context/theme"
import { useTranslation } from "react-i18next"

interface OperationCardProps {
  operation: {
    id: string
    reference: string
    product: string
    quantity: number
    sourceLocation: string
    destinationLocation: string
    scheduledDate: string
    operationType: string
    responsible?: string
  }
  onClick: () => void
  index: number
}

export function OperationCard({ operation, onClick, index }: OperationCardProps) {
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
              }}
            >
              <Package size={18} color={colors.action} strokeWidth={2.5} />
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
                {operation.reference}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: colors.textSecondary,
                  marginBottom: "0.25rem",
                }}
              >
                {operation.product}
              </div>
              
            </div>
          </div>
        </div>

        

        
      </div>
    </div>
  )
}
