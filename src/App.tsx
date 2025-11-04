import { useEffect } from 'react'
import './App.css'
import { useAuth } from '../context/auth.tsx'
import { SidebarProvider, useSidebar } from '../context/sidebar.tsx'
import { DataProvider } from '../context/data.tsx'
import { ThemeProvider } from '../context/theme'
import { Route, Routes, useNavigate, Navigate } from "react-router"
import Inventory from './inventory.tsx'
import Signin from './signin.tsx'
import { EnhancedSidebar } from '../@/components/EnhancedSidebar.tsx'
import { ChatBot } from './components/ChatBot.tsx'
import Products from './products.tsx'
import PhysicalInventory from './physical-inventory.tsx'
import WarehouseDashboard from './overview.tsx'
import Stocks  from './stocks.tsx'
import MovesHistoryPage from './movesHistory.tsx'
import ValuationPage from './valuation.tsx'
import LocationsPage from './locations.tsx'
import WarehousesPage from './warehouse.tsx'
import OperationTypesPage from './operations.tsx'
import RoutesPage from './routes.tsx'
import RulesPage from './rules.tsx'
import SettingsPage from './settings.tsx'
import SetupPage from './setup.tsx'
import StorageCategoriesPage from './storage.tsx'
import PutawaysRulesPage from './putaway.tsx'
import ProductCategoriesPage from './categories.tsx'
import AttributesPage from './attributes.tsx'
import UnitsOfMeasurePage from './uom.tsx'
import DeliveryMethodsPage from './deliveryMethods.tsx'
import PackageTypesPage from './package-types.tsx'
import ProductPackagingsPage from './product-packaging.tsx'
import MovesAnalysisPage from './moves-analysis.tsx'
import ProductVariantsPage from './product-variants.tsx'
import LotsSerialNumbersPage from './serial-numbers.tsx'
import PackagesPage from './product-packages.tsx'
import TransferReceiptsPage from './receipts.tsx'
import TransferDeliveriesPage from './deliveries.tsx'
import InternalTransfersPage from './internal.tsx'
import ManufacturingPage from './manufacturing.tsx'
import DropshipsPage from './dropship.tsx'
import BatchTransfersPage from './batch.tsx'
import WaveTransfersPage from './wave.tsx'
import ScrapOrdersPage from './scrap.tsx'
import WarehouseManager from './warehouse-view.tsx'
import LandedCostsPage from './landing-costs.tsx'
import { useTranslation } from 'react-i18next'
import ReportingLocationConst from './reporting-location.tsx'
import FieldsTesterPage from './fields-tester.tsx'

function AppContent() {
  const { isAuthenticated, isLoading, signOut } = useAuth()
  const { isCollapsed } = useSidebar()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  
  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '20px',
        color: '#1e5e81'
      }}>
        {t('Loading...')}
      </div>
    )
  }

  return (
    <Routes>
      {/* Public route */}
      <Route path="/signin" element={<Signin />} />
      <Route path="/setup" element={<SetupPage />} />

      {/* Protected routes with global layout */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <div className="flex min-h-screen ">
              <EnhancedSidebar />
              <main className={`flex-1 overflow-x-hidden transition-all duration-300 ${isCollapsed ? (isRTL ? 'mr-20' : 'ml-20') : (isRTL ? 'mr-64' : 'ml-64')}`}>
                <div className="flex flex-col min-h-screen">
                  
                  <div className="flex-1">
                    <Routes>
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/overview" element={<WarehouseDashboard />} />
                      <Route path="/stocks" element={<Stocks />} />
                      <Route path="/receipts" element={<TransferReceiptsPage />} />
                      <Route path="/deliveries" element={<TransferDeliveriesPage />} />
                      <Route path="/internal" element={<InternalTransfersPage />} />
                      <Route path="/dropships" element={<DropshipsPage />} />
                      <Route path="/batch" element={<BatchTransfersPage />} />
                      <Route path="/wave" element={<WaveTransfersPage />} />
                      <Route path='/moves-history' element={<MovesHistoryPage />} />
                      <Route path='/valuation' element={<ValuationPage />} />
                      <Route path='/locations' element={<LocationsPage />} />
                      <Route path="/physical-inventory" element={<PhysicalInventory />} />
                      <Route path="/warehouse" element={<WarehousesPage />} />
                      <Route path="/operations" element={<OperationTypesPage />} />
                      <Route path="/rules" element={<RulesPage />} />
                      <Route path="/routes" element={<RoutesPage />} />
                      <Route path="/storage" element={<StorageCategoriesPage />} />
                      <Route path="/putaway" element={<PutawaysRulesPage />} />
                      <Route path="/categories" element={<ProductCategoriesPage />} />
                      <Route path="/attributes" element={<AttributesPage />} />
                      <Route path="/uom-categories" element={<UnitsOfMeasurePage />} />
                      <Route path="/delivery-methods" element={<DeliveryMethodsPage />} />
                      <Route path="/package-types" element={<PackageTypesPage />} />
                      <Route path="/product-packagings" element={<ProductPackagingsPage />} />
                      <Route path="/moves-analysis" element={<MovesAnalysisPage />} />
                      <Route path="/product-variants" element={<ProductVariantsPage />} />
                      <Route path="/lots-serial" element={<LotsSerialNumbersPage />} />
                      <Route path="/product-packages" element={<PackagesPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/manufacturing" element={<ManufacturingPage />} />
                      <Route path="/scrap" element={<ScrapOrdersPage />} />
                      <Route path="/warehouse-view" element={<WarehouseManager />} />
                      <Route path="/landing-costs" element={<LandedCostsPage />} />
                      <Route path="/warehouse-locations" element={<WarehousesPage/>}/>
                      <Route path="/reporting-location" element={<ReportingLocationConst/>}/>
                      <Route path="/" element={<Navigate to="/overview" replace />} />
                      <Route path="/test" element={<FieldsTesterPage/>}/>
                      <Route path="/settings" element={<SettingsPage/>}/>
                    </Routes>
                  </div>
                </div>
              </main>
              <ChatBot />
            </div>
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/overview" : "/signin"} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </DataProvider>
    </ThemeProvider>
  )
}

export default App
