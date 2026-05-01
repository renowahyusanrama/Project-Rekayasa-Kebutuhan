#!/usr/bin/env node
/**
 * Quick check: what column names exist in the Supabase alumni table?
 */
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://cbzypguhnqxyswafzvie.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNienlwZ3VobnF4eXN3YWZ6dmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MzM0NjEsImV4cCI6MjA5MzIwOTQ2MX0.AupV6k3j3IbjwppBX6hiZ32xuEHRpS5vhqqa8clyQuQ"
);

async function main() {
  // Fetch 1 row to see the columns
  const { data, error } = await supabase
    .from("alumni")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log("=== Columns in Supabase 'alumni' table ===");
    const cols = Object.keys(data[0]);
    cols.forEach(c => {
      const val = data[0][c];
      const preview = val ? String(val).substring(0, 60) : "(empty)";
      console.log(`  ${c}: ${preview}`);
    });
    console.log(`\nTotal columns: ${cols.length}`);
  } else {
    console.log("No data found in alumni table");
  }
}

main();
