import type { NormalizedTxn } from "../types/transaction";

function dayKey(d: Date) {
  // yyyy-mm-dd
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getSummary(rows: NormalizedTxn[]) {
  const amounts = rows.map((r) => r.Amount ?? 0);
  const totalAmount = amounts.reduce((a, b) => a + b, 0);
  const avgAmount = rows.length ? totalAmount / rows.length : 0;

  const settled = rows
    .map((r) => r.Settled_Amount ?? 0)
    .reduce((a, b) => a + b, 0);

  return {
    count: rows.length,
    totalAmount,
    avgAmount,
    totalSettled: settled,
  };
}

export function timeseriesByDay(rows: NormalizedTxn[]) {
  const map = new Map<
    string,
    { day: string; count: number; totalAmount: number; totalSettled: number }
  >();

  for (const r of rows) {
    if (!r.Transaction_Date) continue;
    const k = dayKey(r.Transaction_Date);
    if (!map.has(k))
      map.set(k, { day: k, count: 0, totalAmount: 0, totalSettled: 0 });
    const obj = map.get(k)!;
    obj.count += 1;
    obj.totalAmount += r.Amount ?? 0;
    obj.totalSettled += r.Settled_Amount ?? 0;
  }

  return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day));
}

export function breakdown(rows: NormalizedTxn[], field: keyof NormalizedTxn) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = (r[field] ?? "Unknown") as any;
    const key = String(v || "Unknown");
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function topN(
  rows: NormalizedTxn[],
  field: keyof NormalizedTxn,
  n = 10,
) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = (r[field] ?? "") as any;
    const key = String(v || "");
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export function timeseriesByMonth(rows: NormalizedTxn[]) {
  const map = new Map<
    string,
    { month: string; totalAmount: number; totalSettled: number; count: number }
  >();

  for (const r of rows) {
    if (!r.Transaction_Date) continue;

    const d = r.Transaction_Date;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const key = `${yyyy}-${mm}`; // YYYY-MM

    if (!map.has(key)) {
      map.set(key, { month: key, totalAmount: 0, totalSettled: 0, count: 0 });
    }

    const obj = map.get(key)!;
    obj.count += 1;
    obj.totalAmount += r.Amount ?? 0;
    obj.totalSettled += r.Settled_Amount ?? 0;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}
export function topNWhere(
  rows: NormalizedTxn[],
  where: (r: NormalizedTxn) => boolean,
  field: keyof NormalizedTxn,
  n = 10,
) {
  const map = new Map<string, number>();

  for (const r of rows) {
    if (!where(r)) continue;
    const v = r[field] ?? "";
    const key = String(v || "").trim();
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export function roundFigureStats(rows: NormalizedTxn[]) {
  const amounts = rows
    .map((r) => r.Amount ?? null)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const total = amounts.length;

  // Round amounts: integers ending with 0
  const roundAmounts = amounts.filter(
    (a) => Number.isInteger(a) && a % 10 === 0,
  );

  const roundCount = roundAmounts.length;
  const roundPct = total ? (roundCount / total) * 100 : 0;

  // Frequency of round amounts (top 10)
  const freq = new Map<number, number>();
  for (const a of roundAmounts) {
    freq.set(a, (freq.get(a) ?? 0) + 1);
  }

  const topRounds = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([amount, count]) => ({ amount, count }));

  return {
    total,
    roundCount,
    roundPct,
    topRounds,
  };
}
