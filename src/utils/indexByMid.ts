import type { NormalizedTxn } from "../types/transaction";

export function indexByMid(rows: NormalizedTxn[]) {
  const map = new Map<string, NormalizedTxn[]>();
  for (const r of rows) {
    const key = r.MID.trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return map;
}
