"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Package, Boxes, Weight, TrendingUp, Plus, RefreshCcw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { useAuth } from "../context/auth"
import { StatCard } from "./components/StatCard"
import { PackageCard } from "./components/PackageCard"
import { API_CONFIG } from "./config/api"

type PackageRecord = any

export default function PackagesPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()
  const { packages, loading, fetchData, packageTypes, locations, partners } = useData() as any
  const { sessionId } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [packageTypeFilter, setPackageTypeFilter] = useState<string>("all")
  const [ownerFilter, setOwnerFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<any>({ name: "", package_type_id: null, owner_id: null, location_id: null })

  useEffect(() => {
    if (!sessionId) return
    if (!loading?.packageTypes && (!packageTypes || packageTypes.length === 0)) {
      fetchData("packageTypes")
    }
    if (!loading?.packages && (!packages || packages.length === 0)) {
      fetchData("packages")
    }
  }, [sessionId])

  const uiPackages: PackageRecord[] = useMemo(() => {
    if (!packages) return []
    const typesById = new Map<number, any>()
    for (const pt of (packageTypes || [])) typesById.set(pt.id, pt)
    return (packages || []).map((p: any) => {
      const typeId = Array.isArray(p.package_type_id) ? p.package_type_id[0] : p.package_type_id
      const pt = typesById.get(typeId)
      if (!pt) return p
      return {
        ...p,
        // flatten selected fields from package type so the card can read them directly
        shipping_weight: pt.shipping_weight ?? pt.base_weight ?? pt.weight,
        weight: pt.weight ?? pt.base_weight ?? pt.shipping_weight,
        base_weight: pt.base_weight ?? pt.weight ?? pt.shipping_weight,
        max_weight: pt.max_weight,
        width: pt.width,
        height: pt.height,
        packaging_length: pt.packaging_length ?? pt.length ?? pt.pack_length,
        weight_uom_name: pt.weight_uom_name,
        length_uom_name: pt.length_uom_name,
        barcode: p.barcode ?? pt.barcode,
        display_name: p.display_name || p.name,
      }
    })
  }, [packages, packageTypes])

  const filteredPackages = uiPackages.filter((pkg: any) => {
    const title = (pkg.display_name || pkg.name || "").toLowerCase()
    const barcode = (pkg.barcode || "").toLowerCase()
    const q = searchQuery.toLowerCase()
    const matchesSearch = title.includes(q) || barcode.includes(q)
    // Model doesn't expose status/type/owner consistently here, keep filters as pass-through
    const matchesStatus = true
    const matchesType = true
    const matchesOwner = true
    return matchesSearch && matchesStatus && matchesType && matchesOwner
  })

  const totalPackages = uiPackages.length
  const totalWeight = uiPackages.reduce((sum: number, pkg: any) => {
    const w = pkg?.shipping_weight ?? pkg?.weight ?? pkg?.base_weight
    return sum + (Number(w) || 0)
  }, 0)
  const packedPackages = 0
  const inTransitPackages = 0

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
        `}
      </style>

      <div className="mx-auto max-w-[1600px] space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t("Packages")}
            </h1>
            <p className="mt-2 text-lg" style={{ color: colors.textSecondary }}>
              {t("Manage and track your package references")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => fetchData("packages")}
              disabled={!!loading?.packages}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: colors.card, color: colors.textPrimary, borderColor: colors.border }}
            >
              <RefreshCcw className={`w-4 h-4 ${loading?.packages ? "animate-spin" : ""}`} />
              {loading?.packages ? t("Loading...") : t("Refresh")}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all shadow-sm"
              style={{ background: colors.action }}
            >
              <Plus className="w-4 h-4" /> {t("Add Package")}
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
            label={t("Total Packages")}
            value={totalPackages}
            icon={Package}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={0}
          />
          <StatCard
            label={t("Packed Packages")}
            value={packedPackages}
            icon={Boxes}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            delay={1}
          />
          <StatCard
            label={t("Total Weight")}
            value={`${totalWeight.toFixed(1)} kg`}
            icon={Weight}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            delay={2}
          />
          <StatCard
            label={t("In Transit")}
            value={inTransitPackages}
            icon={TrendingUp}
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
                  placeholder={t("Search packages...")}
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Statuses")}</SelectItem>
                  <SelectItem value="Packed">{t("Packed")}</SelectItem>
                  <SelectItem value="In Transit">{t("In Transit")}</SelectItem>
                  <SelectItem value="Delivered">{t("Delivered")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Package Type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Types")}</SelectItem>
                  <SelectItem value="Standard Box">{t("Standard Box")}</SelectItem>
                  <SelectItem value="Small Box">{t("Small Box")}</SelectItem>
                  <SelectItem value="Large Box">{t("Large Box")}</SelectItem>
                  <SelectItem value="Pallet">{t("Pallet")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Owner")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Owners")}</SelectItem>
                  <SelectItem value="Main Warehouse">{t("Main Warehouse")}</SelectItem>
                  <SelectItem value="Secondary Warehouse">{t("Secondary Warehouse")}</SelectItem>
                </SelectContent>
              </Select>
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
          {filteredPackages.map((pkg: any, idx: number) => (
            <PackageCard key={pkg.id} pkg={pkg} onClick={() => {}} index={idx} />
          ))}
        </div>

        {filteredPackages.length === 0 && (
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
              {t("No packages found")}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
              {t("No packages match your search criteria. Try adjusting your filters or search terms.")}
            </p>
          </div>
        )}

        {/* Create Modal */}
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              style={{
                background: colors.card,
                borderRadius: 12,
                width: "100%",
                maxWidth: 520,
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                border: `1px solid ${colors.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary }}>{t("Add Package")}</div>
                  <div style={{ fontSize: "0.8125rem", color: colors.textSecondary }}>{t("Create a new package")}</div>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ border: "none", background: colors.background, borderRadius: 8, padding: 8 }}>✕</button>
              </div>
              <div style={{ padding: "0.75rem 1rem", display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>{t("Reference")}</div>
                  <Input value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} style={{ borderColor: colors.border, background: colors.background, color: colors.textPrimary }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>{t("Package Type")}</div>
                  <select
                    value={form.package_type_id || ""}
                    onChange={(e) => setForm((p: any) => ({ ...p, package_type_id: Number(e.target.value) || null }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary }}
                  >
                    <option value="">{t("Select")}</option>
                    {(packageTypes || []).map((pt: any) => (
                      <option key={pt.id} value={pt.id}>{pt.name || pt.display_name || `#${pt.id}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>{t("Owner")}</div>
                  <select
                    value={form.owner_id || ""}
                    onChange={(e) => setForm((p: any) => ({ ...p, owner_id: Number(e.target.value) || null }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary }}
                  >
                    <option value="">{t("Select")}</option>
                    {(partners || []).map((pt: any) => (
                      <option key={pt.id} value={pt.id}>{pt.name || `#${pt.id}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>{t("Location")}</div>
                  <select
                    value={form.location_id || ""}
                    onChange={(e) => setForm((p: any) => ({ ...p, location_id: Number(e.target.value) || null }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary }}
                  >
                    <option value="">{t("Select")}</option>
                    {(locations || []).map((lc: any) => (
                      <option key={lc.id} value={lc.id}>{lc.complete_name || lc.display_name || lc.name || `#${lc.id}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm rounded-lg border" style={{ background: colors.card, color: colors.textSecondary, borderColor: colors.border }}>{t("Close")}</button>
                <button
                  onClick={async () => {
                    if (!sessionId) return
                    const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/quant-packages/create`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sessionId, values: form }),
                    })
                    const j = await res.json().catch(() => ({}))
                    if (res.ok && j?.success) {
                      await fetchData("packages")
                      setIsModalOpen(false)
                      setForm({ name: "", package_type_id: null, owner_id: null, location_id: null })
                    }
                  }}
                  className="px-4 py-2 text-sm rounded-lg text-white"
                  style={{ background: colors.action }}
                >
                  {t("Create")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
