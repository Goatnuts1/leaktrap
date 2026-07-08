#!/usr/bin/env node
// LeakTrap CLI — scan an AI-built app for common vibe-code security leaks.
import { scan } from '../src/scanner.js';
import { renderText, renderJSON, score } from '../src/report.js';
import { c } from '../src/util.js';

const args = process.argv.slice(2);

function flag(name) { return args.includes(name); }

if (flag('-h') || flag('--help')) {
  console.log(`
  ${c.bold('LeakTrap')} — scan your AI-built app for the ways vibe-coded apps leak.

  ${c.bold('Usage')}
    npx leaktrap [path] [options]

  ${c.bold('Options')}
    --json            Output machine-readable JSON
    --fail-on <sev>   Exit 1 if a finding at or above <sev> exists
                      (critical | high | medium | low). Default: critical
    -h, --help        Show this help

  ${c.bold('Checks')}  exposed API keys · Supabase RLS gaps · Firebase rules ·
           unauthenticated endpoints · path traversal · committed secrets
           & DB URLs · open CORS · auth tokens in localStorage

  ${c.gray('Free & open source. Auto-fix + monitoring at leaktrap.dev')}
`);
  process.exit(0);
}

const positional = args.filter((a) => !a.startsWith('-'));
const failOnIdx = args.indexOf('--fail-on');
const failOn = failOnIdx !== -1 ? args[failOnIdx + 1] : 'critical';
const root = positional[0] || process.cwd();

const result = scan(root);

if (flag('--json')) {
  console.log(renderJSON(root, result));
} else {
  console.log(renderText(root, result));
}

// Exit code for CI: fail if any finding is at/above the threshold.
const rank = { critical: 0, high: 1, medium: 2, low: 3 };
const threshold = rank[failOn] ?? 0;
const worst = result.findings.reduce(
  (min, f) => Math.min(min, rank[f.severity] ?? 3),
  99
);
process.exit(worst <= threshold ? 1 : 0);
