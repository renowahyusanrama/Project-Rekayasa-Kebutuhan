#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeJson(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8"); }
function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function tokenSet(s) {
  return String(s || "").toLowerCase().split(/\s+/).filter(Boolean);
}

function tokenIntersectionRatio(a, b) {
  const sa = new Set(tokenSet(a));
  const sb = new Set(tokenSet(b));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / Math.min(sa.size, sb.size);
}

function mergeRecords(group) {
  const base = {};
  for (const rec of group) {
    for (const k of Object.keys(rec)) {
      if (k === "__raw") continue;
      if (!base[k] || base[k] === "") base[k] = rec[k];
    }
  }
  return base;
}

function main() {
  const root = path.resolve(__dirname, "..");
  const normPath = path.join(root, "data", "normalized_alumni.json");
  if (!fs.existsSync(normPath)) {
    console.error("Run scripts/normalize.js first (normalized_alumni.json missing).");
    process.exit(1);
  }

  const data = readJson(normPath);
  const byNim = new Map();
  const noNim = [];

  for (const r of data) {
    const nim = String(r.nim || "").trim();
    if (nim) {
      if (!byNim.has(nim)) byNim.set(nim, []);
      byNim.get(nim).push(r);
    } else {
      noNim.push(r);
    }
  }

  const groups = [];
  for (const arr of byNim.values()) groups.push(arr);

  // cluster noNim by name+year similarity
  const used = new Array(noNim.length).fill(false);
  for (let i = 0; i < noNim.length; i++) {
    if (used[i]) continue;
    const base = noNim[i];
    const cluster = [base];
    used[i] = true;
    for (let j = i + 1; j < noNim.length; j++) {
      if (used[j]) continue;
      const other = noNim[j];
      const nameRatio = tokenIntersectionRatio(base.name, other.name);
      const yearMatch = (base.tahunLulus && other.tahunLulus && base.tahunLulus === other.tahunLulus);
      if (nameRatio >= 0.8 || (nameRatio >= 0.6 && yearMatch)) {
        cluster.push(other);
        used[j] = true;
      }
    }
    groups.push(cluster);
  }

  const merged = groups.map(mergeRecords);
  ensureDir(path.join(root, "data"));
  ensureDir(path.join(root, "outputs"));
  writeJson(path.join(root, "data", "deduped_alumni.json"), merged);
  console.log("Wrote deduped records:", merged.length);

  // write CSV minimal
  const fields = ["id","name","nim","fakultas","jurusan","tahunLulus","email","noHp","linkedin","tempatBekerja","posisi"];
  const csv = [fields.join(",")];
  for (const r of merged) csv.push(fields.map((f)=> (r[f]||"").toString().replace(/"/g,'""')).map(v=> v.includes(',')?`"${v}"`:v).join(','));
  fs.writeFileSync(path.join(root, "outputs", "deduped_alumni.csv"), csv.join("\n"), "utf8");
  console.log("Wrote outputs/deduped_alumni.csv");
}

main();
