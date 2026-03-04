"use client";

import { useEffect, useState } from "react";
import { getPaymentIntents, simulateWebhookSuccess } from "@/lib/mockApi";
import { PaymentIntent } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const { push } = useToast();
  const [intents, setIntents] = useState<PaymentIntent[]>([]);

  useEffect(() => {
    getPaymentIntents().then(setIntents);
  }, []);

  const handleSimulate = async (intent: PaymentIntent) => {
    const externalTx = `EXT-${intent.id}`;
    const result = await simulateWebhookSuccess(externalTx, intent.id);
    if (result.status === "processed") {
      setIntents((prev) =>
        prev.map((entry) => (entry.id === intent.id ? { ...entry, status: "PAID" } : entry))
      );
      push({ title: "Webhook processed", description: externalTx, variant: "success" });
    } else {
      push({ title: "Webhook ignored", description: "Idempotent replay", variant: "default" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Payment intents, status tracking, and webhook simulation."
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <DataTable
          columns={[
            { header: "Reference", render: (row: PaymentIntent) => row.reference },
            { header: "Child", render: (row: PaymentIntent) => row.child_id },
            { header: "Plan", render: (row: PaymentIntent) => row.plan_id },
            { header: "Amount", render: (row: PaymentIntent) => formatCurrency(row.amount) },
            { header: "Status", render: (row: PaymentIntent) => row.status },
            {
              header: "Actions",
              render: (row: PaymentIntent) => (
                <Button variant="outline" size="sm" onClick={() => handleSimulate(row)}>
                  Simulate webhook success
                </Button>
              ),
            },
          ]}
          data={intents}
        />
      </div>
    </div>
  );
}
