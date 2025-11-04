"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers, Clock, CheckCircle2, Factory, Wrench, X, FileText } from "lucide-react"
import { useTheme } from "../context/theme"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "./components/StatCard"
import { ManufacturingOrderCard } from "./components/ManufacturingOrderCard"
import { useData } from "../context/data"

// Types for manufacturing data
interface ManufacturingOperation {
  name: string
  workCenter: string
  duration: number
  status: string
}

interface ManufacturingComponent {
  product: string
  from: string
  to: string
  quantity: number
  uom: string
}

interface ManufacturingOrder {
  id: number
  name: string
  reference: string
  product: string
  quantity: number
  uom: string
  scheduledDate: string
  responsible: string
  status: string
  operations: ManufacturingOperation[]
  components: ManufacturingComponent[]
}

export default function ManufacturingPage() {
  const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { productions, products, locations, uom, workcenters, projects, fetchData } = useData()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPickingId, setSelectedPickingId] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"components" | "workorders" | "byproducts" | "misc">("components")
  const [ops, setOps] = useState<
    Array<{ productId: number | null; qty: string; uomId: number | null; locationId: number | null }>
  >([])
  const [form, setForm] = useState({
    productId: null as number | null,
    quantity: "",
    uomId: null as number | null,
    scheduledDate: "",
    responsibleId: null as number | null,
    pickingTypeId: null as number | null,
    locationId: null as number | null,
    locationDestId: null as number | null,
    origin: "",
    note: "",
  })
  const [selectedMO, setSelectedMO] = useState<ManufacturingOrder | null>(null)

  // Editable lines state for modal
  const [componentLines, setComponentLines] = useState<Array<{
    product_id: number | null
    location_id: number | null
    location_dest_id: number | null
    product_uom_qty: string
    product_uom: number | null
  }>>([])
  const [workorderLines, setWorkorderLines] = useState<Array<{
    operation_id: string
    workcenter_id: number | null
    product_id: number | null
    qty_production: number
    duration_expected?: number
    duration_real?: number
  }>>([])
  const [byproductLines, setByproductLines] = useState<Array<{
    product_id: number | null
    location_dest_id: number | null
    product_uom_qty: string
    product_uom: number | null
  }>>([])
  const [misc, setMisc] = useState<{
    picking_type_id: number | null
    location_src_id: number | null
    location_dest_id: number | null
    project_id: number | null
  }>({ picking_type_id: null, location_src_id: null, location_dest_id: null, project_id: null })

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "draft":
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
      case "in progress":
      case "planned":
      case "ready":
        return { bg: colors.inProgress, text: "#0A0A0A", border: colors.inProgress }
      case "done":
        return { bg: colors.success, text: "#0A0A0A", border: colors.success }
      default:
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
    }
  }

  const getStatusLabel = (status: string) =>
    t(
      status
        .split(" ")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" "),
    )

  // Build manufacturing orders from mrp.production (backend route /api/productions)
  const manufacturingOrders: ManufacturingOrder[] = useMemo(() => {
    const mapStatus = (state: string): string => {
      switch (state) {
        case "to_close":
        case "progress":
          return "in progress"
        case "confirmed":
        case "planned":
          return "planned"
        case "done":
          return "done"
        case "draft":
          return "draft"
        default:
          return "draft"
      }
    }
    return (productions || []).map((p: any, idx: number) => {
      const id = typeof p.id === "number" ? p.id : idx
      const name = typeof p.name === "string" ? p.name : `MO/${id}`
      const reference = typeof p.origin === "string" ? p.origin : name
      const product = Array.isArray(p.product_id) ? p.product_id[1] : reference
      const quantity = typeof p.product_qty === "number" ? p.product_qty : 0
      const uom = Array.isArray(p.product_uom_id) ? p.product_uom_id[1] : ""
      const scheduledDate = typeof p.date_planned_start === "string" ? p.date_planned_start : ""
      const responsible = Array.isArray(p.user_id) ? p.user_id[1] : ""
      const status = mapStatus(String(p.state || "draft"))
      return {
        id,
        name,
        reference,
        product,
        quantity,
        uom,
        scheduledDate,
        responsible,
        status,
        operations: [],
        components: [],
      } as ManufacturingOrder
    })
  }, [productions])

  // Helpers to create/update productions via backend controller
  const createMO = async (values: any) => {
    const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
    if (!sessionId) throw new Error('No session ID')
    const resp = await fetch(`${BACKEND_BASE_URL}/productions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, values })
    })
    return resp.json()
  }

  const updateMO = async (id: number, values: any) => {
    const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
    if (!sessionId) throw new Error('No session ID')
    const resp = await fetch(`${BACKEND_BASE_URL}/productions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, values })
    })
    return resp.json()
  }

  const filteredMOs = manufacturingOrders.filter((mo) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      mo.name.toLowerCase().includes(q) ||
      mo.product.toLowerCase().includes(q) ||
      mo.reference.toLowerCase().includes(q) ||
      mo.responsible.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || mo.status === statusFilter
    const matchesResp = responsibleFilter === "all" || mo.responsible === responsibleFilter
    return matchesSearch && matchesStatus && matchesResp
  })

  const totalMOs = manufacturingOrders.length
  const draftMOs = manufacturingOrders.filter((m) => m.status === "draft").length
  const inProgressMOs = manufacturingOrders.filter(
    (m) => m.status === "in progress" || m.status === "planned" || m.status === "ready",
  ).length
  const doneMOs = manufacturingOrders.filter((m) => m.status === "done").length

  const uniqueStatuses = Array.from(new Set(manufacturingOrders.map((m) => m.status)))
  const uniqueResponsible = Array.from(
    new Set(
      manufacturingOrders
        .map((m) => m.responsible)
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
    )
  )

  const openModal = (mo: ManufacturingOrder) => {
    setSelectedMO(mo)
    setIsModalOpen(true)
    setActiveTab("components")
    setComponentLines([])
    setWorkorderLines([])
    setByproductLines([])
    setMisc({ picking_type_id: null, location_src_id: null, location_dest_id: null, project_id: null })
  }
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedMO(null)
  }

  const productOptions = products || []
  const locationOptions = locations || []
  const uomOptions = uom || []
  const workcenterOptions = workcenters || []
  const projectOptions = projects || []

  const renderProductItem = (p: any) => {
    const img = p.image_1920 ? `data:image/png;base64,${p.image_1920}` : undefined
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {img && <img src={img} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />}
        <span>{p.name}</span>
      </div>
    )
  }

  const toInt = (v: any) => (typeof v === "number" ? v : Number(v) || null)
  const toFloat = (v: string) => {
    const n = Number(v)
    return isFinite(n) ? n : 0
  }

  const saveMO = async () => {
    if (!selectedMO) return
    const move_raw_ids = componentLines
      .filter((l) => l.product_id && l.product_uom && l.location_id)
      .map((l) => [0, 0, {
        product_id: l.product_id,
        location_id: l.location_id,
        location_dest_id: l.location_dest_id,
        product_uom_qty: toFloat(l.product_uom_qty),
        product_uom: l.product_uom,
      }])
    const move_byproduct_ids = byproductLines
      .filter((l) => l.product_id && l.product_uom && l.location_dest_id)
      .map((l) => [0, 0, {
        product_id: l.product_id,
        location_dest_id: l.location_dest_id,
        product_uom_qty: toFloat(l.product_uom_qty),
        product_uom: l.product_uom,
      }])
    const workorder_ids = workorderLines
      .filter((l) => l.workcenter_id && l.product_id)
      .map((l) => [0, 0, {
        name: l.operation_id || undefined,
        workcenter_id: l.workcenter_id,
        product_id: l.product_id,
        qty_production: l.qty_production,
      }])

    const values: any = {}
    if (move_raw_ids.length) values.move_raw_ids = move_raw_ids
    if (move_byproduct_ids.length) values.move_byproduct_ids = move_byproduct_ids
    if (workorder_ids.length) values.workorder_ids = workorder_ids
    if (misc.picking_type_id) values.picking_type_id = misc.picking_type_id
    if (misc.location_src_id) values.location_src_id = misc.location_src_id
    if (misc.location_dest_id) values.location_dest_id = misc.location_dest_id
    if (misc.project_id) values.project_id = misc.project_id

    if (Object.keys(values).length === 0) return
    await updateMO(selectedMO.id, values)
    await fetchData('productions')
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 1500)
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.background }}>
      {/* Header */}
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
              <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", color: colors.textPrimary }}>
                {t("Manufacturing Orders")}
              </h1>
              <p style={{ fontSize: "1rem", color: colors.textSecondary }}>
                {t("Plan and track your manufacturing operations")}
              </p>
            </div>
            <Button
              style={{
                background: colors.action,
                color: "#FFFFFF",
                padding: "0.75rem 1.5rem",
                borderRadius: 8,
                border: "none",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              }}
            >
              <Layers size={20} />
              {t("New MO")}
            </Button>
          </div>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            <StatCard
              label={t("Total MOs")}
              value={totalMOs}
              icon={Factory}
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              delay={0}
            />
            <StatCard
              label={t("Draft")}
              value={draftMOs}
              icon={FileText}
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              delay={1}
            />
            <StatCard
              label={t("In Progress")}
              value={inProgressMOs}
              icon={Clock}
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              delay={2}
            />
            <StatCard
              label={t("Completed")}
              value={doneMOs}
              icon={CheckCircle2}
              gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
              delay={3}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1400px", margin: "-2rem auto 0", padding: "0 2rem 2rem" }}>
        <Card
          style={{
            marginBottom: "2rem",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            background: colors.card,
          }}
        >
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {/* Search */}
              <div style={{ position: "relative", width: "30%" }}>
                <Input
                  type="text"
                  placeholder={t("Search manufacturing orders...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: `2px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: "1rem",
                    background: colors.card,
                    color: colors.textPrimary,
                    paddingLeft: "1rem",
                    height: 40,
                  }}
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  style={{ width: 200, border: `2px solid ${colors.border}`, borderRadius: 8, background: colors.card }}
                >
                  <SelectValue placeholder={t("Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Statuses")}</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Responsible Filter */}
              <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                <SelectTrigger
                  style={{ width: 200, border: `2px solid ${colors.border}`, borderRadius: 8, background: colors.card }}
                >
                  <SelectValue placeholder={t("Responsible")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Responsible")}</SelectItem>
                  {uniqueResponsible.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* MO Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1.5rem" }}>
          {filteredMOs.map((mo) => (
            <ManufacturingOrderCard key={mo.id} order={mo} onClick={() => openModal(mo)} />
          ))}
        </div>

        {filteredMOs.length === 0 && (
          <div
            style={{
              background: colors.card,
              borderRadius: "1rem",
              padding: "4rem 2rem",
              textAlign: "center",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${colors.action}20, ${colors.success}20)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <Factory size={32} color={colors.action} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: colors.textPrimary, marginBottom: "0.5rem" }}>
              {t("No manufacturing orders found")}
            </h3>
            <p style={{ color: colors.textSecondary }}>{t("Try adjusting your search criteria")}</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedMO && (
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
            padding: "2rem",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: 12,
              maxWidth: 1000,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: colors.card,
                padding: "1.5rem 2rem",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `2px solid ${colors.border}`,
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: colors.textPrimary, marginBottom: "0.25rem" }}>
                  {selectedMO.name}
                </h2>
                <p style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Manufacturing Order Details")}</p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: colors.background,
                  border: "none",
                  borderRadius: 8,
                  padding: "0.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={24} color={colors.textPrimary} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "2rem" }}>
              {/* Status & Actions */}
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}
              >
                <Badge
                  style={{
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    background: getStatusStyle(selectedMO.status).bg,
                    border: `1px solid ${getStatusStyle(selectedMO.status).border}`,
                    color: getStatusStyle(selectedMO.status).text,
                  }}
                >
                  {getStatusLabel(selectedMO.status)}
                </Badge>
                <Button
                  style={{
                    background: colors.action,
                    color: "#FFFFFF",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Wrench size={16} />
                  {t("Plan/Start")}
                </Button>
              </div>

              {/* MO Information */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary, marginBottom: "1rem" }}>
                  {t("Order Information")}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: colors.textSecondary,
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Product")}
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedMO.product}</p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: colors.textSecondary,
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Quantity")}
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>
                      {selectedMO.quantity} {selectedMO.uom}
                    </p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: colors.textSecondary,
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Responsible")}
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedMO.responsible}</p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: colors.textSecondary,
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {t("Scheduled Date")}
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedMO.scheduledDate}</p>
                  </div>
                </div>
              </div>

              {/* Operations Table */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary, marginBottom: "1rem" }}>
                  {t("Operations")}
                </h3>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: colors.background }}>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Operation")}
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Work Center")}
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Duration")}
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMO.operations.map((op, i) => (
                        <tr
                          key={i}
                          style={{
                            borderTop: `1px solid ${colors.border}`,
                            background: i % 2 === 0 ? colors.card : colors.mutedBg,
                          }}
                        >
                          <td
                            style={{
                              padding: "1rem",
                              fontSize: "0.875rem",
                              color: colors.textPrimary,
                              fontWeight: 600,
                            }}
                          >
                            {op.name}
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {op.workCenter}
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {op.duration} {t("min")}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <Badge
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.5rem",
                                background: getStatusStyle(op.status).bg,
                                border: `1px solid ${getStatusStyle(op.status).border}`,
                                color: getStatusStyle(op.status).text,
                              }}
                            >
                              {getStatusLabel(op.status)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Components Table */}
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary, marginBottom: "1rem" }}>
                  {t("Components")}
                </h3>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: colors.background }}>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Product")}
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: colors.textSecondary,
                          }}
                        >
                          {t("From")}
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: colors.textSecondary,
                          }}
                        >
                          {t("To")}
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: colors.textSecondary,
                          }}
                        >
                          {t("Quantity")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMO.components.map((c, i) => (
                        <tr
                          key={i}
                          style={{
                            borderTop: `1px solid ${colors.border}`,
                            background: i % 2 === 0 ? colors.card : colors.mutedBg,
                          }}
                        >
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {c.product}
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>{c.from}</td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>{c.to}</td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {c.quantity} {c.uom}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mock data removed in favor of live data from context

// Local icon fallback for draft card
function FileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        stroke="#98A2B3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2V8H20" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
