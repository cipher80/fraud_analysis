import Papa from "papaparse";
import * as XLSX from "xlsx";

export async function parseFile(file: File): Promise<Record<string, any>[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const text = await file.text();
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, any>>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results: Papa.ParseResult<Record<string, any>>) =>
          resolve(results.data),
        error: (error: Error) => reject(error),
      });
    });
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
    });
    return json;
  }

  throw new Error("Unsupported file type. Please upload CSV/XLSX/XLS.");
}
