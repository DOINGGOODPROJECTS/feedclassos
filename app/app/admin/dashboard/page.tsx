"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatCards } from "@/components/stat-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBackendDashboardKpis } from "@/lib/backendApi";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function AdminDashboardPage() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<null | Awaited<ReturnType<typeof getBackendDashboardKpis>>>(null);
  useEffect(() => {
    getBackendDashboardKpis()
      .then((data) => {
        setKpis(data);
        setLoading(false);
      })
      .catch((error) => {
        push({ title: "Failed to load dashboard", description: error.message, variant: "danger" });
        setLoading(false);
      });
  }, [push]);

  const trendCards = kpis
    ? [
        {
          title: "Meal utilization trend",
          helper: "Last 6 weeks",
          values: kpis.trends.mealUtilization.map((entry) => entry.value),
        },
        {
          title: "Subscription renewals trend",
          helper: "Renewals per cycle",
          values: kpis.trends.subscriptionRenewals.map((entry) => entry.value),
        },
        {
          title: "Cost per meal trend",
          helper: "Avg cost per meal",
          values: kpis.trends.costPerMeal.map((entry) => entry.value),
        },
        {
          title: "Payment success rate",
          helper: "Approved vs attempted",
          values: kpis.trends.paymentSuccessRate.map((entry) => entry.value),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Admin Dashboard"
        description="Program-wide KPIs for meals, revenue, costs, and operational performance."
      />

      {loading || !kpis ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : (
        <StatCards
          items={[
            { label: "Meals Today", value: kpis.mealsToday.toString(), helper: "Live service counts" },
            {
              label: "Grace Meals Today",
              value: kpis.graceMealsToday.toString(),
              helper: "7-day free window",
            },
            { label: "Meals This Month", value: kpis.mealsMonth.toString(), helper: "Rolling 30 days" },
            { label: "Active Subscriptions", value: kpis.activeSubscriptions.toString(), helper: "Current cycle" },
            { label: "Expiring Soon", value: kpis.expiringSoon.toString(), helper: "Next 10 days" },
            { label: "Children on Grace", value: kpis.graceActive.toString(), helper: "Within 7 days" },
            {
              label: "Revenue (Month)",
              value: formatCurrency(kpis.revenueMonth),
              helper: "Subscription purchases",
            },
            {
              label: "Supplier Cost (Month)",
              value: formatCurrency(kpis.supplierCostMonth),
              helper: "Invoices",
            },
            {
              label: "Cost per Meal",
              value: formatCurrency(Math.round(kpis.costPerMeal)),
              helper: "Avg across schools",
            },
          ]}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {trendCards.map((card, index) => {
          const width = 420;
          const height = 140;
          const paddingX = 18;
          const paddingTop = 24;
          const paddingBottom = 28;
          const values = card.values;
          const max = Math.max(...values);
          const min = Math.min(...values);
          const range = Math.max(max - min, 1);
          const step = (width - paddingX * 2) / (values.length - 1);
          const points = values.map((value, i) => {
            const x = paddingX + i * step;
            const y = paddingTop + (height - paddingTop - paddingBottom) * (1 - (value - min) / range);
            return { x, y };
          });
          const linePath = points
            .map((point, i) => `${i === 0 ? "M" : "L"}${point.x},${point.y}`)
            .join(" ");
          const areaPath = `${linePath} L${points[points.length - 1].x},${height - paddingBottom} L${points[0].x},${height - paddingBottom} Z`;

          const palette = [
            { line: "#2563eb", fill: "rgba(37, 99, 235, 0.18)" },
            { line: "#0f766e", fill: "rgba(15, 118, 110, 0.18)" },
            { line: "#f97316", fill: "rgba(249, 115, 22, 0.18)" },
            { line: "#7c3aed", fill: "rgba(124, 58, 237, 0.18)" },
          ];
          const color = palette[index % palette.length];
          const gradientId = `trend-gradient-${index}`;

          return (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle className="text-base">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-36 w-full"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color.line} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color.line} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill={`url(#${gradientId})`} />
                    <path d={linePath} fill="none" stroke={color.line} strokeWidth="2.5" />
                    {points.map((point, i) => (
                      <g key={i}>
                        <text
                          x={point.x}
                          y={Math.max(point.y - 8, 12)}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#475569"
                        >
                          {values[i]}
                        </text>
                        <circle cx={point.x} cy={point.y} r="3.2" fill={color.line} />
                        <text
                          x={point.x}
                          y={height - 6}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#94a3b8"
                        >
                          {kpis?.trends[
                            index === 0
                              ? "mealUtilization"
                              : index === 1
                                ? "subscriptionRenewals"
                                : index === 2
                                  ? "costPerMeal"
                                  : "paymentSuccessRate"
                          ][i]?.label ?? ""}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
                <p className="mt-3 text-xs text-slate-500">{card.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}
