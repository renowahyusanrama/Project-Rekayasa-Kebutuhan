#!/usr/bin/env node
/**
 * Convert Alumni 2000-2025.xlsx → alumni.json
 * Normalizes field names to match the system's canonical schema.
 */
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.resolve(ROOT, "..", "Alumni 2000-2025.xlsx");
const OUT_JSON = path.join(ROOT, "data", "alumni.json");
const OUT_PUBLIC = path.join(ROOT, "public", "data", "alumni.json");

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function normalizeText(s) { return s === null || s === undefined ? "" : String(s).trim(); }

function extractYear(dateStr) {
  const m = String(dateStr || "").match(/(19|20)\d{2}/);
  return m ? m[0] : "";
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error("File not found:", XLSX_PATH);
    process.exit(1);
  }

  console.log("Reading:", XLSX_PATH);
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });

  console.log(`Total rows: ${raw.length}`);

  const alumni = raw.map((r, idx) => {
    return {
      id: idx + 1,
      nama: normalizeText(r["Nama Lulusan"] || r["nama"] || ""),
      nim: normalizeText(r["NIM"] || r["nim"] || ""),
      fakultas: normalizeText(r["Fakultas"] || r["fakultas"] || ""),
      jurusan: normalizeText(r["Program Studi"] || r["jurusan"] || ""),
      tahunMasuk: normalizeText(r["Tahun Masuk"] || r["tahunMasuk"] || ""),
      tanggalLulus: normalizeText(r["Tanggal Lulus"] || r["tanggalLulus"] || ""),
      tahunLulus: extractYear(r["Tanggal Lulus"] || r["tahunLulus"] || ""),
      status: "Belum Dilacak",
      // === 8 ITEM YANG HARUS DIISI ===
      email: "",
      noHp: "",
      linkedin: "",
      instagram: "",
      facebook: "",
      tiktok: "",
      tempatBekerja: "",
      alamatBekerja: "",
      posisi: "",
      kategoriKarier: "",       // PNS, Swasta, Wirausaha
      sosialTempatKerja: ""     // Sosmed tempat bekerja
    };
  });

  ensureDir(path.dirname(OUT_JSON));
  ensureDir(path.dirname(OUT_PUBLIC));

  fs.writeFileSync(OUT_JSON, JSON.stringify(alumni, null, 2), "utf8");
  console.log(`Wrote: ${OUT_JSON} (${alumni.length} records)`);

  // Also write to public for the frontend
  fs.writeFileSync(OUT_PUBLIC, JSON.stringify(alumni, null, 2), "utf8");
  console.log(`Wrote: ${OUT_PUBLIC} (${alumni.length} records)`);

  // Stats
  const faculties = {};
  const years = {};
  for (const a of alumni) {
    faculties[a.fakultas] = (faculties[a.fakultas] || 0) + 1;
    years[a.tahunLulus] = (years[a.tahunLulus] || 0) + 1;
  }

  console.log("\n=== Statistik Fakultas ===");
  for (const [f, c] of Object.entries(faculties).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${f}: ${c}`);
  }

  console.log("\n=== Statistik Tahun Lulus (top 10) ===");
  for (const [y, c] of Object.entries(years).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${y}: ${c}`);
  }
}

main();
