// Check 3: unauthenticated API endpoints that mutate or read protected data.
import { read, lineAt, isApiFile, finding, SEV, relPath } from '../util.js';

// Signals that SOME auth/authorization check is present in a handler.
const AUTH_SIGNALS = [
  /getServerSession|getSession|auth\(\)|requireAuth|withAuth|isAuthenticated|verifyToken|verifyJwt|jwt\.verify/i,
  /supabase[^;]*\.auth\.getUser|auth\.getUser\(|getUser\(/i,
  /req\.(user|auth|session)|ctx\.(user|session)|locals\.(user|session)/i,
  /authorization|bearer|clerk|nextauth|lucia|firebase-admin|admin\.auth/i,
  /middleware|protectedProcedure/i,
];

// Signals the handler does something that usually SHOULD be protected.
const SENSITIVE_OPS = /\b(insert|update|delete|upsert|drop|\.from\(|prisma\.|db\.|createUser|deleteUser|charge|refund|payout|sendEmail|process\.env)/i;

// Detect an exported HTTP handler.
const HANDLER_RE = /export\s+(?:default\s+)?(?:async\s+)?function|export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=|export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/;

export function checkAuth(root, files) {
  const out = [];
  for (const file of files) {
    const rel = relPath(root, file);
    if (!isApiFile(rel)) continue;
    const content = read(file);
    if (!content || !HANDLER_RE.test(content)) continue;

    const hasAuth = AUTH_SIGNALS.some((re) => re.test(content));
    const hasSensitive = SENSITIVE_OPS.test(content);

    // Public GET with no writes is often fine; a write/DB handler with no auth is not.
    const mutating = /\b(POST|PUT|PATCH|DELETE)\b/.test(content) || SENSITIVE_OPS.test(content);

    if (!hasAuth && mutating && hasSensitive) {
      const idx = content.search(HANDLER_RE);
      out.push(finding({
        id: 'ENDPOINT_NO_AUTH',
        severity: SEV.HIGH,
        title: 'API endpoint appears to touch data with no authentication check',
        file: rel,
        line: lineAt(content, Math.max(0, idx)),
        detail: 'This route reads or writes data (database / payments / email) but LeakTrap found no session, token, or auth check. Anyone who knows the URL can call it directly — bypassing your app\'s buttons and permissions.',
        fix: 'At the top of the handler, verify the caller: get the session/user (e.g. supabase.auth.getUser() or getServerSession()) and return 401 if missing. Then check they are allowed to touch THIS record (authorization, not just authentication).',
      }));
    }
  }
  return out;
}
