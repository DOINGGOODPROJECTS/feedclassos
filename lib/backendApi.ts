import { Child, ChildQr, ChildSubscription, ClassRoom, Guardian, School, SubscriptionPlan } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ACCESS_TOKEN_KEY = "fc_access_token";
const REFRESH_TOKEN_KEY = "fc_refresh_token";
const LAST_ACTIVITY_KEY = "fc_last_activity_at";

type BackendSchool = {
  id: string;
  code: string;
  name: string;
  address: string;
  timezone: string;
  active: boolean;
};

type BackendClass = {
  id: string;
  school_id?: string;
  schoolId?: string;
  name: string;
  grade?: string;
  active: boolean;
};

type BackendChildRow = {
  id: string;
  school_id: string;
  class_id: string;
  student_id: string;
  full_name: string;
  profile_image_url?: string | null;
  subscription_status?: "ACTIVE" | "EXPIRED" | "PAUSED" | "NONE" | "GRACE_PERIOD";
  grace_period_ends_at?: string | null;
  active: boolean;
  guardian_id?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
};

type BackendPlan = {
  id: string;
  name: string;
  mealType?: "BREAKFAST" | "LUNCH" | "DINNER";
  meal_type?: "BREAKFAST" | "LUNCH" | "DINNER";
  mealsPerCycle?: number;
  meals_per_cycle?: number;
  price: number;
  active: boolean;
  effectiveStartDate?: string | null;
  effective_start_date?: string | null;
  effectiveEndDate?: string | null;
  effective_end_date?: string | null;
};

type BackendChildSubscription = {
  childId?: string;
  child_id?: string;
  planId?: string | null;
  plan_id?: string | null;
  planName?: string | null;
  plan_name?: string | null;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PAUSED" | "NONE" | "GRACE_PERIOD";
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  mealsRemaining?: number;
  meals_remaining?: number;
  mealType?: "BREAKFAST" | "LUNCH" | "DINNER" | null;
  meal_type?: "BREAKFAST" | "LUNCH" | "DINNER" | null;
  cancelledAt?: string | null;
  cancelled_at?: string | null;
  cancellationReason?: string | null;
  cancellation_reason?: string | null;
};

function isValidChildRow(entry: Partial<BackendChildRow>) {
  return Boolean(entry.id && entry.student_id && entry.full_name && entry.school_id && entry.class_id);
}

export function storeAuthTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(accessToken)}; path=/; max-age=2592000`;
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    document.cookie = `${REFRESH_TOKEN_KEY}=${encodeURIComponent(refreshToken)}; path=/; max-age=2592000`;
  }
  touchSessionActivity();
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(LAST_ACTIVITY_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0`;
}

export function getAccessToken() {
  if (typeof window === "undefined") return "";
  const localToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (localToken) {
    return localToken;
  }

  const cookieToken = document.cookie.match(
    new RegExp(`(?:^|; )${ACCESS_TOKEN_KEY}=([^;]*)`)
  )?.[1];

  return cookieToken ? decodeURIComponent(cookieToken) : "";
}

function decodeJwtPayload(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
}

export function getAccessTokenExpiryMs() {
  if (typeof window === "undefined") return 0;
  const token = getAccessToken();
  if (!token) {
    return 0;
  }

  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : 0;
}

