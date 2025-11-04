"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Package, DollarSign, BarChart3, RefreshCcw, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "./components/StatCard"
import { PhysicalInventoryCard } from "./components/PhysicalInventoryCard"
import { useAuth } from "../context/auth.tsx"
import { useTheme } from "../context/theme"
import { SyncLoader } from "react-spinners"
import { VariantModal } from "./components/VariantModal"
import { useData } from "../context/data.tsx"

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

interface PhysicalInventoryItem {
  id: number
  location: string
  product: string
  lotSerialNumber: string
  package: string
  owner: string
  onHandQuantity: number
  uom: string
  countedQuantity: number
  difference: number
  scheduledDate: string
  user: string
  unitPrice: number
  productData: Product
  productImage?: string
}

export default function PhysicalInventory() {
  const { t } = useTranslation()
  const { sessionId, isAuthenticated } = useAuth()
  const { colors } = useTheme()
  const {
    quants,
    products,
    locations: ctxLocations,
    lots: ctxLots,
    uom: ctxUom,
    partners,
    loading,
    fetchData,
  } = useData()
  const [inventoryItems, setInventoryItems] = useState<PhysicalInventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isRowModalOpen, setIsRowModalOpen] = useState(false)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [countedById, setCountedById] = useState<Record<number, number>>({})
  const isLoading =
    loading.quants || loading.products || loading.locations || loading.lots || loading.uom || loading.partners

  // Helpers to normalize Odoo many2one values that might be an array [id, name] or a number
  const getId = (val: any): number | undefined =>
    Array.isArray(val) ? val[0] : typeof val === "number" ? val : undefined
  const getTupleName = (val: any): string | undefined => (Array.isArray(val) ? val[1] : undefined)

  // Map IDs to names from context datasets
  const nameById = <T,>(arr: T[], id: number | undefined, nameField = "name"): string => {
    if (!id) return ""
    const rec: any = arr.find(
      (r: any) => (typeof r.id === "number" ? r.id : Array.isArray(r.id) ? r.id[0] : r.id) === id,
    )
    return rec ? (rec[nameField] ?? rec.name ?? "") : ""
  }

  const productById = (id: number | undefined): Product | null => {
    if (!id) return null
    const p: any = products.find((r: any) => r.id === id || (Array.isArray(r.id) && r.id[0] === id))
    return p || null
  }

  useEffect(() => {
    if (sessionId && isAuthenticated) {
      // Ensure required datasets are loaded
      fetchData("quants")
      fetchData("products")
      fetchData("locations")
      fetchData("lots")
      fetchData("uom")
      fetchData("partners")
    }
  }, [sessionId, isAuthenticated])

  // Build inventory rows from quants when data changes
  useEffect(() => {
    const items: PhysicalInventoryItem[] = (quants || []).map((q: any) => {
      const productId = getId(q.product_id)
      const locationId = getId(q.location_id)
      const lotId = getId(q.lot_id)
      const packageId = getId(q.package_id)
      const ownerId = getId(q.owner_id)
      const uomId = getId(q.uom_id ?? q.product_uom_id)

      const productRec = productById(productId)
      const productName = getTupleName(q.product_id) || productRec?.name || ""
      const locationName = getTupleName(q.location_id) || nameById(ctxLocations, locationId, "complete_name") || ""
      const lotName = getTupleName(q.lot_id) || nameById(ctxLots, lotId, "name") || ""
      const ownerName = getTupleName(q.owner_id) || nameById(partners, ownerId, "name") || ""
      const uomName = getTupleName(q.uom_id ?? q.product_uom_id) || nameById(ctxUom, uomId, "name") || ""

      const quantity = Number(q.quantity ?? q.available_quantity ?? 0)
      const counted = countedById[q.id] ?? quantity

      return {
        id: q.id,
        location: locationName,
        product: productName,
        lotSerialNumber: lotName,
        package: packageId ? String(packageId) : "",
        owner: ownerName,
        onHandQuantity: quantity,
        uom: uomName,
        countedQuantity: counted,
        difference: counted - quantity,
        scheduledDate: new Date().toISOString().split("T")[0],
        user: "",
        unitPrice: productRec?.list_price ?? productRec?.standard_price ?? 0,
        productData: productRec as any,
        productImage: productRec?.image_1920,
      }
    })

    setInventoryItems(items)
  }, [quants, products, ctxLocations, ctxLots, ctxUom, partners, countedById])

  const locations = ["all", ...Array.from(new Set(inventoryItems.map((item) => item.location)))]
  const owners = ["all", ...Array.from(new Set(inventoryItems.map((item) => item.owner)))]

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lotSerialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = locationFilter === "all" || item.location === locationFilter
    const matchesOwner = ownerFilter === "all" || item.owner === ownerFilter

    let matchesStatus = true
    if (statusFilter === "surplus") matchesStatus = item.difference > 0
    else if (statusFilter === "shortage") matchesStatus = item.difference < 0
    else if (statusFilter === "exact") matchesStatus = item.difference === 0

    return matchesSearch && matchesLocation && matchesOwner && matchesStatus
  })

  const totalItems = filteredItems.reduce((sum, item) => sum + item.onHandQuantity, 0)
  const totalProducts = filteredItems.length
  const totalValue = filteredItems.reduce((sum, item) => sum + item.onHandQuantity * item.unitPrice, 0)

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleLocationChange = (location: string) => {
    setLocationFilter(location)
    setCurrentPage(1)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleOwnerChange = (owner: string) => {
    setOwnerFilter(owner)
    setCurrentPage(1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleRowsPerPageChange = (rows: number) => {
    setItemsPerPage(rows)
    setCurrentPage(1)
    setIsRowModalOpen(false)
  }

  const handleRefresh = async () => {
    if (sessionId) {
      await Promise.all([
        fetchData("quants"),
        fetchData("products"),
        fetchData("locations"),
        fetchData("lots"),
        fetchData("uom"),
        fetchData("partners"),
      ])
    }
  }

  const getDifferenceStyle = (difference: number) => {
    if (difference > 0) return { bg: colors.success, border: colors.success, text: "#0A0A0A" }
    if (difference < 0) return { bg: colors.inProgress, border: colors.inProgress, text: "#0A0A0A" }
    return { bg: colors.card, border: colors.border, text: colors.textSecondary }
  }

  const getDifferenceText = (difference: number) => {
    if (difference > 0) return `+${difference}`
    return difference.toString()
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
        `}
      </style>

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
                {t("Physical Inventory")}
              </h1>
              <p className="mt-2 text-lg" style={{ color: colors.textSecondary }}>
                {t("Track and manage your inventory counts")}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              style={{ background: colors.action }}
            >
              <RefreshCcw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? t("Loading...") : t("Refresh")}
            </button>
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
            label={t("Total Items")}
            value={totalItems.toLocaleString()}
            icon={Package}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={0}
          />
          <StatCard
            label={t("Total Products")}
            value={totalProducts}
            icon={BarChart3}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            delay={1}
          />
          <StatCard
            label={t("Total Value")}
            value={`LE ${totalValue.toLocaleString("en-LE", { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            delay={2}
          />
        </div>

        <Card className="border-none shadow-lg mb-6" style={{ background: colors.card }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[280px]">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: colors.textSecondary }}
                />
                <Input
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t("Search products, lot numbers...")}
                  className="pl-10 h-11 text-base border transition-all focus:ring-2"
                  style={{ borderColor: colors.border, background: colors.background, color: colors.textPrimary }}
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all hover:shadow-sm"
                style={{
                  background: showFilters ? colors.action : colors.background,
                  color: showFilters ? "#FFFFFF" : colors.textPrimary,
                  borderColor: colors.border,
                }}
              >
                <Filter className="w-4 h-4" />
                {t("Filters")}
                {(statusFilter !== "all" || locationFilter !== "all" || ownerFilter !== "all") && (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
                    style={{ background: colors.success, color: "#0A0A0A" }}
                  >
                    {[statusFilter, locationFilter, ownerFilter].filter((f) => f !== "all").length}
                  </span>
                )}
              </button>
            </div>

            {showFilters && (
              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t"
                style={{ borderColor: colors.border }}
              >
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                    {t("Status")}
                  </label>
                  <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger
                      className="h-9 text-sm border"
                      style={{ borderColor: colors.border, background: colors.background, color: colors.textPrimary }}
                    >
                      <SelectValue placeholder={t("Status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All Statuses")}</SelectItem>
                      <SelectItem value="surplus">{t("Surplus")}</SelectItem>
                      <SelectItem value="shortage">{t("Shortage")}</SelectItem>
                      <SelectItem value="exact">{t("Exact Match")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                    {t("Location")}
                  </label>
                  <Select value={locationFilter} onValueChange={handleLocationChange}>
                    <SelectTrigger
                      className="h-9 text-sm border"
                      style={{ borderColor: colors.border, background: colors.background, color: colors.textPrimary }}
                    >
                      <SelectValue placeholder={t("Location")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All Locations")}</SelectItem>
                      {locations
                        .filter((l) => l !== "all")
                        .map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                    {t("Owner")}
                  </label>
                  <Select value={ownerFilter} onValueChange={handleOwnerChange}>
                    <SelectTrigger
                      className="h-9 text-sm border"
                      style={{ borderColor: colors.border, background: colors.background, color: colors.textPrimary }}
                    >
                      <SelectValue placeholder={t("Owner")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All Owners")}</SelectItem>
                      {owners
                        .filter((o) => o !== "all")
                        .map((owner) => (
                          <SelectItem key={owner} value={owner}>
                            {owner}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {loading.quants ? (
          <div className="flex flex-col items-center justify-center py-16">
            <SyncLoader color={colors.textSecondary} size={8} />
            <p className="mt-4 text-sm" style={{ color: colors.textSecondary }}>
              {t("Loading inventory data...")}
            </p>
          </div>
        ) : paginatedItems.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: "1.25rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            }}
          >
            {paginatedItems.map((item, idx) => (
              <PhysicalInventoryCard
                key={item.id}
                item={item}
                onClick={() => {
                  setSelectedProduct(item.productData)
                  setIsVariantModalOpen(true)
                }}
                onCountChange={(id, value) => {
                  setCountedById((prev) => ({ ...prev, [id]: value }))
                }}
                index={idx}
              />
            ))}
          </div>
        ) : (
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
              {t("No inventory data found")}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
              {t("No products available for inventory tracking.")}
            </p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-all mt-4"
              style={{ background: colors.action }}
            >
              <RefreshCcw className="w-4 h-4" />
              {t("Refresh Data")}
            </button>
          </div>
        )}

        {filteredItems.length > 0 && (
          <div
            className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 p-4 rounded-lg"
            style={{ background: colors.card, border: `1px solid ${colors.border}` }}
          >
            <div className="relative flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                {t("Rows per page:")}
              </span>
              <button
                onClick={() => setIsRowModalOpen(!isRowModalOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 border rounded-md text-sm transition-all min-w-[60px] justify-between font-medium"
                style={{ borderColor: colors.border, background: colors.background, color: colors.textPrimary }}
              >
                {itemsPerPage}
                <span className={`transition-transform ${isRowModalOpen ? "rotate-180" : ""}`}>▼</span>
              </button>

              {isRowModalOpen && (
                <div
                  className="absolute bottom-full left-24 mb-2 border rounded-lg shadow-lg z-50 min-w-[70px]"
                  style={{ background: colors.card, borderColor: colors.border }}
                >
                  {[5, 10, 20, 50].map((rows) => (
                    <div
                      key={rows}
                      onClick={() => handleRowsPerPageChange(rows)}
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
                onClick={handlePreviousPage}
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
                onClick={handleNextPage}
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

      {/* Variant Modal */}
      {isVariantModalOpen && selectedProduct && (
        <VariantModal
          isOpen={isVariantModalOpen}
          onClose={() => {
            setIsVariantModalOpen(false)
            setSelectedProduct(null)
          }}
          product={selectedProduct}
        />
      )}
    </div>
  )
}
