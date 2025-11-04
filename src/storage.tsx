"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { API_CONFIG } from "./config/api"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin,  Plus, Search, Package, ListChecks, Shuffle, Warehouse } from "lucide-react"
import { StatCard } from "./components/StatCard"
import { StorageCategoryCard } from "./components/StorageCategoryCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function StorageCategoriesPage() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { storageCategories, stockRoutes, packageTypes, products, uom, fetchData } = useData() as any
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [capacityTab, setCapacityTab] = useState<"package" | "product">("package")
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState<any>({
    name: "",
    allow_new_product: "mixed" as "empty" | "same" | "mixed",
    max_weight: "" as string | number,
    packageLines: [] as Array<{ tempId: string; package_type_id: string; quantity: string }>,
    productLines: [] as Array<{ tempId: string; product_id: string; product_uom_id: string; quantity: string }>,
  })

  const genId = () => Math.random().toString(36).slice(2, 9)

  const getSessionId = () => localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')

  // Derive UI list with field keys to inspect what's available
  const categories = useMemo(() => {
    const list = Array.isArray(storageCategories) ? storageCategories : []
    return list.map((r: any) => ({
      id: r.id,
      title: r.display_name || r.name || `Category #${r.id}`,
      keys: Object.keys(r || {}).sort(),
      raw: r,
    }))
  }, [storageCategories])

  const filteredCategories = categories.filter((category) =>
    String(category.title || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Stats for summary cards
  const totalCategories = categories.length
  const totalLocations = useMemo(() => categories.reduce((sum, c) => sum + (Array.isArray(c.raw?.location_ids) ? c.raw.location_ids.length : 0), 0), [categories]);
  const totalCapacityRules = useMemo(() => categories.reduce((sum, c) => sum + (Array.isArray(c.raw?.package_capacity_ids) ? c.raw.package_capacity_ids.length : 0) + (Array.isArray(c.raw?.product_capacity_ids) ? c.raw.product_capacity_ids.length : 0), 0), [categories]);
  const mixedPolicyCount = useMemo(() => categories.filter(c => c.raw?.allow_new_product === 'mixed').length, [categories]);


  const openModal = (category: any = null) => {
    const raw = category?.raw || category || null
    setSelectedCategory(raw)
    setCapacityTab("package")
    // Prepopulate form
    const allowSel: any = (raw?.allow_new_product || raw?.allow_new_products || "mixed")
    setForm({
      name: String(raw?.name || ""),
      allow_new_product: ["empty","same","mixed"].includes(String(allowSel)) ? String(allowSel) : "mixed",
      max_weight: raw?.max_weight ?? raw?.max_weight_kg ?? "",
      // We typically only get one2many ids back; initialize empty editable lines
      packageLines: [],
      productLines: [],
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedCategory(null)
    setForm({ name: "", allow_new_product: "mixed", max_weight: "", packageLines: [], productLines: [] })
  }

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
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
      
      <div className="mx-auto max-w-[1600px] space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t("Storage Categories")}
            </h1>
            <p className="mt-2 text-lg" style={{ color: colors.textSecondary }}>
              {t("Organize and manage warehouse storage capacities")}
            </p>
          </div>
          <Button
            className="text-white transition-all shadow-lg hover:shadow-xl h-11 px-6"
            style={{ background: colors.action }}
            onClick={() => openModal()}
          >
            <Plus className="mr-2 h-5 w-5" />
            {t("Add Storage Category")}
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                label={t("Total Categories")}
                value={totalCategories}
                icon={Warehouse}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                delay={0}
            />
            <StatCard
                label={t("Total Locations Managed")}
                value={totalLocations}
                icon={MapPin}
                gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                delay={1}
            />
            <StatCard
                label={t("Total Capacity Rules")}
                value={totalCapacityRules}
                icon={ListChecks}
                gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                delay={2}
            />
            <StatCard
                label={t("Mixed Product Policies")}
                value={mixedPolicyCount}
                icon={Shuffle}
                gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                delay={3}
            />
        </div>

        {/* Search and Filter */}
         <Card className="border-none shadow-lg" style={{ background: colors.card }}>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="relative flex-1 min-w-[280px]">
                <Search
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors"
                  style={{ color: colors.textSecondary }}
                />
                <Input
                  placeholder={t("Search by category name...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-11 text-base transition-all focus:ring-2"
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

        {/* Storage Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((category, index) => (
                <StorageCategoryCard
                    key={category.id}
                    category={category}
                    index={index}
                    onClick={() => openModal(category)}
                />
            ))}
        </div>
        
        {filteredCategories.length === 0 && (
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
              <Package size={28} color={colors.action} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
              {t("No categories found")}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
              {t("Try adjusting your search term")}
            </p>
          </div>
        )}
      </div>


      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "1rem",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "90vh",
              display: 'flex',
              flexDirection: 'column',
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.5rem",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: colors.textPrimary, margin: 0 }}>
                {selectedCategory ? t("Edit Storage Category") : t("New Storage Category")}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: colors.textSecondary,
                  padding: "0.25rem",
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem 2rem", overflowY: 'auto', flexGrow: 1 }}>
              {/* Storage Category Name */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: "0.5rem",
                  }}
                >
                  {t("Storage Category")}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
                  placeholder={t("Enter category name")}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "0.5rem",
                    fontSize: "1rem",
                    outline: "none",
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                />
              </div>

              {/* Two Column Layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                {/* Allow New Product */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {t('Allow New product')}
                  </label>
                  <select
                    value={form.allow_new_product}
                    onChange={(e) => setForm((f: any) => ({ ...f, allow_new_product: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: `2px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      outline: "none",
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                  >
                    <option value="empty">{t('If the location is empty')}</option>
                    <option value="same">{t('If all products are same')}</option>
                    <option value="mixed">{t('Allow mixed products')}</option>
                  </select>
                </div>

                {/* Max Weight */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {t('Max Weight')}
                  </label>
                  <input
                    type="number"
                    value={String(form.max_weight)}
                    onChange={(e) => setForm((f: any) => ({ ...f, max_weight: e.target.value }))}
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: `2px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      outline: "none",
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                  />
                </div>
              </div>

              {/* Routes */}
              <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {t('Routes')}
                  </label>
                  <select
                    defaultValue={Array.isArray(selectedCategory?.route_id) ? String(selectedCategory.route_id[0]) : ''}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: `2px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      outline: "none",
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                  >
                    <option value="">{t('Select route')}</option>
                    {(Array.isArray(stockRoutes) ? stockRoutes : []).map((r: any) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.display_name || r.name || `Route #${r.id}`}
                      </option>
                    ))}
                  </select>
              </div>
              {/* Capacity Tabs */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                  <button
                    onClick={() => setCapacityTab("package")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: capacityTab === "package" ? colors.action : "transparent",
                      color: capacityTab === "package" ? "#FFFFFF" : colors.textSecondary,
                      border: `2px solid ${capacityTab === "package" ? colors.action : colors.border}`,
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                  >
                    {t("Capacity by Package")}
                  </button>
                  <button
                    onClick={() => setCapacityTab("product")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: capacityTab === "product" ? colors.action : "transparent",
                      color: capacityTab === "product" ? "#FFFFFF" : colors.textSecondary,
                      border: `2px solid ${capacityTab === "product" ? colors.action : colors.border}`,
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                  >
                    {t("Capacity by Product")}
                  </button>
                </div>

                {/* Capacity Table */}
                <div
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                  }}
                >
                  {/* Table Header */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: capacityTab === 'package' ? "1fr 150px 50px" : "2fr 1fr 120px 50px",
                      padding: "0.75rem 1rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      fontSize: "0.875rem",
                      borderBottom: `1px solid ${colors.border}`
                    }}
                  >
                    <div>{capacityTab === "package" ? t("Package Type") : t("Product")}</div>
                    {capacityTab === 'product' && <div>{t('Unit of measure')}</div>}
                    <div>{t("Quantity")}</div>
                    <div></div>
                  </div>

                  {/* Table Rows */}
                  {(capacityTab === 'package' ? form.packageLines : form.productLines).length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: colors.textSecondary }}>{t('No capacity rules added.')}</div>
                  )}

                  {capacityTab === 'package' && form.packageLines.map((line: any,) => (
                    <div key={line.tempId} style={{ display: 'grid', gridTemplateColumns: "1fr 150px 50px", padding: '0.75rem', borderTop: `1px solid ${colors.border}`, alignItems: 'center', gap: '0.5rem' }}>
                      <select
                        value={line.package_type_id}
                        onChange={(e) => {
                          const v = e.target.value
                          setForm((f: any) => ({ ...f, packageLines: f.packageLines.map((l: any) => l.tempId === line.tempId ? { ...l, package_type_id: v } : l) }))
                        }}
                        style={{ padding: '0.5rem', border: `1px solid ${colors.border}`, borderRadius: '0.375rem', background: colors.background, color: colors.textPrimary }}
                      >
                        <option value="">{t('Select type')}</option>
                        {(Array.isArray(packageTypes) ? packageTypes : []).map((pt: any) => (
                          <option key={pt.id} value={String(pt.id)}>{pt.name || pt.display_name || `#${pt.id}`}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => setForm((f: any) => ({ ...f, packageLines: f.packageLines.map((l: any) => l.tempId === line.tempId ? { ...l, quantity: e.target.value } : l) }))}
                        style={{ padding: '0.5rem', border: `1px solid ${colors.border}`, borderRadius: '0.375rem', background: colors.background, color: colors.textPrimary }}
                      />
                      <button onClick={() => setForm((f: any) => ({ ...f, packageLines: f.packageLines.filter((l: any) => l.tempId !== line.tempId) }))} style={{ background: 'none', border: 'none', color: colors.cancel, cursor: 'pointer', fontSize: '1.25rem' }}>🗑</button>
                    </div>
                  ))}

                  {capacityTab === 'product' && form.productLines.map((line: any) => {
                    const prod = (Array.isArray(products) ? products : []).find((p: any) => String(Array.isArray(p.id)? p.id[0]: p.id) === line.product_id)
                    const uomId = Array.isArray(prod?.uom_id) ? String(prod.uom_id[0]) : (prod?.uom_id ? String(prod.uom_id) : '')
                    const uomName = Array.isArray(prod?.uom_id) ? (prod.uom_id[1] || '') : ((Array.isArray(uom) ? uom : []).find((u: any) => String(u.id) === uomId)?.name || '')
                    return (
                      <div key={line.tempId} style={{ display: 'grid', gridTemplateColumns: "2fr 1fr 120px 50px", padding: '0.75rem', borderTop: `1px solid ${colors.border}`, alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={line.product_id}
                          onChange={(e) => {
                            const v = e.target.value
                            const np = (Array.isArray(products) ? products : []).find((p: any) => String(Array.isArray(p.id)? p.id[0]: p.id) === v)
                            const nuomId = Array.isArray(np?.uom_id) ? String(np.uom_id[0]) : (np?.uom_id ? String(np.uom_id) : '')
                            setForm((f: any) => ({ ...f, productLines: f.productLines.map((l: any) => l.tempId === line.tempId ? { ...l, product_id: v, product_uom_id: nuomId } : l) }))
                          }}
                          style={{ padding: '0.5rem', border: `1px solid ${colors.border}`, borderRadius: '0.375rem', background: colors.background, color: colors.textPrimary }}
                        >
                          <option value="">{t('Select product')}</option>
                          {(Array.isArray(products) ? products : []).map((p: any) => (
                            <option key={p.id} value={String(Array.isArray(p.id)? p.id[0]: p.id)}>{p.display_name || p.name || `#${Array.isArray(p.id)? p.id[0]: p.id}`}</option>
                          ))}
                        </select>
                        <div style={{ fontSize: '0.875rem', color: colors.textSecondary, padding: '0 0.5rem' }}>{uomName || '-'}</div>
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => setForm((f: any) => ({ ...f, productLines: f.productLines.map((l: any) => l.tempId === line.tempId ? { ...l, quantity: e.target.value } : l) }))}
                          style={{ padding: '0.5rem', border: `1px solid ${colors.border}`, borderRadius: '0.375rem', background: colors.background, color: colors.textPrimary }}
                        />
                        <button onClick={() => setForm((f: any) => ({ ...f, productLines: f.productLines.filter((l: any) => l.tempId !== line.tempId) }))} style={{ background: 'none', border: 'none', color: colors.cancel, cursor: 'pointer', fontSize: '1.25rem' }}>🗑</button>
                      </div>
                    )
                  })}

                  {/* Add Line */}
                  <div style={{ padding: "0.75rem", borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        if (capacityTab === 'package') {
                          setForm((f: any) => ({ ...f, packageLines: [...f.packageLines, { tempId: genId(), package_type_id: '', quantity: '' }] }))
                        } else {
                          setForm((f: any) => ({ ...f, productLines: [...f.productLines, { tempId: genId(), product_id: '', product_uom_id: '', quantity: '' }] }))
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: colors.action, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}
                    >
                      + {t("Add line")}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "1.5rem",
                borderTop: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                flexShrink: 0,
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: 'transparent',
                  color: colors.textSecondary,
                  border: `2px solid ${colors.border}`,
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {t("Cancel")}
              </button>
              <button
                disabled={saving || !form.name}
                onClick={async () => {
                  try {
                    setSaving(true)
                    const sessionId = getSessionId()
                    if (!sessionId) throw new Error('No session ID found')
                    const values: any = {
                      name: form.name,
                      allow_new_product: form.allow_new_product,
                    }
                    if (form.max_weight !== '' && !Number.isNaN(Number(form.max_weight))) values.max_weight = Number(form.max_weight)
                    const pkgCmds = (form.packageLines || []).filter((l: any) => l.package_type_id && l.quantity !== '').map((l: any) => [0, 0, { package_type_id: Number(l.package_type_id), quantity: Number(l.quantity) }])
                    if (pkgCmds.length) values.package_capacity_ids = pkgCmds
                    const prodCmds = (form.productLines || []).filter((l: any) => l.product_id && l.quantity !== '').map((l: any) => [0, 0, { product_id: Number(l.product_id), product_uom_id: l.product_uom_id ? Number(l.product_uom_id) : undefined, quantity: Number(l.quantity) }])
                    if (prodCmds.length) values.product_capacity_ids = prodCmds

                    let ok = false
                    if (selectedCategory?.id) {
                      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/storage-categories/${selectedCategory.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
                      const j = await res.json().catch(() => ({}))
                      ok = res.ok && j?.success
                    } else {
                      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/storage-categories/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
                      const j = await res.json().catch(() => ({}))
                      ok = res.ok && (j?.success || j?.id)
                    }
                    if (ok) {
                      await fetchData('storageCategories')
                      closeModal()
                    }
                  } catch (e) {
                    console.error('Save storage category failed', e)
                  } finally {
                    setSaving(false)
                  }
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: colors.action,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving || !form.name ? 0.7 : 1,
                }}
              >
                {selectedCategory ? t("Save Changes") : t("Create Category")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
