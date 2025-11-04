"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { API_CONFIG } from "./config/api"
import { Package, Plus, Search, ShoppingCart, ShoppingBag, Box, Hash, Barcode, Route, Building2, X, RefreshCw } from "lucide-react"

interface UIPackaging {
  id: number
  name: string
  productName: string
  packageTypeName: string
  qty: number
  uomName: string
  sales: boolean
  purchase: boolean
  barcode: string
  routesLabel: string
  companyName: string
  raw: any
}

export default function ProductPackagingsPage() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { productPackaging, products, packageTypes, stockRoutes, fetchData } = useData() as any

  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPackaging, setEditingPackaging] = useState<any | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Form state
  const [formData, setFormData] = useState<any>({
    name: "",
    product_id: "",
    package_type_id: "",
    qty: "",
    sales: false,
    purchase: false,
    barcode: "",
    route_ids: [] as string[],
  })

  useEffect(() => {
    if (!Array.isArray(productPackaging) || !productPackaging.length) fetchData('productPackaging')
    if (!Array.isArray(products) || !products.length) fetchData('products')
    if (!Array.isArray(packageTypes) || !packageTypes.length) fetchData('packageTypes')
    if (!Array.isArray(stockRoutes) || !stockRoutes.length) fetchData('stockRoutes')
  }, [productPackaging?.length, products?.length, packageTypes?.length, stockRoutes?.length])

  const uiPackagings: UIPackaging[] = useMemo(() => {
    const routeName = (rt: any) => Array.isArray(rt) ? (rt[1] ?? rt[0]) : (rt?.display_name || rt?.name || rt || "")
    const m2oName = (v: any) => Array.isArray(v) ? (v[1] ?? v[0]) : (v?.display_name || v?.name || v || "")
    return (Array.isArray(productPackaging) ? productPackaging : []).map((p: any) => ({
      id: p.id,
      name: String(p.name || p.packaging || ""),
      productName: m2oName(p.product_id) || m2oName(p.product_tmpl_id),
      packageTypeName: m2oName(p.package_type_id),
      qty: Number(p.qty ?? 0),
      uomName: m2oName(p.product_uom_id) || "",
      sales: !!p.sales,
      purchase: !!p.purchase,
      barcode: String(p.barcode || ""),
      routesLabel: Array.isArray(p.route_ids) ? p.route_ids.map(routeName).slice(0,3).join(", ") : "",
      companyName: m2oName(p.company_id),
      raw: p,
    }))
  }, [productPackaging])

  const filteredPackagings = uiPackagings.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.packageTypeName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPackagings = uiPackagings.length
  const productsWithPackaging = new Set(uiPackagings.map((p) => p.productName)).size
  const salesEnabled = uiPackagings.filter((p) => p.sales).length
  const purchaseEnabled = uiPackagings.filter((p) => p.purchase).length

  const handleAddPackaging = () => {
    setEditingPackaging(null)
    setFormData({ name: "", product_id: "", package_type_id: "", qty: "", sales: false, purchase: false, barcode: "", route_ids: [] })
    setIsModalOpen(true)
  }

  const handleEditPackaging = (ui: UIPackaging) => {
    const raw = ui.raw
    setEditingPackaging(raw)
    setFormData({
      name: String(raw?.name || raw?.packaging || ""),
      product_id: raw?.product_id ? String(Array.isArray(raw.product_id) ? raw.product_id[0] : raw.product_id) : "",
      package_type_id: raw?.package_type_id ? String(Array.isArray(raw.package_type_id) ? raw.package_type_id[0] : raw.package_type_id) : "",
      qty: raw?.qty != null ? String(raw.qty) : "",
      sales: !!raw?.sales,
      purchase: !!raw?.purchase,
      barcode: String(raw?.barcode || ""),
      route_ids: Array.isArray(raw?.route_ids) ? raw.route_ids.map((x:any)=> String(Array.isArray(x)? x[0]: x)).filter(Boolean) : [],
    })
    setIsModalOpen(true)
  }

  const getSessionId = () => localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
  const handleSavePackaging = async () => {
    try {
      const sessionId = getSessionId()
      if (!sessionId) throw new Error('No session ID found')
      const values:any = {}
      if (typeof formData.name === 'string') values.name = formData.name
      if (formData.product_id) values.product_id = Number(formData.product_id)
      if (formData.package_type_id) values.package_type_id = Number(formData.package_type_id)
      if (formData.qty !== '' && !Number.isNaN(Number(formData.qty))) values.qty = Number(formData.qty)
      if (typeof formData.sales === 'boolean') values.sales = !!formData.sales
      if (typeof formData.purchase === 'boolean') values.purchase = !!formData.purchase
      if (typeof formData.barcode === 'string') values.barcode = formData.barcode
      if (Array.isArray(formData.route_ids)) values.route_ids = formData.route_ids.map((x:string)=> Number(x)).filter(Number.isInteger)

      let ok=false
      if (editingPackaging?.id) {
        const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/product-packaging/${editingPackaging.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
        const j = await res.json().catch(async ()=>({ message: await res.text().catch(()=> '') }))
        ok = res.ok && j?.success
      } else {
        const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/product-packaging/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
        const j = await res.json().catch(async ()=>({ message: await res.text().catch(()=> '') }))
        ok = res.ok && (j?.success || j?.id)
      }
      if (ok) {
        await fetchData('productPackaging')
        setIsModalOpen(false)
        setEditingPackaging(null)
      }
    } catch (e) {
      console.error('Save packaging failed', e)
    }
  }

  // no-op: deleting not implemented here; handled via backend if needed

  return (
    <div className="p-8"style={{ minHeight: "100vh", background: colors.background }}>
      <style>
        {`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}
      </style>
      {/* Header */}
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "4px" }}>
            {t("Product Packagings")}
          </h1>
          <p style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Manage product packaging configurations and units")}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={async ()=> { try { setRefreshing(true); await fetchData('productPackaging'); } finally { setRefreshing(false) } }}
            disabled={refreshing}
            title={t('Refresh') as string}
            style={{
                background: colors.card,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                padding: "0.625rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: refreshing ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
          >
            <RefreshCw size={18} style={{ animation: refreshing ? 'spin 0.9s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={handleAddPackaging}
            style={{
              background: colors.action,
              color: "#FFFFFF",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.18)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"
            }}
          >
            <Plus size={20} />
            {t("Add Product Packaging")}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            background: colors.card,
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)"
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
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
              <Package size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.textPrimary }}>{totalPackagings}</div>
              <div style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>{t("Total Packagings")}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: colors.card,
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)"
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
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
              <Box size={18} color="#0A0A0A" />
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.textPrimary }}>{productsWithPackaging}</div>
              <div style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>{t("Products with Packaging")}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: colors.card,
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)"
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: colors.success,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingBag size={18} color="#0A0A0A" />
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.textPrimary }}>{salesEnabled}</div>
              <div style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>{t("Sales Enabled")}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: colors.card,
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)"
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
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
              <ShoppingCart size={18} color="#0A0A0A" />
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.textPrimary }}>{purchaseEnabled}</div>
              <div style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>{t("Purchase Enabled")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ position: "relative", maxWidth: "480px" }}>
          <Search
            size={18}
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: colors.textSecondary }}
          />
          <input
            type="text"
            placeholder={t("Search packagings, products, or types...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 44px",
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.2s ease",
              background: colors.card,
              color: colors.textPrimary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.action
              e.target.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)"
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border
              e.target.style.boxShadow = "none"
            }}
          />
        </div>
      </div>

      {/* Packaging Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
        {filteredPackagings.map((packaging) => (
          <div
            key={packaging.id}
            onClick={() => handleEditPackaging(packaging)}
            style={{
              background: colors.card,
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
              cursor: "pointer",
              transition: "all 0.3s ease",
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
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "2px" }}>
                  {packaging.name}
                </h3>
                <p style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>{packaging.productName}</p>
              </div>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: colors.action,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Package size={16} color="#FFFFFF" />
              </div>
            </div>

            {/* Package Type Badge */}
            <div style={{ marginBottom: "12px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  background: colors.mutedBg,
                  color: colors.textPrimary,
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                <Box size={12} />
                {packaging.packageTypeName}
              </span>
            </div>

            {/* Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: "2px", fontWeight: "500" }}>
                  {t("Contained Quantity")}
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    color: colors.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Hash size={14} color={colors.textSecondary} />
                  {packaging.qty} {packaging.uomName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: "2px", fontWeight: "500" }}>
                  {t("Barcode")}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: colors.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Barcode size={14} color={colors.textSecondary} />
                  {packaging.barcode || t("N/A")}
                </div>
              </div>
            </div>

            {/* Status labels (plain text) */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
              {packaging.sales && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: colors.textPrimary, fontSize: 12, fontWeight: 600 }}>
                  <ShoppingBag size={12} /> {t("Sales")}
                </span>
              )}
              {packaging.purchase && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: colors.textPrimary, fontSize: 12, fontWeight: 600 }}>
                  <ShoppingCart size={12} /> {t("Purchase")}
                </span>
              )}
            </div>

            {/* Footer Info */}
            <div style={{ paddingTop: "8px", borderTop: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: colors.textSecondary }}>
                <Route size={14} />
                {packaging.routesLabel}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: colors.textSecondary }}>
                <Building2 size={14} />
                {packaging.companyName}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
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
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.card,
              borderRadius: "16px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px",
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
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.textPrimary, margin: 0 }}>
                {editingPackaging ? t("Edit Product Packaging") : t("Add Product Packaging")}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.mutedBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <X size={24} color={colors.textPrimary} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                {/* Packaging Name */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    {t("Packaging Name")}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("e.g. Box of 12")}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      background: colors.card,
                      color: colors.textPrimary,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.action
                      e.target.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.border
                      e.target.style.boxShadow = "none"
                    }}
                  />
                </div>

                {/* Product */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    {t("Product")}
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      fontSize: "13px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      background: colors.card,
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="">{t("Select product")}</option>
                    {(Array.isArray(products) ? products : []).map((p:any)=> (
                      <option key={p.id} value={String(p.id)}>{p.display_name || p.name || `#${p.id}`}</option>
                    ))}
                  </select>
                </div>

                {/* Package Type */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    {t("Package Type")}
                  </label>
                  <select
                    value={formData.package_type_id}
                    onChange={(e) => setFormData({ ...formData, package_type_id: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      fontSize: "13px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      background: colors.card,
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="">{t("Select package type")}</option>
                    {(Array.isArray(packageTypes) ? packageTypes : []).map((pt:any)=> (
                      <option key={pt.id} value={String(pt.id)}>{pt.display_name || pt.name || `#${pt.id}`}</option>
                    ))}
                  </select>
                </div>

                {/* Contained Quantity */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    {t("Contained Quantity")}
                  </label>
                  <input
                    type="number"
                    value={String(formData.qty)}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value.replace(/[^0-9.]/g, '') })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      fontSize: "13px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      background: colors.card,
                      color: colors.textPrimary,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.action
                      e.target.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.border
                      e.target.style.boxShadow = "none"
                    }}
                  />
                </div>

                {/* Sales / Purchase */}
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 600, color: colors.textPrimary }}>{t("Flags")}</label>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={!!formData.sales} onChange={(e)=> setFormData({ ...formData, sales: e.target.checked })} />
                      {t('Sale')}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={!!formData.purchase} onChange={(e)=> setFormData({ ...formData, purchase: e.target.checked })} />
                      {t('Purchase')}
                    </label>
                  </div>
                </div>

                {/* Barcode */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    {t("Barcode")}
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder={t("Enter barcode")}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      fontSize: "13px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      background: colors.card,
                      color: colors.textPrimary,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.action
                      e.target.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.border
                      e.target.style.boxShadow = "none"
                    }}
                  />
                </div>

                {/* Routes (multi-select with tags) */}
                <div style={{ position: 'relative' }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    {t("Routes")}
                  </label>
                  {/* dropdown is toggled by mutating sibling menu display (no extra state) */}
                  {/* Controlled block without hooks: emulate open with component state via closure */}
                  <div
                    onClick={(e) => {
                      const menu = (e.currentTarget.nextSibling as HTMLElement)
                      if (menu && menu.dataset.menu === 'routes') {
                        const v = menu.getAttribute('data-open') === 'true'
                        menu.setAttribute('data-open', (!v).toString())
                        menu.style.display = v ? 'none' : 'block'
                      }
                    }}
                    style={{
                      width: '100%',
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      minHeight: 42,
                      padding: '6px 8px',
                      background: colors.card,
                      color: colors.textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      cursor: 'pointer'
                    }}
                  >
                    {(() => {
                      const selected = new Set(formData.route_ids || [])
                      const items = (Array.isArray(stockRoutes) ? stockRoutes : []).filter((rt:any)=> selected.has(String(rt.id)))
                      if (!items.length) return <span style={{ color: colors.textSecondary, fontSize: 13 }}>{t('Select routes')}</span>
                      return items.map((rt:any) => (
                        <span key={rt.id} style={{ display:'inline-flex', alignItems:'center', gap:6, border:`1px solid ${colors.border}`, borderRadius: 999, padding:'2px 8px', fontSize:12 }} onClick={(e)=> e.stopPropagation()}>
                          {rt.display_name || rt.name || `#${rt.id}`}
                          <button
                            onClick={(e)=> {
                              e.stopPropagation()
                              const next = (formData.route_ids || []).filter((id:string)=> id !== String(rt.id))
                              setFormData({ ...formData, route_ids: next })
                            }}
                            style={{ border:'none', background:'transparent', cursor:'pointer', color: colors.textSecondary }}
                            aria-label={t('Remove') as string}
                          >×</button>
                        </span>
                      ))
                    })()}
                  </div>
                  <div
                    data-menu="routes"
                    data-open="false"
                    style={{
                      display: 'none',
                      position: 'absolute',
                      zIndex: 10,
                      marginTop: 4,
                      width: '100%',
                      maxHeight: 220,
                      overflow: 'auto',
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }}
                  >
                    {(Array.isArray(stockRoutes) ? stockRoutes : []).map((rt:any)=> {
                      const checked = (formData.route_ids || []).includes(String(rt.id))
                      return (
                        <label key={rt.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', cursor:'pointer', borderBottom:`1px solid ${colors.border}` }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e)=> {
                              const id = String(rt.id)
                              const set = new Set(formData.route_ids || [])
                              if (e.target.checked) set.add(id); else set.delete(id)
                              setFormData({ ...formData, route_ids: Array.from(set) })
                            }}
                          />
                          <span style={{ fontSize: 13, color: colors.textPrimary }}>{rt.display_name || rt.name || `#${rt.id}`}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Checkboxes */}
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: "24px", marginTop: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.sales}
                      onChange={(e) => setFormData({ ...formData, sales: e.target.checked })}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "15px", fontWeight: "600", color: colors.pillSuccessText, backgroundColor: colors.pillSuccessBg, padding: "4px 8px", borderRadius: "4px" }}>{t("Sales")}</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.purchase}
                      onChange={(e) => setFormData({ ...formData, purchase: e.target.checked })}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "15px", fontWeight: "600", color: colors.pillInfoText, backgroundColor: colors.pillInfoBg, padding: "4px 8px", borderRadius: "4px" }}>{t("Purchase")}</span>
                  </label>
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
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: `2px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.textSecondary,
                  borderRadius: "0.5rem",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleSavePackaging}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  background: colors.action,
                  color: "#FFFFFF",
                  borderRadius: "0.5rem",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {editingPackaging ? t("Save Changes") : t("Create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
