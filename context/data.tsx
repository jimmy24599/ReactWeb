import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface DataContextType {
  // Data state
  products: any[]
  locations: any[]
  warehouses: any[]
  quants: any[]
  pickings: any[]
  pickingTransfers: any[]
  stockMoves: any[]
  stockMoveLines: any[]
  productions: any[]
  uom: any[]
  categories: any[]
  stockPickingTypes: any[]
  lots: any[]
  inventory: any[]
  inventoryLines: any[]
  landedCosts: any[]
  packages: any[]
  stockRules: any[]
  stockRoutes: any[]
  scraps: any[]
  partnerTitles: any[]
  partners: any[]
  productPackaging: any[]
  productTemplates: any[]
  putawayRules: any[]
  storageCategories: any[]
  packageTypes: any[]
  removalStrategies: any[]
  attributes: any[]
  attributeValues: any[]
  supplierinfo: any[]
  workcenters: any[]
  projects: any[]
  vendorBills: any[]
  landedCostLinesByCost: Record<number, any[]>

  // Loading states
  loading: {
    products: boolean
    locations: boolean
    warehouses: boolean
    quants: boolean
    pickings: boolean
    pickingTransfers: boolean
    stockMoves: boolean
    stockMoveLines: boolean
    productions: boolean
    uom: boolean
    categories: boolean
    stockPickingTypes: boolean
    lots: boolean
    inventory: boolean
    inventoryLines: boolean
    landedCosts: boolean
    packages: boolean
    stockRules: boolean
    stockRoutes: boolean
    scraps: boolean
    partnerTitles: boolean
    partners: boolean
    productPackaging: boolean
    productTemplates: boolean
    putawayRules: boolean
    storageCategories: boolean
    packageTypes: boolean
    removalStrategies: boolean
    attributes: boolean
    attributeValues: boolean
    supplierinfo: boolean
    workcenters: boolean
    projects: boolean
    vendorBills: boolean
  }

  // Error states
  errors: {
    products: string | null
    locations: string | null
    warehouses: string | null
    quants: string | null
    pickings: string | null
    pickingTransfers: string | null
    stockMoves: string | null
    stockMoveLines: string | null
    productions: string | null
    uom: string | null
    categories: string | null
    stockPickingTypes: string | null
    lots: string | null
    inventory: string | null
    inventoryLines: string | null
    landedCosts: string | null
    packages: string | null
    stockRules: string | null
    stockRoutes: string | null
    scraps: string | null
    partnerTitles: string | null
    partners: string | null
    productPackaging: string | null
    productTemplates: string | null
    putawayRules: string | null
    storageCategories: string | null
    packageTypes: string | null
    removalStrategies: string | null
    attributes: string | null
    attributeValues: string | null
    supplierinfo: string | null
    workcenters: string | null
    projects: string | null
    vendorBills: string | null
  }

  // Actions
  fetchData: (dataType: string) => Promise<void>
  refreshAllData: () => Promise<void>
  retryProblematicEndpoints: () => Promise<void>
  clearData: () => void
  fetchLandedCostLines: (costId: number) => Promise<void>
  refreshStockRulesDirect: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export function DataProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  
  // Data state
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [quants, setQuants] = useState<any[]>([])
  const [pickings, setPickings] = useState<any[]>([])
  const [pickingTransfers, setPickingTransfers] = useState<any[]>([])
  const [stockMoves, setStockMoves] = useState<any[]>([])
  const [stockMoveLines, setStockMoveLines] = useState<any[]>([])
  const [productions, setProductions] = useState<any[]>([])
  const [uom, setUom] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [stockPickingTypes, setStockPickingTypes] = useState<any[]>([])
  const [lots, setLots] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [inventoryLines, setInventoryLines] = useState<any[]>([])
  const [landedCosts, setLandedCosts] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [stockRules, setStockRules] = useState<any[]>([])
  const [stockRoutes, setStockRoutes] = useState<any[]>([])
  const [scraps, setScraps] = useState<any[]>([])
  const [partnerTitles, setPartnerTitles] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [productPackaging, setProductPackaging] = useState<any[]>([])
  const [productTemplates, setProductTemplates] = useState<any[]>([])
  const [putawayRules, setPutawayRules] = useState<any[]>([])
  const [storageCategories, setStorageCategories] = useState<any[]>([])
  const [packageTypes, setPackageTypes] = useState<any[]>([])
  const [removalStrategies, setRemovalStrategies] = useState<any[]>([])
  const [attributes, setAttributes] = useState<any[]>([])
  const [attributeValues, setAttributeValues] = useState<any[]>([])
  const [supplierinfo, setSupplierinfo] = useState<any[]>([])
  const [workcenters, setWorkcenters] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [vendorBills, setVendorBills] = useState<any[]>([])
  const [landedCostLinesByCost, setLandedCostLinesByCost] = useState<Record<number, any[]>>({})
  
  // Loading states
  const [loading, setLoading] = useState({
    products: false,
    locations: false,
    warehouses: false,
    quants: false,
    pickings: false,
    pickingTransfers: false,
    stockMoves: false,
    stockMoveLines: false,
    productions: false,
    uom: false,
    categories: false,
    stockPickingTypes: false,
    lots: false,
    inventory: false,
    inventoryLines: false,
    landedCosts: false,
    packages: false,
    stockRules: false,
    stockRoutes: false,
    scraps: false,
    partnerTitles: false,
    partners: false,
    productPackaging: false,
    productTemplates: false,
    putawayRules: false,
    storageCategories: false,
    packageTypes: false,
    removalStrategies: false,
    attributes: false,
    attributeValues: false,
    supplierinfo: false,
    workcenters: false,
    projects: false,
    vendorBills: false,
  })
  
  // Error states
  const [errors, setErrors] = useState({
    products: null,
    locations: null,
    warehouses: null,
    quants: null,
    pickings: null,
    pickingTransfers: null,
    stockMoves: null,
    stockMoveLines: null,
    productions: null,
    uom: null,
    categories: null,
    stockPickingTypes: null,
    lots: null,
    inventory: null,
    inventoryLines: null,
    landedCosts: null,
    packages: null,
    stockRules: null,
    stockRoutes: null,
    scraps: null,
    partnerTitles: null,
    partners: null,
    productPackaging: null,
    productTemplates: null,
    putawayRules: null,
    storageCategories: null,
    packageTypes: null,
    removalStrategies: null,
    attributes: null,
    attributeValues: null,
    supplierinfo: null,
    workcenters: null,
    projects: null,
    vendorBills: null,
  } as any)
  
  // Get session ID from localStorage or sessionStorage
  const getSessionId = () => {
    return localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
  }

  // Get Odoo headers from localStorage
  const getOdooHeaders = (): Record<string, string> => {
    const rawBase = "https://egy.thetalenter.net"
    const db = "odoodb1"
    const headers: Record<string, string> = {}
    if (rawBase) headers['x-odoo-base'] = rawBase
    if (db) headers['x-odoo-db'] = db
    return headers
  }
  
  // Generic fetch function
  const fetchData = async (dataType: string) => {
    const sessionId = getSessionId()
    if (!sessionId) {
      console.error('No session ID found')
      setErrors((prev: any) => ({ 
        ...prev, 
        [dataType]: 'No session ID found. Please log in again.' 
      }))
      return
    }
    
    setLoading((prev: any) => ({ ...prev, [dataType]: true }))
    setErrors((prev: any) => ({ ...prev, [dataType]: null }))
    
    try {
      const endpoint = getEndpoint(dataType)
      const url = getUrl(dataType, endpoint)
            
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getOdooHeaders(),
        },
        body: JSON.stringify({ sessionId }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP error for ${dataType}:`, response.status, errorText)
        
        if (response.status === 404) {
          throw new Error(`Endpoint not found: ${endpoint}. Please check if the backend server is running and the route is configured correctly.`)
        } else if (response.status === 500) {
          throw new Error(`Server error: ${errorText}. Please check the backend server logs.`)
        } else {
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
        }
      }
      
      const data = await response.json()
      
      if (data.success) {
        const setter = getSetter(dataType)
        let payload = data[dataType] || []
        if (dataType === 'quants' && Array.isArray(payload)) {
          // Filter to match Odoo's On Hand default view: internal locations and positive available quantity
          const locUsageById = new Map<number, string>()
          for (const loc of (locations || [])) {
            const id = typeof loc.id === 'number' ? loc.id : Array.isArray(loc.id) ? loc.id[0] : undefined
            if (typeof id === 'number') locUsageById.set(id, loc.usage)
          }
          payload = payload.filter((q: any) => {
            const locId = Array.isArray(q.location_id) ? q.location_id[0] : q.location_id
            const usage = locUsageById.get(locId)
            const available = Number(q.available_quantity ?? q.quantity ?? 0)
            return usage === 'internal' && available > 0
          })
        }
        setter(payload)
      } else {
        throw new Error(data.message || `Failed to fetch ${dataType}`)
      }
    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error)
      setErrors((prev: any) => ({ 
        ...prev, 
        [dataType]: error instanceof Error ? error.message : 'Unknown error' 
      }))
    } finally {
      setLoading((prev: any) => ({ ...prev, [dataType]: false }))
    }
  }
  
  // Get endpoint for each data type
  const getEndpoint = (dataType: string): string => {
    const endpointMap: Record<string, string> = {
      // Use per-model route mounted at /api/products-single
      products: 'product-templates',
      locations: 'locations',
      warehouses: 'warehouses',
      quants: 'quants',
      pickings: 'pickings',
      pickingTransfers: 'picking-transfers',
      stockMoves: 'stock-moves',
      stockMoveLines: 'move-lines',
      productions: 'productions',
      uom: 'uom',
      categories: 'categories',
      stockPickingTypes: 'picking-types',
      lots: 'lots',
      packages: 'quant-packages',
      inventory: 'inventory',
      inventoryLines: 'inventory-lines',
      landedCosts: 'landed-costs',
      stockRules: 'stock-rules',
      stockRoutes: 'stock-routes',
      scraps: 'scraps',
      putawayRules: 'putaway-rules',
      storageCategories: 'storage-categories',
      packageTypes: 'package-types',
      removalStrategies: 'removal-strategies',
      attributes: 'attributes',
      attributeValues: 'attribute-values',
      supplierinfo: 'supplierinfo',
      partnerTitles: 'partner-titles',
      partners: 'partners',
      productPackaging: 'product-packaging',
      productTemplates: 'product-templates',
      workcenters: 'workcenters',
      projects: 'projects',
      vendorBills: 'account-moves',
    }
    return endpointMap[dataType] || dataType
  }

  const getUrl = (dataType: string, endpoint: string): string => {
    // Datasets mounted directly under /api (per-model routes)
    const topLevel: Record<string, true> = {
      products: true,
      locations: true,
      landedCosts: true,
      stockRules: true,
      stockRoutes: true,
      stockMoves: true,
      stockMoveLines: true,
      warehouses: true,
      quants: true,
      pickings: true,
      pickingTransfers: true,
      productions: true,
      uom: true,
      categories: true,
      stockPickingTypes: true,
      lots: true,
      packages: true,
      inventory: true,
      inventoryLines: true,
      putawayRules: true,
      storageCategories: true,
      packageTypes: true,
      removalStrategies: true,
      attributes: true,
      attributeValues: true,
      supplierinfo: true,
      partnerTitles: true,
      partners: true,
      productPackaging: true,
      productTemplates: true,
      workcenters: true,
      projects: true,
      scraps: true,
      vendorBills: true,
    }
    if (topLevel[dataType]) return `${API_BASE_URL}/${endpoint}`
    // Legacy endpoints grouped under /api/products
    return `${API_BASE_URL}/products/${endpoint}`
  }

  const fetchLandedCostLines = async (costId: number) => {
    const sessionId = getSessionId()
    if (!sessionId || !costId) return
    try {
      const res = await fetch(`${API_BASE_URL}/landed-cost-lines/by-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getOdooHeaders() },
        body: JSON.stringify({ sessionId, cost_id: costId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        setLandedCostLinesByCost((prev) => ({ ...prev, [costId]: data.lines || [] }))
      }
    } catch (e) {
      console.error('fetchLandedCostLines error', e)
    }
  }
  
  const refreshStockRulesDirect = async () => {
    const sessionId = getSessionId()
    if (!sessionId) return
    try {
      setLoading((prev: any) => ({ ...prev, stockRules: true }))
      setErrors((prev: any) => ({ ...prev, stockRules: null }))
      const res = await fetch(`${API_BASE_URL}/stock-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getOdooHeaders() },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        setStockRules(data.stockRules || [])
      } else {
        throw new Error(data?.message || 'Failed to refresh stock rules')
      }
    } catch (e: any) {
      console.error('refreshStockRulesDirect error', e)
      setErrors((prev: any) => ({ ...prev, stockRules: e?.message || 'Unknown error' }))
    } finally {
      setLoading((prev: any) => ({ ...prev, stockRules: false }))
    }
  }
  
  // Get setter function for each data type
  const getSetter = (dataType: string) => {
    const setterMap: Record<string, (data: any[]) => void> = {
      products: setProducts,
      locations: setLocations,
      warehouses: setWarehouses,
      quants: setQuants,
      pickings: setPickings,
      pickingTransfers: setPickingTransfers,
      stockMoves: setStockMoves,
      stockMoveLines: setStockMoveLines,
      productions: setProductions,
      uom: setUom,
      categories: setCategories,
      stockPickingTypes: setStockPickingTypes,
      lots: setLots,
      packages: setPackages,
      inventory: setInventory,
      inventoryLines: setInventoryLines,
      landedCosts: setLandedCosts,
      stockRules: setStockRules,
      stockRoutes: setStockRoutes,
      scraps: setScraps,
      putawayRules: setPutawayRules,
      storageCategories: setStorageCategories,
      packageTypes: setPackageTypes,
      removalStrategies: setRemovalStrategies,
      attributes: setAttributes,
      attributeValues: setAttributeValues,
      supplierinfo: setSupplierinfo,
      partnerTitles: setPartnerTitles,
      partners: setPartners,
      productPackaging: setProductPackaging,
      productTemplates: setProductTemplates,
      workcenters: setWorkcenters,
      projects: setProjects,
      vendorBills: setVendorBills,
    }
    return setterMap[dataType] || (() => {})
  }
  
  function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
    return chunks
  }
  
  // Refresh all data
  const refreshAllData = async () => {
    // Temporarily disable problematic endpoints that are causing 500 errors
    const workingDataTypes = [
      'locations', 'warehouses', 'quants', 'lots', 'pickings', 'pickingTransfers', 'stockMoves',
      'stockMoveLines', 'productions', 'uom', 'categories', 'stockPickingTypes', 'stockRules', 'stockRoutes', 'landedCosts', 'partnerTitles', 'partners', 'productPackaging', 'productTemplates', 'putawayRules', 'storageCategories', 'packageTypes', 'attributes', 'attributeValues', 'supplierinfo'
    ]
    .concat(['workcenters','projects'])
    .concat(['scraps'])
    
    const dataTypes = workingDataTypes

    const first = 'locations'
    if (dataTypes.includes(first)) {
      try { await fetchData(first) } catch (e) { /* handled inside fetchData */ }
    }
    const remaining = dataTypes.filter((d) => d !== first)

    const batches = chunkArray(remaining, 5)
    for (const batch of batches) {
      await Promise.all(
        batch.map((dt) =>
          fetchData(dt).catch((error) => {
            console.error(`Failed to fetch ${dt}:`, error)
            setErrors((prev: any) => ({
              ...prev,
              [dt]: `Unable to load ${dt} data. This might be due to backend server issues or missing data.`,
            }))
          })
        )
      )
    }
  }
  
  // Retry problematic endpoints
  const retryProblematicEndpoints = async () => {
    const problematicDataTypes = ['lots', 'inventory', 'inventoryLines']
    
    for (const dataType of problematicDataTypes) {
      try {
        await fetchData(dataType)
      } catch (error) {
        console.error(`Still failing to fetch ${dataType}:`, error)
      }
    }
  }

  // Clear all data
  const clearData = () => {
    setProducts([])
    setLocations([])
    setWarehouses([])
    setQuants([])
    setPickings([])
    setPickingTransfers([])
    setStockMoves([])
    setStockMoveLines([])
    setProductions([])
    setUom([])
    setCategories([])
    setStockPickingTypes([])
    setLots([])
    setInventory([])
    setInventoryLines([])
    setLandedCosts([])
    setStockRules([])
    setStockRoutes([])
    setScraps([])
    setPutawayRules([])
    setStorageCategories([])
    setPackageTypes([])
    setRemovalStrategies([])
    setAttributes([])
    setAttributeValues([])
    setPartnerTitles([])
    setPartners([])
    setProductPackaging([])
    setProductTemplates([])
    setWorkcenters([])
    setProjects([])
    setErrors({
      products: null,
      warehouses: null,
      quants: null,
      pickings: null,
      stockMoves: null,
      stockMoveLines: null,
      productions: null,
      uom: null,
      categories: null,
      stockPickingTypes: null,
      lots: null,
      inventory: null,
      inventoryLines: null,
      landedCosts: null,
      stockRules: null,
      stockRoutes: null,
      scraps: null,
      putawayRules: null,
      storageCategories: null,
      packageTypes: null,
      removalStrategies: null,
      attributes: null,
      attributeValues: null,
      partnerTitles: null,
      workcenters: null,
      projects: null,
    })
  }
  
  // Auto-refresh data when location changes
  useEffect(() => {
    const sessionId = getSessionId()
    if (sessionId) {
      refreshAllData()
    } else {
    }
  }, [location.pathname])
  
  const value: DataContextType = {
    // Data
    products,
    locations,
    warehouses,
    quants,
    pickings,
    pickingTransfers,
    stockMoves,
    stockMoveLines,
    productions,
    uom,
    categories,
    stockPickingTypes,
    lots,
    packages,
    inventory,
    inventoryLines,
    landedCosts,
    stockRules,
    stockRoutes,
    scraps,
    putawayRules,
    storageCategories,
    packageTypes,
    removalStrategies,
    attributes,
    attributeValues,
    supplierinfo,
    partnerTitles,
    partners,
    productPackaging,
    productTemplates,
    workcenters,
    projects,
    vendorBills,
    landedCostLinesByCost,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // Actions
    fetchData,
    refreshAllData,
    retryProblematicEndpoints,
    clearData,
    fetchLandedCostLines,
    refreshStockRulesDirect,
  }
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
