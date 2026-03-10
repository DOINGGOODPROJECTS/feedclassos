"use client";

import { useEffect, useMemo, useState } from "react";
import { generateBadgesPdf, getChildren, getClasses, getSchools } from "@/lib/mockApi";
import { buildChildQrPayload } from "@/lib/qr";
import { Child, ClassRoom, School } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCanvas } from "@/components/qr-canvas";
import { useToast } from "@/components/ui/use-toast";

export default function AdminBadgesPage() {
  const { push } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [classId, setClassId] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("class-badges.html");

  useEffect(() => {
    getSchools().then(setSchools);
    getClasses().then(setClasses);
    getChildren().then(setChildren);
  }, []);

  const classOptions = classes.filter((cls) => !schoolId || cls.school_id === schoolId);
  const badgeChildren = useMemo(() => {
    return children.filter((child) => (!classId ? true : child.class_id === classId));
  }, [children, classId]);

  const selectedClass = classes.find((entry) => entry.id === classId) ?? null;
  const selectedSchool = schools.find((entry) => entry.id === (schoolId || selectedClass?.school_id)) ?? null;
  const selectClassName =
    "flex h-10 w-full items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300";

  const handleGenerate = async () => {
    if (!classId) {
      push({ title: "Select a class", description: "Choose a class to generate badges.", variant: "danger" });
      return;
    }
    const result = await generateBadgesPdf(classId);
    setDownloadUrl(result.url);
    setDownloadName(result.file_name);
    push({ title: "Badges generated", description: "Printable badge sheet is ready.", variant: "success" });
  };

  const handleDownload = () => {
    if (!downloadUrl) {
      return;
    }
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = downloadName;
    link.click();
  };

  const handleOpenPrintView = () => {
    if (!downloadUrl) {
      return;
    }
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Admin · Badges"
        description="QR preview and badge printing for classes (A4/card layouts)."
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className={selectClassName}
              value={schoolId}
              onChange={(event) => {
                setSchoolId(event.target.value);
                setClassId("");
              }}
            >
              <option value="">Select school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
            <select
              className={selectClassName}
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
            >
              <option value="">Select class</option>
              {classOptions.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate}>Generate badge sheet</Button>
            {downloadUrl && (
              <>
                <Button variant="outline" onClick={handleOpenPrintView}>
                  Open print view
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  Download badge sheet
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {badgeChildren.map((child) => (
          <Card key={child.id}>
            <CardContent className="space-y-3 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {selectedSchool?.name ?? schools.find((entry) => entry.id === child.school_id)?.name ?? "School"}
              </p>
              <div
                className="h-48 w-full rounded-3xl border border-slate-200 bg-slate-50 bg-cover bg-center"
                style={{ backgroundImage: `url(${child.profile_image_url ?? "/qr-placeholder.svg"})` }}
              />
              <p className="text-sm font-semibold text-slate-800">{child.full_name}</p>
              <p className="text-xs text-slate-500">{child.student_id}</p>
              <p className="text-xs text-slate-500">
                {classes.find((entry) => entry.id === child.class_id)?.name ?? "-"}
              </p>
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4">
                <QrCanvas value={buildChildQrPayload(child)} size={120} className="h-[120px] w-[120px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
