const DEFAULT_PAGE_SIZE = 50;

let dataset = [];

function normalizeLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildNormalizedRowMap(row) {
  const map = {};
  for (const [key, value] of Object.entries(row ?? {})) {
    map[normalizeLabel(key)] = String(value ?? "").trim();
  }
  return map;
}

function findMappedValue(rowMap, aliases) {
  for (const alias of aliases) {
    const norm = normalizeLabel(alias);
    const value = rowMap[norm] ?? rowMap[alias];
    if (value) return value;
  }
  return "";
}

function toStatus(value) {
  const normalized = normalizeLabel(value);
  if (normalized.includes("verifikasi")) {
    return "Perlu Verifikasi";
  }
  if (normalized.includes("teridentifikasi") || normalized.includes("terverifikasi")) {
    return "Teridentifikasi";
  }
  return "Belum Dilacak";
}

function toKategoriKarier(value) {
  const normalized = normalizeLabel(value);
  if (normalized.includes("pns")) {
    return "PNS";
  }
  if (normalized.includes("wirausaha")) {
    return "Wirausaha";
  }
  if (normalized.includes("swasta")) {
    return "Swasta";
  }
  return "";
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value) {
  return String(value ?? "").replace(/[^\d+]/g, "");
}

function isValidPhone(value) {
  if (!value) {
    return true;
  }
  const normalized = normalizePhone(value);
  return normalized.length >= 8;
}

function hasValue(value) {
  return Boolean(String(value ?? "").trim());
}

function maskEmail(value) {
  if (!value) {
    return "Belum tersedia";
  }

  const [localPart, domainPart] = value.split("@");
  if (!localPart || !domainPart) {
    return maskGeneric(value);
  }

  const prefix = localPart.slice(0, 2) || "*";
  return `${prefix}***@${domainPart}`;
}

function maskPhone(value) {
  if (!value) {
    return "Belum tersedia";
  }

  const normalized = normalizePhone(value);
  if (normalized.length <= 4) {
    return "****";
  }

  return `${normalized.slice(0, 2)}******${normalized.slice(-2)}`;
}

