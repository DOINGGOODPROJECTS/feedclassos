"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllData, importChildrenCsv } from "@/lib/mockApi";
import { Child, ChildSubscription, ClassRoom, Guardian, School } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function AdminChildrenPage() {
  const { push } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [subscriptions, setSubscriptions] = useState<ChildSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [importSchool, setImportSchool] = useState("");
  const [importClass, setImportClass] = useState("");

  useEffect(() => {
    getAllData().then((data) => {
      setChildren(data.children);
      setSchools(data.schools);
      setClasses(data.classes);
      setGuardians(data.guardians);
      setSubscriptions(data.child_subscriptions);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return children.filter((child) =>
      `${child.student_id} ${child.full_name}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [children, query]);

  const parsePreview = () => {
    const lines = csvText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const data = lines.map((line) => line.split(",").map((item) => item.trim()));
    setPreview(data);
  };

  const handleImport = async () => {
    if (!importSchool || !importClass) {
      push({ title: "Select school + class", description: "Choose a context before importing.", variant: "danger" });
      return;
    }
    const imported = await importChildrenCsv(csvText, importSchool, importClass);
    setChildren((prev) => [...prev, ...imported]);
    setCsvText("");
    setPreview([]);
    push({ title: "Import complete", description: `${imported.length} children added.`, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Children"
        description="Student registry plus CSV import flow with validation and reject reporting."
      />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>All children</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or ID" />
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No children found"
                description="Import a CSV to add students to the system."
                action={
                  <Button
                    variant="outline"
                    onClick={() =>
                      push({
                        title: "CSV import",
                        description: "Paste CSV data in the import panel on the right.",
                      })
                    }
                  >
                    Go to import
                  </Button>
                }
              />
            ) : (
              <DataTable
                columns={[
                  { header: "Student ID", render: (row: Child) => row.student_id },
                  { header: "Name", render: (row: Child) => row.full_name },
                  {
                    header: "Class",
                    render: (row: Child) => classes.find((cls) => cls.id === row.class_id)?.name ?? "-",
                  },
                  {
                    header: "School",
                    render: (row: Child) => schools.find((school) => school.id === row.school_id)?.name ?? "-",
                  },
                  {
                    header: "Guardian phone",
                    render: (row: Child) =>
                      guardians.find((guardian) => guardian.id === row.guardian_id)?.phone ?? "-",
                  },
                  {
                    header: "Status",
                    render: (row: Child) => (row.active ? "Active" : "Inactive"),
                  },
                  {
                    header: "Subscription",
                    render: (row: Child) =>
                      subscriptions.find((sub) => sub.child_id === row.id)?.status ?? "NONE",
                  },
                  {
                    header: "Meals remaining",
                    render: (row: Child) =>
                      subscriptions.find((sub) => sub.child_id === row.id)?.meals_remaining ?? 0,
                  },
                  {
                    header: "Actions",
                    render: (row: Child) => (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/app/admin/children/${row.id}`}>View child</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            push({
                              title: "Payment link sent",
                              description: `Sent to guardian of ${row.full_name}.`,
                            })
                          }
                        >
                          Send payment link
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={filtered}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={importSchool} onValueChange={setImportSchool}>
              <SelectTrigger>
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={importClass} onValueChange={setImportClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes
                  .filter((cls) => !importSchool || cls.school_id === importSchool)
                  .map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="student_id, full_name, guardian_name, guardian_phone"
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={parsePreview}>
                Parse preview
              </Button>
              <Button onClick={handleImport}>Import</Button>
            </div>
            {preview.length > 0 && (
              <div className="rounded-2xl border border-slate-200 p-3 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Preview</p>
                {preview.map((row, index) => (
                  <div key={index} className="mt-1 flex flex-wrap gap-2">
                    {row.map((cell, cellIndex) => (
                      <span key={cellIndex} className="rounded-full bg-slate-100 px-2 py-1">
                        {cell}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
