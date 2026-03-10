"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  createPaymentIntent,
  deleteChild,
  getAllData,
  getChildById,
  getChildQr,
  getLedger,
  getSubscriptionPlans,
  updateChild,
  updateGuardian,
} from "@/lib/mockApi";
import { Child, ChildQr, ChildSubscription, ClassRoom, Guardian, School, SubscriptionPlan, Transaction } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QrCanvas } from "@/components/qr-canvas";
import { useToast } from "@/components/ui/use-toast";
import { buildChildQrPayload } from "@/lib/qr";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function ChildDetailClient() {
  const { push } = useToast();
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;
  const [child, setChild] = useState<Child | null>(null);
  const [qr, setQr] = useState<ChildQr | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [ledger, setLedger] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<ChildSubscription | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [form, setForm] = useState({
    student_id: "",
    full_name: "",
    school_id: "",
    class_id: "",
    guardian_name: "",
    guardian_phone: "",
    profile_image_url: "",
    active: true,
  });

  useEffect(() => {
    getChildById(childId).then(setChild);
    getChildQr(childId).then(setQr);
    getSubscriptionPlans().then(setPlans);
    getLedger().then((entries) => setLedger(entries.filter((tx) => tx.child_id === childId)));
    getAllData().then((data) => {
      setSchools(data.schools);
      setClasses(data.classes);
      setSubscription(data.child_subscriptions.find((entry) => entry.child_id === childId) ?? null);
      const nextChild = data.children.find((entry) => entry.id === childId) ?? null;
      const nextGuardian = nextChild
        ? data.guardians.find((entry) => entry.id === nextChild.guardian_id) ?? null
        : null;
      setGuardian(nextGuardian);
      if (nextChild) {
        setForm({
          student_id: nextChild.student_id,
          full_name: nextChild.full_name,
          school_id: nextChild.school_id,
          class_id: nextChild.class_id,
          guardian_name: nextGuardian?.name ?? "",
          guardian_phone: nextGuardian?.phone ?? "",
          profile_image_url: nextChild.profile_image_url ?? "",
          active: nextChild.active,
        });
      }
    });
  }, [childId]);

  const filteredClasses = useMemo(
    () => classes.filter((entry) => !form.school_id || entry.school_id === form.school_id),
    [classes, form.school_id]
  );

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        profile_image_url: typeof reader.result === "string" ? reader.result : current.profile_image_url,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!child) {
      return;
    }

    const updatedChild = await updateChild(child.id, {
      student_id: form.student_id.trim().toUpperCase(),
      full_name: form.full_name.trim(),
      school_id: form.school_id,
      class_id: form.class_id,
      profile_image_url: form.profile_image_url,
      active: form.active,
    });
    if (!updatedChild) {
      push({ title: "Update failed", description: "Unable to update child.", variant: "danger" });
      return;
    }

    if (guardian) {
      const updatedGuardian = await updateGuardian(guardian.id, {
        name: form.guardian_name.trim(),
        phone: form.guardian_phone.trim(),
      });
      setGuardian(updatedGuardian);
    }

    setChild(updatedChild);
    push({ title: "Child updated", description: updatedChild.full_name, variant: "success" });
  };

  const handleDelete = async () => {
    if (!child) {
      return;
    }

    const confirmed = window.confirm(`Delete ${child.full_name}? This will remove the child record.`);
    if (!confirmed) {
      return;
    }

    const deleted = await deleteChild(child.id);
    if (!deleted) {
      push({ title: "Delete failed", description: "Unable to delete child.", variant: "danger" });
      return;
    }

    push({ title: "Child deleted", description: child.full_name, variant: "success" });
    router.push("/app/admin/children");
  };

  const handlePrintQrBadge = async () => {
    if (!qr?.qr_payload || !child) {
      push({ title: "QR unavailable", description: "Generate the child QR first.", variant: "danger" });
      return;
    }

    const schoolName =
      schools.find((entry) => entry.id === form.school_id)?.name ||
      schools.find((entry) => entry.id === child.school_id)?.name ||
      "FeedClass";

    try {
      const qrDataUrl = await QRCode.toDataURL(qr.qr_payload, {
        width: 260,
        margin: 2,
      });

      const printWindow = window.open("", "_blank", "width=900,height=900");
      if (!printWindow) {
        push({ title: "Popup blocked", description: "Allow popups to print the QR badge.", variant: "danger" });
        return;
      }

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>${child.full_name} QR badge</title>
            <style>
              body {
                margin: 0;
                font-family: Arial, sans-serif;
                background: #f8fafc;
                color: #0f172a;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .badge {
                width: 420px;
                background: #ffffff;
                border: 2px solid #cbd5e1;
                border-radius: 28px;
                padding: 24px;
                text-align: center;
              }
              .badge h1 {
                margin: 0 0 8px;
                font-size: 28px;
              }
              .badge p {
                margin: 0 0 6px;
                color: #475569;
              }
              .badge img {
                display: block;
                width: 260px;
                height: 260px;
                margin: 20px auto;
                border-radius: 20px;
                border: 1px solid #cbd5e1;
                background: #fff;
              }
              .badge .school {
                text-transform: uppercase;
                letter-spacing: 0.12em;
                font-size: 12px;
                color: #64748b;
                margin-bottom: 16px;
              }
              .badge .student-id {
                font-weight: 700;
                color: #0f172a;
              }
              @media print {
                body { background: #fff; }
                .badge { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <article class="badge">
              <div class="school">${schoolName}</div>
              <h1>${child.full_name}</h1>
              <img src="${qrDataUrl}" alt="${child.full_name} QR code" />
              <p>${schoolName}</p>
            </article>
            <script>
              window.onload = () => {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      push({ title: "Print failed", description: "Unable to render the QR badge.", variant: "danger" });
      console.error(error);
    }
  };

  if (!child) {
    return <div className="text-sm text-slate-500">Loading child profile...</div>;
  }

  const activePlan = plans.find((plan) => plan.active) ?? plans[0];
  const verificationCode = qr?.qr_payload ?? buildChildQrPayload(child);

  return (
    <div className="space-y-6">
      <PageHeader
        title={child.full_name}
        description={`Program Admin view · Student ID: ${child.student_id} · QR, subscription, and ledger overview`}
        actions={<Badge variant={child.active ? "success" : "danger"}>{child.active ? "Active" : "Inactive"}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Child profile</CardTitle>
          </CardHeader>
          <CardContent className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Student ID</label>
                <Input
                  placeholder="Student ID"
                  value={form.student_id}
                  onChange={(event) => setForm((current) => ({ ...current, student_id: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Child Full Name</label>
                <Input
                  placeholder="Child full name"
                  value={form.full_name}
                  onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">School Name</label>
                <select
                  className="flex h-10 w-full items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={form.school_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, school_id: event.target.value, class_id: "" }))
                  }
                >
                  <option value="">Select school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Class</label>
                <select
                  className="flex h-10 w-full items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={form.class_id}
                  onChange={(event) => setForm((current) => ({ ...current, class_id: event.target.value }))}
                >
                  <option value="">Select class</option>
                  {filteredClasses.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Guardian Name</label>
                <Input
                  placeholder="Guardian name"
                  value={form.guardian_name}
                  onChange={(event) => setForm((current) => ({ ...current, guardian_name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Guardian Phone Number</label>
                <Input
                  placeholder="Guardian phone"
                  value={form.guardian_phone}
                  onChange={(event) => setForm((current) => ({ ...current, guardian_phone: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="detail-profile-image">
                  Profile image
                </label>
                <input
                  id="detail-profile-image"
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700"
                  onChange={handleProfileImageChange}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                />
                Active child
              </label>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave}>Save changes</Button>
                <Button variant="outline" onClick={handleDelete}>
                  Delete child
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <div
                className="h-72 w-full rounded-3xl border border-slate-200 bg-slate-50 bg-cover bg-center md:h-[360px]"
                style={{ backgroundImage: `url(${form.profile_image_url || child.profile_image_url || "/qr-placeholder.svg"})` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {qr?.qr_payload ? (
              <>
                <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-3xl border border-slate-200 bg-white p-4">
                  <QrCanvas value={qr.qr_payload} size={240} className="h-[240px] w-[240px]" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Verification code
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                    {verificationCode}
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button variant="outline" onClick={handlePrintQrBadge}>
                    Print QR badge
                  </Button>
                </div>
              </>
            ) : (
              <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                QR not generated
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-500">Current status</p>
                  <p className="text-lg font-semibold text-slate-900">{subscription.status}</p>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2">
                  <span className="text-xs text-slate-500">Meals remaining</span>
                  <span className="text-sm font-semibold text-slate-800">{subscription.meals_remaining}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {subscription.start_date} → {subscription.end_date}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No active subscription.</p>
            )}
            {activePlan ? (
              <div>
                <p className="text-sm text-slate-500">Recommended plan</p>
                <p className="text-lg font-semibold text-slate-900">{activePlan.name}</p>
                <p className="text-sm text-slate-500">{formatCurrency(activePlan.price)} per cycle</p>
              </div>
            ) : null}
            <Button
              onClick={async () => {
                if (!activePlan) return;
                await createPaymentIntent(childId, activePlan.id);
                push({ title: "Payment intent created", description: activePlan.name, variant: "success" });
              }}
            >
              Create payment intent
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger snippet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ledger.length === 0 ? (
            <p className="text-sm text-slate-500">No transactions yet.</p>
          ) : (
            ledger.slice(0, 4).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{entry.type}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{entry.amount}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
