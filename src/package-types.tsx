"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Package, Truck, Scale, X, Trash2 } from "lucide-react"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { StatCard } from "./components/StatCard"
import { ProductPackageCard } from "./components/ProductPackageCard"

interface StorageCapacity {
  id: string
  category: string
  quantity: number
}

interface PackageType {
  [key: string]: any
}

export default function PackageTypesPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null)
  const [formData, setFormData] = useState<Partial<PackageType>>({
    name: "",
    height: 0,
    width: 0,
    length: 0,
    weight: 0,
    maxWeight: 0,
    barcode: "",
    carrier: "No carrier integration",
    carrierCode: "",
    storageCapacities: [],
  })
  const { colors } = useTheme()
  const { packageTypes } = useData()

  const filteredPackages = useMemo(() => {
    const list = Array.isArray(packageTypes) ? packageTypes : []
    const q = searchQuery.toLowerCase()
    return list.filter((pkg: any) => {
      const name = String(pkg?.display_name || pkg?.name || "").toLowerCase()
      const barcode = String(pkg?.barcode || pkg?.x_barcode || "").toLowerCase()
      const carrier = String(pkg?.carrier || pkg?.delivery_carrier_id || "").toLowerCase()
      return name.includes(q) || barcode.includes(q) || carrier.includes(q)
    })
  }, [packageTypes, searchQuery])

  const totalPackages = Array.isArray(packageTypes) ? packageTypes.length : 0
  const carriersIntegrated = useMemo(() => {
    const set = new Set<string>()
    ;(Array.isArray(packageTypes) ? packageTypes : []).forEach((p: any) => {
      const c = p?.carrier || p?.delivery_carrier_id || ""
      if (c) set.add(typeof c === "string" ? c : Array.isArray(c) ? String(c[1] || c[0]) : String(c))
    })
    return set.size
  }, [packageTypes])
  const avgWeight = useMemo(() => {
    const list = Array.isArray(packageTypes) ? packageTypes : []
    const weights = list.map((p: any) => Number(p?.max_weight ?? p?.maxWeight ?? 0)).filter((n) => Number.isFinite(n))
    if (!weights.length) return "0.0"
    const sum = weights.reduce((a, b) => a + b, 0)
    return (sum / weights.length).toFixed(1)
  }, [packageTypes])

  const handleOpenModal = (pkg?: PackageType) => {
    if (pkg) {
      setSelectedPackage(pkg)
      setFormData(pkg)
    } else {
      setSelectedPackage(null)
      setFormData({
        name: "",
        height: 0,
        width: 0,
        length: 0,
        weight: 0,
        maxWeight: 0,
        barcode: "",
        carrier: "No carrier integration",
        carrierCode: "",
        storageCapacities: [],
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPackage(null)
  }

  const handleSave = () => {
    console.log("Saving package type:", formData)
    handleCloseModal()
  }

  const addStorageCapacity = () => {
    setFormData({
      ...formData,
      storageCapacities: [
        ...(formData.storageCapacities || []),
        { id: Date.now().toString(), category: "", quantity: 0 },
      ],
    })
  }

  const removeStorageCapacity = (id: string) => {
    setFormData({
      ...formData,
      storageCapacities: (formData.storageCapacities || []).filter((sc) => sc.id !== id),
    })
  }

  const updateStorageCapacity = (id: string, field: "category" | "quantity", value: string | number) => {
    setFormData({
      ...formData,
      storageCapacities: (formData.storageCapacities || []).map((sc) =>
        sc.id === id ? { ...sc, [field]: value } : sc,
      ),
    })
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.background, padding: "32px" }}>
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

      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: colors.textPrimary, marginBottom: "8px" }}>
            {t("Package Types")}
          </h1>
          <p style={{ fontSize: "16px", color: colors.textSecondary }}>
            {t("Manage packaging options and carrier integrations")}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{
            background: colors.action,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "12px",
            padding: "14px 28px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)"
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(10, 25, 49, 0.2)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(10, 25, 49, 0.15)"
          }}
        >
          <Plus size={20} />
          {t("Add Package Type")}
        </button>
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
          label={t("Total Package Types")}
          value={totalPackages}
          icon={Package}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          delay={0}
        />
        <StatCard
          label={t("Carriers Integrated")}
          value={carriersIntegrated}
          icon={Truck}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          delay={1}
        />
        <StatCard
          label={t("Average Weight")}
          value={`${avgWeight} kg`}
          icon={Scale}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          delay={2}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: "1.25rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        }}
      >
        {filteredPackages.map((pkg: any, idx) => (
          <ProductPackageCard key={pkg.id} pkg={pkg} onClick={() => handleOpenModal(pkg)} index={idx} />
        ))}
      </div>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={handleCloseModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.card,
              borderRadius: "20px",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                padding: "28px 32px",
                borderBottom: `2px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                background: colors.card,
                zIndex: 1,
                borderRadius: "20px 20px 0 0",
              }}
            >
              <div>
                <h2 style={{ fontSize: "26px", fontWeight: "700", color: colors.textPrimary, marginBottom: "4px" }}>
                  {selectedPackage ? "Edit Package Type" : "Add Package Type"}
                </h2>
                <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                  Configure package dimensions and carrier integration
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: colors.mutedBg,
                  border: "none",
                  borderRadius: "10px",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1"
                }}
              >
                <X size={20} color={colors.textPrimary} />
              </button>
            </div>

            <div style={{ padding: "32px" }}>
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginBottom: "8px",
                  }}
                >
                  Package Type Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Small Box"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "15px",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "10px",
                    outline: "none",
                    transition: "all 0.2s ease",
                    background: colors.card,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginBottom: "8px",
                  }}
                >
                  Size (mm)
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr auto 1fr",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: "4px" }}>Height</div>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: Number.parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: "15px",
                        border: `2px solid ${colors.border}`,
                        borderRadius: "10px",
                        outline: "none",
                        transition: "all 0.2s ease",
                        background: colors.card,
                        color: colors.textPrimary,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "20px", color: colors.border, marginTop: "20px" }}>×</span>
                  <div>
                    <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: "4px" }}>Width</div>
                    <input
                      type="number"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: Number.parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: "15px",
                        border: `2px solid ${colors.border}`,
                        borderRadius: "10px",
                        outline: "none",
                        transition: "all 0.2s ease",
                        background: colors.card,
                        color: colors.textPrimary,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "20px", color: colors.border, marginTop: "20px" }}>×</span>
                  <div>
                    <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: "4px" }}>Length</div>
                    <input
                      type="number"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: Number.parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: "15px",
                        border: `2px solid ${colors.border}`,
                        borderRadius: "10px",
                        outline: "none",
                        transition: "all 0.2s ease",
                        background: colors.card,
                        color: colors.textPrimary,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: "8px",
                    }}
                  >
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "15px",
                      border: `2px solid ${colors.border}`,
                      borderRadius: "10px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      background: colors.card,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: "8px",
                    }}
                  >
                    Max Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.maxWeight}
                    onChange={(e) => setFormData({ ...formData, maxWeight: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "15px",
                      border: `2px solid ${colors.border}`,
                      borderRadius: "10px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      background: colors.card,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginBottom: "8px",
                  }}
                >
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="PKG-XXX-XXX"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "15px",
                    border: `2px solid ${colors.border}`,
                    borderRadius: "10px",
                    outline: "none",
                    transition: "all 0.2s ease",
                    background: colors.card,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: "8px",
                    }}
                  >
                    Carrier
                  </label>
                  <select
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "15px",
                      border: `2px solid ${colors.border}`,
                      borderRadius: "10px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      background: colors.card,
                      cursor: "pointer",
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="No carrier integration">No carrier integration</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="USPS">USPS</option>
                    <option value="Freight">Freight</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: "8px",
                    }}
                  >
                    Carrier Code
                  </label>
                  <input
                    type="text"
                    value={formData.carrierCode}
                    onChange={(e) => setFormData({ ...formData, carrierCode: e.target.value })}
                    placeholder="e.g. UPS-SML"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "15px",
                      border: `2px solid ${colors.border}`,
                      borderRadius: "10px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      background: colors.card,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginBottom: "12px",
                  }}
                >
                  Storage Category Capacity
                </label>
                <div
                  style={{
                    border: `2px solid ${colors.border}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 150px 50px",
                      gap: "16px",
                      padding: "12px 16px",
                      background: colors.mutedBg,
                      borderBottom: `2px solid ${colors.border}`,
                      fontSize: "13px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    <div>Storage Category</div>
                    <div>Quantity</div>
                    <div></div>
                  </div>

                  {(formData.storageCapacities || []).map((sc) => (
                    <div
                      key={sc.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 150px 50px",
                        gap: "16px",
                        padding: "12px 16px",
                        borderBottom: `1px solid ${colors.border}`,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        value={sc.category}
                        onChange={(e) => updateStorageCapacity(sc.id, "category", e.target.value)}
                        placeholder="e.g. Shelf A"
                        style={{
                          padding: "8px 12px",
                          fontSize: "14px",
                          border: `1px solid ${colors.border}`,
                          borderRadius: "8px",
                          outline: "none",
                          transition: "all 0.2s ease",
                          background: colors.card,
                          color: colors.textPrimary,
                        }}
                      />
                      <input
                        type="number"
                        value={sc.quantity}
                        onChange={(e) => updateStorageCapacity(sc.id, "quantity", Number.parseInt(e.target.value) || 0)}
                        placeholder="0"
                        style={{
                          padding: "8px 12px",
                          fontSize: "14px",
                          border: `1px solid ${colors.border}`,
                          borderRadius: "8px",
                          outline: "none",
                          transition: "all 0.2s ease",
                          background: colors.card,
                          color: colors.textPrimary,
                        }}
                      />
                      <button
                        onClick={() => removeStorageCapacity(sc.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "6px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FEE2E2"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent"
                        }}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addStorageCapacity}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: colors.card,
                      border: "none",
                      color: colors.action,
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.mutedBg
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.card
                    }}
                  >
                    + Add a line
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "20px 32px",
                borderTop: `2px solid ${colors.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                position: "sticky",
                bottom: 0,
                background: colors.card,
                borderRadius: "0 0 20px 20px",
              }}
            >
              <button
                onClick={handleCloseModal}
                style={{
                  padding: "12px 24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  border: `2px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.textPrimary,
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.mutedBg
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.card
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: "12px 24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  border: "none",
                  background: colors.action,
                  color: "white",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(10, 25, 49, 0.2)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                {selectedPackage ? "Save Changes" : "Create Package Type"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
