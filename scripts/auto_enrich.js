#!/usr/bin/env node
/**
 * Auto-Enrichment Script for Alumni Data
 * 
 * Strategy:
 * 1. Generate Google/LinkedIn search URLs per alumni
 * 2. Open browser tabs for batch manual verification
 * 3. Auto-fill data from public sources where possible
 * 
 * Usage:
 *   node scripts/auto_enrich.js --batch 1 --size 50
 *   node scripts/auto_enrich.js --year 2024
 *   node scripts/auto_enrich.js --faculty "Teknik"
 *   node scripts/auto_enrich.js --stats
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "alumni.json");
const ENRICHED_PATH = path.join(ROOT, "data", "alumni_enriched.json");
const SEARCH_URLS_PATH = path.join(ROOT, "outputs", "search_urls.json");
const BATCH_HTML_DIR = path.join(ROOT, "outputs", "batch_pages");

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeJson(p, o) { fs.writeFileSync(p, JSON.stringify(o, null, 2), "utf8"); }
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function hasValue(v) { return v !== null && v !== undefined && String(v).trim() !== ""; }

// Count how many of the 8 required items an alumni has
function countFilledItems(r) {
  let count = 0;
  // Item 1: Social media (any)
  if (hasValue(r.linkedin) || hasValue(r.instagram) || hasValue(r.facebook) || hasValue(r.tiktok)) count++;
  // Item 2-8
  if (hasValue(r.email)) count++;
  if (hasValue(r.noHp)) count++;
  if (hasValue(r.tempatBekerja)) count++;
  if (hasValue(r.alamatBekerja)) count++;
  if (hasValue(r.posisi)) count++;
  if (hasValue(r.kategoriKarier)) count++;
  if (hasValue(r.sosialTempatKerja)) count++;
  return count;
}

// Generate search URLs for an alumni
function generateSearchUrls(alumni) {
  const name = alumni.nama;
  const nim = alumni.nim;
  const faculty = alumni.fakultas;
  const program = alumni.jurusan;
  const yearGrad = alumni.tahunLulus;
  
  const nameEncoded = encodeURIComponent(name);
  const searchBase = encodeURIComponent(`${name} Universitas Muhammadiyah Malang`);
  const searchDetailed = encodeURIComponent(`${name} UMM ${program} ${yearGrad}`);

  return {
    google: `https://www.google.com/search?q=${searchBase}`,
    linkedin: `https://www.google.com/search?q=${nameEncoded}+site%3Alinkedin.com+%22Universitas+Muhammadiyah+Malang%22`,
    instagram: `https://www.google.com/search?q=${nameEncoded}+site%3Ainstagram.com+UMM`,
    facebook: `https://www.google.com/search?q=${nameEncoded}+site%3Afacebook.com+%22Universitas+Muhammadiyah+Malang%22`,
    tiktok: `https://www.google.com/search?q=${nameEncoded}+site%3Atiktok.com`,
    detailed: `https://www.google.com/search?q=${searchDetailed}`,
    pddikti: `https://pddikti.kemdiktisaintek.go.id/search/mhs/${nameEncoded}`
  };
}

// Generate an HTML page with clickable search links for a batch
function generateBatchHtml(batch, batchNum) {
  const rows = batch.map((a, i) => {
    const urls = generateSearchUrls(a);
    const filled = countFilledItems(a);
    return `
    <tr class="${filled > 0 ? 'found' : ''}">
      <td>${(i + 1)}</td>
      <td><strong>${a.nama}</strong></td>
      <td>${a.nim}</td>
      <td>${a.jurusan}</td>
      <td>${a.tahunLulus}</td>
      <td>${filled}/8</td>
      <td>
        <a href="${urls.google}" target="_blank" class="btn">🔍 Google</a>
        <a href="${urls.linkedin}" target="_blank" class="btn btn-blue">💼 LinkedIn</a>
        <a href="${urls.instagram}" target="_blank" class="btn btn-pink">📷 IG</a>
        <a href="${urls.facebook}" target="_blank" class="btn btn-fb">📘 FB</a>
        <a href="${urls.pddikti}" target="_blank" class="btn btn-green">🎓 PDDIKTI</a>
      </td>
      <td>
        <input type="text" placeholder="LinkedIn URL" data-field="linkedin" data-id="${a.id}" class="input-sm" />
        <input type="text" placeholder="IG Username" data-field="instagram" data-id="${a.id}" class="input-sm" />
        <input type="text" placeholder="Email" data-field="email" data-id="${a.id}" class="input-sm" />
        <input type="text" placeholder="No HP" data-field="noHp" data-id="${a.id}" class="input-sm" />
        <input type="text" placeholder="Tempat Kerja" data-field="tempatBekerja" data-id="${a.id}" class="input-sm" />
        <input type="text" placeholder="Posisi" data-field="posisi" data-id="${a.id}" class="input-sm" />
        <select data-field="kategoriKarier" data-id="${a.id}" class="input-sm">
          <option value="">-- Kategori --</option>
          <option value="PNS">PNS</option>
          <option value="Swasta">Swasta</option>
          <option value="Wirausaha">Wirausaha</option>
        </select>
      </td>
    </tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Batch ${batchNum} — Pelacakan Alumni UMM</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
    h1 { color: #38bdf8; margin-bottom: 10px; }
    .stats { color: #94a3b8; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #1e293b; padding: 10px; text-align: left; position: sticky; top: 0; z-index: 10; }
    td { padding: 8px 10px; border-bottom: 1px solid #1e293b; vertical-align: top; }
    tr:hover { background: #1e293b; }
    tr.found { background: #064e3b33; }
    .btn { display: inline-block; padding: 3px 8px; margin: 2px; border-radius: 4px; 
           text-decoration: none; font-size: 11px; color: white; background: #334155; }
    .btn:hover { opacity: 0.8; }
    .btn-blue { background: #0077b5; }
    .btn-pink { background: #e1306c; }
    .btn-fb { background: #1877f2; }
    .btn-green { background: #059669; }
    .input-sm { display: block; width: 100%; padding: 4px 6px; margin: 2px 0; 
                background: #1e293b; border: 1px solid #334155; color: #e2e8f0; 
                border-radius: 4px; font-size: 12px; }
    .input-sm:focus { border-color: #38bdf8; outline: none; }
    .save-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 15px 20px; 
                background: #1e293b; border-top: 2px solid #38bdf8; display: flex; 
                justify-content: space-between; align-items: center; z-index: 100; }
    .save-btn { padding: 10px 30px; background: #38bdf8; color: #0f172a; border: none; 
                border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; }
    .save-btn:hover { background: #0ea5e9; }
    .export-btn { padding: 10px 20px; background: #059669; color: white; border: none; 
                  border-radius: 6px; cursor: pointer; font-size: 13px; }
  </style>
</head>
<body>
  <h1>🔍 Batch ${batchNum} — Pelacakan Alumni UMM</h1>
  <p class="stats">${batch.length} alumni | Klik tombol pencarian → isi data yang ditemukan → Export JSON</p>
  
  <table>
    <thead>
      <tr>
        <th>#</th><th>Nama</th><th>NIM</th><th>Prodi</th><th>Lulus</th><th>Terisi</th><th>Cari</th><th>Data Temuan</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="save-bar">
    <span id="statusText">Belum ada perubahan</span>
    <div>
      <button class="export-btn" onclick="exportData()">📥 Export JSON</button>
    </div>
  </div>

  <div style="height: 60px;"></div>

  <script>
    const batchData = ${JSON.stringify(batch)};
    
    // Track changes
    document.querySelectorAll('.input-sm').forEach(el => {
      el.addEventListener('change', () => {
        const id = parseInt(el.dataset.id);
        const field = el.dataset.field;
        const value = el.value.trim();
        const item = batchData.find(a => a.id === id);
        if (item) {
          item[field] = value;
          if (value) item.status = "Teridentifikasi";
          document.getElementById('statusText').textContent = 
            'Ada perubahan belum di-export (' + new Date().toLocaleTimeString() + ')';
        }
      });
    });

    function exportData() {
      const enriched = batchData.filter(a => {
        return a.linkedin || a.instagram || a.facebook || a.tiktok || 
               a.email || a.noHp || a.tempatBekerja || a.posisi;
      });
      
      const blob = new Blob([JSON.stringify(enriched, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'batch_${batchNum}_enriched.json';
      a.click();
      URL.revokeObjectURL(url);
      document.getElementById('statusText').textContent = 
        'Exported ' + enriched.length + ' records enriched!';
    }
  </script>
</body>
</html>`;
}

// --- CLI ---
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith("--")) {
      const key = process.argv[i].replace("--", "");
      args[key] = process.argv[i + 1] || true;
      i++;
    }
  }
  return args;
}

function main() {
  const args = parseArgs();
  
  if (!fs.existsSync(DATA_PATH)) {
    console.error("Run convert_xlsx_to_json.js first!");
    process.exit(1);
  }

  const data = readJson(DATA_PATH);
  console.log(`Loaded ${data.length} alumni records`);

  // --- Stats mode ---
  if (args.stats) {
    let totalFilled = 0;
    const fieldCounts = {
      linkedin: 0, instagram: 0, facebook: 0, tiktok: 0,
      email: 0, noHp: 0, tempatBekerja: 0, alamatBekerja: 0,
      posisi: 0, kategoriKarier: 0, sosialTempatKerja: 0
    };
    for (const a of data) {
      const filled = countFilledItems(a);
      if (filled > 0) totalFilled++;
      for (const k of Object.keys(fieldCounts)) {
        if (hasValue(a[k])) fieldCounts[k]++;
      }
    }
    console.log(`\n=== Coverage Stats ===`);
    console.log(`Total alumni: ${data.length}`);
    console.log(`Alumni with >=1 item filled: ${totalFilled} (${(totalFilled/data.length*100).toFixed(2)}%)`);
    console.log(`\nPer field:`);
    for (const [k, v] of Object.entries(fieldCounts)) {
      console.log(`  ${k}: ${v} (${(v/data.length*100).toFixed(2)}%)`);
    }
    return;
  }

  // --- Filter data ---
  let filtered = data;
  if (args.year) {
    filtered = data.filter(a => a.tahunLulus === args.year);
    console.log(`Filtered by year ${args.year}: ${filtered.length} records`);
  }
  if (args.faculty) {
    filtered = filtered.filter(a => a.fakultas.toLowerCase().includes(args.faculty.toLowerCase()));
    console.log(`Filtered by faculty "${args.faculty}": ${filtered.length} records`);
  }
  if (args.prodi) {
    filtered = filtered.filter(a => a.jurusan.toLowerCase().includes(args.prodi.toLowerCase()));
    console.log(`Filtered by prodi "${args.prodi}": ${filtered.length} records`);
  }

  // --- Sort: prioritize unfilled ---
  filtered.sort((a, b) => countFilledItems(a) - countFilledItems(b));

  // --- Generate batch HTML ---
  const batchSize = parseInt(args.size) || 50;
  const batchNum = parseInt(args.batch) || 1;
  const start = (batchNum - 1) * batchSize;
  const batch = filtered.slice(start, start + batchSize);
  const totalBatches = Math.ceil(filtered.length / batchSize);

  if (batch.length === 0) {
    console.log("No data in this batch.");
    return;
  }

  ensureDir(BATCH_HTML_DIR);
  const htmlPath = path.join(BATCH_HTML_DIR, `batch_${batchNum}.html`);
  const html = generateBatchHtml(batch, batchNum);
  fs.writeFileSync(htmlPath, html, "utf8");
  
  console.log(`\n✅ Generated: ${htmlPath}`);
  console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} alumni)`);
  console.log(`   Total batches available: ${totalBatches}`);
  console.log(`\n📌 How to use:`);
  console.log(`   1. Open the HTML file in your browser`);
  console.log(`   2. Click search buttons to find alumni data`);
  console.log(`   3. Fill in found data in the input fields`);
  console.log(`   4. Click "Export JSON" to save your work`);
  console.log(`\n🔄 Next batch: node scripts/auto_enrich.js --batch ${batchNum + 1} --size ${batchSize}`);

  // Also generate search URLs JSON for this batch
  ensureDir(path.dirname(SEARCH_URLS_PATH));
  const searchData = batch.map(a => ({
    id: a.id,
    nama: a.nama,
    nim: a.nim,
    jurusan: a.jurusan,
    tahunLulus: a.tahunLulus,
    urls: generateSearchUrls(a)
  }));
  writeJson(SEARCH_URLS_PATH, searchData);
  console.log(`\n📄 Search URLs also saved to: ${SEARCH_URLS_PATH}`);
}

main();
