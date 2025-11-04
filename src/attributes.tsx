"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { Search, Plus, Trash2, FileText, Grid3x3, Zap, Eye } from "lucide-react"
import { useData } from "../context/data"
import { useAuth } from "../context/auth"
import { API_CONFIG } from "./config/api"
import { StatCard } from "./components/StatCard"
import { AttributeCard } from "./components/AttributeCard"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

// Theming via ThemeContext

type DisplayType = "Radio" | "Pills" | "Select" | "Color" | "Multi-checkbox"
type VariantCreation = "Instantly" | "Dynamically" | "Never"
type FilterVisibility = "Visible" | "Hidden"

interface AttributeValue {
  id: string
  value: string
  freeText: boolean
  extraPrice: number
}

interface Attribute {
  id: string
  name: string
  displayType: DisplayType
  variantCreation: VariantCreation
  filterVisibility: FilterVisibility
  values: AttributeValue[]
}

export default function AttributesPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()
  const { attributes: rawAttributes, fetchData } = useData() as any
  const { sessionId } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)
  const [formData, setFormData] = useState<Attribute>({
    id: "",
    name: "",
    displayType: "Radio",
    variantCreation: "Instantly",
    filterVisibility: "Visible",
    values: [],
  })

  // Map Odoo fields to UI model
  const mapDisplayType = (s: string): DisplayType => {
    const k = (s || "").toLowerCase()
    if (k.includes("color")) return "Color"
    if (k.includes("pill")) return "Pills"
    if (k.includes("multi")) return "Multi-checkbox"
    if (k.includes("select")) return "Select"
    return "Radio"
  }
  const mapVariantCreation = (s: string): VariantCreation => {
    const k = (s || "").toLowerCase()
    if (k.includes("dynamic") || k.includes("needed")) return "Dynamically"
    if (k.includes("never") || k.includes("no_variant")) return "Never"
    return "Instantly"
  }
  const mapVisibility = (s: string): FilterVisibility => {
    const k = (s || "").toLowerCase()
    if (k.includes("hidden")) return "Hidden"
    return "Visible"
  }

  const attributes: Attribute[] = useMemo(() => {
    const list = Array.isArray(rawAttributes) ? rawAttributes : []
    return list.map((a: any) => ({
      id: String(a.id),
      name: a.name || "",
      displayType: mapDisplayType(a.display_type || a.displayType || ""),
      variantCreation: mapVariantCreation(a.create_variant || a.variant_creation || ""),
      filterVisibility: mapVisibility(a.visibility || a.filter_visibility || ""),
      values: Array.isArray(a.values)
        ? a.values.map((v: any) => ({
            id: String(v.id),
            value: v.name || "",
            freeText: !!v.is_custom,
            extraPrice: Number(v.price_extra || 0),
          }))
        : [],
    }))
  }, [rawAttributes])

  const filteredAttributes = attributes.filter((attr) => attr.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleOpenModal = (attribute?: Attribute) => {
    if (attribute) {
      setSelectedAttribute(attribute)
      setFormData(attribute)
    } else {
      setSelectedAttribute(null)
      setFormData({
        id: "",
        name: "",
        displayType: "Radio",
        variantCreation: "Instantly",
        filterVisibility: "Visible",
        values: [],
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAttribute(null)
  }

  const handleAddValue = () => {
    setFormData({
      ...formData,
      values: [
        ...formData.values,
        {
          id: `new-${Date.now()}`,
          value: "",
          freeText: false,
          extraPrice: 0,
        },
      ],
    })
  }

  const handleRemoveValue = (id: string) => {
    setFormData({
      ...formData,
      values: formData.values.filter((v) => v.id !== id),
    })
  }

  const handleValueChange = (id: string, field: keyof AttributeValue, value: any) => {
    setFormData({
      ...formData,
      values: formData.values.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    })
  }

  // Helpers to map UI -> backend fields
  const toDisplayType = (d: DisplayType) => {
    switch (d) {
      case "Pills":
        return "pills"
      case "Select":
        return "select"
      case "Color":
        return "color"
      case "Multi-checkbox":
        return "multi"
      default:
        return "radio"
    }
  }
  const toCreateVariant = (v: VariantCreation) => {
    switch (v) {
      case "Dynamically":
        return "dynamic"
      case "Never":
        return "no_variant"
      default:
        return "always"
    }
  }
  const toVisibility = (v: FilterVisibility) => (v === "Hidden" ? "hidden" : "visible")

  const saveAttribute = async () => {
    if (!sessionId) return
    const payload: any = {
      name: formData.name,
      display_type: toDisplayType(formData.displayType),
      create_variant: toCreateVariant(formData.variantCreation),
      visibility: toVisibility(formData.filterVisibility),
    }
    const base = API_CONFIG.BACKEND_BASE_URL
    if (selectedAttribute?.id) {
      await fetch(`${base}/attributes/${selectedAttribute.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, values: payload }),
      })
    } else {
      await fetch(`${base}/attributes/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, values: payload }),
      })
    }
    await fetchData("attributes")
    setIsModalOpen(false)
  }

  const confirmNewValues = async () => {
    if (!sessionId || !selectedAttribute?.id) return
    const base = API_CONFIG.BACKEND_BASE_URL
    const newLines = formData.values.filter((v) => v.id.startsWith("new-") && v.value.trim().length > 0)
    for (const v of newLines) {
      const values: any = {
        name: v.value,
        is_custom: !!v.freeText,
        price_extra: Number(v.extraPrice || 0),
        attribute_id: Number(selectedAttribute.id),
      }
      await fetch(`${base}/attribute-values/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, values }),
      })
    }
    await fetchData("attributes")
  }

  const displayTypeStats = attributes.reduce(
    (acc, attr) => {
      acc[attr.displayType] = (acc[attr.displayType] || 0) + 1
      return acc
    },
    {} as Record<DisplayType, number>,
  )

  const variantCreationStats = attributes.reduce(
    (acc, attr) => {
      acc[attr.variantCreation] = (acc[attr.variantCreation] || 0) + 1
      return acc
    },
    {} as Record<VariantCreation, number>,
  )

  const totalValues = attributes.reduce((sum, attr) => sum + attr.values.length, 0)
  const visibleFilters = attributes.filter((a) => a.filterVisibility === "Visible").length

  return (
    <div className="min-h-screen p-8" style={{ background: colors.background }}>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
          }
          .stat-card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .stat-card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
        `}
      </style>

      <div className="mx-auto max-w-[1600px] space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t("Product Attributes")}
            </h1>
            <p className="mt-2 text-lg" style={{ color: colors.textSecondary }}>
              {t("Manage product attributes for variant creation and filtering")}
            </p>
          </div>
          <Button
            className="text-white transition-all shadow-lg hover:shadow-xl h-11 px-6"
            style={{ background: colors.action }}
            onClick={() => handleOpenModal()}
          >
            <Plus className={`${isRTL ? "ml-2" : "mr-2"} h-5 w-5`} />
            {t("Add Attribute")}
          </Button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          <StatCard
            label={t("Total Attributes")}
            value={attributes.length}
            icon={FileText}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={0}
          />
          <StatCard
            label={t("Display Types")}
            value={Object.keys(displayTypeStats).length}
            icon={Grid3x3}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            delay={1}
          />
          <StatCard
            label={t("Total Values")}
            value={totalValues}
            icon={Zap}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            delay={2}
          />
          <StatCard
            label={t("Visible Filters")}
            value={visibleFilters}
            icon={Eye}
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            delay={3}
          />
        </div>

        <Card className="border-none shadow-lg" style={{ background: colors.card }}>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="relative flex-1 min-w-[280px]">
                <Search
                  className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 h-5 w-5 -translate-y-1/2 transition-colors`}
                  style={{ color: colors.textSecondary }}
                />
                <Input
                  placeholder={t("Search attributes...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} h-11 text-base transition-all focus:ring-2`}
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          }}
        >
          {filteredAttributes.map((attribute, idx) => (
            <AttributeCard
              key={attribute.id}
              attribute={attribute}
              onClick={() => handleOpenModal(attribute)}
              index={idx}
            />
          ))}
        </div>

        {filteredAttributes.length === 0 && (
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "1rem",
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                background: `${colors.action}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <FileText size={28} color={colors.action} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
              {t("No attributes found")}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
              {t("Try adjusting your search term or create a new attribute")}
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            animation: "fadeIn 150ms ease-out",
          }}
          onClick={handleCloseModal}
        >
          <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
          <div
            style={{
              width: "min(900px, 96vw)",
              maxHeight: "90vh",
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary }}>
                  {selectedAttribute ? t("Edit Attribute") : t("Add New Attribute")}
                </h3>
                {formData.name && (
                  <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{formData.name}</div>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  border: "none",
                  background: "transparent",
                  color: colors.textSecondary,
                  cursor: "pointer",
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "1rem 1.25rem", overflowY: "auto" }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Attribute Name")}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("e.g. Brand, Color, Size")}
                    style={{
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("eCommerce Filter")}</Label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    {(["Visible", "Hidden"] as FilterVisibility[]).map((option) => (
                      <label
                        key={option}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          padding: "0.75rem 1rem",
                          borderRadius: "0.5rem",
                          border: `2px solid ${formData.filterVisibility === option ? colors.action : colors.border}`,
                          transition: "all 0.2s",
                          flex: 1,
                        }}
                      >
                        <input
                          type="radio"
                          name="filterVisibility"
                          value={option}
                          checked={formData.filterVisibility === option}
                          onChange={(e) =>
                            setFormData({ ...formData, filterVisibility: e.target.value as FilterVisibility })
                          }
                          style={{ accentColor: colors.action }}
                        />
                        <span style={{ fontSize: "0.95rem", color: colors.textPrimary }}>{t(option)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Display Type")}</Label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {(["Radio", "Pills", "Select", "Color", "Multi-checkbox"] as DisplayType[]).map((option) => (
                      <label
                        key={option}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          padding: "0.75rem",
                          borderRadius: "0.5rem",
                          border: `2px solid ${formData.displayType === option ? colors.action : colors.border}`,
                          transition: "all 0.2s",
                        }}
                      >
                        <input
                          type="radio"
                          name="displayType"
                          value={option}
                          checked={formData.displayType === option}
                          onChange={(e) => setFormData({ ...formData, displayType: e.target.value as DisplayType })}
                          style={{ accentColor: colors.action }}
                        />
                        <span style={{ fontSize: "0.875rem", color: colors.textPrimary }}>{t(option)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Variant Creation")}</Label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    {(["Instantly", "Dynamically", "Never"] as VariantCreation[]).map((option) => (
                      <label
                        key={option}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          padding: "0.75rem 1rem",
                          borderRadius: "0.5rem",
                          border: `2px solid ${formData.variantCreation === option ? colors.action : colors.border}`,
                          transition: "all 0.2s",
                          flex: 1,
                        }}
                      >
                        <input
                          type="radio"
                          name="variantCreation"
                          value={option}
                          checked={formData.variantCreation === option}
                          onChange={(e) =>
                            setFormData({ ...formData, variantCreation: e.target.value as VariantCreation })
                          }
                          style={{ accentColor: colors.action }}
                        />
                        <span style={{ fontSize: "0.95rem", color: colors.textPrimary }}>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <Label style={{ color: colors.textSecondary }}>{t("Attribute Values")}</Label>
                    <Button
                      onClick={handleAddValue}
                      size="sm"
                      style={{
                        background: colors.action,
                        color: "#FFFFFF",
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("Add Value")}
                    </Button>
                  </div>

                  {formData.values.length > 0 ? (
                    <div style={{ border: `1px solid ${colors.border}`, borderRadius: "0.5rem", overflow: "hidden" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto auto auto",
                          gap: "1rem",
                          padding: "0.75rem 1rem",
                          borderBottom: `1px solid ${colors.border}`,
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: colors.textPrimary,
                        }}
                      >
                        <div>{t("Value")}</div>
                        <div style={{ textAlign: "center" }}>{t("Free Text")}</div>
                        <div style={{ textAlign: "right" }}>{t("Extra Price")}</div>
                        <div style={{ width: "40px" }}></div>
                      </div>

                      {formData.values.map((value) => (
                        <div
                          key={value.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto auto auto",
                            gap: "1rem",
                            padding: "0.75rem 1rem",
                            borderBottom: `1px solid ${colors.border}`,
                            alignItems: "center",
                          }}
                        >
                          <Input
                            type="text"
                            value={value.value}
                            onChange={(e) => handleValueChange(value.id, "value", e.target.value)}
                            placeholder={t("Enter value")}
                            style={{
                              border: `1px solid ${colors.border}`,
                              background: colors.background,
                              color: colors.textPrimary,
                            }}
                          />
                          <input
                            type="checkbox"
                            checked={value.freeText}
                            onChange={(e) => handleValueChange(value.id, "freeText", e.target.checked)}
                            style={{ accentColor: colors.action, cursor: "pointer" }}
                          />
                          <Input
                            type="number"
                            value={value.extraPrice}
                            onChange={(e) =>
                              handleValueChange(value.id, "extraPrice", Number.parseFloat(e.target.value) || 0)
                            }
                            style={{
                              border: `1px solid ${colors.border}`,
                              background: colors.background,
                              color: colors.textPrimary,
                              width: "100px",
                              textAlign: "right",
                            }}
                          />
                          <button
                            onClick={() => handleRemoveValue(value.id)}
                            style={{
                              padding: "0.5rem",
                              borderRadius: "0.375rem",
                              border: "none",
                              backgroundColor: "transparent",
                              color: "#ef4444",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {formData.values.some((v) => v.id.startsWith("new-")) && selectedAttribute?.id && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "0.5rem",
                            padding: "0.75rem 1rem",
                          }}
                        >
                          <Button
                            onClick={confirmNewValues}
                            size="sm"
                            style={{ background: colors.action, color: "#fff" }}
                          >
                            {t("Confirm New Values")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: colors.textSecondary,
                        border: `2px dashed ${colors.border}`,
                        borderRadius: "0.5rem",
                      }}
                    >
                      {t("No values added yet. Click 'Add Value' to get started.")}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "0.75rem 1.25rem",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
                <Button
                  variant="outline"
                  className="bg-transparent"
                  style={{ borderColor: colors.border, color: colors.textPrimary }}
                  onClick={handleCloseModal}
                >
                  {t("Cancel")}
                </Button>
                <Button className="text-white" style={{ background: colors.action }} onClick={saveAttribute}>
                  {selectedAttribute ? t("Save Changes") : t("Create Attribute")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
