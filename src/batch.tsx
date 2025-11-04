"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Search,
  Plus,
  Package,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  User,
  X,
  Edit,
  Truck,
  MapPin,
  Layers,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"

// Use real data from DataContext (stock.picking.transfer)
function mapTransfers(raw: any[]): any[] {
  return (raw || []).map((r: any, idx: number) => {
    const name = r.name || r.display_name || `TRANSFER-${idx + 1}`
    const responsible = (Array.isArray(r.user_id) ? r.user_id[1] : r.user_id) || r.responsible || '—'
    const scheduledDate = r.scheduled_date || r.scheduled || r.date || '—'
    const operationType = (Array.isArray(r.picking_type_id) ? r.picking_type_id[1] : r.operation_type) || '—'
    const dockLocation = r.dock_location || r.location_id?.[1] || '—'
    const vehicle = r.vehicle || '—'
    const vehicleCategory = r.vehicle_category || '—'
    const status = r.state || r.status || 'draft'
    const lines = Array.isArray(r.transfer_line_ids) ? r.transfer_line_ids : (r.move_line_ids || [])
    // Create simplified transfer items
    const transfers = (r.transfers || []).concat([])
    return {
      id: r.id || idx,
      batchTransfer: name,
      description: r.note || r.description || '—',
      scheduledDate,
      responsible,
      operationType,
      dockLocation,
      vehicle,
      vehicleCategory,
      status,
      transfers: (Array.isArray(r.transfer_ids) ? r.transfer_ids : []).map((t: any) => ({
        reference: t.reference || t.name || '—',
        from: t.location_id?.[1] || '—',
        to: t.location_dest_id?.[1] || '—',
        contact: Array.isArray(t.partner_id) ? t.partner_id[1] : (t.partner || '—'),
        sourceDocument: t.origin || '—',
        zip: t.zip || '—',
        status: t.state || 'draft',
      })) || transfers,
      _raw: r,
      _lines: lines,
    }
  })
}