export function touchSessionActivity() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function getLastActivityAt() {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY) || "0");
  return Number.isFinite(value) ? value : 0;
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const raw = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") && raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : null) ||
      raw.trim() ||
      "Request failed.";
    throw new Error(message);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON response from ${path} but received ${contentType || "unknown content type"}.`);
  }

  return payload as T;
}

function buildSchoolCode(name: string) {
  const normalized = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);

  return `${normalized || "SCHOOL"}-${Date.now().toString().slice(-4)}`;
}

function mapSchool(entry: BackendSchool): School {
  return {
    id: entry.id,
    name: entry.name,
    location: entry.address,
  };
}

function mapClass(entry: BackendClass): ClassRoom {
  return {
    id: entry.id,
    school_id: entry.school_id || entry.schoolId || "",
    name: entry.name,
    grade: entry.grade || "",
  };
}

function mapChild(entry: BackendChildRow): Child {
  return {
    id: entry.id,
    student_id: entry.student_id,
    school_id: entry.school_id,
    class_id: entry.class_id,
    full_name: entry.full_name,
    guardian_id: entry.guardian_id || "",
    profile_image_url: entry.profile_image_url || undefined,
    active: entry.active,
    subscription_status: entry.subscription_status || "NONE",
    grace_period_ends_at: entry.grace_period_ends_at || undefined,
  };
}

function mapGuardian(entry: BackendChildRow): Guardian | null {
  if (!entry.guardian_id) {
    return null;
  }

  return {
    id: entry.guardian_id,
    name: entry.guardian_name || "",
    phone: entry.guardian_phone || "",
    preferred_channel: "SMS",
  };
}

function mapPlan(entry: BackendPlan): SubscriptionPlan {
  return {
    id: entry.id,
    name: entry.name,
    meal_type: entry.meal_type || entry.mealType || "LUNCH",
    meals_per_cycle: Number(entry.meals_per_cycle ?? entry.mealsPerCycle ?? 0),
    price: Number(entry.price || 0),
    active: Boolean(entry.active),
    effective_start_date: entry.effective_start_date || entry.effectiveStartDate || null,
    effective_end_date: entry.effective_end_date || entry.effectiveEndDate || null,
  };
}

function mapChildSubscription(entry: BackendChildSubscription): ChildSubscription {
  return {
    child_id: entry.child_id || entry.childId || "",
    plan_id: entry.plan_id || entry.planId || null,
    plan_name: entry.plan_name || entry.planName || null,
    status: entry.status,
    start_date: entry.start_date || entry.startDate || "",
    end_date: entry.end_date || entry.endDate || "",
    meals_remaining: Number(entry.meals_remaining ?? entry.mealsRemaining ?? 0),
    meal_type: entry.meal_type || entry.mealType || null,
    cancelled_at: entry.cancelled_at || entry.cancelledAt || null,
    cancellation_reason: entry.cancellation_reason || entry.cancellationReason || null,
  };
}

export async function getBackendSchools() {
  const payload = await fetchJson<{ schools: BackendSchool[] }>("/schools");
  return payload.schools.map(mapSchool);
}

export async function createBackendSchool(input: { name: string; location: string }) {
  const payload = await fetchJson<{ school: BackendSchool }>("/schools", {
    method: "POST",
    body: JSON.stringify({
      code: buildSchoolCode(input.name),
      name: input.name,
      address: input.location,
      timezone: "Africa/Accra",
      active: true,
    }),
  });

  return mapSchool(payload.school);
}

export async function updateBackendSchool(id: string, input: { name: string; location: string }) {
  const payload = await fetchJson<{ school: BackendSchool }>(`/schools/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: input.name,
      address: input.location,
    }),
  });

  return mapSchool(payload.school);
}

export async function getBackendClasses(schoolId?: string) {
  const query = schoolId ? `?school_id=${encodeURIComponent(schoolId)}` : "";
  const payload = await fetchJson<{ classes: BackendClass[] }>(`/classes${query}`);
  return payload.classes.map(mapClass);
}

export async function createBackendClass(input: { name: string; grade: string; school_id: string }) {
  const payload = await fetchJson<{ class: BackendClass }>(`/schools/${input.school_id}/classes`, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      grade: input.grade,
      active: true,
    }),
  });

  return mapClass(payload.class);
}

