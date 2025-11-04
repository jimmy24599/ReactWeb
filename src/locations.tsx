"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { MapPin, Box, DollarSign, Search, Warehouse, TrendingUp, Package, Pencil } from "lucide-react"
import Toast from "./components/Toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"
import { API_CONFIG } from "./config/api"

// Locations data will be derived from DataContext (stock.location + quants)

// Light mode map style (default Google look)
const googleLightMapStyle: any[] | undefined = undefined

// Accent and backgrounds should come from ThemeContext tokens

// Google Maps typings
declare global {
  interface Window {
    google?: any
  }
}

// Dark mode map style
const googleDarkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9080" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e7c59" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry.stroke", stylers: [{ color: "#27412b" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
]

// Lazy loader for Google Maps JS API
let googleMapsLoaderPromise: Promise<void> | null = null
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google && window.google.maps) return Promise.resolve()
  if (googleMapsLoaderPromise) return googleMapsLoaderPromise
  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-maps-loader]")
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve())
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load")))
      return
    }
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.setAttribute("data-google-maps-loader", "true")
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Google Maps failed to load"))
    document.body.appendChild(script)
  })
  return googleMapsLoaderPromise
}

function GoogleMapsContainer({
  apiKey,
  locations,
  mode,
  accentColor,
}: { apiKey?: string; locations: any[]; mode: "light" | "dark"; accentColor: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const { t } = useTranslation()

  useEffect(() => {
    if (!apiKey) return
    let isCancelled = false
    loadGoogleMaps(apiKey)
      .then(() => {
        if (isCancelled || !mapRef.current) return
        const center = { lat: 24.2, lng: 54.5 }
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 7,
          center,
          styles: mode === "dark" ? googleDarkMapStyle : googleLightMapStyle,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        mapInstanceRef.current = map

        markersRef.current.forEach((m) => m.setMap(null))
        markersRef.current = []
        const withCoords = (locations || []).filter(
          (l: any) => l?.coordinates && typeof l.coordinates.lat === "number" && typeof l.coordinates.lng === "number",
        )
        withCoords.forEach((location: any) => {
          const marker = new window.google.maps.Marker({
            position: { lat: location.coordinates.lat, lng: location.coordinates.lng },
            map,
            title: location.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: accentColor,
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            },
          })
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding:8px;font-family:sans-serif;">
                <div style="font-weight:bold;margin-bottom:4px;">${location.name}</div>
                <div style="font-size:12px;color:#ccc;">${location.address}</div>
                <div style="font-size:12px;color:#ccc;margin-top:4px;">Items: ${location.items}</div>
              </div>
            `,
          })
          marker.addListener("click", () => infoWindow.open(map, marker))
          markersRef.current.push(marker)
        })
      })
      .catch(() => {
        // noop: fallback UI below
      })
    return () => {
      isCancelled = true
    }
  }, [apiKey, locations, t, mode])

  if (!apiKey) {
    return (
      <div
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "0.75rem",
          background: mode === "dark" ? "#0f172a" : "#e5e7eb",
          color: mode === "dark" ? "#e5e7eb" : "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        {t("Set your Google Maps API key in VITE_GOOGLE_MAPS_API_KEY to view the map.")}
      </div>
    )
  }

  return <div ref={mapRef} style={{ width: "100%", height: "400px", borderRadius: "0.75rem" }} />
}

export default function LocationsPage() {
  const { t } = useTranslation()
  const { mode, colors } = useTheme()
  const { locations, quants, products, storageCategories, removalStrategies, fetchData } = useData() as any
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>("")
  const [toast, setToast] = useState<{ open: boolean; text: string }>({ open: false, text: "" })
  const [form, setForm] = useState<any>({
    name: "",
    location_id: "",
    usage: "internal",
    storage_category_id: "",
    scrap_location: false,
    is_a_dock: false,
    replenish_location: false,
    cyclic_inventory_frequency: "",
    removal_strategy_id: "",
    comment: "",
  })

  const usageOptions: Array<{ label: string; value: string }> = [
    { label: t("Vendor Location"), value: "supplier" },
    { label: t("View"), value: "view" },
    { label: t("Internal Location"), value: "internal" },
    { label: t("Customer Location"), value: "customer" },
    { label: t("Inventory Loss"), value: "inventory" },
    { label: t("Production"), value: "production" },
    { label: t("Transit Location"), value: "transit" },
  ]

  const openModal = (loc?: any) => {
    const raw = loc || null
    setSelected(raw)
    setIsCreate(!raw)
    setDirty(false)
    setSaveError("")
    setForm({
      name: String(raw?.name || ""),
      location_id: raw?.location_id ? String(Array.isArray(raw.location_id) ? raw.location_id[0] : raw.location_id) : "",
      usage: String(raw?.usage || "internal"),
      storage_category_id: raw?.storage_category_id ? String(Array.isArray(raw.storage_category_id) ? raw.storage_category_id[0] : raw.storage_category_id) : "",
      scrap_location: !!raw?.scrap_location,
      is_a_dock: !!raw?.is_a_dock,
      replenish_location: !!raw?.replenish_location,
      cyclic_inventory_frequency: raw?.cyclic_inventory_frequency != null ? String(raw.cyclic_inventory_frequency) : "",
      removal_strategy_id: raw?.removal_strategy_id ? String(Array.isArray(raw.removal_strategy_id) ? raw.removal_strategy_id[0] : raw.removal_strategy_id) : "",
      comment: String(raw?.comment || ""),
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelected(null)
    setIsCreate(false)
    setDirty(false)
    setForm({
      name: "",
      location_id: "",
      usage: "internal",
      storage_category_id: "",
      scrap_location: false,
      is_a_dock: false,
      replenish_location: false,
      cyclic_inventory_frequency: "",
      removal_strategy_id: "",
      comment: "",
    })
  }

  // Compute locations summary from DataContext
  const computedLocations = useMemo<any[]>(() => {
    // Map product price for fallback value calc
    const priceByProduct: Record<string | number, number> = {}
    for (const p of products || []) {
      const id = p.id
      const std = typeof p.standard_price === "number" ? p.standard_price : undefined
      const lst =
        typeof p.list_price === "number" ? p.list_price : typeof p.lst_price === "number" ? p.lst_price : undefined
      const price = std ?? lst ?? 0
      if (id != null) priceByProduct[id] = price
    }
    const totalsByLocId: Record<string | number, { items: number; value: number }> = {}
    for (const q of quants || []) {
      const locId = q.location_id?.[0]
      const qty = typeof q.quantity === "number" ? q.quantity : q.qty || 0
      const invValRaw =
        typeof q.inventory_value === "number" ? q.inventory_value : typeof q.value === "number" ? q.value : undefined
      const prodId = q.product_id?.[0]
      const price = prodId != null ? (priceByProduct[prodId] ?? 0) : 0
      const computedVal = invValRaw != null ? invValRaw : qty * price
      const value = isFinite(computedVal) ? computedVal : 0
      if (locId != null) {
        const prev = totalsByLocId[locId] || { items: 0, value: 0 }
        totalsByLocId[locId] = { items: prev.items + qty, value: prev.value + value }
      }
    }
    const usageLabel = (u?: string) => {
      switch (u) {
        case "internal":
          return "Internal Location"
        case "view":
          return "View"
        case "supplier":
          return "Vendor Location"
        case "customer":
          return "Customer Location"
        case "inventory":
          return "Inventory Loss"
        case "production":
          return "Production"
        case "transit":
          return "Transit Location"
        default:
          return u || ""
      }
    }

    return (locations || []).map((loc: any) => {
      const id = loc.id
      const name = loc.complete_name || loc.name || ""
      const address = ""
      const capacity = 0
      const totals = totalsByLocId[id] || { items: 0, value: 0 }
      return {
        id,
        name,
        address,
        items: totals.items,
        value: totals.value,
        capacity,
        usage: usageLabel(loc.usage),
        isReception: !!loc.is_reception_location,
        storageCategory: Array.isArray(loc.storage_category_id) ? loc.storage_category_id[1] : "",
        // optional map coordinates if present via custom fields lat/lng
        coordinates: loc.coordinates || undefined,
      }
    })
  }, [locations, quants, products])

  const totalItems = computedLocations.reduce<number>((sum: number, loc: any) => sum + (loc.items || 0), 0)
  const totalValue = computedLocations.reduce<number>((sum: number, loc: any) => sum + (loc.value || 0), 0)
  const avgCapacity =
    computedLocations.length > 0
      ? computedLocations.reduce<number>((sum: number, loc: any) => sum + (loc.capacity ? (loc.items / loc.capacity) * 100 : 0), 0) /
        computedLocations.length
      : 0

  const uniqueTypes: string[] = useMemo(
    () => Array.from(new Set((computedLocations as any[]).map((l: any) => String(l.usage || "")).filter((v: string) => !!v))),
    [computedLocations],
  )
  const uniqueCategories: string[] = useMemo(
    () => Array.from(new Set((computedLocations as any[]).map((l: any) => String(l.storageCategory || "")).filter((v: string) => !!v))),
    [computedLocations],
  )

  const filteredLocations: any[] = computedLocations.filter((loc: any) => {
    const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = locationFilter === "all" || loc.name === locationFilter
    const matchesType = typeFilter === "all" || loc.usage === typeFilter
    const matchesCategory = categoryFilter === "all" || loc.storageCategory === categoryFilter
    return matchesSearch && matchesLocation && matchesType && matchesCategory
  })

  // Donut data: distribution by location type (usage)
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const l of computedLocations) {
      const key = l.usage || "Other"
      counts[key] = (counts[key] || 0) + 1
    }
    const palette = [colors.action, "#FAD766", "#A9E0BA", "#7A9BA8", "#6EE7B7", "#93C5FD"]
    return Object.entries(counts).map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }))
  }, [computedLocations, colors.action])

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  return (
    <div style={{ minHeight: "100vh", background: colors.background, padding: "2rem" }}>
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
          @keyframes shimmer {
            0% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
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

      <div style={{ marginBottom: "2rem", animation: "fadeInUp 0.6s ease-out", display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            {t("Warehouse Locations")}
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: "0.95rem", fontWeight: "400", margin: 0 }}>
            {t("Monitor inventory across all warehouse locations")}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          style={{
            background: colors.action,
            color: "#FFFFFF",
            border: "none",
            padding: "0.5rem 0.875rem",
            borderRadius: "0.5rem",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t("Create Location")}
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
        {[
          {
            label: t("Total Locations"),
            value: computedLocations.length,
            icon: Warehouse,
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          },
          {
            label: t("Total Items"),
            value: totalItems.toLocaleString(),
            icon: Package,
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          },
          {
            label: t("Total Value"),
            value: `${(totalValue / 1000).toFixed(0)}K LE`,
            icon: DollarSign,
            gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          },
          {
            label: t("Avg Capacity"),
            value: `${avgCapacity.toFixed(1)}%`,
            icon: TrendingUp,
            gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="animate-fade-in-up stat-card-hover"
              style={{
                background: colors.card,
                borderRadius: "1rem",
                padding: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: `1px solid ${colors.border}`,
                animationDelay: `${index * 0.1}s`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "120px",
                  height: "120px",
                  background: stat.gradient,
                  opacity: 0.1,
                  borderRadius: "50%",
                  transform: "translate(30%, -30%)",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "3rem",
                      height: "3rem",
                      borderRadius: "0.75rem",
                      background: stat.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    <Icon size={20} color="white" strokeWidth={2.5} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: colors.textSecondary,
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                    letterSpacing: "0.02em",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{ fontSize: "2rem", fontWeight: "700", color: colors.textPrimary, letterSpacing: "-0.02em" }}
                >
                  {stat.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {/* Commented - Google maps + Locations by type */}
      {/* */}
      

      <div
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: "1rem",
          padding: "1.25rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "280px" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.textSecondary,
              }}
            />
            <input
              placeholder={t("Search locations...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                height: "2.75rem",
                padding: "0 1rem 0 3rem",
                borderRadius: "0.75rem",
                border: `1px solid ${colors.border}`,
                background: colors.background,
                color: colors.textPrimary,
                fontSize: "0.9rem",
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.action
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.action}20`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.boxShadow = "none"
              }}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger
              style={{
                width: 200,
                height: "2.75rem",
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: "0.75rem",
                fontSize: "0.9rem",
              }}
            >
              <SelectValue placeholder={t("Location Type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Types")}</SelectItem>
              {uniqueTypes.map((tp) => (
                <SelectItem key={tp} value={tp as string}>
                  {tp as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              style={{
                width: 220,
                height: "2.75rem",
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: "0.75rem",
                fontSize: "0.9rem",
              }}
            >
              <SelectValue placeholder={t("Storage Category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Categories")}</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat as string}>
                  {cat as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredLocations.length === 0 ? (
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
            <MapPin size={28} color={colors.action} />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
            {t("No locations found")}
          </h3>
          <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
            {t("Try adjusting your filters or search term")}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          }}
        >
          {filteredLocations.map((loc: any, idx: number) => (
            <div
              key={String(loc.id)}
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
              }}
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
              {/* Bottom-right Edit button with icon + text */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const raw = (Array.isArray(locations) ? locations : []).find((l:any)=> Number(l.id)===Number(loc.id))
                  openModal(raw)
                }}
                title={t("Edit") as string}
                style={{
                  position: 'absolute',  right: 10,
                  background: colors.card,
                  border: 'none',
                  borderRadius: 10,
                  padding: '6px 10px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 18px rgba(0,0,0,0.18)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.12)'
                }}
              >
                <Pencil size={16} color={colors.textPrimary} />
                <span style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 700 }}>{t('Edit')}</span>
              </button>
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
                  pointerEvents: 'none',
                  zIndex: 1,
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
                      <MapPin size={18} color={colors.action} strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "600",
                          color: colors.textPrimary,
                          marginBottom: "0.25rem",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {loc.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: colors.textSecondary,
                          background: colors.mutedBg,
                          padding: "0.25rem 0.625rem",
                          borderRadius: "0.375rem",
                          display: "inline-block",
                          fontWeight: "500",
                        }}
                      >
                        {loc.usage}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${colors.mutedBg}, ${colors.background})`,
                      borderRadius: "0.75rem",
                      padding: "1rem",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <Box size={14} color={colors.textSecondary} />
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
                      {(loc.items || 0).toLocaleString()}
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
                      <DollarSign size={14} color={colors.textSecondary} />
                      <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "500" }}>
                        {t("Value")}
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
                      {((loc.value || 0) / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }} onClick={closeModal}>
          <div style={{ width: "95%", maxWidth: 840, maxHeight: "90vh", overflow: "auto", background: colors.card, borderRadius: 16, border: `1px solid ${colors.border}` }} onClick={(e)=>e.stopPropagation()}>
            <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${colors.border}` }}>
              <div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.textPrimary }}>{isCreate ? t("Create Location") : t("Edit Location")}</div>
                <div style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{t("Manage location details")}</div>
              </div>
              <button onClick={closeModal} style={{ border: `1px solid ${colors.border}`, background: colors.card, color: colors.textSecondary, borderRadius: 8, padding: "0.5rem 0.75rem" }}>✕</button>
            </div>
            <div style={{ padding: "1rem 1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>{t("Name")}</label>
                  <input type="text" value={form.name} onChange={(e)=>{ setForm({ ...form, name: e.target.value }); setDirty(true) }} style={{ width: "100%", padding: "0.625rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>{t("Parent Location")}</label>
                  <select value={form.location_id} onChange={(e)=>{ setForm({ ...form, location_id: e.target.value }); setDirty(true) }} style={{ width: "100%", padding: "0.625rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}>
                    <option value="">{t("Select parent")}</option>
                    {(Array.isArray(locations)? locations: []).map((l:any)=> (
                      <option key={l.id} value={String(l.id)}>{l.complete_name || l.name || `#${l.id}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>{t("Location type")}</label>
                  <select value={form.usage} onChange={(e)=>{ setForm({ ...form, usage: e.target.value }); setDirty(true) }} style={{ width: "100%", padding: "0.625rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}>
                    {usageOptions.map(o=> (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>{t("Storage category")}</label>
                  <select value={form.storage_category_id} onChange={(e)=>{ setForm({ ...form, storage_category_id: e.target.value }); setDirty(true) }} style={{ width: "100%", padding: "0.625rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}>
                    <option value="">{t("Select category")}</option>
                    {(Array.isArray(storageCategories)? storageCategories: []).map((c:any)=> (
                      <option key={c.id} value={String(c.id)}>{c.display_name || c.name || `#${c.id}`}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={!!form.scrap_location} onChange={(e)=>{ setForm({ ...form, scrap_location: e.target.checked }); setDirty(true) }} />
                  <span>{t("Is a scrap location")}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={!!form.is_a_dock} onChange={(e)=>{ setForm({ ...form, is_a_dock: e.target.checked }); setDirty(true) }} />
                  <span>{t("Is a dock location")}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={!!form.replenish_location} onChange={(e)=>{ setForm({ ...form, replenish_location: e.target.checked }); setDirty(true) }} />
                  <span>{t("Replenish location")}</span>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>{t("Inventory frequency")}</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="number" value={String(form.cyclic_inventory_frequency)} onChange={(e)=>{ setForm({ ...form, cyclic_inventory_frequency: e.target.value }); setDirty(true) }} style={{ flex: 1, padding: "0.625rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }} />
                    <span style={{ color: colors.textSecondary }}>{t("days")}</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>{t("Removal Strategy")}</label>
                  <select value={form.removal_strategy_id} onChange={(e)=>{ setForm({ ...form, removal_strategy_id: e.target.value }); setDirty(true) }} style={{ width: "100%", padding: "0.625rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}>
                    <option value="">{t("Select strategy")}</option>
                    {(Array.isArray(removalStrategies)? removalStrategies: []).map((r:any)=> (
                      <option key={r.id} value={String(r.id)}>{r.display_name || r.name || `#${r.id}`}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>{t("External note")}</label>
                  <textarea value={form.comment} onChange={(e)=>{ setForm({ ...form, comment: e.target.value }); setDirty(true) }} rows={4} style={{ width: "100%", padding: "0.625rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }} />
                </div>
                {!isCreate && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>{t("Last inventory date")}</label>
                      <div style={{ padding: "0.625rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.mutedBg, color: colors.textSecondary }}>
                        {selected?.last_inventory_date ? String(selected.last_inventory_date) : "-"}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>{t("Next Inventory date")}</label>
                      <div style={{ padding: "0.625rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.mutedBg, color: colors.textSecondary }}>
                        {selected?.next_inventory_date ? String(selected.next_inventory_date) : "-"}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Error message */}
            {saveError && (
              <div style={{ margin: '0.75rem 1.25rem 0', padding: '0.75rem', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>{saveError}</div>
            )}
            <div style={{ padding: "1rem 1.25rem", borderTop: `1px solid ${colors.border}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={closeModal} style={{ padding: "0.625rem 1rem", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}>{t("Cancel")}</button>
              <button
                disabled={saving || (!isCreate && !dirty) || !form.name}
                onClick={async ()=>{
                  try {
                    setSaving(true)
                    setSaveError("")
                    const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
                    if (!sessionId) throw new Error('No session ID')
                    const values:any = {
                      name: form.name,
                      usage: form.usage,
                      location_id: form.location_id ? Number(form.location_id) : undefined,
                      storage_category_id: form.storage_category_id ? Number(form.storage_category_id) : undefined,
                      scrap_location: !!form.scrap_location,
                      is_a_dock: !!form.is_a_dock,
                      replenish_location: !!form.replenish_location,
                      cyclic_inventory_frequency: form.cyclic_inventory_frequency === '' ? 0 : Number(form.cyclic_inventory_frequency),
                      removal_strategy_id: form.removal_strategy_id ? Number(form.removal_strategy_id) : undefined,
                      comment: form.comment,
                    }
                    let ok=false
                    let errMsg = ''
                    if (isCreate) {
                      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/locations/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
                      const j = await res.json().catch(async ()=>{ try { return { message: await res.text() } } catch { return {} } })
                      ok = res.ok && (j?.success || j?.id)
                      if (!ok) errMsg = (j?.message || 'Failed to create location')
                    } else if (selected?.id) {
                      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/locations/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, values }) })
                      const j = await res.json().catch(async ()=>{ try { return { message: await res.text() } } catch { return {} } })
                      ok = res.ok && j?.success
                      if (!ok) errMsg = (j?.message || 'Failed to update location')
                    }
                    if (ok) {
                      await fetchData('locations')
                      closeModal()
                      setToast({ open: true, text: 'Successfull' })
                    } else if (errMsg) {
                      setSaveError(errMsg)
                    }
                  } catch(e: any) {
                    setSaveError(e?.message || 'Unknown error')
                  } finally {
                    setSaving(false)
                  }
                }}
                style={{ padding: "0.625rem 1rem", borderRadius: 8, border: 'none', background: colors.action, color: '#fff', opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
              >{t(isCreate ? "Create" : "Save")}</button>
            </div>
          </div>
        </div>
      )}
      {toast.open && (
        <Toast text={toast.text} state="success" onClose={() => setToast({ open: false, text: '' })} />
      )}
    </div>
  )
}
