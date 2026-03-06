"use client";

import { useEffect, useState } from "react";
import { getDonorKpis } from "@/lib/mockApi";
import { PageHeader } from "@/components/page-header";
import { StatCards } from "@/components/stat-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, shortenHash } from "@/lib/utils";

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
            { label: "Anchored days", value: kpis.anchoredDays.toString() },
          ]}
        />
      )}

      {kpis?.latestAnchor && (
        <Card>
          <CardHeader>
            <CardTitle>Latest blockchain proof</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Date</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(kpis.latestAnchor.anchor_date)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Meals anchored</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{kpis.latestAnchor.meal_count}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Merkle root</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{shortenHash(kpis.latestAnchor.merkle_root)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">CELO tx</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{shortenHash(kpis.latestAnchor.celo_tx_hash)}</p>
            </div>
          </CardContent>
        </Card>
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

      {kpis?.latestAnchor && (
        <Card>
          <CardHeader>
            <CardTitle>Proof-of-impact note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">CELO anchored</Badge>
              <span>Daily meal records are hashed off-chain and anchored without publishing PII.</span>
            </div>
            <p>
              Each anchor creates independently auditable proof that meals were served for a specific school date while
              keeping child identities private.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
