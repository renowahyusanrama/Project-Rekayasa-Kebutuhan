Pipeline scripts

Overview
- scripts/normalize.js  -> read alumni.json, produce data/normalized_alumni.json and outputs/normalized_alumni.csv
- scripts/dedupe.js     -> collapse duplicates, produce data/deduped_alumni.json and outputs/deduped_alumni.csv
- scripts/compute_metrics.js -> compute coverage metrics, outputs/coverage_report.json and outputs/coverage_report.md
- scripts/generate_sample.js  -> create a CSV sample for manual verification (outputs/sample_verification_n{N}.csv)
- scripts/enrich_stub.js -> prepare enrichment search queries (outputs/enrichment_candidates.json)

Usage (run from project root)

Node 18+ required. Run:

  node scripts/normalize.js
  node scripts/dedupe.js
  node scripts/compute_metrics.js
  node scripts/generate_sample.js  # optional: add sample size, e.g. `node scripts/generate_sample.js 200`
  node scripts/enrich_stub.js      # stub to prepare queries; integrate with Grok or other provider for actual enrichment

Notes
- These scripts do not perform web scraping or call external enrichment services by default. The `enrich_stub.js`
  prepares search queries and candidate slots; to perform enrichment you must implement a provider module that calls
  an API (Grok, Google Custom Search, etc.) and stores evidence URLs/screenshots.
- Respect target sites' terms of service and privacy rules when connecting to external services.
