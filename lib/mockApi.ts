import {
  ActivityLog,
  AiReport,
  AnomalyAlert,
  Child,
  ChildQr,
  ChildSubscription,
  ClassRoom,
  MealServe,
  MessageLog,
  MessageOutbox,
  PaymentEvent,
  PaymentIntent,
  ReasonCode,
  School,
  SubscriptionPlan,
  Supplier,
  SupplierInvoice,
  Transaction,
  ValidationLog,
} from "./types";
import {
  activity_logs,
  ai_reports,
  anomaly_alerts,
  child_qr,
  child_subscriptions,
  children,
  classes,
  message_logs,
  message_outbox,
  payment_events,
  payment_intents,
  schools,
  subscription_plans,
  supplier_invoices,
  suppliers,
  transactions,
  validation_logs,
  meal_serves,
  guardians,
} from "./mockData";
import { todayISO } from "./utils";

const latency = () => 400 + Math.floor(Math.random() * 400);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export async function getSchools() {
  await wait(latency());
  return [...schools];
}

export async function createSchool(input: Omit<School, "id">) {
  await wait(latency());
  const school = { ...input, id: uid("s") };
  schools.push(school);
  return school;
}

export async function updateSchool(id: string, input: Omit<School, "id">) {
  await wait(latency());
  const index = schools.findIndex((school) => school.id === id);
  if (index >= 0) {
    schools[index] = { ...schools[index], ...input };
    return schools[index];
  }
  return null;
}

export async function getClasses() {
  await wait(latency());
  return [...classes];
}

export async function createClass(input: Omit<ClassRoom, "id">) {
  await wait(latency());
  const entry = { ...input, id: uid("c") };
  classes.push(entry);
  return entry;
}

export async function updateClass(id: string, input: Omit<ClassRoom, "id">) {
  await wait(latency());
  const index = classes.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    classes[index] = { ...classes[index], ...input };
    return classes[index];
  }
  return null;
}

export async function getChildren() {
  await wait(latency());
  return [...children];
}

export async function updateChild(id: string, input: Partial<Child>) {
  await wait(latency());
  const index = children.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    children[index] = { ...children[index], ...input } as Child;
    return children[index];
  }
  return null;
}

export async function getChildById(id: string) {
  await wait(latency());
  return children.find((child) => child.id === id) || null;
}

export async function getChildQr(childId: string) {
  await wait(latency());
  return child_qr.find((qr) => qr.child_id === childId) || null;
}

export async function importChildrenCsv(csvText: string, schoolId: string, classId: string) {
  await wait(latency());
  const lines = csvText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = lines.map((line, index) => {
    const [student_id, full_name, guardian_name, guardian_phone] = line
      .split(",")
      .map((item) => item.trim());

    const guardianId = uid("g");
    guardians.push({
      id: guardianId,
      name: guardian_name || `Guardian ${index + 1}`,
      phone: guardian_phone || "+233-555-000-000",
      preferred_channel: "SMS",
    });

    const child: Child = {
      id: uid("ch"),
      student_id: student_id || `AUTO-${index + 1000}`,
      school_id: schoolId,
      class_id: classId,
      full_name: full_name || `Student ${index + 1}`,
      guardian_id: guardianId,
      active: true,
    };

    children.push(child);
    child_qr.push({
      child_id: child.id,
      qr_payload: `SMMS-${child.student_id}`,
      qr_image_url: "/qr-placeholder.svg",
    });

    return child;
  });

  activity_logs.push({
    id: uid("al"),
    type: "IMPORT",
    message: `Imported ${parsed.length} children`,
    created_at: new Date().toISOString(),
  });

  return parsed;
}

export async function getSubscriptionPlans() {
  await wait(latency());
  return [...subscription_plans];
}

export async function upsertPlan(input: Omit<SubscriptionPlan, "id"> & { id?: string }) {
  await wait(latency());
  if (input.id) {
    const index = subscription_plans.findIndex((plan) => plan.id === input.id);
    if (index >= 0) {
      subscription_plans[index] = { ...subscription_plans[index], ...input };
      return subscription_plans[index];
    }
  }
  const plan: SubscriptionPlan = { ...input, id: uid("p") } as SubscriptionPlan;
  subscription_plans.push(plan);
  return plan;
}

export async function getLedger() {
  await wait(latency());
  return [...transactions];
}

export async function getPaymentIntents() {
  await wait(latency());
  return [...payment_intents];
}

export async function createPaymentIntent(childId: string, planId: string) {
  await wait(latency());
  const plan = subscription_plans.find((entry) => entry.id === planId);
  const intent: PaymentIntent = {
    id: uid("pi"),
    child_id: childId,
    plan_id: planId,
    amount: plan?.price ?? 0,
    reference: `INV-${Math.floor(2000 + Math.random() * 8000)}`,
    status: "PENDING",
    payment_url: "https://pay.mock/new",
  };
  payment_intents.push(intent);
  return intent;
}

