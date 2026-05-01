const form = document.getElementById("alumniForm");
const tableBody = document.querySelector("#alumniTable tbody");
const searchInput = document.getElementById("searchName");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("statusMessage");
const submitBtn = document.getElementById("submitBtn");
const statusSelect = document.getElementById("status");
const totalCountEl = document.getElementById("totalCount");
const identifiedCountEl = document.getElementById("identifiedCount");
const verifyCountEl = document.getElementById("verifyCount");
const untrackedCountEl = document.getElementById("untrackedCount");
const authButton = document.getElementById("authButton");
const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const cancelLogin = document.getElementById("cancelLogin");
const loginHint = document.getElementById("loginHint");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const detailModal = document.getElementById("detailModal");
const detailBody = document.getElementById("detailBody");
const detailName = document.getElementById("detailName");
const closeDetail = document.getElementById("closeDetail");

/* Improve developer feedback: force light cache-bust for style.css on local dev and log what's loaded */
(function ensureCssFresh() {
  try {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const cssLink = links.find((l) => /style\.css($|\?)/.test(l.getAttribute("href") || ""));
    if (!cssLink) return;

    function applyBust() {
      const href = cssLink.getAttribute("href") || "style.css";
      const base = new URL(href, window.location.href);
      base.searchParams.set("v", String(Date.now()));
      cssLink.href = base.toString();
      console.log("[UI] style.css cache-busted ->", cssLink.href);
    }

    // If running on localhost or port 3000 (express server), apply immediate bust so dev changes appear
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.port === "3000") {
      applyBust();
    } else {
      console.log("[UI] style.css loaded ->", cssLink.href);
    }

    // Provide quick manual reload: Shift+R to reload stylesheet
    window.reloadStylesheet = function reloadStylesheet() {
      applyBust();
    };
    window.addEventListener("keydown", (e) => {
      if (e.shiftKey && (e.key === "R" || e.key === "r")) {
        applyBust();
      }
    });
  } catch (err) {
    console.warn("[UI] Failed to apply CSS cache-bust", err);
  }
})();

const ADMIN_TOKEN_KEY = "alumniAdminToken";
const ADMIN_USER_KEY = "alumniAdminUser";
const BATCH_SIZE = 500;

let editingId = null;
let lastData = [];
let filteredData = [];
let currentQuery = "";

let currentPage = 1;
const rowsPerPage = 5;

let totalRecords = 0;
let latestStats = null;
let isLoadingBatch = false;

function getToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setToken(token, user) {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(ADMIN_USER_KEY, user);
    }
    return;
  }
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

function isAdmin() {
  return Boolean(getToken());
}

function buildAuthHeaders(base = {}) {
  const token = getToken();
  if (!token) return base;
  return {
    ...base,
    Authorization: `Bearer ${token}`
  };
}

function extractYear(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/(19|20)\d{2}/);
  return match ? match[0] : "";
}

function normalizeStatus(status) {
  if (!status) return "Belum Dilacak";
  if (status === "Teridentifikasi") return "Teridentifikasi";
  if (status === "Perlu Verifikasi") return "Perlu Verifikasi";
  if (status === "Belum Dilacak") return "Belum Dilacak";
  return "Belum Dilacak";
}

function getStatusClass(status) {
  if (status === "Teridentifikasi") return "status-identified";
  if (status === "Perlu Verifikasi") return "status-verify";
  return "status-untracked";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatValue(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return '<span class="muted">-</span>';
  }
  return escapeHtml(text);
}

