const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_PATH = path.join(__dirname, "data", "alumni.json");
const ADMIN_USERNAME = process.env.ALUMNI_ADMIN_USER || "Admin123";
const ADMIN_PASSWORD = process.env.ALUMNI_ADMIN_PASS || "Admin123";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8;

const STATUS_OPTIONS = ["Teridentifikasi", "Perlu Verifikasi", "Belum Dilacak"];
const EMPLOYMENT_OPTIONS = ["PNS", "Swasta", "Wirausaha"];
const tokenStore = new Map();
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

// Middleware to parse JSON bodies and serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

function ensureDataFile() {
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, "[]", "utf-8");
      console.log("File data/alumni.json dibuat otomatis.");
    }
  } catch (error) {
    console.error("Gagal memastikan file data.", error);
  }
}

function extractYear(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/(19|20)\d{2}/);
  return match ? match[0] : "";
}

function normalizeStatus(status) {
  return STATUS_OPTIONS.includes(status) ? status : "Belum Dilacak";
}

function normalizeEmploymentType(value) {
  if (!value) return "";
  const normalized = String(value).trim();
  const match = EMPLOYMENT_OPTIONS.find(
    (option) => option.toLowerCase() === normalized.toLowerCase()
  );
  return match || "";
}

function sanitizeText(value) {
  return String(value ?? "").trim();
}

function ensureId(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  return Date.now() + Math.floor(Math.random() * 1000000);
}

function normalizeAlumniRecord(record) {
  if (!record || typeof record !== "object") {
    return {
      id: ensureId(),
      name: "",
      studentId: "",
      entryYear: "",
      graduationDate: "",
      graduationYear: "",
      faculty: "",
      program: "",
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
  }

  const graduationDate = sanitizeText(record.graduationDate || record["Tanggal Lulus"]);
  const rawYear = sanitizeText(record.graduationYear || graduationDate || record["Tanggal Lulus"]);
  const derivedYear = extractYear(rawYear);

  return {
    id: ensureId(record.id),
    name: sanitizeText(record.name || record["Nama Lulusan"]),
    studentId: sanitizeText(record.studentId || record.nim || record.NIM),
    entryYear: sanitizeText(record.entryYear || record["Tahun Masuk"]),
    graduationDate: graduationDate,
    graduationYear: derivedYear || sanitizeText(record.graduationYear),
    faculty: sanitizeText(record.faculty || record.Fakultas),
    program: sanitizeText(record.program || record["Program Studi"]),
    email: sanitizeText(record.email),
    phone: sanitizeText(record.phone),
    socialLinkedin: sanitizeText(record.socialLinkedin || record.linkedin),
    socialInstagram: sanitizeText(record.socialInstagram || record.instagram),
    socialFacebook: sanitizeText(record.socialFacebook || record.facebook),
    socialTiktok: sanitizeText(record.socialTiktok || record.tiktok),
    position: sanitizeText(record.position || record.job),
    workplace: sanitizeText(record.workplace || record.company),
    workplaceAddress: sanitizeText(record.workplaceAddress || record.location),
    employmentType: normalizeEmploymentType(record.employmentType),
    workplaceSocialMedia: sanitizeText(record.workplaceSocialMedia),
    status: normalizeStatus(record.status)
  };
}

function readAlumniData() {
  // Read JSON file safely; return empty array if file missing or invalid
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    return list.map((item) => normalizeAlumniRecord(item));
  } catch (error) {
    console.error("Gagal membaca data alumni.", error);
    return [];
  }
}

function writeAlumniData(data) {
  // Persist data to JSON file with pretty formatting
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Gagal menulis data alumni.", error);
    return false;
  }
}

function validateGraduationYear(graduationYear) {
  const yearString = String(graduationYear ?? "").trim();
  const extractedYear = extractYear(yearString);
  const yearNumber = Number(extractedYear || yearString);
  const currentYear = new Date().getFullYear();

  if (!yearString) {
    return "Tahun lulus wajib diisi.";
  }

  if (!Number.isInteger(yearNumber)) {
    return "Tahun lulus harus berupa angka.";
  }

  if (yearNumber > currentYear) {
    return "Tahun lulus tidak boleh lebih besar dari tahun sekarang.";
  }

  return "";
}

