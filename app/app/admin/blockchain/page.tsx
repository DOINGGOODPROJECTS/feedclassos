"use client";

import { useEffect, useState } from "react";
import { anchorMealsToBlockchain, getBlockchainOverview } from "@/lib/mockApi";
import { PageHeader } from "@/components/page-header";
import { StatCards } from "@/components/stat-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate, formatDateTime, shortenHash, todayISO } from "@/lib/utils";

export default function AdminBlockchainPage() {
  const { push } = useToast();
  const [anchorDate, setAnchorDate] = useState(todayISO());
  const [overview, setOverview] = useState<null | Awaited<ReturnType<typeof getBlockchainOverview>>>(null);

  useEffect(() => {
    getBlockchainOverview().then(setOverview);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Admin · Blockchain"
        description="Anchor daily meal records to a CELO-style verification layer using Merkle-root proofs and financing snapshots."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={anchorDate}
              onChange={(event) => setAnchorDate(event.target.value)}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <Button
              onClick={async () => {
                const anchor = await anchorMealsToBlockchain(anchorDate);
                if (!anchor) {
                  push({
                    title: "No meals to anchor",
                    description: "There are no served meals for the selected date.",
                    variant: "danger",
                  });
                  return;
                }
                const data = await getBlockchainOverview();
                setOverview(data);
                push({
                  title: "Blockchain anchor created",
                  description: `CELO tx ${shortenHash(anchor.celo_tx_hash)}`,
                  variant: "success",
                });
              }}
            >
              Anchor date
            </Button>
          </div>
        }
      />

      {overview && (
        <StatCards
          items={[
            { label: "Anchored days", value: overview.anchoredDays.toString(), helper: "Daily proof batches" },
            { label: "Anchored meals", value: overview.anchoredMeals.toString(), helper: "Merkle-root coverage" },
            { label: "Coverage", value: `${overview.anchoredCoverage}%`, helper: "Meal dates anchored" },
            {
              label: "Financing anchored",
              value: formatCurrency(overview.financingTotal),
              helper: "Transparent financing snapshot",
            },
          ]}
        />
      )}

      {overview?.latestAnchor && (
        <Card>
          <CardHeader>
            <CardTitle>Latest CELO anchor</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Anchor date</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(overview.latestAnchor.anchor_date)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Merkle root</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{shortenHash(overview.latestAnchor.merkle_root)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">CELO tx hash</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{shortenHash(overview.latestAnchor.celo_tx_hash)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Block number</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{overview.latestAnchor.celo_block_number}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Anchor history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview?.anchors.map((anchor) => (
              <div key={anchor.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(anchor.anchor_date)}</p>
                    <p className="text-xs text-slate-500">{anchor.meal_count} meals across {anchor.school_ids.length} school(s)</p>
                  </div>
                  <Badge variant="success">{anchor.status}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Merkle root</p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-900">{anchor.merkle_root}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">CELO tx hash</p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-900">{anchor.celo_tx_hash}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">Financing anchored</p>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(anchor.financing_total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Supplier cost snapshot</p>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(anchor.supplier_cost_total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Recorded on</p>
                    <p className="text-sm font-semibold text-slate-900">{formatDateTime(anchor.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              Operations remain on the app layer: QR scanning, parent payments, and low-connectivity school workflows.
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              Daily meal serves are hashed into Merkle leaves, aggregated into one root, and anchored as a CELO transaction hash.
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              No personally identifiable information is published on-chain. Only hashed daily proofs and financing totals are exposed.
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              Donors and partners can independently verify that a specific batch of meals was anchored for a given school day.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
