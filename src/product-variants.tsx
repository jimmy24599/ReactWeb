"use client"

import { useEffect, useMemo, useState } from "react"
import { Package, DollarSign, TrendingUp, Archive, Search, Star, Barcode, Tag, AlertCircle, RefreshCcw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "../context/theme"
import { VariantModal } from "./components/VariantModal"
import { useData } from "../context/data"
import { useAuth } from "../context/auth"
import { StatCard } from "./components/StatCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ProductVariant {
  id: number
  internalReference: string
  name: string
  website: string
  variantValues: string
  salesPrice: number
  cost: number
  onHand: number
  forecasted: number
  unit: string
  category: string
  barcode: string
  productType: string
  sales: boolean
  purchase: boolean
  trackInventory: boolean
  salesTaxes: number
  purchaseTaxes: number
  invoicingPolicy: string
  favorite: boolean
  productImage: string
}

export default function ProductVariantsPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [isNewVariant, setIsNewVariant] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all")
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isRowModalOpen, setIsRowModalOpen] = useState(false)

  const { products, loading, errors, fetchData } = useData()
  const { sessionId, isAuthenticated } = useAuth()

  useEffect(() => {
    if (sessionId && isAuthenticated) {
      fetchData("products")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isAuthenticated])

  // Map real product.product data into ProductVariant shape for this UI
  const variants: ProductVariant[] = useMemo(() => {
    return (products || []).map((p: any) => ({
      id: p.id,
      internalReference: p.default_code || "",
      name: p.name,
      website: "",
      variantValues: "",
      salesPrice: Number(p.list_price) || 0,
      cost: Number(p.standard_price) || 0,
      onHand: Number(p.qty_available) || 0,
      forecasted: Number(p.virtual_available) || 0,
      unit: "Units",
      category: Array.isArray(p.categ_id) ? p.categ_id[1] : "",
      barcode: p.barcode || "",
      productType: p.type ? (p.type === "service" ? "Service" : "Goods") : "Goods",
      sales: !!p.sale_ok,
      purchase: true,
      trackInventory: (p.tracking && p.tracking !== "none") || false,
      salesTaxes: 0,
      purchaseTaxes: 0,
      invoicingPolicy: "Ordered quantities",
      favorite: false,
      productImage: p.image_1920 || "",
    }))
  }, [products])

  const filteredVariants = variants.filter((variant) => {
    const matchesSearch =
      variant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variant.internalReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variant.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === "all" || variant.category === categoryFilter
    const matchesProductType = productTypeFilter === "all" || variant.productType === productTypeFilter

    let matchesStockStatus = true
    if (stockStatusFilter === "in-stock") {
      matchesStockStatus = variant.onHand >= 100
    } else if (stockStatusFilter === "low-stock") {
      matchesStockStatus = variant.onHand > 0 && variant.onHand < 100
    } else if (stockStatusFilter === "out-of-stock") {
      matchesStockStatus = variant.onHand === 0
    }

    return matchesSearch && matchesCategory && matchesProductType && matchesStockStatus
  })

  // pagination calculations
  const totalPages = Math.ceil(filteredVariants.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedVariants = filteredVariants.slice(startIndex, endIndex)

  // reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, productTypeFilter, stockStatusFilter])

  // Calculate statistics
  const totalVariants = variants.length
  const totalInventoryValue = variants.reduce((sum, v) => sum + v.onHand * v.cost, 0)
  const avgSalesPrice = variants.reduce((sum, v) => sum + v.salesPrice, 0) / (variants.length || 1)
  const lowStockCount = variants.filter((v) => v.onHand < 100).length

  // Chart data - Price distribution by category
  const categoryData = [
    { name: "Electronics", avgPrice: 2116.67, count: 3 },
    { name: "Travel", avgPrice: 4278.33, count: 3 },
    { name: "Apparel", avgPrice: 1148.75, count: 5 },
    { name: "Footwear", avgPrice: 600.0, count: 2 },
    { name: "Accessories", avgPrice: 350.0, count: 1 },
  ]

  // Inventory status pie chart
  const inventoryStatusData = [
    { name: "In Stock", value: 12, color: "#4A7FA7" },
    { name: "Low Stock", value: 2, color: "#B3CFE5" },
    { name: "Out of Stock", value: 1, color: "#0A1931" },
  ]

  // Price range distribution
  const priceRangeData = [
    { range: "0-500", count: 2 },
    { range: "500-1000", count: 3 },
    { range: "1000-2000", count: 4 },
    { range: "2000-3000", count: 3 },
    { range: "3000+", count: 3 },
  ]

  const handleVariantClick = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    setIsNewVariant(false)
    setIsModalOpen(true)
  }

  const handleAddVariant = () => {
    setSelectedVariant({
      id: 0,
      internalReference: "",
      name: "",
      website: "",
      variantValues: "",
      salesPrice: 0,
      cost: 0,
      onHand: 0,
      forecasted: 0,
      unit: "Units",
      category: "",
      barcode: "",
      productType: "Goods",
      sales: true,
      purchase: true,
      trackInventory: true,
      salesTaxes: 14,
      purchaseTaxes: 14,
      invoicingPolicy: "Ordered quantities",
      favorite: false,
      productImage: "",
    })
    setIsNewVariant(true)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedVariant(null)
    setIsNewVariant(false)
  }

  const getStockStatus = (onHand: number) => {
    if (onHand === 0) return { label: "Out of Stock", color: "#FFFFFF", bg: colors.cancel }
    if (onHand < 100) return { label: "Low Stock", color: "#FFFFFF", bg: colors.inProgress }
    return { label: "In Stock", color: "#FFFFFF", bg: colors.success }
  }

  const uniqueCategories = Array.from(new Set(variants.map((v) => v.category)))
  const uniqueProductTypes = Array.from(new Set(variants.map((v) => v.productType)))

  return (
    <div className="min-h-screen p-8" style={{ background: colors.background }}>
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
          .stat-card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .stat-card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
        `}
      </style>

      <div className="mx-auto max-w-[1600px] space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t("Product Variants")}
            </h1>
            <p className="mt-2 text-lg" style={{ color: colors.textSecondary }}>
              {t("Manage product variants, pricing, and inventory levels")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData("products")}
              disabled={!!loading?.products}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: colors.card, color: colors.textPrimary, borderColor: colors.border }}
            >
              <RefreshCcw className={`w-4 h-4 ${loading?.products ? "animate-spin" : ""}`} />
              {loading?.products ? t("Loading...") : t("Refresh")}
            </button>
            <Button
              className="text-white transition-all shadow-lg hover:shadow-xl h-11 px-6"
              style={{ background: colors.action }}
              onClick={handleAddVariant}
            >
              <Package className={`${isRTL ? "ml-2" : "mr-2"} h-5 w-5`} />
              {t("New Product Variant")}
            </Button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          <StatCard
            label={t("Total Variants")}
            value={totalVariants}
            icon={Package}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={0}
          />
          <StatCard
            label={t("Inventory Value")}
            value={`$${totalInventoryValue.toLocaleString()}`}
            icon={DollarSign}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            delay={1}
          />
          <StatCard
            label={t("Avg Sales Price")}
            value={`$${avgSalesPrice.toFixed(2)}`}
            icon={TrendingUp}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            delay={2}
          />
          <StatCard
            label={t("Low Stock Items")}
            value={lowStockCount}
            icon={AlertCircle}
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            delay={3}
          />
        </div>

        <Card className="border-none shadow-lg" style={{ background: colors.card }}>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="relative flex-1 min-w-[280px]">
                <Search
                  className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 h-5 w-5 -translate-y-1/2 transition-colors`}
                  style={{ color: colors.textSecondary }}
                />
                <Input
                  placeholder={t("Search by name, reference, or category...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} h-11 text-base transition-all focus:ring-2`}
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Categories")}</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Product Type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Types")}</SelectItem>
                  {uniqueProductTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Stock Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Stock Levels")}</SelectItem>
                  <SelectItem value="in-stock">{t("In Stock")}</SelectItem>
                  <SelectItem value="low-stock">{t("Low Stock")}</SelectItem>
                  <SelectItem value="out-of-stock">{t("Out of Stock")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          }}
        >
          {paginatedVariants.map((variant, idx) => {
            const stockStatus = getStockStatus(variant.onHand)
            return (
              <div
                key={variant.id}
                className="animate-fade-in-up"
                style={{
                  background: colors.card,
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  border: `1px solid ${colors.border}`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  animationDelay: `${idx * 0.05}s`,
                  cursor: "pointer",
                }}
                onClick={() => handleVariantClick(variant)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.borderColor = colors.action
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none"
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.borderColor = colors.border
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "100px",
                    height: "100px",
                    background: `linear-gradient(135deg, ${colors.action}15, transparent)`,
                    borderRadius: "50%",
                    transform: "translate(30%, -30%)",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                      <div
                        style={{
                          borderRadius: "0.75rem",
                          background: `${colors.action}15`,
                          padding: "0.625rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {variant.productImage ? (
                          <>
                            <img
                              src={`data:image/jpeg;base64,${variant.productImage}`}
                              alt={variant.name}
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement
                                img.style.display = "none"
                                const sib = img.parentElement?.querySelector(".fallback-icon") as HTMLElement | null
                                if (sib) sib.classList.remove("hidden")
                              }}
                              style={{
                                width: "3rem",
                                height: "3rem",
                                borderRadius: "0.75rem",
                                objectFit: "cover",
                                border: `1px solid ${colors.border}`,
                                backgroundColor: colors.background,
                              }}
                            />
                            <div className="fallback-icon hidden">
                              <Package size={18} color={colors.action} strokeWidth={2.5} />
                            </div>
                          </>
                        ) : (
                          <Package size={18} color={colors.action} strokeWidth={2.5} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <Star
                            size={14}
                            color={variant.favorite ? "#F59E0B" : colors.textSecondary}
                            fill={variant.favorite ? "#F59E0B" : "none"}
                          />
                          <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
                            {variant.internalReference}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "1.05rem",
                            fontWeight: "600",
                            color: colors.textPrimary,
                            marginBottom: "0.5rem",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {variant.name}
                        </div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.25rem 0.625rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            background: colors.mutedBg,
                            color: colors.textSecondary,
                          }}
                        >
                          <Tag size={12} />
                          {variant.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}
                  >
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${colors.mutedBg}, ${colors.background})`,
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <DollarSign size={14} color={colors.textSecondary} />
                        <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "500" }}>
                          {t("Sales Price")}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "700",
                          color: colors.textPrimary,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        ${variant.salesPrice.toFixed(2)}
                      </div>
                    </div>
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${colors.mutedBg}, ${colors.background})`,
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <Archive size={14} color={colors.textSecondary} />
                        <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "500" }}>
                          {t("On Hand")}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "700",
                          color: colors.textPrimary,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {variant.onHand.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          background: stockStatus.bg,
                          color: stockStatus.color,
                        }}
                      >
                        <Archive size={12} /> {t(stockStatus.label)}
                      </span>
                      {variant.barcode && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            background: colors.mutedBg,
                            color: colors.textSecondary,
                          }}
                        >
                          <Barcode size={12} /> {variant.barcode}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: "500" }}>
                      {t("Cost:")} ${variant.cost.toFixed(2)} • {t("Margin:")}{" "}
                      {(((variant.salesPrice - variant.cost) / variant.salesPrice) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredVariants.length === 0 && (
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
              <Package size={28} color={colors.action} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
              {t("No variants found")}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
              {t("Try adjusting your filters or search term")}
            </p>
          </div>
        )}

        {/* Variant Modal */}
        {isModalOpen &&
          selectedVariant &&
          (() => {
            const real = (products || []).find((p: any) => p.id === selectedVariant.id) || {}
            const image_1920 = real.image_1920
            const tmpl = Array.isArray(real.product_tmpl_id) ? real.product_tmpl_id : undefined
            return (
              <VariantModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                product={{
                  id: selectedVariant.id,
                  name: real.name ?? selectedVariant.name,
                  default_code: real.default_code ?? selectedVariant.internalReference,
                  qty_available: real.qty_available ?? selectedVariant.onHand,
                  virtual_available: real.virtual_available ?? selectedVariant.forecasted,
                  list_price: real.list_price ?? selectedVariant.salesPrice,
                  standard_price: real.standard_price ?? selectedVariant.cost,
                  image_1920,
                  categ_id: Array.isArray(real.categ_id) ? real.categ_id : [0, selectedVariant.category],
                  weight: real.weight ?? 0,
                  sale_ok: real.sale_ok ?? true,
                  barcode: real.barcode ?? selectedVariant.barcode,
                  tracking: real.tracking,
                  product_tmpl_id: tmpl,
                }}
              />
            )
          })()}
        {/* Charts Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* Inventory Status */}
        </div>

        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 mt-4"
          style={{ background: colors.background, borderColor: colors.border }}
        >
          <div className="relative flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
              Rows per page:
            </span>
            <button
              onClick={() => setIsRowModalOpen(!isRowModalOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 border rounded-md text-sm transition-all min-w-[60px] justify-between font-medium"
              style={{ borderColor: colors.border, background: colors.card, color: colors.textPrimary }}
            >
              {itemsPerPage}
            </button>

            {isRowModalOpen && (
              <div
                className="absolute bottom-full left-24 mb-2 border rounded-lg shadow-lg z-50 min-w-[70px]"
                style={{ background: colors.card, borderColor: colors.border }}
              >
                {[5, 10, 20, 50].map((rows) => (
                  <div
                    key={rows}
                    onClick={() => {
                      setItemsPerPage(rows)
                      setCurrentPage(1)
                      setIsRowModalOpen(false)
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors last:border-b-0 ${
                      itemsPerPage === rows ? "font-semibold" : ""
                    }`}
                    style={{
                      borderColor: colors.border,
                      background: itemsPerPage === rows ? colors.action : colors.card,
                      color: itemsPerPage === rows ? "#FFFFFF" : colors.textPrimary,
                    }}
                  >
                    {rows}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 text-sm font-medium border rounded-md transition-all ${
                currentPage === 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:shadow-sm"
              }`}
              style={{
                background: currentPage === 1 ? colors.background : colors.card,
                color: colors.textPrimary,
                borderColor: colors.border,
              }}
            >
              Previous
            </button>
            <div className="px-3 py-1.5 text-xs font-medium" style={{ color: colors.textSecondary }}>
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 text-sm font-medium border rounded-md transition-all ${
                currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:shadow-sm"
              }`}
              style={{
                background: currentPage === totalPages ? colors.background : colors.card,
                color: colors.textPrimary,
                borderColor: colors.border,
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      {/* The style tag is already added at the beginning of the return statement */}
    </div>
  )
}