function parsePagination(req) {
  let limit = Number(req.query.limit);
  if (!Number.isFinite(limit) || limit <= 0) limit = DEFAULT_LIMIT;
  limit = Math.min(limit, MAX_LIMIT);
  let offset = Number(req.query.offset);
  if (!Number.isFinite(offset) || offset < 0) offset = 0;
  return { limit, offset };
}

function computeStatusStats(list) {
  let identified = 0;
  let verify = 0;
  let untracked = 0;

  list.forEach((item) => {
    const status = normalizeStatus(item.status);
    if (status === "Teridentifikasi") identified += 1;
    else if (status === "Perlu Verifikasi") verify += 1;
    else untracked += 1;
  });

  return { identified, verify, untracked };
}

function issueToken(username) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  tokenStore.set(token, { username, expiresAt });
  return { token, expiresAt };
}

function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}

function verifyToken(token) {
  if (!token) return null;
  const session = tokenStore.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    tokenStore.delete(token);
    return null;
  }
  return session;
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  const session = verifyToken(token);
  if (!session) {
    return res.status(401).json({ message: "Login diperlukan untuk mengakses data." });
  }
  req.user = session.username;
  next();
}

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = sanitizeText(username);
  const pass = sanitizeText(password);

  if (user !== ADMIN_USERNAME || pass !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Username atau password salah." });
  }

  const session = issueToken(user);
  res.json({
    token: session.token,
    expiresAt: session.expiresAt,
    user: user
  });
});

