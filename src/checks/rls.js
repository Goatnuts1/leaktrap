// Check 2: missing / inverted Supabase Row-Level Security — the #1 vibe-code leak.
import { read, lineAt, isClientFile, finding, SEV, relPath } from '../util.js';

export function checkRLS(root, files) {
  const out = [];
  let usesSupabase = false;
  const sqlFiles = [];
  let serviceRoleInClient = null;

  for (const file of files) {
    const rel = relPath(root, file).replace(/\\/g, '/');
    const content = read(file);
    if (!content) continue;

    if (/@supabase\/supabase-js|createClient\s*\(|supabase/i.test(content)) usesSupabase = true;

    // service_role key reachable by the browser = total RLS bypass.
    if (isClientFile(rel) && /service_role|SUPABASE_SERVICE_ROLE/i.test(content)) {
      const idx = content.search(/service_role|SUPABASE_SERVICE_ROLE/i);
      serviceRoleInClient = { file: rel, line: lineAt(content, idx) };
    }

    if (/\.sql$/.test(rel) || /migrations?\//.test(rel)) sqlFiles.push({ rel, content });
  }

  if (serviceRoleInClient) {
    out.push(finding({
      id: 'RLS_SERVICE_ROLE_CLIENT',
      severity: SEV.CRITICAL,
      title: 'Supabase service_role key used in client code',
      file: serviceRoleInClient.file,
      line: serviceRoleInClient.line,
      detail: 'The service_role key bypasses ALL Row-Level Security. If it is anywhere the browser can reach, anyone can read and write your entire database — every user\'s data.',
      fix: 'Remove service_role from all front-end code. Use the public "anon" key in the browser (protected by RLS) and keep service_role only in server routes / edge functions. Rotate the key.',
    }));
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
  if (usesSupabase && sqlFiles.length === 0 && !serviceRoleInClient) {
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