export async function simulateWebhookSuccess(externalTxId: string, intentId: string) {
  await wait(latency());
  if (payment_events.find((event) => event.external_tx_id === externalTxId)) {
    return { status: "ignored" } as const;
  }

  const intent = payment_intents.find((entry) => entry.id === intentId);
  if (!intent) {
    return { status: "missing" } as const;
  }

  intent.status = "PAID";
  const plan = subscription_plans.find((entry) => entry.id === intent.plan_id);

  payment_events.push({
    id: uid("pe"),
    external_tx_id: externalTxId,
    intent_id: intentId,
    status: "PAID",
    created_at: new Date().toISOString(),
  });

  const existing = child_subscriptions.find((sub) => sub.child_id === intent.child_id);
  const start = todayISO();
  const end = new Date();
  end.setDate(end.getDate() + 30);

  if (existing) {
    existing.status = "ACTIVE";
    existing.start_date = start;
    existing.end_date = end.toISOString().slice(0, 10);
    existing.meals_remaining = plan?.meals_per_cycle ?? 0;
    existing.plan_id = intent.plan_id;
  } else {
    child_subscriptions.push({
      child_id: intent.child_id,
      status: "ACTIVE",
      start_date: start,
      end_date: end.toISOString().slice(0, 10),
      meals_remaining: plan?.meals_per_cycle ?? 0,
      plan_id: intent.plan_id,
    });
  }

  transactions.push({
    id: uid("t"),
    child_id: intent.child_id,
    type: "SUBSCRIPTION_PURCHASE",
    amount: plan?.price ?? intent.amount,
    metadata: { plan: plan?.name ?? "Plan" },
    created_at: new Date().toISOString(),
  });

  return { status: "processed" } as const;
}

export async function getMessageHealth() {
  await wait(latency());
  const pending = message_outbox.filter((msg) => msg.status === "PENDING").length;
  const sent = message_logs.filter((msg) => msg.status === "SENT").length;
  const failed = message_logs.filter((msg) => msg.status === "FAILED").length;
  return { pending, sent, failed };
}

export async function getMessageLogs() {
  await wait(latency());
  return [...message_logs];
}

export async function resendFailedMessages() {
  await wait(latency());
  message_logs
    .filter((msg) => msg.status === "FAILED")
    .forEach((msg) => (msg.status = "SENT"));
  return true;
}

export async function getSuppliers() {
  await wait(latency());
  return [...suppliers];
}

export async function upsertSupplier(input: Omit<Supplier, "id"> & { id?: string }) {
  await wait(latency());
  if (input.id) {
    const index = suppliers.findIndex((entry) => entry.id === input.id);
    if (index >= 0) {
      suppliers[index] = { ...suppliers[index], ...input };
      return suppliers[index];
    }
  }
  const supplier: Supplier = { ...input, id: uid("sup") } as Supplier;
  suppliers.push(supplier);
  return supplier;
}

export async function getSupplierInvoices() {
  await wait(latency());
  return [...supplier_invoices];
}

export async function markInvoicePaid(invoiceId: string) {
  await wait(latency());
  const invoice = supplier_invoices.find((entry) => entry.id === invoiceId);
  if (invoice) {
    invoice.status = "PAID";
  }
  return invoice ?? null;
}

export async function getAiReports(): Promise<{ alerts: AnomalyAlert[]; reports: AiReport[] }> {
  await wait(latency());
  return { alerts: [...anomaly_alerts], reports: [...ai_reports] };
}

export async function getDashboardKpis() {
  await wait(latency());
  const mealsToday = meal_serves.filter((serve) => serve.serve_date === todayISO()).length;
  const mealsMonth = meal_serves.length;
  const activeSubscriptions = child_subscriptions.filter((sub) => sub.status === "ACTIVE").length;
  const expiringSoon = child_subscriptions.filter((sub) => sub.status === "ACTIVE").length;
  const revenueMonth = transactions
    .filter((tx) => tx.type === "SUBSCRIPTION_PURCHASE")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const supplierCostMonth = supplier_invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const costPerMeal = supplierCostMonth / Math.max(meal_serves.length, 1);

  return {
    mealsToday,
    mealsMonth,
    activeSubscriptions,
    expiringSoon,
    revenueMonth,
    supplierCostMonth,
    costPerMeal,
  };
}

export async function getDonorKpis() {
  await wait(latency());
  const totalMeals = meal_serves.length;
  const totalChildren = children.length;
  const fundsReceived = transactions
    .filter((tx) => tx.type === "SUBSCRIPTION_PURCHASE")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const costPerMeal = supplier_invoices.reduce((sum, inv) => sum + inv.amount, 0) / Math.max(totalMeals, 1);
  return { totalMeals, totalChildren, fundsReceived, costPerMeal };
}

