
"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../context/theme"
import { useAuth } from "../context/auth"
import { useData } from "../context/data"
import { API_CONFIG } from "./config/api"
import Toast from "./components/Toast"
import { Laptop, Smartphone, Ban, UserCog, ShieldCheck, MonitorSmartphone, Loader2, BanIcon, CircleOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CustomButton } from "./components/CustomButton"
import { CustomInput } from "./components/CusotmInput"
import { CustomDropdown as NewCustomDropdown } from "./components/NewCustomDropdown"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserForm {
  id: number | null
  notification_type: "email" | "inbox" | ""
  odoobot_state: "not_initialized" | "onboarding_emoji" | "onboarding_attachement" | "onboarding_command" | "onboarding_ping" | "onboarding_canned" | "idle" | "disabled" | ""
  login: string
  signature: string
  property_warehouse_id: number | null
  calendar_default_privacy: "public" | "private" | "confidential" | ""
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { uid, sessionId } = useAuth()
  const { warehouses } = useData()

  const [activeTab, setActiveTab] = useState<"preferences" | "security" | "devices">("preferences")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [showToast, setShowToast] = useState<{ text: string; state: "success" | "error" } | null>(null)

  // Devices state
  const [deviceIds, setDeviceIds] = useState<number[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [devicesError, setDevicesError] = useState<string>("")
  const [devicesPage, setDevicesPage] = useState<number>(1)
  const devicesPageSize = 6

  const [form, setForm] = useState<UserForm>({
    id: null,
    notification_type: "",
    odoobot_state: "",
    login: "",
    signature: "",
    property_warehouse_id: null,
    calendar_default_privacy: "",
  })

  const userId = useMemo(() => Number(uid || 0), [uid])

  const htmlToText = (html: string): string => {
    try {
      if (!html) return ""
      const withNewlines = html.replace(/<br\s*\/?>/gi, "\n")
      const noTags = withNewlines.replace(/<[^>]+>/g, "")
      const txt = noTags.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      return txt.trim()
    } catch { return String(html || "") }
  }

  const textToHtml = (text: string): string => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const lines = (text || "").split(/\r?\n/).map(esc)
    if (lines.length === 0) return ""
    return `<p>${lines.join('<br/>')}</p>`
  }

  const loadUser = async () => {
    if (!sessionId || !userId) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/users/by-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, id: userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to fetch user")
      const u = data.user || {}
      const getId = (v: any): number | null => (Array.isArray(v) ? Number(v[0]) : (typeof v === 'number' ? v : (v?.id ?? null)))
      setForm({
        id: Number(u.id || userId),
        notification_type: (u.notification_type || "") as any,
        odoobot_state: (u.odoobot_state || "") as any,
        login: String(u.login || u.email || ""),
        signature: htmlToText(String(u.signature || "")),
        property_warehouse_id: getId(u.property_warehouse_id),
        calendar_default_privacy: (u.calendar_default_privacy || "") as any,
      })
      const ids = Array.isArray(u.device_ids) ? u.device_ids.map((n: any) => Number(n)).filter(Boolean) : []
      setDeviceIds(ids)
    } catch (e: any) {
      setError(e?.message || "Failed to load user preferences")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUser() }, [sessionId, userId])

  const warehouseOptions = useMemo(() => {
    return (warehouses || []).map((w: any) => ({ value: String(w.id), label: String(w.display_name || w.name || `#${w.id}`) }))
  }, [warehouses])

  const save = async () => {
    if (!sessionId || !form.id) return
    setSaving(true)
    setError("")
    try {
      const values: any = {
        notification_type: form.notification_type || false,
        odoobot_state: form.odoobot_state || false,
        login: form.login,
        signature: textToHtml(form.signature || ""),
        calendar_default_privacy: form.calendar_default_privacy || false,
      }
      if (form.property_warehouse_id) values.property_warehouse_id = form.property_warehouse_id
      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/users/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, values }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.message || "Save failed")
      setShowToast({ text: t("Preferences saved successfully"), state: "success" })
    } catch (e: any) {
      setShowToast({ text: e?.message || t("Failed to save preferences"), state: "error" })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const fetchDevices = async () => {
      if (activeTab !== "devices") return
      if (!sessionId) return
      setDevicesError("")
      setDevicesLoading(true)
      try {
        if (!deviceIds || deviceIds.length === 0) {
          setDevices([])
        } else {
          const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/users/devices/by-ids`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, ids: deviceIds }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to fetch devices")
          setDevices(Array.isArray(data.devices) ? data.devices : [])
        }
      } catch (e: any) {
        setDevicesError(e?.message || "Failed to fetch devices")
        setDevices([])
      } finally {
        setDevicesLoading(false)
      }
    }
    fetchDevices()
  }, [activeTab, sessionId, deviceIds])

  const tabs = [
    { key: "preferences", label: t("Preferences"), icon: UserCog },
    { key: "security", label: t("Account Security"), icon: ShieldCheck },
    { key: "devices", label: t("Devices"), icon: MonitorSmartphone },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8" style={{ background: colors.background, minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            {t("Settings")}
          </h1>
          <p className="mt-1 text-lg" style={{ color: colors.textSecondary }}>
            {t("Manage your account settings and preferences.")}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <nav className="flex flex-col space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-sm'
                        : `text-gray-600 hover:bg-violet-100`
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
          
          <main className="md:col-span-3">
            <Card className="shadow-lg border-none" style={{ background: colors.card, borderColor: colors.border }}>
              {activeTab === 'preferences' && (
                <>
                  <CardHeader>
                    <CardTitle>{t("User Preferences")}</CardTitle>
                    <CardDescription>{t("Set your personal preferences for the application.")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                        {error}
                      </div>
                    )}
                    
                    {/* Profile Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>{t("Profile")}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <CustomInput
                            label={t("Email")}
                            type="text"
                            value={form.login}
                            onChange={(v) => setForm((p) => ({ ...p, login: v }))}
                            placeholder={t("Enter email")}
                          />
                        </div>
                        <div className="space-y-2">
                          <NewCustomDropdown
                            label={t("Warehouse")}
                            values={warehouseOptions.map(o => o.label)}
                            type="single"
                            defaultValue={
                              form.property_warehouse_id
                                ? warehouseOptions.find(o => o.value === String(form.property_warehouse_id))?.label
                                : undefined
                            }
                            onChange={(v) => setForm(p => ({
                              ...p,
                              property_warehouse_id: typeof v === 'string'
                                ? (warehouseOptions.find(o => o.label === v)?.value ? Number(warehouseOptions.find(o => o.label === v)!.value) : null)
                                : null,
                            }))}
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                          <Label htmlFor="signature">{t("Signature")}</Label>
                          <Textarea id="signature" value={form.signature} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm(p => ({ ...p, signature: e.target.value }))} placeholder={t("Your email signature...")} rows={4} />
                        </div>
                      </div>
                    </div>

                    <div className="border-t" style={{ borderColor: colors.border }}></div>

                    {/* Behavior & Notifications Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>{t("Behavior & Notifications")}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <NewCustomDropdown
                            label={t("Notification")}
                            values={[t("Handle by Emails"), t("Handle in Odoo")]}
                            type="single"
                            defaultValue={
                              form.notification_type === "email"
                                ? t("Handle by Emails")
                                : form.notification_type === "inbox"
                                ? t("Handle in Odoo")
                                : undefined
                            }
                            onChange={(v) =>
                              setForm(p => ({
                                ...p,
                                notification_type:
                                  v === t("Handle by Emails") ? "email" :
                                  v === t("Handle in Odoo") ? "inbox" : ""
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                            <NewCustomDropdown
                              label={t("OdooBot Status")}
                              values={[
                                t("Not initialized"),
                                t("Onboarding emoji"),
                                t("Onboarding attachment"),
                                t("Onboarding command"),
                                t("Onboarding ping"),
                                t("Onboarding canned"),
                                t("Idle"),
                                t("Disabled"),
                              ]}
                              type="single"
                              defaultValue={
                                form.odoobot_state === "not_initialized" ? t("Not initialized") :
                                form.odoobot_state === "onboarding_emoji" ? t("Onboarding emoji") :
                                form.odoobot_state === "onboarding_attachement" ? t("Onboarding attachment") :
                                form.odoobot_state === "onboarding_command" ? t("Onboarding command") :
                                form.odoobot_state === "onboarding_ping" ? t("Onboarding ping") :
                                form.odoobot_state === "onboarding_canned" ? t("Onboarding canned") :
                                form.odoobot_state === "idle" ? t("Idle") :
                                form.odoobot_state === "disabled" ? t("Disabled") :
                                undefined
                              }
                              onChange={(v) =>
                                setForm(p => ({
                                  ...p,
                                  odoobot_state:
                                    v === t("Not initialized") ? "not_initialized" :
                                    v === t("Onboarding emoji") ? "onboarding_emoji" :
                                    v === t("Onboarding attachment") ? "onboarding_attachement" :
                                    v === t("Onboarding command") ? "onboarding_command" :
                                    v === t("Onboarding ping") ? "onboarding_ping" :
                                    v === t("Onboarding canned") ? "onboarding_canned" :
                                    v === t("Idle") ? "idle" :
                                    v === t("Disabled") ? "disabled" : ""
                                }))
                              }
                            />
                        </div>
                        <div className="space-y-2">
                            <NewCustomDropdown
                              label={t("Calendar Privacy")}
                              values={["public", "private", "confidential"]}
                              type="single"
                              defaultValue={form.calendar_default_privacy || undefined}
                              onChange={(v) => setForm(p => ({ ...p, calendar_default_privacy: v as any }))}
                            />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-3">
                    <CustomButton variant="secondary" onClick={() => loadUser()} disabled={saving || loading}>
                      {t("Cancel")}
                    </CustomButton>
                    <CustomButton
                      variant="primary"
                      onClick={save}
                      disabled={saving || loading}
                      icon={saving ? Loader2 : undefined}
                      iconClassName={saving ? "mr-2 h-4 w-4 animate-spin" : undefined}
                    >
                      {saving ? t("Saving...") : t("Save Changes")}
                    </CustomButton>
                  </CardFooter>
                </>
              )}
              {activeTab === 'security' && (
                 <>
                  <CardHeader>
                    <CardTitle>{t("Account Security")}</CardTitle>
                    <CardDescription>{t("Manage your password and security settings.")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <p className="text-gray-500">{t("This section is under development and will be available soon.")}</p>
                  </CardContent>
                </>
              )}
              {activeTab === 'devices' && (
                <>
                  <CardHeader>
                    <CardTitle>{t("Manage Devices")}</CardTitle>
                    <CardDescription>{t("Review and manage devices that have access to your account.")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {devicesError && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm mb-4">{devicesError}</div>}
                    {devicesLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.textSecondary }} />
                      </div>
                    ) : devices.length === 0 ? (
                      <p className="text-center py-10" style={{ color: colors.textSecondary }}>{t("No devices found for this account.")}</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {devices.slice((devicesPage - 1) * devicesPageSize, devicesPage * devicesPageSize).map((d) => {
                            const isComputer = d.device_type === "computer";
                            const Icon = isComputer ? Laptop : Smartphone;
                            return (
                              <div key={d.id} className="p-4 rounded-lg border flex flex-col gap-3" style={{ background: colors.background, borderColor: colors.border }}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${colors.action}15` }}>
                                      <Icon className="h-5 w-5" style={{ color: colors.action }} />
                                    </div>
                                    <div>
                                      <p className="font-semibold" style={{ color: colors.textPrimary }}>{d.browser || 'Unknown'}</p>
                                      <p className="text-xs" style={{ color: colors.textSecondary }}>{d.ip_address || 'IP N/A'}</p>
                                    </div>
                                  </div>
                                  {d.is_current && <div className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">{t("Current")}</div>}
                                </div>
                                <div className="text-xs" style={{ color: colors.textSecondary }}>
                                  {t("Last activity")}: <span className="font-medium" style={{ color: colors.textPrimary }}>{d.last_activity || '-'}</span>
                                </div>
                                <div className="flex justify-end mt-2">
                                  <CustomButton 
                                  variant="primary"
                                  disabled={saving || loading}
                                  icon={d.revoked ? CircleOff : Ban}
                                  iconClassName={saving ? "mr-2 h-4 w-4 animate-spin" : undefined}
                                   onClick={async () => {
                                      const res = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/users/devices/${d.id}`, {
                                          method: "PUT", headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ sessionId, values: { revoked: !d.revoked } }),
                                      });
                                      if(res.ok) {
                                        setShowToast({ text: d.revoked ? t("Device unrevoked") : t("Device access revoked"), state: "success" });
                                        setDevices(prev => prev.map(dev => dev.id === d.id ? { ...dev, revoked: !d.revoked } : dev));
                                      } else {
                                        setShowToast({ text: t("Failed to update device status"), state: "error" });
                                      }
                                  }}>
                                    {d.revoked ? t("Unrevoke") : t("Revoke")}
                                  </CustomButton>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                         {Math.ceil(devices.length / devicesPageSize) > 1 && (
                            <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: colors.border }}>
                                <span className="text-sm" style={{ color: colors.textSecondary }}>
                                    {t("Page")} {devicesPage} {t("of")} {Math.ceil(devices.length / devicesPageSize)}
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setDevicesPage(p => Math.max(1, p - 1))} disabled={devicesPage === 1}>{t("Previous")}</Button>
                                    <Button variant="outline" size="sm" onClick={() => setDevicesPage(p => Math.min(Math.ceil(devices.length / devicesPageSize), p + 1))} disabled={devicesPage * devicesPageSize >= devices.length}>{t("Next")}</Button>
                                </div>
                            </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          </main>
        </div>
      </div>
      {showToast && (
        <Toast text={showToast.text} state={showToast.state} onClose={() => setShowToast(null)} />
      )}
    </div>
  )
}
