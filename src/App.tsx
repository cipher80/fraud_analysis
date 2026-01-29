import { useMemo, useState } from "react";
import FileUploader from "./components/FileUploader";
import Dashboard from "./components/Dashboard";
import { parseFile } from "./utils/parseFile";
import { normalizeRows } from "./utils/normalize";
import type { NormalizedTxn } from "./types/transaction";

export default function App() {
  const [rawCount, setRawCount] = useState<number>(0);
  const [rows, setRows] = useState<NormalizedTxn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File) => {
    try {
      setError(null);
      setLoading(true);

      const raw = await parseFile(file);
      setRawCount(raw.length);

      const normalized = normalizeRows(raw);
      setRows(normalized);
    } catch (e: any) {
      setError(e?.message || "Failed to parse file");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      rawCount,
      normalizedCount: rows.length,
      uniqueMids: new Set(rows.map((r) => r.MID)).size,
    };
  }, [rawCount, rows]);

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 16,
        fontFamily: "system-ui, Arial",
      }}
    >
      {/* <h1 style={{ marginBottom: 4 }}>Merchant Transaction Visualizer1</h1> */}
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Upload CSV/XLSX → Search MID → View graphs for suspicious pattern
        spotting (no backend).
      </p>

      <FileUploader onFile={onFile} loading={loading} error={error} />

      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          opacity: 0.85,
        }}
      >
        <span>
          Rows parsed: <b>{stats.rawCount}</b>
        </span>
        <span>
          Rows with MID: <b>{stats.normalizedCount}</b>
        </span>
        <span>
          Unique MIDs: <b>{stats.uniqueMids}</b>
        </span>
      </div>

      <div style={{ marginTop: 16 }}>
        {rows.length > 0 ? (
          <Dashboard rows={rows} />
        ) : (
          <div style={{ marginTop: 16, opacity: 0.8 }}>
            Upload a file to begin.
          </div>
        )}
      </div>
    </div>
  );
}
