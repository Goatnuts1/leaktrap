// Check 8: auth tokens stored in localStorage — readable by any XSS on the page.
// Common in vibe-coded apps (the generator "just makes login work"). Medium: it's
// a real hardening gap, not an instant breach, so we don't over-scare.
import { read, lineAt, isClientFile, finding, SEV, relPath } from '../util.js';

// localStorage.setItem('token'|'jwt'|'auth'|'accessToken'|... , …)
const RE = /(?:local|session)Storage\.setItem\s*\(\s*["'`](?:access[_-]?token|refresh[_-]?token|auth[_-]?token|id[_-]?token|jwt|token|auth|session|bearer|api[_-]?key)["'`]/gi;

export function checkClientStorage(root, files) {
  const out = [];
  for (const file of files) {
    const rel = relPath(root, file);
    if (!isClientFile(rel)) continue;
    const content = read(file);
    if (!content) continue;
    let m;
    RE.lastIndex = 0;
    while ((m = RE.exec(content))) {
      out.push(finding({
        id: 'TOKEN_IN_LOCALSTORAGE',
        severity: SEV.MEDIUM,
        title: 'Auth token stored in localStorage (readable by any XSS)',
        file: rel,
        line: lineAt(content, m.index),
        detail: 'This stores an auth/session token in localStorage. Any cross-site-scripting (XSS) flaw anywhere on your site can read it and impersonate the user — localStorage has no protection against script access.',
        fix: 'Prefer an httpOnly, Secure, SameSite cookie set by the server for session tokens — scripts (and thus XSS) can\'t read those. If you must use the browser, keep only short-lived access tokens in memory, not localStorage.',
      }));
    }
  }
  return out;
}