function getField(item, aliases) {
  if (!item) return "";
  for (const a of aliases) {
    if (Object.prototype.hasOwnProperty.call(item, a)) {
      const v = item[a];
      if (v !== undefined && String(v ?? "").trim() !== "") return v;
    }
  }
  return "";
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function validateGraduationYear(yearValue) {
  const yearString = String(yearValue ?? "").trim();
  const extracted = extractYear(yearString);
  const yearNumber = Number(extracted || yearString);
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

function updateStatsFromData(data) {
  const total = data.length;
  let identified = 0;
  let verify = 0;
  let untracked = 0;

  data.forEach((item) => {
    const status = normalizeStatus(item.status);
    if (status === "Teridentifikasi") identified += 1;
    else if (status === "Perlu Verifikasi") verify += 1;
    else untracked += 1;
  });

  totalCountEl.textContent = total;
  identifiedCountEl.textContent = identified;
  verifyCountEl.textContent = verify;
  untrackedCountEl.textContent = untracked;
}

function updateStatsFromMeta(stats, total) {
  totalCountEl.textContent = total;
  identifiedCountEl.textContent = stats?.identified ?? 0;
  verifyCountEl.textContent = stats?.verify ?? 0;
  untrackedCountEl.textContent = stats?.untracked ?? 0;
}

function showLoginModal() {
  loginError.classList.add("hidden");
  loginForm.reset();
  loginModal.classList.remove("hidden");
}

function hideLoginModal() {
  loginModal.classList.add("hidden");
}

function showDetailModal(alumni) {
  if (!alumni) return;
  const name = getField(alumni, ["name", "nama"]);
  detailName.textContent = name || "-";
  detailBody.innerHTML = `
    <div class="detail-item"><span class="detail-label">NIM</span><span class="detail-value">${formatValue(getField(alumni, ["studentId", "student_id", "nim"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Fakultas</span><span class="detail-value">${formatValue(getField(alumni, ["faculty", "fakultas"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Program Studi</span><span class="detail-value">${formatValue(getField(alumni, ["program", "jurusan", "programstudi", "prodi"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Tahun Masuk</span><span class="detail-value">${formatValue(getField(alumni, ["entryYear", "tahunMasuk", "tahun_masuk"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Tanggal Lulus</span><span class="detail-value">${formatValue(getField(alumni, ["graduationDate", "tanggalLulus", "tanggal_lulus"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Tahun Lulus</span><span class="detail-value">${formatValue(getField(alumni, ["graduationYear", "tahunLulus", "tahun_lulus"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${formatValue(getField(alumni, ["email"]))}</span></div>
    <div class="detail-item"><span class="detail-label">No HP</span><span class="detail-value">${formatValue(getField(alumni, ["phone", "noHp", "no_hp"]))}</span></div>
    <div class="detail-item"><span class="detail-label">LinkedIn</span><span class="detail-value">${formatValue(getField(alumni, ["socialLinkedin", "linkedin"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Instagram</span><span class="detail-value">${formatValue(getField(alumni, ["socialInstagram", "instagram"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Facebook</span><span class="detail-value">${formatValue(getField(alumni, ["socialFacebook", "facebook"]))}</span></div>
    <div class="detail-item"><span class="detail-label">TikTok</span><span class="detail-value">${formatValue(getField(alumni, ["socialTiktok", "tiktok"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Posisi</span><span class="detail-value">${formatValue(getField(alumni, ["position", "posisi"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Tempat Bekerja</span><span class="detail-value">${formatValue(getField(alumni, ["workplace", "tempatBekerja"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Alamat Bekerja</span><span class="detail-value">${formatValue(getField(alumni, ["workplaceAddress", "alamatBekerja"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Status Pekerjaan</span><span class="detail-value">${formatValue(getField(alumni, ["employmentType", "kategoriKarier"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Sosmed Tempat Bekerja</span><span class="detail-value">${formatValue(getField(alumni, ["workplaceSocialMedia", "workplace_social", "workplace_social_media"]))}</span></div>
    <div class="detail-item"><span class="detail-label">Status Pelacakan</span><span class="detail-value">${formatValue(getField(alumni, ["status"]))}</span></div>
  `;
  detailModal.classList.remove("hidden");
}

function hideDetailModal() {
  detailModal.classList.add("hidden");
}

function renderEmptyState(message) {
  tableBody.innerHTML = `
    <tr>
      <td colspan="20" class="empty">${escapeHtml(message)}</td>
    </tr>
  `;
  updateStatsFromData([]);
  updatePaginationInfo(0);
}

function updateAuthUI() {
  const admin = isAdmin();
  authButton.textContent = admin ? "Logout Admin" : "Login Admin";
  loginHint.classList.toggle("hidden", admin);
  submitBtn.classList.toggle("hidden", !admin);

  form.querySelectorAll("input, select").forEach((input) => {
    input.disabled = !admin;
  });

  if (!admin) {
    resetFormMode();
  }

  if (lastData.length) {
    applyFilter();
    renderTable(getActiveData());
  }
}

function resetFormMode() {
  editingId = null;
  submitBtn.textContent = "Simpan Data";
  statusSelect.value = "Belum Dilacak";
}

function setEditMode(alumni) {
  if (!isAdmin()) {
    setStatus("Silakan login sebagai admin untuk mengubah data alumni.", "warning");
    return;
  }

  editingId = alumni.id;
  form.name.value = getField(alumni, ["name", "nama"]) || "";
  form.studentId.value = getField(alumni, ["studentId", "student_id", "nim"]) || "";
  form.faculty.value = getField(alumni, ["faculty", "fakultas"]) || "";
  form.program.value = getField(alumni, ["program", "jurusan", "programstudi", "prodi"]) || "";
  form.entryYear.value = getField(alumni, ["entryYear", "tahunMasuk", "tahun_masuk"]) || "";
  form.graduationDate.value = getField(alumni, ["graduationDate", "tanggalLulus", "tanggal_lulus"]) || "";
  form.graduationYear.value = getField(alumni, ["graduationYear", "tahunLulus", "tahun_lulus"]) || "";
  form.email.value = getField(alumni, ["email"]) || "";
  form.phone.value = getField(alumni, ["phone", "noHp", "no_hp"]) || "";
  form.socialLinkedin.value = getField(alumni, ["socialLinkedin", "linkedin"]) || "";
  form.socialInstagram.value = getField(alumni, ["socialInstagram", "instagram"]) || "";
  form.socialFacebook.value = getField(alumni, ["socialFacebook", "facebook"]) || "";
  form.socialTiktok.value = getField(alumni, ["socialTiktok", "tiktok"]) || "";
  form.position.value = getField(alumni, ["position", "posisi"]) || "";
  form.workplace.value = getField(alumni, ["workplace", "tempatBekerja"]) || "";
  form.workplaceAddress.value = getField(alumni, ["workplaceAddress", "alamatBekerja"]) || "";
  form.employmentType.value = getField(alumni, ["employmentType", "kategoriKarier"]) || "";
  form.workplaceSocialMedia.value = getField(alumni, ["workplaceSocialMedia", "workplace_social"]) || "";
  statusSelect.value = normalizeStatus(getField(alumni, ["status"]) || alumni.status);
  submitBtn.textContent = "Perbarui Data";
  setStatus("Mode edit: perbarui data lalu simpan.");
  document.getElementById("tambah-alumni").scrollIntoView({ behavior: "smooth" });
  form.name.focus();
}

function paginateData(data) {
  const start = (currentPage - 1) * rowsPerPage;
  return data.slice(start, start + rowsPerPage);
}

function getTotalDataCount() {
  if (currentQuery) return filteredData.length;
  if (totalRecords > 0) return totalRecords;
  return lastData.length;
}

function updatePaginationInfo(totalData) {
  const totalPages = Math.max(1, Math.ceil(totalData / rowsPerPage));
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

function getActiveData() {
  return currentQuery ? filteredData : lastData;
}

function applyFilter() {
  if (currentQuery) {
    filteredData = lastData.filter((item) =>
      String(item.name || "").toLowerCase().includes(currentQuery)
    );
  } else {
    filteredData = [];
  }
}

function renderTable(data) {
  const dataset = Array.isArray(data) ? data : [];
  tableBody.innerHTML = "";

  if (!dataset.length) {
    renderEmptyState("Data tidak ditemukan.");
    return;
  }

  updatePaginationInfo(getTotalDataCount());
  const paginated = paginateData(dataset);
  const admin = isAdmin();

  paginated.forEach((item) => {
    const statusVal = getField(item, ["status"]) || item.status;
    const statusClass = getStatusClass(statusVal);
    const detailBtn = `<button class="btn ghost" data-action="detail" data-id="${item.id}">Detail</button>`;
    const actions = admin
      ? `${detailBtn}
         <button class="btn ghost" data-action="edit" data-id="${item.id}">Edit</button>
         <button class="btn danger" data-action="delete" data-id="${item.id}">Hapus</button>`
      : detailBtn;

    const row = document.createElement("tr");
    const vName = formatValue(getField(item, ["name", "nama"]));
    const vStudentId = formatValue(getField(item, ["studentId", "student_id", "nim"]));
    const vFaculty = formatValue(getField(item, ["faculty", "fakultas"]));
    const vProgram = formatValue(getField(item, ["program", "jurusan", "programstudi", "prodi"]));
    const vEntryYear = formatValue(getField(item, ["entryYear", "tahunMasuk", "tahun_masuk"]));
    const vGraduationDate = formatValue(getField(item, ["graduationDate", "tanggalLulus", "tanggal_lulus"]));
    const vGraduationYear = formatValue(getField(item, ["graduationYear", "tahunLulus", "tahun_lulus"]));
    const vEmail = formatValue(getField(item, ["email"]));
    const vPhone = formatValue(getField(item, ["phone", "noHp", "no_hp"]));
    const vLinkedin = formatValue(getField(item, ["socialLinkedin", "linkedin"]));
    const vInstagram = formatValue(getField(item, ["socialInstagram", "instagram"]));
    const vFacebook = formatValue(getField(item, ["socialFacebook", "facebook"]));
    const vTiktok = formatValue(getField(item, ["socialTiktok", "tiktok"]));
    const vPosition = formatValue(getField(item, ["position", "posisi"]));
    const vWorkplace = formatValue(getField(item, ["workplace", "tempatBekerja"]));
    const vWorkplaceAddress = formatValue(getField(item, ["workplaceAddress", "alamatBekerja"]));
    const vEmploymentType = formatValue(getField(item, ["employmentType", "kategoriKarier"]));
    const vWorkplaceSocial = formatValue(getField(item, ["workplaceSocialMedia", "workplace_social"]));

    row.innerHTML = `
      <td>${vName}</td>
      <td>${vStudentId}</td>
      <td>${vFaculty}</td>
      <td>${vProgram}</td>
      <td>${vEntryYear}</td>
      <td>${vGraduationDate}</td>
      <td>${vGraduationYear}</td>
      <td>${vEmail}</td>
      <td>${vPhone}</td>
      <td>${vLinkedin}</td>
      <td>${vInstagram}</td>
      <td>${vFacebook}</td>
      <td>${vTiktok}</td>
      <td>${vPosition}</td>
      <td>${vWorkplace}</td>
      <td>${vWorkplaceAddress}</td>
      <td>${vEmploymentType}</td>
      <td>${vWorkplaceSocial}</td>
      <td><span class="status-pill ${statusClass}">${escapeHtml(statusVal)}</span></td>
      <td>${actions}</td>
    `;
    tableBody.appendChild(row);
  });

  if (latestStats && !currentQuery && totalRecords > 0) {
    updateStatsFromMeta(latestStats, totalRecords);
  } else {
    updateStatsFromData(dataset);
  }
}

function handleUnauthorized(message) {
  setToken(null);
  updateAuthUI();
  setStatus(message || "Sesi login berakhir. Silakan login kembali.", "warning");
}

async function fetchBatch(offset) {
  const params = new URLSearchParams();
  params.set("limit", BATCH_SIZE);
  params.set("offset", offset);
  const url = `/alumni?${params.toString()}`;

  const response = await fetch(url, {
    headers: buildAuthHeaders()
  });

  if (response.status === 401) {
    handleUnauthorized("Silakan login untuk melihat data alumni.");
    return null;
  }

  if (!response.ok) {
    setStatus("Gagal memuat data alumni.", "error");
    return null;
  }

  const result = await response.json();

  if (Array.isArray(result)) {
    return { data: result, total: result.length, stats: null, isFull: true };
  }

  const batch = Array.isArray(result.data) ? result.data : [];
  const total = Number.isFinite(result.total) ? result.total : 0;
  const stats = result.stats || null;

  return { data: batch, total, stats, isFull: false };
}

async function fetchMoreData() {
  if (isLoadingBatch) return false;
  if (totalRecords && lastData.length >= totalRecords) return false;

  isLoadingBatch = true;
  try {
    const result = await fetchBatch(lastData.length);
    if (!result) return false;

    if (result.isFull) {
      lastData = result.data;
      totalRecords = result.total;
      latestStats = result.stats;
      return result.data.length > 0;
    }

    lastData = lastData.concat(result.data);
    if (result.total) {
      totalRecords = result.total;
    }
    if (result.stats) {
      latestStats = result.stats;
    }

    return result.data.length > 0;
  } finally {
    isLoadingBatch = false;
  }
}

async function ensureDataForPage(page) {
  if (currentQuery) return;
  const needed = page * rowsPerPage;
  if (lastData.length >= needed) return;
  await fetchMoreData();
}

async function loadAlumniData() {
  if (!isAdmin()) {
    renderEmptyState("Data alumni belum dimuat. Login admin untuk sinkronisasi.");
    return;
  }

  setStatus("Memuat data alumni...", "warning");
  currentPage = 1;
  currentQuery = "";
  searchInput.value = "";
  lastData = [];
  filteredData = [];
  totalRecords = 0;
  latestStats = null;

  // Prefer direct reading of normalized_alumni.json when available (faster, shows normalized fields)
  try {
    const resNorm = await fetch("/data/normalized_alumni.json", { cache: "no-store" });
    if (resNorm.ok) {
      const normPayload = await resNorm.json();
      if (Array.isArray(normPayload) && normPayload.length > 0) {
        lastData = normPayload;
        totalRecords = normPayload.length;
        latestStats = null;
        applyFilter();
        renderTable(getActiveData());
        setStatus("Data alumni (normalized) berhasil dimuat.", "success");
        return;
      }
    }
  } catch (err) {
    // ignore and fallback to API
  }

  const loaded = await fetchMoreData();
  if (!loaded) {
    renderEmptyState("Data tidak ditemukan.");
    setStatus("Data alumni belum tersedia.", "warning");
    return;
  }

  applyFilter();
  renderTable(getActiveData());
  setStatus("Data alumni berhasil dimuat.", "success");
}

async function verifySession() {
  const token = getToken();
  if (!token) return false;
  try {
    const response = await fetch("/auth", {
      headers: buildAuthHeaders()
    });

    if (!response.ok) {
      setToken(null);
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isAdmin()) {
    setStatus("Silakan login sebagai admin untuk mengubah data alumni.", "warning");
    return;
  }

  const payload = {
    name: form.name.value.trim(),
    studentId: form.studentId.value.trim(),
    faculty: form.faculty.value.trim(),
    program: form.program.value.trim(),
    entryYear: form.entryYear.value.trim(),
    graduationDate: form.graduationDate.value.trim(),
    graduationYear: form.graduationYear.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    socialLinkedin: form.socialLinkedin.value.trim(),
    socialInstagram: form.socialInstagram.value.trim(),
    socialFacebook: form.socialFacebook.value.trim(),
    socialTiktok: form.socialTiktok.value.trim(),
    position: form.position.value.trim(),
    workplace: form.workplace.value.trim(),
    workplaceAddress: form.workplaceAddress.value.trim(),
    employmentType: form.employmentType.value,
    workplaceSocialMedia: form.workplaceSocialMedia.value.trim(),
    status: statusSelect.value
  };

  const yearError = validateGraduationYear(payload.graduationYear || payload.graduationDate);
  if (yearError) {
    setStatus(yearError, "error");
    return;
  }

  if (!payload.status) {
    setStatus("Status pelacakan wajib diisi.", "error");
    return;
  }

  const url = editingId ? `/alumni/${editingId}` : "/alumni";
  const method = editingId ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: buildAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }

    let result = null;
    try {
      result = await response.json();
    } catch (error) {
      result = null;
    }

    if (!response.ok) {
      setStatus(result?.message || "Gagal menyimpan data.", "error");
      return;
    }

    setStatus(editingId ? "Data alumni berhasil diperbarui." : "Data alumni berhasil disimpan.", "success");
    form.reset();
    resetFormMode();
    await loadAlumniData();
  } catch (error) {
    setStatus("Terjadi kesalahan pada server.", "error");
  }
});

searchBtn.addEventListener("click", () => {
  currentQuery = searchInput.value.trim().toLowerCase();
  currentPage = 1;
  applyFilter();
  renderTable(getActiveData());
});

resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentQuery = "";
  filteredData = [];
  currentPage = 1;
  renderTable(getActiveData());
});

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderTable(getActiveData());
  }
});

