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
        title="Admin Dashboard"
        description="KPI snapshots and trend placeholders for meals, revenue, and costs."
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
          "Meal utilization trend",
          "Subscription renewals trend",
          "Cost per meal trend",
          "Payment success rate",
        ].map((title) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 rounded-2xl border border-dashed border-slate-200 bg-slate-50" />
              <p className="mt-3 text-xs text-slate-400">Trend placeholder</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
