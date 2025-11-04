"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp, Check } from "lucide-react"
import { useTheme } from "../../context/theme"

interface CustomDropdownProps {
  label: string
  values: string[]
  type: "single" | "multi"
  onChange: (selected: string | string[]) => void
  placeholder?: string
  defaultValue?: string | string[]
}

export function CustomDropdown({
  label,
  values,
  type,
  onChange,
  placeholder = "Select",
  defaultValue,
}: CustomDropdownProps) {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSingle, setSelectedSingle] = useState<string | null>(
    type === "single" && typeof defaultValue === "string" ? defaultValue : null,
  )
  const [selectedMulti, setSelectedMulti] = useState<string[]>(
    type === "multi" && Array.isArray(defaultValue) ? defaultValue : [],
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSingleSelect = (value: string) => {
    setSelectedSingle(value)
    onChange(value)
    setIsOpen(false)
  }

  const handleMultiSelect = (value: string) => {
    const newSelected = selectedMulti.includes(value)
      ? selectedMulti.filter((v) => v !== value)
      : [...selectedMulti, value]
    setSelectedMulti(newSelected)
    onChange(newSelected)
  }

  const getDisplayText = () => {
    if (type === "single") {
      return selectedSingle || placeholder
    }
    if (selectedMulti.length === 0) {
      return placeholder
    }
    return `${selectedMulti.length} Selected`
  }

  const hasSelection = type === "single" ? selectedSingle !== null : selectedMulti.length > 0

  return (
    <div style={{ position: "relative", width: "100%" }} ref={dropdownRef}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: "600",
          color: colors.textPrimary,
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "10px 10px",
          background: colors.card,
          border: `2px solid ${hasSelection ? colors.border : colors.border}`,
          borderRadius: "0.75rem",
          fontSize: "12px",
          color: hasSelection ? colors.textPrimary : colors.textSecondary,
          display: "flex",
          alignItems: "left",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "all 0.2s ease",
          fontWeight: hasSelection ? "500" : "400",
        }}
        onMouseEnter={(e) => {
          if (!hasSelection) {
            e.currentTarget.style.borderColor = colors.action
          }
        }}
        onMouseLeave={(e) => {
          if (!hasSelection) {
            e.currentTarget.style.borderColor = colors.border
          }
        }}
      >
        <span>{getDisplayText()}</span>
        {isOpen ? (
          <ChevronUp size={18} color={hasSelection ? colors.action : colors.textSecondary} />
        ) : (
          <ChevronDown size={18} color={hasSelection ? colors.action : colors.textSecondary} />
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            left: 0,
            right: 0,
            background: colors.card,
            borderRadius: "0.75rem",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 50,
            maxHeight: "300px",
            overflowY: "auto",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {values.map((value, index) => {
            const isSelected = type === "single" ? selectedSingle === value : selectedMulti.includes(value)

            return (
              <div
                key={value}
                onClick={() => (type === "single" ? handleSingleSelect(value) : handleMultiSelect(value))}
                style={{
                  padding: "10px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: isSelected
                    ? `linear-gradient(135deg, ${colors.action}15, ${colors.action}08)`
                    : "transparent",
                  borderBottom: index < values.length - 1 ? `1px solid ${colors.border}` : "none",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = colors.mutedBg
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent"
                  }
                }}
              >
                {type === "multi" && (
                  <div
                    style={{
                      width: "20px",
                      height: "15px",
                      borderRadius: "0.375rem",
                      border: `2px solid ${isSelected ? colors.action : colors.border}`,
                      background: isSelected ? colors.action : "transparent",
                      display: "flex",
                      alignItems: "left",
                      justifyContent: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                  </div>
                )}
                <span
                  style={{
                    fontSize: "12px",
                    color: isSelected ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isSelected ? "500" : "400",
                  }}
                >
                  {value}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
