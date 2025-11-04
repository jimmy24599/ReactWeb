"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import {
  Search,
  Plus,
  Package,
  Truck,
  Clock,
  FileText,
  MapPin,
  User,
  X,
  Edit,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useData } from "../context/data"

function mapPickingToDropship(p: any) {
  const stateMap: Record<string, string> = {
    draft: 'Draft',
    confirmed: 'Ready',
    assigned: 'Ready',
    waiting: 'Ready',
    done: 'Done',
    cancel: 'Cancelled',
  }
  const ops = Array.isArray(p.move_line_ids) ? p.move_line_ids.length : (Array.isArray(p.move_lines) ? p.move_lines.length : 0)
  return {
    id: p.id,
    reference: p.name,
    vendor: p.partner_id?.[1] || '',
    from: p.location_id?.[1] || '',
    to: p.location_dest_id?.[1] || '',
    sourceLocation: p.location_id?.[1] || '',
    destinationLocation: p.location_dest_id?.[1] || '',
    scheduledDate: p.scheduled_date || p.scheduled_date_deadline || '',
    sourceDocument: p.origin || '',
    operationType: p.picking_type_id?.[1] || 'Dropship Order',
    batchTransfer: p.batch_id?.[1] || '',
    status: stateMap[p.state] || p.state || 'Draft',
    operations: new Array(ops).fill(0),
  }
}

