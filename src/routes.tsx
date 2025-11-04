"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, Plus, Trash2, RefreshCw, RouteIcon, CheckCircle, Settings, AlertCircle } from "lucide-react"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { API_CONFIG } from "./config/api"
import { StatCard } from "./components/StatCard"
import { RouteCard } from "./components/RouteCard"

interface Route {
  id: string
  name: string
  type: string
  sourceLocation: string
  destinationLocation: string
  rulesCount: number
  status: "active" | "inactive"
  applicableOn: {
    productCategories: boolean
    products: boolean
    packagings: boolean
    shippingMethods: boolean
    warehouses: boolean
    salesOrderLines: boolean
  }
  rules: Array<{
    action: string
    sourceLocation: string
    destinationLocation: string
  }>
}

export default function RoutesPage() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()
  const { stockRoutes, stockRules, locations, stockPickingTypes, warehouses, fetchData } = useData() as any
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isRTL = i18n.dir() === "rtl"
  const [refreshingRules, setRefreshingRules] = useState(false)
  const [rulesOverride, setRulesOverride] = useState<any[] | null>(null)

  // Route modal editable state (used for both edit and create)
  const [isCreateRoute, setIsCreateRoute] = useState(false)
  const [routeDirty, setRouteDirty] = useState(false)
  const [routeForm, setRouteForm] = useState<any>({
    name: "",
    product_categ_selectable: false,
    product_selectable: false,
    packaging_selectable: false,
    shipping_selectable: false,
    warehouse_selectable: false,
    sale_selectable: false,
    warehouse_ids: [] as number[],
  })

  // Rule modal state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [isCreateRule, setIsCreateRule] = useState(false)
  const [ruleDirty, setRuleDirty] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [ruleForm, setRuleForm] = useState<any>({
    name: "",
    action: "pull",
    picking_type_id: "",
    location_src_id: "",
    location_dest_id: "",
    procure_method: "make_to_stock",
    auto: "manual",
    route_id: "",
    group_propagation_option: "none",
    propagate_carrier: false,
    delay: "",
  })

  const getSessionId = () => localStorage.getItem("sessionId") || sessionStorage.getItem("sessionId")

  const routesData: Route[] = useMemo(() => {
    const sourceRules = rulesOverride ?? stockRules ?? []
    const rulesByRoute: Record<number, any[]> = {}
    for (const rule of sourceRules as any[]) {
      const rid = rule.route_id?.[0]
      if (!rid) continue
      if (!rulesByRoute[rid]) rulesByRoute[rid] = []
      rulesByRoute[rid].push(rule)
    }
    const mapAction = (a?: string) => {
      if (!a) return ""
      const m: Record<string, string> = { pull: "Pull From", push: "Push To", buy: "Buy", manufacture: "Manufacture" }
      return m[a] || a
    }
    return (stockRoutes || []).map((r: any, idx: number) => {
      const rid = r.id ?? idx
      const related = rulesByRoute[rid] || []
      const firstRule = related[0]
      const rules = related.map((ru: any) => ({
        id: String(ru.id ?? ""),
        action: mapAction(ru.action),
        sourceLocation: ru.location_src_id?.[1] ?? ru.location_id?.[1] ?? "",
        destinationLocation: ru.location_id?.[1] ?? "",
        raw: ru,
      }))
      const applicableOn = {
        productCategories: !!(r.product_categ_selectable || r.categ_selectable),
        products: !!r.product_selectable,
        packagings: !!r.packaging_selectable,
        shippingMethods: !!(r.shipping_selectable || r.sale_selectable),
        warehouses: !!r.warehouse_selectable,
        salesOrderLines: !!r.sale_order_line_selectable,
      }
      const type = firstRule?.picking_type_id?.[1] || (related.length ? "Route" : "Route")
      return {
        id: String(rid),
        name: r.name || "",
        type,
        sourceLocation: firstRule?.location_src_id?.[1] ?? firstRule?.location_id?.[1] ?? "",
        destinationLocation: firstRule?.location_id?.[1] ?? "",
        rulesCount: related.length,
        status: r.active === false ? "inactive" : "active",
        applicableOn,
        rules,
      } as Route
    })
  }, [stockRoutes, stockRules, rulesOverride])

  const filteredRoutes = routesData.filter((route) => route.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const activeRoutes = routesData.filter((r) => r.status === "active").length
  const totalRules = routesData.reduce((sum, r) => sum + r.rulesCount, 0)

  const handleRouteClick = (route: Route) => {
    setSelectedRoute(route)
    setIsCreateRoute(false)
    setRouteDirty(false)
    // Populate form from raw stock.route
    const rid = Number(route.id)
    const raw = (Array.isArray(stockRoutes) ? stockRoutes : []).find((r: any) => Number(r.id) === rid) || {}
    setRouteForm({
      name: String(raw.name || route.name || ""),
      product_categ_selectable: !!(
        raw.product_categ_selectable ??
        raw.categ_selectable ??
        route.applicableOn?.productCategories
      ),
      product_selectable: !!(raw.product_selectable ?? route.applicableOn?.products),
      packaging_selectable: !!(raw.packaging_selectable ?? route.applicableOn?.packagings),
      shipping_selectable: !!(raw.shipping_selectable ?? raw.sale_selectable ?? route.applicableOn?.shippingMethods),
      warehouse_selectable: !!(raw.warehouse_selectable ?? route.applicableOn?.warehouses),
      sale_selectable: !!(raw.sale_selectable ?? raw.shipping_selectable ?? route.applicableOn?.salesOrderLines),
      warehouse_ids: Array.isArray(raw.warehouse_ids)
        ? raw.warehouse_ids
            .map((v: any) => Number(Array.isArray(v) ? v[0] : v))
            .filter((n: number) => Number.isFinite(n))
        : [],
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedRoute(null)
    setIsCreateRoute(false)
  }

  const openCreateRule = () => {
    setIsCreateRule(true)
    setEditingRuleId(null)
    setRuleDirty(false)
    setRuleForm({
      name: "",
      action: "pull",
      picking_type_id: "",
      location_src_id: "",
      location_dest_id: "",
      procure_method: "make_to_stock",
      auto: "manual",
      route_id: selectedRoute ? Number(selectedRoute.id) : "",
      group_propagation_option: "none",
      propagate_carrier: false,
      delay: "",
    })
    setIsRuleModalOpen(true)
  }

  const openEditRule = (ru: any) => {
    const raw = ru?.raw || ru
    setIsCreateRule(false)
    setEditingRuleId(String(raw?.id || ""))
    setRuleDirty(false)
    setRuleForm({
      name: String(raw?.name || ""),
      action: String(raw?.action || "pull"),
      picking_type_id: Array.isArray(raw?.picking_type_id)
        ? String(raw.picking_type_id[0])
        : raw?.picking_type_id
          ? String(raw.picking_type_id)
          : "",
      location_src_id: Array.isArray(raw?.location_src_id)
        ? String(raw.location_src_id[0])
        : raw?.location_src_id
          ? String(raw.location_src_id)
          : "",
      location_dest_id: Array.isArray(raw?.location_dest_id)
        ? String(raw.location_dest_id[0])
        : raw?.location_dest_id
          ? String(raw.location_dest_id)
          : "",
      procure_method: String(raw?.procure_method || "make_to_stock"),
      auto: String(raw?.auto || "manual"),
      route_id: Array.isArray(raw?.route_id)
        ? String(raw.route_id[0])
        : raw?.route_id
          ? String(raw.route_id)
          : selectedRoute
            ? String(selectedRoute.id)
            : "",
      group_propagation_option: String(raw?.group_propagation_option || "none"),
      propagate_carrier: !!raw?.propagate_carrier,
      delay: raw?.delay != null ? String(raw.delay) : "",
    })
    setIsRuleModalOpen(true)
  }

  const handleSaveRule = async () => {
    try {
      const sessionId = getSessionId()
      if (!sessionId) throw new Error("No session ID found")
      const values: any = {
        name: ruleForm.name,
        action: ruleForm.action,
        procure_method: ruleForm.procure_method,
        auto: ruleForm.auto,
        group_propagation_option: ruleForm.group_propagation_option,
        propagate_carrier: !!ruleForm.propagate_carrier,
      }
      if (ruleForm.picking_type_id) values.picking_type_id = Number(ruleForm.picking_type_id)
      if (ruleForm.location_src_id) values.location_src_id = Number(ruleForm.location_src_id)
      if (ruleForm.location_dest_id) values.location_dest_id = Number(ruleForm.location_dest_id)
      if (ruleForm.route_id) values.route_id = Number(ruleForm.route_id)
      if (ruleForm.delay !== "") values.delay = Number(ruleForm.delay)

      let res: Response
      if (isCreateRule) {
        res = await fetch(`${API_BASE_URL}/stock-rules/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, values }),
        })
      } else {
        if (!editingRuleId) throw new Error("Missing rule id")
        res = await fetch(`${API_BASE_URL}/stock-rules/${editingRuleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, values }),
        })
      }
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json().catch(() => ({}))
      if (!data.success && !data.id) throw new Error(data.message || "Operation failed")
      setRuleDirty(false)
      setIsRuleModalOpen(false)
      // Directly refresh rules from backend to avoid going through data.tsx
      try {
        const sid = getSessionId()
        if (sid) {
          const res2 = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/stock-rules`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid }),
          })
          const d2 = await res2.json().catch(() => ({}))
          if (res2.ok && d2?.success) setRulesOverride(d2.stockRules || [])
        }
      } catch {}
    } catch (e: any) {
      console.error(e?.message || "Failed to save rule")
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Receipt":
        return "#4A7FA7"
      case "Delivery":
        return "#0A1931"
      case "Transfer":
        return "#1A3D63"
      case "Manufacturing":
        return "#4A7FA7"
      default:
        return "#1A3D63"
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.background, padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: "0.5rem",
            }}
          >
            {t("Routes Management")}
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: "1rem" }}>
            {t("Configure and manage warehouse routing rules")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            style={{
              background: colors.card,
              color: colors.textPrimary,
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              border: `1px solid ${colors.border}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              transition: "all 0.3s ease",
            }}
            disabled={refreshingRules}
            onClick={async () => {
              if (refreshingRules) return
              setRefreshingRules(true)
              try {
                const sid = localStorage.getItem("sessionId") || sessionStorage.getItem("sessionId")
                if (!sid) throw new Error("No session ID")
                const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/stock-rules`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId: sid }),
                })
                const data = await res.json().catch(() => ({}))
                if (res.ok && data?.success) setRulesOverride(data.stockRules || [])
              } catch (e) {
                console.error("Direct rules refresh failed", e)
              } finally {
                setRefreshingRules(false)
              }
            }}
          >
            <RefreshCw size={18} style={{ animation: refreshingRules ? "spin 0.9s linear infinite" : "none" }} />
            {refreshingRules ? t("Loading...") : t("Refresh Routes")}
          </button>

          <button
            style={{
              background: colors.action,
              color: "#FFFFFF",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.95rem",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(74, 127, 167, 0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(74, 127, 167, 0.4)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 127, 167, 0.3)"
            }}
            onClick={() => {
              setIsCreateRoute(true)
              setRouteDirty(false)
              setSelectedRoute(null)
              setRouteForm({
                name: "",
                product_categ_selectable: false,
                product_selectable: false,
                packaging_selectable: false,
                shipping_selectable: false,
                warehouse_selectable: false,
                sale_selectable: false,
                warehouse_ids: [],
              })
              setIsModalOpen(true)
            }}
          >
            <Plus size={20} />
            {t("Add Route")}
          </button>
        </div>
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
          label={t("Total Routes")}
          value={routesData.length}
          icon={RouteIcon}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          delay={0}
        />
        <StatCard
          label={t("Active Routes")}
          value={activeRoutes}
          icon={CheckCircle}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          delay={1}
        />
        <StatCard
          label={t("Total Rules")}
          value={totalRules}
          icon={Settings}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          delay={2}
        />
        <StatCard
          label={t("Inactive Routes")}
          value={routesData.length - activeRoutes}
          icon={AlertCircle}
          gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          delay={3}
        />
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            position: "relative",
            maxWidth: "500px",
          }}
        >
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.textSecondary,
            }}
          />
          <input
            type="text"
            placeholder={t("Search routes...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.875rem 1rem 0.875rem 3rem",
              borderRadius: "0.75rem",
              border: `2px solid ${colors.border}`,
              fontSize: "0.95rem",
              outline: "none",
              transition: "all 0.3s ease",
              background: colors.card,
              color: colors.textPrimary,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.action
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {filteredRoutes.map((route, index) => (
          <RouteCard key={route.id} route={route} onClick={() => handleRouteClick(route)} index={index} />
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (selectedRoute || isCreateRoute) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "1rem",
              border: `1px solid ${colors.border}`,
              width: "100%",
              maxWidth: 640,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: colors.textPrimary }}>
                  {isCreateRoute ? t("Add Route") : selectedRoute?.name || ""}
                </div>
                <div style={{ fontSize: "0.875rem", color: colors.textSecondary, marginTop: "0.25rem" }}>
                  {t("Configure route settings and rules")}
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.textSecondary,
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.border
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.background
                }}
              >
                ✕
              </button>
            </div>
            {/* Modal Content */}
            <div style={{ padding: "1.5rem" }}>
              {/* Name field */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: colors.textPrimary,
                  }}
                >
                  {t("Name")}
                </label>
                <input
                  type="text"
                  value={routeForm.name}
                  onChange={(e) => {
                    setRouteForm({ ...routeForm, name: e.target.value })
                    setRouteDirty(true)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.95rem",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                  }}
                />
              </div>
              {/* Applicable On Section */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginBottom: "0.5rem",
                  }}
                >
                  {t("Applicable On")}
                </h3>
                <p
                  style={{
                    color: colors.textSecondary,
                    fontSize: "0.875rem",
                    marginBottom: "1rem",
                  }}
                >
                  {t("Select the places where this route can be selected")}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!routeForm.product_categ_selectable}
                      onChange={(e) => {
                        setRouteForm({ ...routeForm, product_categ_selectable: e.target.checked })
                        setRouteDirty(true)
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", color: colors.textPrimary }}>{t("Products category")}</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!routeForm.product_selectable}
                      onChange={(e) => {
                        setRouteForm({ ...routeForm, product_selectable: e.target.checked })
                        setRouteDirty(true)
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", color: colors.textPrimary }}>{t("Products")}</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!routeForm.packaging_selectable}
                      onChange={(e) => {
                        setRouteForm({ ...routeForm, packaging_selectable: e.target.checked })
                        setRouteDirty(true)
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", color: colors.textPrimary }}>{t("Packagings")}</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!routeForm.shipping_selectable}
                      onChange={(e) => {
                        setRouteForm({ ...routeForm, shipping_selectable: e.target.checked })
                        setRouteDirty(true)
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", color: colors.textPrimary }}>{t("Shipping Methods")}</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!routeForm.warehouse_selectable}
                      onChange={(e) => {
                        setRouteForm({ ...routeForm, warehouse_selectable: e.target.checked })
                        setRouteDirty(true)
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", color: colors.textPrimary }}>{t("Warehouses:")}</span>
                  </label>
                  {routeForm.warehouse_selectable && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <select
                        multiple
                        value={(routeForm.warehouse_ids || []).map((n: number) => String(n))}
                        onChange={(e) => {
                          const opts = Array.from(e.target.selectedOptions)
                            .map((o) => Number(o.value))
                            .filter((n) => Number.isFinite(n))
                          setRouteForm({ ...routeForm, warehouse_ids: opts })
                          setRouteDirty(true)
                        }}
                        style={{
                          width: "100%",
                          minHeight: 120,
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          border: `2px solid ${colors.border}`,
                          background: colors.background,
                          color: colors.textPrimary,
                        }}
                      >
                        {(Array.isArray(warehouses) ? warehouses : []).map((w: any) => (
                          <option key={w.id} value={String(w.id)}>
                            {w.name ||
                              (Array.isArray(w.display_name) ? w.display_name[1] : w.display_name || `#${w.id}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!routeForm.sale_selectable}
                      onChange={(e) => {
                        setRouteForm({ ...routeForm, sale_selectable: e.target.checked })
                        setRouteDirty(true)
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", color: colors.textPrimary }}>{t("Sales Order Lines:")}</span>
                  </label>
                </div>
              </div>

              {/* Rules Section */}
              {!isCreateRoute && (
                <div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: "1rem",
                    }}
                  >
                    {t("Rules")}
                  </h3>
                  <div
                    style={{
                      background: colors.background,
                      borderRadius: "0.75rem",
                      overflow: "hidden",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {/* Table Header */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr auto",
                        gap: "1rem",
                        padding: "1rem 1.5rem",
                        background: colors.background,
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: colors.textPrimary,
                      }}
                    >
                      <div>{t("Action")}</div>
                      <div>{t("Source Location")}</div>
                      <div>{t("Destination Location")}</div>
                      <div></div>
                    </div>
                    {/* Table Rows */}
                    {selectedRoute?.rules.map((rule, index) => (
                      <div
                        key={index}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr auto",
                          gap: "1rem",
                          padding: "1rem 1.5rem",
                          background: colors.card,
                          borderTop: `1px solid ${colors.border}`,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontSize: "0.875rem", color: colors.textPrimary }}>{rule.action}</div>
                        <div style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{rule.sourceLocation}</div>
                        <div style={{ fontSize: "0.875rem", color: colors.textSecondary }}>
                          {rule.destinationLocation}
                        </div>
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.border
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent"
                          }}
                        >
                          <Trash2 size={16} style={{ color: colors.textSecondary }} />
                        </button>
                      </div>
                    ))}
                    {/* Add/Refresh Buttons */}
                    <div
                      style={{
                        padding: "1rem 1.5rem",
                        background: colors.card,
                        borderTop: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          style={{
                            background: colors.card,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "0.5rem",
                            padding: "0.75rem 1rem",
                            cursor: "pointer",
                            color: colors.textPrimary,
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "all 0.2s ease",
                          }}
                          onClick={async () => {
                            if (refreshingRules) return
                            setRefreshingRules(true)
                            try {
                              const sid = localStorage.getItem("sessionId") || sessionStorage.getItem("sessionId")
                              if (!sid) throw new Error("No session ID")
                              const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/stock-rules`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ sessionId: sid }),
                              })
                              const data = await res.json().catch(() => ({}))
                              if (res.ok && data?.success) setRulesOverride(data.stockRules || [])
                            } catch (e) {
                              console.error("Direct rules refresh failed", e)
                            } finally {
                              setRefreshingRules(false)
                            }
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.background
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = colors.card
                          }}
                        >
                          <RefreshCw size={16} /> {t("Refresh")}
                        </button>
                        <button
                          style={{
                            background: "transparent",
                            border: `2px dashed ${colors.border}`,
                            borderRadius: "0.5rem",
                            padding: "0.75rem 1rem",
                            cursor: "pointer",
                            color: colors.textSecondary,
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "all 0.2s ease",
                          }}
                          onClick={openCreateRule}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.action
                            e.currentTarget.style.color = colors.action
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.border
                            e.currentTarget.style.color = colors.textSecondary
                          }}
                        >
                          <Plus size={16} /> {t("Add rule")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                padding: "1rem 1.5rem",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.textPrimary,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.background
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.card
                }}
              >
                {t("Cancel")}
              </button>
              <button
                disabled={!isCreateRoute && !routeDirty && !routeForm.name}
                onClick={async () => {
                  try {
                    const sid = localStorage.getItem("sessionId") || sessionStorage.getItem("sessionId")
                    if (!sid) throw new Error("No session ID found")
                    const payload: any = {
                      name: routeForm.name,
                      product_categ_selectable: !!routeForm.product_categ_selectable,
                      product_selectable: !!routeForm.product_selectable,
                      packaging_selectable: !!routeForm.packaging_selectable,
                      shipping_selectable: !!routeForm.shipping_selectable,
                      warehouse_selectable: !!routeForm.warehouse_selectable,
                      sale_selectable: !!routeForm.sale_selectable,
                    }
                    if (Array.isArray(routeForm.warehouse_ids)) payload.warehouse_ids = routeForm.warehouse_ids

                    let ok = false
                    if (isCreateRoute) {
                      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/stock-routes/create`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sessionId: sid, values: payload }),
                      })
                      const j = await res.json().catch(() => ({}))
                      ok = res.ok && (j?.success || j?.id)
                    } else {
                      const rid = selectedRoute ? selectedRoute.id : ""
                      if (!rid) throw new Error("Missing route id")
                      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/stock-routes/${rid}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sessionId: sid, values: payload }),
                      })
                      const j = await res.json().catch(() => ({}))
                      ok = res.ok && j?.success
                    }
                    if (ok) {
                      if (fetchData) await fetchData("stockRoutes")
                      setIsModalOpen(false)
                    }
                  } catch (e) {
                    console.error("Save route failed", e)
                  }
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: colors.action,
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  opacity: !isCreateRoute && !routeDirty && !routeForm.name ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!(!isCreateRoute && !routeDirty && !routeForm.name)) {
                    e.currentTarget.style.transform = "translateY(-1px)"
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 127, 167, 0.4)"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                {t(isCreateRoute ? "Create" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Edit Modal */}
      {isRuleModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1000,
          }}
          onClick={() => setIsRuleModalOpen(false)}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "1rem",
              border: `1px solid ${colors.border}`,
              width: "100%",
              maxWidth: 560,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary }}>
                  {t(isCreateRule ? "Create Rule" : "Edit Rule")}
                </div>
                <div style={{ fontSize: "0.875rem", color: colors.textSecondary, marginTop: "0.25rem" }}>
                  {t("Configure rule parameters")}
                </div>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                style={{
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.textSecondary,
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.border
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.background
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{ padding: "1.25rem 1.5rem", display: "grid", gap: "1rem", maxHeight: "60vh", overflowY: "auto" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: colors.textPrimary,
                  }}
                >
                  {t("Name")}
                </label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, name: e.target.value })
                    setRuleDirty(true)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.95rem",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: colors.textPrimary,
                  }}
                >
                  {t("Action")}
                </label>
                <select
                  value={ruleForm.action}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, action: e.target.value })
                    setRuleDirty(true)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                >
                  <option value="pull">{t("Pull From")}</option>
                  <option value="push">{t("Push To")}</option>
                  <option value="pull_push">{t("Pull & Push")}</option>
                  <option value="manufacture">{t("Manufacture")}</option>
                  <option value="buy">{t("Buy")}</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: colors.textPrimary,
                  }}
                >
                  {t("Operation type")}
                </label>
                <select
                  value={ruleForm.picking_type_id}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, picking_type_id: e.target.value })
                    setRuleDirty(true)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                >
                  <option value="">{t("Select operation type")}</option>
                  {(Array.isArray(stockPickingTypes) ? stockPickingTypes : []).map((pt: any) => (
                    <option key={pt.id} value={String(pt.id)}>
                      {pt.name || pt.display_name || `#${pt.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      color: colors.textPrimary,
                    }}
                  >
                    {t("Source Location")}
                  </label>
                  <select
                    value={ruleForm.location_src_id}
                    onChange={(e) => {
                      setRuleForm({ ...ruleForm, location_src_id: e.target.value })
                      setRuleDirty(true)
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                      fontSize: "0.95rem",
                      outline: "none",
                    }}
                  >
                    <option value="">{t("Select location")}</option>
                    {(Array.isArray(locations) ? locations : []).map((loc: any) => (
                      <option key={loc.id} value={String(loc.id)}>
                        {loc.complete_name ||
                          (Array.isArray(loc.display_name)
                            ? loc.display_name[1]
                            : loc.display_name || loc.name || `#${loc.id}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      color: colors.textPrimary,
                    }}
                  >
                    {t("Destination Location")}
                  </label>
                  <select
                    value={ruleForm.location_dest_id}
                    onChange={(e) => {
                      setRuleForm({ ...ruleForm, location_dest_id: e.target.value })
                      setRuleDirty(true)
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                      fontSize: "0.95rem",
                      outline: "none",
                    }}
                  >
                    <option value="">{t("Select location")}</option>
                    {(Array.isArray(locations) ? locations : []).map((loc: any) => (
                      <option key={loc.id} value={String(loc.id)}>
                        {loc.complete_name ||
                          (Array.isArray(loc.display_name)
                            ? loc.display_name[1]
                            : loc.display_name || loc.name || `#${loc.id}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: colors.textPrimary,
                  }}
                >
                  {t("Supply method")}
                </label>
                <select
                  value={ruleForm.procure_method}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, procure_method: e.target.value })
                    setRuleDirty(true)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                >
                  <option value="make_to_stock">{t("Take From Stock")}</option>
                  <option value="make_to_order">{t("Trigger Another Rule")}</option>
                  <option value="mts_else_mto">{t("Take From Stock, if unavailable, Trigger Another Rule")}</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: colors.textPrimary,
                  }}
                >
                  {t("Automatic Move")}
                </label>
                <select
                  value={ruleForm.auto}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, auto: e.target.value })
                    setRuleDirty(true)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                >
                  <option value="manual">{t("Manual Operation")}</option>
                  <option value="transparent">{t("Automatic No Step Added")}</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: colors.textPrimary,
                  }}
                >
                  {t("Route")}
                </label>
                <select
                  value={ruleForm.route_id}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, route_id: e.target.value })
                    setRuleDirty(true)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                >
                  <option value="">{t("Select route")}</option>
                  {(Array.isArray(stockRoutes) ? stockRoutes : []).map((rt: any) => (
                    <option key={rt.id} value={String(rt.id)}>
                      {rt.name || rt.display_name || `#${rt.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: colors.textPrimary,
                  }}
                >
                  {t("Propagation of Procurement Group")}
                </label>
                <select
                  value={ruleForm.group_propagation_option}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, group_propagation_option: e.target.value })
                    setRuleDirty(true)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                >
                  <option value="none">{t("Leave Empty")}</option>
                  <option value="propagate">{t("Propagate")}</option>
                  <option value="fixed">{t("Fixed")}</option>
                </select>
              </div>
              <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!ruleForm.propagate_carrier}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, propagate_carrier: e.target.checked })
                    setRuleDirty(true)
                  }}
                />
                <span style={{ fontSize: "0.875rem", color: colors.textPrimary }}>{t("Propagation of carrier")}</span>
              </label>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: colors.textPrimary,
                  }}
                >
                  {t("Lead Time")}
                </label>
                <input
                  type="number"
                  value={ruleForm.delay}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, delay: e.target.value })
                    setRuleDirty(true)
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.95rem",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                  }}
                />
              </div>
            </div>
            <div
              style={{
                padding: "1rem 1.5rem",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <button
                onClick={() => setIsRuleModalOpen(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.textPrimary,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.background
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.card
                }}
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleSaveRule}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: colors.action,
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 127, 167, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                {t(isCreateRule ? "Create" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}

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
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  )
}
