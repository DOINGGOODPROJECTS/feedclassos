"use client";

import { useEffect, useState } from "react";
import { getProblemsForSchool } from "@/lib/mockApi";
import { Child } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SupervisorProblemsPage() {
  const schoolId = useAppStore((state) => state.supervisorSchoolId);
  const [problems, setProblems] = useState<Array<{ child: Child; reason: string }>>([]);

  useEffect(() => {
    getProblemsForSchool(schoolId).then((data) => setProblems(data as Array<{ child: Child; reason: string }>));
  }, [schoolId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Admin · Problems"
        description="Scan failures and blockers that need attention."
      />

      <Card>
        <CardContent className="space-y-3 p-6">
          {problems.length === 0 ? (
            <p className="text-sm text-slate-500">No problems detected.</p>
          ) : (
            problems.map((entry) => (
              <div key={entry.child.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <span className="text-sm font-semibold text-slate-800">{entry.child.full_name}</span>
                <Badge variant="warning">{entry.reason}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
