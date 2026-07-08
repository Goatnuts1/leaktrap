// Check 1 & 5: exposed API keys / secrets in client code and in the repo.
import { read, lineAt, isClientFile, finding, SEV, relPath } from '../util.js';

// High-signal secret patterns. Each: name, regex, severity when found in CLIENT code.
const PATTERNS = [
  { name: 'Stripe live secret key', re: /\bsk_live_[A-Za-z0-9]{16,}\b/g, sev: SEV.CRITICAL },
  { name: 'Stripe test secret key', re: /\bsk_test_[A-Za-z0-9]{16,}\b/g, sev: SEV.HIGH },
  { name: 'Stripe restricted key', re: /\brk_live_[A-Za-z0-9]{16,}\b/g, sev: SEV.CRITICAL },
  { name: 'OpenAI API key', re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g, sev: SEV.CRITICAL },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g, sev: SEV.CRITICAL },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/g, sev: SEV.CRITICAL },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, sev: SEV.HIGH },
  { name: 'GitHub token', re: /\bgh[posru]_[A-Za-z0-9]{36,}\b/g, sev: SEV.CRITICAL },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, sev: SEV.HIGH },
  { name: 'Supabase service_role JWT', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, sev: SEV.CRITICAL, guard: /service_role/ },
  { name: 'Generic private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g, sev: SEV.CRITICAL },
  { name: 'Hardcoded bearer/secret assignment', re: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/gi, sev: SEV.HIGH },
];

// Public-by-design keys we must NOT flag (reduce false positives).
const ALLOWLIST = [
  /pk_live_/, /pk_test_/,          // Stripe publishable
  /NEXT_PUBLIC_/, /VITE_/, /PUBLIC_/, // framework-public env prefixes
  /anon/i,                          // supabase anon key context
];

function isAllowlisted(line) {
  return ALLOWLIST.some((re) => re.test(line));
}

export function checkSecrets(root, files) {
  const out = [];
  for (const file of files) {
    const rel = relPath(root, file);
    const content = read(file);
    if (!content) continue;
    const client = isClientFile(rel);
    const isEnvTracked = /(^|\/)\.env(\.|$)/.test(rel.replace(/\\/g, '/')) && !rel.endsWith('.example') && !rel.endsWith('.sample');

    for (const p of PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(content))) {
        const ln = lineAt(content, m.index);
        const lineText = content.split('\n')[ln - 1] || '';
        if (p.guard && !p.guard.test(lineText) && !p.guard.test(content.slice(Math.max(0, m.index - 200), m.index))) continue;
        if (isAllowlisted(lineText)) continue;

        // Severity is worse when the secret is reachable by the browser.
        let sev = p.sev;
        let where = 'in the repository';
        if (client) { where = 'in browser-shipped code'; }
        else if (isEnvTracked) { where = 'in a committed .env file'; }

        out.push(finding({
          id: 'SECRET_EXPOSED',
          severity: sev,
          title: `${p.name} found ${where}`,
          file: rel,
          line: ln,
          detail: `A ${p.name} appears ${where}. Anyone who opens your site's source (or your repo) can copy it and run up charges or access your data.`,
          fix: client
            ? 'Never put secret keys in front-end code. Move this to a server route / edge function and read it from an environment variable. Then ROTATE this key immediately — assume it is already compromised.'
            : 'Remove the hardcoded secret, load it from an environment variable, add the file to .gitignore, and ROTATE the key. If it was ever committed, rotating is mandatory — git history keeps it.',
        }));
      }
    }
  }
  return out;
}
