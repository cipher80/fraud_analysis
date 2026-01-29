import * as XLSX from "xlsx";
import type { NormalizedTxn } from "../types/transaction";

function cleanKey(k: string) {
  return (k || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function toStr(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toNum(v: any): number | null {
  const s = toStr(v).replace(/,/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Handles Date objects, Excel serial numbers, and date strings
function toDate(v: any): Date | null {
  if (!v && v !== 0) return null;

  if (v instanceof Date && !isNaN(v.getTime())) return v;

  // Excel date serial number
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d, d.H, d.M, d.S));
  }

  const s = toStr(v);
  if (!s) return null;

  // Try native parse
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) return dt;

  // Try DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]) - 1;
    const yy = Number(m[3].length === 2 ? "20" + m[3] : m[3]);
    const d2 = new Date(yy, mm, dd);
    return isNaN(d2.getTime()) ? null : d2;
  }

  return null;
}

export function normalizeRows(rawRows: Record<string, any>[]): NormalizedTxn[] {
  return rawRows
    .map((row) => {
      // Create a normalized-key map of original row
      const map: Record<string, any> = {};
      for (const k of Object.keys(row)) {
        map[cleanKey(k)] = row[k];
      }

      // Flexible header mapping:
      const MID = toStr(map["mid"] || map["m_id"] || map["merchant_id"]);

      const txn: NormalizedTxn = {
        MID,
        Transaction_Date: toDate(
          map["transaction_date"] || map["txn_date"] || map["date"],
        ),
        Amount: toNum(map["amount"]),
        Settled_Amount: toNum(map["settled_amount"] || map["settledamount"]),
        Customer_VPA:
          toStr(map["customer_vpa"] || map["vpa"] || map["payer_vpa"]) || null,
        Card_Last4:
          toStr(
            map["cred/debit_card_last_4_digits"] ||
              map["card_last_4_digits"] ||
              map["last_4_digits"],
          ) || null,
        Payment_Mode: toStr(map["payment_mode"] || map["mode"]) || null,
        KYB_ID: toStr(map["kyb_id"] || map["kyb"]) || null,
        Merchant_name:
          toStr(map["merchant_name"] || map["merchantname"]) || null,
        Status: toStr(map["status"]) || null,
        Category: toStr(map["category"]) || null,
        Sub_Category:
          toStr(
            map["sub-category"] || map["sub_category"] || map["subcategory"],
          ) || null,
        Entity_Type: toStr(map["entity_type"]) || null,
        Onboarding_date: toDate(
          map["onboarding_date"] || map["onboardingdate"],
        ),
        Risk_category:
          toStr(map["risk_category"] || map["riskcategory"]) || null,
        __raw: row,
      };

      return txn;
    })
    .filter((r) => r.MID); // drop rows without MID
}