function maskGeneric(value) {
  if (!value) {
    return "Belum tersedia";
  }

  if (value.length <= 4) {
    return `${value.slice(0, 1)}***`;
  }

  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

function getValidationStatus(result) {
  const hasTrackingData =
    hasValue(result.email) ||
    hasValue(result.noHp) ||
    hasValue(result.linkedin) ||
    hasValue(result.instagram) ||
    hasValue(result.facebook) ||
    hasValue(result.tiktok) ||
    hasValue(result.tempatBekerja) ||
    hasValue(result.alamatBekerja) ||
    hasValue(result.posisi) ||
    hasValue(result.sosialTempatKerja);

  if (!hasTrackingData) {
    return "Belum Divalidasi";
  }

  if (!isValidEmail(result.email) || !isValidPhone(result.noHp)) {
    return "Perlu Validasi";
  }

  return "Valid";
}

function getVerificationStatus(status) {
  if (status === "Teridentifikasi") {
    return "Terverifikasi";
  }

  if (status === "Perlu Verifikasi") {
    return "Perlu Verifikasi";
  }

  return "Belum Diverifikasi";
}

function getPrivacyMessage(item) {
  if (item.status === "Teridentifikasi") {
    return "Data sensitif dapat ditampilkan karena status alumni sudah teridentifikasi.";
  }

  if (item.status === "Perlu Verifikasi") {
    return "Data sensitif masih dibatasi. Lakukan verifikasi lanjutan sebelum digunakan penuh.";
  }

  return "Data sensitif disamarkan sampai proses pelacakan dan verifikasi dilakukan.";
}

function normalizeAlumniRow(row, index) {
  const rowMap = buildNormalizedRowMap(row);

  const result = {
    id: Number(row?.id) || Date.now() + index,
    nama:
      findMappedValue(rowMap, ["nama", "nama alumni", "nama lulusan", "lulusan", "alumni", "name"]) ||
      String(row?.nama ?? "").trim(),
    nim:
      findMappedValue(rowMap, [
        "nim",
        "nomor induk mahasiswa",
        "student id",
        "studentid",
        "studentId",
        "student_id",
        "NIM"
      ]) || String(row?.nim ?? row?.studentId ?? row?.student_id ?? row?.NIM ?? "").trim(),
    jurusan:
      findMappedValue(rowMap, ["jurusan", "prodi", "program studi", "program"]) ||
      String(row?.jurusan ?? "").trim(),
    fakultas: findMappedValue(rowMap, ["fakultas", "faculty"]) || String(row?.fakultas ?? "").trim(),
    tahunMasuk:
      findMappedValue(rowMap, ["tahun masuk", "angkatan", "tahun angkatan"]) ||
      String(row?.tahunMasuk ?? "").trim(),
    tanggalLulus:
      findMappedValue(rowMap, ["tanggal lulus", "tgl lulus"]) || String(row?.tanggalLulus ?? "").trim(),
    tahunLulus: findMappedValue(rowMap, ["tahun lulus", "thn lulus"]) || String(row?.tahunLulus ?? "").trim(),
    status: toStatus(findMappedValue(rowMap, ["status", "status pelacakan"]) || row?.status),
    linkedin: findMappedValue(rowMap, ["linkedin", "linked in"]) || String(row?.linkedin ?? "").trim(),
    instagram: findMappedValue(rowMap, ["instagram", "ig"]) || String(row?.instagram ?? "").trim(),
    facebook: findMappedValue(rowMap, ["facebook", "fb"]) || String(row?.facebook ?? "").trim(),
    tiktok: findMappedValue(rowMap, ["tiktok", "tik tok"]) || String(row?.tiktok ?? "").trim(),
    email: findMappedValue(rowMap, ["email", "e mail"]) || String(row?.email ?? "").trim(),
    noHp:
      findMappedValue(rowMap, ["no hp", "nomor hp", "no handphone", "nomor handphone", "no wa", "whatsapp"]) ||
      String(row?.noHp ?? "").trim(),
    tempatBekerja:
      findMappedValue(rowMap, ["tempat bekerja", "perusahaan", "instansi", "kantor", "nama perusahaan"]) ||
      String(row?.tempatBekerja ?? "").trim(),
    alamatBekerja:
      findMappedValue(rowMap, ["alamat bekerja", "alamat kantor", "alamat instansi", "alamat perusahaan"]) ||
      String(row?.alamatBekerja ?? "").trim(),
    posisi: findMappedValue(rowMap, ["posisi", "jabatan"]) || String(row?.posisi ?? "").trim(),
    kategoriKarier:
      toKategoriKarier(
        findMappedValue(rowMap, ["pns swasta wirausaha", "kategori karier", "kategori pekerjaan", "jenis pekerjaan"]) ||
          row?.kategoriKarier
      ) || String(row?.kategoriKarier ?? "").trim(),
    sosialTempatKerja:
      findMappedValue(rowMap, [
        "alamat sosial media tempat bekerja",
        "sosial media tempat kerja",
        "akun tempat kerja",
        "instagram tempat kerja",
        "linkedin tempat kerja",
        "website tempat kerja"
      ]) || String(row?.sosialTempatKerja ?? "").trim()
  };

  result.validasiStatus = getValidationStatus(result);
  result.verifikasiStatus = getVerificationStatus(result.status);
  result.kontakTersedia =
    hasValue(result.email) ||
    hasValue(result.noHp) ||
    hasValue(result.linkedin) ||
    hasValue(result.instagram) ||
    hasValue(result.facebook) ||
    hasValue(result.tiktok);
  result.pekerjaanTersedia =
    hasValue(result.tempatBekerja) ||
    hasValue(result.alamatBekerja) ||
    hasValue(result.posisi) ||
    hasValue(result.kategoriKarier) ||
    hasValue(result.sosialTempatKerja);
  result.searchText = normalizeLabel(
    [
      result.nama,
      result.nim,
      result.fakultas,
      result.jurusan,
      result.tahunMasuk,
      result.tahunLulus,
      result.status,
      result.email,
      result.noHp,
      result.tempatBekerja,
      result.posisi,
      result.kategoriKarier
    ].join(" ")
  );

  return result;
}

function computeStats(rows) {
  return {
    total: rows.length,
    teridentifikasi: rows.filter((item) => item.status === "Teridentifikasi").length,
    verifikasi: rows.filter((item) => item.status === "Perlu Verifikasi").length,
    kontak: rows.filter((item) => item.kontakTersedia).length
  };
}

function getFilteredRows(query) {
  const keyword = normalizeLabel(query);
  if (!keyword) {
    return dataset;
  }

  return dataset.filter((item) => item.searchText.includes(keyword));
}

function toPreviewRow(item) {
  return {
    id: item.id,
    nama: item.nama,
    nim: item.nim,
    fakultas: item.fakultas,
    jurusan: item.jurusan,
    tahunMasuk: item.tahunMasuk,
    tanggalLulus: item.tanggalLulus,
    tahunLulus: item.tahunLulus,
    status: item.status,
    validasiStatus: item.validasiStatus,
    verifikasiStatus: item.verifikasiStatus,
    kontakTersedia: item.kontakTersedia,
    pekerjaanTersedia: item.pekerjaanTersedia
  };
}

function serializeDetail(item) {
  const revealSensitive = item.status === "Teridentifikasi";

  return {
    id: item.id,
    nama: item.nama,
    nim: item.nim,
    fakultas: item.fakultas,
    jurusan: item.jurusan,
    tahunMasuk: item.tahunMasuk,
    tanggalLulus: item.tanggalLulus,
    tahunLulus: item.tahunLulus,
    status: item.status,
    validasiStatus: item.validasiStatus,
    verifikasiStatus: item.verifikasiStatus,
    kategoriKarier: item.kategoriKarier,
    tempatBekerja: item.tempatBekerja || "Belum tersedia",
    posisi: item.posisi || "Belum tersedia",
    alamatBekerjaDisplay: revealSensitive ? item.alamatBekerja || "Belum tersedia" : maskGeneric(item.alamatBekerja),
    emailDisplay: revealSensitive ? item.email || "Belum tersedia" : maskEmail(item.email),
    noHpDisplay: revealSensitive ? item.noHp || "Belum tersedia" : maskPhone(item.noHp),
    linkedinDisplay: revealSensitive ? item.linkedin || "Belum tersedia" : maskGeneric(item.linkedin),
    instagramDisplay: revealSensitive ? item.instagram || "Belum tersedia" : maskGeneric(item.instagram),
    facebookDisplay: revealSensitive ? item.facebook || "Belum tersedia" : maskGeneric(item.facebook),
    tiktokDisplay: revealSensitive ? item.tiktok || "Belum tersedia" : maskGeneric(item.tiktok),
    sosialTempatKerjaDisplay: revealSensitive
      ? item.sosialTempatKerja || "Belum tersedia"
      : maskGeneric(item.sosialTempatKerja),
    kontakTersedia: item.kontakTersedia,
    pekerjaanTersedia: item.pekerjaanTersedia,
    revealSensitive,
    privacyMessage: getPrivacyMessage(item)
  };
}

function emitResults(type, query, page, pageSize, message) {
  const filtered = getFilteredRows(query);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize).map(toPreviewRow);

  postMessage({
    type,
    rows,
    page: safePage,
    totalPages,
    totalCount: filtered.length,
    stats: computeStats(dataset),
    message
  });
}