app.get("/auth", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Protect alumni routes
app.use("/alumni", requireAuth);

// GET /alumni -> list all alumni
app.get("/alumni", (req, res) => {
  const alumni = readAlumniData();
  const { limit, offset } = parsePagination(req);
  const total = alumni.length;
  const data = alumni.slice(offset, offset + limit);
  const stats = computeStatusStats(alumni);
  res.json({ data, total, limit, offset, stats });
});

// POST /alumni -> add new alumni
app.post("/alumni", (req, res) => {
  try {
    console.log("Request body:", req.body);
    const {
      name,
      studentId,
      entryYear,
      graduationDate,
      graduationYear,
      faculty,
      program,
      email,
      phone,
      socialLinkedin,
      socialInstagram,
      socialFacebook,
      socialTiktok,
      position,
      workplace,
      workplaceAddress,
      employmentType,
      workplaceSocialMedia,
      status
    } = req.body || {};

    // Basic validation
    if (!name || !program || !graduationYear) {
      return res.status(400).json({
        message: "Nama, program studi, dan tahun lulus wajib diisi."
      });
    }

    const yearError = validateGraduationYear(graduationYear || graduationDate);
    if (yearError) {
      return res.status(400).json({ message: yearError });
    }

    if (employmentType && !EMPLOYMENT_OPTIONS.includes(employmentType)) {
      return res.status(400).json({ message: "Status pekerjaan tidak valid." });
    }

    const alumni = readAlumniData();
    const newAlumni = {
      id: Date.now(),
      name: sanitizeText(name),
      studentId: sanitizeText(studentId),
      entryYear: sanitizeText(entryYear),
      graduationDate: sanitizeText(graduationDate),
      graduationYear: extractYear(graduationYear || graduationDate) || sanitizeText(graduationYear),
      faculty: sanitizeText(faculty),
      program: sanitizeText(program),
      email: sanitizeText(email),
      phone: sanitizeText(phone),
      socialLinkedin: sanitizeText(socialLinkedin),
      socialInstagram: sanitizeText(socialInstagram),
      socialFacebook: sanitizeText(socialFacebook),
      socialTiktok: sanitizeText(socialTiktok),
      position: sanitizeText(position),
      workplace: sanitizeText(workplace),
      workplaceAddress: sanitizeText(workplaceAddress),
      employmentType: normalizeEmploymentType(employmentType),
      workplaceSocialMedia: sanitizeText(workplaceSocialMedia),
      status: normalizeStatus(status)
    };

    alumni.push(newAlumni);
    const saved = writeAlumniData(alumni);

    if (!saved) {
      return res.status(500).json({ message: "Gagal menyimpan data alumni." });
    }

    res.status(201).json(newAlumni);
  } catch (error) {
    console.error("Error pada POST /alumni.", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

// PUT /alumni/:id -> update alumni by id
app.put("/alumni/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      studentId,
      entryYear,
      graduationDate,
      graduationYear,
      faculty,
      program,
      email,
      phone,
      socialLinkedin,
      socialInstagram,
      socialFacebook,
      socialTiktok,
      position,
      workplace,
      workplaceAddress,
      employmentType,
      workplaceSocialMedia,
      status
    } = req.body || {};

    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "ID alumni tidak valid." });
    }

    if (!name || !program || !graduationYear) {
      return res.status(400).json({ message: "Nama, program studi, dan tahun lulus wajib diisi." });
    }

    const yearError = validateGraduationYear(graduationYear || graduationDate);
    if (yearError) {
      return res.status(400).json({ message: yearError });
    }

    if (employmentType && !EMPLOYMENT_OPTIONS.includes(employmentType)) {
      return res.status(400).json({ message: "Status pekerjaan tidak valid." });
    }

    const alumni = readAlumniData();
    const index = alumni.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ message: "Data alumni tidak ditemukan." });
    }

    const updatedAlumni = {
      ...alumni[index],
      name: sanitizeText(name),
      studentId: sanitizeText(studentId),
      entryYear: sanitizeText(entryYear),
      graduationDate: sanitizeText(graduationDate),
      graduationYear: extractYear(graduationYear || graduationDate) || sanitizeText(graduationYear),
      faculty: sanitizeText(faculty),
      program: sanitizeText(program),
      email: sanitizeText(email),
      phone: sanitizeText(phone),
      socialLinkedin: sanitizeText(socialLinkedin),
      socialInstagram: sanitizeText(socialInstagram),
      socialFacebook: sanitizeText(socialFacebook),
      socialTiktok: sanitizeText(socialTiktok),
      position: sanitizeText(position),
      workplace: sanitizeText(workplace),
      workplaceAddress: sanitizeText(workplaceAddress),
      employmentType: normalizeEmploymentType(employmentType),
      workplaceSocialMedia: sanitizeText(workplaceSocialMedia),
      status: normalizeStatus(status)
    };

    alumni[index] = updatedAlumni;
    const saved = writeAlumniData(alumni);

    if (!saved) {
      return res.status(500).json({ message: "Gagal memperbarui data alumni." });
    }

    res.json(updatedAlumni);
  } catch (error) {
    console.error("Error pada PUT /alumni/:id.", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

// GET /alumni/search?name= -> search by name
app.get("/alumni/search", (req, res) => {
  const query = (req.query.name || "").toString().trim().toLowerCase();
  const alumni = readAlumniData();
  const filtered = query
    ? alumni.filter((item) => item.name.toLowerCase().includes(query))
    : alumni;
  const { limit, offset } = parsePagination(req);
  const total = filtered.length;
  const data = filtered.slice(offset, offset + limit);
  const stats = computeStatusStats(filtered);
  res.json({ data, total, limit, offset, stats });
});

// DELETE /alumni/:id -> delete alumni by id
app.delete("/alumni/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const alumni = readAlumniData();

    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "ID alumni tidak valid." });
    }

    const updated = alumni.filter((item) => item.id !== id);

    if (updated.length === alumni.length) {
      return res.status(404).json({ message: "Data alumni tidak ditemukan." });
    }

    const saved = writeAlumniData(updated);
    if (!saved) {
      return res.status(500).json({ message: "Gagal menghapus data alumni." });
    }

    res.json({ message: "Data alumni berhasil dihapus." });
  } catch (error) {
    console.error("Error pada DELETE /alumni/:id.", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

// Ensure data file exists on startup
ensureDataFile();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