export default function DropshipsPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()
  const { pickings, stockPickingTypes } = useData()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [toFilter, setToFilter] = useState<string>("all")
  const [fromFilter, setFromFilter] = useState<string>("all")
  const [selected, setSelected] = useState<any | null>(null)

  const dropships = useMemo(() => {
    const codeByTypeId: Record<number, string> = {}
    for (const t of (stockPickingTypes || [])) {
      if (t?.id != null && typeof t.code === 'string') codeByTypeId[t.id] = t.code
    }
    const list = (pickings || []).filter((p) => {
      const direct = p.picking_type_code
      if (typeof direct === 'string') return direct === 'dropship'
      const typeId = p.picking_type_id?.[0]
      const code = typeId != null ? codeByTypeId[typeId] : undefined
      return code === 'dropship'
    })
    return list.map(mapPickingToDropship)
  }, [pickings, stockPickingTypes])

  const filtered = dropships.filter((d) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      d.reference.toLowerCase().includes(q) ||
      d.vendor.toLowerCase().includes(q) ||
      d.from.toLowerCase().includes(q) ||
      d.to.toLowerCase().includes(q) ||
      d.sourceDocument.toLowerCase().includes(q)

    const matchesStatus = statusFilter === "all" || d.status === statusFilter
    const matchesTo = toFilter === "all" || d.to === toFilter
    const matchesFrom = fromFilter === "all" || d.from === fromFilter

    return matchesSearch && matchesStatus && matchesTo && matchesFrom
  })

  const uniqueStatuses = Array.from(new Set(dropships.map((d) => d.status)))
  const uniqueToLocations = Array.from(new Set(dropships.map((d) => d.to).filter(Boolean)))
  const uniqueFromLocations = Array.from(new Set(dropships.map((d) => d.from).filter(Boolean)))

  const total = dropships.length
  const drafts = dropships.filter((d) => d.status === "Draft").length
  const todayStr = new Date().toISOString().slice(0,10)
  const scheduledToday = dropships.filter((d) => (d.scheduledDate || '').slice(0,10) === todayStr).length
  const completed = dropships.filter((d) => d.status === "Done").length

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Done":
        return { bg: colors.success, text: "#0A0A0A", border: colors.success }
      case "Ready":
        return { bg: colors.inProgress, text: "#0A0A0A", border: colors.inProgress }
      case "Draft":
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
      default:
        return { bg: colors.card, text: colors.textSecondary, border: colors.border }
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.background }}>
      <div style={{ background: colors.background, padding: "2rem 2rem 4rem 2rem", color: colors.textPrimary }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", color: colors.textPrimary }}>{t("Transfer Dropships")}</h1>
              <p style={{ fontSize: "1rem", opacity: 0.95, color: colors.textSecondary }}>{t("Manage dropship operations and vendor-to-customer deliveries")}</p>
            </div>
            <Button style={{ background: colors.action, color: "#FFFFFF", padding: "0.75rem 1.5rem", borderRadius: 8, border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)" }}>
              <Plus size={20} />
              {t("New Dropship")}
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            <Card style={{ background: colors.card, border: "none", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
              <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: 600, marginBottom: "0.5rem" }}>{t("Total Dropships")}</p>
                    <p style={{ fontSize: "2rem", fontWeight: 700, color: colors.textPrimary }}>{total}</p>
                  </div>
                  <div style={{ background: colors.action, padding: "0.75rem", borderRadius: 12 }}>
                    <Package size={24} color="#FFFFFF" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: colors.card, border: "none", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
              <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: 600, marginBottom: "0.5rem" }}>{t("Draft Dropships")}</p>
                    <p style={{ fontSize: "2rem", fontWeight: 700, color: colors.textPrimary }}>{drafts}</p>
                  </div>
                  <div style={{ background: colors.inProgress, padding: "0.75rem", borderRadius: 12 }}>
                    <Truck size={24} color="#0A0A0A" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: colors.card, border: "none", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
              <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: 600, marginBottom: "0.5rem" }}>{t("Scheduled Today")}</p>
                    <p style={{ fontSize: "2rem", fontWeight: 700, color: colors.textPrimary }}>{scheduledToday}</p>
                  </div>
                  <div style={{ background: colors.inProgress, padding: "0.75rem", borderRadius: 12 }}>
                    <Clock size={24} color="#0A0A0A" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: colors.card, border: "none", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
              <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: 600, marginBottom: "0.5rem" }}>{t("Completed")}</p>
                    <p style={{ fontSize: "2rem", fontWeight: 700, color: colors.textPrimary }}>{completed}</p>
                  </div>
                  <div style={{ background: colors.success, padding: "0.75rem", borderRadius: 12 }}>
                    <FileText size={24} color="#0A0A0A" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "-2rem auto 0", padding: "0 2rem 2rem" }}>
        <Card style={{ marginBottom: "2rem", border: "none", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)", background: colors.card }}>
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ position: "relative", width: "30%" }}>
                <Search size={20} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: colors.textSecondary }} />
                <Input
                  placeholder={t("Search dropships...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: "3rem", border: `2px solid ${colors.border}`, borderRadius: 8, fontSize: "1rem", background: colors.card, color: colors.textPrimary }}
                />
              </div>

              <div style={{ position: "relative", flex: 1 }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: "100%", padding: "0.625rem 2.5rem 0.625rem 1rem", border: `2px solid ${colors.border}`, borderRadius: 8, fontSize: "1rem", background: colors.card, color: colors.textPrimary, cursor: "pointer", appearance: "none" }}
                >
                  <option value="all">{t("All Statuses")}</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {t(status)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={20} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: colors.textSecondary, pointerEvents: "none" }} />
              </div>

              <div style={{ position: "relative", flex: 1 }}>
                <select
                  value={toFilter}
                  onChange={(e) => setToFilter(e.target.value)}
                  style={{ width: "100%", padding: "0.625rem 2.5rem 0.625rem 1rem", border: `2px solid ${colors.border}`, borderRadius: 8, fontSize: "1rem", background: colors.card, color: colors.textPrimary, cursor: "pointer", appearance: "none" }}
                >
                  <option value="all">{t("All Destinations")}</option>
                  {uniqueToLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <ChevronDown size={20} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: colors.textSecondary, pointerEvents: "none" }} />
              </div>

              <div style={{ position: "relative", flex: 1 }}>
                <select
                  value={fromFilter}
                  onChange={(e) => setFromFilter(e.target.value)}
                  style={{ width: "100%", padding: "0.625rem 2.5rem 0.625rem 1rem", border: `2px solid ${colors.border}`, borderRadius: 8, fontSize: "1rem", background: colors.card, color: colors.textPrimary, cursor: "pointer", appearance: "none" }}
                >
                  <option value="all">{t("All Sources")}</option>
                  {uniqueFromLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <ChevronDown size={20} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: colors.textSecondary, pointerEvents: "none" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((d) => (
            <Card key={d.id} style={{ border: "none", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)", cursor: "pointer", transition: "all 0.3s ease", background: colors.card }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15)"; e.currentTarget.style.transform = "translateY(-4px)" }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)"; e.currentTarget.style.transform = "translateY(0)" }}
              onClick={() => setSelected(d)}
            >
              <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary, marginBottom: "0.25rem" }}>{d.reference}</h3>
                    {d.vendor && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <User size={14} color={colors.textSecondary} />
                        <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Vendor")}: {d.vendor}</span>
                      </div>
                    )}
                  </div>
                  <Badge style={{ borderRadius: 6, padding: "0.25rem 0.75rem", background: getStatusStyle(d.status).bg, border: `1px solid ${getStatusStyle(d.status).border}`, color: getStatusStyle(d.status).text }}>
                    {t(d.status)}
                  </Badge>
                </div>

                <div style={{ background: colors.background, padding: "1rem", borderRadius: 8, marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <MapPin size={14} color={colors.textSecondary} />
                        <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: 600 }}>{t("From")}</span>
                      </div>
                      <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: 600 }}>{d.from}</p>
                    </div>
                    {isRTL ? (
                      <ArrowLeft size={20} color={colors.textSecondary} style={{ flexShrink: 0 }} />
                    ) : (
                      <ArrowRight size={20} color={colors.textSecondary} style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, textAlign: isRTL ? "left" : "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: 600 }}>{t("To")}</span>
                        <MapPin size={14} color={colors.textSecondary} />
                      </div>
                      <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: 600 }}>{d.to}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <Clock size={14} color={colors.textSecondary} />
                      <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t("Scheduled Date")}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: 600 }}>{new Date(d.scheduledDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <FileText size={14} color={colors.textSecondary} />
                      <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t("Source Document")}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: colors.textPrimary, fontWeight: 600 }}>{d.sourceDocument || "—"}</p>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Package size={16} color={colors.textSecondary} />
                    <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>
                      {d.operations.length} {d.operations.length === 1 ? t("Operation") : t("Operations")}
                    </span>
                  </div>
                  {d.batchTransfer && (
                    <Badge style={{ background: colors.background, color: colors.textPrimary, border: "none" }}>{d.batchTransfer}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)", background: colors.card }}>
            <CardContent style={{ padding: "3rem", textAlign: "center" }}>
              <Truck size={48} color={colors.textSecondary} style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: colors.textPrimary, marginBottom: "0.5rem" }}>{t("No dropships found")}</h3>
              <p style={{ color: colors.textSecondary }}>{t("Try adjusting your search criteria or create a new dropship")}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selected && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "2rem" }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: colors.background, borderRadius: 12, maxWidth: 900, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: colors.action, padding: "1.5rem 2rem", borderTopLeftRadius: 12, borderTopRightRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.25rem" }}>{selected.reference}</h2>
                <p style={{ fontSize: "0.875rem", color: "#FFFFFF", opacity: 0.9 }}>{t("Transfer Dropships")}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: colors.background, border: "none", borderRadius: 8, padding: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={24} color={colors.textPrimary} />
              </button>
            </div>

            <div style={{ padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <Badge style={{ fontSize: "0.875rem", padding: "0.5rem 1rem", background: getStatusStyle(selected.status).bg, border: `1px solid ${getStatusStyle(selected.status).border}`, color: getStatusStyle(selected.status).text }}>{t(selected.status)}</Badge>
                <Button style={{ background: colors.action, color: "#FFFFFF", border: "none", padding: "0.5rem 1rem", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Edit size={16} />
                  {t("Edit")}
                </Button>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary, marginBottom: "1rem" }}>{t("Order Information")}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>{t("Vendor")}</label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selected.vendor || "—"}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>{t("Scheduled Date")}</label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selected.scheduledDate}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>{t("Operation Type")}</label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selected.operationType}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>{t("Source Document")}</label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selected.sourceDocument || "—"}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>{t("From")}</label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selected.sourceLocation}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>{t("To")}</label>
                    <p style={{ fontSize: "1rem", color: colors.textPrimary }}>{selected.destinationLocation}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary, marginBottom: "1rem" }}>{t("Transfer")}</h3>
                <div style={{ background: colors.background, padding: "1.5rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ background: colors.card, padding: "1rem", borderRadius: 8, border: `2px solid ${colors.border}` }}>
                        <MapPin size={24} color={colors.textSecondary} style={{ margin: "0 auto 0.5rem" }} />
                        <p style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.5rem" }}>{t("From")}</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700, color: colors.textPrimary }}>{selected.from}</p>
                      </div>
                    </div>
                    {isRTL ? (
                      <ArrowLeft size={32} color={colors.textSecondary} style={{ flexShrink: 0 }} />
                    ) : (
                      <ArrowRight size={32} color={colors.textSecondary} style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ background: colors.card, padding: "1rem", borderRadius: 8, border: `2px solid ${colors.border}` }}>
                        <MapPin size={24} color={colors.textSecondary} style={{ margin: "0 auto 0.5rem" }} />
                        <p style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.5rem" }}>{t("To")}</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700, color: colors.textPrimary }}>{selected.to}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