nextPageBtn.addEventListener("click", async () => {
  const totalPages = Math.max(1, Math.ceil(getTotalDataCount() / rowsPerPage));
  if (currentPage < totalPages) {
    const nextPage = currentPage + 1;
    await ensureDataForPage(nextPage);
    applyFilter();
    currentPage = nextPage;
    renderTable(getActiveData());
  }
});

authButton.addEventListener("click", () => {
  if (isAdmin()) {
    setToken(null);
    setStatus("Logout berhasil.", "success");
    updateAuthUI();
    return;
  }

  showLoginModal();
});

cancelLogin.addEventListener("click", () => {
  hideLoginModal();
});

loginModal.addEventListener("click", (event) => {
  if (event.target === loginModal) {
    hideLoginModal();
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = loginForm.username.value.trim();
  const password = loginForm.password.value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      loginError.classList.remove("hidden");
      return;
    }

    const result = await response.json();
    setToken(result.token, result.user);
    hideLoginModal();
    setStatus("Login admin berhasil.", "success");
    updateAuthUI();
    await loadAlumniData();
  } catch (error) {
    loginError.classList.remove("hidden");
  }
});

detailModal.addEventListener("click", (event) => {
  if (event.target === detailModal) {
    hideDetailModal();
  }
});

closeDetail.addEventListener("click", () => {
  hideDetailModal();
});

