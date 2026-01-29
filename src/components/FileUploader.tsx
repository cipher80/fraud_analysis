import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function FileUploader({
  onFile,
  loading,
  error,
}: {
  onFile: (file: File) => void;
  loading: boolean;
  error?: string | null;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles?.[0]) onFile(acceptedFiles[0]);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  });

  return (
    <div style={{ border: "1px dashed #999", padding: 16, borderRadius: 12 }}>
      <div {...getRootProps()} style={{ padding: 16, cursor: "pointer" }}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here...</p>
        ) : (
          <p>Drag & drop CSV/XLSX here, or click to select</p>
        )}
        {loading && <p>Loading & parsing...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </div>
    </div>
  );
}
