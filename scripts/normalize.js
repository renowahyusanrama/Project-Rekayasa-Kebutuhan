#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch (e) {
    return false;
  }
}

function readJson(p) {
  const txt = fs.readFileSync(p, "utf8");
  return JSON.parse(txt);
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeText(s) {
  if (s === null || s === undefined) return "";
  return String(s).trim();
}

function removeDiacritics(s) {
  return s.normalize && s.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || s;
}

function normalizeName(s) {
  const t = normalizeText(s);
  return removeDiacritics(t).replace(/\s+/g, " ").trim();
}

function normalizeNim(s) {
  const t = normalizeText(s);
  return t.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

function normalizePhone(s) {
  const t = normalizeText(s);
  return t.replace(/[^\d+]/g, "");
}

function toCSVRow(fields) {
  return fields.map((v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(",");
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const candidates = [
    path.join(root, "data", "alumni.json"),
    path.join(root, "public", "alumni.json"),
    path.join(root, "alumni.json"),
    path.join(root, "data", "Alumni.json")
  ];

  let source = null;
  for (const c of candidates) {
    if (fileExists(c)) {
      source = c;
      break;
    }
  }

  if (!source) {
    console.error("No alumni.json found in data/ or public/. Place the file at data/alumni.json.");
    process.exit(1);
  }

  console.log("Reading data from:", source);
  const raw = readJson(source);
  if (!Array.isArray(raw)) {
    console.error("Expected an array in alumni.json");
    process.exit(1);
  }

  const canonicalFields = [
    "id",
    "name",
    "nim",
    "fakultas",
    "jurusan",
    "tahunMasuk",
    "tahunLulus",
    "status",
    "email",
    "noHp",
    "linkedin",
    "instagram",
    "facebook",
    "tiktok",
    "tempatBekerja",
    "alamatBekerja",
    "posisi",
    "kategoriKarier",
    "workplace_social"
  ];

  const normalized = raw.map((r, idx) => {
    const id = r.id || r.ID || r.Id || Date.now() + idx;
    const name = normalizeName(r.name || r.nama || r["Nama Lulusan"] || r.fullName || "");
    const nim = normalizeNim(r.nim || r.NIM || r.studentId || r.student_id || r["student id"] || "");
    const email = normalizeText(r.email || r.Email || r.e_mail || "");
    const noHp = normalizePhone(r.noHp || r.phone || r["nomor hp"] || r["no hp"] || "");
    const fakultas = normalizeText(r.fakultas || r.Fakultas || r.faculty || "");
    const jurusan = normalizeText(r.jurusan || r.jurusan || r.program || r["Program Studi"] || "");
    const tahunMasuk = normalizeText(r.tahunMasuk || r["Tahun Masuk"] || r.entryYear || "");
    const tahunLulus = normalizeText(r.tahunLulus || r["Tahun Lulus"] || r.graduationYear || r.tahun_lulus || "");
    const status = normalizeText(r.status || "");
    const linkedin = normalizeText(r.linkedin || r.socialLinkedin || "");
    const instagram = normalizeText(r.instagram || r.socialInstagram || "");
    const facebook = normalizeText(r.facebook || r.socialFacebook || "");
    const tiktok = normalizeText(r.tiktok || r.socialTiktok || "");
    const tempatBekerja = normalizeText(r.tempatBekerja || r.workplace || r.company || "");
    const alamatBekerja = normalizeText(r.alamatBekerja || r.workplaceAddress || r.location || "");
    const posisi = normalizeText(r.posisi || r.position || r.job || "");
    const kategoriKarier = normalizeText(r.kategoriKarier || r.employmentType || "");
    const workplace_social = normalizeText(r.workplaceSocialMedia || r.workplace_social || "");

    const out = {
      id,
      name,
      nim,
      fakultas,
      jurusan,
      tahunMasuk,
      tahunLulus,
      status,
      email,
      noHp,
      linkedin,
      instagram,
      facebook,
      tiktok,
      tempatBekerja,
      alamatBekerja,
      posisi,
      kategoriKarier,
      workplace_social
    };

    // Include raw source only when explicitly requested via env var.
    if (process.env.INCLUDE_RAW === "1" || process.env.INCLUDE_RAW === "true") {
      out.__raw = r;
    }

    return out;
  });

  ensureDir(path.join(root, "data"));
  ensureDir(path.join(root, "outputs"));
  const outJson = path.join(root, "data", "normalized_alumni.json");
  writeJson(outJson, normalized);
  console.log("Wrote:", outJson, "(records=", normalized.length, ")");

  // write CSV
  const csvPath = path.join(root, "outputs", "normalized_alumni.csv");
  const header = toCSVRow(canonicalFields);
  const lines = [header];
  for (const r of normalized) {
    const row = canonicalFields.map((k) => r[k] || "");
    lines.push(toCSVRow(row));
  }
  fs.writeFileSync(csvPath, lines.join("\n"), "utf8");
  console.log("Wrote CSV:", csvPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
