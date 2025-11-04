"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, DollarSign, FileText, CheckCircle2 } from "lucide-react"
import { StatCard } from "./components/StatCard"
import { LandingCostCard } from "./components/LandingCostCard"
import { useData } from "../context/data"
import { useTheme } from "../context/theme"
import { useAuth } from "../context/auth"
import { API_CONFIG } from "./config/api"
import { DatePicker } from "./components/ui/date-picker"
import Toast from "./components/Toast"

export default function LandedCostsPage() {
  const { t } = useTranslation()
  const { landedCosts, products, pickings, fetchData, vendorBills, landedCostLinesByCost, fetchLandedCostLines } = useData() as any
  const { colors } = useTheme()
  const { sessionId } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCost, setSelectedCost] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [applyOnFilter, setApplyOnFilter] = useState("all")
  const [vendorBillFilter, setVendorBillFilter] = useState("all")
  const [form, setForm] = useState<any | null>(null)
  const [journals, setJournals] = useState<any[]>([])
  
  const [accounts, setAccounts] = useState<any[]>([])
  const [pendingLine, setPendingLine] = useState<any | null>(null)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<null | { text: string; state: "success" | "error" }>(null)

  // Custom dropdown (match VariantModal)
  function CustomSelect({
    options,
    value,
    onChange,
    getLabel,
    placeholder,
    className = "",
  }: {
    options: any[]
    value: any
    onChange: (v: any) => void
    getLabel: (o: any) => string
    placeholder: string
    className?: string
  }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const { colors } = useTheme()
    useEffect(() => {
      const h = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      }
      document.addEventListener("click", h)
      return () => document.removeEventListener("click", h)
    }, [])
    const current = options.find((o) => (o?.id ?? null) === value)
    return (
      <div ref={ref} className={`relative ${className}`} onMouseDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full px-3 py-2 text-left text-sm rounded-lg"
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            color: current ? colors.textPrimary : colors.textSecondary,
          }}
        >
          <span className="block truncate">{current ? getLabel(current) : placeholder}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7 10l5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
        {open && (
          <div
            className="absolute w-full mt-1 rounded-lg shadow"
            style={{ background: colors.card, border: `1px solid ${colors.border}`, zIndex: 5000 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ul className="py-1" style={{ maxHeight: "16rem", overflowY: "auto" }}>
              {options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.id ?? null)
                      setOpen(false)
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:opacity-90"
                    style={{ color: colors.textPrimary }}
                  >
                    {getLabel(opt)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const totalCosts = useMemo(
    () =>
      (landedCosts as any[]).reduce((acc: number, cost: any) => acc + (cost.totalCost || cost.amount_total || 0), 0),
    [landedCosts],
  )
  const draftCosts = useMemo(
    () => (landedCosts as any[]).filter((cost: any) => cost.state === "draft").length,
    [landedCosts],
  )
  const postedThisMonth = useMemo(
    () =>
      (landedCosts as any[]).filter(
        (cost: any) => cost.state === "posted" && new Date(cost.date).getMonth() === new Date().getMonth(),
      ).length,
    [landedCosts],
  )
  const totalAmount = useMemo(
    () =>
      (landedCosts as any[]).reduce((acc: number, cost: any) => acc + (cost.totalCost || cost.amount_total || 0), 0),
    [landedCosts],
  )
  const filteredCosts = useMemo(() => {
    return (landedCosts as any[]).filter((cost: any) => {
      const nameMatch = cost.name.toLowerCase().includes(searchQuery.toLowerCase())
      const statusMatch = statusFilter === "all" || cost.state === statusFilter
      const applyOnMatch =
        applyOnFilter === "all" ||
        cost.applyOn === applyOnFilter ||
        (applyOnFilter === "Transfers" && cost.picking_ids?.length) ||
        (applyOnFilter === "Manufacturing Orders" && !cost.picking_ids?.length)
      const vendorBillMatch =
        vendorBillFilter === "all" ||
        (cost.vendorBill && vendorBillFilter === "with-bill") ||
        (!cost.vendorBill && vendorBillFilter === "without-bill")
      return nameMatch && statusMatch && applyOnMatch && vendorBillMatch
    })
  }, [landedCosts, searchQuery, statusFilter, applyOnFilter, vendorBillFilter])

  const handleViewDetails = (cost: any) => {
    setSelectedCost(cost)
    // Prepopulate form
    const date = cost.date ? new Date(cost.date) : new Date()
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    const preLines = (Array.isArray(cost.cost_lines) ? cost.cost_lines : []).map((cl: any) => ({
      id: cl.id,
      productId: Array.isArray(cl.product_id) ? cl.product_id[0] : cl.product_id || null,
      description: cl.description || cl.name || "",
      accountId: Array.isArray(cl.account_id) ? cl.account_id[0] : cl.account || cl.account_id || null,
      splitMethod: cl.split_method || cl.splitMethod || "equal",
      cost: Number(cl.cost ?? cl.price_unit ?? 0),
    }))
    setForm({
      id: cost.id,
      name: cost.name || "",
      date: `${y}-${m}-${d}`,
      journalId: Array.isArray(cost.account_journal_id)
        ? cost.account_journal_id[0]
        : Array.isArray(cost.journal_id)
          ? cost.journal_id[0]
          : cost.journal || null,
      applyOn:
        cost.target_model === 'picking'
          ? 'Transfers'
          : cost.target_model === 'manufacturing'
            ? 'Manufacturing Orders'
            : cost.applyOn || (cost.picking_ids?.length ? 'Transfers' : 'Manufacturing Orders'),
      vendorBillId: Array.isArray(cost.vendor_bill_id)
        ? cost.vendor_bill_id[0]
        : Array.isArray(cost.account_move_id)
          ? cost.account_move_id[0]
          : cost.vendorBill || null,
      pickingId: Array.isArray(cost.picking_ids) ? cost.picking_ids[0] : (typeof cost.picking_id === 'number' ? cost.picking_id : null),
      pickingIds: Array.isArray(cost.picking_ids) ? cost.picking_ids.map((x: any) => (Array.isArray(x) ? x[0] : x)) : [],
      originalLineIds: preLines.map((l:any)=> l.id).filter(Boolean),
      additionalCosts: preLines.length
        ? preLines
        : [{ productId: null, description: "", accountId: null, splitMethod: "equal", cost: 0 }],
    })
    setIsDetailOpen(true)
    // fetch cost lines separately
    if (cost?.id) fetchLandedCostLines(Number(cost.id))
  }

  // Load dropdown data when modal opens
  useEffect(() => {
    const loadLookups = async () => {
      if (!isDetailOpen || !sessionId) return
      setLoadingLookups(true)
      try {
        const base = API_CONFIG.BACKEND_BASE_URL
        const headers: any = { "Content-Type": "application/json" }
        const [jRes, aRes] = await Promise.all([
          fetch(`${base}/account-journals`, { method: "POST", headers, body: JSON.stringify({ sessionId }) }),
          fetch(`${base}/accounts`, { method: "POST", headers, body: JSON.stringify({ sessionId }) }),
        ])
        const j = await jRes.json()
        const a = await aRes.json()
        if (j.success) setJournals(j.journals || [])
        if (a.success) setAccounts(a.accounts || [])
        // vendor bills via data context
        await fetchData('vendorBills')
        await fetchData('pickings')
      } catch (e) {
        console.error("Lookup load failed", e)
      } finally {
        setLoadingLookups(false)
      }
    }
    loadLookups()
  }, [isDetailOpen, sessionId])

  const updateLine = (idx: number, patch: Partial<any>) => {
    setForm((prev: any) => {
      const copy = { ...prev }
      copy.additionalCosts = [...(prev.additionalCosts || [])]
      copy.additionalCosts[idx] = { ...copy.additionalCosts[idx], ...patch }
      return copy
    })
  }

  const addLine = () => {
    setPendingLine({ productId: null, description: "", accountId: null, splitMethod: "equal", cost: 0 })
  }

  const removeLine = (idx: number) => {}

  const confirmPendingLine = async () => {
    if (!pendingLine || !sessionId || !form?.id) return
    try {
      const base = API_CONFIG.BACKEND_BASE_URL
      const body = {
        sessionId,
        values: {
          cost_id: Number(form.id),
          product_id: Number(pendingLine.productId) || false,
          name: pendingLine.description || "",
          account_id: Number(pendingLine.accountId) || false,
          split_method: pendingLine.splitMethod || 'equal',
          price_unit: Number(pendingLine.cost || 0),
        },
      }
      const resp = await fetch(`${base}/landed-cost-lines/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await resp.json().catch(() => ({}))
      if (!resp.ok || !j?.success) throw new Error(j?.message || 'Failed to create line')
      await fetchLandedCostLines(Number(form.id))
      setPendingLine(null)
    } catch (e) {
      console.error('Create landed cost line failed', e)
      setToast({ text: String((e as any)?.message || e), state: 'error' })
    }
  }

  const cancelPendingLine = () => setPendingLine(null)

  const openNew = () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, "0")
    const d = String(today.getDate()).padStart(2, "0")
    setForm({
      id: null,
      name: "",
      date: `${y}-${m}-${d}`,
      journalId: null,
      applyOn: "Transfers",
      vendorBillId: null,
      additionalCosts: [{ productId: null, description: "", accountId: null, splitMethod: "equal", cost: 0 }],
    })
    setIsDetailOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!sessionId || !form) return
      setSaving(true)
      const base = API_CONFIG.BACKEND_BASE_URL
      const payload = {
        name: form.name,
        date: form.date,
        account_journal_id: form.journalId || false,
        vendor_bill_id: form.vendorBillId || false,
        target_model: form.applyOn === 'Transfers' ? 'picking' : 'manufacturing',
        picking_ids: (form as any).pickingId ? [[6, 0, [Number((form as any).pickingId)]]] : undefined,
      }
      let ok = false
      if (form.id) {
        const resp = await fetch(`${base}/landed-costs/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, values: payload }),
        })
        const j = await resp.json()
        ok = !!j?.success
      } else {
        const resp = await fetch(`${base}/landed-costs/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, values: payload }),
        })
        const j = await resp.json()
        ok = !!j?.success
      }
      if (ok) {
        await fetchData("landedCosts")
        setIsDetailOpen(false)
        setToast({ text: form.id ? t("Edited successfully") : t("Landed Cost created successfully"), state: "success" })
      }
    } catch (e) {
      console.error("Save landed cost failed", e)
      setToast({ text: t("Error occured"), state: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
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

      <div className="mx-auto max-w-[1600px] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t("Landed Costs")}
            </h1>
            <p className="text-lg mt-2" style={{ color: colors.textSecondary }}>
              {t("Manage additional costs for inventory valuation")}
            </p>
          </div>
          <Button
            onClick={openNew}
            style={{ backgroundColor: colors.action, color: "#FFFFFF" }}
            className="hover:opacity-90 h-11 px-6 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            {t("New Landed Cost")}
          </Button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <StatCard
            label={t("Total Costs")}
            value={totalCosts}
            icon={FileText}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={0}
          />
          <StatCard
            label={t("Draft")}
            value={draftCosts}
            icon={FileText}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            delay={1}
          />
          <StatCard
            label={t("Posted This Month")}
            value={postedThisMonth}
            icon={CheckCircle2}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            delay={2}
          />
          <StatCard
            label={t("Total Amount")}
            value={`${totalAmount.toLocaleString()} LE`}
            icon={DollarSign}
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            delay={3}
          />
        </div>

        <div
          className="rounded-lg p-4 border shadow-sm"
          style={{ background: colors.card, borderColor: colors.border }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[280px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                style={{ color: colors.textSecondary }}
              />
              <Input
                placeholder={t("Search by name, vendor bill...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-base transition-all focus:ring-2"
                style={{ borderColor: colors.border, background: colors.background, color: colors.textPrimary }}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="h-11 w-[180px] transition-all focus:ring-2"
                style={{ borderColor: colors.border, background: colors.background }}
              >
                <SelectValue placeholder={t("Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Status")}</SelectItem>
                <SelectItem value="draft">{t("Draft")}</SelectItem>
                <SelectItem value="posted">{t("Posted")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={applyOnFilter} onValueChange={setApplyOnFilter}>
              <SelectTrigger
                className="h-11 w-[180px] transition-all focus:ring-2"
                style={{ borderColor: colors.border, background: colors.background }}
              >
                <SelectValue placeholder={t("Apply On")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Types")}</SelectItem>
                <SelectItem value="Transfers">{t("Transfers")}</SelectItem>
                <SelectItem value="Manufacturing Orders">{t("Manufacturing Orders")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={vendorBillFilter} onValueChange={setVendorBillFilter}>
              <SelectTrigger
                className="h-11 w-[180px] transition-all focus:ring-2"
                style={{ borderColor: colors.border, background: colors.background }}
              >
                <SelectValue placeholder={t("Vendor Bill")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Bills")}</SelectItem>
                <SelectItem value="with-bill">{t("With Bill")}</SelectItem>
                <SelectItem value="without-bill">{t("Without Bill")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
          }}
        >
          {filteredCosts.map((cost: any, idx: number) => (
            <LandingCostCard key={cost.id} cost={cost} onClick={() => handleViewDetails(cost)} index={idx} />
          ))}
        </div>

        {filteredCosts.length === 0 && (
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
              <FileText size={28} color={colors.action} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
              {t("No landed costs found")}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
              {t("Try adjusting your filters or search term")}
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isDetailOpen && form && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: 12,
              width: "100%",
              maxWidth: 960,
              maxHeight: "92vh",
              overflow: "visible",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary }}>
                  {form.id ? t("Edit Landed Cost") : t("New Landed Cost")}
                </div>
                <div style={{ fontSize: "0.8125rem", color: colors.textSecondary }}>{form.name || ""}</div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                style={{
                  border: "none",
                  background: colors.background,
                  borderRadius: 8,
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "0.75rem 1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* Name */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>
                  {t("Name")}
                </div>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))}
                  className="h-10"
                  style={{ borderColor: colors.border, background: colors.background, color: colors.textPrimary }}
                />
              </div>
              {/* Date */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>
                  {t("Date")}
                </div>
                <DatePicker
                  value={form.date}
                  onChange={(v) => setForm((p: any) => ({ ...p, date: v }))}
                  colors={colors as any}
                />
              </div>
              {/* Journal */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>
                  {t("Journal")}
                </div>
                <CustomSelect
                  options={journals}
                  value={form.journalId ?? null}
                  onChange={(v) => setForm((p: any) => ({ ...p, journalId: v }))}
                  getLabel={(j: any) => `${j.code ? j.code + " - " : ""}${j.name}`}
                  placeholder={loadingLookups ? t("Loading...") : t("Select journal")}
                />
              </div>
              {/* Apply On */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>
                  {t("Apply On")}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {["Transfers", "Manufacturing Orders"].map((opt) => {
                    const active = form.applyOn === opt
                    return (
                      <label
                        key={opt}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: `1px solid ${active ? colors.action : colors.border}` as any,
                          boxShadow: active ? `0 0 0 6px ${String(colors.action)}33` : "none",
                          cursor: "pointer",
                          background: colors.card,
                        }}
                      >
                        <input
                          type="radio"
                          name="applyOn"
                          checked={active}
                          onChange={() => setForm((p: any) => ({ ...p, applyOn: opt }))}
                          style={{ accentColor: colors.action }}
                        />
                        <span style={{ fontSize: 14, color: colors.textPrimary }}>{t(opt)}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              {/* Vendor Bill */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>
                  {t("Vendor Bill")}
                </div>
                <CustomSelect
                  options={vendorBills}
                  value={form.vendorBillId ?? null}
                  onChange={(v) => setForm((p: any) => ({ ...p, vendorBillId: v }))}
                  getLabel={(mv: any) =>
                    `${mv.name || mv.ref || `#${mv.id}`}${mv.amount_total ? ` - ${mv.amount_total}` : ""}`
                  }
                  placeholder={loadingLookups ? t("Loading...") : t("Select vendor bill")}
                />
              </div>
            </div>

            {/* Scrollable Content (prevents dropdown clipping) */}
            <div style={{ maxHeight: "78vh", overflowY: "auto", paddingBottom: 72 }}>
              {/* Picking */}
              <div style={{ padding: "0 1rem 0.75rem" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>
                  {t("Picking")}
                </div>
                <CustomSelect
                  options={pickings || []}
                  value={(form as any)?.pickingId ?? null}
                  onChange={(v) => setForm((p: any) => ({ ...p, pickingId: v }))}
                  getLabel={(pk: any) => `${pk.name || pk.display_name || pk.origin || pk.reference || `#${pk.id}`}`}
                  placeholder={loadingLookups ? t("Loading...") : t("Select picking")}
                />
              </div>
              {/* Additional Costs */}
              <div style={{ padding: "0 1rem 0.75rem" }}>
                <div style={{ fontWeight: 700, color: colors.textPrimary, margin: "0.25rem 0 0.5rem" }}>
                  {t("Additional Costs")}
                </div>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "visible" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr 0.8fr 40px",
                      gap: 6,
                      padding: "0.4rem 0.5rem",
                      background: colors.mutedBg,
                      color: colors.textSecondary,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <div>{t("Product")}</div>
                    <div>{t("Description")}</div>
                    <div>{t("Account")}</div>
                    <div>{t("Split method")}</div>
                    <div style={{ textAlign: "right" }}>{t("Cost")}</div>
                    <div></div>
                  </div>
                  {((landedCostLinesByCost?.[form?.id] as any[]) || []).map((ln: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr 0.8fr 40px",
                        gap: 6,
                        padding: "0.4rem 0.5rem",
                        borderTop: `1px solid ${colors.border}`,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 12, color: colors.textPrimary }}>
                        {Array.isArray(ln.product_id) ? ln.product_id[1] : ln.product_id}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>{ln.name || ''}</div>
                      <div style={{ fontSize: 12, color: colors.textPrimary }}>
                        {Array.isArray(ln.account_id) ? ln.account_id[1] : ln.account_id}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textPrimary }}>{ln.split_method}</div>
                      <div style={{ fontSize: 12, color: colors.textPrimary, textAlign: 'right' }}>{Number(ln.price_unit || 0)}</div>
                      <div />
                    </div>
                  ))}
                  {pendingLine && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr 0.8fr 40px",
                        gap: 6,
                        padding: "0.4rem 0.5rem",
                        borderTop: `1px solid ${colors.border}`,
                        alignItems: "center",
                      }}
                    >
                      <CustomSelect
                        options={products || []}
                        value={pendingLine.productId ?? null}
                        onChange={(v) => setPendingLine((p:any)=>({ ...(p||{}), productId: v }))}
                        getLabel={(p: any) => `${p.default_code ? p.default_code + " - " : ""}${p.name}`}
                        placeholder={t("Select product")}
                      />
                      <input
                        value={pendingLine.description}
                        onChange={(e) => setPendingLine((p:any)=>({ ...(p||{}), description: e.target.value }))}
                        style={{
                          padding: "0.4rem 0.5rem",
                          border: `1px solid ${colors.border}`,
                          borderRadius: 6,
                          background: colors.card,
                          color: colors.textPrimary,
                        }}
                      />
                      <CustomSelect
                        options={accounts}
                        value={pendingLine.accountId ?? null}
                        onChange={(v) => setPendingLine((p:any)=>({ ...(p||{}), accountId: v }))}
                        getLabel={(acc: any) => `${acc.code ? acc.code + " - " : ""}${acc.name}`}
                        placeholder={loadingLookups ? t("Loading...") : t("Select account")}
                      />
                      <CustomSelect
                        options={[
                          { id: "equal", name: t("Equal") },
                          { id: "by_quantity", name: t("By quantity") },
                          { id: "by_current_cost_price", name: t("By Current Cost") },
                          { id: "by_weight", name: t("By weight") },
                          { id: "by_volume", name: t("By volume") },
                        ]}
                        value={pendingLine.splitMethod}
                        // @ts-ignore generic select accepts string ids
                        onChange={(v) => setPendingLine((p:any)=>({ ...(p||{}), splitMethod: v }))}
                        getLabel={(o: any) => o.name}
                        placeholder={t("Split method")}
                      />
                      <input
                        type="number"
                        value={pendingLine.cost}
                        onChange={(e) => setPendingLine((p:any)=>({ ...(p||{}), cost: Number(e.target.value || 0) }))}
                        style={{
                          padding: "0.4rem 0.5rem",
                          border: `1px solid ${colors.border}`,
                          borderRadius: 6,
                          background: colors.card,
                          color: colors.textPrimary,
                          textAlign: "right",
                        }}
                      />
                      <div />
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 6 }}>
                  <button
                    onClick={addLine}
                    style={{
                      padding: "0.4rem 0.6rem",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: colors.card,
                      color: colors.textPrimary,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {t("Add line")}
                  </button>
                  {pendingLine && (
                    <span style={{ float: 'right', display: 'inline-flex', gap: 8 }}>
                      <button
                        onClick={cancelPendingLine}
                        style={{
                          padding: "0.4rem 0.6rem",
                          borderRadius: 8,
                          border: `1px solid ${colors.border}`,
                          background: colors.card,
                          color: colors.textSecondary,
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        {t('Cancel')}
                      </button>
                      <button
                        onClick={confirmPendingLine}
                        style={{
                          padding: "0.4rem 0.6rem",
                          borderRadius: 8,
                          border: 'none',
                          background: colors.action,
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        {t('Confirm')}
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "0.6rem 1rem",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                position: "sticky",
                bottom: 0,
                background: colors.card,
                zIndex: 1,
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <button
                onClick={() => setIsDetailOpen(false)}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.textSecondary,
                  cursor: "pointer",
                }}
              >
                {t("Close")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: 8,
                  border: "none",
                  background: colors.action,
                  color: "#FFFFFF",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {form.id ? t("Save") : t("Create")}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast text={toast.text} state={toast.state} onClose={() => setToast(null)} />}
    </div>
  )
}
