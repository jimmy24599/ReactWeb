"use client"

import { CardContent } from "@/components/ui/card"

import { Card } from "@/components/ui/card"

import { useMemo, useState, useEffect } from "react"
import { Search, Plus, Package, TrendingUp, DollarSign, AlertTriangle } from "lucide-react"
import { StatCard } from "./components/StatCard"
import { LotCard } from "./components/LotCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { useAuth } from "../context/auth"
import { API_CONFIG } from "./config/api"
import Toast from "./components/Toast"
import { DatePicker } from "./components/ui/date-picker"

interface LotSerialNumber {
  id: string
  lotNumber: string
  internalReference: string
  product: string
  productCategory: string
  onHandQuantity: number
  totalValue: number
  averageCost: number
  cost: number
  location: string
  createdOn: string
  expiryDate?: string
  status: "Active" | "Expired" | "Reserved" | "Depleted"
  description?: string
  traceabilityEvents: Array<{
    date: string
    event: string
    location: string
    quantity: number
  }>
}

// Real data composition from context
function buildLotsView(lots: any[], quants: any[], products: any[], locations: any[]): LotSerialNumber[] {
  const productMap = new Map<number, any>()
  for (const p of products || []) productMap.set(p.id, p)
  const locationName = new Map<number, string>()
  for (const l of locations || []) locationName.set(l.id, l.complete_name || l.display_name || l.name)

  // Index quants by lot id
  const quantsByLot = new Map<number, any[]>()
  for (const q of quants || []) {
    const lotId = Array.isArray(q.lot_id) ? q.lot_id[0] : q.lot_id
    if (!lotId) continue
    if (!quantsByLot.has(lotId)) quantsByLot.set(lotId, [])
    quantsByLot.get(lotId)!.push(q)
  }

  const results: LotSerialNumber[] = []
  for (const lot of lots || []) {
    const idNum = Number(lot.id)
    const quantsForLot = quantsByLot.get(idNum) || []
    const anyQuant = quantsForLot[0]
    const pid = Array.isArray(lot.product_id) ? lot.product_id[0] : lot.product_id
    const prod = productMap.get(pid) || {}
    const qty = quantsForLot.reduce((s, q) => s + Number(q.available_quantity ?? q.quantity ?? 0), 0)
    const reserved = quantsForLot.reduce((s, q) => s + Number(q.reserved_quantity ?? 0), 0)
    const stdPrice = Number(prod.standard_price ?? 0)
    const loc = anyQuant
      ? Array.isArray(anyQuant.location_id)
        ? anyQuant.location_id[0]
        : anyQuant.location_id
      : undefined
    const locName = typeof loc === "number" ? locationName.get(loc) || "" : ""
    const expiry = lot.life_date || lot.use_date || lot.removal_date || undefined
    const now = new Date()
    const status: LotSerialNumber["status"] =
      qty <= 0 ? "Depleted" : expiry && new Date(expiry) < now ? "Expired" : reserved > 0 ? "Reserved" : "Active"

    results.push({
      id: String(idNum),
      lotNumber: lot.name || `LOT-${idNum}`,
      internalReference: prod.default_code || "",
      product: Array.isArray(lot.product_id) ? lot.product_id[1] : prod.name || "",
      productCategory: Array.isArray(prod.categ_id) ? prod.categ_id[1] : "",
      onHandQuantity: qty,
      totalValue: qty * stdPrice,
      averageCost: stdPrice,
      cost: stdPrice,
      location: locName || "—",
      createdOn: lot.create_date || "",
      expiryDate: expiry,
      status,
      description: lot.description || "",
      traceabilityEvents: [],
    })
  }
  return results
}

// Removed unused mock summary data

