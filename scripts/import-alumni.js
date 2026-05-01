const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const SOURCE_PATH =
  process.argv[2] ||
  path.join(__dirname, "..", "..", "datamahasiswa", "Alumni 2000-2025.xlsx");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "alumni.json");

function extractYear(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/(19|20)\d{2}/);
  return match ? match[0] : "";
}

function sanitize(value) {
  return String(value ?? "").trim();
}

if (!fs.existsSync(SOURCE_PATH)) {
  console.error(`File Excel tidak ditemukan: ${SOURCE_PATH}`);
  process.exit(1);
}

const workbook = xlsx.readFile(SOURCE_PATH);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

const baseId = Date.now();
const alumniData = rows.map((row, index) => {
  const graduationDate = sanitize(row["Tanggal Lulus"]);
  const graduationYear =
    extractYear(graduationDate) || extractYear(row["Tahun Lulus"]) || "";

  return {
    id: baseId + index,
    name: sanitize(row["Nama Lulusan"]),
    studentId: sanitize(row["NIM"]),
    entryYear: sanitize(row["Tahun Masuk"]),
    graduationDate: graduationDate,
    graduationYear: graduationYear,
    faculty: sanitize(row["Fakultas"]),
    program: sanitize(row["Program Studi"]),
    email: "",
    phone: "",
    socialLinkedin: "",
    socialInstagram: "",
    socialFacebook: "",
    socialTiktok: "",
    position: "",
    workplace: "",
    workplaceAddress: "",
    employmentType: "",
    workplaceSocialMedia: "",
    status: "Belum Dilacak"
  };
});

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(alumniData, null, 2), "utf-8");
console.log(`Berhasil mengimpor ${alumniData.length} data alumni ke ${OUTPUT_PATH}.`);
