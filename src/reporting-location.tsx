"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { MapPin, Box, DollarSign } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "../context/theme"
import { useData } from "../context/data"

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

function GoogleMapsContainer({ apiKey, locations, mode, accentColor }: { apiKey?: string; locations: any[]; mode: "light" | "dark"; accentColor: string }) {
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
        const withCoords = (locations || []).filter((l: any) => l?.coordinates && typeof l.coordinates.lat === 'number' && typeof l.coordinates.lng === 'number')
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

export default function ReportingLocationConst() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === "rtl"
  const { mode, colors } = useTheme()
  const { locations, quants, products, productPackaging, partners, lots } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const productCards = useMemo(() => {
    const prodById: Record<number, any> = {}
    for (const p of products || []) prodById[p.id] = p
    const locById: Record<number, any> = {}
    for (const l of locations || []) locById[l.id] = l
    const packById: Record<number, any> = {}
    for (const pk of productPackaging || []) packById[pk.id] = pk
    const partnerById: Record<number, any> = {}
    for (const pr of partners || []) partnerById[pr.id] = pr
    const lotById: Record<number, any> = {}
    for (const lt of lots || []) lotById[lt.id] = lt

    const list: Array<{
      id: string
      productName: string
      productImage?: string
      locationName: string
      packageName: string
      lotName: string
      ownerName: string
      onHand: number
      reserved: number
      uomName: string
    }> = []

    for (const q of quants || []) {
      const prodId = Array.isArray(q.product_id) ? q.product_id[0] : q.product_id
      const locId = Array.isArray(q.location_id) ? q.location_id[0] : q.location_id
      const pkgId = Array.isArray(q.package_id) ? q.package_id[0] : q.package_id
      const ownId = Array.isArray(q.owner_id) ? q.owner_id[0] : q.owner_id
      const lotId = Array.isArray(q.lot_id) ? q.lot_id[0] : q.lot_id

      const prod = prodById[prodId]
      const loc = locById[locId]
      const pkg = packById[pkgId]
      const own = partnerById[ownId]
      const lot = lotById[lotId]

      const uom = Array.isArray(prod?.uom_id) ? prod.uom_id[1] : prod?.uom_id || ""
      const onHand = typeof q.quantity === 'number' ? q.quantity : (typeof q.qty === 'number' ? q.qty : 0)
      const reserved = typeof q.reserved_quantity === 'number' ? q.reserved_quantity : (typeof q.reserved_qty === 'number' ? q.reserved_qty : 0)

      list.push({
        id: `${String(q.id ?? `${prodId}-${locId}-${lotId || ''}-${pkgId || ''}`)}`,
        productName: prod?.display_name || prod?.name || t('Unknown Product'),
        productImage: prod?.image_1920,
        locationName: loc?.complete_name || loc?.name || '',
        packageName: pkg?.name || pkg?.display_name || '',
        lotName: lot?.name || '',
        ownerName: own?.name || '',
        onHand,
        reserved,
        uomName: typeof uom === 'string' ? uom : '',
      })
    }
    return list
  }, [quants, products, locations, productPackaging, partners, lots, t])

  const totalOnHand = useMemo(() => productCards.reduce((s, x) => s + (x.onHand || 0), 0), [productCards])
  const totalReserved = useMemo(() => productCards.reduce((s, x) => s + (x.reserved || 0), 0), [productCards])
  const totalQuantities = totalOnHand + totalReserved
  const totalLocationsUsed = useMemo(() => new Set(productCards.map((x) => x.locationName).filter(Boolean)).size, [productCards])

  const uniqueTypes: string[] = []
  const uniqueCategories: string[] = []

  const filteredCards = productCards.filter((c) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      c.productName.toLowerCase().includes(q) ||
      c.locationName.toLowerCase().includes(q) ||
      c.packageName.toLowerCase().includes(q) ||
      c.lotName.toLowerCase().includes(q) ||
      c.ownerName.toLowerCase().includes(q)
    const matchesLocation = locationFilter === 'all' || c.locationName === locationFilter
    const matchesType = typeFilter === 'all'
    const matchesCategory = categoryFilter === 'all'
    return matchesSearch && matchesLocation && matchesType && matchesCategory
  })

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  return (
    <div className="p-8"style={{ minHeight: "100vh", background: colors.background }}
    >
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
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.8;
            }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
          }
          .animate-pulse-slow {
            animation: pulse 2s ease-in-out infinite;
          }
        `}
      </style>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem", animation: "fadeInUp 0.6s ease-out" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: "700",
            color: colors.textPrimary,
            marginBottom: "0.25rem",
          }}
        >
          {t("Warehouse Locations")}
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: "0.875rem" }}>{t("Monitor inventory across all warehouse locations")}</p>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {[
          { label: t("Total on hand quantity"), value: totalOnHand.toLocaleString() },
          { label: t("Total Reserved quantity"), value: totalReserved.toLocaleString() },
          { label: t("Total quantities"), value: totalQuantities.toLocaleString() },
          { label: t("Total locations used"), value: totalLocationsUsed.toLocaleString() },
        ].map((stat, index) => (
          <div
            key={index}
            className="animate-fade-in-up"
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              border: `1px solid ${colors.border}`,
              animationDelay: `${index * 0.1}s`,
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)"
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "1rem",
                  height: "1rem",
                  borderRadius: "50%",
                  background: colors.action,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.125rem" }}>{stat.label}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: colors.textPrimary }}>{stat.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Map and Charts Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* Filters toolbar (compact) */}
        <div style={{ gridColumn: '1 / -1', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', padding: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '30%', minWidth: 240 }}>
              <input
                placeholder={t('Search products, locations, lots...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: '2.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.textPrimary,
                }}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger style={{ width: 180, height: '2.5rem', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8 }}>
                <SelectValue placeholder={t('Type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger style={{ width: 200, height: '2.5rem', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8 }}>
                <SelectValue placeholder={t('Category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Product Cards */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {filteredCards.map((item) => (
            <div
              key={item.id}
              style={{
                background: colors.card,
                padding: '1rem',
                borderRadius: '0.75rem',
                border: `1px solid ${colors.border}`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.productImage ? (
                    <img src={`data:image/webp;base64,${item.productImage}`} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ fontSize: 10, color: colors.textSecondary }}>{t('No Image')}</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{item.locationName}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ background: colors.mutedBg, borderRadius: '0.5rem', padding: '0.625rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginBottom: 4 }}>{t('Package')}</div>
                  <div style={{ fontSize: '0.9rem', color: colors.textPrimary }}>{item.packageName || '—'}</div>
                </div>
                <div style={{ background: colors.mutedBg, borderRadius: '0.5rem', padding: '0.625rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginBottom: 4 }}>{t('Lot/Serial')}</div>
                  <div style={{ fontSize: '0.9rem', color: colors.textPrimary }}>{item.lotName || '—'}</div>
                </div>
                <div style={{ background: colors.mutedBg, borderRadius: '0.5rem', padding: '0.625rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginBottom: 4 }}>{t('Owner')}</div>
                  <div style={{ fontSize: '0.9rem', color: colors.textPrimary }}>{item.ownerName || '—'}</div>
                </div>
                <div style={{ background: colors.mutedBg, borderRadius: '0.5rem', padding: '0.625rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginBottom: 4 }}>{t('Unit')}</div>
                  <div style={{ fontSize: '0.9rem', color: colors.textPrimary }}>{item.uomName || '—'}</div>
                </div>
                <div style={{ background: colors.mutedBg, borderRadius: '0.5rem', padding: '0.625rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginBottom: 4 }}>{t('On hand')}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary }}>{item.onHand.toLocaleString()}</div>
                </div>
                <div style={{ background: colors.mutedBg, borderRadius: '0.5rem', padding: '0.625rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginBottom: 4 }}>{t('Reserved')}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary }}>{item.reserved.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: `1px solid ${colors.border}`, paddingTop: '0.5rem' }}>
                <button style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textPrimary }}>{t('History')}</button>
                <button style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: colors.action, color: '#FFFFFF' }}>{t('Replenishment')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
