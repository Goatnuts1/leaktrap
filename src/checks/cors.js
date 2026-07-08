// Check 6: permissive CORS — especially wildcard origin with credentials.
import { read, lineAt, finding, SEV, relPath } from '../util.js';

export function checkCORS(root, files) {
  const out = [];
  for (const file of files) {
    const rel = relPath(root, file);
    const content = read(file);
    if (!content) continue;

    // Wildcard origin in various forms.
    const wildcardRe = /(Access-Control-Allow-Origin["']?\s*[:,]\s*["']\*["']|cors\(\s*\{\s*origin\s*:\s*["']\*["']|origin\s*:\s*true\b|cors\(\s*\)\s*)/gi;
    let m;
    while ((m = wildcardRe.exec(content))) {
      const ln = lineAt(content, m.index);
      const nearby = content.slice(Math.max(0, m.index - 150), m.index + 200);
      const withCreds = /Allow-Credentials["']?\s*[:,]\s*["']?true|credentials\s*:\s*true/i.test(nearby);

      out.push(finding({
        id: withCreds ? 'CORS_WILDCARD_CREDENTIALS' : 'CORS_WILDCARD',
        severity: withCreds ? SEV.HIGH : SEV.MEDIUM,
        title: withCreds
          ? 'CORS allows any origin AND credentials (dangerous combination)'
          : 'CORS allows requests from any origin (*)',
        file: rel,
        line: ln,
        detail: withCreds
          ? 'Allowing any origin together with credentials lets malicious websites make authenticated requests as your logged-in users and read the responses. Browsers try to block this combo, but misconfigured servers still leak.'
          : 'A wildcard CORS origin lets any website call this API from a browser. For a public read-only API that can be fine; for anything user-specific it is a data-exposure risk.',
        fix: 'Replace "*" with an explicit allowlist of your own domains. Never combine a wildcard origin with credentials:true — set a specific origin when cookies/tokens are involved.',
      }));
    }
  }
  return out;
}
