"use client"

import { CardContent } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { useMemo, useState, useEffect } from "react"
import { Search, Plus, Package, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { StatCard } from "./components/StatCard"
import { OperationCard } from "./components/operationCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { API_CONFIG } from "./config/api"

type PickingTypeRecord = any

// Build operations view from context data
function buildPickingTypesView(records: PickingTypeRecord[]): { id: number, name: string, code: string, displayCode: string }[] {
  const codeDisplay: Record<string, string> = {
    incoming: "Receipt",
    outgoing: "Delivery",
    internal: "Internal Transfer",
    mrp_operation: "Manufacturing",
    repair_operation: "Repair",
    dropship: "Dropship",
  }
  return (records || []).map((r: any) => ({
    id: r.id,
    name: r.name || `Type ${r.id}`,
    code: r.code || "",
    displayCode: codeDisplay[r.code || ""] || (r.code || ""),
  }))
}

export default function OperationsPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()
  const { stockPickingTypes, warehouses, locations, categories, fetchData } = useData() as any
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Form state for modal
  const [form, setForm] = useState<any>({
    name: "",
    code: "",
    return_picking_type_id: "",
    sequence_code: "",
    create_backorder: "ask",
    warehouse_id: "",
    auto_show_reception_report: false,
    use_create_lots: false,
    use_existing_lots: false,
    show_entire_packs: false,
    default_location_src_id: "",
    default_location_dest_id: "",
    is_repairable: false,
    auto_batch: false,
    batch_max_lines: "",
    batch_max_pickings: "",
    batch_max_weight: "",
    batch_auto_confirm: false,
    batch_group_by_carrier: false,
    batch_group_by_destination: false,
    batch_group_by_src_loc: false,
    batch_group_by_dest_loc: false,
    wave_group_by_product: false,
    wave_group_by_category: false,
    wave_group_by_location: false,
    wave_category_ids: [] as number[],
    wave_location_ids: [] as number[],
    auto_print_delivery_slip: false,
    auto_print_return_slip: false,
    auto_print_product_labels: false,
    auto_print_lot_labels: false,
    auto_print_reception_report: false,
    auto_print_reception_report_labels: false,
    auto_print_package_label: false,
  })

  const codeOptions: { value: string, label: string }[] = [
    { value: "incoming", label: t("Receipt") as string },
    { value: "outgoing", label: t("Delivery") as string },
    { value: "internal", label: t("Internal Transfer") as string },
    { value: "mrp_operation", label: t("Manufacturing") as string },
    { value: "repair_operation", label: t("Repair") as string },
    { value: "dropship", label: t("Dropship") as string },
  ]

  const backorderOptions: { value: string, label: string }[] = [
    { value: "ask", label: t("Ask") as string },
    { value: "always", label: t("Always") as string },
    { value: "never", label: t("Never") as string },
  ]

  // Load datasets once per dataset, keyed by length to avoid unstable function deps
  useEffect(() => {
    if (!stockPickingTypes?.length) fetchData('stockPickingTypes')
  }, [stockPickingTypes?.length])
  useEffect(() => {
    if (!warehouses?.length) fetchData('warehouses')
  }, [warehouses?.length])
  useEffect(() => {
    if (!locations?.length) fetchData('locations')
  }, [locations?.length])
  useEffect(() => {
    if (!categories?.length) fetchData('categories')
  }, [categories?.length])

  const ptView = useMemo(() => buildPickingTypesView(stockPickingTypes || []), [stockPickingTypes])

  const filteredTypes = ptView.filter((r) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = r.name.toLowerCase().includes(q) || r.displayCode.toLowerCase().includes(q)
    const matchesType = typeFilter === "all" || r.displayCode.includes(typeFilter)
    // statusFilter not applicable here; keep it but ignore
    return matchesSearch && matchesType
  })

  const totalOperations = ptView.length
  const pendingOperations = 0
  const completedOperations = 0
  const uniqueTypes = Array.from(new Set(ptView.map((op) => op.displayCode).filter(Boolean)))

  const openModal = (rec: any | null) => {
    setSelectedType(rec)
    if (rec) {
      setForm({
        name: rec.name || "",
        code: rec.code || "",
        return_picking_type_id: Array.isArray(rec.return_picking_type_id) ? String(rec.return_picking_type_id[0]) : "",
        sequence_code: rec.sequence_code || "",
        create_backorder: rec.create_backorder || "ask",
        warehouse_id: Array.isArray(rec.warehouse_id) ? String(rec.warehouse_id[0]) : "",
        auto_show_reception_report: !!rec.auto_show_reception_report,
        use_create_lots: !!rec.use_create_lots,
        use_existing_lots: !!rec.use_existing_lots,
        show_entire_packs: !!rec.show_entire_packs,
        default_location_src_id: Array.isArray(rec.default_location_src_id) ? String(rec.default_location_src_id[0]) : "",
        default_location_dest_id: Array.isArray(rec.default_location_dest_id) ? String(rec.default_location_dest_id[0]) : "",
        is_repairable: !!rec.is_repairable,
        auto_batch: !!rec.auto_batch,
        batch_max_lines: rec.batch_max_lines != null ? String(rec.batch_max_lines) : "",
        batch_max_pickings: rec.batch_max_pickings != null ? String(rec.batch_max_pickings) : "",
        batch_max_weight: rec.batch_max_weight != null ? String(rec.batch_max_weight) : "",
        batch_auto_confirm: !!rec.batch_auto_confirm,
        batch_group_by_carrier: !!rec.batch_group_by_carrier,
        batch_group_by_destination: !!rec.batch_group_by_destination,
        batch_group_by_src_loc: !!rec.batch_group_by_src_loc,
        batch_group_by_dest_loc: !!rec.batch_group_by_dest_loc,
        wave_group_by_product: !!rec.wave_group_by_product,
        wave_group_by_category: !!rec.wave_group_by_category,
        wave_group_by_location: !!rec.wave_group_by_location,
        wave_category_ids: Array.isArray(rec.wave_category_ids)
          ? rec.wave_category_ids.map((c: any) => (Array.isArray(c) ? c[0] : c)).filter((v: any) => typeof v === 'number')
          : [],
        wave_location_ids: Array.isArray(rec.wave_location_ids)
          ? rec.wave_location_ids.map((l: any) => (Array.isArray(l) ? l[0] : l)).filter((v: any) => typeof v === 'number')
          : [],
        auto_print_delivery_slip: !!rec.auto_print_delivery_slip,
        auto_print_return_slip: !!rec.auto_print_return_slip,
        auto_print_product_labels: !!rec.auto_print_product_labels,
        auto_print_lot_labels: !!rec.auto_print_lot_labels,
        auto_print_reception_report: !!rec.auto_print_reception_report,
        auto_print_reception_report_labels: !!rec.auto_print_reception_report_labels,
        auto_print_package_label: !!rec.auto_print_package_label,
      })
    } else {
      setForm((f:any)=>({ ...f, name: "", code: "", return_picking_type_id: "", sequence_code: "", create_backorder: "ask", warehouse_id: "", default_location_src_id: "", default_location_dest_id: "" }))
    }
    setIsModalOpen(true)
  }

  const closeModal = () => { setIsModalOpen(false); setSelectedType(null) }

  const saveType = async () => {
    const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
    if (!sessionId) return
    const values:any = {}
    if (form.name !== undefined) values.name = form.name
    if (form.code) values.code = form.code
    if (form.sequence_code !== undefined) values.sequence_code = form.sequence_code
    if (form.create_backorder) values.create_backorder = form.create_backorder
    if (form.return_picking_type_id) values.return_picking_type_id = Number(form.return_picking_type_id)
    if (form.warehouse_id) values.warehouse_id = Number(form.warehouse_id)
    if (form.default_location_src_id) values.default_location_src_id = Number(form.default_location_src_id)
    if (form.default_location_dest_id) values.default_location_dest_id = Number(form.default_location_dest_id)
    // booleans
    const bools = [
      'auto_show_reception_report','use_create_lots','use_existing_lots','show_entire_packs','is_repairable','auto_batch','batch_auto_confirm','batch_group_by_carrier','batch_group_by_destination','batch_group_by_src_loc','batch_group_by_dest_loc','wave_group_by_product','wave_group_by_category','wave_group_by_location','auto_print_delivery_slip','auto_print_return_slip','auto_print_product_labels','auto_print_lot_labels','auto_print_reception_report','auto_print_reception_report_labels','auto_print_package_label'
    ] as const
    for (const k of bools) { if (typeof form[k] === 'boolean') (values as any)[k] = !!form[k] }
    // numbers
    if (form.batch_max_lines !== "") values.batch_max_lines = Number(form.batch_max_lines)
    if (form.batch_max_pickings !== "") values.batch_max_pickings = Number(form.batch_max_pickings)
    if (form.batch_max_weight !== "") values.batch_max_weight = Number(form.batch_max_weight)
    if (Array.isArray(form.wave_category_ids)) values.wave_category_ids = form.wave_category_ids.map((n: any)=> Number(n)).filter((n: any)=> !Number.isNaN(n))
    if (Array.isArray(form.wave_location_ids)) values.wave_location_ids = form.wave_location_ids.map((n: any)=> Number(n)).filter((n: any)=> !Number.isNaN(n))

    let res
    if (selectedType?.id) {
      res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/picking-types/${selectedType.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
    } else {
      res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/picking-types/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
    }
    const data = await res.json().catch(()=>({}))
    if (res.ok && (data?.success || data?.id)) {
      await fetchData('stockPickingTypes')
      closeModal()
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
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
          }
        `}
      </style>

      <div className="mx-auto max-w-[1600px] space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t("Operation Types")}
            </h1>
            <p className="mt-2 text-lg" style={{ color: colors.textSecondary }}>
              {t("Manage warehouse operations and transfers")}
            </p>
          </div>
          <Button
            className="text-white transition-all shadow-lg hover:shadow-xl h-11 px-6"
            style={{ background: colors.action }}
            onClick={() => openModal(null)}
          >
            <Plus className={`${isRTL ? "ml-2" : "mr-2"} h-5 w-5`} />
            {t("New Operation")}
          </Button>
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
                  placeholder={t("Search by reference, product, or location...")}
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
                  <SelectItem value="Draft">{t("Draft")}</SelectItem>
                  <SelectItem value="Waiting">{t("Waiting")}</SelectItem>
                  <SelectItem value="Ready">{t("Ready")}</SelectItem>
                  <SelectItem value="Done">{t("Done")}</SelectItem>
                  <SelectItem value="Cancelled">{t("Cancelled")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Types")}</SelectItem>
                  {uniqueTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
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
          {filteredTypes.map((r, idx) => (
            <OperationCard key={r.id} operation={{ id: String(r.id), reference: r.name, product: r.displayCode, quantity: 0, sourceLocation: '', destinationLocation: '', scheduledDate: '', operationType: r.displayCode }} onClick={() => openModal((stockPickingTypes||[]).find((x:any)=> x.id===r.id))} index={idx} />
          ))}
        </div>

        {filteredTypes.length === 0 && (
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
              {t("No operations found")}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
              {t("Try adjusting your filters or search term")}
            </p>
          </div>
        )}
      </div>

      {/* Edit/Create Picking Type Modal */}
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
              width: "min(700px, 96vw)",
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
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary }}>
                {selectedType?.id ? t("Edit Operation Type") : t("New Operation Type")}
              </h3>
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
            <div style={{ padding: "1.25rem", overflowY: "auto" }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>{t('Operation type')}</div>
                  <Input value={form.name} onChange={(e)=> setForm((s:any)=> ({...s, name: e.target.value}))} style={{ border: `1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>{t('Type of operation')}</div>
                  <select value={form.code} onChange={(e)=> setForm((s:any)=> ({...s, code: e.target.value}))} style={{ width:'100%', padding:'0.6rem 0.75rem', border:`1px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                    <option value="">{t('Select')}</option>
                    {codeOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>{t('Returns type')}</div>
                  <select value={form.return_picking_type_id} onChange={(e)=> setForm((s:any)=> ({...s, return_picking_type_id: e.target.value}))} style={{ width:'100%', padding:'0.6rem 0.75rem', border:`1px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                    <option value="">{t('Select')}</option>
                    {(stockPickingTypes||[]).map((pt:any)=> (<option key={pt.id} value={String(pt.id)}>{pt.name || pt.code || pt.id}</option>))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>{t('Sequence prefix')}</div>
                  <Input value={form.sequence_code} onChange={(e)=> setForm((s:any)=> ({...s, sequence_code: e.target.value}))} style={{ border: `1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>{t('Create Backorder')}</div>
                  <select value={form.create_backorder} onChange={(e)=> setForm((s:any)=> ({...s, create_backorder: e.target.value}))} style={{ width:'100%', padding:'0.6rem 0.75rem', border:`1px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                    {backorderOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>{t('Warehouse')}</div>
                  <select value={form.warehouse_id} onChange={(e)=> setForm((s:any)=> ({...s, warehouse_id: e.target.value}))} style={{ width:'100%', padding:'0.6rem 0.75rem', border:`1px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                    <option value="">{t('Select')}</option>
                    {(warehouses||[]).map((w:any)=> (<option key={w.id} value={String(w.id)}>{w.display_name || w.name || w.id}</option>))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap:'1rem', alignItems: 'center' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={!!form.auto_show_reception_report} onChange={(e)=> setForm((s:any)=> ({...s, auto_show_reception_report: e.target.checked}))} />
                    {t('Show Reception Report at Validation')}
                  </label>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>{t('Lots/serial numbers')}</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input type="checkbox" checked={!!form.use_create_lots} onChange={(e)=> setForm((s:any)=> ({...s, use_create_lots: e.target.checked}))} />
                      {t('Create new')}
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input type="checkbox" checked={!!form.use_existing_lots} onChange={(e)=> setForm((s:any)=> ({...s, use_existing_lots: e.target.checked}))} />
                      {t('Use existing ones')}
                    </label>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>{t('Packages')}</h4>
                  <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={!!form.show_entire_packs} onChange={(e)=> setForm((s:any)=> ({...s, show_entire_packs: e.target.checked}))} />
                    {t('Move entire package')}
                  </label>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>{t('Locations')}</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>{t('Source Location')}</div>
                      <select value={form.default_location_src_id} onChange={(e)=> setForm((s:any)=> ({...s, default_location_src_id: e.target.value}))} style={{ width:'100%', padding:'0.6rem 0.75rem', border:`1px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                        <option value="">{t('Select')}</option>
                        {(locations||[]).map((loc:any)=> (<option key={loc.id} value={String(loc.id)}>{loc.complete_name || loc.display_name || loc.name || loc.id}</option>))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>{t('Destination Location')}</div>
                      <select value={form.default_location_dest_id} onChange={(e)=> setForm((s:any)=> ({...s, default_location_dest_id: e.target.value}))} style={{ width:'100%', padding:'0.6rem 0.75rem', border:`1px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary }}>
                        <option value="">{t('Select')}</option>
                        {(locations||[]).map((loc:any)=> (<option key={loc.id} value={String(loc.id)}>{loc.complete_name || loc.display_name || loc.name || loc.id}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>{t('Repairs')}</h4>
                  <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={!!form.is_repairable} onChange={(e)=> setForm((s:any)=> ({...s, is_repairable: e.target.checked}))} />
                    {t('Create Repair Orders from Returns')}
                  </label>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>{t('Batch & Wave Transfers')}</h4>
                  <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 8 }}>
                    <input type="checkbox" checked={!!form.auto_batch} onChange={(e)=> setForm((s:any)=> ({...s, auto_batch: e.target.checked}))} />
                    {t('Automatic Batches')}
                  </label>
                  {form.auto_batch && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                      <Input value={form.batch_max_lines} onChange={(e)=> setForm((s:any)=> ({...s, batch_max_lines: e.target.value.replace(/[^0-9]/g, '')}))} placeholder={t('Max lines') as string} style={{ border:`1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary }} />
                      <Input value={form.batch_max_pickings} onChange={(e)=> setForm((s:any)=> ({...s, batch_max_pickings: e.target.value.replace(/[^0-9]/g, '')}))} placeholder={t('Maximum transfers') as string} style={{ border:`1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary }} />
                      <Input value={form.batch_max_weight} onChange={(e)=> setForm((s:any)=> ({...s, batch_max_weight: e.target.value.replace(/[^0-9.]/g, '')}))} placeholder={t('Weight') as string} style={{ border:`1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary }} />
                      <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <input type="checkbox" checked={!!form.batch_auto_confirm} onChange={(e)=> setForm((s:any)=> ({...s, batch_auto_confirm: e.target.checked}))} />
                        {t('Auto-confirm')}
                      </label>
                      <div style={{ gridColumn:'1 / -1' }}>
                        <h5 style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, margin: '0 0 6px' }}>{t('Batch grouping')}</h5>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                          <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.batch_group_by_carrier} onChange={(e)=> setForm((s:any)=> ({...s, batch_group_by_carrier: e.target.checked}))} />{t('Contact')}</label>
                          <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.batch_group_by_destination} onChange={(e)=> setForm((s:any)=> ({...s, batch_group_by_destination: e.target.checked}))} />{t('Destination Country')}</label>
                          <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.batch_group_by_src_loc} onChange={(e)=> setForm((s:any)=> ({...s, batch_group_by_src_loc: e.target.checked}))} />{t('Source Location')}</label>
                          <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.batch_group_by_dest_loc} onChange={(e)=> setForm((s:any)=> ({...s, batch_group_by_dest_loc: e.target.checked}))} />{t('Desination Location')}</label>
                        </div>
                      </div>
                      <div style={{ gridColumn:'1 / -1' }}>
                        <h5 style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, margin: '0 0 6px' }}>{t('Waves grouping')}</h5>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                          <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.wave_group_by_product} onChange={(e)=> setForm((s:any)=> ({...s, wave_group_by_product: e.target.checked}))} />{t('Product')}</label>
                          <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.wave_group_by_category} onChange={(e)=> setForm((s:any)=> ({...s, wave_group_by_category: e.target.checked}))} />{t('Product Category')}</label>
                          <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.wave_group_by_location} onChange={(e)=> setForm((s:any)=> ({...s, wave_group_by_location: e.target.checked}))} />{t('Location')}</label>
                        </div>
                        {form.wave_group_by_category && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>{t('Wave Product Categories')}</div>
                            <select
                              multiple
                              value={(form.wave_category_ids || []).map(String)}
                              onChange={(e)=> {
                                const selected = Array.from(e.target.selectedOptions).map((o:any)=> Number(o.value)).filter((n)=> !Number.isNaN(n))
                                setForm((s:any)=> ({...s, wave_category_ids: selected}))
                              }}
                              style={{ width:'100%', padding:'0.4rem 0.5rem', border:`1px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary, minHeight: 120 }}
                            >
                              {(categories||[]).map((c:any)=> (
                                <option key={c.id} value={String(c.id)}>{c.display_name || c.name || c.id}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {form.wave_group_by_location && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>{t('Wave Locations')}</div>
                            <select
                              multiple
                              value={(form.wave_location_ids || []).map(String)}
                              onChange={(e)=> {
                                const selected = Array.from(e.target.selectedOptions).map((o:any)=> Number(o.value)).filter((n)=> !Number.isNaN(n))
                                setForm((s:any)=> ({...s, wave_location_ids: selected}))
                              }}
                              style={{ width:'100%', padding:'0.4rem 0.5rem', border:`1px solid ${colors.border}`, borderRadius:8, background: colors.background, color: colors.textPrimary, minHeight: 120 }}
                            >
                              {(locations||[]).map((loc:any)=> (
                                <option key={loc.id} value={String(loc.id)}>{loc.complete_name || loc.display_name || loc.name || loc.id}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>{t('Print on Validation')}</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.auto_print_delivery_slip} onChange={(e)=> setForm((s:any)=> ({...s, auto_print_delivery_slip: e.target.checked}))} />{t('Delivery Slip')}</label>
                    <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.auto_print_return_slip} onChange={(e)=> setForm((s:any)=> ({...s, auto_print_return_slip: e.target.checked}))} />{t('Return Slip')}</label>
                    <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.auto_print_product_labels} onChange={(e)=> setForm((s:any)=> ({...s, auto_print_product_labels: e.target.checked}))} />{t('Product Labels')}</label>
                    <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.auto_print_lot_labels} onChange={(e)=> setForm((s:any)=> ({...s, auto_print_lot_labels: e.target.checked}))} />{t('Lot/SN Labels')}</label>
                    <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.auto_print_reception_report} onChange={(e)=> setForm((s:any)=> ({...s, auto_print_reception_report: e.target.checked}))} />{t('Reception Report')}</label>
                    <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.auto_print_reception_report_labels} onChange={(e)=> setForm((s:any)=> ({...s, auto_print_reception_report_labels: e.target.checked}))} />{t('Reception Report Labels')}</label>
                    <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={!!form.auto_print_package_label} onChange={(e)=> setForm((s:any)=> ({...s, auto_print_package_label: e.target.checked}))} />{t('Package Content')}</label>
                  </div>
                </div>

              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 12,
                padding: "0.75rem 1.25rem",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <Button
                variant="outline"
                className="bg-transparent"
                style={{ borderColor: colors.border, color: colors.textPrimary }}
                onClick={() => setIsModalOpen(false)}
              >
                {t("Close")}
              </Button>
              <Button onClick={saveType} style={{ background: colors.action, color: '#fff' }}>
                {selectedType?.id ? t('Save') : t('Create')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