export default function LotsSerialNumbersPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()
  const { lots, quants, products, locations } = useData()
  const { sessionId } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLot, setSelectedLot] = useState<LotSerialNumber | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    product_id: 0 as number,
    product_name: "",
    product_default_code: "",
    location_id: 0 as number,
    location_name: "",
    on_hand: 0,
    total_value: 0,
    avg_cost: 0,
    cost: 0,
    status: "Active" as LotSerialNumber["status"],
    ref: "",
    note: "",
  })
  const [toast, setToast] = useState<{ text: string; state: "success" | "error" } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [repairsOpen, setRepairsOpen] = useState<{ lotId: number, lotName: string } | null>(null)
  const [repairs, setRepairs] = useState<any[]>([])
  const [repairsLoading, setRepairsLoading] = useState(false)
  const [addRepairOpen, setAddRepairOpen] = useState(false)
  const [partners, setPartners] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [repairTags, setRepairTags] = useState<any[]>([])
  const [pickings, setPickings] = useState<any[]>([])
  const [productPackagings, setProductPackagings] = useState<any[]>([])
  const [repairForm, setRepairForm] = useState<any>({
    partner_id: "",
    schedule_date: "",
    product_id: "",
    user_id: "",
    lot_id: "",
    tag_ids: [] as string[],
    product_qty: "",
    picking_id: "",
    under_warranty: false,
  })
  const [parts, setParts] = useState<any[]>([])
  const [partDrafts, setPartDrafts] = useState<any[]>([])
  const [selectedRepairId, setSelectedRepairId] = useState<number | null>(null)

  // Load repairs and parts when repairs modal opens or selected repair changes
  useEffect(() => {
    const run = async () => {
      try {
        if (!repairsOpen) return
        const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
        if (!sessionId) return
        setRepairsLoading(true)
        const base = API_CONFIG.BACKEND_BASE_URL
        const res = await fetch(`${base}/repairs`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, lot_id: repairsOpen.lotId }) })
        const js = await res.json().catch(()=>({}))
        const list:any[] = js?.repairs || []
        setRepairs(list)
        const firstId = (list[0]?.id) ? Number(list[0].id) : null
        setSelectedRepairId(firstId)
        if (firstId) {
          const movesRes = await fetch(`${base}/stock-moves/by-domain`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, domain: [["repair_id","=", firstId]] }) })
          const mjs = await movesRes.json().catch(()=>({}))
          setParts(mjs?.stockMoves || [])
        } else {
          setParts([])
        }
      } finally { setRepairsLoading(false) }
    }
    run()
  }, [repairsOpen])

  useEffect(()=>{
    const run = async () => {
      try {
        if (!selectedRepairId) return
        const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
        if (!sessionId) return
        const base = API_CONFIG.BACKEND_BASE_URL
        const movesRes = await fetch(`${base}/stock-moves/by-domain`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, domain: [["repair_id","=", Number(selectedRepairId)]] }) })
        const mjs = await movesRes.json().catch(()=>({}))
        setParts(mjs?.stockMoves || [])
      } catch {}
    }
    run()
  }, [selectedRepairId])

  const realLots = useMemo(() => buildLotsView(lots, quants, products, locations), [lots, quants, products, locations])

  // Determine if currently selected lot can be edited
  const lotRecordForEdit = useMemo(() => {
    if (!selectedLot) return null
    return (lots || []).find((l) => String(l.id) === selectedLot.id) || null
  }, [selectedLot, lots])
  const isLockedLot = !!(
    lotRecordForEdit &&
    ((Array.isArray((lotRecordForEdit as any).stock_move_line_ids) &&
      (lotRecordForEdit as any).stock_move_line_ids.length) ||
      (Array.isArray((lotRecordForEdit as any).quant_ids) && (lotRecordForEdit as any).quant_ids.length))
  )

  const filteredLots = realLots.filter((lot) => {
    const matchesSearch =
      lot.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.internalReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || lot.status === statusFilter
    const matchesCategory = categoryFilter === "all" || lot.productCategory === categoryFilter
    const matchesLocation = locationFilter === "all" || lot.location.includes(locationFilter)

    return matchesSearch && matchesStatus && matchesCategory && matchesLocation
  })

  const totalLots = realLots.length
  const activeLots = realLots.filter((lot) => lot.status === "Active").length
  const totalValue = realLots.reduce((sum, lot) => sum + lot.totalValue, 0)
  const expiringLots = realLots.filter((lot) => {
    if (!lot.expiryDate) return false
    const daysUntilExpiry = Math.floor(
      (new Date(lot.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysUntilExpiry > 0 && daysUntilExpiry <= 90
  }).length

  const getStatusStyle = (status: string): { bg: string; text: string; border?: string } => {
    switch (status) {
      case "Active":
        return { bg: colors.pillInfoBg, text: colors.pillInfoText }
      case "Reserved":
        return { bg: colors.inProgress, text: colors.textPrimary }
      case "Expired":
        return { bg: colors.cancel, text: "#FFFFFF" }
      case "Depleted":
        return { bg: colors.mutedBg, text: colors.textSecondary, border: colors.border }
      default:
        return { bg: colors.mutedBg, text: colors.textPrimary }
    }
  }

  const handleOpenModal = (lot: LotSerialNumber | null) => {
    if (lot) {
      // map selected lot to form state using our real data sources
      const prod =
        (products || []).find((p) => (p.default_code || "") === lot.internalReference || p.name === lot.product) ||
        (products || []).find((p) => Array.isArray(p.categ_id)) ||
        null
      const product_id =
        prod?.id ||
        (Array.isArray((lots || []).find((l) => String(l.id) === lot.id)?.product_id)
          ? (lots as any[]).find((l) => String(l.id) === lot.id).product_id[0]
          : 0)
      const locName = lot.location
      const loc = (locations || []).find((l) => (l.complete_name || l.display_name || l.name) === locName)
      const rawLot = (lots || []).find((l) => String(l.id) === lot.id) as any
      setForm({
        name: lot.lotNumber,
        product_id: product_id,
        product_name: lot.product,
        product_default_code: lot.internalReference,
        location_id: loc?.id || 0,
        location_name: locName,
        on_hand: lot.onHandQuantity,
        total_value: lot.totalValue,
        avg_cost: lot.averageCost,
        cost: lot.cost,
        status: lot.status,
        ref: lot.internalReference,
        note: rawLot?.note || lot.description || "",
      })
    } else {
      setForm({
        name: "",
        product_id: 0,
        product_name: "",
        product_default_code: "",
        location_id: 0,
        location_name: "",
        on_hand: 0,
        total_value: 0,
        avg_cost: 0,
        cost: 0,
        status: "Active",
        ref: "",
        note: "",
      })
    }
    setSelectedLot(lot)
    setIsModalOpen(true)
  }

  const uniqueCategories = Array.from(new Set(realLots.map((lot) => lot.productCategory).filter(Boolean)))
  const uniqueLocations = Array.from(new Set(realLots.map((lot) => lot.location.split("/")[0]).filter(Boolean)))

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
          .stat-card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .stat-card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
        `}
      </style>

      <div className="mx-auto max-w-[1600px] space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t("Lots / Serial Numbers")}
            </h1>
            <p className="mt-2 text-lg" style={{ color: colors.textSecondary }}>
              {t("Track and manage product lots and serial numbers")}
            </p>
          </div>
          <Button
            className="text-white transition-all shadow-lg hover:shadow-xl h-11 px-6"
            style={{ background: colors.action }}
            onClick={() => handleOpenModal(null)}
          >
          <Plus className={`${isRTL ? "ml-2" : "mr-2"} h-5 w-5`} />
          {t("Add Lot/Serial Number")}
          </Button>
        </div>
        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            marginBottom: "2rem",
          }}
        >
          <StatCard
            label={t("Total Lots")}
            value={totalLots}
            icon={Package}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={0}
          />
          <StatCard
            label={t("Active Lots")}
            value={activeLots}
            icon={TrendingUp}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            delay={1}
          />
          <StatCard
            label={t("Total Value")}
            value={`$${totalValue.toLocaleString()}`}
            icon={DollarSign}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            delay={2}
          />
          <StatCard
            label={t("Expiring Soon")}
            value={expiringLots}
            icon={AlertTriangle}
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
                  placeholder={t("Search by lot number, product, reference, or location...")}
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
                  <SelectItem value="all">{t("All Status")}</SelectItem>
                  <SelectItem value="Active">{t("Active")}</SelectItem>
                  <SelectItem value="Reserved">{t("Reserved")}</SelectItem>
                  <SelectItem value="Expired">{t("Expired")}</SelectItem>
                  <SelectItem value="Depleted">{t("Depleted")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Categories")}</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Location")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Locations")}</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
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
          {filteredLots.map((lot, idx) => (
            <LotCard
              key={lot.id}
              lot={lot}
              onClick={() => handleOpenModal(lot)}
              index={idx}
              onRepairs={() => {
                setRepairsOpen({ lotId: Number(lot.id), lotName: lot.lotNumber })
              }}
              onLocations={() => handleOpenModal(lot)}
            />
          ))}
        </div>

        {filteredLots.length === 0 && (
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
              {t("No lots found")}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
              {t("Try adjusting your filters or search term")}
            </p>
          </div>
        )}
      {/* Repairs Modal */}
      {repairsOpen && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}
          onClick={()=> setRepairsOpen(null)}
        >
          <div onClick={(e)=> e.stopPropagation()} style={{ width:'min(1000px,95vw)', maxHeight:'90vh', overflow:'auto', background: colors.card, border:`1px solid ${colors.border}`, borderRadius:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:`1px solid ${colors.border}` }}>
              <div>
                <div style={{ fontWeight:700, color: colors.textPrimary }}>{t('Repairs for')} {repairsOpen.lotName}</div>
                <div style={{ fontSize:12, color: colors.textSecondary }}>#{repairsOpen.lotId}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={async ()=>{
                  try {
                    if (!sessionId) return
                    setAddRepairOpen(true)
                    // preload datasets
                    const base = API_CONFIG.BACKEND_BASE_URL
                    const [pr, us, tg, pk, ppk] = await Promise.all([
                      fetch(`${base}/partners`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }),
                      fetch(`${base}/users`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }),
                      fetch(`${base}/repair-tags`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }),
                      fetch(`${base}/pickings`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }),
                      fetch(`${base}/product-packaging`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }),
                    ])
                    const [pjs, ujs, tjs, pks, ppjs] = await Promise.all([pr.json(), us.json(), tg.json(), pk.json(), ppk.json()])
                    if (pjs?.partners) setPartners(pjs.partners)
                    if (ujs?.users) setUsers(ujs.users)
                    if (tjs?.tags) setRepairTags(tjs.tags)
                    if (pks?.pickings) setPickings(pks.pickings||[])
                    if (ppjs?.productPackagings) setProductPackagings(ppjs.productPackagings)
                  } catch {}
                }} style={{ padding:'8px 12px', border:`1px solid ${colors.border}`, borderRadius:8, background: colors.card, color: colors.textPrimary, fontWeight:600 }}>{t('Add repair')}</button>
                <button onClick={()=> setRepairsOpen(null)} style={{ padding:'8px 12px', border:'none', borderRadius:8, background: colors.action, color:'#fff', fontWeight:700 }}>×</button>
              </div>
            </div>
            {/* Body */}
            <div style={{ padding:16 }}>
              {/* List repairs */}
              <div style={{ marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontWeight:700, color: colors.textPrimary }}>{t('Repairs')}</div>
                <button onClick={async ()=>{
                  try {
                    if (!sessionId) return
                    setRepairsLoading(true)
                    const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/repairs`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, lot_id: repairsOpen.lotId }) })
                    const js = await res.json().catch(()=>({}))
                    if (js?.repairs) setRepairs(js.repairs)
                  } finally { setRepairsLoading(false) }
                }} style={{ padding:'6px 10px', border:`1px solid ${colors.border}`, borderRadius:6, background: colors.mutedBg }}>{t('Refresh')}</button>
              </div>
              <div style={{ border:`1px solid ${colors.border}`, borderRadius:8, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr 1fr 1fr 0.8fr', borderBottom:`1px solid ${colors.border}`, background: colors.mutedBg, fontWeight:700, color: colors.textSecondary, fontSize:13 }}>
                  <div style={{ padding:10 }}>{t('Repair reference')}</div>
                  <div style={{ padding:10 }}>{t('Scheduled date')}</div>
                  <div style={{ padding:10 }}>{t('Product to repair')}</div>
                  <div style={{ padding:10 }}>{t('Component status')}</div>
                  <div style={{ padding:10 }}>{t('Customer')}</div>
                  <div style={{ padding:10 }}>{t('Sale order')}</div>
                  <div style={{ padding:10, borderLeft:`1px solid ${colors.border}` }}>{t('Status')}</div>
                </div>
                {(repairs||[]).map((r)=> (
                  <div key={r.id} style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr 1fr 1fr 0.8fr', borderBottom:`1px solid ${colors.border}`, color: colors.textPrimary, fontSize:13 }}>
                    <div style={{ padding:10 }}>{r.name}</div>
                    <div style={{ padding:10 }}>{r.schedule_date || ''}</div>
                    <div style={{ padding:10 }}>{Array.isArray(r.product_id)? r.product_id[1]: ''}</div>
                    <div style={{ padding:10 }}>{r.parts_availability_state || ''}</div>
                    <div style={{ padding:10 }}>{Array.isArray(r.partner_id)? r.partner_id[1]: ''}</div>
                    <div style={{ padding:10 }}>{Array.isArray(r.sale_order_id)? r.sale_order_id[1]: ''}</div>
                    <div style={{ padding:10, borderLeft:`1px solid ${colors.border}` }}>{r.state || ''}</div>
                  </div>
                ))}
                {!repairs?.length && (
                  <div style={{ padding:12, color: colors.textSecondary, fontSize:13 }}>{repairsLoading? t('Loading...'): t('No repairs found')}</div>
                )}
              </div>

              {/* Add repair form */}
              {addRepairOpen && (
                <div style={{ marginTop:20, padding:12, border:`1px solid ${colors.border}`, borderRadius:8 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <Label style={{ color: colors.textSecondary }}>{t('Customer')}</Label>
                      <select value={repairForm.partner_id} onChange={(e)=> setRepairForm({ ...repairForm, partner_id: e.target.value })} style={{ width:'100%', padding:'8px', border:`2px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                        <option value="">{t('Select')}</option>
                        {(partners||[]).map((p:any)=> <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label style={{ color: colors.textSecondary }}>{t('Scheduled date')}</Label>
                      <DatePicker value={repairForm.schedule_date} onChange={(s: string)=> setRepairForm({ ...repairForm, schedule_date: s })} colors={colors} />
                    </div>
                    <div>
                      <Label style={{ color: colors.textSecondary }}>{t('Product to Repair')}</Label>
                      <select value={repairForm.product_id} onChange={(e)=> setRepairForm({ ...repairForm, product_id: e.target.value, lot_id: '' })} style={{ width:'100%', padding:'8px', border:`2px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                        <option value="">{t('Select')}</option>
                        {(products||[]).map((p:any)=> <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label style={{ color: colors.textSecondary }}>{t('Responsible')}</Label>
                      <select value={repairForm.user_id} onChange={(e)=> setRepairForm({ ...repairForm, user_id: e.target.value })} style={{ width:'100%', padding:'8px', border:`2px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                        <option value="">{t('Select')}</option>
                        {(users||[]).map((u:any)=> <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                      </select>
                    </div>
                    {!!repairForm.product_id && (lots||[]).some((l:any)=> (Array.isArray(l.product_id)? l.product_id[0]: l.product_id) === Number(repairForm.product_id)) && (
                      <div>
                        <Label style={{ color: colors.textSecondary }}>{t('Lot/Serial')}</Label>
                        <select value={repairForm.lot_id} onChange={(e)=> setRepairForm({ ...repairForm, lot_id: e.target.value })} style={{ width:'100%', padding:'8px', border:`2px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                          <option value="">{t('Select')}</option>
                          {(lots||[]).filter((l:any)=> (Array.isArray(l.product_id)? l.product_id[0]: l.product_id) === Number(repairForm.product_id)).map((l:any)=> (
                            <option key={l.id} value={String(l.id)}>{l.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <Label style={{ color: colors.textSecondary }}>{t('Tags')}</Label>
                      <div onClick={(e)=>{const m=e.currentTarget.nextSibling as HTMLElement; const v=m.getAttribute('data-open')==='true'; m.setAttribute('data-open',(!v).toString()); m.style.display=v?'none':'block'}} style={{ width:'100%', minHeight:42, padding:'6px 8px', border:`2px solid ${colors.border}`, borderRadius:8, background: colors.background, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', cursor:'pointer' }}>
                        {(() => { const ids=new Set(repairForm.tag_ids||[]); const items=(repairTags||[]).filter((t:any)=> ids.has(String(t.id))); if(!items.length) return <span style={{ color: colors.textSecondary, fontSize:12 }}>{t('Select')}</span>; return items.map((it:any)=> (
                          <span key={it.id} style={{ display:'inline-flex', alignItems:'center', gap:6, border:`1px solid ${colors.border}`, borderRadius:999, padding:'2px 8px', fontSize:12 }} onClick={(e)=> e.stopPropagation()}>
                            {it.name}
                            <button onClick={(e)=>{e.stopPropagation(); setRepairForm({ ...repairForm, tag_ids:(repairForm.tag_ids||[]).filter((x:string)=> x!==String(it.id)) })}} style={{ border:'none', background:'transparent', cursor:'pointer', color: colors.textSecondary }}>×</button>
                          </span>
                        )) })()}
                      </div>
                      <div data-open="false" style={{ display:'none', marginTop:4, border:`1px solid ${colors.border}`, borderRadius:8, maxHeight:220, overflow:'auto', background: colors.card }}>
                        {(repairTags||[]).map((it:any)=>{ const checked=(repairForm.tag_ids||[]).includes(String(it.id)); return (
                          <label key={it.id} style={{ display:'flex', alignItems:'center', gap:8, padding:8, borderBottom:`1px solid ${colors.border}` }}>
                            <input type="checkbox" checked={checked} onChange={(e)=>{ const s=new Set(repairForm.tag_ids||[]); if(e.target.checked) s.add(String(it.id)); else s.delete(String(it.id)); setRepairForm({ ...repairForm, tag_ids:Array.from(s) }) }} />
                            <span style={{ fontSize:13, color: colors.textPrimary }}>{it.name}</span>
                          </label>
                        )})}
                      </div>
                    </div>
                    <div>
                      <Label style={{ color: colors.textSecondary }}>{t('Product quantity')}</Label>
                      <Input value={repairForm.product_qty} onChange={(e)=> setRepairForm({ ...repairForm, product_qty: e.target.value.replace(/[^0-9.]/g,'') })} style={{ border:`2px solid ${colors.border}`, background: colors.background, color: colors.textPrimary }} />
                    </div>
                    <div>
                      <Label style={{ color: colors.textSecondary }}>{t('Return')}</Label>
                      <select value={repairForm.picking_id} onChange={(e)=> setRepairForm({ ...repairForm, picking_id: e.target.value })} style={{ width:'100%', padding:'8px', border:`2px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                        <option value="">{t('Select')}</option>
                        {(pickings||[]).map((p:any)=> <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop: 8 }}>
                      <input id="uw" type="checkbox" checked={!!repairForm.under_warranty} onChange={(e)=> setRepairForm({ ...repairForm, under_warranty: e.target.checked })} />
                      <label htmlFor="uw" style={{ color: colors.textPrimary }}>{t('Under warranty')}</label>
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
                    <button onClick={()=>{ setAddRepairOpen(false); setRepairForm({ partner_id:"", schedule_date:"", product_id:"", user_id:"", lot_id:"", tag_ids:[], product_qty:"", picking_id:"", under_warranty:false }) }} style={{ padding:'8px 12px', border:`1px solid ${colors.border}`, borderRadius:8, background: colors.card }}>{t('Cancel')}</button>
                    <button onClick={async ()=>{
                      try {
                        const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
                        if(!sessionId) return
                        const values:any = {
                          partner_id: repairForm.partner_id? Number(repairForm.partner_id): false,
                          schedule_date: repairForm.schedule_date || false,
                          product_id: repairForm.product_id? Number(repairForm.product_id): false,
                          user_id: repairForm.user_id? Number(repairForm.user_id): false,
                          lot_id: repairsOpen.lotId,
                          tag_ids: Array.isArray(repairForm.tag_ids)? [[6,0, repairForm.tag_ids.map((x:string)=> Number(x))]]: undefined,
                          product_qty: repairForm.product_qty === ''? 0: Number(repairForm.product_qty),
                          picking_id: repairForm.picking_id? Number(repairForm.picking_id): false,
                          under_warranty: !!repairForm.under_warranty,
                        }
                        const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/repairs/create`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, values }) })
                        const js = await res.json().catch(()=>({}))
                        if (js?.id) {
                          setToast({ text: t('Repair created'), state:'success' })
                          setAddRepairOpen(false)
                          // refresh list and parts for the new id
                          const rr = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/repairs`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, lot_id: repairsOpen.lotId }) })
                          const rjs = await rr.json().catch(()=>({}))
                          setRepairs(rjs?.repairs||[])
                        } else {
                          setToast({ text: t('Failed to create repair'), state:'error' })
                        }
                      } catch(e){ setToast({ text: t('Failed to create repair'), state:'error' }) }
                    }} style={{ padding:'8px 12px', border:'none', borderRadius:8, background: colors.action, color:'#fff', fontWeight:700 }}>{t('Create')}</button>
                  </div>
                </div>
              )}

              {/* Parts section for selected repair (only when a repair exists) */}
              {repairs?.length > 0 && (
                <div style={{ marginTop:24 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontWeight:700, color: colors.textPrimary }}>{t('Parts')}</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=> setPartDrafts((prev)=> [...prev, { id: Date.now(), repair_line_type:'add', product_id:'', product_packaging_id:'', product_uom_qty:'', quantity:'', variableUom:'', }])} style={{ padding:'6px 10px', border:`1px solid ${colors.border}`, borderRadius:6, background: colors.mutedBg }}>{t('Add')}</button>
                      {partDrafts.length > 0 && (
                        <button onClick={async ()=>{
                          try {
                            const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
                            if(!sessionId) return
                            const repairId = repairs[0]?.id // simplest: first (latest created)
                            if(!repairId) return
                            const base = API_CONFIG.BACKEND_BASE_URL
                            for (const d of partDrafts) {
                              const values:any = {
                                repair_id: Number(repairId),
                                repair_line_type: d.repair_line_type,
                                product_id: d.product_id? Number(d.product_id): false,
                                product_packaging_id: d.product_packaging_id? Number(d.product_packaging_id): false,
                                product_uom_qty: d.product_uom_qty === ''? 0: Number(d.product_uom_qty),
                                quantity: d.quantity === ''? 0: Number(d.quantity),
                              }
                              await fetch(`${base}/stock-moves/create`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, values }) })
                            }
                            setPartDrafts([])
                            // reload
                            const movesRes = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/stock-moves/by-domain`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, domain: [['repair_id','=', Number(repairId)]] }) })
                            const mjs = await movesRes.json().catch(()=>({}))
                            setParts(mjs?.stockMoves||[])
                            setToast({ text: t('Parts updated'), state:'success' })
                          } catch(e){ setToast({ text: t('Failed to update parts'), state:'error' }) }
                        }} style={{ padding:'6px 10px', border:'none', borderRadius:6, background: colors.action, color:'#fff', fontWeight:700 }}>{t('Confirm')}</button>
                      )}
                    </div>
                  </div>
                  {/* existing parts list */}
                  <div style={{ border:`1px solid ${colors.border}`, borderRadius:8, overflow:'hidden', marginBottom:8 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'0.8fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr', borderBottom:`1px solid ${colors.border}`, background: colors.mutedBg, fontWeight:700, color: colors.textSecondary, fontSize:13 }}>
                      <div style={{ padding:10 }}>{t('Type')}</div>
                      <div style={{ padding:10 }}>{t('Product')}</div>
                      <div style={{ padding:10 }}>{t('Packaging')}</div>
                      <div style={{ padding:10 }}>{t('Demand')}</div>
                      <div style={{ padding:10 }}>{t('Done')}</div>
                      <div style={{ padding:10 }}>{t('UoM')}</div>
                    </div>
                    {(parts||[]).map((p:any)=> (
                      <div key={p.id} style={{ display:'grid', gridTemplateColumns:'0.8fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr', borderBottom:`1px solid ${colors.border}`, color: colors.textPrimary, fontSize:13 }}>
                        <div style={{ padding:10 }}>{p.repair_line_type || ''}</div>
                        <div style={{ padding:10 }}>{Array.isArray(p.product_id)? p.product_id[1]: ''}</div>
                        <div style={{ padding:10 }}>{Array.isArray(p.product_packaging_id)? p.product_packaging_id[1]: ''}</div>
                        <div style={{ padding:10 }}>{p.product_uom_qty ?? ''}</div>
                        <div style={{ padding:10 }}>{p.quantity ?? ''}</div>
                        <div style={{ padding:10 }}>{Array.isArray(p.product_uom)? p.product_uom[1]: ''}</div>
                      </div>
                    ))}
                    {!parts?.length && <div style={{ padding:12, color: colors.textSecondary, fontSize:13 }}>{t('No parts lines')}</div>}
                  </div>

                  {/* drafts */}
                  {partDrafts.length > 0 && (
                    <div style={{ border:`1px solid ${colors.border}`, borderRadius:8, overflow:'hidden' }}>
                      {(partDrafts||[]).map((d: any)=> (
                        <div key={d.id} style={{ display:'grid', gridTemplateColumns:'0.8fr 1.2fr 1fr 0.8fr 0.8fr', borderBottom:`1px solid ${colors.border}`, alignItems:'center' }}>
                          <div style={{ padding:8 }}>
                            <select value={d.repair_line_type} onChange={(e)=> setPartDrafts(prev=> prev.map(x=> x.id===d.id? { ...x, repair_line_type: e.target.value }: x))} style={{ width:'100%', padding:'8px', border:`1px solid ${colors.border}`, borderRadius:6 }}>
                              <option value="add">{t('Add')}</option>
                              <option value="remove">{t('Remove')}</option>
                              <option value="recycle">{t('Recycle')}</option>
                            </select>
                          </div>
                          <div style={{ padding:8 }}>
                            <select value={d.product_id} onChange={(e)=> setPartDrafts(prev=> prev.map(x=> x.id===d.id? { ...x, product_id: e.target.value }: x))} style={{ width:'100%', padding:'8px', border:`1px solid ${colors.border}`, borderRadius:6 }}>
                              <option value="">{t('Select product')}</option>
                              {(products||[]).map((p:any)=> <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                            </select>
                          </div>
                          <div style={{ padding:8 }}>
                            <select value={d.product_packaging_id} onChange={(e)=> setPartDrafts(prev=> prev.map(x=> x.id===d.id? { ...x, product_packaging_id: e.target.value }: x))} style={{ width:'100%', padding:'8px', border:`1px solid ${colors.border}`, borderRadius:6 }}>
                              <option value="">{t('Select packaging')}</option>
                              {(productPackagings||[]).map((pk:any)=> <option key={pk.id} value={String(pk.id)}>{pk.name}</option>)}
                            </select>
                          </div>
                          <div style={{ padding:8 }}>
                            <Input value={d.product_uom_qty} onChange={(e)=> setPartDrafts(prev=> prev.map(x=> x.id===d.id? { ...x, product_uom_qty: e.target.value.replace(/[^0-9.]/g,'') }: x))} />
                          </div>
                          <div style={{ padding:8 }}>
                            <Input value={d.quantity} onChange={(e)=> setPartDrafts(prev=> prev.map(x=> x.id===d.id? { ...x, quantity: e.target.value.replace(/[^0-9.]/g,'') }: x))} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Detail Modal (custom fade, no slide) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            animation: "fadeIn 150ms ease-out",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
          <div
            style={{
              width: "min(900px, 96vw)",
              maxHeight: "90vh",
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary }}>
                  {form.name || t("Add Lot/Serial Number")}
                </h3>
                <div style={{ fontSize: 13, color: colors.textSecondary }}>
                  {t("Status")}: {form.status}
                </div>
                {isLockedLot && (
                  <div
                    style={{
                      marginTop: 8,
                      background: "#FEE2E2",
                      color: "#B91C1C",
                      border: "1px solid #FCA5A5",
                      borderRadius: 6,
                      padding: "6px 8px",
                      fontSize: 12,
                      maxWidth: 560,
                    }}
                  >
                    {t("This lot cannot be modified because it has been used in stock operations.")}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: colors.textSecondary,
                  cursor: "pointer",
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "1rem 1.25rem", overflowY: "auto" }}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Name")}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Status")}</Label>
                  <Input
                    value={form.status}
                    readOnly
                    style={{
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Product")}</Label>
                  <div className="relative">
                    <Select
                      value={String(form.product_id || "")}
                      onValueChange={(v) => {
                        const pid = Number(v)
                        const p = (products || []).find((pp) => pp.id === pid)
                        const price = Number(p?.standard_price || 0)
                        setForm({
                          ...form,
                          product_id: pid,
                          product_name: p?.name || "",
                          product_default_code: p?.default_code || "",
                          avg_cost: price,
                          cost: price,
                          total_value: form.on_hand * price,
                        })
                      }}
                    >
                      <SelectTrigger
                        className="w-full"
                        style={{
                          border: `2px solid ${colors.border}`,
                          background: colors.background,
                          color: colors.textPrimary,
                        }}
                      >
                        <SelectValue placeholder={t("Select product")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(products || []).map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            <div className="flex items-center gap-2">
                              {p.image_1920 && (
                                <img
                                  src={
                                    String(p.image_1920).startsWith("data:")
                                      ? p.image_1920
                                      : `data:image/png;base64,${p.image_1920}`
                                  }
                                  alt={p.name}
                                  className="w-6 h-6 object-cover rounded"
                                />
                              )}
                              <span>{p.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("On Hand Quantity")}</Label>
                  <Input
                    value={form.on_hand}
                    readOnly
                    style={{
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Internal Reference")}</Label>
                  <Input
                    value={form.ref}
                    onChange={(e) => setForm({ ...form, ref: e.target.value })}
                    style={{
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Location")}</Label>
                  <div className="relative">
                    <Select
                      value={String(form.location_id || "")}
                      onValueChange={(v) => {
                        const lid = Number(v)
                        const loc = (locations || []).find((l) => l.id === lid)
                        setForm({
                          ...form,
                          location_id: lid,
                          location_name: loc?.complete_name || loc?.display_name || loc?.name || "",
                        })
                      }}
                    >
                      <SelectTrigger
                        className="w-full"
                        style={{
                          border: `2px solid ${colors.border}`,
                          background: colors.background,
                          color: colors.textPrimary,
                        }}
                      >
                        <SelectValue placeholder={t("Select location")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(locations || []).map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.complete_name || l.display_name || l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Total Value")}</Label>
                  <Input
                    value={`$${form.total_value.toLocaleString()}`}
                    readOnly
                    style={{
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Average cost")}</Label>
                  <Input
                    value={`$${Number(form.avg_cost).toFixed(2)}`}
                    readOnly
                    style={{
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Cost")}</Label>
                  <Input
                    value={form.cost}
                    onChange={(e) => {
                      const val = Number(e.target.value || 0)
                      setForm({ ...form, cost: val, total_value: form.on_hand * val })
                    }}
                    style={{
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label style={{ color: colors.textSecondary }}>{t("Description")}</Label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder={t("Add a description for this lot/serial number") as string}
                    style={{
                      width: "100%",
                      minHeight: 120,
                      border: `2px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.textPrimary,
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "0.75rem 1.25rem",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
                <Button
                  variant="outline"
                  className="bg-transparent"
                  style={{ borderColor: colors.border, color: colors.textPrimary }}
                  onClick={() => setIsModalOpen(false)}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  disabled={isLockedLot}
                  className="text-white disabled:opacity-50"
                  style={{ background: colors.action }}
                  onClick={async () => {
                    try {
                      const sessionId = localStorage.getItem("sessionId") || sessionStorage.getItem("sessionId")
                      if (!sessionId) throw new Error("No session id")
                      const lotRecord = (lots || []).find((l) => selectedLot && String(l.id) === selectedLot.id) as any
                      const values: any = { name: form.name }
                      if (form.product_id) values.product_id = form.product_id
                      if (form.ref !== undefined) values.ref = form.ref
                      if (form.note !== undefined) values.note = form.note
                      // Only include these fields if the backend lot actually contains them to avoid server errors
                      if (lotRecord && Object.prototype.hasOwnProperty.call(lotRecord, 'total_value')) values.total_value = form.total_value
                      if (lotRecord && Object.prototype.hasOwnProperty.call(lotRecord, 'avg_cost')) values.avg_cost = form.avg_cost
                      if (lotRecord) {
                        await fetch(`${API_CONFIG.BACKEND_BASE_URL}/lots/${lotRecord.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ sessionId, values }),
                        })
                      } else {
                        const resp = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/lots/create`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ sessionId, values }),
                        })
                        await resp.json()
                      }
                      if (form.product_id && form.cost >= 0) {
                        const p = (products || []).find((pp) => pp.id === form.product_id)
                        if (p && Number(p.standard_price) !== Number(form.cost)) {
                          await fetch(`${API_CONFIG.BACKEND_BASE_URL}/products-single/${p.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sessionId, values: { standard_price: Number(form.cost) } }),
                          })
                        }
                      }
                      setIsModalOpen(false)
                      setToast({ text: selectedLot ? t("Lot updated successfully") : t("Lot created successfully"), state: "success" })
                    } catch (e) {
                      console.error(e)
                      setToast({ text: t("Failed to save lot. Please try again."), state: "error" })
                    }
                  }}
                >
                  {selectedLot ? t("Save") : t("Create")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast text={toast.text} state={toast.state} onClose={() => setToast(null)} />}
    </div>
  )
}
