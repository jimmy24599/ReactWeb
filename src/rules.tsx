"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  X,
  Plus,
  Search,
  Package,
  MapPin,
  Clock,
  Route,
  Truck,
  Settings,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { API_CONFIG } from "./config/api"
import { StatCard } from "./components/StatCard"
import { RuleCard } from "./components/RuleCard"

export default function RulesPage() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;
  const { t } = useTranslation()
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRule, setSelectedRule] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewRule, setIsNewRule] = useState(false)

  const { stockRules, stockRoutes, stockPickingTypes, locations } = useData()
  const [refreshing, setRefreshing] = useState(false)
  const [rulesOverride, setRulesOverride] = useState<any[] | null>(null)

  // Unified rule edit/create modal state (same style/mappings as routes page)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [isCreateRule, setIsCreateRule] = useState(false)
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

  const rules = useMemo(() => {
    // Map Odoo stock.rule -> UI rule shape safely
    const mapAction = (a?: string) => {
      if (!a) return ""
      const m: Record<string, string> = {
        pull: "Pull From",
        push: "Push To",
        buy: "Buy",
        manufacture: "Manufacture",
      }
      return m[a] || a
    }
    const formatMany2One = (v: any): string => {
      if (Array.isArray(v)) return v[1] ?? ""
      if (v && typeof v === "object") return String((v as any).name || (v as any).display_name || "")
      if (v == null) return ""
      return String(v)
    }
    const mapProcure = (pm: any): string => {
      if (Array.isArray(pm)) return pm[1] ?? ""
      const code = String(pm || "")
      const map: Record<string, string> = {
        make_to_stock: "Take From Stock",
        make_to_order: "Trigger Another Rule",
        mts_else_mto: "Take From Stock, if unavailable, Trigger Another Rule",
      }
      return map[code] || code
    }
    const source = rulesOverride ?? stockRules ?? []
    return (source as any[]).map((r: any, idx: number) => ({
      id: r.id ?? idx,
      name: r.name ?? "",
      action: mapAction(r.action),
      operationType: formatMany2One(r.picking_type_id),
      sourceLocation: formatMany2One(r.location_src_id),
      destinationLocation: formatMany2One(r.location_dest_id),
      supplyMethod: mapProcure(r.procure_method),
      route: formatMany2One(r.route_id),
      propagateGroup: r.propagate ?? undefined,
      cancelNextMove: !!r.propagate_cancel,
      propagateCarrier: !!r.propagate_carrier,
      warehouseToPropagate: formatMany2One(r.warehouse_id),
      partnerAddress: formatMany2One(r.partner_address_id),
      leadTime: typeof r.delay === "number" ? r.delay : 0,
      raw: r,
    }))
  }, [stockRules, rulesOverride])

  const filteredRules = rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.sourceLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.destinationLocation.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRuleClick = (rule: any) => {
    openEditRule(rule.raw || rule)
  }

  const handleAddRule = () => {
    // Open the unified modal empty for create
    openCreateRule()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRule(null)
    setIsNewRule(false)
  }

  const handleSave = () => {
    // Handle save logic here
    console.log("[v0] Saving rule:", selectedRule)
    handleCloseModal()
  }

  // New: open/create/edit rule modal handlers
  const openCreateRule = () => {
    setIsCreateRule(true)
    setEditingRuleId(null)
    setRuleForm({
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
    setIsRuleModalOpen(true)
  }

  const openEditRule = (raw: any) => {
    const normalizeId = (v: any) => (Array.isArray(v) ? String(v[0]) : v != null ? String(v) : "")
    setIsCreateRule(false)
    setEditingRuleId(String(raw?.id || ""))
    setRuleForm({
      name: String(raw?.name || ""),
      action: String(raw?.action || "pull"),
      picking_type_id: normalizeId(raw?.picking_type_id),
      location_src_id: normalizeId(raw?.location_src_id),
      location_dest_id: normalizeId(raw?.location_dest_id),
      procure_method: String(raw?.procure_method || "make_to_stock"),
      auto: String(raw?.auto || "manual"),
      route_id: normalizeId(raw?.route_id),
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
      setIsRuleModalOpen(false)
      try {
        const sid = localStorage.getItem("sessionId") || sessionStorage.getItem("sessionId")
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

  const totalRules = rules.length
  const activeRules = rules.filter((r) => r.action === "Pull From" || r.action === "Push To").length
  const totalRoutes = Array.from(new Set(rules.map((r) => r.route).filter(Boolean))).length
  const inactiveRules = totalRules - activeRules

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: "3rem 2rem",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "3rem",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                color: colors.textPrimary,
                margin: 0,
                marginBottom: "0.5rem",
                letterSpacing: "-0.02em",
              }}
            >
              {t("Rules")}
            </h1>
            <p
              style={{
                fontSize: "1rem",
                color: colors.textSecondary,
                margin: 0,
              }}
            >
              {t("Manage your warehouse operations and routing rules")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
              disabled={refreshing}
              onClick={async () => {
                if (refreshing) return
                setRefreshing(true)
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
                  setRefreshing(false)
                }
              }}
            >
              <RefreshCw size={18} style={{ animation: refreshing ? "spin 0.9s linear infinite" : "none" }} />
              {refreshing ? t("Loading...") : t("Refresh Rules")}
            </button>
            <button
              onClick={handleAddRule}
              style={{
                background: colors.action,
                color: "#FFFFFF",
                border: "none",
                padding: "0.625rem 1.5rem",
                borderRadius: "0.75rem",
                fontSize: "0.9375rem",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(82, 104, 237, 0.25)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)"
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(82, 104, 237, 0.35)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(82, 104, 237, 0.25)"
              }}
            >
              <Plus size={18} />
              {t("Add Rule")}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2.5rem",
          }}
        >
          <StatCard
            label={t("Total Rules")}
            value={totalRules}
            icon={Package}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={0}
          />
          <StatCard
            label={t("Active Rules")}
            value={activeRules}
            icon={CheckCircle2}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            delay={1}
          />
          <StatCard
            label={t("Total Routes")}
            value={totalRoutes}
            icon={Route}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            delay={2}
          />
          <StatCard
            label={t("Inactive Rules")}
            value={inactiveRules}
            icon={XCircle}
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            delay={3}
          />
        </div>

        <div style={{ marginBottom: "2.5rem", position: "relative", maxWidth: "500px" }}>
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.textSecondary,
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder={t("Search rules...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 0.875rem 0.625rem 2.75rem",
              fontSize: "0.9375rem",
              border: `1px solid ${colors.border}`,
              borderRadius: "0.75rem",
              outline: "none",
              background: colors.card,
              color: colors.textPrimary,
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.action
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.boxShadow = "none"
            }}
          />
        </div>

        {filteredRules.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: colors.card,
              borderRadius: "1rem",
              border: `1px solid ${colors.border}`,
            }}
          >
            <Package size={48} style={{ color: colors.textSecondary, margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
              {t("No rules found")}
            </h3>
            <p style={{ fontSize: "0.9375rem", color: colors.textSecondary }}>
              {searchQuery ? t("Try adjusting your search") : t("Get started by creating your first rule")}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {filteredRules.map((rule, index) => (
              <RuleCard key={rule.id} rule={rule} onClick={() => handleRuleClick(rule)} index={index} />
            ))}
          </div>
        )}
      </div>

      {isRuleModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1100,
          }}
          onClick={() => setIsRuleModalOpen(false)}
        >
          <div
            style={{
              width: "min(100%, 800px)",
              maxHeight: "95vh",
              display: "flex",
              flexDirection: "column",
              background: colors.card,
              borderRadius: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              overflow: "hidden",
              border: `1px solid ${colors.border}`,
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
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>
                  {t(isCreateRule ? "Create Rule" : "Edit Rule")}
                </div>
                <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                  {t("Configure route rule settings")}
                </div>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                style={{
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.textSecondary,
                  borderRadius: 8,
                  padding: "0.5rem",
                  cursor: "pointer",
                  fontSize: 20,
                  lineHeight: 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.cancel
                  e.currentTarget.style.color = "#FFFFFF"
                  e.currentTarget.style.borderColor = colors.cancel
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.card
                  e.currentTarget.style.color = colors.textSecondary
                  e.currentTarget.style.borderColor = colors.border
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                padding: "1.5rem",
                overflowY: "auto",
                display: "grid",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {t("Name")}
                </label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.9375rem",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.boxShadow = "none"
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {t("Action")}
                </label>
                <select
                  value={ruleForm.action}
                  onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.9375rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.boxShadow = "none"
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
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {t("Operation type")}
                </label>
                <select
                  value={ruleForm.picking_type_id}
                  onChange={(e) => setRuleForm({ ...ruleForm, picking_type_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.9375rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.boxShadow = "none"
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
                      color: colors.textPrimary,
                      marginBottom: 6,
                    }}
                  >
                    {t("Source Location")}
                  </label>
                  <select
                    value={ruleForm.location_src_id}
                    onChange={(e) => setRuleForm({ ...ruleForm, location_src_id: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                      fontSize: "0.9375rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.action
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.boxShadow = "none"
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
                      color: colors.textPrimary,
                      marginBottom: 6,
                    }}
                  >
                    {t("Destination Location")}
                  </label>
                  <select
                    value={ruleForm.location_dest_id}
                    onChange={(e) => setRuleForm({ ...ruleForm, location_dest_id: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                      fontSize: "0.9375rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.action
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.boxShadow = "none"
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
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {t("Supply method")}
                </label>
                <select
                  value={ruleForm.procure_method}
                  onChange={(e) => setRuleForm({ ...ruleForm, procure_method: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.9375rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.boxShadow = "none"
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
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {t("Automatic Move")}
                </label>
                <select
                  value={ruleForm.auto}
                  onChange={(e) => setRuleForm({ ...ruleForm, auto: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.9375rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.boxShadow = "none"
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
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {t("Route")}
                </label>
                <select
                  value={ruleForm.route_id}
                  onChange={(e) => setRuleForm({ ...ruleForm, route_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.9375rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.boxShadow = "none"
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
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {t("Propagation of Procurement Group")}
                </label>
                <select
                  value={ruleForm.group_propagation_option}
                  onChange={(e) => setRuleForm({ ...ruleForm, group_propagation_option: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.9375rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <option value="none">{t("Leave Empty")}</option>
                  <option value="propagate">{t("Propagate")}</option>
                  <option value="fixed">{t("Fixed")}</option>
                </select>
              </div>
              <label
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "0.75rem",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.mutedBg
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                <input
                  type="checkbox"
                  checked={!!ruleForm.propagate_carrier}
                  onChange={(e) => setRuleForm({ ...ruleForm, propagate_carrier: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: colors.textPrimary }}>
                  {t("Propagation of carrier")}
                </span>
              </label>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {t("Lead Time")}
                </label>
                <input
                  type="number"
                  value={ruleForm.delay}
                  onChange={(e) => setRuleForm({ ...ruleForm, delay: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                    fontSize: "0.9375rem",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.action
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.boxShadow = "none"
                  }}
                />
              </div>
            </div>
            <div
              style={{
                padding: "1rem 1.5rem",
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <button
                onClick={() => setIsRuleModalOpen(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.textPrimary,
                  fontSize: "0.9375rem",
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
                onClick={handleSaveRule}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: 8,
                  border: "none",
                  background: colors.action,
                  color: "#FFFFFF",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(82, 104, 237, 0.25)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(82, 104, 237, 0.35)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(82, 104, 237, 0.25)"
                }}
              >
                {t(isCreateRule ? "Create" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && selectedRule && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "1.25rem",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "2rem",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: colors.mutedBg,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    color: colors.textPrimary,
                    margin: 0,
                    marginBottom: "0.25rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {isNewRule ? t("New Rule") : t("Edit Rule")}
                </h2>
                <p style={{ fontSize: "0.875rem", color: colors.textSecondary, margin: 0 }}>
                  {isNewRule ? t("Configure a new warehouse rule") : t("Update rule configuration")}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: colors.border,
                  border: "none",
                  borderRadius: "0.625rem",
                  padding: "0.625rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  color: colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.cancel
                  e.currentTarget.style.color = "#FFFFFF"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.border
                  e.currentTarget.style.color = colors.textSecondary
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "2rem", overflowY: "auto", flex: 1 }}>
              {/* Basic Information Section */}
              <div style={{ marginBottom: "2rem" }}>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginBottom: "1.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Settings size={16} />
                  {t("Basic Information")}
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Name")}
                    </label>
                    <input
                      type="text"
                      value={selectedRule.name}
                      onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        fontSize: "0.9375rem",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "0.625rem",
                        outline: "none",
                        background: colors.background,
                        color: colors.textPrimary,
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.action
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: colors.textPrimary,
                          marginBottom: "0.5rem",
                        }}
                      >
                        {t("Action")}
                      </label>
                      <select
                        value={selectedRule.action}
                        onChange={(e) => setSelectedRule({ ...selectedRule, action: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.625rem 0.875rem",
                          fontSize: "0.9375rem",
                          border: `1px solid ${colors.border}`,
                          borderRadius: "0.625rem",
                          outline: "none",
                          background: colors.background,
                          color: colors.textPrimary,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = colors.action
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = colors.border
                          e.currentTarget.style.boxShadow = "none"
                        }}
                      >
                        <option value="Pull From">Pull From</option>
                        <option value="Push To">Push To</option>
                        <option value="Buy">Buy</option>
                        <option value="Manufacture">Manufacture</option>
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: colors.textPrimary,
                          marginBottom: "0.5rem",
                        }}
                      >
                        {t("Operation Type")}
                      </label>
                      <input
                        type="text"
                        value={selectedRule.operationType}
                        onChange={(e) =>
                          setSelectedRule({
                            ...selectedRule,
                            operationType: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "0.625rem 0.875rem",
                          fontSize: "0.9375rem",
                          border: `1px solid ${colors.border}`,
                          borderRadius: "0.625rem",
                          outline: "none",
                          background: colors.background,
                          color: colors.textPrimary,
                          transition: "all 0.2s ease",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = colors.action
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = colors.border
                          e.currentTarget.style.boxShadow = "none"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Locations Section */}
              <div style={{ marginBottom: "2rem" }}>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginBottom: "1.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <MapPin size={16} />
                  {t("Locations")}
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    padding: "1.5rem",
                    background: colors.mutedBg,
                    borderRadius: "0.75rem",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Source Location")}
                    </label>
                    <input
                      type="text"
                      value={selectedRule.sourceLocation}
                      onChange={(e) =>
                        setSelectedRule({
                          ...selectedRule,
                          sourceLocation: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        fontSize: "0.9375rem",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "0.625rem",
                        outline: "none",
                        background: colors.card,
                        color: colors.textPrimary,
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.action
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Destination Location")}
                    </label>
                    <input
                      type="text"
                      value={selectedRule.destinationLocation}
                      onChange={(e) =>
                        setSelectedRule({
                          ...selectedRule,
                          destinationLocation: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        fontSize: "0.9375rem",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "0.625rem",
                        outline: "none",
                        background: colors.card,
                        color: colors.textPrimary,
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.action
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Supply & Route Section */}
              <div style={{ marginBottom: "2rem" }}>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginBottom: "1.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Route size={16} />
                  {t("Supply & Route")}
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Supply Method")}
                    </label>
                    <input
                      type="text"
                      value={selectedRule.supplyMethod}
                      onChange={(e) =>
                        setSelectedRule({
                          ...selectedRule,
                          supplyMethod: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        fontSize: "0.9375rem",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "0.625rem",
                        outline: "none",
                        background: colors.background,
                        color: colors.textPrimary,
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.action
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Route")}
                    </label>
                    <input
                      type="text"
                      value={selectedRule.route}
                      onChange={(e) => setSelectedRule({ ...selectedRule, route: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        fontSize: "0.9375rem",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "0.625rem",
                        outline: "none",
                        background: colors.background,
                        color: colors.textPrimary,
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.action
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Propagation Section */}
              <div style={{ marginBottom: "2rem" }}>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginBottom: "1.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Truck size={16} />
                  {t("Propagation")}
                </h3>

                <div
                  style={{
                    padding: "1.5rem",
                    background: colors.mutedBg,
                    borderRadius: "0.75rem",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        cursor: "pointer",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.background)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                          borderRadius: "0.375rem",
                          border: `2px solid ${selectedRule.cancelNextMove ? colors.action : colors.border}`,
                          background: selectedRule.cancelNextMove ? colors.action : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {selectedRule.cancelNextMove && <CheckCircle2 size={14} style={{ color: "#FFFFFF" }} />}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedRule.cancelNextMove}
                        onChange={(e) =>
                          setSelectedRule({
                            ...selectedRule,
                            cancelNextMove: e.target.checked,
                          })
                        }
                        style={{ display: "none" }}
                      />
                      <span style={{ fontSize: "0.9375rem", color: colors.textPrimary, fontWeight: "500" }}>
                        {t("Cancel Next Move")}
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        cursor: "pointer",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.background)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                          borderRadius: "0.375rem",
                          border: `2px solid ${selectedRule.propagateCarrier ? colors.action : colors.border}`,
                          background: selectedRule.propagateCarrier ? colors.action : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {selectedRule.propagateCarrier && <CheckCircle2 size={14} style={{ color: "#FFFFFF" }} />}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedRule.propagateCarrier}
                        onChange={(e) =>
                          setSelectedRule({
                            ...selectedRule,
                            propagateCarrier: e.target.checked,
                          })
                        }
                        style={{ display: "none" }}
                      />
                      <span style={{ fontSize: "0.9375rem", color: colors.textPrimary, fontWeight: "500" }}>
                        {t("Propagation of carrier")}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Options Section */}
              <div>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginBottom: "1.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Clock size={16} />
                  {t("Options")}
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Partner Address")}
                    </label>
                    <input
                      type="text"
                      value={selectedRule.partnerAddress}
                      onChange={(e) =>
                        setSelectedRule({
                          ...selectedRule,
                          partnerAddress: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        fontSize: "0.9375rem",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "0.625rem",
                        outline: "none",
                        background: colors.background,
                        color: colors.textPrimary,
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.action
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Lead Time (days)")}
                    </label>
                    <input
                      type="number"
                      value={selectedRule.leadTime}
                      onChange={(e) =>
                        setSelectedRule({
                          ...selectedRule,
                          leadTime: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        fontSize: "0.9375rem",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "0.625rem",
                        outline: "none",
                        background: colors.background,
                        color: colors.textPrimary,
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.action
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}15`
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "1.5rem 2rem",
                borderTop: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                background: colors.mutedBg,
              }}
            >
              <button
                onClick={handleCloseModal}
                style={{
                  padding: "0.625rem 1.5rem",
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "0.625rem",
                  background: colors.card,
                  color: colors.textPrimary,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.cancel
                  e.currentTarget.style.background = colors.cancel + "10"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border
                  e.currentTarget.style.background = colors.card
                }}
              >
                <XCircle size={16} />
                {t("Cancel")}
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: "0.625rem 1.5rem",
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "0.625rem",
                  background: colors.action,
                  color: "#FFFFFF",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(82, 104, 237, 0.25)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(82, 104, 237, 0.35)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(82, 104, 237, 0.25)"
                }}
              >
                <CheckCircle2 size={16} />
                {t("Save Rule")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
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
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  )
}
