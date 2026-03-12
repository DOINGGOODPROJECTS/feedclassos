"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getBackendChildren,
  getBackendClasses,
  getBackendPaymentIntents,
  getBackendSchools,
  getBackendSubscriptionPlans,
  sendBackendPaymentLink,
} from "@/lib/backendApi";
import { Child, ClassRoom, Guardian, PaymentIntent, School, SubscriptionPlan } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SchoolAdminPaymentsPage() {
  const { push } = useToast();
  const schoolId = useAppStore((state) => state.supervisorSchoolId);
  const [intents, setIntents] = useState<PaymentIntent[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<string>("ALL");

  useEffect(() => {
    Promise.all([
      getBackendPaymentIntents(schoolId),
      getBackendClasses(schoolId),
      getBackendChildren(),
      getBackendSubscriptionPlans(),
      getBackendSchools(),
    ]).then(([intentData, classData, childData, planData, schoolData]) => {
      setIntents(intentData);
      setClasses(classData);
      setChildren(childData.children);
      setGuardians(childData.guardians);
      setPlans(planData);
      setSchools(schoolData);
    });
  }, [schoolId]);

  const school = useMemo(() => schools.find((entry) => entry.id === schoolId) ?? null, [schoolId, schools]);
  const filteredIntents = useMemo(
    () =>
      intents.filter((intent) => {
        if (classId === "ALL") {
          return true;
        }
        const child = children.find((entry) => entry.id === intent.child_id);
        return child?.class_id === classId;
      }),
    [intents, children, classId]
  );

  const handleResend = async (intent: PaymentIntent) => {
    const child = children.find((entry) => entry.id === intent.child_id);
    if (!child) {
      return;
    }
    try {
      const result = await sendBackendPaymentLink(intent.id);
      setIntents((prev) => {
        const remaining = prev.filter((entry) => entry.id !== result.intent.id);
        return [...remaining, result.intent];
      });
      push({
        title: "Payment link sent",
        description: `${child.full_name} guardian notified via ${result.channel}.`,
        variant: "success",
      });
    } catch (error) {
      push({
        title: "Resend failed",
        description: error instanceof Error ? error.message : "Unable to send payment link.",
        variant: "danger",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Admin · Payments"
        description={school ? `Track payment links for ${school.name}.` : "Track payment links for your school."}
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="mb-4 max-w-[240px]">
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
        </div>

        <DataTable
          columns={[
            {
              header: "Reference",
              render: (row: PaymentIntent) => row.reference,
            },
            {
              header: "Child",
              render: (row: PaymentIntent) =>
                children.find((entry) => entry.id === row.child_id)?.full_name ?? row.child_id,
            },
            {
              header: "Guardian",
              render: (row: PaymentIntent) => {
                const child = children.find((entry) => entry.id === row.child_id);
                return guardians.find((entry) => entry.id === child?.guardian_id)?.name ?? "-";
              },
            },
            {
              header: "WhatsApp",
              render: (row: PaymentIntent) => {
                const child = children.find((entry) => entry.id === row.child_id);
                return guardians.find((entry) => entry.id === child?.guardian_id)?.phone ?? "-";
              },
            },
            {
              header: "Plan",
              render: (row: PaymentIntent) =>
                plans.find((entry) => entry.id === row.plan_id)?.name ?? row.plan_id,
            },
            { header: "Amount", render: (row: PaymentIntent) => formatCurrency(row.amount) },
            { header: "Status", render: (row: PaymentIntent) => row.status },
            {
              header: "Payment link",
              render: (row: PaymentIntent) => (
                <a
                  href={row.payment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-600 underline-offset-2 hover:underline"
                >
                  Open link
                </a>
              ),
            },
            {
              header: "Actions",
              render: (row: PaymentIntent) => (
                <Button variant="outline" size="sm" onClick={() => handleResend(row)}>
                  Send payment link
                </Button>
              ),
            },
          ]}
          data={filteredIntents}
        />
      </div>
    </div>
  );
}
