"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { Search, Plus, Truck, FileText, X, Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useData } from "../context/data"
import { useAuth } from "../context/auth"
import { API_CONFIG } from "./config/api"
import PickingEditModal from "./components/pickingEditModal"

import { StatCard } from "./components/StatCard"
import { DeliveryCard } from "./components/DeliveryCard"

function mapPickingToDeliveryCard(p: any) {
  const stateMap: Record<string, string> = {
    done: "Done",
    assigned: "Ready",
    confirmed: "Waiting",
    waiting: "Waiting",
    draft: "Draft",
    cancel: "Cancelled",
  }
  const operationsCount = Array.isArray(p.move_line_ids)
    ? p.move_line_ids.length
    : Array.isArray(p.move_lines)
      ? p.move_lines.length
      : 0
  return {
    id: p.id,
    reference: p.name,
    deliveryAddress: p.partner_id?.[1] || "Customer",
    sourceLocation: p.location_id?.[1] || "",
    scheduledDate: p.scheduled_date || p.scheduled_date_deadline || "",
    sourceDocument: p.origin || "",
    batchTransfer: p.batch_id?.[1] || "",
    status: stateMap[p.state] || p.state || "Draft",
    operations: new Array(operationsCount).fill(0),
  }
}

export default function TransferDeliveriesPage() {
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
  const [isCreating, setIsCreating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [ops, setOps] = useState<
    Array<{ productId: number | null; packagingId: number | null; qty: string; uomId: number | null }>
  >([])
  const [form, setForm] = useState({
    partnerId: null as number | null,
    locationId: null as number | null,
    scheduledDate: "",
    pickingTypeId: null as number | null,
    origin: "",
    trackingRef: "",
    weightKg: "",
    note: "",
  })

  const deliveries = useMemo(() => {
    const codeByTypeId: Record<number, string> = {}
    for (const t of stockPickingTypes || []) {
      if (t?.id != null && typeof t.code === "string") codeByTypeId[t.id] = t.code
    }
    const outgoing = (pickings || []).filter((p) => {
      const direct = p.picking_type_code
      if (typeof direct === "string") return direct === "outgoing"
      const typeId = p.picking_type_id?.[0]
      const code = typeId != null ? codeByTypeId[typeId] : undefined
      return code === "outgoing"
    })
    return outgoing.map(mapPickingToDeliveryCard)
  }, [pickings, stockPickingTypes])

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.sourceLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.sourceDocument.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter
    const matchesTo = toFilter === "all" || delivery.deliveryAddress === toFilter
    const matchesFrom = fromFilter === "all" || delivery.sourceLocation === fromFilter

    return matchesSearch && matchesStatus && matchesTo && matchesFrom
  })

  const uniqueStatuses = Array.from(new Set(deliveries.map((d) => d.status)))
  const uniqueToLocations = Array.from(new Set(deliveries.map((d) => d.deliveryAddress).filter(Boolean)))
  const uniqueFromLocations = Array.from(new Set(deliveries.map((d) => d.sourceLocation).filter(Boolean)))

  const totalDeliveries = deliveries.length
  const draftDeliveries = deliveries.filter((d) => d.status === "Draft").length
  const todayStr = new Date().toISOString().slice(0, 10)
  const scheduledToday = deliveries.filter((d) => (d.scheduledDate || "").slice(0, 10) === todayStr).length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return { bg: colors.success, text: "#FFFFFF", border: colors.success }
      case "Ready":
        return { bg: colors.inProgress, text: "#FFFFFF", border: colors.inProgress }
      case "Waiting":
        return { bg: colors.inProgress, text: "#FFFFFF", border: colors.inProgress }
      case "Draft":
        return { bg: colors.todo, text: "#FFFFFF", border: colors.todo }
      case "Cancelled":
        return { bg: colors.cancel, text: "#FFFFFF", border: colors.cancel }
      default:
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <CheckCircle2 className="w-4 h-4" />
      case "Ready":
        return <Clock className="w-4 h-4" />
      case "Waiting":
        return <AlertCircle className="w-4 h-4" />
      case "Draft":
        return <FileText className="w-4 h-4" />
      case "Cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  // Corrected variable name for completed count
  const completedTransfers = deliveries.filter((d) => d.status === "Done").length

  const openModal = (deliveryId: number) => {
    setSelectedPickingId(deliveryId)
    setIsCreating(false)
    setReadOnly(false)
    setIsModalOpen(true)
    fetchData("partners")
    fetchData("locations")
    fetchData("products")
    fetchData("uom")
    fetchData("productPackaging")
  }

  const handleNewDelivery = () => {
    setIsCreating(true)
    setReadOnly(false)
    setSelectedPickingId(null)
    setForm({
      partnerId: null,
      locationId: null,
      scheduledDate: new Date().toISOString().slice(0, 10),
      pickingTypeId: null,
      origin: "",
      trackingRef: "",
      weightKg: "",
      note: "",
    })
    setOps([])
    setDirty(false)
    setIsModalOpen(true)
    fetchData("partners")
    fetchData("locations")
    fetchData("products")
    fetchData("uom")
    fetchData("productPackaging")
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPickingId(null)
    setIsCreating(false)
    setDirty(false)
  }

  const onChange = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }))
    setDirty(true)
  }

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

  const onSave = async () => {
    const values: any = {
      partner_id: form.partnerId,
      scheduled_date: form.scheduledDate,
      picking_type_id: form.pickingTypeId,
      location_id: form.locationId,
      origin: form.origin,
      carrier_tracking_ref: form.trackingRef || null,
      weight: form.weightKg ? Number.parseFloat(form.weightKg) : null,
      note: form.note || null,
    }
    if (ops.length > 0) {
      values.move_ids_without_package = ops.map((op) => {
        const prod = (products || []).find((p: any) => p.id === op.productId)
        return {
          product_id: op.productId,
          product_uom_qty: Number.parseFloat(op.qty) || 0,
          product_uom: op.uomId,
          name: prod?.display_name || prod?.name || `Product ${op.productId}`,
        }
      })
    }
    const url = isCreating
      ? `${API_CONFIG.BACKEND_BASE_URL}/pickings/create`
      : `${API_CONFIG.BACKEND_BASE_URL}/pickings/${selectedPickingId}`
    const method = isCreating ? "POST" : "PUT"
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Session-ID": sessionId || "",
      },
      body: JSON.stringify(values),
    })
    const data = await res.json()
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

  return (
    <div style={{ minHeight: "100vh", background: colors.background }}>
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
                {t("Transfer Deliveries")}
              </h1>
              <p style={{ fontSize: "1rem", opacity: 0.9, color: colors.textSecondary }}>
                {t("Manage and track outbound transfer deliveries")}
              </p>
            </div>
            <Button
              onClick={handleNewDelivery}
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
            >
              <Plus size={20} />
              {t("New Delivery")}
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <StatCard
              label={t("Total Deliveries")}
              value={totalDeliveries}
              icon={Truck}
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              delay={0}
            />
            <StatCard
              label={t("Draft Deliveries")}
              value={draftDeliveries}
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
              value={completedTransfers}
              icon={CheckCircle2}
              gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
              delay={3}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "-2rem auto 0", padding: "0 2rem 2rem" }}>
        <Card style={{ marginBottom: "2rem", border: "none", boxShadow: "0 4px 12px rgba(27, 71, 93, 0.08)" }}>
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ position: "relative", width: "30%" }}>
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
                  placeholder={t("Search deliveries...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: "3rem",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "8px",
                    fontSize: "1rem",
                    background: colors.card,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              <div style={{ position: "relative", flex: 1 }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 2.5rem 0.625rem 1rem",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "8px",
                    fontSize: "1rem",
                    background: colors.card,
                    color: colors.textPrimary,
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="all">{t("All Statuses")}</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {t(status)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={20}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.textSecondary,
                    pointerEvents: "none",
                  }}
                />
              </div>

              <div style={{ position: "relative", flex: 1 }}>
                <select
                  value={toFilter}
                  onChange={(e) => setToFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 2.5rem 0.625rem 1rem",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "8px",
                    fontSize: "1rem",
                    background: colors.card,
                    color: colors.textPrimary,
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="all">{t("All Destinations")}</option>
                  {uniqueToLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={20}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.textSecondary,
                    pointerEvents: "none",
                  }}
                />
              </div>

              <div style={{ position: "relative", flex: 1 }}>
                <select
                  value={fromFilter}
                  onChange={(e) => setFromFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 2.5rem 0.625rem 1rem",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "8px",
                    fontSize: "1rem",
                    background: colors.card,
                    color: colors.textPrimary,
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="all">{t("All Sources")}</option>
                  {uniqueFromLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={20}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.textSecondary,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1.5rem" }}>
          {filteredDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onClick={() => openModal(delivery.id)}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              t={t}
              isRTL={isRTL}
            />
          ))}
        </div>

        {filteredDeliveries.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "#F2F3EC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <Truck className="w-10 h-10" style={{ color: "#1B475D" }} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1B475D", marginBottom: "8px" }}>
              {t("No deliveries found")}
            </h3>
            <p style={{ fontSize: "15px", color: "#1B475D" }}>
              {t("Try adjusting your search criteria or create a new delivery")}
            </p>
          </div>
        )}
      </div>

      {isModalOpen && selectedPickingId != null && (
        <PickingEditModal
          isOpen={isModalOpen}
          pickingId={selectedPickingId}
          variant="outgoing"
          onClose={closeModal}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
          onClick={() => setShowSuccess(false)}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: 16,
              width: "min(100%, 420px)",
              padding: "1.5rem",
              textAlign: "center",
              boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>
              {t("Delivery Created")}
            </h3>
            <p style={{ color: colors.textSecondary, marginBottom: 16 }}>
              {t("Your new delivery has been created successfully.")}
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => setShowSuccess(false)}
                style={{
                  background: colors.action,
                  color: "#FFFFFF",
                  border: "none",
                  padding: "0.6rem 1.25rem",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
                 
    </div>
  )
}
