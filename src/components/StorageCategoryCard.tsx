import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "../../context/theme";
import { useTranslation } from "react-i18next";
import { Scale, MapPin, Package, Boxes, User, PackageCheck } from "lucide-react";

interface StorageCategoryCardProps {
    category: any;
    onClick: () => void;
    index: number;
}

export function StorageCategoryCard({ category, onClick, index }: StorageCategoryCardProps) {
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir() === "rtl";

    const m2oLabel = (val: any): string => {
        if (Array.isArray(val) && val.length >= 2 && typeof val[1] === 'string') return val[1];
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        return '-';
    };

    const m2mSummary = (val: any): string => {
        if (Array.isArray(val)) return `${val.length}`;
        return '0';
    };
    
    const getPolicyStyle = (policy: string) => {
        switch (policy) {
            case 'mixed':
                return { bg: colors.pillInfoBg, text: colors.pillInfoText };
            case 'same':
                return { bg: colors.inProgress, text: '#0A0A0A' };
            case 'empty':
                return { bg: colors.pillSuccessBg, text: colors.pillSuccessText };
            default:
                return { bg: colors.mutedBg, text: colors.textSecondary };
        }
    };

    const policy = String(category.raw?.allow_new_product || 'N/A');
    const policyStyle = getPolicyStyle(policy);

    return (
        <Card
            style={{
                position: "relative",
                overflow: "hidden",
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: "1rem",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                animationDelay: `${index * 50}ms`,
            }}
            className="animate-fade-in-up hover:shadow-xl"
            onClick={onClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: "-2rem",
                    right: isRTL ? "auto" : "-2rem",
                    left: isRTL ? "-2rem" : "auto",
                    width: "8rem",
                    height: "8rem",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${colors.action}15, ${colors.action}05)`,
                    pointerEvents: "none",
                }}
            />

            <CardContent style={{ padding: "1.5rem", position: "relative" }}>
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "1.5rem",
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <h3
                            style={{
                                fontSize: "1.125rem",
                                fontWeight: "700",
                                color: colors.textPrimary,
                                marginBottom: "0.25rem",
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {category.title}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                             <User size={14} style={{ color: colors.textSecondary }} />
                             <span style={{ fontSize: "0.875rem", color: colors.textSecondary }}>
                                {t('By')}: {m2oLabel(category.raw?.create_uid)}
                            </span>
                        </div>
                    </div>
                     <Badge
                        style={{
                            borderRadius: "8px",
                            padding: "0.375rem 0.875rem",
                            background: policyStyle.bg,
                            border: `1px solid ${colors.border}`,
                            color: policyStyle.text,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontWeight: "600",
                            fontSize: "0.8125rem",
                            textTransform: 'capitalize'
                        }}
                    >
                        <PackageCheck size={14} />
                        {t(policy)}
                    </Badge>
                </div>

                {/* Metric Boxes */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <div
                        style={{
                            background: `linear-gradient(135deg, ${colors.action}12, ${colors.action}05)`,
                            padding: "0.875rem",
                            borderRadius: "0.75rem",
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                            <Scale size={14} style={{ color: colors.action }} />
                            <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
                                {t("Max Weight")}
                            </span>
                        </div>
                        <p style={{ fontSize: "0.9375rem", color: colors.textPrimary, fontWeight: "700" }}>
                            {category.raw?.max_weight ?? '-'} {category.raw?.weight_uom_name || ''}
                        </p>
                    </div>
                    <div
                        style={{
                            background: `linear-gradient(135deg, ${colors.action}12, ${colors.action}05)`,
                            padding: "0.875rem",
                            borderRadius: "0.75rem",
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                            <MapPin size={14} style={{ color: colors.action }} />
                            <span style={{ fontSize: "0.75rem", color: colors.textSecondary, fontWeight: "600" }}>
                                {t("Locations")}
                            </span>
                        </div>
                        <p style={{ fontSize: "0.9375rem", color: colors.textPrimary, fontWeight: "700" }}>
                            {m2mSummary(category.raw?.location_ids)}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "1rem",
                        borderTop: `1px solid ${colors.border}`,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Package size={16} style={{ color: colors.textSecondary }} />
                        <span style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>
                            {t('Package Caps')}: <span style={{ fontWeight: "600", color: colors.textPrimary }}>{m2mSummary(category.raw?.package_capacity_ids)}</span>
                        </span>
                    </div>
                     <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Boxes size={16} style={{ color: colors.textSecondary }} />
                        <span style={{ fontSize: "0.875rem", color: colors.textSecondary, fontWeight: "500" }}>
                           {t('Product Caps')}: <span style={{ fontWeight: "600", color: colors.textPrimary }}>{m2mSummary(category.raw?.product_capacity_ids)}</span>
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}