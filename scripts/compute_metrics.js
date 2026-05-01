#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeJson(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8"); }

function hasValue(v) { return v !== null && v !== undefined && String(v).trim() !== ""; }

function main() {
  const root = path.resolve(__dirname, "..");
  const dedupPath = path.join(root, "data", "deduped_alumni.json");
  if (!fs.existsSync(dedupPath)) {
    console.error("Run scripts/dedupe.js first (deduped_alumni.json missing).");
    process.exit(1);
  }

  const data = readJson(dedupPath);
  const N = data.length;
  const fields = {
    linkedin: 0,
    instagram: 0,
    facebook: 0,
    tiktok: 0,
    email: 0,
    noHp: 0,
    tempatBekerja: 0,
    alamatBekerja: 0,
    posisi: 0,
    kategoriKarier: 0
  };

  let entriesWithAtLeastOne = 0;
  let entriesWithAllEight = 0;
  for (const r of data) {
    const found = (hasValue(r.linkedin) || hasValue(r.instagram) || hasValue(r.facebook) || hasValue(r.tiktok));
    if (found) entriesWithAtLeastOne++;

    let all8 = true;
    // check the 8 items per spec: social addresses (any), email, noHp, tempatBekerja, alamatBekerja, posisi, kategoriKarier
    const socialAny = hasValue(r.linkedin) || hasValue(r.instagram) || hasValue(r.facebook) || hasValue(r.tiktok);
    if (!socialAny) all8 = false;
    if (!hasValue(r.email)) all8 = false;
    if (!hasValue(r.noHp)) all8 = false;
    if (!hasValue(r.tempatBekerja)) all8 = false;
    if (!hasValue(r.alamatBekerja)) all8 = false;
    if (!hasValue(r.posisi)) all8 = false;
    if (!hasValue(r.kategoriKarier)) all8 = false;
    if (all8) entriesWithAllEight++;

    for (const k of Object.keys(fields)) if (hasValue(r[k])) fields[k]++;
  }

  const report = {
    totalEntries: N,
    fieldCounts: fields,
    fieldCoveragePercent: Object.fromEntries(Object.entries(fields).map(([k,v])=>[k, (v/N*100).toFixed(2)])),
    entriesWithAtLeastOne: entriesWithAtLeastOne,
    entriesWithAtLeastOnePercent: ((entriesWithAtLeastOne/N)*100).toFixed(2),
    entriesWithAllEight: entriesWithAllEight,
    entriesWithAllEightPercent: ((entriesWithAllEight/N)*100).toFixed(2)
  };

  const outJson = path.join(root, "outputs", "coverage_report.json");
  writeJson(outJson, report);
  console.log("Wrote coverage report:", outJson);

  // human-readable
  const md = [];
  md.push(`# Coverage Report\n`);
  md.push(`Total entries: ${N}\n`);
  md.push(`\n## Field coverage (counts and %)\n`);
  for (const [k, v] of Object.entries(fields)) md.push(`- ${k}: ${v} (${report.fieldCoveragePercent[k]}%)`);
  md.push(`\n- Entries with >=1 social field: ${report.entriesWithAtLeastOne} (${report.entriesWithAtLeastOnePercent}%)`);
  md.push(`- Entries with all 8 required items: ${report.entriesWithAllEight} (${report.entriesWithAllEightPercent}%)`);

  fs.writeFileSync(path.join(root, "outputs", "coverage_report.md"), md.join("\n"), "utf8");
  console.log("Wrote outputs/coverage_report.md");
}

main();
