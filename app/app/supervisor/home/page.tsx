"use client";

import { useEffect, useState } from "react";
import { getSupervisorOverview, getValidationLogs, getSchools } from "@/lib/mockApi";
import { ValidationLog, School } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatCards } from "@/components/stat-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SupervisorHomePage() {
  const schoolId = useAppStore((state) => state.supervisorSchoolId);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getSupervisorOverview>> | null>(null);
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [school, setSchool] = useState<School | null>(null);

  useEffect(() => {
    getSupervisorOverview(schoolId).then(setOverview);
    getValidationLogs().then(setLogs);
    getSchools().then((data) => setSchool(data.find((entry) => entry.id === schoolId) ?? null));
  }, [schoolId]);

  const failedLogs = logs.filter((log) => log.result === "FAILED").slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisor Home"
        description={school ? `Daily ops dashboard · ${school.name}` : "Loading school"}
      />

      {overview && (
        <StatCards
          items={[
            { label: "Meals served today", value: overview.todayMeals.toString(), helper: "Live" },
            { label: "Open problems", value: overview.problems.length.toString(), helper: "Needs attention" },
          ]}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meals by class</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview?.byClass.map((item) => (
              <div key={item.class_id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{item.class_name}</span>
                <Badge variant="secondary">{item.total}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Failed scan reasons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {failedLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No failures logged today.</p>
            ) : (
              failedLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-sm text-slate-700">{log.reason_code}</span>
                  <Badge variant="warning">{log.qr_payload}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open problems</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overview?.problems.map((entry) => (
            <div key={entry.child.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
              <span className="text-sm text-slate-700">{entry.child.full_name}</span>
              <Badge variant="danger">{entry.reason}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
