"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DatePicker } from "./ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "../../context/theme"
import { useData } from "../../context/data"
import { useAuth } from "../../context/auth"
import { API_CONFIG } from "../config/api"

interface PickingEditModalProps {
  isOpen: boolean
  pickingId: number | null
  variant: "incoming" | "outgoing"
  onClose: () => void
}

export default function PickingEditModal({ isOpen, pickingId, variant, onClose }: PickingEditModalProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { sessionId } = useAuth()
  const { pickings, stockPickingTypes, partners, locations, products, uom, productPackaging, fetchData } = useData()

  const [readOnly, setReadOnly] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [moveLines, setMoveLines] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [addingLine, setAddingLine] = useState(false)

  const [form, setForm] = useState({
    partnerId: null as number | null,
    scheduledDate: "",
    pickingTypeId: null as number | null,
    locationDestId: null as number | null,
    locationId: null as number | null,
    origin: "",
    trackingRef: "",
    weightKg: "",
    note: "",
  })

  const [newMoveLine, setNewMoveLine] = useState<{
    productId: number | null
    packageId: number | null
    qty: string
    qtyDone: string
    uomId: number | null
  }>({ productId: null, packageId: null, qty: "", qtyDone: "", uomId: null })

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

  const currentStatus = useMemo(() => {
    const raw: any = (pickings || []).find((p: any) => p.id === pickingId) || {}
    return raw.state || "draft"
  }, [pickings, pickingId])

  const fetchMoveLinesByPicking = async (id: number) => {
    if (!sessionId) return
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/move-lines/by-picking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          pickingId: id,
          fields: ["product_id", "package_id", "product_packaging_qty", "quantity", "product_uom_id", "picking_id"],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) setMoveLines(data.moveLines || [])
    } catch {}
  }

  useEffect(() => {
    if (!isOpen || !pickingId) return
    const raw: any = (pickings || []).find((p: any) => p.id === pickingId) || {}

    if (!partners?.length) fetchData("partners")
    if (!locations?.length) fetchData("locations")
    if (!products?.length) fetchData("products")
    if (!uom?.length) fetchData("uom")
    if (!productPackaging?.length) fetchData("productPackaging")

    setForm({
      partnerId: Array.isArray(raw.partner_id) ? raw.partner_id[0] : null,
      scheduledDate: raw.scheduled_date ? String(raw.scheduled_date).slice(0, 10) : "",
      pickingTypeId: Array.isArray(raw.picking_type_id) ? raw.picking_type_id[0] : null,
      locationDestId: Array.isArray(raw.location_dest_id) ? raw.location_dest_id[0] : null,
      locationId: Array.isArray(raw.location_id) ? raw.location_id[0] : null,
      origin: raw.origin || "",
      trackingRef: raw.carrier_tracking_ref || "",
      weightKg: raw.weight != null ? String(raw.weight) : "",
      note: raw.note || "",
    })
    setReadOnly(raw.state === "done" || raw.state === "cancel")
    setDirty(false)
    setAddingLine(false)
    setNewMoveLine({ productId: null, packageId: null, qty: "", qtyDone: "", uomId: null })
    fetchMoveLinesByPicking(pickingId)
  }, [isOpen, pickingId])

  const onChange = (patch: Partial<typeof form>) => {
    if (readOnly) return
    setForm((f) => ({ ...f, ...patch }))
    setDirty(true)
  }

  const downloadBase64File = (base64: string, filename: string) => {
    try {
      const byteCharacters = atob(base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename || "document.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {}
  }

  const validatePickingAction = async () => {
    if (!sessionId || !pickingId) return
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/pickings/${pickingId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.message || "Validate failed")
      await fetchMoveLinesByPicking(pickingId)
    } catch {}
  }

  const printPickingAction = async () => {
    if (!sessionId || !pickingId) return
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/pickings/${pickingId}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success || !data?.pdfBase64) throw new Error(data?.message || "Print failed")
      downloadBase64File(data.pdfBase64, data.filename || `picking_${pickingId}.pdf`)
    } catch {}
  }

  const returnPickingAction = async () => {
    if (!sessionId || !pickingId) return
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/pickings/${pickingId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, kwargs: {} }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.message || "Return failed")
    } catch {}
  }

  const cancelPickingAction = async () => {
    if (!sessionId || !pickingId) return
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/pickings/${pickingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.message || "Cancel failed")
    } catch {}
  }

  const createMoveLine = async () => {
    if (!sessionId || !pickingId) return
    if (!newMoveLine.productId || !newMoveLine.uomId) return
    const values: any = {
      product_id: newMoveLine.productId,
      product_uom_id: newMoveLine.uomId,
      product_packaging_qty: 0,
      quantity: Number(newMoveLine.qty || "0"),
      picking_id: pickingId,
    }
    if (newMoveLine.packageId) values.package_id = newMoveLine.packageId
    const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/move-lines/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, values }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data?.success) {
      await fetchMoveLinesByPicking(pickingId)
      setNewMoveLine({ productId: null, packageId: null, qty: "", qtyDone: "", uomId: null })
      setAddingLine(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1200)
    }
  }

  const savePicking = async () => {
    if (!sessionId || !pickingId) return
    const values: any = {}
    if (form.partnerId != null) values.partner_id = form.partnerId
    if (form.scheduledDate) values.scheduled_date = form.scheduledDate
    if (form.pickingTypeId != null) values.picking_type_id = form.pickingTypeId
    if (variant === "incoming") {
      if (form.locationDestId != null) values.location_dest_id = form.locationDestId
    } else {
      if (form.locationId != null) values.location_id = form.locationId
    }
    if (form.origin !== undefined) values.origin = form.origin
    if (form.trackingRef !== undefined) values.carrier_tracking_ref = form.trackingRef
    if (form.weightKg !== undefined && form.weightKg !== "") values.weight = Number(form.weightKg)
    if (form.note !== undefined) values.note = form.note

    const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/pickings/${pickingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, values }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data?.success) {
      setDirty(false)
    }
  }

  if (!isOpen) return null

  const title = variant === "incoming" ? t("Receipt Details") : t("Delivery Details")
  const partnerLabel = variant === "incoming" ? t("Receive from") : t("Deliver to")
  const locationLabel = variant === "incoming" ? t("Destination Location") : t("Source Location")

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "1rem",
      }}
      onClick={() => {
        if (!dirty || window.confirm(t("Discard unsaved changes?"))) onClose()
      }}
    >
      <Card
        style={{
          width: "min(100%, 800px)",
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          background: colors.card,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#000" }}>{title}</h2>
            <p style={{ fontSize: 13, color: "#000" }}>
              {pickingId ? (pickings || []).find((r: any) => r.id === pickingId)?.name || "" : ""}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {currentStatus !== "done" && (
              <button
                onClick={validatePickingAction}
                style={{
                  background: "#4facfe",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {t("Validate")}
              </button>
            )}
            <button
              onClick={printPickingAction}
              style={{
                background: "#f093fb",
                color: "#FFFFFF",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {t("Print")}
            </button>
            <button
              onClick={returnPickingAction}
              style={{
                background: "#fa709a",
                color: "#FFFFFF",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {t("Return")}
            </button>
            {currentStatus !== "done" && (
              <button
                onClick={cancelPickingAction}
                style={{
                  background: "#ff6b6b",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {t("Cancel")}
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "1.25rem" }}>
          <style>{`
            input:focus, textarea:focus, select:focus, button[role="combobox"]:focus {
              outline: none !important;
              border-color: #667eea !important;
              box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
            }
          `}</style>

          <div style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "4px",
                  height: "20px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "2px",
                }}
              />
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: 0,
                }}
              >
                {t("Basic Information")}
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {partnerLabel}
                </label>
                <Select
                  value={form.partnerId ? String(form.partnerId) : ""}
                  onValueChange={(v) => onChange({ partnerId: v ? Number(v) : null })}
                  disabled={readOnly}
                >
                  <SelectTrigger
                    style={{
                      width: "100%",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      background: colors.background,
                      padding: "0.6rem 0.75rem",
                      fontSize: 13,
                    }}
                  >
                    <SelectValue placeholder={t("Select partner")} />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 2001 }}>
                    {(partners || []).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.display_name || p.name || p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {locationLabel}
                </label>
                <Select
                  value={
                    variant === "incoming"
                      ? form.locationDestId
                        ? String(form.locationDestId)
                        : ""
                      : form.locationId
                        ? String(form.locationId)
                        : ""
                  }
                  onValueChange={(v) =>
                    variant === "incoming"
                      ? onChange({ locationDestId: v ? Number(v) : null })
                      : onChange({ locationId: v ? Number(v) : null })
                  }
                  disabled={readOnly}
                >
                  <SelectTrigger
                    style={{
                      width: "100%",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      background: colors.background,
                      padding: "0.6rem 0.75rem",
                      fontSize: 13,
                    }}
                  >
                    <SelectValue placeholder={t("Select location")} />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 2001 }}>
                    {(locations || []).map((loc: any) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.complete_name || loc.name || loc.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {t("Scheduled Date")}
                </label>
                <DatePicker
                  value={form.scheduledDate}
                  onChange={(date) => onChange({ scheduledDate: date })}
                  colors={colors}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {t("Operation Type")}
                </label>
                <Select
                  value={form.pickingTypeId ? String(form.pickingTypeId) : ""}
                  onValueChange={(v) => onChange({ pickingTypeId: v ? Number(v) : null })}
                  disabled={readOnly}
                >
                  <SelectTrigger
                    style={{
                      width: "100%",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      background: colors.background,
                      padding: "0.6rem 0.75rem",
                      fontSize: 13,
                    }}
                  >
                    <SelectValue placeholder={t("Select operation type")} />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 2001 }}>
                    {(uniqueStockPickingTypes || []).map((pt: any) => (
                      <SelectItem key={pt.id} value={String(pt.id)}>
                        {(Array.isArray(pt.company_id) ? pt.company_id[1] : pt.company_id) || ""}: {pt.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {t("Source Document")}
                </label>
                <Input
                  type="text"
                  value={form.origin}
                  onChange={(e) => onChange({ origin: e.target.value })}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    background: colors.background,
                    color: colors.textPrimary,
                    padding: "0.6rem 0.75rem",
                    fontSize: 13,
                  }}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "4px",
                  height: "20px",
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  borderRadius: "2px",
                }}
              />
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: 0,
                }}
              >
                {t("Operations")}
              </h3>
            </div>
            <div
              style={{
                background: colors.background,
                padding: "1rem",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ color: colors.textSecondary, fontWeight: 600, fontSize: 13 }}>{t("Lines")}</div>
                {!readOnly && (
                  <Button
                    onClick={() => {
                      setAddingLine(true)
                      setNewMoveLine({ productId: null, packageId: null, qty: "", qtyDone: "", uomId: null })
                    }}
                    disabled={addingLine}
                    style={{
                      background: "#4facfe",
                      color: "#fff",
                      border: "none",
                      padding: "0.5rem 1rem",
                      fontSize: 13,
                      borderRadius: 8,
                    }}
                  >
                    {t("Add Line")}
                  </Button>
                )}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        textAlign: "left",
                        color: colors.textSecondary,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      <th style={{ padding: ".5rem", fontWeight: 600 }}>{t("Product")}</th>
                      <th style={{ padding: ".5rem", fontWeight: 600 }}>{t("Packaging")}</th>
                      <th style={{ padding: ".5rem", fontWeight: 600 }}>{t("Demand")}</th>
                      <th style={{ padding: ".5rem", fontWeight: 600 }}>{t("Quantity")}</th>
                      <th style={{ padding: ".5rem", fontWeight: 600 }}>{t("Units")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(moveLines || []).map((ml: any) => (
                      <tr key={ml.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                        <td style={{ padding: ".5rem", color: colors.textPrimary, fontSize: 13 }}>
                          {Array.isArray(ml.product_id) ? ml.product_id[1] : ml.product_id}
                        </td>
                        <td style={{ padding: ".5rem", color: colors.textPrimary, fontSize: 13 }}>
                          {Array.isArray(ml.package_id) ? ml.package_id[1] : ml.package_id || ""}
                        </td>
                        <td style={{ padding: ".5rem", color: colors.textPrimary, fontSize: 13 }}>
                          {ml.product_packaging_qty ?? ""}
                        </td>
                        <td style={{ padding: ".5rem", color: colors.textPrimary, fontSize: 13 }}>
                          {ml.quantity ?? ""}
                        </td>
                        <td style={{ padding: ".5rem", color: colors.textPrimary, fontSize: 13 }}>
                          {Array.isArray(ml.product_uom_id) ? ml.product_uom_id[1] : ml.product_uom_id}
                        </td>
                      </tr>
                    ))}
                    {(!moveLines || moveLines.length === 0) && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ padding: ".75rem", color: colors.textSecondary, textAlign: "center", fontSize: 13 }}
                        >
                          {t("No operation lines")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!readOnly && addingLine && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 2fr 1fr 1.5fr",
                      gap: ".5rem",
                      marginTop: "0.75rem",
                    }}
                  >
                    <Select
                      value={newMoveLine.productId ? String(newMoveLine.productId) : ""}
                      onValueChange={(v) => setNewMoveLine((s) => ({ ...s, productId: v ? Number(v) : null }))}
                    >
                      <SelectTrigger
                        style={{
                          border: `1px solid ${colors.border}`,
                          background: colors.card,
                          fontSize: 13,
                          padding: "0.5rem",
                        }}
                      >
                        <SelectValue placeholder={t("Product")} />
                      </SelectTrigger>
                      <SelectContent style={{ zIndex: 2001 }}>
                        {(products || []).map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.display_name || p.name || p.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={newMoveLine.packageId ? String(newMoveLine.packageId) : ""}
                      onValueChange={(v) => setNewMoveLine((s) => ({ ...s, packageId: v ? Number(v) : null }))}
                    >
                      <SelectTrigger
                        style={{
                          border: `1px solid ${colors.border}`,
                          background: colors.card,
                          fontSize: 13,
                          padding: "0.5rem",
                        }}
                      >
                        <SelectValue placeholder={t("Packaging")} />
                      </SelectTrigger>
                      <SelectContent style={{ zIndex: 2001 }}>
                        {(productPackaging || []).map((pkg: any) => (
                          <SelectItem key={pkg.id} value={String(pkg.id)}>
                            {pkg.name || pkg.display_name || pkg.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      value={newMoveLine.qty}
                      onChange={(e) => setNewMoveLine((s) => ({ ...s, qty: e.target.value.replace(/[^0-9.]/g, "") }))}
                      placeholder={t("Quantity") as string}
                      style={{
                        border: `1px solid ${colors.border}`,
                        background: colors.card,
                        fontSize: 13,
                        padding: "0.5rem",
                      }}
                    />

                    <Select
                      value={newMoveLine.uomId ? String(newMoveLine.uomId) : ""}
                      onValueChange={(v) => setNewMoveLine((s) => ({ ...s, uomId: v ? Number(v) : null }))}
                    >
                      <SelectTrigger
                        style={{
                          border: `1px solid ${colors.border}`,
                          background: colors.card,
                          fontSize: 13,
                          padding: "0.5rem",
                        }}
                      >
                        <SelectValue placeholder={t("Units")} />
                      </SelectTrigger>
                      <SelectContent style={{ zIndex: 2001 }}>
                        {(uom || []).map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name || u.display_name || u.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: ".5rem", marginTop: ".75rem" }}>
                    <Button
                      onClick={createMoveLine}
                      style={{
                        background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                        color: "#fff",
                        border: "none",
                        padding: "0.5rem 1rem",
                        fontSize: 13,
                      }}
                    >
                      {t("Confirm")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddingLine(false)
                        setNewMoveLine({ productId: null, packageId: null, qty: "", qtyDone: "", uomId: null })
                      }}
                      style={{
                        border: `1px solid ${colors.border}`,
                        background: colors.card,
                        color: colors.textPrimary,
                        padding: "0.5rem 1rem",
                        fontSize: 13,
                      }}
                    >
                      {t("Cancel")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "4px",
                  height: "20px",
                  background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  borderRadius: "2px",
                }}
              />
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: 0,
                }}
              >
                {t("Additional Information")}
              </h3>
            </div>
            <div
              style={{
                background: colors.background,
                padding: "1rem",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {t("Tracking Reference")}
                  </label>
                  <Input
                    type="text"
                    value={form.trackingRef}
                    onChange={(e) => onChange({ trackingRef: e.target.value })}
                    style={{
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      background: colors.card,
                      color: colors.textPrimary,
                      padding: "0.6rem 0.75rem",
                      fontSize: 13,
                    }}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {t("Weight (kg)")}
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={form.weightKg}
                    onChange={(e) => onChange({ weightKg: e.target.value.replace(/[^0-9.]/g, "") })}
                    style={{
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      background: colors.card,
                      color: colors.textPrimary,
                      padding: "0.6rem 0.75rem",
                      fontSize: 13,
                    }}
                    disabled={readOnly}
                  />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {t("Note")}
                  </label>
                  <textarea
                    value={form.note}
                    onChange={(e) => onChange({ note: e.target.value })}
                    style={{
                      width: "100%",
                      minHeight: 100,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      background: colors.card,
                      color: colors.textPrimary,
                      padding: "0.6rem 0.75rem",
                      fontSize: 13,
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            background: colors.card,
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {dirty && !readOnly && (
              <button
                onClick={savePicking}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "0.6rem 1.5rem",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(102, 126, 234, 0.3)"
                }}
              >
                {t("Save Changes")}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: colors.background,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                padding: "0.6rem 1.5rem",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.card
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.background
              }}
            >
              {t("Close")}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
