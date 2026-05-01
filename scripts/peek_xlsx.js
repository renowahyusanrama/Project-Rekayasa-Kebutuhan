#!/usr/bin/env node
const XLSX = require("xlsx");
const path = require("path");

const filePath = path.resolve(__dirname, "..", "..", "Alumni 2000-2025.xlsx");
console.log("Reading:", filePath);

const wb = XLSX.readFile(filePath);
console.log("\n=== Sheet Names ===");
console.log(wb.SheetNames);

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  const totalRows = range.e.r - range.s.r + 1;
  const totalCols = range.e.c - range.s.c + 1;
  console.log(`\n=== Sheet: "${name}" ===`);
  console.log(`Rows: ${totalRows}, Cols: ${totalCols}`);

  // Read first 5 rows to see headers and sample data
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: "" });
  console.log("\n--- Headers (row 1) ---");
  console.log(JSON.stringify(data[0]));
  console.log("\n--- Sample rows (2-4) ---");
  for (let i = 1; i < Math.min(4, data.length); i++) {
    console.log(`Row ${i + 1}:`, JSON.stringify(data[i]));
  }
  console.log(`\n--- Last 2 rows ---`);
  for (let i = Math.max(data.length - 2, 1); i < data.length; i++) {
    console.log(`Row ${i + 1}:`, JSON.stringify(data[i]));
  }
}
