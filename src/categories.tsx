"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { useAuth } from "../context/auth"
import { API_CONFIG } from "./config/api"
import { Search, Plus, FolderTree, ChevronRight, X, RefreshCw } from "lucide-react"

export default function ProductCategoriesPage() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { categories, stockRoutes, removalStrategies, fetchData } = useData() as any
  const { sessionId } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // State for form fields
  const [categoryName, setCategoryName] = useState("")
  const [parentId, setParentId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  // Logistics
  const [routeIds, setRouteIds] = useState<number[]>([])
  const [removalStrategyId, setRemovalStrategyId] = useState<number | null>(null)
  const [packagingReserveMethod, setPackagingReserveMethod] = useState<"full" | "partial" | "">("")
  // Inventory valuation
  const [propertyCostMethod, setPropertyCostMethod] = useState<"standard" | "fifo" | "average" | "">("")
  // UI state
  const [routesOpen, setRoutesOpen] = useState(false)
  const routesDropdownRef = useRef<HTMLDivElement | null>(null)

  const filteredCategories = (categories || []).filter((c: any) => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()))

  const handleCategoryClick = (category: any) => {
    setIsNewCategory(false)
    setEditingId(category.id)
    setCategoryName(category.name || "")
    const p = category.parent_id
    setParentId(Array.isArray(p) ? p[0] : (typeof p === 'number' ? p : null))
    // map logistics
    const routes = Array.isArray(category.route_ids) ? category.route_ids : []
    setRouteIds(routes.map((r: any) => Array.isArray(r) ? r[0] : r).filter((v: any) => typeof v === 'number'))
    const rem = category.removal_strategy_id
    setRemovalStrategyId(Array.isArray(rem) ? rem[0] : (typeof rem === 'number' ? rem : null))
    setPackagingReserveMethod((category.packaging_reserve_method as any) === 'full' || (category.packaging_reserve_method as any) === 'partial' ? category.packaging_reserve_method : "")
    const cm = category.property_cost_method
    setPropertyCostMethod(cm === 'standard' || cm === 'fifo' || cm === 'average' ? cm : "")
    setIsModalOpen(true)
  }

  const handleAddCategory = () => {
    setIsNewCategory(true)
    setCategoryName("")
    setParentId(null)
    setEditingId(null)
    setRouteIds([])
    setRemovalStrategyId(null)
    setPackagingReserveMethod("")
    setPropertyCostMethod("")
    setIsModalOpen(true)
  }

  const totalCategories = (categories || []).length
  const parentCategories = (categories || []).filter((c: any) => !c.parent_id).length
  const childCategories = (categories || []).filter((c: any) => !!c.parent_id).length

  // Ensure datasets
  useEffect(() => {
    if (!(categories && categories.length)) fetchData('categories')
  }, [categories?.length])
  useEffect(() => {
    if (!(stockRoutes && stockRoutes.length)) fetchData('stockRoutes')
  }, [stockRoutes?.length])
  useEffect(() => {
    if (!(removalStrategies && removalStrategies.length)) fetchData('removalStrategies')
  }, [removalStrategies?.length])
  // Close routes dropdown on outside click
  useEffect(() => {
    if (!routesOpen) return
    const onDown = (e: MouseEvent) => {
      const el = routesDropdownRef.current
      if (el && !el.contains(e.target as Node)) setRoutesOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [routesOpen])

  return (
    <div className="p-8" style={{ minHeight: "100vh", background: colors.background }}>
      {/* Header */}
      <div
        style={{
          background: colors.background,
          padding: "1.5rem",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
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
              {t("Product Categories")}
            </h1>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <button
                type="button"
                onClick={async ()=>{
                  if (refreshing) return
                  try {
                    setRefreshing(true)
                    await fetchData('categories')
                  } finally {
                    setRefreshing(false)
                  }
                }}
                style={{
                  background: colors.card,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  fontWeight: 600,
                  padding: "0.5rem 0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  borderRadius: "0.6rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                }}
                title={t('Refresh') as string}
              >
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                  <RefreshCw size={18} style={{ color: colors.textPrimary, transformOrigin:'center', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                </span>
              </button>
              <style>
                {`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}
              </style>
              <button
                onClick={handleAddCategory}
                style={{
                  background: colors.action,
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: 600,
                  padding: "0.5rem 0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  borderRadius: "0.6rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                <Plus size={18} />
                {t("Add Category")}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ position: "relative", maxWidth: "480px" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "0.875rem",
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
                paddingLeft: "2.75rem",
                paddingRight: "0.875rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                fontSize: "0.875rem",
                outline: "none",
                color: colors.textPrimary,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              background: colors.card,
              padding: "1rem",
              borderRadius: "0.75rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "0.75rem",
                  background: colors.action,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FolderTree size={24} style={{ color: "#FFFFFF" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", color: colors.textSecondary, margin: 0 }}>{t("Total Categories")}</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "700", color: colors.textPrimary, margin: 0 }}>{totalCategories}</p>
              </div>
            </div>
          </div>

          <div
            style={{
              background: colors.card,
              padding: "1rem",
              borderRadius: "0.75rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "0.75rem",
                  background: colors.inProgress,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FolderTree size={24} style={{ color: "#0A0A0A" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", color: colors.textSecondary, margin: 0 }}>{t("Parent Categories")}</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "700", color: colors.textPrimary, margin: 0 }}>
                  {parentCategories}
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              background: colors.card,
              padding: "1rem",
              borderRadius: "0.75rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "0.75rem",
                  background: colors.success,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FolderTree size={24} style={{ color: "#0A0A0A" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", color: colors.textSecondary, margin: 0 }}>{t("Child Categories")}</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "700", color: colors.textPrimary, margin: 0 }}>{childCategories}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1rem",
          }}
        >
          {filteredCategories.map((category: any) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              style={{
                background: colors.card,
                borderRadius: "0.75rem",
                padding: "1rem",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: `1px solid ${colors.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)"
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.12)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)"
              }}
            >
              {/* Category Header */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {Array.isArray(category.parent_id) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <ChevronRight size={16} style={{ color: "#4A7FA7" }} />
                    </div>
                  )}
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "700",
                      color: colors.textPrimary,
                      margin: 0,
                    }}
                  >
                    {category.name}
                  </h3>
                </div>
                {Array.isArray(category.parent_id) && (
                  <p style={{ fontSize: "0.875rem", color: colors.textSecondary, margin: 0 }}>{t("Parent:")} {category.parent_id[1]}</p>
                )}
              </div>

              {/* Category Details (only data we have) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Complete Name")}</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: colors.textPrimary }}>
                    {category.complete_name || category.name}
                  </span>
                </div>

                {Array.isArray(category.child_id) && category.child_id.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Child Categories")}</span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: colors.textPrimary,
                      }}
                    >
                      {category.child_id.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <>
          {/* Modal Backdrop */}
          <div
            onClick={() => setIsModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 50,
              animation: "fadeIn 0.2s ease",
            }}
          />

          {/* Modal Content */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: colors.card,
              borderRadius: "0.75rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              zIndex: 51,
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
              animation: "slideIn 0.3s ease",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.5rem",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <h2 style={{ color: colors.textPrimary, fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>
                {isNewCategory ? t("Add New Category") : t("Edit Category")}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.5rem",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.mutedBg
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                <X size={24} style={{ color: colors.textPrimary }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  htmlFor="category-name"
                  style={{ display: "block", color: colors.textSecondary, marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}
                >
                  {t("Category Name")}
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder={t("e.g. Lamps")}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.card,
                    color: colors.textPrimary,
                    borderRadius: "0.5rem",
                    fontSize: "1rem",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="parent-category"
                  style={{ display: "block", color: colors.textSecondary, marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}
                >
                  {t("Parent Category")}
                </label>
                <select
                  id="parent-category"
                  value={parentId ?? ''}
                  onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.card,
                    color: colors.textPrimary,
                    borderRadius: "0.5rem",
                    fontSize: "1rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">{t("None")}</option>
                  {(categories || []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.complete_name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Logistics Section */}
              <div style={{ marginTop: '0.5rem' }}>
                <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700, color: colors.textPrimary }}>{t('Logistics')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', color: colors.textSecondary, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{t('Routes')}</label>
                    {/* Selected tags */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
                      {routeIds.length === 0 && (
                        <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{t('No routes selected')}</span>
                      )}
                      {routeIds.map((id) => {
                        const r = (stockRoutes||[]).find((x:any)=> x.id === id)
                        const label = r?.name || r?.display_name || id
                        return (
                          <span key={id} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'0.25rem 0.5rem', border:`1px solid ${colors.border}`, background: colors.mutedBg, color: colors.textPrimary, borderRadius:999 }}>
                            {label}
                            <button
                              onClick={() => setRouteIds((prev)=> prev.filter((x)=> x!==id))}
                              style={{ border:'none', background:'transparent', color: colors.textSecondary, cursor:'pointer', lineHeight:1 }}
                              aria-label={t('Remove') as string}
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                    {/* Dropdown trigger */}
                    <div style={{ position:'relative' }} ref={routesDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setRoutesOpen((v)=> !v)}
                        style={{ width:'100%', textAlign:'left', padding:'0.6rem 0.75rem', border:`2px solid ${colors.border}`, background: colors.card, color: colors.textPrimary, borderRadius:'0.5rem', cursor:'pointer' }}
                      >
                        {t('Select Routes')}
                      </button>
                      {routesOpen && (
                        <div style={{ position:'absolute', zIndex:60, marginTop:6, width:'100%', maxHeight:220, overflowY:'auto', background: colors.card, border:`1px solid ${colors.border}`, borderRadius:8, boxShadow:'0 10px 20px rgba(0,0,0,0.15)' }}>
                          {(stockRoutes||[]).map((r:any)=> {
                            const id = r.id
                            const checked = routeIds.includes(id)
                            const label = r.name || r.display_name || id
                            return (
                              <label key={id} style={{ display:'flex', alignItems:'center', gap:8, padding:'0.5rem 0.75rem', cursor:'pointer', borderBottom:`1px solid ${colors.border}` }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e)=> {
                                    const isChecked = e.target.checked
                                    setRouteIds((prev)=> isChecked ? Array.from(new Set([...prev, id])) : prev.filter((x)=> x!==id))
                                  }}
                                />
                                <span style={{ color: colors.textPrimary, fontSize:'0.9rem' }}>{label}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: colors.textSecondary, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{t('Force Removal Strategy')}</label>
                    <select
                      value={removalStrategyId ?? ''}
                      onChange={(e) => setRemovalStrategyId(e.target.value ? Number(e.target.value) : null)}
                      style={{ width: '100%', padding: '0.75rem', border: `2px solid ${colors.border}`, background: colors.card, color: colors.textPrimary, borderRadius: '0.5rem' }}
                    >
                      <option value="">{t('None')}</option>
                      {(removalStrategies || []).map((rs: any) => (
                        <option key={rs.id} value={rs.id}>{rs.display_name || rs.name || rs.id}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: colors.textSecondary, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{t('Reserve Packaging')}</label>
                    <select
                      value={packagingReserveMethod}
                      onChange={(e) => setPackagingReserveMethod(e.target.value as any)}
                      style={{ width: '100%', padding: '0.75rem', border: `2px solid ${colors.border}`, background: colors.card, color: colors.textPrimary, borderRadius: '0.5rem' }}
                    >
                      <option value="">{t('Select')}</option>
                      <option value="full">{t('Reserve Only Full Packagings')}</option>
                      <option value="partial">{t('Reserve Partial Packagings')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Inventory Valuation Section */}
              <div style={{ marginTop: '0.5rem' }}>
                <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700, color: colors.textPrimary }}>{t('Inventory Valuation')}</h3>
                <div>
                  <label style={{ display: 'block', color: colors.textSecondary, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{t('Costing Method')}</label>
                  <select
                    value={propertyCostMethod}
                    onChange={(e) => setPropertyCostMethod(e.target.value as any)}
                    style={{ width: '100%', padding: '0.75rem', border: `2px solid ${colors.border}`, background: colors.card, color: colors.textPrimary, borderRadius: '0.5rem' }}
                  >
                    <option value="">{t('Select')}</option>
                    <option value="standard">{t('Standard Price')}</option>
                    <option value="fifo">{t('First In First Out (FIFO)')}</option>
                    <option value="average">{t('Average Cost (AVCO)')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                padding: "1.5rem",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: `2px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.textPrimary,
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.mutedBg
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.card
                }}
              >
                {t("Cancel")}
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!sessionId) return
                    const base = API_CONFIG.BACKEND_BASE_URL
                    const values: any = {
                      name: categoryName,
                      parent_id: parentId ?? false,
                    }
                    if (Array.isArray(routeIds)) values.route_ids = routeIds
                    if (removalStrategyId != null) values.removal_strategy_id = removalStrategyId
                    if (packagingReserveMethod) values.packaging_reserve_method = packagingReserveMethod
                    if (propertyCostMethod) values.property_cost_method = propertyCostMethod

                    if (isNewCategory) {
                      const resp = await fetch(`${base}/categories/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
                      await resp.json()
                    } else if (editingId) {
                      const resp = await fetch(`${base}/categories/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
                      await resp.json()
                    }
                    await fetchData('categories')
                    setIsModalOpen(false)
                  } catch (e) {
                    console.error('Save category failed', e)
                  }
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: colors.action,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {isNewCategory ? t("Create Category") : t("Save Changes")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
