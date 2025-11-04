"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { Search, Plus, Truck, DollarSign, Globe, Package, X, ChevronDown, RefreshCw } from "lucide-react"
import { useData } from "../context/data"
import { useAuth } from "../context/auth"
import { API_CONFIG } from "./config/api"
import { StatCard } from "./components/StatCard"
import { DeliveryMethodCard } from "./components/DeliveryMethodCard"

export default function DeliveryMethodsPage() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { products, stockRoutes, fetchData } = useData() as any
  const { sessionId } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [refreshing, setRefreshing] = useState(false)
  const [carriers, setCarriers] = useState<any[]>([])
  const [rules, setRules] = useState<any[]>([])
  const [rulesRefreshing, setRulesRefreshing] = useState(false)
  const [newRuleDrafts, setNewRuleDrafts] = useState<any[]>([])
  const [currencySymbol, setCurrencySymbol] = useState<string>("$")
  const [countries, setCountries] = useState<any[]>([])
  const [statesList, setStatesList] = useState<any[]>([])
  const [zipPrefixes, setZipPrefixes] = useState<any[]>([])
  const [productTags, setProductTags] = useState<any[]>([])

  const [formData, setFormData] = useState<any>({
    name: "",
    delivery_type: "fixed",
    route_ids: [] as string[],
    margin: "",
    fixed_margin: "",
    product_id: "",
    tracking_url: "",
    country_ids: [] as string[],
    state_ids: [] as string[],
    zip_prefix_ids: [] as string[],
    max_weight: "",
    max_volume: "",
    must_have_tag_ids: [] as string[],
    excluded_tag_ids: [] as string[],
    website_description: "",
    carrier_description: "",
  })

  useEffect(() => {
    const load = async () => {
      if (!sessionId) return
      try {
        setRefreshing(true)
        const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/delivery-carriers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.success) setCarriers(Array.isArray(data.deliveryCarriers) ? data.deliveryCarriers : [])
      } finally {
        setRefreshing(false)
      }
    }
    load()
    if (!Array.isArray(products) || !products.length) fetchData("products")
    if (!Array.isArray(stockRoutes) || !stockRoutes.length) fetchData("stockRoutes")
    ;(async () => {
      try {
        const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/currencies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
        const data = await res.json().catch(() => ({}))
        const cur = Array.isArray(data?.currencies) ? data.currencies[0] : null
        if (cur?.symbol) setCurrencySymbol(cur.symbol)
      } catch {}
    })()
    ;(async () => {
      try {
        if (!sessionId) return
        const [cc, ss, zz, tt] = await Promise.all([
          fetch(`${API_CONFIG.BACKEND_BASE_URL}/countries`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          }),
          fetch(`${API_CONFIG.BACKEND_BASE_URL}/states`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          }),
          fetch(`${API_CONFIG.BACKEND_BASE_URL}/zip-prefixes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          }),
          fetch(`${API_CONFIG.BACKEND_BASE_URL}/product-tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          }),
        ])
        const [cjson, sjson, zjson, tjson] = await Promise.all([
          cc.json().catch(() => ({})),
          ss.json().catch(() => ({})),
          zz.json().catch(() => ({})),
          tt.json().catch(() => ({})),
        ])
        if (cjson?.countries) setCountries(cjson.countries)
        if (sjson?.states) setStatesList(sjson.states)
        if (zjson?.zipPrefixes) setZipPrefixes(zjson.zipPrefixes)
        if (tjson?.productTags) setProductTags(tjson.productTags)
      } catch {}
    })()
  }, [sessionId])

  const totalMethods = carriers.length
  const publishedMethods = carriers.filter((m: any) => m.website_published || m.active !== false).length
  const averagePrice = useMemo(() => {
    const list = Array.isArray(carriers) ? carriers : []
    if (!list.length) return "0.00"
    const sum = list.reduce((acc: number, c: any) => acc + Number(c.fixed_price || 0), 0)
    return (sum / list.length).toFixed(2)
  }, [carriers])
  const mostUsedProvider = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of carriers) counts[c.delivery_type || "fixed"] = (counts[c.delivery_type || "fixed"] || 0) + 1
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "fixed"
    return best === "base_on_rule" ? t("Based on Rules") : t("Fixed Price")
  }, [carriers, t])

  const openModal = async (method?: any) => {
    if (method) {
      setSelectedMethod(method)
      setFormData({
        name: method.name || "",
        delivery_type: method.delivery_type || "fixed",
        route_ids: (Array.isArray(method.route_ids) ? method.route_ids : []).map((id: any) =>
          String(Array.isArray(id) ? id[0] : id),
        ),
        margin: String(method.margin ?? ""),
        fixed_margin: String(method.fixed_margin ?? ""),
        product_id: String(Array.isArray(method.product_id) ? method.product_id[0] : method.product_id || ""),
        tracking_url: method.tracking_url || "",
        country_ids: (Array.isArray(method.country_ids) ? method.country_ids : []).map((id: any) =>
          String(Array.isArray(id) ? id[0] : id),
        ),
        state_ids: (Array.isArray(method.state_ids) ? method.state_ids : []).map((id: any) =>
          String(Array.isArray(id) ? id[0] : id),
        ),
        zip_prefix_ids: (Array.isArray(method.zip_prefix_ids) ? method.zip_prefix_ids : []).map((id: any) =>
          String(Array.isArray(id) ? id[0] : id),
        ),
        max_weight: String(method.max_weight ?? ""),
        max_volume: String(method.max_volume ?? ""),
        must_have_tag_ids: (Array.isArray(method.must_have_tag_ids) ? method.must_have_tag_ids : []).map((id: any) =>
          String(Array.isArray(id) ? id[0] : id),
        ),
        excluded_tag_ids: (Array.isArray(method.excluded_tag_ids) ? method.excluded_tag_ids : []).map((id: any) =>
          String(Array.isArray(id) ? id[0] : id),
        ),
        website_description: method.website_description || "",
        carrier_description: method.carrier_description || "",
      })
    } else {
      setSelectedMethod(null)
      setFormData({
        name: "",
        delivery_type: "fixed",
        route_ids: [],
        margin: "",
        fixed_margin: "",
        product_id: "",
        tracking_url: "",
        country_ids: [],
        state_ids: [],
        zip_prefix_ids: [],
        max_weight: "",
        max_volume: "",
        must_have_tag_ids: [],
        excluded_tag_ids: [],
        website_description: "",
        carrier_description: "",
      })
    }
    setActiveTab("general")
    setIsModalOpen(true)
    const carrierId = method?.id
    if (carrierId && sessionId) {
      try {
        setRulesRefreshing(true)
        const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/delivery-price-rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, carrier_id: carrierId }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.success) setRules(data.deliveryPriceRules || [])
      } finally {
        setRulesRefreshing(false)
      }
    } else {
      setRules([])
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedMethod(null)
  }

  const handleSave = async () => {
    if (!sessionId) return
    const values: any = {
      name: formData.name,
      delivery_type: formData.delivery_type,
      route_ids: Array.isArray(formData.route_ids)
        ? [[6, 0, formData.route_ids.map((x: string) => Number(x))]]
        : undefined,
      margin: formData.margin === "" ? 0 : Number(formData.margin),
      fixed_margin: formData.fixed_margin === "" ? 0 : Number(formData.fixed_margin),
      product_id: formData.product_id ? Number(formData.product_id) : false,
      tracking_url: formData.tracking_url || "",
      country_ids: Array.isArray(formData.country_ids)
        ? [[6, 0, formData.country_ids.map((x: string) => Number(x))]]
        : undefined,
      state_ids: Array.isArray(formData.state_ids)
        ? [[6, 0, formData.state_ids.map((x: string) => Number(x))]]
        : undefined,
      zip_prefix_ids: Array.isArray(formData.zip_prefix_ids)
        ? [[6, 0, formData.zip_prefix_ids.map((x: string) => Number(x))]]
        : undefined,
      max_weight: formData.max_weight === "" ? 0 : Number(formData.max_weight),
      max_volume: formData.max_volume === "" ? 0 : Number(formData.max_volume),
      must_have_tag_ids: Array.isArray(formData.must_have_tag_ids)
        ? [[6, 0, formData.must_have_tag_ids.map((x: string) => Number(x))]]
        : undefined,
      excluded_tag_ids: Array.isArray(formData.excluded_tag_ids)
        ? [[6, 0, formData.excluded_tag_ids.map((x: string) => Number(x))]]
        : undefined,
      website_description: formData.website_description || "",
      carrier_description: formData.carrier_description || "",
    }
    const base = API_CONFIG.BACKEND_BASE_URL
    if (selectedMethod?.id) {
      await fetch(`${base}/delivery-carriers/${selectedMethod.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, values }),
      })
    } else {
      await fetch(`${base}/delivery-carriers/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, values }),
      })
    }
    try {
      setRefreshing(true)
      const res = await fetch(`${base}/delivery-carriers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) setCarriers(data.deliveryCarriers || [])
    } finally {
      setRefreshing(false)
    }
    closeModal()
  }

  const filteredMethods = carriers.filter((method: any) =>
    String(method.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  )

  return (
    <div style={{ minHeight: "100vh", background: colors.background, padding: "32px" }}>
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
          @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        `}
      </style>

      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: colors.textPrimary, marginBottom: "8px" }}>
            {t("Delivery Methods")}
          </h1>
          <p style={{ fontSize: "16px", color: colors.textSecondary }}>
            {t("Manage shipping methods and pricing rules")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            title={t("Refresh") as string}
            onClick={async () => {
              if (!sessionId) return
              try {
                setRefreshing(true)
                const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/delivery-carriers`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId }),
                })
                const data = await res.json().catch(() => ({}))
                if (res.ok && data?.success)
                  setCarriers(Array.isArray(data.deliveryCarriers) ? data.deliveryCarriers : [])
              } finally {
                setRefreshing(false)
              }
            }}
            style={{
              background: colors.card,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              padding: "10px",
              borderRadius: "10px",
              cursor: refreshing ? "default" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RefreshCw size={18} style={{ animation: refreshing ? "spin 0.9s linear infinite" : "none" }} />
          </button>
          <button
            onClick={() => openModal()}
            style={{
              background: colors.action,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "12px",
              padding: "14px 28px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.25)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"
            }}
          >
            <Plus size={20} />
            {t("Add Delivery Method")}
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
          label={t("Total Methods")}
          value={totalMethods}
          icon={Truck}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          delay={0}
        />
        <StatCard
          label={t("Published")}
          value={publishedMethods}
          icon={Package}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          delay={1}
        />
        <StatCard
          label={t("Average Price")}
          value={`${currencySymbol}${averagePrice}`}
          icon={DollarSign}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          delay={2}
        />
        <StatCard
          label={t("Most Used Provider")}
          value={mostUsedProvider}
          icon={Globe}
          gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          delay={3}
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <div style={{ position: "relative", maxWidth: "500px" }}>
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.textSecondary,
            }}
          />
          <input
            type="text"
            placeholder={t("Search delivery methods...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px 14px 48px",
              border: `2px solid ${colors.border}`,
              borderRadius: "12px",
              fontSize: "15px",
              outline: "none",
              transition: "all 0.2s ease",
              background: colors.card,
              color: colors.textPrimary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.action
              e.target.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.1)"
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border
              e.target.style.boxShadow = "none"
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1.25rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        }}
      >
        {filteredMethods.map((method, idx) => (
          <DeliveryMethodCard
            key={method.id}
            method={method}
            onClick={() => openModal(method)}
            index={idx}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>

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
            backdropFilter: "blur(4px)",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "20px",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "28px 32px",
                borderBottom: `2px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: colors.card,
              }}
            >
              <div>
                <h2 style={{ fontSize: "26px", fontWeight: "700", color: colors.textPrimary, marginBottom: "4px" }}>
                  {selectedMethod ? t("Edit Delivery Method") : t("Add Delivery Method")}
                </h2>
                <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                  {t("Configure shipping method and pricing rules")}
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: colors.mutedBg,
                  border: "none",
                  borderRadius: "10px",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.border
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.mutedBg
                }}
              >
                <X size={20} style={{ color: colors.textPrimary }} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: "4px",
                padding: "16px 32px",
                borderBottom: `2px solid ${colors.border}`,
                background: colors.mutedBg,
              }}
            >
              {["general", "pricing", "availability", "description"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "10px",
                    background: activeTab === tab ? colors.card : "transparent",
                    color: activeTab === tab ? colors.textPrimary : colors.textSecondary,
                    fontSize: "14px",
                    fontWeight: activeTab === tab ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: activeTab === tab ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "none",
                  }}
                >
                  {t(tab.charAt(0).toUpperCase() + tab.slice(1))}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "32px" }}>
              {activeTab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: colors.textPrimary,
                        marginBottom: 8,
                      }}
                    >
                      {t("Delivery Method Name *")}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t("e.g. UPS Express")}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `2px solid ${colors.border}`,
                        borderRadius: 10,
                        fontSize: 15,
                        outline: "none",
                        background: colors.card,
                        color: colors.textPrimary,
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 14,
                          fontWeight: 600,
                          color: colors.textPrimary,
                          marginBottom: 8,
                        }}
                      >
                        {t("Provider")}
                      </label>
                      <div style={{ position: "relative" }}>
                        <select
                          value={formData.delivery_type}
                          onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `2px solid ${colors.border}`,
                            borderRadius: 10,
                            fontSize: 15,
                            outline: "none",
                            appearance: "none",
                            background: colors.card,
                            cursor: "pointer",
                            color: colors.textPrimary,
                          }}
                        >
                          <option value="base_on_rule">{t("Based on Rules")}</option>
                          <option value="fixed">{t("Fixed Price")}</option>
                        </select>
                        <ChevronDown
                          size={20}
                          style={{
                            position: "absolute",
                            right: 16,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: colors.textSecondary,
                            pointerEvents: "none",
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 14,
                          fontWeight: 600,
                          color: colors.textPrimary,
                          marginBottom: 8,
                        }}
                      >
                        {t("Delivery Product")}
                      </label>
                      <select
                        value={formData.product_id}
                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: `2px solid ${colors.border}`,
                          borderRadius: 10,
                          fontSize: 15,
                          background: colors.card,
                          color: colors.textPrimary,
                        }}
                      >
                        <option value="">{t("Select product")}</option>
                        {(Array.isArray(products) ? products : []).map((p: any) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.display_name || p.name || `#${p.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: colors.textPrimary,
                        marginBottom: 8,
                      }}
                    >
                      {t("Routes")}
                    </label>
                    <div
                      onClick={(e) => {
                        const menu = e.currentTarget.nextSibling as HTMLElement
                        if (menu && menu.dataset.menu === "routes") {
                          const v = menu.getAttribute("data-open") === "true"
                          menu.setAttribute("data-open", (!v).toString())
                          menu.style.display = v ? "none" : "block"
                        }
                      }}
                      style={{
                        width: "100%",
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        minHeight: 42,
                        padding: "6px 8px",
                        background: colors.card,
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                        cursor: "pointer",
                      }}
                    >
                      {(() => {
                        const selected = new Set(formData.route_ids || [])
                        const items = (Array.isArray(stockRoutes) ? stockRoutes : []).filter((rt: any) =>
                          selected.has(String(rt.id)),
                        )
                        if (!items.length)
                          return <span style={{ color: colors.textSecondary, fontSize: 13 }}>{t("Select routes")}</span>
                        return items.map((rt: any) => (
                          <span
                            key={rt.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              border: `1px solid ${colors.border}`,
                              borderRadius: 999,
                              padding: "2px 8px",
                              fontSize: 12,
                              color: colors.textPrimary,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {rt.display_name || rt.name || `#${rt.id}`}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData({
                                  ...formData,
                                  route_ids: (formData.route_ids || []).filter((id: string) => id !== String(rt.id)),
                                })
                              }}
                              style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                color: colors.textSecondary,
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))
                      })()}
                    </div>
                    <div
                      data-menu="routes"
                      data-open="false"
                      style={{
                        display: "none",
                        position: "relative",
                        zIndex: 10,
                        marginTop: 4,
                        width: "100%",
                        maxHeight: 220,
                        overflow: "auto",
                        background: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      }}
                    >
                      {(Array.isArray(stockRoutes) ? stockRoutes : []).map((rt: any) => {
                        const checked = (formData.route_ids || []).includes(String(rt.id))
                        return (
                          <label
                            key={rt.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 10px",
                              cursor: "pointer",
                              borderBottom: `1px solid ${colors.border}`,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const id = String(rt.id)
                                const set = new Set(formData.route_ids || [])
                                if (e.target.checked) set.add(id)
                                else set.delete(id)
                                setFormData({ ...formData, route_ids: Array.from(set) })
                              }}
                            />
                            <span style={{ fontSize: 13, color: colors.textPrimary }}>
                              {rt.display_name || rt.name || `#${rt.id}`}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 14,
                          fontWeight: 600,
                          color: colors.textPrimary,
                          marginBottom: 8,
                        }}
                      >
                        {t("Margin on rate")}
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="number"
                          value={formData.margin}
                          onChange={(e) => setFormData({ ...formData, margin: e.target.value.replace(/[^0-9.]/g, "") })}
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            border: `2px solid ${colors.border}`,
                            borderRadius: 10,
                            fontSize: 15,
                            outline: "none",
                            background: colors.card,
                            color: colors.textPrimary,
                          }}
                        />
                        <span style={{ color: colors.textSecondary, fontWeight: 600 }}>%</span>
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 14,
                          fontWeight: 600,
                          color: colors.textPrimary,
                          marginBottom: 8,
                        }}
                      >
                        {t("Additional Margin")}
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="number"
                          value={formData.fixed_margin}
                          onChange={(e) =>
                            setFormData({ ...formData, fixed_margin: e.target.value.replace(/[^0-9.]/g, "") })
                          }
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            border: `2px solid ${colors.border}`,
                            borderRadius: 10,
                            fontSize: 15,
                            outline: "none",
                            background: colors.card,
                            color: colors.textPrimary,
                          }}
                        />
                        <span style={{ color: colors.textSecondary, fontWeight: 600 }}>{currencySymbol}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: colors.textPrimary,
                        marginBottom: 8,
                      }}
                    >
                      {t("Tracking link")}
                    </label>
                    <input
                      type="text"
                      value={formData.tracking_url}
                      onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
                      placeholder={t("e.g. https://example.com/track/<shipment>")}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `2px solid ${colors.border}`,
                        borderRadius: 10,
                        fontSize: 15,
                        outline: "none",
                        background: colors.card,
                        color: colors.textPrimary,
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "pricing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>{t("Pricing Rules")}</div>
                    <button
                      onClick={() =>
                        setNewRuleDrafts((prev) => [
                          ...prev,
                          {
                            id: `new-${Date.now()}`,
                            variable: "weight",
                            operator: "==",
                            max_value: "",
                            list_base_price: "",
                            list_price: "",
                            variable_factor: "weight",
                          },
                        ])
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        background: colors.card,
                        cursor: "pointer",
                        color: colors.textPrimary,
                      }}
                    >
                      <Plus size={16} /> {t("Add line")}
                    </button>
                  </div>

                  <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 0.6fr 0.6fr 1.8fr",
                        gap: 8,
                        padding: "10px 12px",
                        background: colors.mutedBg,
                        borderBottom: `1px solid ${colors.border}`,
                        fontSize: 13,
                        fontWeight: 600,
                        color: colors.textPrimary,
                      }}
                    >
                      <div>{t("Condition")}</div>
                      <div style={{ textAlign: "right" }}>{t("Value")}</div>
                      <div>{t("Cost")}</div>
                      <div>{t("Formula")}</div>
                    </div>
                    {(rulesRefreshing ? [] : rules).map((r: any) => (
                      <div
                        key={r.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.2fr 0.6fr 0.6fr 1.8fr",
                          gap: 8,
                          padding: "10px 12px",
                          borderBottom: `1px solid ${colors.border}`,
                          fontSize: 13,
                          color: colors.textPrimary,
                        }}
                      >
                        <div>
                          {r.variable} {r.operator} {r.max_value}
                        </div>
                        <div style={{ textAlign: "right" }}>{r.max_value}</div>
                        <div>
                          {currencySymbol}
                          {Number(r.list_base_price || 0).toFixed(2)}
                        </div>
                        <div>
                          {currencySymbol}
                          {Number(r.list_base_price || 0).toFixed(2)} + {Number(r.list_price || 0).toFixed(2)} *{" "}
                          {r.variable_factor}
                        </div>
                      </div>
                    ))}

                    {newRuleDrafts.map((d: any) => (
                      <div
                        key={d.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.2fr 0.6fr 0.6fr 1.8fr",
                          gap: 8,
                          padding: "10px 12px",
                          borderBottom: `1px solid ${colors.border}`,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", gap: 8 }}>
                          <select
                            value={d.variable}
                            onChange={(e) =>
                              setNewRuleDrafts((prev) =>
                                prev.map((x) => (x.id === d.id ? { ...x, variable: e.target.value } : x)),
                              )
                            }
                            style={{
                              padding: "8px",
                              border: `1px solid ${colors.border}`,
                              borderRadius: 6,
                              background: colors.card,
                              color: colors.textPrimary,
                            }}
                          >
                            <option value="weight">{t("Weight")}</option>
                            <option value="volume">{t("Volume")}</option>
                            <option value="wv">{t("Weight * Volume")}</option>
                            <option value="price">{t("Price")}</option>
                            <option value="quantity">{t("Quantity")}</option>
                          </select>
                          <select
                            value={d.operator}
                            onChange={(e) =>
                              setNewRuleDrafts((prev) =>
                                prev.map((x) => (x.id === d.id ? { ...x, operator: e.target.value } : x)),
                              )
                            }
                            style={{
                              padding: "8px",
                              border: `1px solid ${colors.border}`,
                              borderRadius: 6,
                              background: colors.card,
                              color: colors.textPrimary,
                            }}
                          >
                            <option value="==">=</option>
                            <option value="<=">{`<=`}</option>
                            <option value="<">{`<`}</option>
                            <option value=">=">{`>=`}</option>
                            <option value=">">{`>`}</option>
                          </select>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <input
                            type="number"
                            value={d.max_value}
                            onChange={(e) =>
                              setNewRuleDrafts((prev) =>
                                prev.map((x) =>
                                  x.id === d.id ? { ...x, max_value: e.target.value.replace(/[^0-9.]/g, "") } : x,
                                ),
                              )
                            }
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: `1px solid ${colors.border}`,
                              borderRadius: 6,
                              textAlign: "right",
                              background: colors.card,
                              color: colors.textPrimary,
                            }}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={d.list_base_price}
                            onChange={(e) =>
                              setNewRuleDrafts((prev) =>
                                prev.map((x) =>
                                  x.id === d.id ? { ...x, list_base_price: e.target.value.replace(/[^0-9.]/g, "") } : x,
                                ),
                              )
                            }
                            placeholder={t("Base")}
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: `1px solid ${colors.border}`,
                              borderRadius: 6,
                              background: colors.card,
                              color: colors.textPrimary,
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="number"
                            value={d.list_price}
                            onChange={(e) =>
                              setNewRuleDrafts((prev) =>
                                prev.map((x) =>
                                  x.id === d.id ? { ...x, list_price: e.target.value.replace(/[^0-9.]/g, "") } : x,
                                ),
                              )
                            }
                            placeholder={t("Coeff.")}
                            style={{
                              width: "120px",
                              padding: "8px",
                              border: `1px solid ${colors.border}`,
                              borderRadius: 6,
                              background: colors.card,
                              color: colors.textPrimary,
                            }}
                          />
                          <span style={{ color: colors.textPrimary }}>*</span>
                          <select
                            value={d.variable_factor}
                            onChange={(e) =>
                              setNewRuleDrafts((prev) =>
                                prev.map((x) => (x.id === d.id ? { ...x, variable_factor: e.target.value } : x)),
                              )
                            }
                            style={{
                              padding: "8px",
                              border: `1px solid ${colors.border}`,
                              borderRadius: 6,
                              background: colors.card,
                              color: colors.textPrimary,
                            }}
                          >
                            <option value="weight">{t("Weight")}</option>
                            <option value="volume">{t("Volume")}</option>
                            <option value="wv">{t("Weight * Volume")}</option>
                            <option value="price">{t("Price")}</option>
                            <option value="quantity">{t("Quantity")}</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                      onClick={async () => {
                        if (!sessionId || !selectedMethod?.id) return
                        try {
                          setRulesRefreshing(true)
                          const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/delivery-price-rules`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sessionId, carrier_id: selectedMethod.id }),
                          })
                          const data = await res.json().catch(() => ({}))
                          if (res.ok && data?.success) setRules(data.deliveryPriceRules || [])
                        } finally {
                          setRulesRefreshing(false)
                        }
                      }}
                      style={{
                        padding: "10px 14px",
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        background: colors.card,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        color: colors.textPrimary,
                      }}
                    >
                      <RefreshCw
                        size={16}
                        style={{ animation: rulesRefreshing ? "spin 0.9s linear infinite" : "none" }}
                      />{" "}
                      {t("Refresh")}
                    </button>
                    {newRuleDrafts.length > 0 && (
                      <button
                        onClick={async () => {
                          if (!sessionId || !selectedMethod?.id) return
                          const base = API_CONFIG.BACKEND_BASE_URL
                          for (const d of newRuleDrafts) {
                            const values: any = {
                              carrier_id: Number(selectedMethod.id),
                              variable: d.variable,
                              operator: d.operator,
                              max_value: d.max_value === "" ? 0 : Number(d.max_value),
                              list_base_price: d.list_base_price === "" ? 0 : Number(d.list_base_price),
                              list_price: d.list_price === "" ? 0 : Number(d.list_price),
                              variable_factor: d.variable_factor,
                            }
                            await fetch(`${base}/delivery-price-rules/create`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ sessionId, values }),
                            })
                          }
                          try {
                            setRulesRefreshing(true)
                            const res = await fetch(`${base}/delivery-price-rules`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ sessionId, carrier_id: selectedMethod.id }),
                            })
                            const data = await res.json().catch(() => ({}))
                            if (res.ok && data?.success) setRules(data.deliveryPriceRules || [])
                            setNewRuleDrafts([])
                          } finally {
                            setRulesRefreshing(false)
                          }
                        }}
                        style={{
                          padding: "10px 14px",
                          border: "none",
                          borderRadius: 8,
                          background: colors.action,
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      >
                        {t("Confirm")}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "availability" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                  <div>
                    <h3
                      style={{ fontSize: "16px", fontWeight: "700", color: colors.textPrimary, marginBottom: "16px" }}
                    >
                      {t("Destination")}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: colors.textPrimary,
                            marginBottom: "8px",
                          }}
                        >
                          {t("Countries")}
                        </label>
                        <div
                          onClick={(e) => {
                            const m = e.currentTarget.nextSibling as HTMLElement
                            if (m?.dataset.menu === "countries") {
                              const v = m.getAttribute("data-open") === "true"
                              m.setAttribute("data-open", (!v).toString())
                              m.style.display = v ? "none" : "block"
                            }
                          }}
                          style={{
                            width: "100%",
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            minHeight: 42,
                            padding: "6px 8px",
                            background: colors.card,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                            cursor: "pointer",
                          }}
                        >
                          {(() => {
                            const ids = new Set(formData.country_ids || [])
                            const items = (countries || []).filter((c: any) => ids.has(String(c.id)))
                            if (!items.length)
                              return (
                                <span style={{ color: colors.textSecondary, fontSize: 13 }}>
                                  {t("Select countries")}
                                </span>
                              )
                            return items.map((c: any) => (
                              <span
                                key={c.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                  fontSize: 12,
                                  color: colors.textPrimary,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {c.name || `#${c.id}`}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setFormData({
                                      ...formData,
                                      country_ids: (formData.country_ids || []).filter(
                                        (x: string) => x !== String(c.id),
                                      ),
                                    })
                                  }}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: colors.textSecondary,
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          })()}
                        </div>
                        <div
                          data-menu="countries"
                          data-open="false"
                          style={{
                            display: "none",
                            position: "relative",
                            zIndex: 10,
                            marginTop: 4,
                            width: "100%",
                            maxHeight: 220,
                            overflow: "auto",
                            background: colors.card,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                          }}
                        >
                          {(countries || []).map((c: any) => {
                            const checked = (formData.country_ids || []).includes(String(c.id))
                            return (
                              <label
                                key={c.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 10px",
                                  cursor: "pointer",
                                  borderBottom: `1px solid ${colors.border}`,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const id = String(c.id)
                                    const set = new Set(formData.country_ids || [])
                                    if (e.target.checked) set.add(id)
                                    else set.delete(id)
                                    setFormData({ ...formData, country_ids: Array.from(set) })
                                  }}
                                />
                                <span style={{ fontSize: 13, color: colors.textPrimary }}>{c.name || `#${c.id}`}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: colors.textPrimary,
                            marginBottom: "8px",
                          }}
                        >
                          {t("States")}
                        </label>
                        <div
                          onClick={(e) => {
                            const m = e.currentTarget.nextSibling as HTMLElement
                            if (m?.dataset.menu === "states") {
                              const v = m.getAttribute("data-open") === "true"
                              m.setAttribute("data-open", (!v).toString())
                              m.style.display = v ? "none" : "block"
                            }
                          }}
                          style={{
                            width: "100%",
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            minHeight: 42,
                            padding: "6px 8px",
                            background: colors.card,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                            cursor: "pointer",
                          }}
                        >
                          {(() => {
                            const ids = new Set(formData.state_ids || [])
                            const items = (statesList || []).filter((s: any) => ids.has(String(s.id)))
                            if (!items.length)
                              return (
                                <span style={{ color: colors.textSecondary, fontSize: 13 }}>{t("Select states")}</span>
                              )
                            return items.map((s: any) => (
                              <span
                                key={s.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                  fontSize: 12,
                                  color: colors.textPrimary,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(s.name || `#${s.id}`) + (s.code ? ` (${s.code})` : "")}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setFormData({
                                      ...formData,
                                      state_ids: (formData.state_ids || []).filter((x: string) => x !== String(s.id)),
                                    })
                                  }}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: colors.textSecondary,
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          })()}
                        </div>
                        <div
                          data-menu="states"
                          data-open="false"
                          style={{
                            display: "none",
                            position: "relative",
                            zIndex: 10,
                            marginTop: 4,
                            width: "100%",
                            maxHeight: 220,
                            overflow: "auto",
                            background: colors.card,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                          }}
                        >
                          {(statesList || []).map((s: any) => {
                            const checked = (formData.state_ids || []).includes(String(s.id))
                            return (
                              <label
                                key={s.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 10px",
                                  cursor: "pointer",
                                  borderBottom: `1px solid ${colors.border}`,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const id = String(s.id)
                                    const set = new Set(formData.state_ids || [])
                                    if (e.target.checked) set.add(id)
                                    else set.delete(id)
                                    setFormData({ ...formData, state_ids: Array.from(set) })
                                  }}
                                />
                                <span style={{ fontSize: 13, color: colors.textPrimary }}>
                                  {(s.name || `#${s.id}`) + (s.code ? ` (${s.code})` : "")}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: colors.textPrimary,
                            marginBottom: "8px",
                          }}
                        >
                          {t("Zip prefixes")}
                        </label>
                        <div
                          onClick={(e) => {
                            const m = e.currentTarget.nextSibling as HTMLElement
                            if (m?.dataset.menu === "zip") {
                              const v = m.getAttribute("data-open") === "true"
                              m.setAttribute("data-open", (!v).toString())
                              m.style.display = v ? "none" : "block"
                            }
                          }}
                          style={{
                            width: "100%",
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            minHeight: 42,
                            padding: "6px 8px",
                            background: colors.card,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                            cursor: "pointer",
                          }}
                        >
                          {(() => {
                            const ids = new Set(formData.zip_prefix_ids || [])
                            const items = (zipPrefixes || []).filter((z: any) => ids.has(String(z.id)))
                            if (!items.length)
                              return (
                                <span style={{ color: colors.textSecondary, fontSize: 13 }}>
                                  {t("Select zip prefixes")}
                                </span>
                              )
                            return items.map((z: any) => (
                              <span
                                key={z.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                  fontSize: 12,
                                  color: colors.textPrimary,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {z.name || z.prefix || `#${z.id}`}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setFormData({
                                      ...formData,
                                      zip_prefix_ids: (formData.zip_prefix_ids || []).filter(
                                        (x: string) => x !== String(z.id),
                                      ),
                                    })
                                  }}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: colors.textSecondary,
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          })()}
                        </div>
                        <div
                          data-menu="zip"
                          data-open="false"
                          style={{
                            display: "none",
                            position: "relative",
                            zIndex: 10,
                            marginTop: 4,
                            width: "100%",
                            maxHeight: 220,
                            overflow: "auto",
                            background: colors.card,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                          }}
                        >
                          {(zipPrefixes || []).map((z: any) => {
                            const checked = (formData.zip_prefix_ids || []).includes(String(z.id))
                            return (
                              <label
                                key={z.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 10px",
                                  cursor: "pointer",
                                  borderBottom: `1px solid ${colors.border}`,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const id = String(z.id)
                                    const set = new Set(formData.zip_prefix_ids || [])
                                    if (e.target.checked) set.add(id)
                                    else set.delete(id)
                                    setFormData({ ...formData, zip_prefix_ids: Array.from(set) })
                                  }}
                                />
                                <span style={{ fontSize: 13, color: colors.textPrimary }}>
                                  {z.name || z.prefix || `#${z.id}`}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3
                      style={{ fontSize: "16px", fontWeight: "700", color: colors.textPrimary, marginBottom: "16px" }}
                    >
                      {t("Capacity")}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: colors.textPrimary,
                            marginBottom: "8px",
                          }}
                        >
                          {t("Max weight (kg)")}
                        </label>
                        <input
                          type="number"
                          value={formData.max_weight}
                          onChange={(e) =>
                            setFormData({ ...formData, max_weight: e.target.value.replace(/[^0-9.]/g, "") })
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `2px solid ${colors.border}`,
                            borderRadius: "10px",
                            fontSize: "15px",
                            outline: "none",
                            background: colors.card,
                            color: colors.textPrimary,
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: colors.textPrimary,
                            marginBottom: "8px",
                          }}
                        >
                          {t("Max volume (m³)")}
                        </label>
                        <input
                          type="number"
                          value={formData.max_volume}
                          onChange={(e) =>
                            setFormData({ ...formData, max_volume: e.target.value.replace(/[^0-9.]/g, "") })
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `2px solid ${colors.border}`,
                            borderRadius: "10px",
                            fontSize: "15px",
                            outline: "none",
                            background: colors.card,
                            color: colors.textPrimary,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: colors.mutedBg,
                      padding: "16px",
                      borderRadius: "10px",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <p style={{ fontSize: "14px", color: colors.textSecondary, lineHeight: "1.6" }}>
                      {t(
                        "Configure availability rules to make this shipping method available according to the order content or destination.",
                      )}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "description" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: "8px",
                    }}
                  >
                    {t("Description")}
                  </label>
                  <textarea
                    value={formData.website_description}
                    onChange={(e) => setFormData({ ...formData, website_description: e.target.value })}
                    placeholder={t("Add a description for this delivery method...")}
                    rows={8}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `2px solid ${colors.border}`,
                      borderRadius: "10px",
                      fontSize: "15px",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                      background: colors.card,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
              )}
            </div>

            <div
              style={{
                padding: "20px 32px",
                borderTop: `2px solid ${colors.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                background: colors.mutedBg,
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: "12px 24px",
                  border: `2px solid ${colors.border}`,
                  borderRadius: "10px",
                  background: colors.card,
                  color: colors.textPrimary,
                  fontSize: "15px",
                  fontWeight: "600",
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
                onClick={handleSave}
                style={{
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: "10px",
                  background: colors.action,
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                {selectedMethod ? t("Save Changes") : t("Create Method")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
