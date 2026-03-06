"use client";

import { useEffect, useState } from "react";
import { getSchools, getSupervisorChildrenLookup, getSupervisorOverview } from "@/lib/mockApi";
import { School, SupervisorChildLookupItem } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function ChildLookupPanel() {
  const schoolId = useAppStore((state) => state.supervisorSchoolId);
  const [school, setSchool] = useState<School | null>(null);
  const [lookupItems, setLookupItems] = useState<SupervisorChildLookupItem[]>([]);
  const [classOptions, setClassOptions] = useState<Array<{ id: string; label: string }>>([{ id: "ALL", label: "All classes" }]);
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  useEffect(() => {
    getSchools().then((data) => setSchool(data.find((entry) => entry.id === schoolId) ?? null));
    getSupervisorOverview(schoolId).then((overview) => {
      setClassOptions([{ id: "ALL", label: "All classes" }].concat(
        overview.byClass.map((item) => ({ id: item.class_id, label: item.class_name }))
      ));
    });
    getSupervisorChildrenLookup(schoolId).then((data) => {
      setLookupItems(data);
      setSelectedChildId((current) => current || data[0]?.child.id || "");
    });
  }, [schoolId]);

  const filteredLookupItems = lookupItems.filter((item) => {
    const matchesClass = selectedClassId === "ALL" || item.child.class_id === selectedClassId;
    const matchesQuery = item.child.full_name.toLowerCase().includes(query.toLowerCase());
    return matchesClass && matchesQuery;
  });
  const selectedLookupItem =
    filteredLookupItems.find((item) => item.child.id === selectedChildId) ?? filteredLookupItems[0] ?? null;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Child lookup fallback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            Use this when a child does not have a badge. Filter by class, search by name, and open the profile to
            verify the QR badge and enrollment details.
          </p>
          <div className="grid gap-3 md:grid-cols-[220px,1fr]">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search child by name"
            />
          </div>
          <div className="space-y-2">
            {filteredLookupItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No children found for this class filter and name search.
              </p>
            ) : (
              filteredLookupItems.map((item) => (
                <button
                  key={item.child.id}
                  type="button"
                  onClick={() => setSelectedChildId(item.child.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selectedLookupItem?.child.id === item.child.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">{item.child.full_name}</p>
                    <p
                      className={`text-xs ${
                        selectedLookupItem?.child.id === item.child.id ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {item.grade} · {item.class_name} · {item.child.student_id}
                    </p>
                  </div>
                  <Badge variant={item.child.active ? "success" : "danger"}>
                    {item.child.active ? "Active" : "Inactive"}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selected child profile</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedLookupItem ? (
            <p className="text-sm text-slate-500">Select a child to view the profile, image, QR badge, and details.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-6">
                <div
                  role="img"
                  aria-label={selectedLookupItem.child.full_name}
                  className="h-56 w-56 shrink-0 rounded-3xl bg-cover bg-center ring-1 ring-slate-200"
                  style={{ backgroundImage: `url(${selectedLookupItem.child.profile_image_url ?? "/qr-placeholder.svg"})` }}
                />
                <div className="space-y-3 pt-1">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{selectedLookupItem.child.full_name}</p>
                    <p className="text-sm text-slate-500">
                      {selectedLookupItem.grade} · {selectedLookupItem.class_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={selectedLookupItem.child.active ? "success" : "danger"}>
                      {selectedLookupItem.child.active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="secondary">{selectedLookupItem.child.student_id}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">QR badge</p>
                  <div className="mt-3 flex items-center gap-4">
                    <div
                      role="img"
                      aria-label={`${selectedLookupItem.child.full_name} QR badge`}
                      className="h-20 w-20 rounded-2xl border border-slate-200 bg-white bg-contain bg-center bg-no-repeat p-2"
                      style={{ backgroundImage: `url(${selectedLookupItem.qr?.qr_image_url ?? "/qr-placeholder.svg"})` }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedLookupItem.qr?.qr_payload ?? "QR not generated"}
                      </p>
                      <p className="text-xs text-slate-500">Use this badge value as the scan fallback reference.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Guardian</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedLookupItem.guardian?.name ?? "No guardian"}
                    </p>
                    <p className="text-sm text-slate-500">{selectedLookupItem.guardian?.phone ?? "No phone"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Subscription</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedLookupItem.subscription?.status ?? "NONE"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Meals remaining: {selectedLookupItem.subscription?.meals_remaining ?? 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Enrollment</p>
                  <div className="mt-2 grid gap-2 text-sm text-slate-600">
                    <p>School: {school?.name ?? "Unknown school"}</p>
                    <p>Class: {selectedLookupItem.class_name}</p>
                    <p>Grade: {selectedLookupItem.grade}</p>
                    <p>Student ID: {selectedLookupItem.child.student_id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
