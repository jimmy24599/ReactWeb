"use client"

import type React from "react"

import { useState } from "react"
import { useTheme } from "../../context/theme"

interface CustomInputProps {
  label: string
  type: "text" | "number"
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CustomInput({ label, type, value, onChange, placeholder = "" }: CustomInputProps) {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // For number type, only allow numeric input
    if (type === "number") {
      // Allow empty string, numbers, and decimal point
      if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
        onChange(newValue)
      }
    } else {
      onChange(newValue)
    }
  }

  const hasValue = value.length > 0

  return (
    <div style={{ position: "relative", width: "100%" }}>
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

      <input
        type={type === "number" ? "text" : "text"}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 10px",
          background: colors.card,
          border: `2px solid ${isFocused || hasValue ? colors.border : colors.border}`,
          borderRadius: "0.75rem",
          fontSize: "12px",
          color: colors.textPrimary,
          outline: "none",
          transition: "all 0.2s ease",
          fontWeight: hasValue ? "500" : "400",
        }}
        onMouseEnter={(e) => {
          if (!isFocused && !hasValue) {
            e.currentTarget.style.borderColor = colors.action
          }
        }}
        onMouseLeave={(e) => {
          if (!isFocused && !hasValue) {
            e.currentTarget.style.borderColor = colors.border
          }
        }}
      />
    </div>
  )
}
