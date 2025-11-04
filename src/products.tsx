'use client';

import { useEffect } from 'react'
import { useAuth } from '../context/auth.tsx'
import { RefreshCcw, File } from 'lucide-react'
import {SyncLoader} from 'react-spinners'
import { ProductRecords } from './components/ProductRecords.tsx'
import { useTheme } from '../context/theme.tsx';
import { useData } from '../context/data.tsx'

// Using products from DataProvider; no local Product interface needed

function Products() {
    const { sessionId, isAuthenticated } = useAuth()
    const { productTemplates, loading, errors, fetchData } = useData() as any
    const { colors } = useTheme()
    
    // Load products via DataProvider when authenticated
    useEffect(() => {
        if (sessionId && isAuthenticated) {
            fetchData('productTemplates')
        }
        // Intentionally exclude fetchData to avoid refetch loop if the function identity changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, isAuthenticated])

    const handleGetProducts = async () => {
        if (sessionId) await fetchData('productTemplates')
    }

  return (
    <div className="min-h-screen" style={{ background: colors.background}}>
      {/* Clean Header */}
      <div>        
        {/* Main Content */}
        <div className="space-y-8">
          {/* Products Section */}
          <div>
            {loading.productTemplates ? (
              <div className="flex flex-col items-center justify-center py-24">
                <SyncLoader color="#1B475D" size={10} />
                <p className="mt-4 text-sm" style={{ color: "#1B475D" }}>
                  {productTemplates.length > 0 ? 'Refreshing products...' : 'Loading products...'}
                </p>
              </div>
            ) : errors.productTemplates ? (
              <div className="text-center py-24">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#F2F3EC" }}>
                  <File className="w-8 h-8" style={{ color: "#1B475D" }} />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: "#1B475D" }}>Failed to load products</h3>
                <p className="mb-6" style={{ color: "#1B475D", opacity: 0.7 }}>{errors.productTemplates}</p>
                <button 
                  onClick={handleGetProducts}
                  className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                  style={{ background: "linear-gradient(135deg, #1B475D 0%, #0F2A3D 100%)" }}
                >
                  <RefreshCcw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : productTemplates.length > 0 ? (
              <div className="bg-white">
                <ProductRecords products={productTemplates} />
              </div>
            ) : (
              <div className="text-center py-24">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#F2F3EC" }}>
                  <File className="w-8 h-8" style={{ color: "#1B475D" }} />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: "#1B475D" }}>No products found</h3>
                <p className="mb-6" style={{ color: "#1B475D", opacity: 0.7 }}>Get started by adding your first product to the system.</p>
                <button 
                  onClick={handleGetProducts}
                  className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                  style={{ background: "linear-gradient(135deg, #1B475D 0%, #0F2A3D 100%)" }}
                >
                  <RefreshCcw className="w-4 h-4" />
                  Load Products
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products

