"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, Package, DollarSign, Layers, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductModal } from "./ProductModal"
import { useTheme } from "../../context/theme"
import { StatCard } from "./StatCard"
import { ProductRecordCard } from "./ProductRecordCard"

interface Product {
  id: number
  name: string
  default_code: string
  qty_available: number
  virtual_available: number
  list_price: number
  standard_price: number
  image_1920?: string
  categ_id: [number, string]
  weight: number
  sale_ok: boolean
  barcode: string
}

interface ProductRecordsProps {
  products: Product[]
}

export function ProductRecords({ products }: ProductRecordsProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isRowModalOpen, setIsRowModalOpen] = useState(false)

  const categories = Array.from(new Set(products.map((p) => p.categ_id[1])))

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.default_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || product.categ_id[1] === selectedCategory

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "available" && product.qty_available > 0) ||
      (selectedStatus === "out-of-stock" && product.qty_available === 0) ||
      (selectedStatus === "for-sale" && product.sale_ok)

    const matchesPriceRange =
      selectedPriceRange === "all" ||
      (selectedPriceRange === "0-50" && product.list_price < 50) ||
      (selectedPriceRange === "50-100" && product.list_price >= 50 && product.list_price < 100) ||
      (selectedPriceRange === "100-500" && product.list_price >= 100 && product.list_price < 500) ||
      (selectedPriceRange === "500+" && product.list_price >= 500)

    return matchesSearch && matchesCategory && matchesStatus && matchesPriceRange
  })

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedStatus, selectedPriceRange])

  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + p.list_price * p.qty_available, 0)
  const inStock = products.filter((p) => p.qty_available > 0).length
  const forSale = products.filter((p) => p.sale_ok).length

  const openModal = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

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
              {t("Product Catalog")}
            </h1>
            <p className="mt-2 text-lg" style={{ color: colors.textSecondary }}>
              {t("Manage your product inventory and details")}
            </p>
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
            label={t("Total Products")}
            value={totalProducts}
            icon={Package}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={0}
          />
          <StatCard
            label={t("In Stock")}
            value={inStock}
            icon={Layers}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            delay={1}
          />
          <StatCard
            label={t("For Sale")}
            value={forSale}
            icon={TrendingUp}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            delay={2}
          />
          <StatCard
            label={t("Total Value")}
            value={`$${totalValue.toLocaleString()}`}
            icon={DollarSign}
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            delay={3}
          />
        </div>

        <Card className="border-none shadow-lg" style={{ background: colors.card }}>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="relative flex-1 min-w-[280px]">
                <Search
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors"
                  style={{ color: colors.textSecondary }}
                />
                <Input
                  placeholder={t("Search products...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-11 text-base transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Statuses")}</SelectItem>
                  <SelectItem value="available">{t("Available")}</SelectItem>
                  <SelectItem value="out-of-stock">{t("Out of Stock")}</SelectItem>
                  <SelectItem value="for-sale">{t("For Sale")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                <SelectTrigger
                  className="w-[180px] h-11 transition-all focus:ring-2"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                >
                  <SelectValue placeholder={t("Price Range")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Prices")}</SelectItem>
                  <SelectItem value="0-50">$0 - $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100-500">$100 - $500</SelectItem>
                  <SelectItem value="500+">$500+</SelectItem>
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
          {paginatedProducts.map((product, idx) => (
            <ProductRecordCard key={product.id} product={product} onClick={() => openModal(product)} index={idx} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
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
              {t("No products found")}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
              {t("Try adjusting your filters or search term")}
            </p>
          </div>
        )}

        {filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-2 py-3 mt-4">
            <div className="relative flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                {t("Rows per page:")}
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
                  {[6, 12, 20, 50].map((rows) => (
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
                {t("Previous")}
              </button>
              <div className="px-3 py-1.5 text-xs font-medium" style={{ color: colors.textSecondary }}>
                {t("Page")} {currentPage} {t("of")} {totalPages}
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
                {t("Next")}
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedProduct && <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={closeModal} />}
    </div>
  )
}
