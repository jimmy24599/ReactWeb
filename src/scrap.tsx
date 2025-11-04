"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Package,
  X,
  Edit,
  Filter,
  RefreshCcw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { ScrapCard } from "./components/ScrapCard"
import { StatCard } from "./components/StatCard"
import { SyncLoader } from "react-spinners"
import { useAuth } from "../context/auth"

// Helper: map stock.scrap to UI card shape used in this page
type ScrapCardItem = {
  id: number
  reference: string
  date: string
  product: string
  quantity: number
  unitOfMeasure: string
  sourceLocation: string
  scrapLocation: string
  scrapReason: string
  owner: string
  package: string
  sourceDocument: string
  replenishQuantities: boolean
  status: string
}

function mapScrapToCard(s: any): ScrapCardItem {
  return {
    id: s.id,
    reference: s.name || `SCRAP-${s.id}`,
    date: (s.date_done || '').slice(0,10),
    product: Array.isArray(s.product_id) ? s.product_id[1] : s.product_id,
    quantity: s.scrap_qty ?? 0,
    unitOfMeasure: Array.isArray(s.product_uom_id) ? s.product_uom_id[1] : s.product_uom_id,
    sourceLocation: Array.isArray(s.location_id) ? s.location_id[1] : s.location_id,
    scrapLocation: 'Virtual Locations/Scrap',
    scrapReason: '',
    owner: Array.isArray(s.owner_id) ? s.owner_id[1] : (s.owner_id || ''),
    package: Array.isArray(s.package_id) ? s.package_id[1] : (s.package_id || ''),
    sourceDocument: Array.isArray(s.picking_id) ? s.picking_id[1] : (s.picking_id || ''),
    replenishQuantities: false,
    status: s.state || 'draft',
  }
}

