"use client"

import {
  Search,
  Mail,
  Bell,
  ChevronDown,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Upload,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  Star,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  BarChart3,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { useTranslation } from 'react-i18next'
import { useTheme } from "../context/theme"
import { useData } from "../context/data"

// Rotated X axis tick for Recharts
function RotatedTick(props: any) {
  const { x, y, payload, fill } = props
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill={fill}
        transform="rotate(-30)"
        style={{ fontSize: '0.825rem' }}
      >
        {payload && payload.value}
      </text>
    </g>
  )
}

const revenueData = [
  { month: "Jan", income: 45000, expend: 38000 },
  { month: "Feb", income: 52000, expend: 42000 },
  { month: "Mar", income: 48000, expend: 35000 },
  { month: "Apr", income: 38000, expend: 28000 },
  { month: "May", income: 55000, expend: 45000 },
  { month: "Jun", income: 62000, expend: 48000 },
  { month: "Jul", income: 58000, expend: 42000 },
]

const inventoryDistribution = [
  { name: "Electronics", value: 35, color: "#1B475D" },
  { name: "Furniture", value: 25, color: "#FAD766" },
  { name: "Tools", value: 20, color: "#A9E0BA" },
  { name: "Materials", value: 20, color: "#7A9BA8" },
]

const warehouseCapacity = [
  { day: "Mon", used: 7200, available: 2800 },
  { day: "Tue", used: 7500, available: 2500 },
  { day: "Wed", used: 8100, available: 1900 },
  { day: "Thu", used: 7800, available: 2200 },
  { day: "Fri", used: 8400, available: 1600 },
  { day: "Sat", used: 7900, available: 2100 },
  { day: "Sun", used: 7300, available: 2700 },
]

const orderFulfillmentData = [
  { month: "March", current: 56000, forecast: 22000 },
  { month: "April", current: 90000, forecast: 96000 },
  { month: "May", current: 102000, forecast: 92000 },
  { month: "June", current: 94000, forecast: 72000 },
  { month: "July", current: 88000, forecast: 60000 },
  { month: "August", current: 60000, forecast: 8000 },
]

const suppliers = [
  {
    name: "TechSupply Co",
    products: "Electronics",
    nextShipment: "Oct 1, 2024",
    contact: "(555) 123-4567",
    rating: 5,
  },
  {
    name: "FurniCraft Ltd",
    products: "Furniture",
    nextShipment: "Sep 20, 2024",
    contact: "(555) 987-8532",
    rating: 5,
  },
]

// removed unused mock inventoryItems in favor of real products from context

const lowStockAlerts = [
  { product: "Wireless Mouse", sku: "ELC-1234", current: 12, minimum: 50, status: "critical" },
  { product: "USB-C Cable", sku: "ELC-5678", current: 28, minimum: 100, status: "warning" },
  { product: "Desk Lamp", sku: "FUR-9012", current: 45, minimum: 75, status: "warning" },
]

const recentActivities = [
  { action: "Stock Received", product: "Laptop Stand", quantity: 150, time: "2 hours ago", type: "in" },
  { action: "Order Shipped", product: "Office Chair", quantity: 25, time: "3 hours ago", type: "out" },
  { action: "Stock Adjusted", product: "Wireless Mouse", quantity: 50, time: "5 hours ago", type: "adjust" },
  { action: "Return Processed", product: "Monitor", quantity: 3, time: "6 hours ago", type: "return" },
]

