"use client";

import { useEffect, useMemo, useState } from "react";
import { generateBadgesPdf, getChildren, getClasses, getSchools } from "@/lib/mockApi";
import { Child, ClassRoom, School } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function AdminBadgesPage() {
  const { push } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [classId, setClassId] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    getSchools().then(setSchools);
    getClasses().then(setClasses);
    getChildren().then(setChildren);
  }, []);

  const classOptions = classes.filter((cls) => !schoolId || cls.school_id === schoolId);
  const badgeChildren = useMemo(() => {
    return children.filter((child) => (!classId ? true : child.class_id === classId));
  }, [children, classId]);

  const handleGenerate = async () => {
    if (!classId) {
      push({ title: "Select a class", description: "Choose a class to generate badges.", variant: "danger" });
      return;
    }
    const result = await generateBadgesPdf(classId);
    setDownloadUrl(result.url);
    push({ title: "Badges generated", description: "Mock PDF ready for download.", variant: "success" });
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
            <Select value={schoolId} onValueChange={setSchoolId}>
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
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate}>Generate badges PDF</Button>
            {downloadUrl && (
              <Button variant="outline" onClick={() => push({ title: "Download", description: downloadUrl })}>
                Download PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {badgeChildren.map((child) => (
          <Card key={child.id}>
            <CardContent className="space-y-2 p-4">
              <div className="h-20 w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50" />
              <p className="text-sm font-semibold text-slate-800">{child.full_name}</p>
              <p className="text-xs text-slate-500">{child.student_id}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
