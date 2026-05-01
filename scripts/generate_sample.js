#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeCsv(p, lines) { fs.writeFileSync(p, lines.join("\n"), "utf8"); }
function hasValue(v) { return v !== null && v !== undefined && String(v).trim() !== ""; }

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dedupPath = path.join(root, "data", "deduped_alumni.json");
  if (!fs.existsSync(dedupPath)) {
    console.error("Run scripts/dedupe.js first.");
    process.exit(1);
  }
  const data = readJson(dedupPath);
  const arg = process.argv[2];
  const n = arg ? Math.max(10, Number(arg)) : 200;

  // select only records that have at least one enrichment candidate (some fields)
  const candidates = data.filter(r => hasValue(r.name) || hasValue(r.nim));
  if (candidates.length === 0) {
    console.error("No candidates available in deduped data.");
    process.exit(1);
  }

  shuffle(candidates);
  const sample = candidates.slice(0, Math.min(n, candidates.length));
  const csvLines = [
    ["id","name","nim","found_fields","notes"].join(",")
  ];
  for (const r of sample) {
    const found = Object.keys(r).filter(k => k !== '__raw' && hasValue(r[k]));
    const row = [r.id, `"${String(r.name||"").replace(/"/g,'""')}"`, r.nim || "", `"${String(found.join(';'))}"`, "verify: url or screenshot"];
    csvLines.push(row.join(","));
  }

  const outPath = path.join(root, "outputs", `sample_verification_n${sample.length}.csv`);
  writeCsv(outPath, csvLines);
  console.log("Wrote sample CSV for verification:", outPath);
}

main();