export default function BatchTransfersPage() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { pickingTransfers } = useData()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dockFilter, setDockFilter] = useState<string>("all")
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all")

  const batches = mapTransfers(pickingTransfers)
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batchTransfer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.responsible.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.operationType.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || batch.status === statusFilter
    const matchesDock = dockFilter === "all" || batch.dockLocation === dockFilter
    const matchesResponsible = responsibleFilter === "all" || batch.responsible === responsibleFilter

    return matchesSearch && matchesStatus && matchesDock && matchesResponsible
  })

  const totalBatches = batches.length
  const draftBatches = batches.filter((b) => (b.status || '').includes("draft")).length
  const inProgressBatches = batches.filter((b) => (b.status || '').includes("progress") || (b.status || '').includes('ready')).length
  const completedBatches = batches.filter((b) => (b.status || '').includes("done")).length

  const uniqueStatuses = Array.from(new Set(batches.map((b) => b.status))).filter(Boolean) as string[]
  const uniqueDocks = Array.from(new Set(batches.map((b) => b.dockLocation))).filter(Boolean) as string[]
  const uniqueResponsible = Array.from(new Set(batches.map((b) => b.responsible))).filter(Boolean) as string[]

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "draft":
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
      case "in progress":
      case "ready":
        return { bg: colors.inProgress, text: "#0A0A0A", border: colors.inProgress }
      case "done":
        return { bg: colors.success, text: "#0A0A0A", border: colors.success }
      default:
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
    }
  }

  const getStatusLabel = (status: string) => {
    return status
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const openModal = (batch: any) => {
    setSelectedBatch(batch)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedBatch(null)
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
              <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem", color: colors.textPrimary }}>{t('Batch Transfers')}</h1>
              <p style={{ fontSize: "1rem", opacity: 0.95, color: colors.textSecondary }}>{t('Manage wave, batch, and cluster transfer operations')}</p>
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
              {t('New Batch')}
            </Button>
          </div>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            <Card style={{ background: colors.card, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "600", marginBottom: "0.5rem" }}>{t('Total Batches')}</p>
                    <p style={{ fontSize: "2rem", fontWeight: "700", color: colors.textPrimary }}>{totalBatches}</p>
                  </div>
                  <div
                    style={{
                      background: colors.action,
                      padding: "0.75rem",
                      borderRadius: "12px",
                    }}
                  >
                    <Layers size={24} color="#FFFFFF" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: colors.card, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "600", marginBottom: "0.5rem" }}>{t('Draft Batches')}</p>
                    <p style={{ fontSize: "2rem", fontWeight: "700", color: colors.textPrimary }}>{draftBatches}</p>
                  </div>
                  <div
                    style={{
                      background: colors.inProgress,
                      padding: "0.75rem",
                      borderRadius: "12px",
                    }}
                  >
                    <FileText size={24} color="#0A0A0A" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: colors.card, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "600", marginBottom: "0.5rem" }}>{t('In Progress')}</p>
                    <p style={{ fontSize: "2rem", fontWeight: "700", color: colors.textPrimary }}>{inProgressBatches}</p>
                  </div>
                  <div
                    style={{
                      background: colors.inProgress,
                      padding: "0.75rem",
                      borderRadius: "12px",
                    }}
                  >
                    <Clock size={24} color="#0A0A0A" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: colors.card, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "600", marginBottom: "0.5rem" }}>{t('Completed')}</p>
                    <p style={{ fontSize: "2rem", fontWeight: "700", color: colors.textPrimary }}>{completedBatches}</p>
                  </div>
                  <div
                    style={{
                      background: colors.success,
                      padding: "0.75rem",
                      borderRadius: "12px",
                    }}
                  >
                    <CheckCircle2 size={24} color="#0A0A0A" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1400px", margin: "-2rem auto 0", padding: "0 2rem 2rem" }}>
        <Card style={{ marginBottom: "2rem", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", background: colors.card }}>
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {/* Search Bar - 30% width */}
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
                  placeholder={t('Search batches...')}
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

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  style={{
                    width: "200px",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "8px",
                    background: colors.card,
                  }}
                >
                  <SelectValue placeholder={t('Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Statuses')}</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Dock Location Filter */}
              <Select value={dockFilter} onValueChange={setDockFilter}>
                <SelectTrigger
                  style={{
                    width: "200px",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "8px",
                    background: colors.card,
                  }}
                >
                  <SelectValue placeholder={t('Dock Location')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Docks')}</SelectItem>
                  {uniqueDocks.map((dock) => (
                    <SelectItem key={dock} value={dock}>
                      {dock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Responsible Filter */}
              <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                <SelectTrigger
                  style={{
                    width: "200px",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "8px",
                    background: colors.card,
                  }}
                >
                  <SelectValue placeholder={t('Responsible')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Responsible')}</SelectItem>
                  {uniqueResponsible.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Batch Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1.5rem" }}>
          {filteredBatches.map((batch) => (
            <Card
              key={batch.id}
              style={{
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: colors.card,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"
                e.currentTarget.style.transform = "translateY(-4px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"
                e.currentTarget.style.transform = "translateY(0)"
              }}
              onClick={() => openModal(batch)}
            >
              <CardContent style={{ padding: "1.5rem" }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "0.25rem" }}>
                      {batch.batchTransfer}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: colors.textSecondary, marginTop: "0.5rem" }}>{batch.description}</p>
                  </div>
                  <Badge
                    style={{
                      borderRadius: "6px",
                      padding: "0.25rem 0.75rem",
                      background: getStatusStyle(batch.status).bg,
                      border: `1px solid ${getStatusStyle(batch.status).border}`,
                      color: getStatusStyle(batch.status).text,
                    }}
                  >
                    {getStatusLabel(batch.status)}
                  </Badge>
                </div>

                {/* Operation Type Badge */}
                <div style={{ marginBottom: "1rem" }}>
                  <Badge
                    style={{
                      background: colors.background,
                      color: colors.textPrimary,
                      border: "none",
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    {batch.operationType}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <User size={14} color={colors.textSecondary} />
                      <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t('Responsible')}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "600" }}>{batch.responsible}</p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <Calendar size={14} color={colors.textSecondary} />
                      <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t('Scheduled Date')}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "600" }}>
                      {batch.scheduledDate === "2025-10-18" ? t('Today') : batch.scheduledDate}
                    </p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <MapPin size={14} color={colors.textSecondary} />
                      <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t('Dock Location')}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "600" }}>{batch.dockLocation}</p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <Truck size={14} color={colors.textSecondary} />
                      <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t('Vehicle')}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "600" }}>{batch.vehicle}</p>
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "1rem",
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Package size={16} color={colors.textSecondary} />
                    <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>
                      {batch.transfers.length} {batch.transfers.length === 1 ? t('Transfer') : t('Transfers')}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{batch.vehicleCategory}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBatches.length === 0 && (
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", background: colors.card }}>
            <CardContent style={{ padding: "3rem", textAlign: "center" }}>
              <Layers size={48} color={colors.success} style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>{t('No batch transfers found')}</h3>
              <p style={{ color: colors.textSecondary }}>{t('Try adjusting your search criteria')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedBatch && (
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
                background: colors.card,
                padding: "1.5rem 2rem",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `2px solid ${colors.border}`,
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "0.25rem" }}>
                  {selectedBatch.batchTransfer}
                </h2>
                <p style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t('Batch Transfer Details')}</p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: colors.background,
                  border: "none",
                  borderRadius: "8px",
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
                    background: getStatusStyle(selectedBatch.status).bg,
                    border: `1px solid ${getStatusStyle(selectedBatch.status).border}`,
                    color: getStatusStyle(selectedBatch.status).text,
                  }}
                >
                  {getStatusLabel(selectedBatch.status)}
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
                  {t('Edit Batch')}
                </Button>
              </div>

              {/* Batch Information */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "1rem" }}>{t('Batch Information')}</h3>
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
                      {t('Description')}
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedBatch.description}</p>
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
                      {t('Responsible')}
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedBatch.responsible}</p>
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
                      {t('Operation Type')}
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedBatch.operationType}</p>
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
                      {t('Scheduled Date')}
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedBatch.scheduledDate}</p>
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
                      {t('Dock Location')}
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selectedBatch.dockLocation}</p>
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
                      {t('Vehicle')}
                    </label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>
                      {selectedBatch.vehicle} ({selectedBatch.vehicleCategory})
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfers Table */}
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.textPrimary, marginBottom: "1rem" }}>{t('Transfers ({{count}})', { count: selectedBatch.transfers.length })}</h3>
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
                          {t('Reference')}
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
                          {t('From')}
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
                          {t('To')}
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
                          {t('Contact')}
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
                          {t('Source Doc')}
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
                          {t('Status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBatch.transfers.map((transfer: any, index: number) => (
                        <tr
                          key={index}
                          style={{
                            borderTop: `1px solid ${colors.border}`,
                            background: index % 2 === 0 ? colors.card : colors.mutedBg,
                          }}
                        >
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "600" }}>
                            {transfer.reference}
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>{transfer.from}</td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>{transfer.to}</td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {transfer.contact}
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary }}>
                            {transfer.sourceDocument}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <Badge
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.5rem",
                                background: getStatusStyle(transfer.status).bg,
                                border: `1px solid ${getStatusStyle(transfer.status).border}`,
                                color: getStatusStyle(transfer.status).text,
                              }}
                            >
                              {getStatusLabel(transfer.status)}
                            </Badge>
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
