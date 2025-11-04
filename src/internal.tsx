"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import {
  Search,
  Plus,
  Package,
  Clock,
  CheckCircle2,
  FileText,
  MapPin,
  ArrowRight,
  ArrowLeft,
  X,
  Edit,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useData } from "../context/data"
import { StatCard } from "./components/StatCard"
import { InternalTransferCard } from "./components/InternalTransferCard"

function mapPickingToInternalCard(p: any) {
  const stateMap: Record<string, string> = {
    draft: "draft",
    confirmed: "waiting",
    assigned: "ready",
    waiting: "waiting",
    done: "done",
    cancel: "cancelled",
  }
  const ops = Array.isArray(p.move_line_ids)
    ? p.move_line_ids.length
    : Array.isArray(p.move_lines)
      ? p.move_lines.length
      : 0
  return {
    id: p.id,
    reference: p.name,
    contact: p.partner_id?.[1] || "",
    from: p.location_id?.[1] || "",
    to: p.location_dest_id?.[1] || "",
    sourceLocation: p.location_id?.[1] || "",
    destinationLocation: p.location_dest_id?.[1] || "",
    scheduledDate: p.scheduled_date || p.scheduled_date_deadline || "",
    sourceDocument: p.origin || "",
    batchTransfer: p.batch_id?.[1] || "",
    operationType: p.picking_type_id?.[1] || "Internal Transfers",
    status: stateMap[p.state] || p.state || "draft",
    operations: new Array(ops).fill(0),
  }
}

