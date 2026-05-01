#!/usr/bin/env node
/**
 * Merge enriched batch JSON files back into the main alumni.json
 * 
 * Usage:
 *   node scripts/merge_enriched.js outputs/batch_pages/batch_1_enriched.json
 *   node scripts/merge_enriched.js outputs/batch_pages/*.json
 *   node scripts/merge_enriched.js --all   (merge all batch_*_enriched.json files)
 */

const fs = require("fs");
const path = require("path");
const { glob } = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "alumni.json");
const BATCH_DIR = path.join(ROOT, "outputs", "batch_pages");

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeJson(p, o) { fs.writeFileSync(p, JSON.stringify(o, null, 2), "utf8"); }
function hasValue(v) { return v !== null && v !== undefined && String(v).trim() !== ""; }

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Usage:");
    console.log("  node scripts/merge_enriched.js <file1.json> [file2.json ...]");
    console.log("  node scripts/merge_enriched.js --all");
    process.exit(0);
  }

  // Load main data
  const alumni = readJson(DATA_PATH);
  console.log(`Loaded main data: ${alumni.length} records`);

  // Build lookup by id
  const lookup = new Map();
  for (let i = 0; i < alumni.length; i++) {
    lookup.set(alumni[i].id, i);
  }

  // Determine files to merge
  let files = [];
  if (args[0] === "--all") {
    if (fs.existsSync(BATCH_DIR)) {
      files = fs.readdirSync(BATCH_DIR)
        .filter(f => f.endsWith("_enriched.json"))
        .map(f => path.join(BATCH_DIR, f));
    }
  } else {
    files = args.filter(f => fs.existsSync(f));
  }

  if (files.length === 0) {
    console.log("No enriched files found to merge.");
    return;
  }

  let totalMerged = 0;
  const enrichFields = [
    "email", "noHp", "linkedin", "instagram", "facebook", "tiktok",
    "tempatBekerja", "alamatBekerja", "posisi", "kategoriKarier", "sosialTempatKerja"
  ];

  for (const file of files) {
    console.log(`\nMerging: ${file}`);
    const enriched = readJson(file);
    let mergedInFile = 0;

    for (const record of enriched) {
      const idx = lookup.get(record.id);
      if (idx === undefined) {
        console.log(`  ⚠ ID ${record.id} not found in main data, skipping`);
        continue;
      }

      let updated = false;
      for (const field of enrichFields) {
        if (hasValue(record[field]) && !hasValue(alumni[idx][field])) {
          alumni[idx][field] = record[field];
          updated = true;
        }
      }

      if (updated) {
        alumni[idx].status = "Teridentifikasi";
        mergedInFile++;
      }
    }
    
    console.log(`  ✅ Merged ${mergedInFile} records from this file`);
    totalMerged += mergedInFile;
  }

  // Save updated data
  writeJson(DATA_PATH, alumni);
  console.log(`\n✅ Total merged: ${totalMerged} records`);
  console.log(`Updated: ${DATA_PATH}`);

  // Quick stats
  let filledCount = 0;
  for (const a of alumni) {
    const hasSocial = hasValue(a.linkedin) || hasValue(a.instagram) || hasValue(a.facebook) || hasValue(a.tiktok);
    if (hasSocial || hasValue(a.email) || hasValue(a.noHp) || hasValue(a.tempatBekerja)) {
      filledCount++;
    }
  }
  const coverage = (filledCount / alumni.length * 100).toFixed(2);
  console.log(`\n📊 Current coverage: ${filledCount}/${alumni.length} = ${coverage}%`);
}

main();
