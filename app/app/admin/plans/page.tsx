"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSubscriptionPlans, upsertPlan } from "@/lib/mockApi";
import { SubscriptionPlan } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DataTable } from "@/components/data-table";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  meal_type: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  meals_per_cycle: z.coerce.number().min(1),
  price: z.coerce.number().min(1),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function AdminPlansPage() {
  const { push } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", meal_type: "LUNCH", meals_per_cycle: 0, price: 0, active: true },
  });

  useEffect(() => {
    getSubscriptionPlans().then(setPlans);
  }, []);

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload = editing ? { ...values, id: editing.id } : values;
    const saved = await upsertPlan(payload);
    setPlans((prev) => {
      const exists = prev.find((plan) => plan.id === saved.id);
      return exists ? prev.map((plan) => (plan.id === saved.id ? saved : plan)) : [...prev, saved];
    });
    push({ title: "Plan saved", description: saved.name, variant: "success" });
    setOpen(false);
    setEditing(null);
  });

  const startEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    form.reset({
      name: plan.name,
      meal_type: plan.meal_type,
      meals_per_cycle: plan.meals_per_cycle,
      price: plan.price,
      active: plan.active,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Admin · Subscription Plans"
        description="Configure pricing, meal counts, and plan availability."
        actions={
          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) {
                setEditing(null);
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>Add plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit plan" : "Create plan"}</DialogTitle>
              </DialogHeader>
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <Input placeholder="Plan name" {...form.register("name")} />
                <div className="grid gap-3 md:grid-cols-2">
                  <Select
                    value={form.watch("meal_type")}
                    onValueChange={(value) => form.setValue("meal_type", value as FormValues["meal_type"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BREAKFAST">BREAKFAST</SelectItem>
                      <SelectItem value="LUNCH">LUNCH</SelectItem>
                      <SelectItem value="DINNER">DINNER</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Meals per cycle" {...form.register("meals_per_cycle")} />
                </div>
                <Input type="number" placeholder="Price" {...form.register("price")} />
                <div className="flex items-center gap-3">
                  <Switch checked={form.watch("active")} onCheckedChange={(value) => form.setValue("active", value)} />
                  <Label>Active</Label>
                </div>
                <Button type="submit" className="w-full">
                  Save plan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <DataTable
          columns={[
            { header: "Plan", render: (row: SubscriptionPlan) => row.name },
            { header: "Meal type", render: (row: SubscriptionPlan) => row.meal_type },
            { header: "Meals", render: (row: SubscriptionPlan) => row.meals_per_cycle },
            { header: "Price", render: (row: SubscriptionPlan) => formatCurrency(row.price) },
            {
              header: "Status",
              render: (row: SubscriptionPlan) => (row.active ? "Active" : "Paused"),
            },
            {
              header: "Actions",
              render: (row: SubscriptionPlan) => (
                <Button variant="outline" size="sm" onClick={() => startEdit(row)}>
                  Edit
                </Button>
              ),
            },
          ]}
          data={plans}
        />
      </div>
    </div>
  );
}
