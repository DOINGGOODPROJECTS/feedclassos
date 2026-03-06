"use client";

import { PageHeader } from "@/components/page-header";
import { SchoolStaffAccess } from "@/components/school-staff-access";

export default function SchoolAdminSupervisorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="School Admin · Supervisors"
        description="Manage supervisor access for this school from one place."
      />
      <SchoolStaffAccess />
    </div>
  );
}
