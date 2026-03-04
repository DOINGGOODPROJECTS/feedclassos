"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { navByRole } from "@/lib/navigation";
import { useAppStore } from "@/lib/store";

const modules = [
  {
    title: "Meal Operations",
    description: "Serve flow, scan validation, and daily meal tracking.",
  },
  {
    title: "Subscriptions",
    description: "Plans, payments, and guardian outreach with ledger visibility.",
  },
  {
    title: "Program Health",
    description: "Alerts, exports, AI summaries, and supplier invoices.",
  },
];

const roadmapHighlights = [
  {
    title: "Registry + CSV Imports",
    description: "Schools, classes, children, and bulk onboarding with reject reports.",
  },
  {
    title: "QR + Badge Printing",
    description: "QR preview, badge PDFs, and print-ready layouts.",
  },
  {
    title: "Plans, Payments, Ledger",
    description: "Subscription setup, payment intents, and immutable ledger views.",
  },
  {
    title: "Supervisor Scanner PWA",
    description: "Scan, today, and history routes with fast feedback and retry UX.",
  },
  {
    title: "Dashboards",
    description: "Admin, school, and donor dashboards with role-safe visibility.",
  },
  {
    title: "Messaging & Alerts",
    description: "Notification health, delivery logs, and AI insight placeholders.",
  },
];

const keyUsers = [
  {
    title: "Platform Admin",
    description: "Manages plans, payments, ledger, exports, and system-wide performance.",
  },
  {
    title: "School Supervisor",
    description: "Runs daily operations, handles scan failures, and resolves issues.",
  },
  {
    title: "Meal Server (Operator)",
    description: "Validates QR scans quickly with clear success/fail feedback.",
  },
  {
    title: "Donor",
    description: "Views aggregate-only impact metrics with strict PII masking.",
  },
  {
    title: "Support",
    description: "Monitors reconciliation, messaging, and platform health signals.",
  },
];

export default function AppOverviewPage() {
  const role = useAppStore((state) => state.role);
  const quickLinks = useMemo(() => navByRole[role].slice(0, 6), [role]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome to FeedClass Beta"
        description="Frontend build aligned to the Phase 2 roadmap with mocked data and role-based flows."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title}>
            <CardHeader>
              <CardTitle>{module.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Frontend Roadmap Highlights</h2>
        <p className="text-sm text-slate-500">UI-first screens you can click through today.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadmapHighlights.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Key Users</h2>
        <p className="text-sm text-slate-500">Role experiences are intentionally scoped and secured.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {keyUsers.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Quick Links</h2>
        <p className="text-sm text-slate-500">Based on your current role.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
