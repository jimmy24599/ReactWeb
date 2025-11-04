"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "../context/theme"
import { useAuth } from "../context/auth"
import { API_CONFIG } from "./config/api"

const MODELS: string[] = [
  "purchase.requisition",
  "purchase.order",
  "stock.quant",
  "stock.picking",
  "stock.picking.batch",
  "stock.move.line",
  "stock.lot",
  "stock.landed.cost",
  "stock.landed.cost.lines",
  "stock.rule",
  "stock.route",
  "stock.warehouse",
  "stock.location",
  "product.template",
  "product.product",
  "mail.notification",
  "res.partner",
  "uom.uom",
  "uom.category",
  "account.tax",
  "website",
  "pos.category",
  "product.category",
  "account.journal",
  "account.account",
  "account.move",
  "stock.putaway.rule",
  "stock.storage.category",
  "stock.package.type",
  "stock.quant.package",
  "product.removal",
  "product.attribute",
  "product.attribute.value",
  "stock.picking.type",
  "product.supplierinfo",
  "mrp.production",
  "mrp.workorder",
  "mrp.workcenter",
  "project.project",
  "stock.scrap",
  "product.packaging",
  "delivery.carrier",
  "delivery.price.rule",
  "delivery.zip.prefix",
  "res.country",
  "res.country.state",
  "product.tag",
  "repair.order",
  "sale.order.line",
  "sale.order",
  "stock.move",
  "stock.move.line",
  "purchase.order.line",
  "res.users",
  "res.device",
  "product.template.attribute.line",
]

export default function FieldsTesterPage() {
  const { colors } = useTheme()
  const { sessionId } = useAuth()

  const [filter, setFilter] = useState("")
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [fields, setFields] = useState<string[]>([])
  const [meta, setMeta] = useState<Record<string, any> | null>(null)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredModels = MODELS.filter((m) => m.toLowerCase().includes(filter.toLowerCase()))

  // Required by backend odooClient.resolveUrl() used in odooFieldsGet
  const getOdooHeaders = (): Record<string, string> => {
    const rawBase = (localStorage.getItem('odoo_base_url') || '').replace(/\/$/, '')
    const db = localStorage.getItem('odoo_db') || ''
    const headers: Record<string, string> = {}
    if (rawBase) headers['x-odoo-base'] = rawBase
    if (db) headers['x-odoo-db'] = db
    return headers
  }

  const fetchFields = async (model: string) => {
    if (!sessionId) {
      setError("No session. Please sign in.")
      return
    }
    setSelectedModel(model)
    setLoading(true)
    setError(null)
    setFields([])
    setMeta(null)
    setSelectedField(null)
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOdooHeaders() },
        body: JSON.stringify({ sessionId, model }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to fetch fields for ${model}`)
      }
      const fieldList = Array.isArray(data.fields) ? data.fields : Object.keys(data.meta || {})
      setFields(fieldList)
      setMeta(data.meta || {})
    } catch (e: any) {
      setError(e?.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6" style={{ minHeight: "100vh", background: colors.background, color: colors.textPrimary }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Odoo Fields Tester</h1>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
          {/* Left: Models list */}
          <Card style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <CardContent style={{ padding: 12 }}>
              <Input
                placeholder="Filter models..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ marginBottom: 12, background: colors.background, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflow: "auto" }}>
                {filteredModels.map((m) => (
                  <Button
                    key={m}
                    variant={selectedModel === m ? undefined : "outline"}
                    onClick={() => fetchFields(m)}
                    style={{
                      justifyContent: "flex-start",
                      background: selectedModel === m ? colors.action : undefined,
                      color: selectedModel === m ? "#fff" : colors.textPrimary,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right: Fields result */}
          <Card style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <CardContent style={{ padding: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Model</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedModel || "Select a model"}</div>
              </div>

              {loading && <div style={{ color: colors.textSecondary }}>Loading fields...</div>}
              {error && (
                <div style={{ color: "#dc2626", marginBottom: 8 }}>
                  {error}
                </div>
              )}

              {!loading && !error && selectedModel && (
                <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12, maxHeight: "70vh" }}>
                  <div style={{ overflow: "auto" }}>
                    {fields.length === 0 ? (
                      <div style={{ color: colors.textSecondary }}>No fields returned.</div>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                        {fields.map((f) => {
                          const active = selectedField === f
                          return (
                            <li
                              key={f}
                              onClick={() => setSelectedField(f)}
                              style={{
                                border: `1px solid ${active ? colors.action : colors.border}`,
                                borderRadius: 8,
                                padding: 8,
                                background: colors.background,
                                cursor: "pointer",
                                boxShadow: active ? `0 0 0 6px ${String(colors.action)}33` : "none",
                              }}
                            >
                              <code style={{ fontSize: 12 }}>{f}</code>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                  <div style={{ overflow: "auto", border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, background: colors.background }}>
                    {!selectedField ? (
                      <div style={{ color: colors.textSecondary }}>Select a field to view metadata.</div>
                    ) : (
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 12, color: colors.textSecondary }}>Field</div>
                          <div style={{ fontSize: 16, fontWeight: 700 }}><code>{selectedField}</code></div>
                        </div>
                        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, background: colors.card, padding: 12, borderRadius: 8, border: `1px solid ${colors.border}` }}>
{JSON.stringify(meta?.[selectedField] || {}, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
