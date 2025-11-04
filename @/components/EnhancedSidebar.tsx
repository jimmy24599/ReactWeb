"use client"

import {
  Home,
  Truck,
  Package,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Inbox,
  Briefcase,
  Wrench,
  ShoppingCart,
  PackageOpen,
  LayoutGrid,
  Boxes,
  QrCode,
  Archive,
  MapPin,
  History,
  TrendingUp,
  DollarSign,
  Warehouse,
  GitBranch,
  Route,
  List,
  Container,
  FolderTree,
  Tag,
  Ruler,
  PackagePlus,
  Layers,
  Trash2,
  LogOut,
  PanelLeftOpen,
  PanelLeftClose,
  Search,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/auth"
import { useSidebar } from "../../context/sidebar"
import { useTheme } from "../../context/theme"
import { useTranslation } from 'react-i18next'
import { CustomDropdown } from "../../src/components/NewCustomDropdown"

type MenuItem = {
  title: string
  icon: LucideIcon
  url?: string
  items?: SubMenuItem[]
  badge?: string
}

type SubMenuItem = {
  title: string
  icon: LucideIcon
  url?: string
  items?: NestedMenuItem[]
}

type NestedMenuItem = {
  title: string
  icon: LucideIcon
  url?: string
}

const menuItems: MenuItem[] = [
  {
    title: "Overview",
    icon: Home,
    url: "/overview",
  },
  {
    title: "Warehouse View",
    icon: Warehouse,
    url: "/warehouse-view",
  },
  {
    title: "Operations",
    icon: Truck,
    items: [
      {
        title: "Transfers",
        icon: PackageOpen,
        items: [
          { title: "Receipts", icon: Inbox, url: "/receipts" },
          { title: "Deliveries", icon: Truck, url: "/deliveries" },
          { title: "Internal", icon: GitBranch, url: "/internal" },
          { title: "Manufacturing", icon: Settings, url: "/manufacturing" },
          { title: "Dropships", icon: Package, url: "/dropships" },
        ],
      },
      {
        title: "Jobs",
        icon: Briefcase,
        items: [
          { title: "Batch transfers", icon: Layers, url: "/batch" },
          { title: "Wave transfers", icon: TrendingUp, url: "/wave" },
        ],
      },
      {
        title: "Adjustments",
        icon: Wrench,
        items: [
          { title: "Physical Inventory", icon: Archive, url: "/physical-inventory" },
          { title: "Scrap", icon: Trash2, url: "/scrap" },
          { title: "Landing costs", icon: DollarSign, url: "/landing-costs" },
        ],
      },
      {
        title: "Procurement",
        icon: ShoppingCart,
        items: [{ title: "Replenishment", icon: PackagePlus, url: "/replenishment" }],
      },
    ],
  },
  {
    title: "Products",
    icon: Package,
    items: [
      { title: "Products", icon: Package, url: "/products" },
      { title: "Product Variants", icon: LayoutGrid, url: "/product-variants" },
      { title: "Lots/Serial Numbers", icon: QrCode, url: "/lots-serial" },
      { title: "Packages", icon: Boxes, url: "/product-packages" },
    ],
  },
  {
    title: "Reporting",
    icon: BarChart3,
    items: [
      { title: "Stocks", icon: Archive, url: "/stocks" },
      { title: "Locations", icon: MapPin, url: "/reporting-location" },
      { title: "Moves History", icon: History, url: "/moves-history" },
      { title: "Move Analysis", icon: TrendingUp, url: "/moves-analysis" },
      { title: "Valuation", icon: DollarSign, url: "/valuation" },
    ],
  },
  {
    title: "Configuration",
    icon: Settings,
    items: [
      {
        title: "Warehouse Management",
        icon: Warehouse,
        items: [
          { title: "Warehouses", icon: Warehouse, url: "/warehouse" },
          { title: "Operation types", icon: List, url: "/operations" },
          { title: "Locations", icon: MapPin, url: "/locations" },
          { title: "Routes", icon: Route, url: "/routes" },
          { title: "Rules", icon: Settings, url: "/rules" },
          { title: "Storage categories", icon: FolderTree, url: "/storage" },
          { title: "Putaway Rules", icon: Container, url: "/putaway" },
        ],
      },
      {
        title: "Products",
        icon: Package,
        items: [
          { title: "Product categories", icon: FolderTree, url: "/categories" },
          { title: "Product Packagings", icon: Boxes, url: "/product-packagings" },
          { title: "Attributes", icon: Tag, url: "/attributes" },
        ],
      },
      {
        title: "Units of Measure",
        icon: Ruler,
        items: [{ title: "UoM Categories", icon: Layers, url: "/uom-categories" }],
      },
      {
        title: "Delivery",
        icon: Truck,
        items: [
          { title: "Delivery Methods", icon: Truck, url: "/delivery-methods" },
          { title: "Package types", icon: Package, url: "/package-types" },
        ],
      },
    ],
  },
]

export function EnhancedSidebar() {
  const navigate = useNavigate()
  const {name} = useAuth()
  const location = useLocation()
  const { signOut } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const { mode, setMode } = useTheme()
  const isDarkMode = mode === 'dark'
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  const toggleExpanded = (title: string, parentTitle?: string) => {
    const uniqueKey = parentTitle ? `${parentTitle}-${title}` : title
    setExpandedItems((prev) =>
      prev.includes(uniqueKey) ? prev.filter((item) => item !== uniqueKey) : [...prev, uniqueKey],
    )
  }

  const isActive = (url: string) => {
    return location.pathname === url
  }

  const handleNavigation = (url: string) => {
    navigate(url)
  }

  const handleSignOut = () => {
    signOut()
    setShowUserModal(false)
  }

  const toggleTheme = () => {
    setMode(isDarkMode ? 'light' : 'dark')
  }

  return (
    <div
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } ${isDarkMode ? "bg-[#1B475D] text-white" : "bg-[#0F7EA3] text-white"}  ${isDarkMode ? "border-[#1B475D]/50" : "border-gray-200"} flex flex-col h-screen fixed ${isRTL ? 'right-0' : 'left-0'} top-0 transition-all duration-300`}
    >
      {/* Header */}
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center justify-center">
            <div className="flex items-center gap-6 justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-white rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold">{t('Swedish Tech')}</span>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className={`p-2 items-center justify-center ${isRTL ? 'right-0' : 'left-0'} ${isDarkMode ? 'hover:bg-[#FBD666]' : 'hover:bg-[#288BAD]'} rounded-lg transition-colors`}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar 
      {!isCollapsed && (
        <div className="p-4  dark:border-[#1B475D]/50">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder={t('Search')}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-white dark:bg-[#1B475D]/70 border border-gray-200 dark:border-[#1B475D]/50 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FAD766]`}
            />
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="p-4  flex justify-center">
          <button className={`p-2 ${isDarkMode ? 'hover:bg-[#FBD666]' : 'hover:bg-[#288BAD]'} rounded-lg transition-colors`}>
            <Search className="w-5 h-5" />
          </button>
        </div>
      )}
    */}
      {/* Navigation - Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {!isCollapsed && (
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t('Navigation')}
            </span>
          </div>
        )}

        <div className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.title}>
              {/* Main Item */}
              {item.items ? (
                <div>
                  <button
                    onClick={() => !isCollapsed && toggleExpanded(item.title)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isCollapsed ? "justify-center" : "justify-start"
                    } ${isDarkMode ? 'hover:bg-[#FBD666]' : 'hover:bg-[#288BAD]'}`}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t(item.title)}</span>
                        {expandedItems.includes(item.title) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </button>

                  {/* Sub Items */}
                  {!isCollapsed && expandedItems.includes(item.title) && (
                    <div className={`${isRTL ? 'mr-4 border-r-2 pr-3' : 'ml-4 border-l-2 pl-3'} mt-1 space-y-1 border-gray-300 dark:border-[#A9E0BA]/30`}>
                      {item.items.map((subItem) => (
                        <div key={subItem.title}>
                          {subItem.items ? (
                            <div>
                              <button
                                onClick={() => toggleExpanded(subItem.title, item.title)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${isDarkMode ? 'hover:bg-[#FBD666]' : 'hover:bg-[#288BAD]'} rounded-lg transition-colors`}
                              >
                                <subItem.icon className="w-4 h-4 flex-shrink-0" />
                                <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t(subItem.title)}</span>
                                {expandedItems.includes(`${item.title}-${subItem.title}`) ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Nested Items */}
                              {expandedItems.includes(`${item.title}-${subItem.title}`) && (
                                <div className={`${isRTL ? 'mr-4' : 'ml-4'} mt-1 space-y-1`}>
                                  {subItem.items.map((nestedItem) => (
                                    <button
                                      key={nestedItem.title}
                                      onClick={() => nestedItem.url && handleNavigation(nestedItem.url)}
                                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                        isActive(nestedItem.url || "")
                                          ? (isDarkMode ? 'bg-[#FBD666] font-medium' : 'bg-[#288BAD] font-medium')
                                          : (isDarkMode ? 'hover:bg-[#FBD666]' : 'hover:bg-[#288BAD]')
                                      }`}
                                    >
                                      <nestedItem.icon className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t(nestedItem.title)}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => subItem.url && handleNavigation(subItem.url)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                isActive(subItem.url || "")
                                  ? (isDarkMode ? 'bg-[#FBD666] font-medium' : 'bg-[#288BAD] font-medium')
                                  : (isDarkMode ? 'hover:bg-[#FBD666]' : 'hover:bg-[#288BAD]')
                              }`}
                            >
                              <subItem.icon className="w-4 h-4 flex-shrink-0" />
                              <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t(subItem.title)}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => item.url && handleNavigation(item.url)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isCollapsed ? "justify-center" : "justify-start"
                  } ${
                    isActive(item.url || "")
                      ? (isDarkMode ? 'bg-[#FBD666]' : 'bg-[#288BAD]')
                      : (isDarkMode ? 'hover:bg-[#FBD666]' : 'hover:bg-[#288BAD]')
                  }`}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t(item.title)}</span>}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section - Fixed at bottom */}
      <div className="p-3  space-y-2 flex-shrink-0">
        {/* User Profile */}
        <div
          className={`flex items-center gap-3 px-3 py-2 hover:bg-[#288BAD] hover:text-black dark:hover:bg-[#1B475D]/70 rounded-lg transition-colors cursor-pointer ${
            isCollapsed ? "justify-center" : ""
          }`}
          onClick={() => !isCollapsed && setShowUserModal(true)}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-[#A9E0BA] to-[#FBD666] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium">{name.toString().charAt(0).toUpperCase()}</span>
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1">
                <div className="text-sm font-medium">{name}</div>
                <div className="text-xs opacity-80">{t('My Workspace')}</div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </div>

        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-center"} gap-4 px-3 py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {!isCollapsed && <Sun className={`w-4 h-4 ${isDarkMode ? 'text-white/80' : 'text-white'}`} />}
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
              isDarkMode ? "bg-[#A9E0BA]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                // LTR: dark -> right, light -> left
                // RTL: dark -> left,  light -> right
                isRTL
                  ? (isDarkMode ? 'left-1' : 'right-1')
                  : (isDarkMode ? 'right-1' : 'left-1')
              }`}
            />
          </button>
          {!isCollapsed && <Moon className={`w-4 h-4 ${isDarkMode ? 'text-white/80' : 'text-white'}`} />}
        </div>

        <div className={`px-3 pb-2 relative ${isCollapsed ? 'justify-center' : 'justify-center'}`}>
          <button
            onClick={() => { setShowUserModal(false); setShowLangMenu((v: boolean) => !v) }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm border ${isDarkMode ? 'bg-[#1B475D] border-white/20 text-white' : 'bg-white border-gray-200 text-[#242424]'} shadow-sm`}
          >
            {!isCollapsed &&<span className="flex items-center gap-2">
              <span>{i18n.resolvedLanguage === 'ar' ? '🇦🇪' : '🇺🇸'}</span>
              <span>{i18n.resolvedLanguage === 'ar' ? 'Arabic' : 'English'}</span>
            </span>}
            {isCollapsed &&<span className="flex items-center justify-center gap-2">
              <span>{i18n.resolvedLanguage === 'ar' ? '🇦🇪' : '🇺🇸'}</span>
            </span>}
            <ChevronDown className="w-4 h-4" />
          </button>
          {showLangMenu && (
            <div className={`absolute bottom-full mb-2 rounded-md border z-50 ${isDarkMode ? 'bg-[#1B475D] border-white/20 shadow-md' : 'bg-white border-gray-200 shadow-lg'}`}>
              <button
                onClick={() => { i18n.changeLanguage('ar'); setShowLangMenu(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-t-md ${isDarkMode ? 'hover:bg-[#FBD666] text-white' : 'hover:bg-gray-100 text-[#242424]'}`}
              >
                {isCollapsed && <span className={`w-4 h-4 ${isDarkMode ? 'text-white/80' : 'text-white'}`}>🇦🇪</span>}
                {!isCollapsed && <span>🇦🇪 Arabic</span>}
              </button>
              <button
                onClick={() => { i18n.changeLanguage('en'); setShowLangMenu(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-b-md ${isDarkMode ? 'hover:bg-[#FBD666] text-white' : 'hover:bg-gray-100 text-[#242424]'}`}
              >
                {isCollapsed && <span className={`w-4 h-4 ${isDarkMode ? 'text-white/80' : 'text-white'}`}>🇺🇸</span>}
                {!isCollapsed && <span>🇺🇸 English</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && !isCollapsed && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50" onClick={() => setShowUserModal(false)} />

          {/* Modal */}
          <div className="fixed bottom-20 left-4 w-56 bg-white dark:bg-[#1B475D] rounded-lg shadow-lg border border-gray-200 dark:border-[#A9E0BA]/30 z-50">
            <div className="p-2">
              <button
                onClick={() => {
                      setShowUserModal(false)
                  // Navigate to settings page if you have one
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-[#F2F3EC] hover:bg-gray-100 dark:hover:bg-[#1B475D]/70 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>{t('Settings')}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('Sign Out')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
