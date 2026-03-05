"use client";

import { useState } from "react";
import { validateMeal } from "@/lib/mockApi";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export default function SupervisorScanPage() {
  const { push } = useToast();
  const schoolId = useAppStore((state) => state.supervisorSchoolId);
  const [payload, setPayload] = useState("");
  const [mealType, setMealType] = useState<"BREAKFAST" | "LUNCH" | "DINNER">("LUNCH");
  const [result, setResult] = useState<{ status: string; reason: string } | null>(null);

  const handleValidate = async () => {
    const response = await validateMeal(payload.trim(), schoolId, mealType, "operator-1");
    if (response.result === "SUCCESS") {
      setResult({ status: "SUCCESS", reason: "Meal served" });
      push({ title: "Meal served", description: response.child?.full_name ?? "", variant: "success" });
    } else {
      setResult({ status: "FAILED", reason: response.reason_code });
      push({ title: "Scan failed", description: response.reason_code, variant: "danger" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Admin · Scan meals"
        description="QR validation with fast success/fail feedback and manual entry fallback."
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <Input value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="SMMS-RB-1001" />
          <Select value={mealType} onValueChange={(value) => setMealType(value as typeof mealType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select meal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BREAKFAST">BREAKFAST</SelectItem>
              <SelectItem value="LUNCH">LUNCH</SelectItem>
              <SelectItem value="DINNER">DINNER</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleValidate}>Validate</Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-slate-500">Result</p>
              <p className="text-lg font-semibold text-slate-900">{result.status}</p>
            </div>
            <Badge variant={result.status === "SUCCESS" ? "success" : "danger"}>{result.reason}</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
