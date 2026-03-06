export type Role = "ADMIN" | "SCHOOL_ADMIN" | "DONOR_READONLY";

export type SchoolStaffRole = "SUPERVISOR";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "PAUSED" | "NONE";

export type TransactionType =
  | "SUBSCRIPTION_PURCHASE"
  | "DEBIT_MEAL"
  | "GRACE_MEAL"
  | "ADJUSTMENT";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export type ValidationResult = "SUCCESS" | "FAILED";

export type ReasonCode =
  | "NO_SUBSCRIPTION"
  | "EXPIRED"
  | "ALREADY_SERVED"
  | "WRONG_SCHOOL"
  | "INACTIVE_CHILD"
  | "INSUFFICIENT_MEALS"
  | "GRACE_EXPIRED"
  | "OK";

export interface User {
  id: string;
  name: string;
  role: Role;
  assigned_school_id?: string;
}

export interface SchoolStaff {
  id: string;
  school_id: string;
  name: string;
  email: string;
  role: SchoolStaffRole;
  access_active: boolean;
}

export interface BlockchainAnchor {
  id: string;
  anchor_date: string;
  meal_count: number;
  school_ids: string[];
  merkle_root: string;
  celo_tx_hash: string;
  celo_block_number: number;
  financing_total: number;
  supplier_cost_total: number;
  status: "ANCHORED";
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  location: string;
}

export interface ClassRoom {
  id: string;
  school_id: string;
  name: string;
  grade: string;
}

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  preferred_channel: "SMS" | "WHATSAPP" | "EMAIL";
}

export interface Child {
  id: string;
  student_id: string;
  school_id: string;
  class_id: string;
  full_name: string;
  guardian_id: string;
  profile_image_url?: string;
  active: boolean;
}

export interface ChildQr {
  child_id: string;
  qr_payload: string;
  qr_image_url: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  meal_type: MealType;
  meals_per_cycle: number;
  price: number;
  active: boolean;
}

export interface ChildSubscription {
  child_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  meals_remaining: number;
  plan_id: string;
}

export interface Transaction {
  id: string;
  child_id: string;
  type: TransactionType;
  amount: number;
  metadata: Record<string, string>;
  created_at: string;
}

export interface PaymentIntent {
  id: string;
  child_id: string;
  plan_id: string;
  amount: number;
  reference: string;
  status: PaymentStatus;
  payment_url: string;
}

export interface PaymentEvent {
  id: string;
  external_tx_id: string;
  intent_id: string;
  status: PaymentStatus;
  created_at: string;
}

export interface MealServe {
  id: string;
  child_id: string;
  school_id: string;
  meal_type: MealType;
  serve_date: string;
  created_at: string;
  is_grace?: boolean;
}

export interface ValidationLog {
  id: string;
  child_id?: string;
  school_id: string;
  qr_payload: string;
  result: ValidationResult;
  reason_code: ReasonCode;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  type: string;
  message: string;
  created_at: string;
}

export interface MessageOutbox {
  id: string;
  channel: "SMS" | "WHATSAPP" | "EMAIL";
  recipient: string;
  status: "PENDING" | "SENT" | "FAILED";
  payload: string;
  created_at: string;
}

export interface MessageLog {
  id: string;
  status: "PENDING" | "SENT" | "FAILED";
  detail: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  active: boolean;
}

export interface SupplierInvoice {
  id: string;
  supplier_id: string;
  school_id: string;
  month: string;
  amount: number;
  status: "PAID" | "DUE";
}

export interface SupplierPayment {
  id: string;
  supplier_id: string;
  invoice_id: string;
  amount: number;
  paid_at: string;
}

export interface GracePeriod {
  child_id: string;
  start_date: string;
  days_used: number;
  last_served_date?: string;
  notified: boolean;
}

export interface SupervisorChildLookupItem {
  child: Child;
  class_name: string;
  grade: string;
  guardian?: Guardian;
  subscription?: ChildSubscription | null;
  qr?: ChildQr | null;
}

export interface AnomalyAlert {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  created_at: string;
}

export interface AiReport {
  id: string;
  title: string;
  summary: string;
  created_at: string;
}
