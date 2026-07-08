// Check 2: missing / inverted Supabase Row-Level Security — the #1 vibe-code leak.
import { read, lineAt, isClientFile, finding, SEV, relPath } from '../util.js';

// Decode a Supabase JWT's payload and return its `role` claim, or null.
// Accurate: a service_role key literally has {"role":"service_role"}; the public
// anon key has {"role":"anon"} — so this never flags the (safe) anon key.
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.([A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}/g;
function jwtRole(payloadSeg) {
  try {
    const json = JSON.parse(Buffer.from(payloadSeg, 'base64url').toString('utf8'));
    return typeof json.role === 'string' ? json.role : null;
  } catch {
    return null;
  }
}

export function checkRLS(root, files) {
  const out = [];
  let usesSupabase = false;
  const sqlFiles = [];
  const serviceRoleSeen = new Set();

  for (const file of files) {
    const rel = relPath(root, file).replace(/\\/g, '/');
    const content = read(file);
    if (!content) continue;

    // Require actual Supabase SDK usage, not just the word "supabase" (which
    // shows up in READMEs, marketing copy, and comments).
    if (/@supabase\/supabase-js|createClient\s*\([^)]*supabase|supabase\s*\.\s*(from|auth|rpc|storage|channel)\s*\(/i.test(content)) {
      usesSupabase = true;
    }

    // Detect service_role keys two ways, both precise:
    //  (a) decode any JWT and check role === 'service_role' (catches the raw key,
    //      never flags the public anon key), and
    //  (b) a key-NAME reference like SUPABASE_SERVICE_ROLE_KEY / serviceRoleKey.
    const client = isClientFile(rel);
    let hit = -1;
    JWT_RE.lastIndex = 0;
    let jm;
    while ((jm = JWT_RE.exec(content))) {
      if (jwtRole(jm[1]) === 'service_role') { hit = jm.index; break; }
    }
    if (hit === -1) {
      const nameMatch = content.search(/SUPABASE_SERVICE_ROLE|service[_-]?role[_-]?key/i);
      if (nameMatch !== -1) hit = nameMatch;
    }
    if (hit !== -1 && !serviceRoleSeen.has(rel)) {
      serviceRoleSeen.add(rel);
      out.push(finding({
        id: 'RLS_SERVICE_ROLE_CLIENT',
        severity: SEV.CRITICAL,
        title: client
          ? 'Supabase service_role key in client-reachable code'
          : 'Supabase service_role key committed to the repo',
        file: rel,
        line: lineAt(content, hit),
        detail: 'The service_role key bypasses ALL Row-Level Security — it is full read/write on your entire database. '
          + (client ? 'Here it is reachable by the browser, so anyone who opens devtools can read or delete every user\'s data.' : 'Committed to the repo, anyone with repo access (or git history) has full database control.'),
        fix: 'Remove service_role from front-end/committed code. Use the public "anon" key in the browser (protected by RLS); keep service_role only in server routes / edge functions and load it from an env var. Then ROTATE the key.',
      }));
    }

    if (/\.sql$/.test(rel) || /migrations?\//.test(rel)) sqlFiles.push({ rel, content });
  }

  // Analyze SQL: tables created without RLS enabled, or policies that allow everyone.
  for (const { rel, content } of sqlFiles) {
    const lower = content.toLowerCase();

    const createRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?["']?(?:public\.)?([a-z0-9_]+)/gi;
    let m;
    const created = [];
    while ((m = createRe.exec(content))) created.push({ name: m[1], line: lineAt(content, m.index) });

    for (const t of created) {
      const enableRe = new RegExp(`alter\\s+table\\s+["']?(public\\.)?${t.name}["']?\\s+enable\\s+row\\s+level\\s+security`, 'i');
      if (!enableRe.test(content) && !enableRe.test(lower)) {
        out.push(finding({
          id: 'RLS_NOT_ENABLED',
          severity: SEV.HIGH,
          title: `Table "${t.name}" created without Row-Level Security enabled`,
          file: rel,
          line: t.line,
          detail: `The "${t.name}" table has no "ENABLE ROW LEVEL SECURITY" in this migration. With Supabase's public anon key, a table without RLS is readable (and often writable) by anyone on the internet.`,
          fix: `Add: ALTER TABLE ${t.name} ENABLE ROW LEVEL SECURITY;  then write policies that restrict rows to their owner (e.g. USING (auth.uid() = user_id)). Verify in the Supabase dashboard that RLS shows "Enabled".`,
        }));
      }
    }

    // Inverted / permissive policies: "using (true)" on non-public data.
    const truePolicyRe = /create\s+policy[^;]*using\s*\(\s*true\s*\)/gi;
    while ((m = truePolicyRe.exec(content))) {
      out.push(finding({
        id: 'RLS_POLICY_ALLOWS_ALL',
        severity: SEV.HIGH,
        title: 'Row-Level Security policy allows every row (USING (true))',
        file: rel,
        line: lineAt(content, m.index),
        detail: 'A policy with USING (true) lets any authenticated (or anonymous) user read/modify every row — it defeats the purpose of RLS. This is the "inverted RLS" pattern behind several public vibe-code data leaks.',
        fix: 'Scope the policy to the current user, e.g. USING (auth.uid() = user_id). Only use USING (true) for genuinely public, read-only reference tables.',
      }));
    }
  }

  // Supabase in use but no SQL/migrations found at all — can't confirm RLS.
  if (usesSupabase && sqlFiles.length === 0 && serviceRoleSeen.size === 0) {
    out.push(finding({
      id: 'RLS_UNVERIFIABLE',
      severity: SEV.MEDIUM,
      title: 'Supabase detected but no migrations found to verify RLS',
      file: null,
      line: null,
      detail: 'This project uses Supabase but ships no SQL/migration files, so LeakTrap cannot confirm Row-Level Security is enabled. Many vibe-coded apps leave RLS off by default, exposing all data via the public anon key.',
      fix: 'In the Supabase dashboard, open Authentication → Policies and confirm every table shows "RLS enabled" with owner-scoped policies. Export your schema to SQL so this stays checkable.',
    }));
  }

  return out;
}