export async function getSupervisorOverview(schoolId: string) {
  await wait(latency());
  const schoolMeals = meal_serves.filter((serve) => serve.school_id === schoolId);
  const todayMeals = schoolMeals.filter((serve) => serve.serve_date === todayISO());
  const byClass = classes
    .filter((cls) => cls.school_id === schoolId)
    .map((cls) => ({
      class_id: cls.id,
      class_name: cls.name,
      total: schoolMeals.filter((serve) =>
        children.find((child) => child.id === serve.child_id)?.class_id === cls.id
      ).length,
    }));

  const problems = children.filter((child) => child.school_id === schoolId).filter((child) => {
    const sub = child_subscriptions.find((entry) => entry.child_id === child.id);
    return !child.active || !sub || sub.status !== "ACTIVE";
  });

  return { todayMeals: todayMeals.length, byClass, problems };
}

export async function getMealHistory(schoolId: string) {
  await wait(latency());
  return meal_serves.filter((serve) => serve.school_id === schoolId);
}

export async function getProblemsForSchool(schoolId: string) {
  await wait(latency());
  return children
    .filter((child) => child.school_id === schoolId)
    .map((child) => {
      const sub = child_subscriptions.find((entry) => entry.child_id === child.id);
      if (!child.active) {
        return { child, reason: "Inactive child" };
      }
      if (!sub) {
        return { child, reason: "No subscription" };
      }
      if (sub.status !== "ACTIVE") {
        return { child, reason: "Expired subscription" };
      }
      return null;
    })
    .filter(Boolean);
}

export async function validateMeal(
  qr_payload: string,
  school_id: string,
  meal_type: "BREAKFAST" | "LUNCH" | "DINNER",
  operator_id: string
) {
  await wait(latency());
  const log: ValidationLog = {
    id: uid("vl"),
    school_id,
    qr_payload,
    result: "FAILED",
    reason_code: "NO_SUBSCRIPTION",
    created_at: new Date().toISOString(),
  };

  const childQr = child_qr.find((qr) => qr.qr_payload === qr_payload);
  const child = childQr ? children.find((entry) => entry.id === childQr.child_id) : undefined;

  let reason: ReasonCode = "NO_SUBSCRIPTION";

  if (!child) {
    reason = "NO_SUBSCRIPTION";
  } else if (!child.active) {
    reason = "INACTIVE_CHILD";
  } else if (child.school_id !== school_id) {
    reason = "WRONG_SCHOOL";
  } else {
    const subscription = child_subscriptions.find((entry) => entry.child_id === child.id);
    const today = todayISO();
    if (!subscription || subscription.status !== "ACTIVE") {
      reason = "NO_SUBSCRIPTION";
    } else if (subscription.end_date < today) {
      reason = "EXPIRED";
    } else if (subscription.meals_remaining <= 0) {
      reason = "INSUFFICIENT_MEALS";
    } else if (
      meal_serves.some(
        (serve) =>
          serve.child_id === child.id &&
          serve.serve_date === today &&
          serve.meal_type === meal_type
      )
    ) {
      reason = "ALREADY_SERVED";
    } else {
      const serve: MealServe = {
        id: uid("ms"),
        child_id: child.id,
        school_id,
        meal_type,
        serve_date: today,
        created_at: new Date().toISOString(),
      };
      meal_serves.push(serve);
      subscription.meals_remaining -= 1;
      transactions.push({
        id: uid("t"),
        child_id: child.id,
        type: "DEBIT_MEAL",
        amount: -1,
        metadata: { meal_type },
        created_at: new Date().toISOString(),
      });
      reason = "OK";
      log.result = "SUCCESS";
      log.reason_code = "OK";
    }
  }

  if (log.result !== "SUCCESS") {
    log.reason_code = reason;
  }
  log.child_id = child?.id;
  validation_logs.push(log);

  return {
    result: log.result,
    reason_code: log.reason_code,
    child,
  };
}

export async function getValidationLogs() {
  await wait(latency());
  return [...validation_logs];
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  await wait(latency());
  return [...activity_logs];
}

export async function getMessages(): Promise<MessageOutbox[]> {
  await wait(latency());
  return [...message_outbox];
}

export async function getAiSummary(): Promise<AiReport[]> {
  await wait(latency());
  return [...ai_reports];
}

export async function generateBadgesPdf(classId: string) {
  await wait(latency());
  return { url: `/mock-badges/${classId}.pdf`, created_at: new Date().toISOString() };
}

export async function getAllData() {
  await wait(latency());
  return {
    schools,
    classes,
    children,
    guardians,
    child_subscriptions,
    child_qr,
    subscription_plans,
  } as const;
}