export async function updateBackendClass(id: string, input: { name: string; grade: string; school_id: string }) {
  const payload = await fetchJson<{ class: BackendClass }>(`/classes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      schoolId: input.school_id,
      name: input.name,
      grade: input.grade,
    }),
  });

  return mapClass(payload.class);
}

export async function getBackendChildren() {
  const payload = await fetchJson<{ children: BackendChildRow[] }>("/children");
  const validRows = payload.children.filter(isValidChildRow);
  const children = validRows.map(mapChild);
  const guardians = validRows
    .map(mapGuardian)
    .filter((entry): entry is Guardian => entry !== null);

  return { children, guardians };
}

export async function createBackendChildEnrollment(input: {
  student_id: string;
  full_name: string;
  school_id: string;
  class_id: string;
  guardian_name: string;
  guardian_phone: string;
  profile_image_url?: string;
}) {
  const payload = await fetchJson<{
    child: {
      id: string;
      schoolId: string;
      classId: string;
      studentId: string;
      fullName: string;
      profileImageUrl?: string | null;
      active: boolean;
      guardian?: { id: string; name: string; phone: string } | null;
    };
  }>("/children", {
    method: "POST",
    body: JSON.stringify({
      schoolId: input.school_id,
      classId: input.class_id,
      studentId: input.student_id,
      fullName: input.full_name,
      guardianName: input.guardian_name,
      guardianPhone: input.guardian_phone,
      profileImageUrl: input.profile_image_url || "",
    }),
  });

  return {
    child: {
      id: payload.child.id,
      student_id: payload.child.studentId,
      school_id: payload.child.schoolId,
      class_id: payload.child.classId,
      full_name: payload.child.fullName,
      guardian_id: payload.child.guardian?.id || "",
      profile_image_url: payload.child.profileImageUrl || undefined,
      active: payload.child.active,
    } as Child,
    guardian: payload.child.guardian
      ? ({
          id: payload.child.guardian.id,
          name: payload.child.guardian.name,
          phone: payload.child.guardian.phone,
          preferred_channel: "SMS",
        } as Guardian)
      : null,
  };
}

export async function getBackendChildQr(childId: string) {
  const payload = await fetchJson<{
    childQr: {
      childId: string;
      qrPayload: string;
      qrImageUrl: string;
      verificationLink?: string;
    };
  }>(`/children/${encodeURIComponent(childId)}/qr`);

  return {
    child_id: payload.childQr.childId,
    qr_payload: payload.childQr.qrPayload,
    qr_image_url: payload.childQr.qrImageUrl,
    verification_link: payload.childQr.verificationLink || payload.childQr.qrPayload,
  } as ChildQr;
}

export async function getBackendChildSubscription(childId: string) {
  const payload = await fetchJson<{ subscription: BackendChildSubscription | null }>(
    `/children/${encodeURIComponent(childId)}/subscription`
  );

  return payload.subscription ? mapChildSubscription(payload.subscription) : null;
}

export async function getBackendDashboardKpis() {
  return fetchJson<{
    mealsToday: number;
    graceMealsToday: number;
    mealsMonth: number;
    activeSubscriptions: number;
    expiringSoon: number;
    graceActive: number;
    revenueMonth: number;
    supplierCostMonth: number;
    costPerMeal: number;
    trends: {
      mealUtilization: { label: string; value: number }[];
      subscriptionRenewals: { label: string; value: number }[];
      costPerMeal: { label: string; value: number }[];
      paymentSuccessRate: { label: string; value: number }[];
    };
  }>("/dashboard/kpis");
}

export async function getBackendSubscriptionPlans() {
  const payload = await fetchJson<{ plans: BackendPlan[] }>("/plans");
  return payload.plans.map(mapPlan);
}

export async function createBackendSubscriptionPlan(input: Omit<SubscriptionPlan, "id">) {
  const payload = await fetchJson<{ plan: BackendPlan }>("/plans", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      meal_type: input.meal_type,
      meals_per_cycle: input.meals_per_cycle,
      price: input.price,
      active: input.active,
      effective_start_date: input.effective_start_date || null,
      effective_end_date: input.effective_end_date || null,
    }),
  });

  return mapPlan(payload.plan);
}

export async function updateBackendSubscriptionPlan(id: string, input: Omit<SubscriptionPlan, "id">) {
  const payload = await fetchJson<{ plan: BackendPlan }>(`/plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: input.name,
      meal_type: input.meal_type,
      meals_per_cycle: input.meals_per_cycle,
      price: input.price,
      active: input.active,
      effective_start_date: input.effective_start_date || null,
      effective_end_date: input.effective_end_date || null,
    }),
  });

  return mapPlan(payload.plan);
}

export async function updateBackendChildProfile(
  id: string,
  input: {
    student_id: string;
    full_name: string;
    school_id: string;
    class_id: string;
    guardian_name: string;
    guardian_phone: string;
    profile_image_url?: string;
    active: boolean;
  }
) {
  const payload = await fetchJson<{
    child: {
      id: string;
      schoolId: string;
      classId: string;
      studentId: string;
      fullName: string;
      profileImageUrl?: string | null;
      subscriptionStatus?: "ACTIVE" | "EXPIRED" | "PAUSED" | "NONE" | "GRACE_PERIOD";
      gracePeriodEndsAt?: string | null;
      active: boolean;
      guardian?: { id: string; name: string; phone: string } | null;
    };
  }>(`/children/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      schoolId: input.school_id,
      classId: input.class_id,
      studentId: input.student_id,
      fullName: input.full_name,
      guardianName: input.guardian_name,
      guardianPhone: input.guardian_phone,
      profileImageUrl: input.profile_image_url || "",
      active: input.active,
    }),
  });

  return {
    child: {
      id: payload.child.id,
      student_id: payload.child.studentId,
      school_id: payload.child.schoolId,
      class_id: payload.child.classId,
      full_name: payload.child.fullName,
      guardian_id: payload.child.guardian?.id || "",
      profile_image_url: payload.child.profileImageUrl || undefined,
      active: payload.child.active,
      subscription_status: payload.child.subscriptionStatus || "NONE",
      grace_period_ends_at: payload.child.gracePeriodEndsAt || undefined,
    } as Child,
    guardian: payload.child.guardian
      ? ({
          id: payload.child.guardian.id,
          name: payload.child.guardian.name,
          phone: payload.child.guardian.phone,
          preferred_channel: "SMS",
        } as Guardian)
      : null,
  };
}

export async function deleteBackendChild(id: string) {
  await fetchJson<{ child: Child }>(`/children/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return true;
}