export default function ScrapOrdersPage() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;  
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { scraps, fetchData, packages, loading } = useData() as any
  const { sessionId } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedScrap, setSelectedScrap] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [productTypeFilter, setProductTypeFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [form, setForm] = useState<any | null>(null)

  const scrapCards: ScrapCardItem[] = useMemo(() => (scraps || []).map(mapScrapToCard) as ScrapCardItem[], [scraps])

  const filteredScraps = scrapCards.filter((scrap: ScrapCardItem) => {
    const matchesSearch =
      scrap.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scrap.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scrap.scrapReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scrap.sourceLocation.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || scrap.status === statusFilter
    const matchesOwner = ownerFilter === "all" || scrap.owner === ownerFilter

    return matchesSearch && matchesStatus && matchesOwner
  })

  const totalScraps = scrapCards.length
  const draftScraps = scrapCards.filter((s: ScrapCardItem) => s.status === "draft").length
  const todayStr = new Date().toISOString().slice(0,10)
  const completedToday = scrapCards.filter((s: ScrapCardItem) => s.status === "done" && s.date === todayStr).length
  const totalQuantityScrapped = scrapCards
    .filter((s: ScrapCardItem) => s.status === "done")
    .reduce((sum: number, s: ScrapCardItem) => sum + s.quantity, 0)

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "draft":
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
      case "done":
        return { bg: colors.success, text: "#0A0A0A", border: colors.success }
      default:
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
    }
  }

  const getStatusLabel = (status: string) => {
    const label = status.charAt(0).toUpperCase() + status.slice(1)
    return t(label)
  }

  const openModal = (scrap: any) => {
    setSelectedScrap(scrap)
    // hydrate form from raw record if exists
    const raw = (scraps || []).find((s: any) => s.id === scrap.id)
    if (raw) {
      setForm({
        id: raw.id,
        name: raw.name || `SCRAP-${raw.id}`,
        product_id: Array.isArray(raw.product_id) ? raw.product_id[0] : raw.product_id || null,
        scrap_qty: Number((raw as any).scrap_qty ?? raw.scrap_qty ?? 0),
        product_uom_id: Array.isArray(raw.product_uom_id) ? raw.product_uom_id[0] : raw.product_uom_id || null,
        package_id: Array.isArray(raw.package_id) ? raw.package_id[0] : raw.package_id || null,
        owner_id: Array.isArray(raw.owner_id) ? raw.owner_id[0] : raw.owner_id || null,
        location_id: Array.isArray(raw.location_id) ? raw.location_id[0] : raw.location_id || null,
        scrap_location_id: Array.isArray(raw.scrap_location_id) ? raw.scrap_location_id[0] : raw.scrap_location_id || null,
        source_document: Array.isArray(raw.picking_id) ? raw.picking_id[1] : (raw.picking_id || ''),
        replenish_quantities: false,
        scrap_reason_tag_id: null,
        state: raw.state || 'draft',
      })
    }
    if (!packages || packages.length === 0) {
      fetchData('packages')
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedScrap(null)
  }

  const owners: string[] = [
    "all",
    ...Array.from(new Set(scrapCards.map((scrap: ScrapCardItem) => String(scrap.owner)))) as string[],
  ]

  const activeFiltersCount = [statusFilter !== "all", productTypeFilter !== "all", ownerFilter !== "all"].filter(
    Boolean,
  ).length

  return (
    <div className="p-8" style={{ minHeight: "100vh", background: colors.background }}>
      <div
        style={{
          background: colors.background,
          padding: "1.5rem 1.5rem 3rem 1.5rem",
          color: colors.textPrimary,
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}
          >
            <div>
              <h1
                style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "0.25rem", color: colors.textPrimary }}
              >
                {t("Scrap Orders")}
              </h1>
              <p style={{ fontSize: "0.875rem", color: colors.textSecondary }}>
                {t("Manage scrapped products and track inventory removals")}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap:10, alignItems: 'flex-end' }}>
              <Button
                onClick={() => fetchData('scraps')}
                disabled={!!loading?.scraps}
                variant="outline"
                style={{
                  marginTop: '0.5rem',
                  background: colors.card,
                  color: colors.textPrimary,
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  fontWeight: 600,
                  cursor: loading?.scraps ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCcw size={18} className={loading?.scraps ? 'animate-spin' : ''} />
                {loading?.scraps ? t('Loading...') : t('Refresh')}
              </Button>
              <Button
                style={{
                  background: colors.action,
                  color: "#FFFFFF",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                onClick={() => {
                  // open create modal with empty draft form
                  const empty = {
                    id: null,
                    name: '',
                    product_id: null,
                    scrap_qty: 0,
                    product_uom_id: null,
                    package_id: null,
                    owner_id: null,
                    location_id: null,
                    scrap_location_id: null,
                    source_document: '',
                    replenish_quantities: false,
                    scrap_reason_tag_id: null,
                    state: 'draft',
                  }
                  setSelectedScrap({ id: null, reference: t('New Scrap'), status: 'draft' })
                  setForm(empty)
                  setIsModalOpen(true)
                }}
              >
                <Plus size={18} />
                {t("New Scrap")}
              </Button>
              
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <StatCard
              label={t("Total Scrap Orders")}
              value={totalScraps}
              icon={Trash2}
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              delay={0}
            />
            <StatCard
              label={t("Draft Orders")}
              value={draftScraps}
              icon={FileText}
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              delay={1}
            />
            <StatCard
              label={t("Completed Today")}
              value={completedToday}
              icon={CheckCircle2}
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              delay={2}
            />
            <StatCard
              label={t("Items Scrapped")}
              value={totalQuantityScrapped}
              icon={Package}
              gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
              delay={3}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "-1.5rem auto 0", padding: "0 1.5rem 1.5rem" }}>
        <Card
          style={{
            border: `1px solid ${colors.border}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            marginBottom: "1rem",
            background: colors.card,
          }}
        >
          <CardContent style={{ padding: "1rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              {/* Search Bar */}
              <div style={{ position: "relative", flex: "1 1 300px", minWidth: "200px" }}>
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
                <Input
                  type="text"
                  placeholder={t("Search scraps...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: "2.75rem",
                    paddingRight: "0.875rem",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    background: colors.card,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              {/* Filters Button */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  background: showFilters ? colors.action : colors.card,
                  color: showFilters ? "#FFFFFF" : colors.textPrimary,
                  border: `1px solid ${showFilters ? colors.action : colors.border}`,
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                <Filter size={16} />
                {t("Filters")}
                {activeFiltersCount > 0 && (
                  <Badge
                    style={{
                      background: showFilters ? "#FFFFFF" : colors.action,
                      color: showFilters ? colors.action : "#FFFFFF",
                      padding: "0.125rem 0.5rem",
                      fontSize: "0.75rem",
                      borderRadius: "12px",
                      minWidth: "20px",
                      textAlign: "center",
                    }}
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    style={{
                      width: "180px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      background: colors.card,
                      padding: "0.5rem 0.875rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <SelectValue placeholder={t("Status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All Statuses")}</SelectItem>
                    <SelectItem value="draft">{t("Draft")}</SelectItem>
                    <SelectItem value="done">{t("Done")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                  <SelectTrigger
                    style={{
                      width: "180px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      background: colors.card,
                      padding: "0.5rem 0.875rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <SelectValue placeholder={t("Product Type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All Products")}</SelectItem>
                    <SelectItem value="clothing">{t("Clothing")}</SelectItem>
                    <SelectItem value="furniture">{t("Furniture")}</SelectItem>
                    <SelectItem value="electronics">{t("Electronics")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger
                    style={{
                      width: "180px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      background: colors.card,
                      padding: "0.5rem 0.875rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <SelectValue placeholder={t("Owner")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All Owners")}</SelectItem>
                    {owners
                      .filter((o) => o !== "all")
                      .map((owner) => (
                        <SelectItem key={owner} value={owner}>
                          {owner}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {loading?.scraps ? (
          <div className="flex flex-col items-center justify-center py-16">
            <SyncLoader color={colors.textSecondary} size={8} />
            <p className="mt-4 text-sm" style={{ color: colors.textSecondary }}>
              {t("Loading scrap data...")}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1rem" }}>
            {filteredScraps.map((scrap) => (
              <ScrapCard
                key={scrap.id}
                scrap={scrap}
                onClick={() => openModal(scrap)}
                getStatusStyle={getStatusStyle}
                getStatusLabel={getStatusLabel}
              />
            ))}
          </div>
        )}

        {filteredScraps.length === 0 && (
          <Card
            style={{
              border: `1px solid ${colors.border}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              background: colors.card,
            }}
          >
            <CardContent style={{ padding: "3rem", textAlign: "center" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: `${colors.action}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <Trash2 size={32} color={colors.action} />
              </div>
              <h3
                style={{ fontSize: "1.125rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}
              >
                {t("No scrap orders found")}
              </h3>
              <p style={{ color: colors.textSecondary, fontSize: "0.875rem" }}>
                {t("Try adjusting your search criteria")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {isModalOpen && selectedScrap && (
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
            padding: "1.5rem",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "12px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: colors.card,
                padding: "1.25rem 1.5rem",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginBottom: "0.125rem",
                  }}
                >
                  {selectedScrap.reference}
                </h2>
                <p style={{ fontSize: "0.8125rem", color: colors.textSecondary }}>{t("Scrap Order Details")}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {form?.id && (form?.state === 'draft') && (
                  <Button
                    onClick={async () => {
                      if (!sessionId || !form?.id) return
                      const res = await fetch(`${API_BASE_URL}/scraps/${form.id}/validate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId }),
                      })
                      const j = await res.json().catch(() => ({}))
                      if (res.ok && j?.success) {
                        await fetchData('scraps')
                        setIsModalOpen(false)
                      }
                    }}
                    style={{ background: colors.success, color: '#fff' }}
                  >
                    {t('Validate')}
                  </Button>
                )}
                <button
                  onClick={closeModal}
                  style={{
                    background: colors.background,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} color={colors.textPrimary} />
                </button>
              </div>
            </div>

            {/* Modal Content - Two Column Layout */}
            <div style={{ display: "flex", gap: "1.5rem", padding: "1.5rem" }}>
              {/* Left Column - Main Information */}
              <div style={{ flex: "1 1 65%" }}>
                {/* Status and Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <Badge
                    style={{
                      fontSize: "0.8125rem",
                      padding: "0.375rem 0.875rem",
                      background: getStatusStyle(selectedScrap.status).bg,
                      border: `1px solid ${getStatusStyle(selectedScrap.status).border}`,
                      color: getStatusStyle(selectedScrap.status).text,
                    }}
                  >
                    {getStatusLabel(selectedScrap.status)}
                  </Badge>
                  <Button
                    style={{
                      background: colors.action,
                      color: "#FFFFFF",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <Edit size={14} />
                    {t("Edit")}
                  </Button>
                </div>

                {/* Editable Form */}
                {form && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Edit')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {/* Name */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>{t('Name')}</label>
                        <input
                          type="text"
                          value={form.name || ''}
                          onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))}
                          disabled={!!form.id && form.state !== 'draft'}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}
                        />
                      </div>
                      {/* Product */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>{t('Product')}</label>
                        <select
                          value={form.product_id || ''}
                          onChange={(e) => setForm((p: any) => ({ ...p, product_id: Number(e.target.value) || null }))}
                          disabled={!!form.id && form.state === 'done'}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}
                        >
                          <option value="">{t('Select')}</option>
                          {(useData() as any).products?.map((pr: any) => (
                            <option key={pr.id} value={pr.id}>{pr.display_name || pr.name || `#${pr.id}`}</option>
                          ))}
                        </select>
                      </div>
                      {/* Quantity */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>{t('Quantity')}</label>
                        <input
                          type="number"
                          value={form.scrap_qty ?? 0}
                          onChange={(e) => setForm((p: any) => ({ ...p, scrap_qty: Number(e.target.value) || 0 }))}
                          disabled={!!form.id && form.state === 'done'}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}
                        />
                      </div>
                      {/* UOM */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>{t('UOM')}</label>
                        <select
                          value={form.product_uom_id || ''}
                          onChange={(e) => setForm((p: any) => ({ ...p, product_uom_id: Number(e.target.value) || null }))}
                          disabled={!!form.id && form.state === 'done'}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}
                        >
                          <option value="">{t('Select')}</option>
                          {(useData() as any).uom?.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name || `#${u.id}`}</option>
                          ))}
                        </select>
                      </div>
                      {/* Replenish */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textSecondary, fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={!!form.replenish_quantities}
                            onChange={(e) => setForm((p: any) => ({ ...p, replenish_quantities: e.target.checked }))}
                            disabled={!!form.id && form.state === 'done'}
                          />
                          {t('Replenish Quantities')}
                        </label>
                      </div>
                      {/* Package (stock.quant.package options) */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>{t('Package')}</label>
                        <select
                          value={form.package_id || ''}
                          onChange={(e) => setForm((p: any) => ({ ...p, package_id: Number(e.target.value) || null }))}
                          disabled={!!form.id && form.state === 'done'}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}
                        >
                          <option value="">{t('Select')}</option>
                          {(packages || []).map((pk: any) => (
                            <option key={pk.id} value={pk.id}>{pk.name || pk.display_name || `#${pk.id}`}</option>
                          ))}
                        </select>
                      </div>
                      {/* Owner */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>{t('Owner')}</label>
                        <select
                          value={form.owner_id || ''}
                          onChange={(e) => setForm((p: any) => ({ ...p, owner_id: Number(e.target.value) || null }))}
                          disabled={!!form.id && form.state === 'done'}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}
                        >
                          <option value="">{t('Select')}</option>
                          {(useData() as any).partners?.map((pt: any) => (
                            <option key={pt.id} value={pt.id}>{pt.name || `#${pt.id}`}</option>
                          ))}
                        </select>
                      </div>
                      {/* Source Location */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>{t('Source Location')}</label>
                        <select
                          value={form.location_id || ''}
                          onChange={(e) => setForm((p: any) => ({ ...p, location_id: Number(e.target.value) || null }))}
                          disabled={!!form.id && form.state === 'done'}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}
                        >
                          <option value="">{t('Select')}</option>
                          {(useData() as any).locations?.map((lc: any) => (
                            <option key={lc.id} value={lc.id}>{lc.display_name || lc.name || `#${lc.id}`}</option>
                          ))}
                        </select>
                      </div>
                      {/* Scrap Location */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>{t('Scrap Location')}</label>
                        <select
                          value={form.scrap_location_id || ''}
                          onChange={(e) => setForm((p: any) => ({ ...p, scrap_location_id: Number(e.target.value) || null }))}
                          disabled={!!form.id && form.state === 'done'}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}
                        >
                          <option value="">{t('Select')}</option>
                          {(useData() as any).locations?.map((lc: any) => (
                            <option key={lc.id} value={lc.id}>{lc.display_name || lc.name || `#${lc.id}`}</option>
                          ))}
                        </select>
                      </div>
                      {/* Source Document */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>{t('Source Document')}</label>
                        <input
                          type="text"
                          value={form.source_document || ''}
                          onChange={(e) => setForm((p: any) => ({ ...p, source_document: e.target.value }))}
                          disabled={!!form.id && form.state === 'done'}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}
                        />
                      </div>
                      {/* Scrap Reason (placeholder - requires dataset) */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>{t('Scrap Reason')}</label>
                        <select
                          value={form.scrap_reason_tag_id || ''}
                          onChange={(e) => setForm((p: any) => ({ ...p, scrap_reason_tag_id: Number(e.target.value) || null }))}
                          disabled={!!form.id && form.state === 'done'}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}
                        >
                          <option value="">{t('Select')}</option>
                          {/* TODO: wire to distinct values of stock.scrap.reason.tag when exposed in data context */}
                        </select>
                      </div>
                    </div>
                    {/* Create/Save buttons */}
                    {!form.id && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <Button
                          onClick={async () => {
                            if (!sessionId) return
                            const payload: any = {
                              name: form.name || undefined,
                              product_id: form.product_id || false,
                              product_uom_id: form.product_uom_id || false,
                              scrap_qty: Number(form.scrap_qty || 0),
                              location_id: form.location_id || false,
                              scrap_location_id: form.scrap_location_id || false,
                              owner_id: form.owner_id || false,
                              package_id: form.package_id || false,
                            }
                            const res = await fetch(`${API_BASE_URL}/scraps/create`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ sessionId, values: payload }),
                            })
                            const j = await res.json().catch(() => ({}))
                            if (res.ok && j?.success) {
                              await fetchData('scraps')
                              setIsModalOpen(false)
                            }
                          }}
                          style={{ background: colors.action, color: '#fff' }}
                        >
                          {t('Create')}
                        </Button>
                      </div>
                    )}
                    {form.id && form.state !== 'done' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.5rem' }}>
                        <Button
                          onClick={async () => {
                            if (!sessionId || !form?.id) return
                            const payload: any = {
                              name: form.name || undefined,
                              product_id: form.product_id || false,
                              product_uom_id: form.product_uom_id || false,
                              scrap_qty: Number(form.scrap_qty || 0),
                              location_id: form.location_id || false,
                              scrap_location_id: form.scrap_location_id || false,
                              owner_id: form.owner_id || false,
                              package_id: form.package_id || false,
                            }
                            const res = await fetch(`${API_BASE_URL}/scraps/${form.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ sessionId, values: payload }),
                            })
                            const j = await res.json().catch(() => ({}))
                            if (res.ok && j?.success) {
                              await fetchData('scraps')
                              setIsModalOpen(false)
                            }
                          }}
                          style={{ background: colors.action, color: '#fff' }}
                        >
                          {t('Save')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
