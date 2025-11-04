"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Package,
  AlertCircle,
  Search,
  History,
  RefreshCw,
  MapPin,
  DollarSign,
  Check,
  PackageOpen,
  Layers,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { ProductModal } from "./components/ProductModal"

const Checkbox = ({
  id,
  checked,
  onCheckedChange,
}: {
  id: string
  checked: boolean
  onCheckedChange: () => void
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      id={id}
      onClick={onCheckedChange}
      style={{
        width: "1.25rem",
        height: "1.25rem",
        borderRadius: "0.25rem",
        border: checked ? "2px solid #1B475D" : "2px solid #F2F3EC",
        background: checked ? "#1B475D" : "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {checked && <Check style={{ width: "0.875rem", height: "0.875rem", color: "white" }} />}
    </button>
  )
}

// Derived from real data (quants + products)
interface StockCardItem {
  quantId: number
  productId: number
  name: string
  category: string
  unitCost: number
  totalValue: number
  onHand: number
  freeToUse: number
  incoming: number
  outgoing: number
  uom: string
  image?: string
}

export default function Stocks() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockLevelFilter, setStockLevelFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [showProductModal, setShowProductModal] = useState(false)
  const [activeProduct, setActiveProduct] = useState<any | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12

  const { colors } = useTheme()
  const { quants, products } = useData()

  const productMap = useMemo(() => {
    const map = new Map<number, any>()
    for (const p of products || []) map.set(p.id, p)
    return map
  }, [products])

  const stocks: StockCardItem[] = useMemo(() => {
    const list: StockCardItem[] = []
    for (const q of quants || []) {
      const quantId = Number(q.id)
      const pid = Array.isArray(q.product_id) ? q.product_id[0] : q.product_id
      if (!pid) continue
      const prod = productMap.get(pid) || {}
      const name = prod.name || (Array.isArray(q.product_id) ? q.product_id[1] : `#${pid}`)
      const unitCost = Number(prod.standard_price) || 0
      const category = Array.isArray(prod.categ_id)
        ? prod.categ_id[1]
        : Array.isArray(q.product_categ_id)
          ? q.product_categ_id[1]
          : ""
      const uom = Array.isArray(q.product_uom_id)
        ? q.product_uom_id[1]
        : Array.isArray(prod.uom_id)
          ? prod.uom_id[1]
          : "Units"
      const image = prod.image_1920
      const onHand = Number(q.on_hand ?? q.quantity ?? 0)
      const reserved = Number(q.reserved_quantity ?? 0)
      const freeToUse = Number(q.available_quantity ?? onHand - reserved)
      const totalValue = Number(q.value ?? onHand * unitCost)
      list.push({
        quantId,
        productId: pid,
        name,
        category,
        unitCost,
        totalValue,
        onHand,
        freeToUse,
        incoming: 0,
        outgoing: 0,
        uom,
        image,
      })
    }
    return list
  }, [quants, productMap])

  const categories = useMemo(() => {
    return Array.from(
      new Set((products || []).map((p: any) => (Array.isArray(p.categ_id) ? p.categ_id[1] : "")).filter(Boolean)),
    )
  }, [products])

  const filteredData = stocks.filter((item) => {
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesStockLevel =
      stockLevelFilter === "all" ||
      (stockLevelFilter === "low" && item.onHand < 100) ||
      (stockLevelFilter === "medium" && item.onHand >= 100 && item.onHand < 500) ||
      (stockLevelFilter === "high" && item.onHand >= 500)
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.productId).includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesStockLevel && matchesSearch
  })

  const totalValue = filteredData.reduce((sum, item) => sum + (item.totalValue || 0), 0)
  const totalUnits = filteredData.reduce((sum, item) => sum + (item.onHand || 0), 0)
  const lowStockItems = filteredData.filter((item) => item.onHand < 100).length

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))
  const startIndex = (page - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredData.length)
  const pagedData = filteredData.slice(startIndex, endIndex)

  // Reset to first page when filters/search change
  // Also clamp page if current page exceeds totalPages
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // No edit modal; Add Product opens ProductModal

  return (
    <div style={{ minHeight: "100vh", background: colors.background, padding: "2rem 2.5rem" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2.25rem",
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: "0.5rem",
              letterSpacing: "-0.03em",
              lineHeight: "1.2",
            }}
          >
            {t("Stocks")}
          </h1>
          <p style={{ fontSize: "1rem", color: colors.textSecondary, letterSpacing: "-0.01em" }}>
            {t("Monitor and manage your product inventory")}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <Card
            style={{
              background: `linear-gradient(135deg, ${colors.action}15 0%, ${colors.action}08 100%)`,
              padding: "1.5rem",
              border: `1px solid ${colors.action}30`,
              borderRadius: "1rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: "-20px", right: "-20px", opacity: 0.1 }}>
              <DollarSign style={{ width: "120px", height: "120px", color: colors.action }} />
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: "0.5rem",
                  letterSpacing: "0.02em",
                }}
              >
                {t("Total Value")}
              </p>
              <p style={{ fontSize: "2rem", fontWeight: "700", color: colors.textPrimary, letterSpacing: "-0.02em" }}>
                {totalValue.toLocaleString()} LE
              </p>
            </div>
          </Card>

          <Card
            style={{
              background: `linear-gradient(135deg, ${colors.action}12 0%, ${colors.action}05 100%)`,
              padding: "1.5rem",
              border: `1px solid ${colors.border}`,
              borderRadius: "1rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: "-20px", right: "-20px", opacity: 0.08 }}>
              <Layers style={{ width: "120px", height: "120px", color: colors.action }} />
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: "0.5rem",
                  letterSpacing: "0.02em",
                }}
              >
                {t("Total Units")}
              </p>
              <p style={{ fontSize: "2rem", fontWeight: "700", color: colors.textPrimary, letterSpacing: "-0.02em" }}>
                {totalUnits.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card
            style={{
              background:
                lowStockItems > 0
                  ? `linear-gradient(135deg, ${colors.cancel}15 0%, ${colors.cancel}08 100%)`
                  : `linear-gradient(135deg, ${colors.action}12 0%, ${colors.action}05 100%)`,
              padding: "1.5rem",
              border: `1px solid ${lowStockItems > 0 ? colors.cancel + "30" : colors.border}`,
              borderRadius: "1rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: "-20px", right: "-20px", opacity: 0.08 }}>
              <AlertCircle
                style={{ width: "120px", height: "120px", color: lowStockItems > 0 ? colors.cancel : colors.action }}
              />
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: "0.5rem",
                  letterSpacing: "0.02em",
                }}
              >
                {t("Low Stock Items")}
              </p>
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  color: lowStockItems > 0 ? colors.cancel : colors.textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                {lowStockItems}
              </p>
            </div>
          </Card>
        </div>

        <Card
          style={{
            background: colors.card,
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
            border: `1px solid ${colors.border}`,
            borderRadius: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 300px", minWidth: "250px" }}>
              <Search
                style={{
                  position: "absolute",
                  [isRTL ? "right" : "left"]: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: "1.125rem",
                  width: "1.125rem",
                  color: colors.textSecondary,
                  pointerEvents: "none",
                }}
              />
              <Input
                placeholder={t("Search products...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  [isRTL ? "paddingRight" : "paddingLeft"]: "2.75rem",
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  height: "2.75rem",
                  borderRadius: "0.625rem",
                  color: colors.textPrimary,
                  fontSize: "0.9375rem",
                }}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger
                style={{
                  width: "180px",
                  height: "2.75rem",
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "0.625rem",
                  color: colors.textPrimary,
                  fontSize: "0.9375rem",
                }}
              >
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

            <Select value={stockLevelFilter} onValueChange={setStockLevelFilter}>
              <SelectTrigger
                style={{
                  width: "180px",
                  height: "2.75rem",
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "0.625rem",
                  color: colors.textPrimary,
                  fontSize: "0.9375rem",
                }}
              >
                <SelectValue placeholder={t("Stock Level")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Levels")}</SelectItem>
                <SelectItem value="low">{t("Low Stock (< 100)")}</SelectItem>
                <SelectItem value="medium">{t("Medium Stock (100-499)")}</SelectItem>
                <SelectItem value="high">{t("High Stock (500+)")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger
                style={{
                  width: "180px",
                  height: "2.75rem",
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "0.625rem",
                  color: colors.textPrimary,
                  fontSize: "0.9375rem",
                }}
              >
                <SelectValue placeholder={t("Location")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Locations")}</SelectItem>
                <SelectItem value="warehouse-a">{t("Warehouse A")}</SelectItem>
                <SelectItem value="warehouse-b">{t("Warehouse B")}</SelectItem>
                <SelectItem value="retail">{t("Retail Store")}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              style={{
                borderRadius: "0.625rem",
                background: colors.action,
                color: "#FFFFFF",
                height: "2.75rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                paddingLeft: "1.25rem",
                paddingRight: "1.25rem",
                marginLeft: "auto",
                fontWeight: "600",
                fontSize: "0.9375rem",
                border: "none",
                transition: "all 0.2s",
              }}
              onClick={() => setShowProductModal(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)"
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.12)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.08)"
              }}
            >
              <Package style={{ height: "1.125rem", width: "1.125rem" }} />
              {t("Add Product")}
            </Button>
          </div>
        </Card>
      </header>

      {pagedData.length === 0 ? (
        <Card
          style={{
            background: colors.card,
            padding: "4rem 2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: `1px solid ${colors.border}`,
            borderRadius: "1rem",
            textAlign: "center",
          }}
        >
          <PackageOpen
            style={{
              width: "4rem",
              height: "4rem",
              color: colors.textSecondary,
              margin: "0 auto 1.5rem",
              opacity: 0.5,
            }}
          />
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
            {t("No products found")}
          </h3>
          <p style={{ fontSize: "0.9375rem", color: colors.textSecondary, marginBottom: "1.5rem" }}>
            {t("Try adjusting your filters or search query")}
          </p>
          <Button
            style={{
              background: colors.action,
              color: "#FFFFFF",
              borderRadius: "0.625rem",
              padding: "0.625rem 1.5rem",
              fontWeight: "600",
            }}
            onClick={() => {
              setSearchQuery("")
              setCategoryFilter("all")
              setStockLevelFilter("all")
              setLocationFilter("all")
            }}
          >
            {t("Clear Filters")}
          </Button>
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          }}
        >
          {pagedData.map((item, index) => (
            <Card
              key={`${item.quantId}-${index}`}
              style={{
                background: colors.card,
                padding: "0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                border: `1px solid ${colors.border}`,
                borderRadius: "1rem",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)"
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.06)"
                e.currentTarget.style.borderColor = colors.action + "40"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"
                e.currentTarget.style.borderColor = colors.border
              }}
              onClick={() => {
                const prod = productMap.get(item.productId)
                if (prod) {
                  setActiveProduct(prod)
                  setShowProductModal(true)
                }
              }}
            >
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: `1px solid ${colors.border}`,
                  background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.mutedBg} 100%)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "start", gap: "1rem" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "0.75rem",
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {item.image ? (
                      <img
                        src={`data:image/png;base64,${item.image}`}
                        alt={item.name}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <Package
                        style={{ height: "1.75rem", width: "1.75rem", color: colors.textSecondary, opacity: 0.5 }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "start", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <h3
                        style={{
                          fontSize: "1.0625rem",
                          fontWeight: "700",
                          color: colors.textPrimary,
                          letterSpacing: "-0.01em",
                          lineHeight: "1.3",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {item.name}
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: "500",
                        color: colors.textSecondary,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {item.category}
                    </p>
                    {item.onHand < 100 && (
                      <Badge
                        style={{
                          background: colors.cancel,
                          color: "#FFFFFF",
                          border: "none",
                          fontSize: "0.6875rem",
                          padding: "0.25rem 0.625rem",
                          fontWeight: "600",
                          borderRadius: "0.375rem",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {t("Low Stock")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${colors.border}` }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {t("Unit Cost")}
                  </span>
                  <span
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "700",
                      color: colors.textPrimary,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {item.unitCost.toFixed(2)} LE
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {t("Total Value")}
                  </span>
                  <span
                    style={{ fontSize: "1.125rem", fontWeight: "700", color: colors.action, letterSpacing: "-0.01em" }}
                  >
                    {Math.round(item.totalValue).toLocaleString()} LE
                  </span>
                </div>
              </div>

              <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div
                    style={{
                      borderRadius: "0.625rem",
                      background: `linear-gradient(135deg, ${colors.action}08 0%, ${colors.action}03 100%)`,
                      border: `1px solid ${colors.action}15`,
                      padding: "0.875rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: "600",
                        color: colors.textSecondary,
                        marginBottom: "0.375rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {t("On Hand")}
                    </p>
                    <p
                      style={{
                        fontSize: "1.625rem",
                        fontWeight: "700",
                        color: colors.textPrimary,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {item.onHand}
                    </p>
                  </div>
                  <div
                    style={{
                      borderRadius: "0.625rem",
                      background: `linear-gradient(135deg, ${colors.action}08 0%, ${colors.action}03 100%)`,
                      border: `1px solid ${colors.action}15`,
                      padding: "0.875rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: "600",
                        color: colors.textSecondary,
                        marginBottom: "0.375rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {t("Free to use")}
                    </p>
                    <p
                      style={{
                        fontSize: "1.625rem",
                        fontWeight: "700",
                        color: colors.textPrimary,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {item.freeToUse}
                    </p>
                  </div>
                  <div
                    style={{
                      borderRadius: "0.625rem",
                      background: colors.mutedBg,
                      border: `1px solid ${colors.border}`,
                      padding: "0.875rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: "600",
                        color: colors.textSecondary,
                        marginBottom: "0.375rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {t("Incoming")}
                    </p>
                    <p
                      style={{
                        fontSize: "1.625rem",
                        fontWeight: "700",
                        color: colors.textPrimary,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {item.incoming}
                    </p>
                  </div>
                  <div
                    style={{
                      borderRadius: "0.625rem",
                      background: colors.mutedBg,
                      border: `1px solid ${colors.border}`,
                      padding: "0.875rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: "600",
                        color: colors.textSecondary,
                        marginBottom: "0.375rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {t("Outgoing")}
                    </p>
                    <p
                      style={{
                        fontSize: "1.625rem",
                        fontWeight: "700",
                        color: colors.textPrimary,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {item.outgoing}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ padding: "1rem 1.5rem", display: "flex", gap: "0.625rem" }}>
                <Button
                  variant="outline"
                  size="sm"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                    borderRadius: "0.5rem",
                    fontSize: "0.8125rem",
                    fontWeight: "600",
                    height: "2.25rem",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.mutedBg
                    e.currentTarget.style.borderColor = colors.action + "40"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.borderColor = colors.border
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <History
                    style={{
                      [isRTL ? "marginLeft" : "marginRight"]: "0.375rem",
                      height: "0.875rem",
                      width: "0.875rem",
                    }}
                  />
                  {t("History")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                    borderRadius: "0.5rem",
                    fontSize: "0.8125rem",
                    fontWeight: "600",
                    height: "2.25rem",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.mutedBg
                    e.currentTarget.style.borderColor = colors.action + "40"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.borderColor = colors.border
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <RefreshCw
                    style={{
                      [isRTL ? "marginLeft" : "marginRight"]: "0.375rem",
                      height: "0.875rem",
                      width: "0.875rem",
                    }}
                  />
                  {t("Replenish")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={{
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                    borderRadius: "0.5rem",
                    padding: "0 0.875rem",
                    height: "2.25rem",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.mutedBg
                    e.currentTarget.style.borderColor = colors.action + "40"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.borderColor = colors.border
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MapPin style={{ height: "0.875rem", width: "0.875rem" }} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pagedData.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "2rem",
            padding: "1.25rem 1.5rem",
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: "1rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ color: colors.textSecondary, fontSize: "0.9375rem", fontWeight: "500" }}>
            {t("Showing")} {filteredData.length === 0 ? 0 : startIndex + 1}–{endIndex} {t("of")} {filteredData.length}{" "}
            {t("stocks")}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              style={{
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                height: "2.5rem",
                paddingLeft: "1rem",
                paddingRight: "1rem",
              }}
            >
              {t("First")}
            </Button>
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                height: "2.5rem",
                paddingLeft: "1rem",
                paddingRight: "1rem",
              }}
            >
              {t("Prev")}
            </Button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 1rem",
                color: colors.textPrimary,
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              <span>
                {t("Page")} {page} {t("of")} {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                height: "2.5rem",
                paddingLeft: "1rem",
                paddingRight: "1rem",
              }}
            >
              {t("Next")}
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              style={{
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                height: "2.5rem",
                paddingLeft: "1rem",
                paddingRight: "1rem",
              }}
            >
              {t("Last")}
            </Button>
          </div>
        </div>
      )}

      {/* Product Modal (Add or Edit) */}
      {showProductModal && (
        <ProductModal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false)
            setActiveProduct(null)
          }}
          product={
            activeProduct ?? {
              id: 0,
              name: "",
              default_code: "",
              qty_available: 0,
              virtual_available: 0,
              list_price: 0,
              standard_price: 0,
              image_1920: undefined,
              categ_id: [0, ""],
              weight: 0,
              sale_ok: true,
              barcode: "",
            }
          }
        />
      )}

      {/* No toast here; ProductModal handles its own UX */}

      <Card
        style={{
          marginTop: "2rem",
          background: colors.card,
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: `1px solid ${colors.border}`,
          borderRadius: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <p style={{ fontSize: "1rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.25rem" }}>
              {t("Showing {{count}} stocks", { count: filteredData.length })}
            </p>
            <p style={{ fontSize: "0.875rem", color: colors.textSecondary }}>
              {t("Total inventory value:")}{" "}
              <span style={{ fontWeight: "600", color: colors.textPrimary }}>{totalValue.toLocaleString()} LE</span>
            </p>
          </div>
          <Button
            style={{
              background: colors.action,
              color: "#FFFFFF",
              borderRadius: "0.75rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            {t("Export Report")}
          </Button>
        </div>
      </Card>
    </div>
  )
}
