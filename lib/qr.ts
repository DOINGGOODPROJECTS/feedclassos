import { Child } from "./types";

function mixHash(seed: number, value: string) {
  let hash = seed;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function buildChildQrPayload(child: Pick<Child, "id" | "school_id" | "class_id" | "student_id">) {
  const source = [child.id, child.school_id, child.class_id, child.student_id].join("|");
  let state = 2166136261;
  const chunks: string[] = [];

  for (let index = 0; index < 4; index += 1) {
    state = mixHash(state ^ (index * 374761393), source);
    chunks.push(state.toString(16).toUpperCase().padStart(8, "0"));
  }

  return `SMMS-${chunks.join("-")}`;
}

export function buildVerificationLink(payload: string) {
  return `https://verify.feedclass.app/qr/${encodeURIComponent(payload)}`;
}
