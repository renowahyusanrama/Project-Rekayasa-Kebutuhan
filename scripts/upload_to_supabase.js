#!/usr/bin/env node
/**
 * Upload alumni data from alumni.json to Supabase
 * 
 * This script reads the local alumni.json (142,292 records) and uploads
 * them to the Supabase 'alumni' table in batches.
 * 
 * Usage:
 *   node scripts/upload_to_supabase.js
 *   node scripts/upload_to_supabase.js --reset   (delete all existing data first)
 *   node scripts/upload_to_supabase.js --check   (just check current row count)
 * 
 * Prerequisites:
 *   - The 'alumni' table must exist in your Supabase project
 *   - Table columns should match the fields below
 * 
 * IMPORTANT: Your Supabase table 'alumni' needs these columns:
 *   id (int8, primary key)
 *   name (text)
 *   nim (text)
 *   fakultas (text)
 *   jurusan (text)
 *   tahunMasuk (text)
 *   tanggalLulus (text)
 *   tahunLulus (text)
 *   status (text)
 *   email (text)
 *   noHp (text)
 *   linkedin (text)
 *   instagram (text)
 *   facebook (text)
 *   tiktok (text)
 *   tempatBekerja (text)
 *   alamatBekerja (text)
 *   posisi (text)
 *   kategoriKarier (text)
 *   sosialTempatKerja (text)
 *   searchGoogle (text)       -- Google search URL
 *   searchLinkedin (text)     -- LinkedIn search URL
 *   searchInstagram (text)    -- Instagram search URL
 *   searchFacebook (text)     -- Facebook search URL
 *   searchPddikti (text)      -- PDDIKTI search URL
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const SUPABASE_URL = "https://cbzypguhnqxyswafzvie.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNienlwZ3VobnF4eXN3YWZ6dmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MzM0NjEsImV4cCI6MjA5MzIwOTQ2MX0.AupV6k3j3IbjwppBX6hiZ32xuEHRpS5vhqqa8clyQuQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "alumni.json");
const BATCH_SIZE = 500; // Supabase recommends max ~1000 rows per insert

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

// Generate search URLs for an alumni record
function generateSearchUrls(alumni) {
  const name = alumni.nama || "";
  const nameEncoded = encodeURIComponent(name);
  const searchBase = encodeURIComponent(`${name} Universitas Muhammadiyah Malang`);

  return {
    searchGoogle: `https://www.google.com/search?q=${searchBase}`,
    searchLinkedin: `https://www.google.com/search?q=${nameEncoded}+site%3Alinkedin.com+%22Universitas+Muhammadiyah+Malang%22`,
    searchInstagram: `https://www.google.com/search?q=${nameEncoded}+site%3Ainstagram.com+UMM`,
    searchFacebook: `https://www.google.com/search?q=${nameEncoded}+site%3Afacebook.com+%22Universitas+Muhammadiyah+Malang%22`,
    searchPddikti: `https://pddikti.kemdiktisaintek.go.id/search/mhs/${nameEncoded}`
  };
}

// Transform local JSON record → Supabase row
function toSupabaseRow(record) {
  const urls = generateSearchUrls(record);
  return {
    id: record.id,
    name: record.nama || "",
    nim: record.nim || "",
    fakultas: record.fakultas || "",
    jurusan: record.jurusan || "",
    tahunMasuk: record.tahunMasuk || "",
    tahunLulus: record.tahunLulus || "",
    status: record.status || "Belum Dilacak",
    email: record.email || "",
    noHp: record.noHp || "",
    linkedin: record.linkedin || "",
    instagram: record.instagram || "",
    facebook: record.facebook || "",
    tiktok: record.tiktok || "",
    tempatBekerja: record.tempatBekerja || "",
    alamatBekerja: record.alamatBekerja || "",
    posisi: record.posisi || "",
    kategoriKarier: record.kategoriKarier || "",
    workplace_social: record.sosialTempatKerja || record.workplace_social || "",
    // Search URLs for quick lookup from the web app
    searchGoogle: urls.searchGoogle,
    searchLinkedin: urls.searchLinkedin,
    searchInstagram: urls.searchInstagram,
    searchFacebook: urls.searchFacebook,
    searchPddikti: urls.searchPddikti
  };
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function checkCount() {
  const { count, error } = await supabase
    .from("alumni")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error checking count:", error.message);
    return -1;
  }
  return count || 0;
}

async function deleteAll() {
  console.log("⚠️  Deleting all existing alumni data from Supabase...");
  // Supabase requires a filter for delete, use gt(id, 0) to match all
  const { error } = await supabase
    .from("alumni")
    .delete()
    .gt("id", 0);

  if (error) {
    console.error("Error deleting:", error.message);
    return false;
  }
  console.log("✅ All existing data deleted.");
  return true;
}

async function uploadData() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error("❌ data/alumni.json not found. Run convert_xlsx_to_json.js first.");
    process.exit(1);
  }

  const data = readJson(DATA_PATH);
  console.log(`📄 Loaded ${data.length} records from alumni.json`);

  const totalBatches = Math.ceil(data.length / BATCH_SIZE);
  let uploaded = 0;
  let errors = 0;

  console.log(`📤 Uploading to Supabase in ${totalBatches} batches of ${BATCH_SIZE}...\n`);

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = data.slice(i, i + BATCH_SIZE);
    const rows = batch.map(toSupabaseRow);

    const { error } = await supabase
      .from("alumni")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Batch ${batchNum}/${totalBatches}: ${error.message}`);
      errors++;
      
      // If it's a column error, show which columns are needed
      if (error.message.includes("column")) {
        console.error("\n⚠️  Your Supabase table might be missing columns.");
        console.error("Run this SQL in Supabase SQL Editor to add missing columns:\n");
        console.error(generateAlterSQL());
        process.exit(1);
      }
    } else {
      uploaded += batch.length;
      const pct = ((uploaded / data.length) * 100).toFixed(1);
      process.stdout.write(`  ✅ Batch ${batchNum}/${totalBatches} — ${uploaded}/${data.length} (${pct}%)\r`);
    }

    // Small delay to avoid rate limiting
    if (batchNum % 10 === 0) {
      await sleep(500);
    }
  }

  console.log(`\n\n🎉 Upload complete!`);
  console.log(`   Uploaded: ${uploaded}`);
  console.log(`   Errors: ${errors}`);

  // Verify
  const finalCount = await checkCount();
  console.log(`   Supabase row count: ${finalCount}`);
}

function generateAlterSQL() {
  return `
-- Run this in Supabase SQL Editor if your table is missing columns
-- First, create the table if it doesn't exist:

CREATE TABLE IF NOT EXISTS alumni (
  id bigint PRIMARY KEY,
  name text DEFAULT '',
  nim text DEFAULT '',
  fakultas text DEFAULT '',
  jurusan text DEFAULT '',
  "tahunMasuk" text DEFAULT '',
  "tanggalLulus" text DEFAULT '',
  "tahunLulus" text DEFAULT '',
  status text DEFAULT 'Belum Dilacak',
  email text DEFAULT '',
  "noHp" text DEFAULT '',
  linkedin text DEFAULT '',
  instagram text DEFAULT '',
  facebook text DEFAULT '',
  tiktok text DEFAULT '',
  "tempatBekerja" text DEFAULT '',
  "alamatBekerja" text DEFAULT '',
  posisi text DEFAULT '',
  "kategoriKarier" text DEFAULT '',
  "sosialTempatKerja" text DEFAULT '',
  "searchGoogle" text DEFAULT '',
  "searchLinkedin" text DEFAULT '',
  "searchInstagram" text DEFAULT '',
  "searchFacebook" text DEFAULT '',
  "searchPddikti" text DEFAULT ''
);

-- If table already exists, add missing columns:
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "tanggalLulus" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "tahunLulus" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "noHp" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS linkedin text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS instagram text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS facebook text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS tiktok text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "tempatBekerja" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "alamatBekerja" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS posisi text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "kategoriKarier" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "sosialTempatKerja" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "searchGoogle" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "searchLinkedin" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "searchInstagram" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "searchFacebook" text DEFAULT '';
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS "searchPddikti" text DEFAULT '';

-- Enable Row Level Security (allow public read)
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON alumni FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON alumni FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON alumni FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON alumni FOR DELETE USING (true);
`;
}

// --- CLI ---
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--sql")) {
    console.log(generateAlterSQL());
    return;
  }

  if (args.includes("--check")) {
    const count = await checkCount();
    console.log(`📊 Current Supabase alumni count: ${count}`);
    return;
  }

  if (args.includes("--reset")) {
    await deleteAll();
    await sleep(1000);
  }

  await uploadData();
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
