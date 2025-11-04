"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import Toast from "./components/Toast"
import { FileText, MapPin, Package, Building2, Plus } from "lucide-react"
import { StatCard } from "./components/StatCard"
import { PutawayCard } from "./components/PutawayCard"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function PutawaysRulesPage() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { putawayRules, products, productTemplates, storageCategories, packageTypes, locations, fetchData } =
    useData() as any
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<any>(null)
  const [inLocId, setInLocId] = useState<string>("")
  const [outLocId, setOutLocId] = useState<string>("")
  const [sublocation, setSublocation] = useState<string>("no")
  const [productId, setProductId] = useState<string>("")
  const [pkgTypeIds, setPkgTypeIds] = useState<string[]>([])
  const [storageCatId, setStorageCatId] = useState<string>("")
  const [companyId, setCompanyId] = useState<string>("")
  const [toast, setToast] = useState<{ text: string; state: "success" | "error" } | null>(null)

  // Helpers to safely display Odoo values
  const m2oName = (v: any): string => {
    if (Array.isArray(v)) return String(v[1] ?? v[0] ?? "")
    if (v && typeof v === "object") return String(v.display_name ?? v.name ?? "")
    return v == null ? "" : String(v)
  }
  const asDataUrl = (img?: string | null): string | null => {
    if (!img || typeof img !== "string") return null
    return img.startsWith("data:") ? img : `data:image/png;base64,${img}`
  }

  const productImageFromCatalog = (productId?: number | null, productName?: string | null): string | null => {
    const list = Array.isArray(products) ? products : []
    let found: any | undefined
    if (productId) found = list.find((p: any) => p?.id === productId)
    if (!found && productName) {
      const name = String(productName).trim().toLowerCase()
      found = list.find(
        (p: any) =>
          String(p?.display_name || p?.name || "")
            .trim()
            .toLowerCase() === name,
      )
    }
    return asDataUrl(found?.image_1920)
  }

  const tryImage = (rule: any): string | null => {
    const possible = [
      rule?.product_image,
      rule?.image_128,
      rule?.product_id?.image_128,
      rule?.product_tmpl_id?.image_128,
    ]
    const img = possible.find((x) => typeof x === "string" && x.length > 50) as string | undefined
    return asDataUrl(img || null)
  }
  const selectionText = (v: any): string => {
    if (typeof v === "string") return v
    if (Array.isArray(v)) return String(v[1] ?? v[0] ?? "")
    return v == null ? "" : String(v)
  }
  const m2mNames = (v: any): string[] => {
    if (Array.isArray(v)) {
      if (v.length && Array.isArray(v[0])) return v.map((x: any) => String(x[1] ?? x[0]))
      return v.map((x) => String(x))
    }
    return []
  }

  // Derive UI records with the requested fields, but keep raw as fallback
  const uiRules = useMemo(() => {
    const list = Array.isArray(putawayRules) ? putawayRules : []
    return list.map((r: any) => {
      const from = m2oName(r.location_in_id ?? r.location_id)
      const to = m2oName(r.location_out_id ?? r.putaway_location_id)
      const productId = Array.isArray(r.product_id) ? Number(r.product_id[0]) : null
      const productName = m2oName(r.product_id ?? r.product_tmpl_id)
      const productImg = productImageFromCatalog(productId, productName) || tryImage(r)
      const pkgNames = m2mNames(r.package_type_ids)
      const subloc = selectionText(r.sublocation)
      const storageCat = m2oName(r.storage_category_id)
      const company = m2oName(r.company_id)
      return {
        id: r.id,
        title: r?.id ? `${t("Putaway Rule")} #${r.id}` : t("Putaway Rule"),
        from,
        to,
        productName,
        productImg,
        pkgNames,
        subloc,
        storageCat,
        company,
        raw: r,
      }
    })
  }, [putawayRules, products, t])

  // no chart data used on this page

  const filteredRules = uiRules.filter((rule: any) => {
    try {
      const hay = JSON.stringify(rule.raw || rule).toLowerCase()
      return hay.includes(searchQuery.toLowerCase())
    } catch {
      return false
    }
  })

  const totalRules = uiRules.length
  const activeRules = uiRules.filter((r: any) => r.from && r.to).length
  const uniqueProducts = new Set(uiRules.map((r: any) => r.productName).filter(Boolean)).size
  const uniqueLocations = new Set(uiRules.flatMap((r: any) => [r.from, r.to]).filter(Boolean)).size

  const handleCardClick = (rule: any) => {
    setSelectedRule(rule)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setSelectedRule(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRule(null)
  }

  // Initialize form state when opening modal
  useEffect(() => {
    if (isModalOpen && selectedRule) {
      const inId = Array.isArray(selectedRule.location_in_id) ? String(selectedRule.location_in_id[0]) : ""
      const outId = Array.isArray(selectedRule.location_out_id) ? String(selectedRule.location_out_id[0]) : ""
      setInLocId(inId)
      setOutLocId(outId)
      const sub = typeof selectedRule.sublocation === "string" ? selectedRule.sublocation : "no"
      setSublocation(sub)
      setProductId(Array.isArray(selectedRule.product_id) ? String(selectedRule.product_id[0]) : "")
      setPkgTypeIds(
        Array.isArray(selectedRule.package_type_ids)
          ? selectedRule.package_type_ids.map((x: any) => String(Array.isArray(x) ? x[0] : x)).filter(Boolean)
          : [],
      )
      setStorageCatId(
        Array.isArray(selectedRule.storage_category_id) ? String(selectedRule.storage_category_id[0]) : "",
      )
      setCompanyId(Array.isArray(selectedRule.company_id) ? String(selectedRule.company_id[0]) : "")
    } else {
      setInLocId("")
      setOutLocId("")
      setSublocation("no")
      setProductId("")
      setPkgTypeIds([])
      setStorageCatId("")
      setCompanyId("")
    }
  }, [isModalOpen, selectedRule])

  const getSessionId = () => localStorage.getItem("sessionId") || sessionStorage.getItem("sessionId")

  const handleSaveRule = async () => {
    try {
      const sessionId = getSessionId()
      if (!sessionId) throw new Error("No session ID found")

      const values: any = {}
      if (inLocId) values.location_in_id = Number(inLocId)
      if (outLocId) values.location_out_id = Number(outLocId)
      if (sublocation) values.sublocation = sublocation
      if (productId) values.product_id = Number(productId)
      if (Array.isArray(pkgTypeIds) && pkgTypeIds.length)
        values.package_type_ids = pkgTypeIds.map((x) => Number(x)).filter(Number.isInteger)
      if (storageCatId) values.storage_category_id = Number(storageCatId)
      if (companyId) values.company_id = Number(companyId)
      let ok = false
      let message = ""
      if (selectedRule?.id) {
        const res = await fetch(`http://localhost:3000/api/putaway-rules/${selectedRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, values }),
        })
        const data = await res.json().catch(async () => ({ message: await res.text().catch(() => "") }))
        ok = res.ok && !!data.success
        message = data?.message || ""
        if (!ok) throw new Error(message || "Update failed")
      } else {
        const res = await fetch(`http://localhost:3000/api/putaway-rules/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, values }),
        })
        const data = await res.json().catch(async () => ({ message: await res.text().catch(() => "") }))
        ok = res.ok && (!!data.success || Number.isInteger(data?.id))
        message = data?.message || ""
        if (!ok) throw new Error(message || "Create failed")
      }

      // Refresh list and notify
      await fetchData("putawayRules")
      setToast({
        text: selectedRule?.id ? "Putaway rule updated successfully" : "Putaway rule created successfully",
        state: "success",
      })
      handleCloseModal()
    } catch (e: any) {
      setToast({ text: e?.message || "Failed to update putaway rule", state: "error" })
    }
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
        `}
      </style>

      <div className="mx-auto max-w-[1600px] space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t("Putaway Rules")}
            </h1>
            <p className="mt-2 text-lg" style={{ color: colors.textSecondary }}>
              {t("Manage automatic product routing to storage locations")}
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="text-white transition-all shadow-lg hover:shadow-xl h-11 px-6 rounded-xl font-semibold flex items-center gap-2"
            style={{ background: colors.action }}
          >
            <Plus size={20} /> {t("Add Putaway Rule")}
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <StatCard
            label={t("Total Rules")}
            value={totalRules}
            icon={FileText}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={0}
          />
          <StatCard
            label={t("Active Rules")}
            value={activeRules}
            icon={MapPin}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            delay={1}
          />
          <StatCard
            label={t("Products")}
            value={uniqueProducts}
            icon={Package}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            delay={2}
          />
          <StatCard
            label={t("Locations")}
            value={uniqueLocations}
            icon={Building2}
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            delay={3}
          />
        </div>

        <Card className="border-none shadow-lg" style={{ background: colors.card }}>
          <CardContent className="p-6">
            <div className="relative max-w-[480px]">
              <Input
                type="text"
                placeholder={t("Search putaway rules...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-base transition-all focus:ring-2"
                style={{
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.textPrimary,
                }}
              />
              <svg
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "18px",
                  height: "18px",
                  color: colors.textSecondary,
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
          }}
        >
          {filteredRules.map((rule: any, index: number) => (
            <PutawayCard
              key={rule.id ?? index}
              rule={rule}
              onClick={() => handleCardClick(rule.raw)}
              index={index}
              colors={colors}
              t={t}
            />
          ))}
        </div>

        {filteredRules.length === 0 && (
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
              {t("No putaway rules found")}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
              {t("Try adjusting your search term or create a new rule")}
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "1rem",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(10, 25, 49, 0.3)",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${colors.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "1rem 1.5rem",
                background: "#FFFFFF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#667eea", margin: 0 }}>
                {selectedRule ? t("Edit Putaway Rule") : t("New Putaway Rule")}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  fontSize: "1.5rem",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  padding: "0.25rem 0.5rem",
                  lineHeight: 1,
                  borderRadius: 6,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "1.25rem", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "4px",
                    height: "20px",
                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    borderRadius: "2px",
                  }}
                />
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.textPrimary,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    margin: 0,
                  }}
                >
                  {t("Rule Configuration")}
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* When product arrives in */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.375rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("When product arrives in")}
                  </label>
                  <select
                    value={inLocId}
                    onChange={(e) => setInLocId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="">{t("Select location...")}</option>
                    {(Array.isArray(locations) ? locations : []).map((loc: any) => (
                      <option key={loc.id} value={String(loc.id)}>
                        {loc.complete_name ||
                          (Array.isArray(loc.display_name)
                            ? loc.display_name[1]
                            : loc.display_name || loc.name || loc.id)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.375rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("Product")}
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="">{t("All Products")}</option>
                    {(Array.isArray(productTemplates) ? productTemplates : []).map((p: any) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.display_name || p.name || `#${p.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Category (read-only) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.375rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("Product Category")}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={(() => {
                      const p = (Array.isArray(productTemplates) ? productTemplates : []).find(
                        (x: any) => String(x.id) === productId,
                      )
                      const cat = Array.isArray(p?.categ_id)
                        ? p.categ_id[1]
                        : p?.categ_id?.display_name || p?.categ_id?.name
                      return cat || ""
                    })()}
                    placeholder={""}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      background: colors.mutedBg,
                      color: colors.textSecondary,
                    }}
                  />
                </div>

                {/* Package Type (many2many) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.375rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("Package Type")}
                  </label>
                  <select
                    multiple
                    value={pkgTypeIds}
                    onChange={(e) => {
                      const opts = Array.from(e.target.selectedOptions).map((o) => o.value)
                      setPkgTypeIds(opts)
                    }}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      minHeight: "3rem",
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  >
                    {(Array.isArray(packageTypes) ? packageTypes : []).map((pt: any) => (
                      <option key={pt.id} value={String(pt.id)}>
                        {pt.display_name || pt.name || `#${pt.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Store To */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.375rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("Store To")}
                  </label>
                  <select
                    value={outLocId}
                    onChange={(e) => setOutLocId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="">{t("Select location...")}</option>
                    {(Array.isArray(locations) ? locations : []).map((loc: any) => (
                      <option key={loc.id} value={String(loc.id)}>
                        {loc.complete_name ||
                          (Array.isArray(loc.display_name)
                            ? loc.display_name[1]
                            : loc.display_name || loc.name || loc.id)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sublocation */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.375rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("Sublocation")}
                  </label>
                  <select
                    value={sublocation}
                    onChange={(e) => setSublocation(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="no">{t("No")}</option>
                    <option value="last_used">{t("Last Used")}</option>
                    <option value="closest_location">{t("Closest Location")}</option>
                  </select>
                </div>

                {/* Having Category */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.375rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("Having Category")}
                  </label>
                  <select
                    value={storageCatId}
                    onChange={(e) => setStorageCatId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="">{t("Select storage category...")}</option>
                    {(Array.isArray(storageCategories) ? storageCategories : []).map((c: any) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.display_name || c.name || `#${c.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: "0.375rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("Company")}
                  </label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="">{t("Select company...")}</option>
                    {(() => {
                      const uniq = new Map<string, string>()
                      for (const r of Array.isArray(putawayRules) ? putawayRules : []) {
                        const id = Array.isArray(r.company_id)
                          ? String(r.company_id[0])
                          : Number.isInteger(r.company_id)
                            ? String(r.company_id)
                            : ""
                        const name = Array.isArray(r.company_id)
                          ? String(r.company_id[1])
                          : r.company_id?.display_name || r.company_id?.name
                        if (id && name && !uniq.has(id)) uniq.set(id, name)
                      }
                      return Array.from(uniq.entries()).map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))
                    })()}
                  </select>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "1rem 1.25rem",
                borderTop: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                background: colors.card,
              }}
            >
              <button
                onClick={handleCloseModal}
                style={{
                  padding: "0.6rem 1.5rem",
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.textPrimary,
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.mutedBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = colors.background)}
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleSaveRule}
                style={{
                  padding: "0.6rem 1.5rem",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#FFFFFF",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(102, 126, 234, 0.3)"
                }}
              >
                {selectedRule ? t("Save Changes") : t("Create Rule")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast text={toast.text} state={toast.state} onClose={() => setToast(null)} />}
    </div>
  )
}
