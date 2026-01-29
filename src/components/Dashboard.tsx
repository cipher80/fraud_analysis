import { useMemo, useState } from "react";
import type { NormalizedTxn } from "../types/transaction";

import {
  breakdown,
  getSummary,
  timeseriesByMonth,
  topNWhere,
  roundFigureStats,
} from "../utils/analytics";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const MODE_COLORS: Record<string, string> = {
  CREDIT_CARD: "#2563eb", // blue
  DEBIT_CARD: "#f59e0b", // amber
  UPI: "#10b981", // green
  UNKNOWN: "#9ca3af", // gray
};

export default function Dashboard({ rows }: { rows: NormalizedTxn[] }) {
  const [mid, setMid] = useState("");
  const [searchedMid, setSearchedMid] = useState("");

  const filtered = useMemo(() => {
    const key = searchedMid.trim();
    if (!key) return [];
    return rows.filter((r) => r.MID === key);
  }, [rows, searchedMid]);

  const summary = useMemo(() => getSummary(filtered), [filtered]);
  const tsMonth = useMemo(() => timeseriesByMonth(filtered), [filtered]);
  const mode = useMemo(() => breakdown(filtered, "Payment_Mode"), [filtered]);
  const roundStats = useMemo(() => roundFigureStats(filtered), [filtered]);

  // Sort main table: Amount desc, then latest date
  const filteredSorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const amountDiff = (b.Amount ?? -Infinity) - (a.Amount ?? -Infinity);
      if (amountDiff !== 0) return amountDiff;
      return (
        (b.Transaction_Date?.getTime() ?? -Infinity) -
        (a.Transaction_Date?.getTime() ?? -Infinity)
      );
    });
  }, [filtered]);

  // --- Time windows ---
  const nightTxns = useMemo(() => {
    // 22:00 - 05:59
    return filtered.filter((r) => {
      const d = r.Transaction_Date;
      if (!d) return false;
      const h = d.getHours();
      return h >= 22 || h < 6;
    });
  }, [filtered]);

  const morningTxns = useMemo(() => {
    // 06:00 - 11:59
    return filtered.filter((r) => {
      const d = r.Transaction_Date;
      if (!d) return false;
      const h = d.getHours();
      return h >= 6 && h < 12;
    });
  }, [filtered]);

  const afternoonTxns = useMemo(() => {
    // 12:00 - 21:59
    return filtered.filter((r) => {
      const d = r.Transaction_Date;
      if (!d) return false;
      const h = d.getHours();
      return h >= 12 && h < 22;
    });
  }, [filtered]);

  const sortByLatest = (a: NormalizedTxn, b: NormalizedTxn) =>
    (b.Transaction_Date?.getTime() ?? 0) - (a.Transaction_Date?.getTime() ?? 0);

  const nightTxnsSorted = useMemo(
    () => [...nightTxns].sort(sortByLatest),
    [nightTxns],
  );
  const morningTxnsSorted = useMemo(
    () => [...morningTxns].sort(sortByLatest),
    [morningTxns],
  );
  const afternoonTxnsSorted = useMemo(
    () => [...afternoonTxns].sort(sortByLatest),
    [afternoonTxns],
  );

  // Top used identifiers BY MODE
  const topCreditLast4 = useMemo(
    () =>
      topNWhere(
        filtered,
        (r) => r.Payment_Mode === "CREDIT_CARD",
        "Card_Last4",
        10,
      ),
    [filtered],
  );

  const topDebitLast4 = useMemo(
    () =>
      topNWhere(
        filtered,
        (r) => r.Payment_Mode === "DEBIT_CARD",
        "Card_Last4",
        10,
      ),
    [filtered],
  );

  const topUpiVpa = useMemo(
    () =>
      topNWhere(filtered, (r) => r.Payment_Mode === "UPI", "Customer_VPA", 10),
    [filtered],
  );

  return (
    <div className="container">
      <h1 className="pageTitle">Merchant Transaction Visualizer</h1>
      <p className="pageSub">
        Upload CSV/XLSX → Search MID → View graphs & tables for suspicious
        pattern spotting (no backend).
      </p>

      {/* Search Panel */}
      <div className="panel">
        <div className="row">
          <input
            className="input"
            value={mid}
            onChange={(e) => setMid(e.target.value)}
            placeholder="Enter MID"
          />
          <button className="button" onClick={() => setSearchedMid(mid)}>
            Search
          </button>

          {searchedMid && (
            <span className="badge">
              Showing results for MID: <b>{searchedMid}</b>
            </span>
          )}
        </div>

        {searchedMid && filtered.length === 0 && (
          <div className="danger" style={{ marginTop: 10 }}>
            No rows found for this MID. Check if MID exists in the uploaded
            file.
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <>
          <div className="hr" />

          {/* Summary Cards */}
          <div className="gridCards">
            <Card title="Transactions" value={summary.count} />
            <Card title="Total Amount" value={summary.totalAmount.toFixed(2)} />
            <Card title="Avg Amount" value={summary.avgAmount.toFixed(2)} />
            <Card
              title="Total Settled"
              value={summary.totalSettled.toFixed(2)}
            />
            <Card
              title="Round Amounts"
              value={`${roundStats.roundCount} (${roundStats.roundPct.toFixed(1)}%)`}
            />
          </div>

          {/* Time-window count cards */}
          <div style={{ marginTop: 12 }} className="gridCards">
            <Card title="Night (10 PM – 6 AM)" value={nightTxnsSorted.length} />
            <Card
              title="Morning (6 AM – 12 PM)"
              value={morningTxnsSorted.length}
            />
            <Card
              title="Afternoon/Evening (12 PM – 10 PM)"
              value={afternoonTxnsSorted.length}
            />
          </div>

          <div className="hr" />

          {/* Top Round Amount Values */}
          <div className="panel">
            <h3 className="h3">Top Round Amount Values (Amount column)</h3>

            {roundStats.topRounds.length === 0 ? (
              <div className="empty">No round amounts found.</div>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roundStats.topRounds.map((r) => (
                      <tr key={r.amount}>
                        <td>{r.amount}</td>
                        <td>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="small" style={{ marginTop: 8 }}>
              Counts only transactions where <b>Amount round off</b> (e.g.,
              3000, 50000). Values like 4728 or 4444.78 are excluded.
            </div>
          </div>

          <div className="hr" />

          {/* Monthly Chart */}
          <div className="panel">
            <h3 className="h3">Monthly Total Amount</h3>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart
                  data={tsMonth}
                  margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="totalAmount" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="small">
              Shows total transaction Amount per month (for this MID).
            </div>
          </div>

          <div className="hr" />

          {/* Mode + Top identifiers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 12,
            }}
          >
            <div className="panel">
              <h3 className="h3">Payment Mode Pie</h3>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={mode}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {mode.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={MODE_COLORS[entry.name] ?? MODE_COLORS.UNKNOWN}
                        />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="small">
                Distribution of payment modes for this MID.
              </div>
            </div>

            <TopTable
              title="Top CREDIT_CARD used (Last-4)"
              rows={topCreditLast4}
            />
            <TopTable
              title="Top DEBIT_CARD used (Last-4)"
              rows={topDebitLast4}
            />
            <TopTable title="Top UPI used (Customer VPA)" rows={topUpiVpa} />
          </div>

          <div className="hr" />

          {/* Time windows tables */}
          <TimeWindowTable
            title="Night Transactions (10 PM – 6 AM)"
            rows={nightTxnsSorted}
            note="This table shows transactions where the transaction time falls between 22:00 and 06:00."
          />

          <TimeWindowTable
            title="Morning Transactions (6 AM – 12 PM)"
            rows={morningTxnsSorted}
            note="This table shows transactions where the transaction time falls between 06:00 and 12:00."
          />

          <TimeWindowTable
            title="Afternoon/Evening Transactions (12 PM – 10 PM)"
            rows={afternoonTxnsSorted}
            note="This table shows transactions where the transaction time falls between 12:00 and 22:00."
          />

          <div className="hr" />

          {/* Main Table */}
          <div className="panel">
            <h3 className="h3">
              Transactions (first 200) — sorted by Amount (desc)
            </h3>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    {[
                      "Transaction_Date",
                      "Amount",
                      "Settled_Amount",
                      "Payment_Mode",
                      "Customer_VPA",
                      "Card_Last4",
                      "Status",
                      "Risk_category",
                    ].map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSorted.slice(0, 200).map((r, idx) => (
                    <tr key={idx}>
                      <td>{fmtDT(r.Transaction_Date)}</td>
                      <td>{r.Amount ?? ""}</td>
                      <td>{r.Settled_Amount ?? ""}</td>
                      <td>{r.Payment_Mode ?? ""}</td>
                      <td>{r.Customer_VPA ?? ""}</td>
                      <td>{r.Card_Last4 ?? ""}</td>
                      <td>{r.Status ?? ""}</td>
                      <td>{r.Risk_category ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="small" style={{ marginTop: 8 }}>
              Tip: large amount at odd hours + repeated last-4/VPA can be
              suspicious.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function fmtDT(d?: Date | null) {
  return d ? d.toISOString().replace("T", " ").slice(0, 19) : "";
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="card">
      <div className="cardTitle">{title}</div>
      <div className="cardValue">{value}</div>
    </div>
  );
}

function TopTable({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; count: number }[];
}) {
  return (
    <div className="panel">
      <h3 className="h3">{title}</h3>
      {rows.length === 0 ? (
        <div className="empty">No data for this payment mode.</div>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Value</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>{r.key}</td>
                  <td>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="small" style={{ marginTop: 8 }}>
        Higher count = mostly used.
      </div>
    </div>
  );
}

function TimeWindowTable({
  title,
  rows,
  note,
}: {
  title: string;
  rows: NormalizedTxn[];
  note: string;
}) {
  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 className="h3" style={{ marginBottom: 0 }}>
          {title}
        </h3>
        <span className="badge">
          Count: <b>{rows.length}</b>
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="empty" style={{ marginTop: 10 }}>
          No transactions found in this time range.
        </div>
      ) : (
        <div className="tableWrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                {[
                  "Transaction_Date",
                  "Amount",
                  "Payment_Mode",
                  "Card_Last4",
                  "Customer_VPA",
                ].map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((r, idx) => (
                <tr key={idx}>
                  <td>{fmtDT(r.Transaction_Date)}</td>
                  <td>{r.Amount ?? ""}</td>
                  <td>{r.Payment_Mode ?? ""}</td>
                  <td>
                    {r.Payment_Mode === "CREDIT_CARD" ||
                    r.Payment_Mode === "DEBIT_CARD"
                      ? (r.Card_Last4 ?? "")
                      : ""}
                  </td>
                  <td>
                    {r.Payment_Mode === "UPI" ? (r.Customer_VPA ?? "") : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="small" style={{ marginTop: 10 }}>
        {note}
      </div>
    </div>
  );
}
