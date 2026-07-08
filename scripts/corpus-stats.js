#!/usr/bin/env node
// Generate the launch data hook: scan a folder of cloned apps and report
// "N apps scanned, X% leaked at least one issue" + a breakdown by check.
//
// Usage:
//   1. Clone a batch of public vibe-coded apps into ./corpus/<name>/ each.
//   2. node scripts/corpus-stats.js ./corpus
//
// This is how you produce the honest number for the Show HN post — do NOT
// invent it. Run it on real repos.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { scan } from '../src/scanner.js';

const root = process.argv[2] || './corpus';
let dirs;
try {
  dirs = readdirSync(root).filter((d) => {
    try { return statSync(join(root, d)).isDirectory(); } catch { return false; }
  });
} catch {
  console.error(`No corpus at ${root}. Clone some public apps into subfolders first.`);
  process.exit(1);
}

const appsWithCheck = {}; // id -> count of APPS with >=1 of that check
let withAny = 0, withCritical = 0;
const perApp = [];

for (const d of dirs) {
  const { findings } = scan(join(root, d));
  if (findings.length) withAny++;
  if (findings.some((f) => f.severity === 'critical')) withCritical++;
  const seen = new Set(findings.map((f) => f.id));
  for (const id of seen) appsWithCheck[id] = (appsWithCheck[id] || 0) + 1;
  perApp.push({ app: d, findings: findings.length, critical: findings.filter((f) => f.severity === 'critical').length });
}

const n = dirs.length;
const pct = (x) => n ? Math.round((x / n) * 100) : 0;

console.log(`\n  Scanned ${n} apps\n`);
console.log(`  ${pct(withAny)}%  had at least one issue`);
console.log(`  ${pct(withCritical)}%  had a CRITICAL issue (exposed secret / service_role in client)\n`);
console.log('  By check (% of apps with >=1):');
for (const [id, count] of Object.entries(appsWithCheck).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(pct(count)).padStart(3)}%  ${id}  (${count}/${n} apps)`);
}
console.log('\n  Worst offenders:');
for (const a of perApp.sort((x, y) => y.critical - x.critical || y.findings - x.findings).slice(0, 10)) {
  console.log(`    ${a.app}: ${a.findings} findings (${a.critical} critical)`);
}
console.log('');
