"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatCards } from "@/components/stat-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardKpis } from "@/lib/mockApi";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<null | Awaited<ReturnType<typeof getDashboardKpis>>>(null);
  useEffect(() => {
    getDashboardKpis().then((data) => {
      setKpis(data);
      setLoading(false);
    });
  }, []);

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
            { label: "Meals This Month", value: kpis.mealsMonth.toString(), helper: "Rolling 30 days" },
            { label: "Active Subscriptions", value: kpis.activeSubscriptions.toString(), helper: "Current cycle" },
            { label: "Expiring Soon", value: kpis.expiringSoon.toString(), helper: "Next 10 days" },
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
        {[
          {
            title: "Meal utilization trend",
            helper: "Last 6 weeks",
            values: [62, 68, 71, 76, 79, 83],
          },
          {
            title: "Subscription renewals trend",
            helper: "Renewals per cycle",
            values: [120, 132, 128, 140, 146, 155],
          },
          {
            title: "Cost per meal trend",
            helper: "Avg cost per meal",
            values: [1.12, 1.09, 1.06, 1.08, 1.04, 1.02],
          },
          {
            title: "Payment success rate",
            helper: "Approved vs attempted",
            values: [88, 90, 92, 91, 93, 95],
          },
        ].map((card, index) => {
          const width = 420;
          const height = 120;
          const paddingX = 18;
          const paddingY = 16;
          const values = card.values;
          const max = Math.max(...values);
          const min = Math.min(...values);
          const range = Math.max(max - min, 1);
          const step = (width - paddingX * 2) / (values.length - 1);
          const points = values.map((value, i) => {
            const x = paddingX + i * step;
            const y = paddingY + (height - paddingY * 2) * (1 - (value - min) / range);
            return { x, y };
          });
          const linePath = points
            .map((point, i) => `${i === 0 ? "M" : "L"}${point.x},${point.y}`)
            .join(" ");
          const areaPath = `${linePath} L${points[points.length - 1].x},${height - paddingY} L${points[0].x},${height - paddingY} Z`;

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
                    className="h-28 w-full"
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
                      <circle key={i} cx={point.x} cy={point.y} r="3.2" fill={color.line} />
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
