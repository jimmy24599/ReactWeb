"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, Plus, Ruler, Package, Scale, Clock, X, Trash2, RefreshCw } from "lucide-react"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { useAuth } from "../context/auth"
import { API_CONFIG } from "./config/api"
import Toast from "./components/Toast"

interface Unit {
  id: string
  name: string
  type: "reference" | "bigger" | "smaller"
  ratio: number
  active: boolean
  rounding: number
}

interface UnitCategory {
  id: string
  name: string
  units: Unit[]
}

export default function UnitsOfMeasurePage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<UnitCategory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const { colors } = useTheme()
  const { uom, fetchData } = useData() as any
  const { sessionId } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<{ text: string; state?: 'success' | 'error' } | null>(null)

  const categories: UnitCategory[] = useMemo(() => {
    const list = Array.isArray(uom) ? uom : []
    const byCat: Record<string, UnitCategory> = {}
    for (const rec of list) {
      const cat = rec.category_id
      const catId = Array.isArray(cat) ? cat[0] : cat
      const catName = Array.isArray(cat) ? cat[1] : (rec.category_name || 'Category')
      if (typeof catId !== 'number') continue
      const key = String(catId)
      if (!byCat[key]) byCat[key] = { id: key, name: String(catName || key), units: [] }
      byCat[key].units.push({
        id: String(rec.id),
        name: rec.name || '',
        type: (rec.uom_type as any) || 'reference',
        ratio: Number(rec.ratio || rec.factor_inv || 1),
        active: rec.active !== false,
        rounding: Number(rec.rounding || 0.01),
      })
    }
    return Object.values(byCat)
  }, [uom])

  useEffect(() => {
    if (!uom?.length) fetchData('uom')
  }, [uom?.length])

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalUnits = categories.reduce((sum, cat) => sum + cat.units.length, 0)
  const activeUnits = categories.reduce((sum, cat) => sum + cat.units.filter((u) => u.active).length, 0)
  const referenceUnits = categories.reduce(
    (sum, cat) => sum + cat.units.filter((u) => u.type === "reference").length,
    0,
  )

  const handleOpenModal = (category: UnitCategory | null = null) => {
    if (category) {
      setSelectedCategory(category)
      setIsAddingNew(false)
    } else {
      setSelectedCategory({
        id: "",
        name: "",
        units: [],
      })
      setIsAddingNew(true)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCategory(null)
    setIsAddingNew(false)
  }

  const handleAddUnit = () => {
    if (selectedCategory) {
      const newUnit: Unit = {
        id: `new-${Date.now()}`,
        name: "",
        type: "reference",
        ratio: 1.0,
        active: true,
        rounding: 0.01,
      }
      setSelectedCategory({
        ...selectedCategory,
        units: [...selectedCategory.units, newUnit],
      })
    }
  }

  const handleRemoveUnit = (unitId: string) => {
    if (selectedCategory) {
      setSelectedCategory({
        ...selectedCategory,
        units: selectedCategory.units.filter((u) => u.id !== unitId),
      })
    }
  }

  const handleUpdateUnit = (unitId: string, field: keyof Unit, value: any) => {
    if (selectedCategory) {
      setSelectedCategory({
        ...selectedCategory,
        units: selectedCategory.units.map((u) => (u.id === unitId ? { ...u, [field]: value } : u)),
      })
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.background, padding: "16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: "700",
            color: colors.textPrimary,
            margin: 0,
          }}
        >
          {t("Units of Measure")}
        </h1>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <button
            type="button"
            title={t('Refresh') as string}
            onClick={async ()=>{
              if (refreshing) return
              try {
                setRefreshing(true)
                await fetchData('uom')
              } finally {
                setRefreshing(false)
              }
            }}
            style={{
              background: colors.card,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              padding: '10px',
              borderRadius: '8px',
              cursor: refreshing ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <RefreshCw size={18} style={{ animation: refreshing ? 'spin 0.9s linear infinite' : 'none' }} />
          </button>
          <style>
            {`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}
          </style>
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: colors.action,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9"
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1"
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <Plus size={20} />
            {t("Add Category")}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            background: colors.card,
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: colors.action,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.textPrimary }}>{categories.length}</div>
              <div style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Total Categories")}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: colors.card,
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: colors.pillInfoBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ruler size={18} color={colors.pillInfoText} />
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.textPrimary }}>{totalUnits}</div>
              <div style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Total Units")}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: colors.card,
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: colors.pillSuccessBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Scale size={18} color={colors.pillSuccessText} />
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.textPrimary }}>{activeUnits}</div>
              <div style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Active Units")}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: colors.card,
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: colors.inProgress,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={18} color="#0A0A0A" />
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.textPrimary }}>{referenceUnits}</div>
              <div style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Reference Units")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ position: "relative", maxWidth: "420px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.textSecondary,
            }}
          />
          <input
            type="text"
            placeholder={t("Search categories...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 40px",
              border: `1px solid ${colors.border}`,
              background: colors.card,
              color: colors.textPrimary,
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.2s",
            }}
          />
        </div>
      </div>

      {/* Category Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "10px",
        }}
      >
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleOpenModal(category)}
            style={{
              background: colors.card,
              padding: "12px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
              cursor: "pointer",
              transition: "all 0.2s",
              border: `1px solid ${colors.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)"
              e.currentTarget.style.borderColor = colors.action
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)"
              e.currentTarget.style.borderColor = colors.border
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: colors.textPrimary,
                  margin: "0 0 6px 0",
                }}
              >
                {category.name}
              </h3>
              <div style={{ fontSize: "13px", color: colors.textSecondary }}>
                {category.units.length} {t("units")}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {category.units.slice(0, 6).map((unit) => (
                <span
                  key={unit.id}
                  style={{
                    padding: "4px 8px",
                    background: colors.pillInfoBg,
                    color: colors.pillInfoText,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {unit.name}
                </span>
              ))}
              {category.units.length > 6 && (
                <span
                  style={{
                    padding: "4px 8px",
                    background: colors.pillInfoBg,
                    color: colors.pillInfoText,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  +{category.units.length - 6} {t("more items")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && selectedCategory && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "16px",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "12px",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                background: colors.card,
                zIndex: 1,
              }}
            >
              <h2 style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary, margin: 0 }}>
                {isAddingNew ? t("Add Unit of Measure Category") : t("Edit Unit of Measure Category")}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.background
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none"
                }}
              >
                <X size={24} color={colors.textSecondary} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "16px" }}>
              {/* Category Name */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginBottom: "6px",
                  }}
                >
                  {t("Unit of Measure Category")}
                </label>
                <input
                  type="text"
                  value={selectedCategory.name}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                  placeholder={t("e.g., Weight, Length, Volume")}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: `1px solid ${colors.border}`,
                    background: colors.card,
                    color: colors.textPrimary,
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                />
              </div>

              {/* Units Table (only for existing categories) */}
              {!isAddingNew && (
              <div style={{ marginBottom: "10px" }}>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginBottom: "8px",
                  }}
                >
                  {t("Units of Measure")}
                </h3>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: colors.background, borderBottom: `1px solid ${colors.border}` }}>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Unit of Measure")}
                        </th>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Type")}
                        </th>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Ratio")}
                        </th>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Active")}
                        </th>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Rounding")}
                        </th>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCategory.units.map((unit, index) => (
                        <tr
                          key={unit.id}
                          style={{
                            borderBottom: `1px solid ${colors.border}`,
                            background: index % 2 === 0 ? colors.card : colors.background,
                          }}
                        >
                          <td style={{ padding: "10px" }}>
                            <input
                              type="text"
                              value={unit.name}
                              onChange={(e) => handleUpdateUnit(unit.id, "name", e.target.value)}
                              placeholder={t("Unit name")}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: `1px solid ${colors.border}`,
                                background: colors.card,
                                color: colors.textPrimary,
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none",
                                transition: "all 0.2s",
                              }}
                            />
                          </td>
                          <td style={{ padding: "10px" }}>
                            <select
                              value={unit.type}
                              onChange={(e) =>
                                handleUpdateUnit(unit.id, "type", e.target.value as "reference" | "bigger" | "smaller")
                              }
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: `1px solid ${colors.border}`,
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none",
                                background: colors.card,
                                color: colors.textPrimary,
                              }}
                            >
                              {(
                                !selectedCategory.units.some((u) => u.id !== unit.id && u.type === "reference") ||
                                unit.type === "reference"
                              ) && <option value="reference">{t("Reference Unit")}</option>}
                              <option value="bigger">{t("Bigger than reference")}</option>
                              <option value="smaller">{t("Smaller than reference")}</option>
                            </select>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <input
                              type="number"
                              value={unit.ratio}
                              onChange={(e) => handleUpdateUnit(unit.id, "ratio", Number.parseFloat(e.target.value))}
                              step="0.000001"
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: `1px solid ${colors.border}`,
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none",
                                background: colors.card,
                                color: colors.textPrimary,
                              }}
                            />
                          </td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={unit.active}
                              onChange={(e) => handleUpdateUnit(unit.id, "active", e.target.checked)}
                              style={{
                                width: "16px",
                                height: "16px",
                                cursor: "pointer",
                                accentColor: colors.action,
                              }}
                            />
                          </td>
                          <td style={{ padding: "10px" }}>
                            <input
                              type="number"
                              value={unit.rounding}
                              onChange={(e) => handleUpdateUnit(unit.id, "rounding", Number.parseFloat(e.target.value))}
                              step="0.00001"
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: `1px solid ${colors.border}`,
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none",
                                background: colors.card,
                                color: colors.textPrimary,
                              }}
                            />
                          </td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <button
                              onClick={() => handleRemoveUnit(unit.id)}
                              disabled={selectedCategory.units.length === 1}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: selectedCategory.units.length === 1 ? "not-allowed" : "pointer",
                                padding: "8px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "6px",
                                transition: "background 0.2s",
                                opacity: selectedCategory.units.length === 1 ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (selectedCategory.units.length > 1) {
                                  e.currentTarget.style.background = colors.mutedBg
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "none"
                              }}
                            >
                              <Trash2 size={16} color="#EF4444" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: '10px' }}>
                  <button
                    onClick={handleAddUnit}
                    style={{
                      padding: "8px 14px",
                      background: colors.card,
                      border: `1px dashed ${colors.border}`,
                      borderRadius: "8px",
                      color: colors.textPrimary,
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    + Add a line
                  </button>
                  {selectedCategory.units.some(u => String(u.id).startsWith('new-')) && (
                    <button
                      onClick={async () => {
                        try {
                          if (!sessionId || !selectedCategory?.id) return
                          const base = API_CONFIG.BACKEND_BASE_URL
                          const newUnits = (selectedCategory.units || []).filter(u => String(u.id).startsWith('new-') && (u.name || '').trim())
                          for (const u of newUnits) {
                            const values: any = {
                              name: u.name,
                              uom_type: u.type,
                              ratio: Number(u.ratio || 1),
                              active: !!u.active,
                              category_id: Number(selectedCategory.id),
                            }
                            await fetch(`${base}/uom/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
                          }
                          await fetchData('uom')
                          // Refresh in-modal lines and hide Confirm by removing new-* locals
                          const catId = Number(selectedCategory.id)
                          const fresh = Array.isArray(uom) ? uom.filter((r: any) => {
                            const c = Array.isArray(r.category_id) ? r.category_id[0] : r.category_id
                            return c === catId
                          }) : []
                          setSelectedCategory((prev) => prev ? ({
                            ...prev,
                            units: fresh.map((rec: any) => ({
                              id: String(rec.id),
                              name: rec.name || '',
                              type: (rec.uom_type as any) || 'reference',
                              ratio: Number(rec.ratio || rec.factor_inv || 1),
                              active: rec.active !== false,
                              rounding: Number(rec.rounding || 0.01),
                            }))
                          }) : prev)
                          setToast({ text: 'UoM lines created successfully', state: 'success' })
                        } catch (e) {
                          console.error('Confirm UoM lines failed', e)
                          setToast({ text: 'Failed to create UoM lines', state: 'error' })
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        background: colors.action,
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {t('Confirm')}
                    </button>
                  )}
                </div>
              </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "12px",
                borderTop: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                position: "sticky",
                bottom: 0,
                background: colors.card,
              }}
            >
              <button
                onClick={handleCloseModal}
                style={{
                  padding: "8px 14px",
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: colors.textPrimary,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.card
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.background
                }}
              >
                {t("Cancel")}
              </button>
              <button
                style={{
                  padding: "8px 14px",
                  background: colors.action,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#fff",
                  cursor: "pointer",
                }}
                onClick={async () => {
                  try {
                    if (!sessionId) return
                    const base = API_CONFIG.BACKEND_BASE_URL
                    if (isAddingNew) {
                      await fetch(`${base}/uom-categories/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values: { name: selectedCategory?.name || '' } }) })
                    } else if (selectedCategory?.id) {
                      await fetch(`${base}/uom-categories/${selectedCategory.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values: { name: selectedCategory.name } }) })
                      const newUnits = (selectedCategory.units || []).filter(u => String(u.id).startsWith('new-') && (u.name || '').trim())
                      for (const u of newUnits) {
                        const values: any = {
                          name: u.name,
                          uom_type: u.type, // 'reference' | 'bigger' | 'smaller'
                          ratio: Number(u.ratio || 1),
                          active: !!u.active,
                          category_id: Number(selectedCategory.id),
                        }
                        await fetch(`${base}/uom/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
                      }
                    }
                    await fetchData('uom')
                    setIsModalOpen(false)
                  } catch (e) {
                    console.error('Save UoM category/units failed', e)
                  }
                }}
              >
                {isAddingNew ? t("Create") : t("Save")}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast text={toast.text} state={toast.state} onClose={() => setToast(null)} />}
    </div>
  )
}
