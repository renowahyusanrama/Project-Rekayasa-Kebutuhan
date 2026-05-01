#!/usr/bin/env node
// This is a non-networking stub that generates search queries and candidate slots
// for enrichment. To perform actual enrichment you can implement provider modules
// (Grok, Google Custom Search, LinkedIn API) and replace the TODOs.

const fs = require('fs');
const path = require('path');

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, o) { fs.writeFileSync(p, JSON.stringify(o, null, 2), 'utf8'); }

function makeSlug(s) {
  return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function main() {
  const root = path.resolve(__dirname, '..');
  const dedupPath = path.join(root, 'data', 'deduped_alumni.json');
  if (!fs.existsSync(dedupPath)) {
    console.error('Run scripts/dedupe.js first.');
    process.exit(1);
  }

  const data = readJson(dedupPath);
  const candidates = [];
  for (const r of data) {
    const needs = [];
    if (!r.linkedin && !r.instagram && !r.facebook && !r.tiktok) needs.push('social');
    if (!r.email) needs.push('email');
    if (!r.noHp) needs.push('phone');
    if (needs.length === 0) continue;

    const q = [];
    // basic search queries to try with external provider
    const name = r.name || '';
    if (name) {
      q.push(`${name} "Universitas Muhammadiyah Malang" site:linkedin.com`);
      q.push(`${name} "Universitas Muhammadiyah Malang" instagram`);
      q.push(`${name} "Universitas Muhammadiyah Malang" email`);
      q.push(`${name} ${r.jurusan || ''} ${r.tahunLulus || ''}`);
    }

    candidates.push({ id: r.id, name: r.name, nim: r.nim, needs, queries: q.slice(0,5) });
  }

  const out = path.join(root, 'outputs', 'enrichment_candidates.json');
  writeJson(out, candidates);
  console.log('Wrote enrichment candidates (stub):', out, 'count:', candidates.length);
  console.log('Note: implement a provider to call Grok / search APIs and store candidate URLs/evidence.');
}

main();
