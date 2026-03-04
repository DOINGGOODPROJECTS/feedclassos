"use client";

import { useEffect, useState } from "react";
import { getMessageHealth, getMessageLogs, resendFailedMessages } from "@/lib/mockApi";
import { MessageLog } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { StatCards } from "@/components/stat-cards";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";

export default function AdminNotificationsPage() {
  const { push } = useToast();
  const [health, setHealth] = useState<{ pending: number; sent: number; failed: number } | null>(null);
  const [logs, setLogs] = useState<MessageLog[]>([]);

  useEffect(() => {
    getMessageHealth().then(setHealth);
    getMessageLogs().then(setLogs);
  }, []);

  const handleResend = async () => {
    await resendFailedMessages();
    const updated = await getMessageLogs();
    setLogs(updated);
    push({ title: "Resent failed messages", description: "Mock resend complete", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Message health, delivery logs, and resend controls (mocked)."
        actions={
          <Button variant="outline" onClick={handleResend}>
            Resend failed
          </Button>
        }
      />

      {health && (
        <StatCards
          items={[
            { label: "Pending", value: health.pending.toString(), helper: "Queued" },
            { label: "Sent", value: health.sent.toString(), helper: "Delivered" },
            { label: "Failed", value: health.failed.toString(), helper: "Needs retry" },
          ]}
        />
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <DataTable
          columns={[
            { header: "Status", render: (row: MessageLog) => row.status },
            { header: "Detail", render: (row: MessageLog) => row.detail },
            { header: "Time", render: (row: MessageLog) => formatDateTime(row.created_at) },
          ]}
          data={logs}
        />
      </div>
    </div>
  );
}
