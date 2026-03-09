"use client";

import { useEffect, useMemo, useState } from "react";
import { getClasses, getPaymentTransactionsForSchool } from "@/lib/mockApi";
import { ClassRoom, PaymentTransactionRecord } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatCards } from "@/components/stat-cards";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type TransactionFilter = "ALL" | "PAID" | "FAILED";

export default function SchoolAdminTransactionsPage() {
  const schoolId = useAppStore((state) => state.supervisorSchoolId);
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<TransactionFilter>("ALL");

  useEffect(() => {
    getPaymentTransactionsForSchool(schoolId).then(setTransactions);
    getClasses().then((data) => setClasses(data.filter((entry) => entry.school_id === schoolId)));
  }, [schoolId]);

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((entry) => {
        if (classId !== "ALL" && entry.class_id !== classId) return false;
        if (statusFilter !== "ALL" && entry.status !== statusFilter) return false;
        return true;
      }),
    [transactions, classId, statusFilter]
  );

  const paidCount = filteredTransactions.filter((entry) => entry.status === "PAID").length;
  const failedCount = filteredTransactions.filter((entry) => entry.status === "FAILED").length;
  const totalValue = filteredTransactions.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Admin · Transactions"
        description="Successful and failed payment transactions for your school, filtered by class."
      />

      <StatCards
        items={[
          { label: "Transactions", value: filteredTransactions.length.toString(), helper: "Current class filter" },
          { label: "Successful", value: paidCount.toString(), helper: "Paid payments" },
          { label: "Failed", value: failedCount.toString(), helper: "Needs retry" },
          { label: "Value", value: formatCurrency(totalValue), helper: "Visible records" },
        ]}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-[220px,1fr]">
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All classes</SelectItem>
                {classes.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {(["ALL", "PAID", "FAILED"] as TransactionFilter[]).map((value) => (
                <Button
                  key={value}
                  variant={statusFilter === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(value)}
                >
                  {value === "ALL" ? "All" : value === "PAID" ? "Successful" : "Failed"}
                </Button>
              ))}
            </div>
          </div>

          <DataTable
            columns={[
              { header: "Reference", render: (row: PaymentTransactionRecord) => row.reference },
              { header: "Child", render: (row: PaymentTransactionRecord) => row.child_name },
              { header: "Class", render: (row: PaymentTransactionRecord) => row.class_name },
              { header: "Guardian", render: (row: PaymentTransactionRecord) => row.guardian_name },
              { header: "WhatsApp", render: (row: PaymentTransactionRecord) => row.guardian_phone },
              { header: "Plan", render: (row: PaymentTransactionRecord) => row.plan_name },
              { header: "Amount", render: (row: PaymentTransactionRecord) => formatCurrency(row.amount) },
              { header: "Status", render: (row: PaymentTransactionRecord) => row.status },
              { header: "Created", render: (row: PaymentTransactionRecord) => formatDateTime(row.created_at) },
            ]}
            data={filteredTransactions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
