import { MealServe, Transaction, SupplierInvoice } from "./types";

const encoder = new TextEncoder();

async function sha256Hex(value: string) {
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildMealLeafHashes(meals: MealServe[]) {
  const orderedMeals = [...meals].sort((left, right) =>
    `${left.serve_date}:${left.school_id}:${left.child_id}:${left.meal_type}`.localeCompare(
      `${right.serve_date}:${right.school_id}:${right.child_id}:${right.meal_type}`
    )
  );

  return Promise.all(
    orderedMeals.map((meal) =>
      sha256Hex(
        JSON.stringify({
          serve_date: meal.serve_date,
          school_id: meal.school_id,
          meal_type: meal.meal_type,
          is_grace: Boolean(meal.is_grace),
          child_ref: meal.child_id,
        })
      )
    )
  );
}

export async function buildMerkleRoot(leaves: string[]) {
  if (leaves.length === 0) {
    return sha256Hex("feedclass-empty-root");
  }

  let level = [...leaves];
  while (level.length > 1) {
    const nextLevel: string[] = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      const right = level[index + 1] ?? left;
      nextLevel.push(await sha256Hex(`${left}:${right}`));
    }
    level = nextLevel;
  }

  return level[0];
}

export async function buildAnchorHashes(meals: MealServe[], anchorDate: string) {
  const leaves = await buildMealLeafHashes(meals);
  const merkleRoot = await buildMerkleRoot(leaves);
  const celoTxHash = await sha256Hex(`celo:${anchorDate}:${merkleRoot}`);
  return { leaves, merkleRoot, celoTxHash };
}

export function getFinancingTotalForDate(date: string, transactions: Transaction[]) {
  return transactions
    .filter((entry) => entry.type === "SUBSCRIPTION_PURCHASE" && entry.created_at.slice(0, 10) <= date)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function getSupplierCostTotalForDate(date: string, invoices: SupplierInvoice[]) {
  const month = date.slice(0, 7);
  return invoices
    .filter((entry) => entry.month === month)
    .reduce((sum, entry) => sum + entry.amount, 0);
}
