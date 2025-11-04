("use client")

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { Search, Plus, Package, Clock, CheckCircle2, FileText, AlertCircle, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "../context/data"
import { useAuth } from "../context/auth"
import { API_CONFIG } from "./config/api"
import { DatePicker } from "./components/ui/date-picker"
import { StatCard } from "./components/StatCard"
import { ReceiptCard } from "./components/ReceiptCard"
import PickingEditModal from "./components/pickingEditModal"


// Map Odoo pickings to the UI shape this page expects
function mapPickingToReceiptCard(p: any) {
  const statusMap: Record<string, string> = {
    draft: "draft",
    confirmed: "ready",
    assigned: "ready",
    waiting: "ready",
    done: "done",
    cancel: "cancelled",
  }

  const operationsCount = Array.isArray(p.move_line_ids)
    ? p.move_line_ids.length
    : Array.isArray(p.move_lines)
      ? p.move_lines.length
      : 0
  return {
    id: p.id,
    reference: p.name,
    from: p.location_id?.[1] || "",
    to: p.location_dest_id?.[1] || "",
    contact: p.partner_id?.[1] || "",
    scheduledDate: p.scheduled_date || p.scheduled_date_deadline || "",
    sourceDocument: p.origin || "",
    batchTransfer: p.batch_id?.[1] || "",
    status: statusMap[p.state] || p.state || "draft",
    operations: new Array(operationsCount).fill(0),
  }
}

export default function TransferReceiptsPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()
  const {
    pickings,
    stockPickingTypes,
    partners,
    locations,
    products,
    uom,
    productPackaging,
    refreshAllData,
    fetchData,
  } = useData()
  const { sessionId } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [toFilter, setToFilter] = useState<string>("all")
  const [fromFilter, setFromFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPickingId, setSelectedPickingId] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [ops, setOps] = useState<
    Array<{ productId: number | null; packagingId: number | null; qty: string; uomId: number | null }>
  >([])
  const [isCreating, setIsCreating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [moveLines, setMoveLines] = useState<any[]>([])
  const [newMoveLine, setNewMoveLine] = useState<{ productId: number | null; packageId: number | null; qty: string; qtyDone: string; uomId: number | null }>({ productId: null, packageId: null, qty: "", qtyDone: "", uomId: null })
  const [addingLine, setAddingLine] = useState(false)
  const [form, setForm] = useState({
    partnerId: null as number | null,
    scheduledDate: "",
    pickingTypeId: null as number | null,
    locationDestId: null as number | null,
    origin: "",
    trackingRef: "",
    weightKg: "",
    note: "",
  })

  

  const uniqueStockPickingTypes = useMemo(() => {
    const seen = new Set<string>()
    const out: any[] = []
    for (const pt of stockPickingTypes || []) {
      const comp = Array.isArray(pt?.company_id) ? pt.company_id?.[1] : pt?.company_id
      const code = pt?.code
      const key = `${String(comp || "").trim()}::${String(code || "").trim()}`.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        out.push(pt)
      }
    }
    return out
  }, [stockPickingTypes])

  const unitUoms = useMemo(() => {
    return (uom || []).filter((u: any) => {
      const cat = Array.isArray(u?.category_id) ? u.category_id?.[1] : u?.category_id
      return String(cat || "")
        .toLowerCase()
        .includes("unit")
    })
  }, [uom])

  // Build incoming receipts from DataContext
  const receipts = useMemo(() => {
    const codeByTypeId: Record<number, string> = {}
    for (const t of stockPickingTypes || []) {
      if (t?.id != null && typeof t.code === "string") codeByTypeId[t.id] = t.code
    }
    const incoming = (pickings || []).filter((p) => {
      const direct = p.picking_type_code
      if (typeof direct === "string") return direct === "incoming"
      const typeId = p.picking_type_id?.[0]
      const code = typeId != null ? codeByTypeId[typeId] : undefined
      return code === "incoming"
    })
    return incoming.map(mapPickingToReceiptCard)
  }, [pickings, stockPickingTypes])

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.sourceDocument.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || receipt.status === statusFilter
    const matchesTo = toFilter === "all" || receipt.to === toFilter
    const matchesFrom = fromFilter === "all" || receipt.from === fromFilter

    return matchesSearch && matchesStatus && matchesTo && matchesFrom
  })

  
  const totalReceipts = receipts.length
  const draftReceipts = receipts.filter((r) => r.status === "draft").length
  const completedReceipts = receipts.filter((r) => r.status === "done").length
  const todayStr = new Date().toISOString().slice(0, 10)
  const scheduledToday = receipts.filter((r) => (r.scheduledDate || "").slice(0, 10) === todayStr).length

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "draft":
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
      case "ready":
        return { bg: colors.inProgress, text: "#0A0A0A", border: colors.inProgress }
      case "done":
        return { bg: colors.success, text: "#0A0A0A", border: colors.success }
      case "cancelled":
        return { bg: colors.cancel, text: "#FFFFFF", border: colors.cancel }
      default:
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
    }
  }

  const uniqueStatuses = Array.from(new Set(receipts.map((r) => r.status)))
  const uniqueTo = Array.from(new Set(receipts.map((r) => r.to).filter(Boolean)))
  const uniqueFrom = Array.from(new Set(receipts.map((r) => r.from).filter(Boolean)))
  const currentStatus = receipts.find((r) => r.id === selectedPickingId)?.status

  const openModal = (receiptId: number) => {
    if (isModalOpen) return
    const raw = (pickings || []).find((p: any) => p.id === receiptId) || {}
    // Prefetch datasets to ensure labels render
    if (!partners?.length) fetchData("partners")
    if (!locations?.length) fetchData("locations")
    if (!products?.length) fetchData("products")
    if (!uom?.length) fetchData("uom")
    if (!productPackaging?.length) fetchData("productPackaging")
    setSelectedPickingId(receiptId)
    setForm({
      partnerId: Array.isArray(raw.partner_id) ? raw.partner_id[0] : null,
      scheduledDate: raw.scheduled_date ? String(raw.scheduled_date).slice(0, 10) : "",
      pickingTypeId: Array.isArray(raw.picking_type_id) ? raw.picking_type_id[0] : null,
      locationDestId: Array.isArray(raw.location_dest_id) ? raw.location_dest_id[0] : null,
      origin: raw.origin || "",
      trackingRef: raw.carrier_tracking_ref || "",
      weightKg: raw.weight != null ? String(raw.weight) : "",
      note: raw.note || "",
    })
    setReadOnly(raw.state === "done" || raw.state === "cancel")
    setOps([])
    setDirty(false)
    setIsCreating(false)
    setIsModalOpen(true)
    // Load stock.move.line for this picking
    fetchMoveLinesByPicking(receiptId)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPickingId(null)
    setDirty(false)
    setIsCreating(false)
    setMoveLines([])
  }


  const getStatusIcon = (status: string) => {
  switch (status) {
    case "done":
      return <CheckCircle2 className="w-4 h-4" />
    case "ready":
      return <Clock className="w-4 h-4" />
    case "cancelled":
      return <XCircle className="w-4 h-4" />
    case "draft":
      return <FileText className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}
  

  const fetchMoveLinesByPicking = async (pickingId: number) => {
    if (!sessionId) return
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/move-lines/by-picking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, pickingId, fields: ['product_id','package_id','product_packaging_qty','quantity','product_uom_id','picking_id'] })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) setMoveLines(data.moveLines || [])
    } catch {}
  }

  const downloadBase64File = (base64: string, filename: string) => {
    try {
      const byteCharacters = atob(base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'document.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Failed to download file:', e)
    }
  }

  const validatePickingAction = async () => {
    if (!sessionId || selectedPickingId == null) return
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/pickings/${selectedPickingId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Validate failed')
      await fetchData('pickings')
      await fetchMoveLinesByPicking(selectedPickingId)
    } catch (e) {
      console.error('Validate error:', e)
    }
  }

  const printPickingAction = async () => {
    if (!sessionId || selectedPickingId == null) return
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/pickings/${selectedPickingId}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success || !data?.pdfBase64) throw new Error(data?.message || 'Print failed')
      downloadBase64File(data.pdfBase64, data.filename || `picking_${selectedPickingId}.pdf`)
    } catch (e) {
      console.error('Print error:', e)
    }
  }

  const returnPickingAction = async () => {
    if (!sessionId || selectedPickingId == null) return
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/pickings/${selectedPickingId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, kwargs: {} }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Return failed')
      await fetchData('pickings')
    } catch (e) {
      console.error('Return error:', e)
    }
  }

  const cancelPickingAction = async () => {
    if (!sessionId || selectedPickingId == null) return
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/pickings/${selectedPickingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Cancel failed')
      await fetchData('pickings')
    } catch (e) {
      console.error('Cancel error:', e)
    }
  }
  
  const createMoveLine = async () => {
    if (!sessionId || selectedPickingId == null) return
    if (!newMoveLine.productId || !newMoveLine.uomId) return
    const values: any = {
      product_id: newMoveLine.productId,
      product_uom_id: newMoveLine.uomId,
      product_packaging_qty: 0,
      quantity: Number(newMoveLine.qty || '0'),
      picking_id: selectedPickingId,
    }
    if (newMoveLine.packageId) values.package_id = newMoveLine.packageId
    const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/move-lines/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, values })
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data?.success) {
      await fetchMoveLinesByPicking(selectedPickingId)
      setNewMoveLine({ productId: null, packageId: null, qty: '', qtyDone: '', uomId: null })
      setAddingLine(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1200)
    }
  }

  const onChange = (patch: Partial<typeof form>) => {
    if (readOnly) return
    setForm((f) => ({ ...f, ...patch }))
    setDirty(true)
  }

  const onSave = async () => {
    if ((!isCreating && !selectedPickingId) || !sessionId) return
    const values: any = {}
    if (form.partnerId) values.partner_id = form.partnerId
    if (form.scheduledDate) values.scheduled_date = form.scheduledDate
    if (form.pickingTypeId) values.picking_type_id = form.pickingTypeId
    values.origin = form.origin || null
    values.carrier_tracking_ref = form.trackingRef || null
    values.weight = form.weightKg ? Number.parseFloat(form.weightKg) : null
    values.note = form.note || null

    // Create new move lines if any
    const newLines = ops.filter((l) => l.productId && l.uomId && Number(l.qty) > 0)
    if (newLines.length) {
      values.move_ids_without_package = newLines.map((l) => [
        0,
        0,
        {
          name:
            (products || []).find((p: any) => p.id === l.productId)?.display_name ||
            (products || []).find((p: any) => p.id === l.productId)?.name ||
            "",
          product_id: l.productId!,
          product_uom: l.uomId!,
          product_uom_qty: Number(l.qty),
          product_packaging_id: l.packagingId || null,
        },
      ])
    }
    if (form.locationDestId) values.location_dest_id = form.locationDestId

    const url = isCreating
      ? `${API_CONFIG.BACKEND_BASE_URL}/pickings/create`
      : `${API_CONFIG.BACKEND_BASE_URL}/pickings/${selectedPickingId}`
    const method = isCreating ? "POST" : "PUT"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, values }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data?.success) {
      await refreshAllData()
      if (isCreating) {
        setIsModalOpen(false)
        setShowSuccess(true)
      } else {
        closeModal()
      }
    }
  }

  const handleNewReceipt = () => {
    if (isModalOpen) return
    // Prefetch datasets to ensure labels render
    if (!partners?.length) fetchData("partners")
    if (!products?.length) fetchData("products")
    if (!uom?.length) fetchData("uom")
    if (!productPackaging?.length) fetchData("productPackaging")
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")
    setForm({
      partnerId: null,
      scheduledDate: `${yyyy}-${mm}-${dd}`,
      pickingTypeId: null,
      locationDestId: null,
      origin: "",
      trackingRef: "",
      weightKg: "",
      note: "",
    })
    setSelectedPickingId(null)
    setOps([])
    setReadOnly(false)
    setDirty(false)
    setIsCreating(true)
    setIsModalOpen(true)
  }


  

  return (
    <div style={{ minHeight: "100vh", background: colors.background }}>
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

      <div
        style={{
          background: colors.background,
          padding: "2rem 2rem 4rem 2rem",
          color: colors.textPrimary,
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem", color: colors.textPrimary }}>
                {t("Transfer Receipts")}
              </h1>
              <p style={{ fontSize: "1rem", opacity: 0.9, color: colors.textSecondary }}>
                {t("Manage incoming transfers and receipts")}
              </p>
            </div>
            <Button
              style={{
                background: colors.action,
                color: "#FFFFFF",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              }}
              onClick={handleNewReceipt}
            >
              <Plus size={20} />
              {t("New Receipt")}
            </Button>
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
              label={t("Total Receipts")}
              value={totalReceipts}
              icon={Package}
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              delay={0}
            />
            <StatCard
              label={t("Draft Receipts")}
              value={draftReceipts}
              icon={FileText}
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              delay={1}
            />
            <StatCard
              label={t("Scheduled Today")}
              value={scheduledToday}
              icon={Clock}
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              delay={2}
            />
            <StatCard
              label={t("Completed")}
              value={completedReceipts}
              icon={CheckCircle2}
              gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
              delay={3}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "-2rem auto 0", padding: "0 2rem 2rem" }}>
        <Card
          style={{
            marginBottom: "2rem",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            background: colors.card,
            borderRadius: "1rem",
          }}
        >
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 300px", minWidth: "250px" }}>
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
                <Input
                  type="text"
                  placeholder={t("Search receipts...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: "3rem",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "10px",
                    fontSize: "1rem",
                    background: colors.background,
                    color: colors.textPrimary,
                    height: "44px",
                    transition: "all 0.2s ease",
                  }}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  style={{
                    width: "180px",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "10px",
                    background: colors.background,
                    height: "44px",
                  }}
                >
                  <SelectValue placeholder={t("Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Statuses")}</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(status.charAt(0).toUpperCase() + status.slice(1))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={toFilter} onValueChange={setToFilter}>
                <SelectTrigger
                  style={{
                    width: "180px",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "10px",
                    background: colors.background,
                    height: "44px",
                  }}
                >
                  <SelectValue placeholder={t("To")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Destinations")}</SelectItem>
                  {uniqueTo.map((to) => (
                    <SelectItem key={to} value={to}>
                      {to}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={fromFilter} onValueChange={setFromFilter}>
                <SelectTrigger
                  style={{
                    width: "180px",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "10px",
                    background: colors.background,
                    height: "44px",
                  }}
                >
                  <SelectValue placeholder={t("From")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Sources")}</SelectItem>
                  {uniqueFrom.map((from) => (
                    <SelectItem key={from} value={from}>
                      {from}
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
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {filteredReceipts.map((receipt, idx) => (
            <ReceiptCard key={receipt.id} receipt={receipt} onClick={() => openModal(receipt.id)} index={idx} />
          ))}
        </div>

        {filteredReceipts.length === 0 && (
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
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: colors.textPrimary,
                marginBottom: "0.5rem",
              }}
            >
              {t("No receipts found")}
            </h3>
            <p style={{ fontSize: "0.9rem", color: colors.textSecondary }}>{t("Try adjusting your search criteria")}</p>
          </div>
        )}

        {isModalOpen && selectedPickingId != null && (
          <PickingEditModal
            isOpen={isModalOpen}
            pickingId={selectedPickingId}
            variant="incoming"
            onClose={closeModal}
          />
        )}
                   
      </div>
    </div>
  )
}
