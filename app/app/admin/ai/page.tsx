"use client";

import { useEffect, useState } from "react";
import { getAiReports } from "@/lib/mockApi";
import { AiReport, AnomalyAlert } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export default function AdminAiPage() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [reports, setReports] = useState<AiReport[]>([]);

  useEffect(() => {
    getAiReports().then((data) => {
      setAlerts(data.alerts);
      setReports(data.reports);
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="Forecasts, anomaly alerts, and executive summary placeholders (mocked)."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>7-day meal forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 rounded-2xl border border-dashed border-slate-200 bg-slate-50" />
            <p className="mt-3 text-xs text-slate-400">Moving average placeholder</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Anomaly alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <Badge variant={alert.severity === "HIGH" ? "danger" : "warning"}>{alert.severity}</Badge>
                  <span className="text-xs text-slate-400">{formatDateTime(alert.created_at)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly executive summary</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.map((report) => (
            <div key={report.id}>
              <p className="text-sm text-slate-500">Generated {formatDateTime(report.created_at)}</p>
              <p className="mt-3 text-sm text-slate-700">{report.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