export default function InternalTransfersPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()
  const { pickings, stockPickingTypes } = useData()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [toFilter, setToFilter] = useState<string>("all")
  const [fromFilter, setFromFilter] = useState<string>("all")

  const transfers = useMemo(() => {
    const codeByTypeId: Record<number, string> = {}
    for (const t of stockPickingTypes || []) {
      if (t?.id != null && typeof t.code === "string") codeByTypeId[t.id] = t.code
    }
    const internals = (pickings || []).filter((p) => {
      const direct = p.picking_type_code
      if (typeof direct === "string") return direct === "internal"
      const typeId = p.picking_type_id?.[0]
      const code = typeId != null ? codeByTypeId[typeId] : undefined
      return code === "internal"
    })
    return internals.map(mapPickingToInternalCard)
  }, [pickings, stockPickingTypes])

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      transfer.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.sourceDocument.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter
    const matchesTo = toFilter === "all" || transfer.to === toFilter
    const matchesFrom = fromFilter === "all" || transfer.from === fromFilter

    return matchesSearch && matchesStatus && matchesTo && matchesFrom
  })

  const uniqueStatuses = Array.from(new Set(transfers.map((t) => t.status)))
  const uniqueToLocations = Array.from(new Set(transfers.map((t) => t.to).filter(Boolean)))
  const uniqueFromLocations = Array.from(new Set(transfers.map((t) => t.from).filter(Boolean)))

  const totalTransfers = transfers.length
  const draftTransfers = transfers.filter((t) => t.status === "draft").length
  const todayStr = new Date().toISOString().slice(0, 10)
  const scheduledToday = transfers.filter((t) => (t.scheduledDate || "").slice(0, 10) === todayStr).length
  const completedTransfers = transfers.filter((t) => t.status === "done").length

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "draft":
        return { bg: colors.todo, text: "#FFFFFF", border: colors.todo }
      case "waiting":
      case "ready":
        return { bg: colors.inProgress, text: "#FFFFFF", border: colors.inProgress }
      case "done":
        return { bg: colors.success, text: "#FFFFFF", border: colors.success }
      case "cancelled":
        return { bg: colors.cancel, text: "#FFFFFF", border: colors.cancel }
      default:
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const openModal = (transfer: any) => {
    setSelectedTransfer(transfer)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTransfer(null)
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
              <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem", color: colors.textPrimary }}>
                {t("Internal Transfers")}
              </h1>
              <p style={{ fontSize: "1rem", opacity: 0.9, color: colors.textSecondary }}>
                {t("Manage internal warehouse transfers and movements")}
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
            >
              <Plus size={20} />
              {t("New Transfer")}
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            <StatCard 
              label={t("Total Transfers")} 
              value={totalTransfers} 
              icon={Package} 
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              delay={0} 
              />
            <StatCard 
              label={t("Draft Transfers")} 
              value={draftTransfers} 
              icon={FileText} 
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              delay={1}
            />
            <StatCard 
              label={t("Scheduled Today")} 
              value={scheduledToday} 
              icon={Clock} gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" 
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

      {/* Main Content */}
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
                  type="text"
                  placeholder={t("Search transfers...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: "3rem",
                    padding: "0.625rem 0.875rem 0.625rem 3rem",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "8px",
                    fontSize: "1rem",
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
                      {t(getStatusLabel(status))}
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
          {filteredTransfers.map((transfer) => (
            <InternalTransferCard key={transfer.id} transfer={transfer} onClick={() => openModal(transfer)} />
          ))}
        </div>

        {filteredTransfers.length === 0 && (
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", background: colors.card }}>
            <CardContent style={{ padding: "3rem", textAlign: "center" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${colors.action}15, ${colors.action}05)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                }}
              >
                <Package size={40} color={colors.textSecondary} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
                {t("No transfers found")}
              </h3>
              <p style={{ color: colors.textSecondary }}>{t("Try adjusting your search criteria")}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {isModalOpen && selectedTransfer && (
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
                background: colors.action,
                padding: "1.5rem 2rem",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#FFFFFF", marginBottom: "0.25rem" }}>
                  {selectedTransfer.reference}
                </h2>
                <p style={{ fontSize: "0.875rem", color: "#FFFFFF", opacity: 0.9 }}>Internal Transfer Details</p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={24} color="#FFFFFF" />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "2rem" }}>
              {/* Status and Actions */}
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}
              >
                <Badge
                  style={{
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    background: getStatusStyle(selectedTransfer.status).bg,
                    border: `1px solid ${getStatusStyle(selectedTransfer.status).border}`,
                    color: getStatusStyle(selectedTransfer.status).text,
                    borderRadius: "6px",
                  }}
                >
                  {getStatusLabel(selectedTransfer.status)}
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
                  }}
                >
                  <Edit size={16} />
                  Edit Transfer
                </Button>
              </div>

              {/* Transfer Information */}
              <div style={{ marginBottom: "2rem" }}>
                <h3
                  style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "1rem" }}
                >
                  Transfer Information
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: colors.textSecondary,
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Contact
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedTransfer.contact || "—"}</p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: colors.textSecondary,
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Scheduled Date
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedTransfer.scheduledDate}</p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: colors.textSecondary,
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Operation Type
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedTransfer.operationType}</p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: colors.textSecondary,
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Source Document
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>
                      {selectedTransfer.sourceDocument || "—"}
                    </p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: colors.textSecondary,
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Source Location
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedTransfer.sourceLocation}</p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: colors.textSecondary,
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Destination Location
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>
                      {selectedTransfer.destinationLocation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer Flow Visualization */}
              <div style={{ marginBottom: "2rem" }}>
                <h3
                  style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "1rem" }}
                >
                  Transfer Flow
                </h3>
                <div
                  style={{
                    background: colors.background,
                    padding: "1.5rem",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          background: colors.card,
                          padding: "1rem",
                          borderRadius: "8px",
                          border: `2px solid ${colors.action}`,
                        }}
                      >
                        <MapPin size={24} color={colors.textSecondary} style={{ margin: "0 auto 0.5rem" }} />
                        <p style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.5rem" }}>FROM</p>
                        <p style={{ fontSize: "1rem", fontWeight: "700", color: colors.textPrimary }}>
                          {selectedTransfer.from}
                        </p>
                      </div>
                    </div>
                    {isRTL ? (
                      <ArrowLeft size={32} color={colors.textSecondary} style={{ flexShrink: 0 }} />
                    ) : (
                      <ArrowRight size={32} color={colors.textSecondary} style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          background: colors.card,
                          padding: "1rem",
                          borderRadius: "8px",
                          border: `2px solid ${colors.action}`,
                        }}
                      >
                        <MapPin size={24} color={colors.textSecondary} style={{ margin: "0 auto 0.5rem" }} />
                        <p style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.5rem" }}>TO</p>
                        <p style={{ fontSize: "1rem", fontWeight: "700", color: colors.textPrimary }}>
                          {selectedTransfer.to}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations Table */}
              <div>
                <h3
                  style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "1rem" }}
                >
                  Operations
                </h3>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: colors.background }}>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          Product
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          Packaging
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          Demand
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          Unit
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            textAlign: "left",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: colors.textSecondary,
                          }}
                        >
                          Lot/Serial
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTransfer.operations.map((operation, index) => (
                        <tr
                          key={index}
                          style={{
                            borderTop: `1px solid ${colors.border}`,
                            background: index % 2 === 0 ? colors.card : colors.background,
                          }}
                        >
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {operation.product}
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {operation.packaging}
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {operation.demand}
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {operation.unit}
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {operation.lotSerial}
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
