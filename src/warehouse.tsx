"use client"

import { useMemo, useState } from "react"
import { useTheme } from "../context/theme"
import { useTranslation } from "react-i18next"
import { Warehouse, Package, TrendingUp, MapPin, Search, Plus, DollarSign, Box } from "lucide-react"
import { useData } from "../context/data"
import { useAuth } from "../context/auth"
import { API_CONFIG } from "./config/api"
import Toast from "./components/Toast"
import { CustomDropdown } from "./components/NewCustomDropdown"
import { CustomInput } from "./components/CusotmInput"

// Build warehouses dataset from DataContext (Odoo stock.warehouse)
// Note: Some UI fields (items, value, capacity, contacts) may not exist in stock.warehouse.
// We provide safe defaults so the UI remains functional.

export default function WarehousesPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()
  const { warehouses, quants, products, locations, fetchData } = useData() as any
  const { sessionId } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<any | null>(null)
  const [saveError, setSaveError] = useState<string>("")
  const [toast, setToast] = useState<{ text: string; state?: 'success' | 'error' } | null>(null)

  const warehousesData = useMemo(() => {
    // Precompute totals per warehouse from quants (stock.quant)
    // Build product price map from products (prefer standard_price, fallback list_price)
    const priceByProduct: Record<string | number, number> = {}
    for (const p of products || []) {
      const id = p.id
      const std = typeof p.standard_price === "number" ? p.standard_price : undefined
      const lst =
        typeof p.list_price === "number" ? p.list_price : typeof p.lst_price === "number" ? p.lst_price : undefined
      const price = std ?? lst ?? 0
      if (id != null) priceByProduct[id] = price
    }
    const sumByWarehouse: Record<string | number, { items: number; value: number }> = {}
    const getWhKey = (w: any) => w.id ?? w.code ?? w.name
    const getLocationNamesForWarehouse = (w: any) => {
      const names: string[] = []
      if (w.code) names.push(String(w.code))
      const lotName = w.lot_stock_id?.[1]
      if (lotName) names.push(String(lotName))
      const viewName = w.view_location_id?.[1]
      if (viewName) names.push(String(viewName))
      return names
    }
    // Build quick matcher list for each warehouse
    const matchers = (warehouses || []).map((w: any) => ({
      key: getWhKey(w),
      names: getLocationNamesForWarehouse(w),
    }))
    // Aggregate quants into warehouses by fuzzy matching location name
    for (const q of quants || []) {
      const locName: string = q.location_id?.[1] || ""
      if (!locName) continue
      for (const m of matchers) {
        if (m.names.some((n: string) => locName.includes(n))) {
          const prev = sumByWarehouse[m.key] || { items: 0, value: 0 }
          const qty = typeof q.quantity === "number" ? q.quantity : q.qty || 0
          const invValRaw =
            typeof q.inventory_value === "number"
              ? q.inventory_value
              : typeof q.value === "number"
                ? q.value
                : undefined
          const prodId = q.product_id?.[0]
          const price = prodId != null ? (priceByProduct[prodId] ?? 0) : 0
          const computedVal = invValRaw != null ? invValRaw : qty * price
          const invVal = isFinite(computedVal) ? computedVal : 0
          sumByWarehouse[m.key] = { items: prev.items + qty, value: prev.value + invVal }
          break
        }
      }
    }

    return (warehouses || []).map((w: any, idx: number) => {
      const id = w.id ?? idx
      const name = w.code || w.name || ""
      const fullName = w.name || w.code || ""
      // Address info might be on related partner; fallback to empty strings
      const partnerName = w.partner_id?.[1] || ""
      const address = partnerName
      const city = ""
      const country = ""
      // Pull totals from quants aggregation if available
      const totals = sumByWarehouse[getWhKey(w)] || { items: 0, value: 0 }
      const items = totals.items
      const value = totals.value
      const capacity = 0
      const status = w.active === false ? "inactive" : "active"
      const manager = ""
      const phone = ""
      const email = ""
      return { id, name, fullName, address, city, country, items, value, capacity, status, manager, phone, email }
    })
  }, [warehouses, quants, products])

  const totalWarehouses = warehousesData.length
  const totalCapacity = warehousesData.reduce((sum: number, wh: any) => sum + (wh.capacity || 0), 0)
  const totalItems = warehousesData.reduce((sum: number, wh: any) => sum + (wh.items || 0), 0)
  const avgUtilization = totalCapacity > 0 ? (totalItems / totalCapacity) * 100 : 0

  const filteredWarehouses = warehousesData.filter(
    (wh: any) =>
      wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wh.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wh.city || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: "2rem",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2.25rem",
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            {t("Warehouses")}
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: "1rem", letterSpacing: "-0.01em" }}>
            {t("Manage your warehouse locations and facilities")}
          </p>
        </div>

        <button
          onClick={() => {
            if (!locations || locations.length === 0) fetchData('locations')
            setForm({
              id: null,
              name: '',
              code: '',
              view_location_id: null,
              reception_steps: 'one_step',
              delivery_steps: 'ship_only',
              buy_to_resupply: false,
              subcontracting_dropshipping_to_resupply: false,
              subcontracting_to_resupply: false,
              manufacture_to_resupply: false,
              manufacture_steps: 'mrp_one_step',
            })
            setIsModalOpen(true)
          }}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "0.75rem",
            background: colors.action,
            color: "#FFFFFF",
            border: "none",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)"
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"
          }}
        >
          <Plus size={18} />
          {t("Add Warehouse")}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        {[
          {
            label: t("Total Warehouses"),
            value: totalWarehouses,
            icon: Warehouse,
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          },
          {
            label: t("Total Capacity"),
            value: totalCapacity.toLocaleString(),
            icon: Box,
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          },
          {
            label: t("Total Items"),
            value: totalItems.toLocaleString(),
            icon: Package,
            gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          },
          {
            label: t("Avg Utilization"),
            value: `${avgUtilization.toFixed(1)}%`,
            icon: TrendingUp,
            gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          },
        ].map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div
              key={index}
              style={{
                background: colors.card,
                borderRadius: "1rem",
                padding: "1.75rem",
                border: `1px solid ${colors.border}`,
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              {/* Gradient background overlay */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "120px",
                  height: "120px",
                  background: stat.gradient,
                  opacity: 0.1,
                  borderRadius: "50%",
                  transform: "translate(30%, -30%)",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "3.5rem",
                      height: "3.5rem",
                      borderRadius: "0.875rem",
                      background: stat.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    <IconComponent size={24} color="#FFFFFF" strokeWidth={2} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: colors.textSecondary,
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{ fontSize: "2rem", fontWeight: "700", color: colors.textPrimary, letterSpacing: "-0.02em" }}
                >
                  {stat.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ position: "relative", maxWidth: "600px" }}>
          <Search
            size={20}
            style={{
              position: "absolute",
              [isRTL ? "right" : "left"]: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.textSecondary,
              pointerEvents: "none",
            }}
          />
          <div style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: '2.5rem' as any }}>
            <CustomInput
              label={""}
              type="text"
              value={searchTerm}
              onChange={(v) => setSearchTerm(v)}
              placeholder={t("Search warehouses by name, code, or city...")}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {filteredWarehouses.map((warehouse: any) => {
          const utilization = warehouse.capacity > 0 ? ((warehouse.items / warehouse.capacity) * 100).toFixed(1) : "0.0"

          return (
            <div
              key={warehouse.id}
              style={{
                background: colors.card,
                borderRadius: "1rem",
                padding: "1.75rem",
                border: `1px solid ${colors.border}`,
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
              onClick={() => {
                const raw = (warehouses || []).find((w: any) => w.id === warehouse.id)
                if (raw) {
                  if (!locations || locations.length === 0) fetchData('locations')
                  setForm({
                    id: raw.id,
                    name: raw.name || '',
                    code: raw.code || '',
                    view_location_id: Array.isArray(raw.view_location_id) ? raw.view_location_id[0] : (raw.view_location_id || null),
                    reception_steps: raw.reception_steps || 'one_step',
                    delivery_steps: raw.delivery_steps || 'ship_only',
                    buy_to_resupply: !!raw.buy_to_resupply,
                    subcontracting_dropshipping_to_resupply: !!raw.subcontracting_dropshipping_to_resupply,
                    subcontracting_to_resupply: !!raw.subcontracting_to_resupply,
                    manufacture_to_resupply: !!raw.manufacture_to_resupply,
                    manufacture_steps: raw.manufacture_steps || 'mrp_one_step',
                  })
                  setIsModalOpen(true)
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)"
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1)"
                e.currentTarget.style.borderColor = colors.action
                const gradient = e.currentTarget.querySelector("[data-gradient]") as HTMLElement
                if (gradient) gradient.style.opacity = "1"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"
                e.currentTarget.style.borderColor = colors.border
                const gradient = e.currentTarget.querySelector("[data-gradient]") as HTMLElement
                if (gradient) gradient.style.opacity = "0"
              }}
            >
              {/* Gradient accent on hover */}
              <div
                data-gradient
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "4px",
                  background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                  opacity: 0,
                  transition: "opacity 0.3s ease",
                }}
              />

              {/* Header */}
              <div style={{ display: "flex", alignItems: "start", gap: "1rem", marginBottom: "1.5rem" }}>
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "0.875rem",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                  }}
                >
                  <Warehouse size={28} color="#FFFFFF" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "700",
                        color: colors.textPrimary,
                        margin: 0,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {warehouse.fullName}
                    </h3>
                    <span
                      style={{
                        padding: "0.25rem 0.625rem",
                        borderRadius: "0.375rem",
                        background: warehouse.status === "active" ? `${colors.action}15` : colors.mutedBg,
                        color: warehouse.status === "active" ? colors.action : colors.textSecondary,
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {t(warehouse.status === "active" ? "Active" : "Inactive")}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.8rem", color: colors.textSecondary }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <MapPin size={14} />
                      <span>{warehouse.address}</span>
                    </div>
                    <span>•</span>
                    <span>{t('Code')}: {((warehouses || []).find((w: any) => w.id === warehouse.id)?.code) || '-'}</span>
                    <span>•</span>
                    <span>{t('Company')}: {Array.isArray(((warehouses || []).find((w: any) => w.id === warehouse.id)?.company_id)) ? ((warehouses || []).find((w: any) => w.id === warehouse.id)?.company_id[1]) : ''}</span>
                    <span>•</span>
                    <span>{t('Main Location')}: {Array.isArray(((warehouses || []).find((w: any) => w.id === warehouse.id)?.lot_stock_id)) ? ((warehouses || []).find((w: any) => w.id === warehouse.id)?.lot_stock_id[1]) : ''}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", fontSize: "0.8rem", color: colors.textSecondary }}>
                <span>{t('Incoming')}: {(() => {
                  const raw = (warehouses || []).find((w: any) => w.id === warehouse.id)
                  const v = raw?.reception_steps || 'one_step'
                  return v === 'one_step' ? t('Receive and Store (1 step)') : v === 'two_steps' ? t('Receive then Store (2 steps)') : t('Receive, Quality Control, then Store (3 steps)')
                })()}</span>
                <span>•</span>
                <span>{t('Outgoing')}: {(() => {
                  const raw = (warehouses || []).find((w: any) => w.id === warehouse.id)
                  const v = raw?.delivery_steps || 'ship_only'
                  return v === 'ship_only' ? t('Deliver (1 step)') : v === 'pick_ship' ? t('Pick then Deliver (2 steps)') : t('Pick, Pack, then Deliver (3 steps)')
                })()}</span>
              </div>

              {/* Stats Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                  padding: "1.25rem",
                  background: `${colors.action}08`,
                  borderRadius: "0.75rem",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: colors.textSecondary,
                      marginBottom: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontWeight: "500",
                    }}
                  >
                    <Package size={14} color={colors.action} />
                    {t("Items")}
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "700",
                      color: colors.textPrimary,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {warehouse.items.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: colors.textSecondary,
                      marginBottom: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontWeight: "500",
                    }}
                  >
                    <Box size={14} color={colors.action} />
                    {t("Capacity")}
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "700",
                      color: colors.textPrimary,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {warehouse.capacity.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: colors.textSecondary,
                      marginBottom: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontWeight: "500",
                    }}
                  >
                    <DollarSign size={14} color={colors.action} />
                    {t("Value")}
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "700",
                      color: colors.textPrimary,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {(warehouse.value / 1000).toFixed(0)}K LE
                  </div>
                </div>
              </div>

              {/* Utilization Bar */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    marginBottom: "0.625rem",
                  }}
                >
                  <span style={{ color: colors.textSecondary, fontWeight: "500" }}>{t("Capacity Utilization")}</span>
                  <span style={{ color: colors.textPrimary, fontWeight: "700" }}>{utilization}%</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "0.5rem",
                    background: colors.border,
                    borderRadius: "9999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${utilization}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: "9999px",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "0.625rem",
                    border: "none",
                    background: colors.action,
                    color: "#FFFFFF",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)"
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  {t("View Details")}
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "0.625rem",
                    border: `1px solid ${colors.border}`,
                    background: colors.card,
                    color: colors.textSecondary,
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    const raw = (warehouses || []).find((w: any) => w.id === warehouse.id)
                    if (raw) {
                      if (!locations || locations.length === 0) fetchData('locations')
                      setForm({
                        id: raw.id,
                        name: raw.name || '',
                        code: raw.code || '',
                        view_location_id: Array.isArray(raw.view_location_id) ? raw.view_location_id[0] : (raw.view_location_id || null),
                        reception_steps: raw.reception_steps || 'one_step',
                        delivery_steps: raw.delivery_steps || 'ship_only',
                        buy_to_resupply: !!raw.buy_to_resupply,
                        subcontracting_dropshipping_to_resupply: !!raw.subcontracting_dropshipping_to_resupply,
                        subcontracting_to_resupply: !!raw.subcontracting_to_resupply,
                        manufacture_to_resupply: !!raw.manufacture_to_resupply,
                        manufacture_steps: raw.manufacture_steps || 'mrp_one_step',
                      })
                      setIsModalOpen(true)
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.mutedBg
                    e.currentTarget.style.borderColor = colors.action
                    e.currentTarget.style.color = colors.action
                    e.currentTarget.style.transform = "translateY(-1px)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.card
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.color = colors.textSecondary
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  {t("Edit")}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredWarehouses.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: colors.card,
            borderRadius: "1rem",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: `${colors.action}15`,
              marginBottom: "1.5rem",
            }}
          >
            <Search size={40} color={colors.action} strokeWidth={1.5} />
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: "0.5rem",
              letterSpacing: "-0.01em",
            }}
          >
            {t("No warehouses found")}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: "1rem" }}>{t("Try adjusting your search criteria")}</div>
        </div>
      )}

      {isModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{ background: colors.card, borderRadius: "1rem", border: `1px solid ${colors.border}`, width: "100%", maxWidth: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary }}>{form?.id ? t('Edit Warehouse') : t('Add Warehouse')}</div>
                <div style={{ fontSize: "0.8125rem", color: colors.textSecondary }}>{t('Configure key operations and details')}</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ border: `1px solid ${colors.border}`, background: colors.card, color: colors.textSecondary, borderRadius: 8, padding: "0.5rem 0.75rem" }}>✕</button>
            </div>
            <div style={{ padding: "0 1.5rem 1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <CustomInput
                  label={t('Warehouse name')}
                  type="text"
                  value={form?.name || ''}
                  onChange={(v) => setForm((p: any) => ({ ...p, name: v }))}
                  placeholder={t('Enter name')}
                />
              </div>
              <div>
                <CustomInput
                  label={t('Short name')}
                  type="text"
                  value={form?.code || ''}
                  onChange={(v) => setForm((p: any) => ({ ...p, code: v }))}
                  placeholder={t('Enter code')}
                />
              </div>
              <div>
                {(() => {
                  const locOptions: { id: number; label: string }[] = (locations || []).map((lc: any) => ({
                    id: lc.id as number,
                    label: lc.complete_name || lc.display_name || lc.name || `#${lc.id}`,
                  }))
                  const currentId = form?.view_location_id || ''
                  const currentLabel = locOptions.find(o => o.id === currentId)?.label || ''
                  return (
                    <CustomDropdown
                      label={t('Address')}
                      values={[t('Select'), ...locOptions.map(o => o.label)]}
                      type="single"
                      defaultValue={currentLabel || t('Select')}
                      onChange={(val) => {
                        if (val === t('Select')) { setForm((p: any) => ({ ...p, view_location_id: null })); return }
                        const sel = locOptions.find(o => o.label === val)
                        setForm((p: any) => ({ ...p, view_location_id: sel ? sel.id : null }))
                      }}
                      placeholder={t('Select')}
                    />
                  )
                })()}
              </div>
              <div>
                {(() => {
                  const inboundOptions = [
                    { code: 'one_step', label: t('Receive and Store (1 step)') },
                    { code: 'two_steps', label: t('Receive then Store (2 steps)') },
                    { code: 'three_steps', label: t('Receive, Quality Control, then Store (3 steps)') },
                  ] as const
                  const currentCode = form?.reception_steps || 'one_step'
                  const currentLabel = inboundOptions.find(o => o.code === currentCode)?.label || inboundOptions[0].label
                  return (
                    <CustomDropdown
                      label={t('Incoming shipments')}
                      values={inboundOptions.map(o => o.label)}
                      type="single"
                      defaultValue={currentLabel}
                      onChange={(val) => {
                        const selected = inboundOptions.find(o => o.label === val)
                        setForm((p: any) => ({ ...p, reception_steps: selected?.code || 'one_step' }))
                      }}
                      placeholder={t('Select')}
                    />
                  )
                })()}
              </div>
              <div>
                {(() => {
                  const outboundOptions = [
                    { code: 'ship_only', label: t('Deliver (1 step)') },
                    { code: 'pick_ship', label: t('Pick then Deliver (2 steps)') },
                    { code: 'pick_pack_ship', label: t('Pick, Pack, then Deliver (3 steps)') },
                  ] as const
                  const cur = form?.delivery_steps || 'ship_only'
                  const curLabel = outboundOptions.find(o => o.code === cur)?.label || outboundOptions[0].label
                  return (
                    <CustomDropdown
                      label={t('Outgoing Shipments')}
                      values={outboundOptions.map(o => o.label)}
                      type="single"
                      defaultValue={curLabel}
                      onChange={(val) => {
                        const sel = outboundOptions.find(o => o.label === val)
                        setForm((p: any) => ({ ...p, delivery_steps: sel?.code || 'ship_only' }))
                      }}
                      placeholder={t('Select')}
                    />
                  )
                })()}
              </div>
              <div style={{ gridColumn: "1 / -1", display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textSecondary, fontWeight: 600 }}>
                  <input type="checkbox" checked={!!form?.buy_to_resupply} onChange={(e) => setForm((p: any) => ({ ...p, buy_to_resupply: e.target.checked }))} />
                  {t('Buy to Resupply')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textSecondary, fontWeight: 600 }}>
                  <input type="checkbox" checked={!!form?.subcontracting_dropshipping_to_resupply} onChange={(e) => setForm((p: any) => ({ ...p, subcontracting_dropshipping_to_resupply: e.target.checked }))} />
                  {t('Dropship Subcontractors')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textSecondary, fontWeight: 600 }}>
                  <input type="checkbox" checked={!!form?.subcontracting_to_resupply} onChange={(e) => setForm((p: any) => ({ ...p, subcontracting_to_resupply: e.target.checked }))} />
                  {t('Resupply Subcontractors')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textSecondary, fontWeight: 600 }}>
                  <input type="checkbox" checked={!!form?.manufacture_to_resupply} onChange={(e) => setForm((p: any) => ({ ...p, manufacture_to_resupply: e.target.checked }))} />
                  {t('Manufacture to Resupply')}
                </label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                {(() => {
                  const mfOptions = [
                    { code: 'mrp_one_step', label: t('Manufacture (1 step)') },
                    { code: 'pbm', label: t('Pick components then manufacture (2 steps)') },
                    { code: 'pbm_sam', label: t('Pick components, manufacture, then store products (3 steps)') },
                  ] as const
                  const cur = form?.manufacture_steps || 'mrp_one_step'
                  const curLabel = mfOptions.find(o => o.code === cur)?.label || mfOptions[0].label
                  return (
                    <CustomDropdown
                      label={t('Manufacture')}
                      values={mfOptions.map(o => o.label)}
                      type="single"
                      defaultValue={curLabel}
                      onChange={(val) => {
                        const sel = mfOptions.find(o => o.label === val)
                        setForm((p: any) => ({ ...p, manufacture_steps: sel?.code || 'mrp_one_step' }))
                      }}
                      placeholder={t('Select')}
                    />
                  )
                })()}
              </div>
            </div>
            {/* Error message */}
            {saveError && (
              <div style={{ margin: '0 1.5rem 0.75rem', padding: '0.75rem', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                {saveError}
              </div>
            )}
            <div style={{ padding: "0 1.5rem 1.25rem", display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {!form?.id && (
                <button
                  onClick={async () => {
                    setSaveError("")
                    try {
                      if (!sessionId) return
                      const payload: any = {
                        name: form.name || undefined,
                        code: form.code || undefined,
                        view_location_id: form.view_location_id || false,
                        reception_steps: form.reception_steps,
                        delivery_steps: form.delivery_steps,
                        buy_to_resupply: !!form.buy_to_resupply,
                        subcontracting_dropshipping_to_resupply: !!form.subcontracting_dropshipping_to_resupply,
                        subcontracting_to_resupply: !!form.subcontracting_to_resupply,
                        manufacture_to_resupply: !!form.manufacture_to_resupply,
                        manufacture_steps: form.manufacture_steps,
                      }
                      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/warehouses/create`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values: payload })
                      })
                      const j = await res.json().catch(async () => { try { return { message: await res.text() } } catch { return {} as any } })
                      if (res.ok && j?.success) {
                        await fetchData('warehouses')
                        setIsModalOpen(false)
                        setToast({ text: t('Warehouse created successfully'), state: 'success' })
                      } else {
                        setSaveError(j?.message || t('Failed to create warehouse'))
                      }
                    } catch (e: any) {
                      setSaveError(e?.message || t('Failed to create warehouse'))
                    }
                  }}
                  style={{ background: colors.action, color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 0.875rem', fontWeight: 700 }}
                >{t('Create')}</button>
              )}
              {form?.id && (
                <button
                  onClick={async () => {
                    setSaveError("")
                    try {
                      if (!sessionId || !form?.id) return
                      const payload: any = {
                        name: form.name || undefined,
                        code: form.code || undefined,
                        view_location_id: form.view_location_id || false,
                        reception_steps: form.reception_steps,
                        delivery_steps: form.delivery_steps,
                        buy_to_resupply: !!form.buy_to_resupply,
                        subcontracting_dropshipping_to_resupply: !!form.subcontracting_dropshipping_to_resupply,
                        subcontracting_to_resupply: !!form.subcontracting_to_resupply,
                        manufacture_to_resupply: !!form.manufacture_to_resupply,
                        manufacture_steps: form.manufacture_steps,
                      }
                      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/warehouses/${form.id}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values: payload })
                      })
                      const j = await res.json().catch(async () => { try { return { message: await res.text() } } catch { return {} as any } })
                      if (res.ok && j?.success) {
                        await fetchData('warehouses')
                        setIsModalOpen(false)
                        setToast({ text: t('Warehouse updated successfully'), state: 'success' })
                      } else {
                        setSaveError(j?.message || t('Failed to update warehouse'))
                      }
                    } catch (e: any) {
                      setSaveError(e?.message || t('Failed to update warehouse'))
                    }
                  }}
                  style={{ background: colors.action, color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 0.875rem', fontWeight: 700 }}
                >{t('Save')}</button>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && <Toast text={toast.text} state={toast.state} onClose={() => setToast(null)} />}
    </div>
  )
}
