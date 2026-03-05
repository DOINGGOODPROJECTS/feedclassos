"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  createPaymentIntent,
  getAllData,
  getChildById,
  getChildQr,
  getLedger,
  getSubscriptionPlans,
} from "@/lib/mockApi";
import { Child, ChildQr, ChildSubscription, SubscriptionPlan, Transaction } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function ChildDetailClient() {
  const { push } = useToast();
  const params = useParams();
  const childId = params.id as string;
  const [child, setChild] = useState<Child | null>(null);
  const [qr, setQr] = useState<ChildQr | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [ledger, setLedger] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<ChildSubscription | null>(null);

  useEffect(() => {
    getChildById(childId).then(setChild);
    getChildQr(childId).then(setQr);
    getSubscriptionPlans().then(setPlans);
    getLedger().then((entries) => setLedger(entries.filter((tx) => tx.child_id === childId)));
    getAllData().then((data) => {
      setSubscription(data.child_subscriptions.find((entry) => entry.child_id === childId) ?? null);
    });
  }, [childId]);

  if (!child) {
    return <div className="text-sm text-slate-500">Loading child profile...</div>;
  }

  const activePlan = plans.find((plan) => plan.active) ?? plans[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={child.full_name}
        description={`Program Admin view · Student ID: ${child.student_id} · QR, subscription, and ledger overview`}
        actions={<Badge variant={child.active ? "success" : "danger"}>{child.active ? "Active" : "Inactive"}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>QR profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-32 w-32 rounded-2xl border border-dashed border-slate-200 bg-slate-50" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Payload</p>
                <p className="text-sm text-slate-500">{qr?.qr_payload ?? "Not generated"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => push({ title: "QR opened", description: "Mock preview" })}>
                View QR
              </Button>
              <Button variant="outline" onClick={() => push({ title: "Badge queued", description: "Mock print" })}>
                Print badge
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-500">Current status</p>
                  <p className="text-lg font-semibold text-slate-900">{subscription.status}</p>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2">
                  <span className="text-xs text-slate-500">Meals remaining</span>
                  <span className="text-sm font-semibold text-slate-800">{subscription.meals_remaining}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {subscription.start_date} → {subscription.end_date}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No active subscription.</p>
            )}
            {activePlan ? (
              <div>
                <p className="text-sm text-slate-500">Recommended plan</p>
                <p className="text-lg font-semibold text-slate-900">{activePlan.name}</p>
                <p className="text-sm text-slate-500">{formatCurrency(activePlan.price)} per cycle</p>
              </div>
            ) : null}
            <Button
              onClick={async () => {
                if (!activePlan) return;
                await createPaymentIntent(childId, activePlan.id);
                push({ title: "Payment intent created", description: activePlan.name, variant: "success" });
              }}
            >
              Create payment intent
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger snippet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ledger.length === 0 ? (
            <p className="text-sm text-slate-500">No transactions yet.</p>
          ) : (
            ledger.slice(0, 4).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{entry.type}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{entry.amount}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
