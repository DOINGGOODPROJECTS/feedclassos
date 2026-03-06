"use client";

import { useEffect, useState } from "react";
import { createSchoolStaff, getSchoolStaff, removeSchoolStaff, toggleSchoolStaffAccess } from "@/lib/mockApi";
import { SchoolStaff } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export function SchoolStaffAccess() {
  const schoolId = useAppStore((state) => state.supervisorSchoolId);
  const { push } = useToast();
  const [staff, setStaff] = useState<SchoolStaff[]>([]);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  useEffect(() => {
    getSchoolStaff(schoolId).then(setStaff);
  }, [schoolId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supervisor access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-500">
          Add supervisors, disable their access, or remove them from this school dashboard.
        </p>
        <div className="grid gap-3 lg:grid-cols-[1fr,1fr,auto]">
          <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="Full name" />
          <Input value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="Email address" />
          <Button
            onClick={async () => {
              if (!staffName.trim() || !staffEmail.trim()) {
                push({ title: "Missing details", description: "Enter a name and email.", variant: "danger" });
                return;
              }
              const created = await createSchoolStaff({
                school_id: schoolId,
                name: staffName.trim(),
                email: staffEmail.trim(),
                role: "SUPERVISOR",
              });
              setStaff((current) => [created, ...current]);
              setStaffName("");
              setStaffEmail("");
              push({ title: "Supervisor added", description: created.name, variant: "success" });
            }}
          >
            Add supervisor
          </Button>
        </div>

        <div className="space-y-3">
          {staff.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              No supervisors have been assigned to this school yet.
            </p>
          ) : (
            staff.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                  <p className="text-sm text-slate-500">{member.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Supervisor</Badge>
                  <Badge variant={member.access_active ? "success" : "warning"}>
                    {member.access_active ? "Access enabled" : "Access disabled"}
                  </Badge>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const updated = await toggleSchoolStaffAccess(member.id);
                      if (!updated) return;
                      setStaff((current) => current.map((entry) => (entry.id === member.id ? updated : entry)));
                    }}
                  >
                    {member.access_active ? "Disable access" : "Enable access"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const removed = await removeSchoolStaff(member.id);
                      if (!removed) return;
                      setStaff((current) => current.filter((entry) => entry.id !== member.id));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