export default function WarehouseDashboard() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const { colors } = useTheme()
  const { pickings, stockMoves, productTemplates } = useData()

  // Real stats from data.tsx
  const totalOrders = Array.isArray(pickings) ? pickings.length : 0
  const pendingOrders = Array.isArray(pickings) ? pickings.filter((p: any) => {
    const s = String(p.state || '').toLowerCase()
    return s && s !== 'done' && s !== 'cancel' && s !== 'cancelled'
  }).length : 0
  const cancelledOrders = Array.isArray(pickings) ? pickings.filter((p: any) => String(p.state || '').toLowerCase().startsWith('cancel')).length : 0
  const returnedItems = Array.isArray(stockMoves) ? stockMoves.filter((m: any) => {
    const ref = String(m.reference || m.origin || '').toLowerCase()
    return ref.includes('return') || ref.includes('rma')
  }).length : 0
  // Show full product templates list with no ranking/slicing and no mock fallback
  const topItems = Array.isArray(productTemplates) ? productTemplates : []
  return (
    <>
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

          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div
        style={{
          minHeight: "100vh",
          background: colors.background,
          padding: "2rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <header
          style={{
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeInDown 0.6s ease-out",
          }}
        >
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "1rem" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "28rem" }}>
              <Search
                style={{
                  position: "absolute",
                  ...(isRTL ? { right: "0.75rem" } : { left: "0.75rem" }),
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: "1.25rem",
                  width: "1.25rem",
                  color: colors.textSecondary,
                }}
              />
              <Input
                placeholder={t('Search Something here...')}
                style={{
                  ...(isRTL ? { paddingRight: "2.5rem", paddingLeft: "1rem" } : { paddingLeft: "2.5rem", paddingRight: "1rem" }),
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  height: "3rem",
                  borderRadius: "0.75rem",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Button
              variant="ghost"
              size="icon"
              style={{
                position: "relative",
                borderRadius: "0.75rem",
                background: colors.card,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                height: "3rem",
                width: "3rem",
                border: `1px solid ${colors.border}`,
              }}
            >
              <Mail style={{ height: "1.25rem", width: "1.25rem", color: colors.textSecondary }} />
              <span
                style={{
                  position: "absolute",
                  top: "0.5rem",
                  right: "0.5rem",
                  height: "0.5rem",
                  width: "0.5rem",
                  borderRadius: "9999px",
                  background: colors.inProgress,
                }}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              style={{
                position: "relative",
                borderRadius: "0.75rem",
                background: colors.card,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                height: "3rem",
                width: "3rem",
                border: `1px solid ${colors.border}`,
              }}
            >
              <Bell style={{ height: "1.25rem", width: "1.25rem", color: colors.textSecondary }} />
              <span
                style={{
                  position: "absolute",
                  top: "0.5rem",
                  right: "0.5rem",
                  height: "0.5rem",
                  width: "0.5rem",
                  borderRadius: "9999px",
                  background: colors.inProgress,
                }}
              />
            </Button>
          </div>
        </header>

        {/* Title and Actions */}
        <div
          style={{
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeInDown 0.6s ease-out 0.1s backwards",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "700",
                color: colors.textPrimary,
                marginBottom: "0.5rem",
                letterSpacing: "-0.025em",
              }}
            >
              {t('Warehouse Inventory Dashboard')}
            </h1>
            <p style={{ fontSize: "0.95rem", color: colors.textSecondary }}>
              {t('Real-time overview of your warehouse operations and inventory')}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  style={{
                    borderRadius: "0.75rem",
                    background: colors.card,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: `1px solid ${colors.border}`,
                    height: "2.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: colors.textPrimary,
                  }}
                >
                  <Calendar style={{ height: "1rem", width: "1rem" }} />
                  {t('This Month')}
                  <ChevronDown style={{ marginLeft: "0.5rem", height: "1rem", width: "1rem" }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>{t('This Week')}</DropdownMenuItem>
                <DropdownMenuItem>{t('This Month')}</DropdownMenuItem>
                <DropdownMenuItem>{t('This Quarter')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              style={{
                borderRadius: "0.75rem",
                background: colors.action,
                color: "#FFFFFF",
                height: "2.75rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {t('Export')}
              <Upload style={{ marginLeft: "0.5rem", height: "1rem", width: "1rem" }} />
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: `1px solid ${colors.border}`,
              animation: "fadeInUp 0.6s ease-out 0.1s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "0.5rem",
              }}
            >
              <div style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1B475D" }}>{t('Total Orders')}</div>
              <MoreVertical style={{ height: "1.25rem", width: "1.25rem", color: "#1B475D" }} />
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "700", marginBottom: "0.5rem", color: colors.textPrimary }}>
              {totalOrders.toLocaleString()}
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: "0.875rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  color: colors.pillSuccessText,
                  background: colors.pillSuccessBg,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.375rem",
                }}
              >
                <TrendingUp style={{ height: "0.75rem", width: "0.75rem", color: colors.pillSuccessText }} />
                <span>{t('+2% from last quarter')}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: `1px solid ${colors.border}`,
              animation: "fadeInUp 0.6s ease-out 0.2s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "0.5rem",
              }}
            >
              <div style={{ fontSize: "0.875rem", fontWeight: "500", color: colors.textSecondary }}>{t('Pending Orders')}</div>
              <MoreVertical style={{ height: "1.25rem", width: "1.25rem", color: colors.textSecondary }} />
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "700", marginBottom: "0.5rem", color: colors.textPrimary }}>
              {pendingOrders.toLocaleString()}
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: "0.875rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  color: '#FFFFFF',
                  background: colors.cancel,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.375rem",
                }}
              >
                <TrendingDown style={{ height: "0.75rem", width: "0.75rem" }} />
                <span>{t('-7.12% vs last month')}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: `1px solid ${colors.border}`,
              animation: "fadeInUp 0.6s ease-out 0.3s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "0.5rem",
              }}
            >
              <div style={{ fontSize: "0.875rem", fontWeight: "500", color: colors.textSecondary }}>{t('Cancelled Orders')}</div>
              <MoreVertical style={{ height: "1.25rem", width: "1.25rem", color: colors.textSecondary }} />
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "700", marginBottom: "0.5rem", color: colors.textPrimary }}>
              {cancelledOrders.toLocaleString()}
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: "0.875rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  color: colors.pillSuccessText,
                  background: colors.pillSuccessBg,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.375rem",
                }}
              >
                <TrendingUp style={{ height: "0.75rem", width: "0.75rem", color: colors.pillSuccessText }} />
                <span>+2% from last quarter</span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: `1px solid ${colors.border}`,
              animation: "fadeInUp 0.6s ease-out 0.4s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "0.5rem",
              }}
            >
              <div style={{ fontSize: "0.875rem", fontWeight: "500", color: colors.textSecondary }}>{t('Returned Items')}</div>
              <MoreVertical style={{ height: "1.25rem", width: "1.25rem", color: colors.textSecondary }} />
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "700", marginBottom: "0.5rem", color: colors.textPrimary }}>
              {returnedItems.toLocaleString()}
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: "0.875rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  color: '#FFFFFF',
                  background: colors.cancel,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.375rem",
                }}
              >
                <TrendingDown style={{ height: "0.75rem", width: "0.75rem" }} />
                <span>{t('-4.20% vs last month')}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(3, 1fr)",
            marginBottom: "2rem",
          }}
        >
          {/* Revenue Performance Chart */}
          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              animation: "fadeInUp 0.6s ease-out 0.5s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
                  {t('Revenue Performance')}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.875rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ height: "0.75rem", width: "0.75rem", borderRadius: "9999px", background: colors.action }} />
                    <span style={{ color: colors.textSecondary }}>{t('Income')}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ height: "0.75rem", width: "0.75rem", borderRadius: "9999px", background: colors.success }} />
                    <span style={{ color: colors.textSecondary }}>{t('Expend')}</span>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    style={{
                      borderRadius: "0.75rem",
                      border: `1px solid ${colors.border}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: colors.textPrimary,
                    }}
                  >
                    {t('Monthly')}
                    <ChevronDown style={{ marginLeft: "0.5rem", height: "1rem", width: "1rem" }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>{t('Daily')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('Weekly')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('Monthly')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.action} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.action} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={colors.textSecondary}
                  style={{ fontSize: "0.875rem" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis stroke={colors.textSecondary} style={{ fontSize: "0.875rem" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "0.5rem",
                    color: colors.textPrimary,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke={colors.action}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="expend"
                  stroke={colors.success}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorExpend)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              animation: "fadeInUp 0.6s ease-out 0.6s backwards",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
                {t('Warehouse Capacity')}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ height: "0.75rem", width: "0.75rem", borderRadius: "9999px", background: colors.action }} />
                  <span style={{ color: colors.textSecondary }}>{t('Used')}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ height: "0.75rem", width: "0.75rem", borderRadius: "9999px", background: colors.success }} />
                  <span style={{ color: colors.textSecondary }}>{t('Available')}</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={warehouseCapacity}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke={colors.textSecondary}
                  style={{ fontSize: "0.875rem" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis stroke={colors.textSecondary} style={{ fontSize: "0.875rem" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "0.5rem",
                    color: colors.textPrimary,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="used" stackId="a" fill={colors.action} radius={[0, 0, 0, 0]} />
                <Bar dataKey="available" stackId="a" fill={colors.success} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Inventory Distribution Pie Chart */}
          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              animation: "fadeInUp 0.6s ease-out 0.7s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: colors.textPrimary }}>{t('Inventory Distribution')}</h3>
              <MoreVertical style={{ height: "1.25rem", width: "1.25rem", color: colors.textSecondary }} />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={inventoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {inventoryDistribution.map((_entry, index) => {
                    const palette = [colors.action, colors.inProgress, colors.success, colors.pillInfoText]
                    const fill = palette[index % palette.length]
                    return <Cell key={`cell-${index}`} fill={fill} />
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "0.5rem",
                    color: colors.textPrimary,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                marginTop: "1rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              {inventoryDistribution.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div
                      style={{
                        height: "0.5rem",
                        width: "0.5rem",
                        borderRadius: "9999px",
                        background: [colors.action, colors.inProgress, colors.success, colors.pillInfoText][index % 4],
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>{entry.name}</span>
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: "600", color: colors.textPrimary }}>{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "2fr 1fr",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              animation: "fadeInUp 0.6s ease-out 0.8s backwards",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.5rem" }}>
                {t('Order Fulfillment Rate')}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ height: "0.5rem", width: "0.5rem", borderRadius: "9999px", background: colors.todo }} />
                  <span style={{ color: colors.textSecondary }}>{t('Forecast')}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ height: "0.5rem", width: "0.5rem", borderRadius: "9999px", background: colors.action }} />
                  <span style={{ color: colors.textSecondary }}>{t('Current')}</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={orderFulfillmentData} barCategoryGap={30} barGap={10}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={colors.textSecondary}
                  style={{ fontSize: "0.875rem" }}
                  axisLine={false}
                  tickLine={false}
                  tick={<RotatedTick fill={colors.textSecondary} />}
                />
                <YAxis stroke={colors.textSecondary} style={{ fontSize: "0.875rem" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v/1000)}K` : `${v}`)}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "0.5rem",
                    color: colors.textPrimary,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="forecast" fill={colors.todo} radius={[6, 6, 0, 0]} />
                <Bar dataKey="current" fill={colors.action} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              animation: "fadeInUp 0.6s ease-out 0.9s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: colors.textPrimary }}>{t('Recent Activities')}</h3>
              <Activity style={{ height: "1.25rem", width: "1.25rem", color: colors.textSecondary }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    paddingBottom: "1rem",
                    borderBottom: index < recentActivities.length - 1 ? `1px solid ${colors.border}` : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "2rem",
                      width: "2rem",
                      borderRadius: "0.5rem",
                      background:
                        activity.type === "in"
                          ? colors.pillSuccessBg
                          : activity.type === "out"
                            ? colors.inProgress
                            : activity.type === "adjust"
                              ? colors.pillInfoBg
                              : colors.cancel,
                      flexShrink: 0,
                    }}
                  >
                    {activity.type === "in" && (
                      <TrendingUp style={{ height: "1rem", width: "1rem", color: colors.textPrimary }} />
                    )}
                    {activity.type === "out" && <Truck style={{ height: "1rem", width: "1rem", color: colors.textPrimary }} />}
                    {activity.type === "adjust" && (
                      <BarChart3 style={{ height: "1rem", width: "1rem", color: colors.textPrimary }} />
                    )}
                    {activity.type === "return" && (
                      <TrendingDown style={{ height: "1rem", width: "1rem", color: colors.textPrimary }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: "600", color: colors.textPrimary, marginBottom: "0.125rem" }}>
                      {t(activity.action)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: colors.textSecondary, marginBottom: "0.25rem" }}>
                      {activity.product} ({activity.quantity} {t('units')})
                    </div>
                    <div style={{ fontSize: "0.75rem", color: colors.textSecondary }}>{t(activity.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "1fr 1fr",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              animation: "fadeInUp 0.6s ease-out 1s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: "2.5rem",
                  width: "2.5rem",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.75rem",
                  background: colors.inProgress,
                }}
              >
                <AlertTriangle style={{ height: "1.25rem", width: "1.25rem", color: colors.textPrimary }} />
              </div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: colors.textPrimary }}>{t('Low Stock Alerts')}</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {lowStockAlerts.map((alert, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: alert.status === "critical" ? colors.cancel : colors.pillSuccessBg,
                    border: `1px solid ${alert.status === "critical" ? colors.cancel : colors.pillSuccessBg}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: "600", color: '#FFFFFF', marginBottom: "0.125rem" }}>
                      {alert.product}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: '#FFFFFF' }}>{t('SKU:')} {alert.sku}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "700",
                        color: '#FFFFFF',
                      }}
                    >
                      {alert.current} / {alert.minimum}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: '#FFFFFF' }}>{t('units')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Items */}
          <div
            style={{
              background: colors.card,
              borderRadius: "0.75rem",
              padding: "1.5rem",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              animation: "fadeInUp 0.6s ease-out 1.1s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: colors.textPrimary }}>{t('Top Inventory Items')}</h3>
              <Button
                variant="link"
                style={{
                  fontSize: "0.875rem",
                  color: colors.textSecondary,
                  padding: 0,
                }}
              >
                {t('See all')}
              </Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: 320, overflowY: "auto", paddingRight: 4 }}>
              {topItems.map((p: any, index: number) => {
                const name = p.name || p.display_name || `#${p.id}`
                const code = (p.default_code || '').toString()
                const category = Array.isArray(p.categ_id) ? p.categ_id[1] : (p.category || '')
                const price = (p.list_price ?? p.standard_price ?? '').toString()
                return (
                  <div
                    key={p.id ?? index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          display: "flex",
                          height: "40px",
                          width: "40px",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {p.image_1920 ? (
                          <img
                            src={`data:image/png;base64,${p.image_1920}`}
                            alt={name}
                            style={{
                              objectFit: "contain",
                              height: "80%%",
                              width: "80%%",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                              const parent = e.currentTarget.parentElement
                              if (parent) {
                                const icon = document.createElement("div")
                                icon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'
                                parent.appendChild(icon)
                              }
                            }}
                          />
                        ) : (
                          <Package style={{ height: "1.5rem", width: "1.5rem", color: colors.textPrimary }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", color: colors.textPrimary, fontSize: "0.9rem" }}>{name}</div>
                        <div style={{ fontSize: "0.8rem", color: colors.textSecondary }}>
                          {category}{code ? ` • ${code}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, color: colors.textPrimary }}>{price ? `${price}` : ''}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "2fr 1fr" }}>
          {/* Supplier Info Table */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "0.75rem",
              border: "1px solid #D4D6CA",
              boxShadow: "0 1px 3px rgba(27, 71, 93, 0.1)",
              animation: "fadeInUp 0.6s ease-out 1.2s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.5rem",
                borderBottom: "1px solid #D4D6CA",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    height: "2.5rem",
                    width: "2.5rem",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0.75rem",
                    background: "#E8F3ED",
                  }}
                >
                  <Package style={{ height: "1.25rem", width: "1.25rem", color: "#1B475D" }} />
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1B475D" }}>{t('Supplier Info')}</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Button
                  variant="outline"
                  style={{
                    borderRadius: "0.75rem",
                    border: "1px solid #D4D6CA",
                    boxShadow: "0 1px 3px rgba(27, 71, 93, 0.1)",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#1B475D",
                  }}
                >
                  <Filter style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
                  {t('Filter')}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  style={{
                    borderRadius: "0.75rem",
                  }}
                >
                  <ChevronLeft style={{ height: "1.25rem", width: "1.25rem" }} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  style={{
                    borderRadius: "0.75rem",
                  }}
                >
                  <ChevronRight style={{ height: "1.25rem", width: "1.25rem" }} />
                </Button>
              </div>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #D4D6CA" }}>
                      <th
                        style={{
                          paddingBottom: "0.75rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#1B475D",
                        }}
                      >
                        {t('Supplier Name')}
                      </th>
                      <th
                        style={{
                          paddingBottom: "0.75rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#1B475D",
                        }}
                      >
                        {t('Products')}
                      </th>
                      <th
                        style={{
                          paddingBottom: "0.75rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#1B475D",
                        }}
                      >
                        {t('Next Shipment')}
                      </th>
                      <th
                        style={{
                          paddingBottom: "0.75rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#1B475D",
                        }}
                      >
                        {t('Contact')}
                      </th>
                      <th
                        style={{
                          paddingBottom: "0.75rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#1B475D",
                        }}
                      >
                        {t('Rating')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier, index) => (
                      <tr
                        key={index}
                        style={{ borderBottom: index < suppliers.length - 1 ? "1px solid #D4D6CA" : "none" }}
                      >
                        <td style={{ padding: "1rem 0", fontWeight: "500", color: "#1B475D", fontSize: "0.875rem" }}>
                          {supplier.name}
                        </td>
                        <td style={{ padding: "1rem 0", color: "#1B475D", fontSize: "0.875rem" }}>
                          {supplier.products}
                        </td>
                        <td style={{ padding: "1rem 0", color: "#1B475D", fontSize: "0.875rem" }}>
                          {supplier.nextShipment}
                        </td>
                        <td style={{ padding: "1rem 0", color: "#1B475D", fontSize: "0.875rem" }}>
                          {supplier.contact}
                        </td>
                        <td style={{ padding: "1rem 0" }}>
                          <div style={{ display: "flex", gap: "0.125rem" }}>
                            {Array.from({ length: supplier.rating }).map((_, i) => (
                              <Star
                                key={i}
                                style={{
                                  height: "1rem",
                                  width: "1rem",
                                  fill: "#FAD766",
                                  color: "#FAD766",
                                }}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              border: "1px solid #D4D6CA",
              boxShadow: "0 1px 3px rgba(27, 71, 93, 0.1)",
              animation: "fadeInUp 0.6s ease-out 1.3s backwards",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1B475D" }}>{t('Shipping Status')}</h3>
              <Truck style={{ height: "1.25rem", width: "1.25rem", color: "#1B475D" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  background: "#E8F3ED",
                  border: "1px solid #A9E0BA",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 style={{ height: "1rem", width: "1rem", color: "#1B475D" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1B475D" }}>{t('Delivered')}</span>
                  </div>
                  <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1B475D" }}>142</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1B475D" }}>{t('Orders completed today')}</div>
              </div>

              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  background: "#FEF4D6",
                  border: "1px solid #FAD766",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Truck style={{ height: "1rem", width: "1rem", color: "#1B475D" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1B475D" }}>{t('In Transit')}</span>
                  </div>
                  <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1B475D" }}>87</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1B475D" }}>{t('Orders on the way')}</div>
              </div>

              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  background: "#E8F3ED",
                  border: "1px solid #A9E0BA",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Clock style={{ height: "1rem", width: "1rem", color: "#1B475D" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1B475D" }}>{t('Pending')}</span>
                  </div>
                  <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1B475D" }}>23</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1B475D" }}>{t('Awaiting shipment')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
