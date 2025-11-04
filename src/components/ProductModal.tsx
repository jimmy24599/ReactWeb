"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Plus, Trash2, Upload, ChevronDown, Check } from "lucide-react"
import { CustomCheckbox } from "./ui/CustomCheckbox"
import { CustomTextarea } from "./ui/CustomTextarea"
import { useSidebar } from "../../context/sidebar"
import { useTheme } from "../../context/theme"
import { API_CONFIG } from "../config/api"

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

interface ProductModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

interface PurchaseRecord {
  id: string
  vendor: string
  quantity: number
  price: number
  currency: string
  delivery: number
}

interface CustomDropdownProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function CustomDropdown({ options, value, onChange, placeholder, className = "" }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { colors } = useTheme()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left rounded-lg focus:outline-none transition-colors"
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          color: value ? colors.textPrimary : colors.textSecondary,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = colors.mutedBg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = colors.card)}
      >
        <span className="block truncate">{value || placeholder}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className={`w-5 h-5`} style={{ color: colors.textSecondary }} />
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute z-20 w-full mt-1 rounded-lg shadow-lg"
          style={{ background: colors.card, border: `1px solid ${colors.border}` }}
        >
          <ul className="py-1 max-h-60 overflow-auto">
            {options.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option)
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left flex items-center justify-between"
                  style={{ color: colors.textPrimary }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.mutedBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span>{option}</span>
                  {value === option && <Check className="w-4 h-4" style={{ color: colors.action }} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { t, i18n } = useTranslation()
  const { isCollapsed } = useSidebar()
  const isRTL = i18n.dir() === "rtl"
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState("general")
  const [attributes, setAttributes] = useState<string[]>([""])
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([
    { id: "1", vendor: "", quantity: 0, price: 0, currency: "USD", delivery: 0 },
  ])
  const [selectedProductType, setSelectedProductType] = useState("Goods")
  const [selectedTax, setSelectedTax] = useState("0%")
  const [selectedPurchaseTax, setSelectedPurchaseTax] = useState("0%")
  const [selectedWarning, setSelectedWarning] = useState("None")
  const [trackInventory, setTrackInventory] = useState(false)
  const [createRepair, setCreateRepair] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [outOfStock, setOutOfStock] = useState(false)
  const [showAvailableQuantity, setShowAvailableQuantity] = useState(false)
  const [quotationDescription, setQuotationDescription] = useState("")
  const [ecommerceDescription, setEcommerceDescription] = useState("")
  const [dirty, setDirty] = useState(false)

  const [form, setForm] = useState({
    name: "",
    default_code: "",
    list_price: 0,
    standard_price: 0,
    barcode: "",
    image_1920: "" as string | undefined,
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen && product) {
      setForm({
        name: product.name || "",
        default_code: product.default_code || "",
        list_price: Number(product.list_price) || 0,
        standard_price: Number(product.standard_price) || 0,
        barcode: product.barcode || "",
        image_1920: product.image_1920,
      })
      setDirty(false)
    }
  }, [isOpen, product])

  const productTypes = ["Goods", "Service", "Combo"]
  const taxOptions = ["0%", "5%", "10%", "15%", "20%", "25%"]
  const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD"]
  const warningMessages = ["None", "Warning", "Block"]

  const gradientButtonClasses =
    "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#5268ED] hover:bg-[#4457cf] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5268ED] focus-visible:ring-offset-2"

  const addAttribute = () => {
    setAttributes([...attributes, ""])
  }

  const updateAttribute = (index: number, value: string) => {
    const newAttributes = [...attributes]
    newAttributes[index] = value
    setAttributes(newAttributes)
  }

  const removeAttribute = (index: number) => {
    if (attributes.length > 1) {
      setAttributes(attributes.filter((_, i) => i !== index))
    }
  }

  const addPurchaseRecord = () => {
    const newRecord: PurchaseRecord = {
      id: Date.now().toString(),
      vendor: "",
      quantity: 0,
      price: 0,
      currency: "USD",
      delivery: 0,
    }
    setPurchaseRecords([...purchaseRecords, newRecord])
  }

  // Generate barcode image URL
  const generateBarcodeUrl = (code: string) => {
    if (!code) return null
    // Using a simple barcode generator service - in production, use a proper barcode library
    return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(code)}&code=Code128&translate-esc=on`
  }

  const updatePurchaseRecord = (id: string, field: keyof PurchaseRecord, value: string | number) => {
    setPurchaseRecords(purchaseRecords.map((record) => (record.id === id ? { ...record, [field]: value } : record)))
  }

  const removePurchaseRecord = (id: string) => {
    if (purchaseRecords.length > 1) {
      setPurchaseRecords(purchaseRecords.filter((record) => record.id !== id))
    }
  }

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const setDirtyTrue = () => !dirty && setDirty(true)

  const getSessionId = () => localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
  const getOdooHeaders = (): Record<string, string> => {
    const rawBase = (localStorage.getItem('odoo_base_url') || '').replace(/\/$/, '')
    const db = localStorage.getItem('odoo_db') || ''
    const headers: Record<string, string> = {}
    if (rawBase) headers['x-odoo-base'] = rawBase
    if (db) headers['x-odoo-db'] = db
    return headers
  }

  const handleSave = async () => {
    try {
      const sessionId = getSessionId()
      if (!sessionId) {
        console.error('No session ID')
        return
      }
      if (!product?.id) {
        console.warn('Product ID missing; create flow not implemented here')
        return
      }
      const values: any = {
        name: form.name,
        default_code: form.default_code,
        list_price: form.list_price,
        standard_price: form.standard_price,
        barcode: form.barcode,
      }
      if (form.image_1920) {
        // Accept both raw base64 or data URL; strip header if present
        const match = /^data:[^;]+;base64,(.*)$/i.exec(form.image_1920)
        values.image_1920 = match ? match[1] : form.image_1920
      }

      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/products-single/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getOdooHeaders() },
        body: JSON.stringify({ sessionId, values })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.message || 'Save failed')
      setDirty(false)
      onClose()
    } catch (err) {
      console.error('Save product failed:', err)
    }
  }

  const onPickImage = () => fileInputRef.current?.click()
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Keep data URL for preview; backend will strip header
      setForm(prev => ({ ...prev, image_1920: result }))
      setDirtyTrue()
    }
    reader.readAsDataURL(file)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        [isRTL ? "marginRight" : "marginLeft"]: isCollapsed ? "5rem" : "16rem",
        background: "rgba(0,0,0,0.4)",
        transition: "margin 0.3s ease",
      }}
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: colors.border, background: colors.background }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg hover:shadow-sm transition-all"
            style={{ color: colors.textPrimary, background: colors.mutedBg }}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.border)}
            onMouseLeave={(e) => (e.currentTarget.style.background = colors.mutedBg)}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("Back")}</span>
          </button>
          <div className="h-6 w-px" style={{ background: colors.border }}></div>
          <h1 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            {product.name}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty}
          className={gradientButtonClasses}
          style={{ opacity: dirty ? 1 : 0.5, cursor: dirty ? "pointer" : "not-allowed" }}
        >
          {t("Save Changes")}
        </button>
      </div>

      <div className="flex h-full" style={{ background: colors.background }}>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Horizontal Tabs */}
          <div className="border-b" style={{ borderColor: colors.border, background: colors.card }}>
            <nav className="flex px-8 gap-1">
              {[
                { id: "general", label: t("General Information") },
                { id: "attributes", label: t("Attributes & Variants") },
                { id: "sales", label: t("Sales") },
                { id: "purchase", label: t("Purchase") },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-3 text-sm font-medium border-b-2 transition-all"
                  style={{
                    borderColor: activeTab === tab.id ? colors.action : "transparent",
                    color: activeTab === tab.id ? colors.textPrimary : colors.textSecondary,
                    background: activeTab === tab.id ? colors.mutedBg : "transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            {/* General Information Tab */}
            {activeTab === "general" && (
              <div className="space-y-6 max-w-4xl">
                <div
                  className="rounded-xl p-5 border"
                  style={{ border: `1px solid ${colors.border}`, background: colors.card }}
                >
                  <h3 className="text-sm font-semibold mb-4" style={{ color: colors.textPrimary }}>
                    {t("Product Details")}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Name")}
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => { setForm({ ...form, name: e.target.value }); setDirtyTrue() }}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, background: colors.background }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Product Type")}
                      </label>
                      <CustomDropdown
                        options={productTypes}
                        value={selectedProductType}
                        onChange={(v) => {
                          setSelectedProductType(v)
                          setDirtyTrue()
                        }}
                        placeholder={t("Select product type")}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Invoicing Policy")}
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{
                          border: `1px solid ${colors.border}`,
                          color: colors.textPrimary,
                          background: colors.background,
                        }}
                        placeholder={t("Enter invoicing policy")}
                        onChange={setDirtyTrue}
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-8">
                        <CustomCheckbox
                          checked={trackInventory}
                          onChange={(v) => {
                            setTrackInventory(v)
                            setDirtyTrue()
                          }}
                          label={t("Track Inventory")}
                        />
                        <CustomCheckbox
                          checked={createRepair}
                          onChange={(v) => {
                            setCreateRepair(v)
                            setDirtyTrue()
                          }}
                          label={t("Create Repair")}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Sales Price")}
                      </label>
                      <input
                        type="number"
                        value={form.list_price}
                        onChange={(e) => { setForm({ ...form, list_price: Number(e.target.value) }); setDirtyTrue() }}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{
                          border: `1px solid ${colors.border}`,
                          color: colors.textPrimary,
                          background: colors.background,
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Sales Tax")}
                      </label>
                      <CustomDropdown
                        options={taxOptions}
                        value={selectedTax}
                        onChange={(v) => {
                          setSelectedTax(v)
                          setDirtyTrue()
                        }}
                        placeholder={t("Select tax rate")}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Cost")}
                      </label>
                      <input
                        type="number"
                        value={form.standard_price}
                        onChange={(e) => { setForm({ ...form, standard_price: Number(e.target.value) }); setDirtyTrue() }}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{
                          border: `1px solid ${colors.border}`,
                          color: colors.textPrimary,
                          background: colors.background,
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Purchase Tax")}
                      </label>
                      <CustomDropdown
                        options={taxOptions}
                        value={selectedPurchaseTax}
                        onChange={(v) => {
                          setSelectedPurchaseTax(v)
                          setDirtyTrue()
                        }}
                        placeholder={t("Select tax rate")}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Category")}
                      </label>
                      <div
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{
                          border: `1px solid ${colors.border}`,
                          background: colors.mutedBg,
                          color: colors.textSecondary,
                        }}
                      >
                        {product.categ_id[1]}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Item ID")}
                      </label>
                      <input
                        type="text"
                        value={String(product.id)}
                        readOnly
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{
                          border: `1px solid ${colors.border}`,
                          color: colors.textPrimary,
                          background: colors.background,
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Reference")}
                      </label>
                      <input
                        type="text"
                        value={form.default_code}
                        onChange={(e) => { setForm({ ...form, default_code: e.target.value }); setDirtyTrue() }}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{
                          border: `1px solid ${colors.border}`,
                          color: colors.textPrimary,
                          background: colors.background,
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        {t("Barcode")}
                      </label>
                      <input
                        type="text"
                        value={form.barcode}
                        onChange={(e) => { setForm({ ...form, barcode: e.target.value }); setDirtyTrue() }}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{
                          border: `1px solid ${colors.border}`,
                          color: colors.textPrimary,
                          background: colors.background,
                        }}
                        placeholder={t("Enter barcode")}
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attributes & Variants Tab */}
            {activeTab === "attributes" && (
              <div className="space-y-6 max-w-4xl">
                <div
                  className="rounded-xl p-5 border"
                  style={{ border: `1px solid ${colors.border}`, background: colors.card }}
                >
                  <div className="flex items-center justify-end mb-6">
                    <button
                      onClick={() => {
                        addAttribute()
                        setDirtyTrue()
                      }}
                      className={gradientButtonClasses}
                    >
                      <Plus className="w-4 h-4" />
                      {t("Add Attribute")}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {attributes.map((attribute, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-lg transition-colors"
                        style={{ border: `1px solid ${colors.border}`, background: colors.card }}
                      >
                        <input
                          type="text"
                          value={attribute}
                          onChange={(e) => {
                            updateAttribute(index, e.target.value)
                            setDirtyTrue()
                          }}
                          placeholder={t("Enter attribute name")}
                          className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                          style={{
                            border: `1px solid ${colors.border}`,
                            color: colors.textPrimary,
                            background: colors.background,
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                        />
                        {attributes.length > 1 && (
                          <button
                            onClick={() => {
                              removeAttribute(index)
                              setDirtyTrue()
                            }}
                            className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sales Tab */}
            {activeTab === "sales" && (
              <div className="space-y-6 max-w-4xl">
                <div
                  className="rounded-xl p-5 border"
                  style={{ border: `1px solid ${colors.border}`, background: colors.card }}
                >
                  {/* Upsell & Cross-Sell */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold mb-4" style={{ color: colors.textPrimary }}>
                      {t("Upsell & Cross-Sell")}
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          {t("Optional Products")}
                        </label>
                        <CustomDropdown
                          options={[t("Select products")]}
                          value=""
                          onChange={setDirtyTrue}
                          placeholder={t("Select products")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          {t("Accessory Products")}
                        </label>
                        <CustomDropdown
                          options={[t("Select products")]}
                          value=""
                          onChange={setDirtyTrue}
                          placeholder={t("Select products")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          {t("Alternative Products")}
                        </label>
                        <CustomDropdown
                          options={[t("Select products")]}
                          value=""
                          onChange={setDirtyTrue}
                          placeholder={t("Select products")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ecommerce Shop */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold mb-4" style={{ color: colors.textPrimary }}>
                      {t("Ecommerce Shop")}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          {t("Tags")}
                        </label>
                        <CustomDropdown
                          options={[t("Select tags")]}
                          value=""
                          onChange={setDirtyTrue}
                          placeholder={t("Select tags")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          {t("Website")}
                        </label>
                        <CustomDropdown
                          options={[t("Select website")]}
                          value=""
                          onChange={setDirtyTrue}
                          placeholder={t("Select website")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          {t("Categories")}
                        </label>
                        <CustomDropdown
                          options={[t("Select categories")]}
                          value=""
                          onChange={setDirtyTrue}
                          placeholder={t("Select categories")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          {t("Out of Stock Message")}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                          style={{
                            border: `1px solid ${colors.border}`,
                            color: colors.textPrimary,
                            background: colors.background,
                          }}
                          placeholder={t("Enter out of stock message")}
                          onChange={setDirtyTrue}
                          onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <CustomCheckbox
                        checked={isPublished}
                        onChange={(v) => {
                          setIsPublished(v)
                          setDirtyTrue()
                        }}
                        label={t("Is Published")}
                      />
                      <CustomCheckbox
                        checked={outOfStock}
                        onChange={(v) => {
                          setOutOfStock(v)
                          setDirtyTrue()
                        }}
                        label={t("Out of Stock")}
                      />
                      <CustomCheckbox
                        checked={showAvailableQuantity}
                        onChange={(v) => {
                          setShowAvailableQuantity(v)
                          setDirtyTrue()
                        }}
                        label={t("Show Available Quantity")}
                      />
                    </div>
                  </div>

                  {/* Ecommerce Media */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold mb-4" style={{ color: colors.textPrimary }}>
                      {t("Ecommerce Media")}
                    </h4>
                    <div
                      className="w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer overflow-hidden"
                      style={{ borderColor: colors.border, background: colors.card }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.action)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
                      onClick={onPickImage}
                    >
                      {form.image_1920 ? (
                        <img src={form.image_1920.startsWith('data:') ? form.image_1920 : `data:image/png;base64,${form.image_1920}`}
                          alt={product.name}
                          className="object-contain w-full h-full" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2" style={{ color: colors.textSecondary, opacity: 0.6 }} />
                          <span className="text-xs font-medium" style={{ color: colors.textSecondary, opacity: 0.8 }}>
                            {t("Add Media")}
                          </span>
                        </>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <CustomTextarea
                      value={quotationDescription}
                      onChange={(v) => {
                        setQuotationDescription(v)
                        setDirtyTrue()
                      }}
                      label={t("Quotation Description")}
                      placeholder={t("Enter quotation description")}
                      minRows={3}
                      maxRows={6}
                    />
                    <CustomTextarea
                      value={ecommerceDescription}
                      onChange={(v) => {
                        setEcommerceDescription(v)
                        setDirtyTrue()
                      }}
                      label={t("Ecommerce Description")}
                      placeholder={t("Enter ecommerce description")}
                      minRows={3}
                      maxRows={6}
                    />
                  </div>

                  {/* Warning Message */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                      {t("Warning Message")}
                    </label>
                    <CustomDropdown
                      options={warningMessages}
                      value={selectedWarning}
                      onChange={(v) => {
                        setSelectedWarning(v)
                        setDirtyTrue()
                      }}
                      placeholder={t("Select warning message")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Tab */}
            {activeTab === "purchase" && (
              <div className="space-y-6 max-w-5xl">
                <div
                  className="rounded-xl p-5 border"
                  style={{ border: `1px solid ${colors.border}`, background: colors.card }}
                >
                  <div className="flex items-center justify-end mb-6">
                    <button
                      onClick={() => {
                        addPurchaseRecord()
                        setDirtyTrue()
                      }}
                      className={gradientButtonClasses}
                    >
                      <Plus className="w-4 h-4" />
                      {t("Add Record")}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {purchaseRecords.map((record) => (
                      <div
                        key={record.id}
                        className="grid grid-cols-6 gap-4 p-4 rounded-lg transition-colors"
                        style={{ border: `1px solid ${colors.border}` }}
                      >
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                            {t("Vendor")}
                          </label>
                          <input
                            type="text"
                            value={record.vendor}
                            onChange={(e) => {
                              updatePurchaseRecord(record.id, "vendor", e.target.value)
                              setDirtyTrue()
                            }}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                            style={{
                              border: `1px solid ${colors.border}`,
                              color: colors.textPrimary,
                              background: colors.background,
                            }}
                            placeholder={t("Enter vendor")}
                            onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                            {t("Quantity")}
                          </label>
                          <input
                            type="number"
                            value={record.quantity}
                            onChange={(e) => {
                              updatePurchaseRecord(record.id, "quantity", Number(e.target.value))
                              setDirtyTrue()
                            }}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                            style={{
                              border: `1px solid ${colors.border}`,
                              color: colors.textPrimary,
                              background: colors.background,
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                            {t("Price")}
                          </label>
                          <input
                            type="number"
                            value={record.price}
                            onChange={(e) => {
                              updatePurchaseRecord(record.id, "price", Number(e.target.value))
                              setDirtyTrue()
                            }}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                            style={{
                              border: `1px solid ${colors.border}`,
                              color: colors.textPrimary,
                              background: colors.background,
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                            {t("Currency")}
                          </label>
                          <CustomDropdown
                            options={currencyOptions}
                            value={record.currency}
                            onChange={(value) => {
                              updatePurchaseRecord(record.id, "currency", value)
                              setDirtyTrue()
                            }}
                            placeholder={t("Select currency")}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                            {t("Delivery")}
                          </label>
                          <input
                            type="number"
                            value={record.delivery}
                            onChange={(e) => {
                              updatePurchaseRecord(record.id, "delivery", Number(e.target.value))
                              setDirtyTrue()
                            }}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
                            style={{
                              border: `1px solid ${colors.border}`,
                              color: colors.textPrimary,
                              background: colors.background,
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = colors.action)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                          />
                        </div>
                        <div className="flex items-end">
                          {purchaseRecords.length > 1 && (
                            <button
                              onClick={() => {
                                removePurchaseRecord(record.id)
                                setDirtyTrue()
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 border-l overflow-y-auto" style={{ background: colors.card, borderColor: colors.border }}>
          <div className="p-6 sticky top-0">
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.textSecondary }}>
              {t("Product Preview")}
            </h3>

            {/* Product Image */}
            <div
              className="w-full aspect-square rounded-xl mb-4 flex items-center justify-center overflow-hidden border"
              style={{ background: colors.background, borderColor: colors.border }}
            >
              {product.image_1920 ? (
                <img
                  src={`data:image/webp;base64,${product.image_1920}`}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6">
                  <Upload className="w-12 h-12 mx-auto mb-2" style={{ color: colors.textSecondary, opacity: 0.3 }} />
                  <p className="text-xs" style={{ color: colors.textSecondary, opacity: 0.6 }}>
                    {t("No image")}
                  </p>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                  {t("Product Name")}
                </p>
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  {product.name}
                </p>
              </div>

              {product.barcode && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {t("Barcode")}
                  </p>
                  <div
                    className="rounded-lg p-3 flex items-center justify-center"
                    style={{ background: colors.background }}
                  >
                    {generateBarcodeUrl(product.barcode) && (
                      <img
                        src={generateBarcodeUrl(product.barcode)! || "/placeholder.svg"}
                        alt={`Barcode: ${product.barcode}`}
                        className="h-12 object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-medium mb-1" style={{ color: colors.textSecondary }}>
                      {t("Available")}
                    </p>
                    <p className="font-semibold" style={{ color: colors.textPrimary }}>
                      {product.qty_available}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1" style={{ color: colors.textSecondary }}>
                      {t("Forecasted")}
                    </p>
                    <p className="font-semibold" style={{ color: colors.textPrimary }}>
                      {product.virtual_available}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>{t("Sales Price")}</span>
                    <span className="font-semibold" style={{ color: colors.textPrimary }}>
                      ${product.list_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>{t("Cost")}</span>
                    <span className="font-semibold" style={{ color: colors.textPrimary }}>
                      ${product.standard_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t" style={{ borderColor: colors.border }}>
                    <span className="font-medium" style={{ color: colors.textSecondary }}>
                      {t("Margin")}
                    </span>
                    <span className="font-bold" style={{ color: colors.action }}>
                      ${(product.list_price - product.standard_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
