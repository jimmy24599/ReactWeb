"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTheme } from "../context/theme"
import { useNavigate } from "react-router-dom"

export default function SetupPage() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const navigate = useNavigate()

  const [baseUrl, setBaseUrl] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [dbName, setDbName] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Prefill from backend if available
    ;(async () => {
      
      // Prefill from local storage if present
      try {
        const lsBase = "https://egy.thetalenter.net"
        const lsCompany = "Swedish Tech"
        const lsDb = "odoodb1"
        if (lsBase) setBaseUrl(lsBase)
        if (lsCompany) setCompanyName(lsCompany)
        if (lsDb) setDbName(lsDb)
      } catch {}
    })()
  }, [])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!baseUrl || !dbName) return
    try {
      const res = await fetch('https://apps.thetalenter.net/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, company: companyName, db: dbName }),
      })
      if (!res.ok) throw new Error('Failed to save')

      // Persist locally as well
      localStorage.setItem('odoo_base_url', baseUrl)
      localStorage.setItem('odoo_company', companyName || '')
      localStorage.setItem('odoo_db', dbName)

      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      navigate('/signin')
    } catch (e) {
      // fallback also cache locally so app can proceed if backend persisted but fetching later
      localStorage.setItem('odoo_base_url', baseUrl)
      localStorage.setItem('odoo_company', companyName || '')
      localStorage.setItem('odoo_db', dbName)
      navigate('/signin')
    }
  }

  return (
    <div className="p-8" style={{ minHeight: "100vh", background: colors.background }}>
      <div
        style={{
          background: colors.background,
          padding: "1.5rem 1.5rem 3rem 1.5rem",
          color: colors.textPrimary,
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: colors.textPrimary }}>{t("Settings")}</h1>
            <p style={{ fontSize: "0.95rem", color: colors.textSecondary }}>{t("Configure your Odoo connection")}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "-1.5rem auto 0", padding: "0 1.5rem 1.5rem" }}>
        <Card style={{ border: `1px solid ${colors.border}`, background: colors.card, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <CardContent style={{ padding: "1.25rem" }}>
            <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {t("Odoo URL")}
                </label>
                <Input
                  placeholder={t("https://your-odoo-domain.com")}
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {t("Company Name")}
                </label>
                <Input
                  placeholder={t("Your Company LLC")}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: colors.textSecondary, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {t("Database Name")}
                </label>
                <Input
                  placeholder={t("odoo_db_name")}
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: 'center' }}>
                <Button
                  type="submit"
                  onClick={() => { /* explicit submit via form */ }}
                  style={{ background: colors.action, color: "#FFF", border: "none" }}
                  disabled={!baseUrl || !dbName}
                >
                  {t("Save & Continue")}
                </Button>
                {saved && (
                  <span style={{ color: colors.textSecondary, fontSize: 12 }}>{t("Saved")}</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