async function loadJson(dataUrl, query, page, pageSize) {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  const rawRows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.alumni)
        ? payload.alumni
        : [];

  dataset = rawRows.map(normalizeAlumniRow).filter((item) => item.nama);
  if (dataset.length === 0) {
    throw new Error("Isi alumni.json tidak menghasilkan baris data yang valid.");
  }

  emitResults("loaded", query, page, pageSize, `${dataset.length} data alumni berhasil dimuat dari file alumni.json.`);
}

self.onmessage = async (event) => {
  const { type, dataUrl, query = "", page = 1, pageSize = DEFAULT_PAGE_SIZE, row, rows, fileName, id } = event.data;

  try {
    if (type === "LOAD_JSON") {
      await loadJson(dataUrl, query, page, pageSize);
      return;
    }

    if (type === "SEARCH") {
      emitResults("search", query, page, pageSize);
      return;
    }

    if (type === "GET_DETAIL") {
      const found = dataset.find((item) => String(item.id) === String(id));
      if (!found) {
        throw new Error("Detail alumni tidak ditemukan.");
      }

      postMessage({
        type: "detail",
        alumni: serializeDetail(found)
      });
      return;
    }

    if (type === "ADD_ROW") {
      const nextRow = normalizeAlumniRow(row, 0);
      nextRow.id = Date.now();
      dataset = [nextRow, ...dataset];
      emitResults("updated", query, page, pageSize, "Data alumni baru berhasil ditambahkan ke dashboard.");
      return;
    }

    if (type === "IMPORT_ROWS") {
      dataset = (rows || []).map(normalizeAlumniRow).filter((item) => item.nama);
      if (dataset.length === 0) {
        throw new Error("File Excel terbaca, tetapi tidak ada baris alumni yang valid.");
      }

      emitResults("updated", query, page, pageSize, `${dataset.length} data alumni berhasil diimpor dari file ${fileName}.`);
    }
  } catch (error) {
    postMessage({
      type: "error",
      message: error.message || "Terjadi kesalahan saat memproses data alumni."
    });
  }
};
