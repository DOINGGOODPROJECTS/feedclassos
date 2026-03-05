"use client";

import { useEffect, useState } from "react";
import { getSupplierInvoices, getSchools, markInvoicePaid } from "@/lib/mockApi";
import { SupplierInvoice, School } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function AdminInvoicesPage() {
  const { push } = useToast();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    getSupplierInvoices().then(setInvoices);
    getSchools().then(setSchools);
  }, []);

  const handleMarkPaid = async (invoiceId: string) => {
    const updated = await markInvoicePaid(invoiceId);
    if (updated) {
      setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? updated : inv)));
      push({ title: "Invoice marked paid", description: invoiceId, variant: "success" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Admin · Supplier Invoices"
        description="Track monthly supplier invoices and cost per meal signals."
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <DataTable
          columns={[
            { header: "Invoice", render: (row: SupplierInvoice) => row.id },
            {
              header: "School",
              render: (row: SupplierInvoice) => schools.find((school) => school.id === row.school_id)?.name ?? "-",
            },
            { header: "Month", render: (row: SupplierInvoice) => row.month },
            { header: "Amount", render: (row: SupplierInvoice) => formatCurrency(row.amount) },
            { header: "Status", render: (row: SupplierInvoice) => row.status },
            {
              header: "Actions",
              render: (row: SupplierInvoice) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkPaid(row.id)}
                  disabled={row.status === "PAID"}
                >
                  Mark paid
                </Button>
              ),
            },
          ]}
          data={invoices}
        />
      </div>
    </div>
  );
}
