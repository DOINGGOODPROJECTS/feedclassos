"use client";

import { useEffect, useState } from "react";
import { getDonorKpis } from "@/lib/mockApi";
import { PageHeader } from "@/components/page-header";
import { StatCards } from "@/components/stat-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function DonorDashboardPage() {
  const [kpis, setKpis] = useState<null | Awaited<ReturnType<typeof getDonorKpis>>>(null);

  useEffect(() => {
    getDonorKpis().then(setKpis);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donor Dashboard"
        description="Aggregate impact metrics with strict PII masking."
      />

      {kpis && (
        <StatCards
          items={[
            { label: "Total meals served", value: kpis.totalMeals.toString() },
            { label: "Children reached", value: kpis.totalChildren.toString() },
            { label: "Funds received", value: formatCurrency(kpis.fundsReceived) },
            { label: "Cost per meal", value: formatCurrency(Math.round(kpis.costPerMeal)) },
          ]}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {[
          "Meals served trend",
          "Funds received trend",
          "Cost per meal trend",
          "Schools supported trend",
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
