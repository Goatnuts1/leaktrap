// Scoring + plain-English report. Built for a non-technical founder.
import { SEV_WEIGHT, c } from './util.js';

/** 0–100 production-readiness score. Starts at 100; each finding subtracts. */
export function score(findings) {
  let deduction = 0;
  for (const f of findings) deduction += SEV_WEIGHT[f.severity] || 0;
  return Math.max(0, 100 - deduction);
}

export function grade(s) {
  if (s >= 90) return { label: 'Ship it', emoji: '✅', color: c.green };
  if (s >= 70) return { label: 'Almost there', emoji: '🟡', color: c.yellow };
  if (s >= 40) return { label: 'Not yet', emoji: '🟠', color: c.yellow };
  return { label: 'Do not ship', emoji: '🔴', color: c.red };
}

const SEV_LABEL = {
  critical: (t) => c.red(c.bold(t)),
  high: (t) => c.red(t),
  medium: (t) => c.yellow(t),
  low: (t) => c.gray(t),
};

export function renderText(root, result) {
  const { findings, files } = result;
  const s = score(findings);
  const g = grade(s);
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity]++;

  const lines = [];
  lines.push('');
  lines.push(c.bold('  LeakTrap — production-readiness scan'));
  lines.push(c.gray(`  ${files} files scanned in ${root}`));
  lines.push('');
  lines.push(`  ${g.emoji}  Score: ${g.color(c.bold(`${s}/100`))}  —  ${g.color(g.label)}`);
  lines.push('');
  lines.push(
    `  ${c.red(c.bold(counts.critical + ' critical'))}   ` +
    `${c.red(counts.high + ' high')}   ` +
    `${c.yellow(counts.medium + ' medium')}   ` +
    `${c.gray(counts.low + ' low')}`
  );
  lines.push('');

  if (findings.length === 0) {
    lines.push(c.green('  No issues found by the current checks. '));
    lines.push(c.gray('  (LeakTrap checks 8 common vibe-code leaks; it is not a full audit.)'));
    lines.push('');
    return lines.join('\n');
  }

  lines.push(c.gray('  ' + '─'.repeat(56)));
  let n = 0;
  for (const f of findings) {
    n++;
    const sev = SEV_LABEL[f.severity](f.severity.toUpperCase());
    lines.push('');
    lines.push(`  ${c.bold(`${n}.`)} [${sev}] ${c.bold(f.title)}`);
    if (f.file) lines.push(`     ${c.cyan(f.file + (f.line ? `:${f.line}` : ''))}`);
    lines.push(`     ${wrapText(f.detail, 68, '     ')}`);
    lines.push(`     ${c.green('Fix:')} ${wrapText(f.fix, 68, '          ').trimStart()}`);
  }
  lines.push('');
  lines.push(c.gray('  ' + '─'.repeat(56)));
  lines.push('');
  lines.push(`  ${c.bold('Next:')} fix criticals first, then re-run ${c.cyan('npx leaktrap')}.`);
  lines.push(c.gray('  Want auto-fix PRs + monitoring on every push? → leaktrap.dev'));
  lines.push('');
  return lines.join('\n');
}

export function renderJSON(root, result) {
  const s = score(result.findings);
  return JSON.stringify(
    { root, score: s, grade: grade(s).label, files: result.files, findings: result.findings },
    null,
    2
  );
}

function wrapText(text, width, indent) {
  const words = String(text).split(/\s+/);
  const out = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) {
      out.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) out.push(line.trim());
  return out.join('\n' + indent);
}