// Event delegation for detail/edit/delete button
tableBody.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.getAttribute("data-action");
  const id = target.getAttribute("data-id");
  if (!action || !id) return;

  const alumni = lastData.find((item) => String(item.id) === String(id));

  if (action === "detail") {
    if (alumni) {
      showDetailModal(alumni);
    }
    return;
  }

  if (!isAdmin()) {
    setStatus("Silakan login sebagai admin untuk mengubah data alumni.", "warning");
    return;
  }

  if (action === "edit") {
    if (alumni) {
      setEditMode(alumni);
    }
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm("Yakin ingin menghapus data alumni ini?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/alumni/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders()
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setStatus(errorData.message || "Gagal menghapus data.", "error");
        return;
      }

      setStatus("Data alumni berhasil dihapus.", "success");
      await loadAlumniData();
    } catch (error) {
      setStatus("Terjadi kesalahan pada server.", "error");
    }
  }
});

async function init() {
  const hasSession = await verifySession();
  updateAuthUI();
  resetFormMode();
  if (hasSession) {
    await loadAlumniData();
  } else {
    renderEmptyState("Data alumni belum dimuat. Login admin untuk sinkronisasi.");
  }
}

init();
/* Codex alumni year filler disabled
(function () {
  var alumniYearLookup = {};
  var alumniRecordLookup = {};
  var currentYear = new Date().getFullYear();
  var currentYearShort = currentYear % 100;

  var fieldAliases = {
    nim: [
      'nim',
      'npm',
      'nomorinduk',
      'nomormahasiswa',
      'nomorindukmahasiswa',
      'noinduk',
    ],
    tahunMasuk: ['tahunmasuk', 'tahunangkatan', 'angkatan', 'tahunawal', 'masuk'],
    tahunLulus: ['tahunlulus', 'tahunwisuda', 'tanggallulus', 'lulus', 'wisuda'],
  };
  var columnAliases = {
    tahunmasuk: fieldAliases.tahunMasuk,
    tahunlulus: fieldAliases.tahunLulus,
    tanggallulus: fieldAliases.tahunLulus,
    pekerjaan: ['pekerjaan', 'profesi', 'jabatan', 'posisi', 'statuspekerjaan', 'job'],
    perusahaan: [
      'perusahaan',
      'namaperusahaan',
      'instansi',
      'namainstansi',
      'tempatkerja',
      'company',
    ],
    lokasi: ['lokasi', 'alamat', 'alamatkerja', 'kota', 'kabupaten', 'wilayah'],
    status: ['status', 'statuspelacakan', 'statusalumni', 'trackingstatus'],
    fakultas: ['fakultas'],
    programstudi: ['programstudi', 'prodi', 'jurusan'],
  };

  function normalizeKey(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function normalizeNim(value) {
    return String(value || '')
      .replace(/\D/g, '')
      .trim();
  }

  function hasValue(value) {
    return (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '' &&
      !/^belum/i.test(String(value).trim())
    );
  }

  function getField(record, aliases) {
    var keys;
    var i;
    var key;

    if (!record || typeof record !== 'object') return '';

    keys = Object.keys(record);
    for (i = 0; i < keys.length; i += 1) {
      key = keys[i];
      if (aliases.indexOf(normalizeKey(key)) >= 0 && hasValue(record[key])) {
        return String(record[key]).trim();
      }
    }

    return '';
  }

  function rememberRecord(record) {
    var nim = normalizeNim(getField(record, fieldAliases.nim));
    var tahunMasuk = getField(record, fieldAliases.tahunMasuk);
    var tahunLulus = getField(record, fieldAliases.tahunLulus);

    if (!nim || (!tahunMasuk && !tahunLulus)) return;

    alumniRecordLookup[nim] = Object.assign({}, alumniRecordLookup[nim] || {}, record);
    alumniYearLookup[nim] = {
      tahunMasuk: tahunMasuk || (alumniYearLookup[nim] && alumniYearLookup[nim].tahunMasuk) || '',
      tahunLulus: tahunLulus || (alumniYearLookup[nim] && alumniYearLookup[nim].tahunLulus) || '',
    };
  }

  function collectRecords(value, depth) {
    var keys;
    var i;

    if (!value || depth > 8) return;

    if (Array.isArray(value)) {
      for (i = 0; i < value.length; i += 1) {
        collectRecords(value[i], depth + 1);
      }
      return;
    }

    if (typeof value !== 'object') return;

    rememberRecord(value);
    keys = Object.keys(value);

    for (i = 0; i < keys.length; i += 1) {
      if (value[keys[i]] && typeof value[keys[i]] === 'object') {
        collectRecords(value[keys[i]], depth + 1);
      }
    }
  }

  function collectJsonText(text) {
    try {
      collectRecords(JSON.parse(text), 0);
    } catch (error) {
      return;
    }
  }

  function collectBrowserStorage(storage) {
    var i;
    var key;

    if (!storage) return;

    for (i = 0; i < storage.length; i += 1) {
      key = storage.key(i);
      collectJsonText(storage.getItem(key));
    }
  }

  function fetchKnownJson() {
    [
      '/data/alumni.json',
      'data/alumni.json',
      './data/alumni.json',
      '../data/alumni.json',
      '/alumni.json',
      'alumni.json',
      '/data_alumni.json',
      '/alumni_2000.json',
    ].forEach(function (url) {
      fetch(url, { cache: 'no-store' })
        .then(function (response) {
          return response.ok ? response.text() : '';
        })
        .then(collectJsonText)
        .then(applyYears)
        .catch(function () {});
    });
  }

  function interceptFetch() {
    var originalFetch = window.fetch;

    if (!originalFetch || originalFetch.__alumniYearIntercepted) return;

    window.fetch = function () {
      return originalFetch.apply(this, arguments).then(function (response) {
        try {
          response
            .clone()
            .text()
            .then(function (text) {
              collectJsonText(text);
              applyYears();
            })
            .catch(function () {});
        } catch (error) {
          return response;
        }

        return response;
      });
    };

    window.fetch.__alumniYearIntercepted = true;
  }

  function inferEntryYear(nim) {
    var firstFour;
    var firstTwo;

    if (!nim) return '';

    firstFour = Number(nim.slice(0, 4));
    if (firstFour >= 1950 && firstFour <= currentYear) {
      return String(firstFour);
    }

    firstTwo = Number(nim.slice(0, 2));
    if (Number.isNaN(firstTwo)) return '';

    return String(firstTwo > currentYearShort ? 1900 + firstTwo : 2000 + firstTwo);
  }

  function inferGraduationYear(tahunMasuk) {
    var titleMatch = String(document.title || '').match(/(?:19|20)\d{2}/);
    var bodyMatch = document.body
      ? String(document.body.textContent || '').match(/Alumni\s*((?:19|20)\d{2})/i)
      : null;
    var entryYear = Number(tahunMasuk);

    if (bodyMatch) return bodyMatch[1];
    if (titleMatch) return titleMatch[0];
    if (entryYear >= 1950) return String(entryYear + 4);

    return '';
  }

  function findColumnIndexes(table) {
    var headerCells = Array.prototype.slice.call(table.querySelectorAll('thead th'));
    var headers;

    if (!headerCells.length) {
      headerCells = Array.prototype.slice.call(
        table.querySelectorAll('tr:first-child th, tr:first-child td')
      );
    }

    headers = headerCells.map(function (cell) {
      return normalizeKey(cell.textContent);
    });

    return {
      headers: headerCells,
      nim: headers.indexOf('nim'),
      tahunMasuk: headers.findIndex(function (header) {
        return header.indexOf('tahun') >= 0 && header.indexOf('masuk') >= 0;
      }),
      tahunLulus: headers.findIndex(function (header) {
        return header.indexOf('lulus') >= 0;
      }),
    };
  }

  function setCellText(cell, value) {
    if (!cell || !value || cell.textContent.trim() === String(value)) return;
    cell.textContent = String(value);
  }

  function setCellTextFromRecord(cell, value) {
    if (!cell || !value) return;
    if (cell.textContent.trim() && !/^belum/i.test(cell.textContent.trim())) return;
    cell.textContent = String(value);
  }

  function fillOtherColumns(cells, headers, record) {
    var i;
    var header;
    var aliases;
    var value;

    if (!record) return;

    for (i = 0; i < headers.length; i += 1) {
      header = normalizeKey(headers[i].textContent);
      if (header === 'namalulusan' || header === 'nim' || header === 'aksi') continue;

      aliases = columnAliases[header] || [header];
      value = getField(record, aliases);
      setCellTextFromRecord(cells[i], value);
    }
  }

  function applyYears() {
    Array.prototype.slice.call(document.querySelectorAll('table')).forEach(function (table) {
      var columns = findColumnIndexes(table);
      var rows;

      if (columns.nim < 0 || columns.tahunMasuk < 0 || columns.tahunLulus < 0) return;

      if (
        columns.headers[columns.tahunLulus] &&
        normalizeKey(columns.headers[columns.tahunLulus].textContent) === 'tanggallulus'
      ) {
        columns.headers[columns.tahunLulus].textContent = 'TAHUN LULUS';
      }

      rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
      if (!rows.length) rows = Array.prototype.slice.call(table.querySelectorAll('tr')).slice(1);

      rows.forEach(function (row) {
        var cells = Array.prototype.slice.call(row.children);
        var nim = normalizeNim(cells[columns.nim] && cells[columns.nim].textContent);
        var alumni = alumniYearLookup[nim] || {};
        var record = alumniRecordLookup[nim];
        var tahunMasuk = alumni.tahunMasuk || inferEntryYear(nim);
        var tahunLulus = alumni.tahunLulus || inferGraduationYear(tahunMasuk);

        fillOtherColumns(cells, columns.headers, record);
        setCellText(cells[columns.tahunMasuk], tahunMasuk);
        setCellText(cells[columns.tahunLulus], tahunLulus);
      });
    });
  }

  interceptFetch();

  function start() {
    collectBrowserStorage(window.localStorage);
    collectBrowserStorage(window.sessionStorage);
    fetchKnownJson();
    applyYears();

    new MutationObserver(applyYears).observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.setInterval(applyYears, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
*/
