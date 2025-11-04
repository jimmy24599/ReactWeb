"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "../context/data"
import { useTheme } from "../context/theme"


// Use ThemeContext colors for full theming consistency

export default function MovesHistoryPage() {
  const { t } = useTranslation()
  const { stockMoves } = useData()
  const { colors } = useTheme()
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [fromFilter, setFromFilter] = useState<string>("all")
  const [toFilter, setToFilter] = useState<string>("all")
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [selectedMove, setSelectedMove] = useState<any | null>(null)

  const moves = useMemo(() => {
    const mapStatus = (state?: string) => {
      const s = (state || '').toLowerCase()
      if (s === 'done') return 'Done'
      if (s === 'cancel') return 'Cancelled'
      if (s === 'assigned' || s === 'waiting' || s === 'confirmed') return 'Pending'
      return 'Pending'
    }
    return (stockMoves || []).map((m: any) => ({
      date: m.date || m.date_deadline || m.create_date || '',
      reference: m.reference || m.name || m.origin || '',
      product: m.product_id?.[1] || '',
      lotSerial: m.lot_ids?.[0]?.[1] || '',
      from: m.location_id?.[1] || '',
      to: m.location_dest_id?.[1] || '',
      quantity: typeof m.quantity_done === 'number' && m.quantity_done > 0 ? m.quantity_done : (m.product_uom_qty || 0),
      unit: m.product_uom?.[1] || 'Units',
      status: mapStatus(m.state),
      raw: m,
    }))
  }, [stockMoves])

  const totalQuantity = moves.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
  const totalMoves = moves.length

  const filteredMoves = moves.filter((move: any) => {
    const matchesSearch =
      move.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      move.reference.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || move.status === statusFilter
    const matchesFrom = fromFilter === "all" || move.from === fromFilter
    const matchesTo = toFilter === "all" || move.to === toFilter

    return matchesSearch && matchesStatus && matchesFrom && matchesTo
  })

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredMoves.length / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredMoves.length)
  const pagedMoves = filteredMoves.slice(startIndex, endIndex)

  // Clamp page to totalPages when data size changes
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // Reset to first page when filters or page size change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter, fromFilter, toFilter, pageSize])

  // Get unique values for filters
  const uniqueFromLocations = Array.from(new Set(moves.map((m: any) => m.from)))
  const uniqueToLocations = Array.from(new Set(moves.map((m: any) => m.to)))

  return (
    <>
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

          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div
        style={{
          minHeight: "100vh",
          background: colors.background,
          padding: "2rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: "2rem",
            animation: "fadeInDown 0.6s ease-out",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: "0.5rem",
              letterSpacing: "-0.025em",
            }}
          >
            {t("Warehouse Moves History")}
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: colors.textSecondary,
            }}
          >
            {t("Real-time inventory movement tracking and analytics")}
          </p>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: `1px solid ${colors.border}`,
              animation: "fadeInUp 0.6s ease-out 0.1s backwards",
            }}
          >
            <div style={{ fontSize: "0.875rem", color: colors.textSecondary, marginBottom: "0.5rem", fontWeight: "500" }}>
              {t("Total Moves")}
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "700", color: colors.textPrimary }}>{totalMoves}</div>
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.375rem",
                  background: colors.pillSuccessBg,
                  color: colors.pillSuccessText,
                  fontSize: "0.75rem",
                  fontWeight: "600",
                }}
              >
                ↑ +2%
              </span>
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t("from last quarter")}</span>
            </div>
          </div>

          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: `1px solid ${colors.border}`,
              animation: "fadeInUp 0.6s ease-out 0.2s backwards",
            }}
          >
            <div style={{ fontSize: "0.875rem", color: colors.textSecondary, marginBottom: "0.5rem", fontWeight: "500" }}>
              {t("Total Quantity")}
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "700", color: colors.textPrimary }}>
              {totalQuantity.toLocaleString()}
            </div>
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.375rem",
                  background: colors.pillSuccessBg,
                  color: colors.pillSuccessText,
                  fontSize: "0.75rem",
                  fontWeight: "600",
                }}
              >
                ↑ +5%
              </span>
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t("from last month")}</span>
            </div>
          </div>

          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: `1px solid ${colors.border}`,
              animation: "fadeInUp 0.6s ease-out 0.3s backwards",
            }}
          >
            <div style={{ fontSize: "0.875rem", color: colors.textSecondary, marginBottom: "0.5rem", fontWeight: "500" }}>
              {t("Avg per Move")}
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "700", color: colors.textPrimary }}>
              {Math.round(totalQuantity / totalMoves)}
            </div>
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.375rem",
                  background: colors.inProgress,
                  color: colors.textPrimary,
                  fontSize: "0.75rem",
                  fontWeight: "600",
                }}
              >
                → 0%
              </span>
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t("vs last month")}</span>
            </div>
          </div>

          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: `1px solid ${colors.border}`,
              animation: "fadeInUp 0.6s ease-out 0.4s backwards",
            }}
          >
            <div style={{ fontSize: "0.875rem", color: colors.textSecondary, marginBottom: "0.5rem", fontWeight: "500" }}>
              {t("Success Rate")}
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "700", color: colors.textPrimary }}>100%</div>
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.375rem",
                  background: colors.pillSuccessBg,
                  color: colors.pillSuccessText,
                  fontSize: "0.75rem",
                  fontWeight: "600",
                }}
              >
                ✓ Perfect
              </span>
              <span style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t("all completed")}</span>
            </div>
          </div>
        </div>

        {/* Moves Table */}
        <div
          style={{
            background: colors.card,
            borderRadius: "0.75rem",
            border: `1px solid ${colors.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
            animation: "fadeInUp 0.6s ease-out 0.5s backwards",
          }}
        >
          <div style={{ padding: "1.5rem", borderBottom: `1px solid ${colors.border}` }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: colors.textPrimary }}>
                {t("Recent Movements")}
              </h3>

              <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder={t("Search moves...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "0.625rem 1rem",
                    borderRadius: "0.5rem",
                    border: `1px solid ${colors.border}`,
                    fontSize: "0.875rem",
                    outline: "none",
                    transition: "all 0.3s ease",
                    width: "30%",
                    minWidth: "250px",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.action
                    e.target.style.boxShadow = `0 0 0 3px rgba(82,104,237,0.1)`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = "none"
                  }}
                />

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger style={{ width: "150px" }}>
                    <SelectValue placeholder={t("Status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All Status")}</SelectItem>
                    <SelectItem value="Done">{t("Done")}</SelectItem>
                    <SelectItem value="Pending">{t("Pending")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={fromFilter} onValueChange={setFromFilter}>
                  <SelectTrigger style={{ width: "200px" }}>
                    <SelectValue placeholder={t("From")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All Sources")}</SelectItem>
                    {uniqueFromLocations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={toFilter} onValueChange={setToFilter}>
                  <SelectTrigger style={{ width: "150px" }}>
                    <SelectValue placeholder={t("To")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All Destinations")}</SelectItem>
                    {uniqueToLocations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: colors.background }}>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("Date")}
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("Reference")}
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("Product")}
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("From")}
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("To")}
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("Quantity")}
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("Status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedMoves.map((move, index) => (
                  <tr
                    key={index}
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => setSelectedMove(move)}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      background: hoveredRow === index ? colors.background : "transparent",
                      transition: "all 0.2s ease",
                      animation: `fadeInUp 0.4s ease-out ${0.6 + index * 0.05}s backwards`,
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textSecondary, whiteSpace: "nowrap" }}>
                      {move.date}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textSecondary }}>{move.reference}</td>
                    <td
                      style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textPrimary, fontWeight: "500" }}
                    >
                      {move.product}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textSecondary }}>{move.from}</td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: colors.textSecondary }}>{move.to}</td>
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        color: colors.textPrimary,
                        fontWeight: "600",
                        textAlign: "right",
                      }}
                    >
                      {move.quantity.toFixed(2)} {move.unit}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          background:
                            move.status === "Done"
                              ? colors.pillSuccessBg
                              : move.status === "Cancelled"
                              ? colors.cancel
                              : colors.pillInfoBg,
                          color:
                            move.status === "Done"
                              ? colors.pillSuccessText
                              : move.status === "Cancelled"
                              ? "#FFFFFF"
                              : colors.pillInfoText,
                        }}
                      >
                        {move.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredMoves.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: `1px solid ${colors.border}` }}>
              <div style={{ color: colors.textSecondary, fontSize: 14 }}>
                {t('Showing')} {startIndex + 1}–{endIndex} {t('of')} {filteredMoves.length}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary, opacity: page <= 1 ? 0.6 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  {t('First')}
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary, opacity: page <= 1 ? 0.6 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  {t('Prev')}
                </button>
                <span style={{ color: colors.textSecondary, fontSize: 14 }}>
                  {t('Page')} {page} {t('of')} {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary, opacity: page >= totalPages ? 0.6 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                  {t('Next')}
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary, opacity: page >= totalPages ? 0.6 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                  {t('Last')}
                </button>

                {/* Page size selector */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                  <span style={{ color: colors.textSecondary, fontSize: 14 }}>{t('Rows')}</span>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                    <SelectTrigger style={{ width: '90px' }}>
                      <SelectValue placeholder={String(pageSize)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {filteredMoves.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: colors.textSecondary,
              }}
            >
              {t("No moves found matching your filters.")}
            </div>
          )}
        </div>

        {selectedMove && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
            onClick={() => setSelectedMove(null)}
          >
            <div
              style={{ width: 'min(1000px, 96vw)', maxHeight: '90vh', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: `1px solid ${colors.border}` }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: colors.textPrimary }}>{(selectedMove.raw?.production || selectedMove.production)?.name || selectedMove.reference || t('Move')}</h3>
                  <div style={{ fontSize: 13, color: colors.textSecondary }}>
                    {t('Product')}: {(selectedMove.raw?.production || selectedMove.production)?.product_id?.[1] || selectedMove.product}
                  </div>
                </div>
                <button onClick={() => setSelectedMove(null)} style={{ border: 'none', background: 'transparent', color: colors.textSecondary, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ padding: '1rem 1.25rem', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>{t('Start date')}</div>
                    <div style={{ color: colors.textPrimary, fontWeight: 600 }}>{(selectedMove.raw?.production || selectedMove.production)?.date_planned_start || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>{t('Scheduled End')}</div>
                    <div style={{ color: colors.textPrimary, fontWeight: 600 }}>{(selectedMove.raw?.production || selectedMove.production)?.date_planned_finished || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>{t('Bills of material')}</div>
                    <div style={{ color: colors.textPrimary, fontWeight: 600 }}>{Array.isArray((selectedMove.raw?.production || selectedMove.production)?.bom_id) ? (selectedMove.raw?.production || selectedMove.production)?.bom_id[1] : '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>{t('Responsible')}</div>
                    <div style={{ color: colors.textPrimary, fontWeight: 600 }}>{Array.isArray((selectedMove.raw?.production || selectedMove.production)?.user_id) ? (selectedMove.raw?.production || selectedMove.production)?.user_id[1] : '-'}</div>
                  </div>
                </div>

                <h4 style={{ margin: '1rem 0 0.5rem', color: colors.textPrimary }}>{t('Components')}</h4>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: colors.background }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('Product')}</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('From')}</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('To consume')}</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('Quantity')}</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('UoM')}</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>{t('Consumed')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((selectedMove.raw?.components || selectedMove.components) || []).map((c: any) => (
                        <tr key={c.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                          <td style={{ padding: '0.5rem' }}>{Array.isArray(c.product_id) ? c.product_id[1] : c.name}</td>
                          <td style={{ padding: '0.5rem' }}>{Array.isArray(c.location_id) ? c.location_id[1] : ''}</td>
                          <td style={{ padding: '0.5rem' }}>{Number(c.product_uom_qty ?? 0)}</td>
                          <td style={{ padding: '0.5rem' }}>{Number(c.quantity_done ?? 0)}</td>
                          <td style={{ padding: '0.5rem' }}>{Array.isArray(c.product_uom) ? c.product_uom[1] : ''}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <input type="checkbox" checked={Number(c.quantity_done ?? 0) >= Number(c.product_uom_qty ?? 0)} readOnly />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 style={{ margin: '1rem 0 0.5rem', color: colors.textPrimary }}>{t('Work order')}</h4>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: colors.background }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('Operation')}</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('Work center')}</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('Product')}</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>{t('Quantity produced')}</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>{t('Expected duration')}</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>{t('Real duration')}</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>{t('Status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((selectedMove.raw?.workOrders || selectedMove.workOrders) || []).map((w: any) => (
                        <tr key={w.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                          <td style={{ padding: '0.5rem' }}>{w.name}</td>
                          <td style={{ padding: '0.5rem' }}>{Array.isArray(w.workcenter_id) ? w.workcenter_id[1] : ''}</td>
                          <td style={{ padding: '0.5rem' }}>{(selectedMove.raw?.production || selectedMove.production)?.product_id?.[1] || '-'}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{Number(w.qty_production ?? 0)}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{Number(w.duration_expected ?? 0).toFixed(2)}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{Number(w.duration ?? 0).toFixed(2)}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>{w.state}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 style={{ margin: '1rem 0 0.5rem', color: colors.textPrimary }}>{t('Miscellaneous')}</h4>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: colors.background }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('Operation type')}</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('Component location')}</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('Finished products location')}</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>{t('Source')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((selectedMove.raw?.miscellaneous || selectedMove.miscellaneous) || []).map((m: any) => (
                        <tr key={m.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                          <td style={{ padding: '0.5rem' }}>{Array.isArray(m.picking_type_id) ? m.picking_type_id[1] : ''}</td>
                          <td style={{ padding: '0.5rem' }}>{Array.isArray(m.location_id) ? m.location_id[1] : ''}</td>
                          <td style={{ padding: '0.5rem' }}>{Array.isArray(m.location_dest_id) ? m.location_dest_id[1] : ''}</td>
                          <td style={{ padding: '0.5rem' }}>{m.origin || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '0.75rem 1.25rem', borderTop: `1px solid ${colors.border}` }}>
                <button onClick={() => setSelectedMove(null)} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}>{t('Close')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
