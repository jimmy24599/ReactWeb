"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { Search, DollarSign, Package, TrendingUp, Award } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { StatCard } from "./components/StatCard"
import { ValuationCard } from "./components/ValuationCard"
import { useData } from "../context/data"


export default function ValuationPage() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [valueRangeFilter, setValueRangeFilter] = useState("all")
  const [stockLevelFilter, setStockLevelFilter] = useState("all")


  const { products, quants } = useData()

  const items = useMemo(() => {
    const qtyByProduct: Record<number, number> = {}
    for (const q of (quants || [])) {
      const pid = Array.isArray(q.product_id) ? Number(q.product_id[0]) : Number(q.product_id)
      if (!pid) continue
      const qty = Number(q.available_quantity ?? q.quantity ?? 0)
      if (!qtyByProduct[pid]) qtyByProduct[pid] = 0
      qtyByProduct[pid] += qty
    }
    const result: Array<{ date: string; reference: string; product: string; quantity: number; totalValue: number; category: string; unitValue: number; imageBase64?: string; }> = []
    for (const p of (products || [])) {
      const pid = typeof p.id === 'number' ? p.id : (Array.isArray(p.id) ? p.id[0] : Number(p.id))
      if (!pid) continue
      const qty = Number(qtyByProduct[pid] || 0)
      if (qty <= 0) continue
      const unit = Number(p.standard_price ?? p.cost ?? 0)
      const total = unit * qty
      const productLabel = String(p.display_name || p.name || '')
      const categ = Array.isArray(p.categ_id) ? (p.categ_id[1] || '') : (p.categ_id?.name || p.categ_id || '')
      const dateStr = String(p.write_date || p.create_date || '')
      const imageBase64 = typeof p.image_1920 === 'string' ? p.image_1920 : undefined
      result.push({ date: dateStr, reference: 'On Hand', product: productLabel, quantity: qty, totalValue: total, category: categ || 'Uncategorized', unitValue: unit, imageBase64 })
    }
    // Sort by totalValue desc by default for nicer UI
    return result.sort((a, b) => b.totalValue - a.totalValue)
  }, [products, quants])

  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0)
  const totalItems = items.length
  const avgValue = totalItems > 0 ? totalValue / totalItems : 0
  const highestValueItem = items.length > 0 ? items.reduce((max, it) => (it.totalValue > max.totalValue ? it : max), items[0]) : null

  const filteredData = items.filter((item) => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory

    let matchesValueRange = true
    if (valueRangeFilter === "low") matchesValueRange = item.totalValue < 50000
    else if (valueRangeFilter === "medium") matchesValueRange = item.totalValue >= 50000 && item.totalValue < 150000
    else if (valueRangeFilter === "high") matchesValueRange = item.totalValue >= 150000

    let matchesStockLevel = true
    if (stockLevelFilter === "low") matchesStockLevel = item.quantity < 100
    else if (stockLevelFilter === "medium") matchesStockLevel = item.quantity >= 100 && item.quantity < 300
    else if (stockLevelFilter === "high") matchesStockLevel = item.quantity >= 300

    return matchesSearch && matchesCategory && matchesValueRange && matchesStockLevel
  })

  const [pageSize, setPageSize] = useState<number>(20)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const clampedPage = Math.min(currentPage, totalPages)
  const start = (clampedPage - 1) * pageSize
  const end = start + pageSize
  const pagedData = filteredData.slice(start, end)

  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean)))

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: colors.textPrimary,
            marginBottom: "0.5rem",
            letterSpacing: "-0.025em",
          }}
        >
          {t("Inventory Valuation")}
        </h1>
        <p style={{ fontSize: "0.95rem", color: colors.textSecondary, opacity: 0.8 }}>
          {t("Comprehensive overview of your warehouse inventory value and analytics")}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          label={t("Total Inventory Value")}
          value={`${(totalValue / 1000).toFixed(1)}K LE`}
          icon={DollarSign}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          delay={0}
        />
        <StatCard
          label={t("Total Items")}
          value={totalItems}
          icon={Package}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          delay={1}
        />
        <StatCard
          label={t("Average Value")}
          value={`${(avgValue / 1000).toFixed(1)}K LE`}
          icon={TrendingUp}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          delay={2}
        />
        <StatCard
          label={t("Highest Value Item")}
          value={highestValueItem ? `${(highestValueItem.totalValue / 1000).toFixed(1)}K LE` : t("N/A")}
          icon={Award}
          gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          delay={3}
        />
      </div>

      <Card
        style={{
          background: colors.card,
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "250px" }}>
            <input
              type="text"
              placeholder={t("Search products...")}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem 0.625rem 2.75rem",
                borderRadius: "8px",
                border: `2px solid ${colors.border}`,
                fontSize: "0.875rem",
                outline: "none",
                transition: "all 0.2s",
                background: colors.background,
                color: colors.textPrimary,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.action
                e.target.style.boxShadow = `0 0 0 3px ${colors.action}15`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border
                e.target.style.boxShadow = "none"
              }}
            />
            <Search
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "18px",
                height: "18px",
                color: colors.textSecondary,
                opacity: 0.6,
              }}
            />
          </div>

          <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}>
            <SelectTrigger style={{ width: "180px" }}>
              <SelectValue placeholder={t("Category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Categories")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={valueRangeFilter} onValueChange={(v) => { setValueRangeFilter(v); setCurrentPage(1); }}>
            <SelectTrigger style={{ width: "180px" }}>
              <SelectValue placeholder={t("Value Range")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Values")}</SelectItem>
              <SelectItem value="low">{t("Low (< 50K)")}</SelectItem>
              <SelectItem value="medium">{t("Medium (50K-150K)")}</SelectItem>
              <SelectItem value="high">{t("High (> 150K)")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stockLevelFilter} onValueChange={(v) => { setStockLevelFilter(v); setCurrentPage(1); }}>
            <SelectTrigger style={{ width: "180px" }}>
              <SelectValue placeholder={t("Stock Level")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Levels")}</SelectItem>
              <SelectItem value="low">{t("Low (< 100)")}</SelectItem>
              <SelectItem value="medium">{t("Medium (100-300)")}</SelectItem>
              <SelectItem value="high">{t("High (> 300)")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger style={{ width: "140px" }}>
              <SelectValue placeholder={t("Page size")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "1rem",
        }}
      >
        {pagedData.map((item, index) => (
          <ValuationCard
            key={`${item.product}-${index}`}
            date={item.date}
            reference={item.reference}
            product={item.product}
            quantity={item.quantity}
            totalValue={item.totalValue}
            category={item.category}
            unitValue={item.unitValue}
            imageBase64={item.imageBase64}
          />
        ))}
      </div>

      {filteredData.length === 0 && (
        <div
          style={{
            background: colors.card,
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            border: `1px solid ${colors.border}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.action}20, ${colors.action}10)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <Package size={32} color={colors.action} />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
            {t("No items found")}
          </h3>
          <p style={{ fontSize: "0.875rem", color: colors.textSecondary, opacity: 0.8 }}>
            {t("Try adjusting your search or filter criteria")}
          </p>
        </div>
      )}

      {filteredData.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
            {t('Showing')} {start + 1}-{Math.min(end, filteredData.length)} {t('of')} {filteredData.length}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={clampedPage === 1}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary, cursor: clampedPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              {t('Prev')}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textSecondary }}>
              {t('Page')} {clampedPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={clampedPage === totalPages}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary, cursor: clampedPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              {t('Next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
