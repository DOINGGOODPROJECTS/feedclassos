"use client";

import { useEffect, useMemo, useState } from "react";
import { getLedger } from "@/lib/mockApi";
import { Transaction } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { formatDateTime } from "@/lib/utils";

export default function AdminLedgerPage() {
  const [ledger, setLedger] = useState<Transaction[]>([]);
  const [childId, setChildId] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    getLedger().then(setLedger);
  }, []);

  const filtered = useMemo(() => {
    return ledger.filter((entry) => {
      if (childId && !entry.child_id.includes(childId)) return false;
      if (type && entry.type !== type) return false;
      if (from && entry.created_at < from) return false;
      if (to && entry.created_at > to) return false;
      return true;
    });
  }, [ledger, childId, type, from, to]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger"
        description="Append-only transactions with filters and export-ready views."
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Child ID" value={childId} onChange={(e) => setChildId(e.target.value)} />
          <Input placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        <DataTable
          columns={[
            { header: "Child", render: (row: Transaction) => row.child_id },
            { header: "Type", render: (row: Transaction) => row.type },
            { header: "Amount", render: (row: Transaction) => row.amount },
            { header: "Metadata", render: (row: Transaction) => Object.values(row.metadata).join(" ") },
            { header: "Created", render: (row: Transaction) => formatDateTime(row.created_at) },
          ]}
          data={filtered}
        />
      </div>
    </div>
  );
}
