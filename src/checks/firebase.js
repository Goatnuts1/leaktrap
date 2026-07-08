// Check 7: permissive Firebase security rules — the Firebase equivalent of
// Supabase RLS being off. A rule that allows read/write "if true" means anyone
// on the internet can read (or wipe) your database.
import { read, lineAt, finding, SEV, relPath } from '../util.js';

// Is this a Firebase rules file (Firestore/Storage .rules, or RTDB JSON rules)?
function isRulesFile(rel, content) {
  const p = rel.replace(/\\/g, '/');
  if (/\.rules$/.test(p)) return true;
  if (/(^|\/)database\.rules\.json$/.test(p)) return true;
  return /rules_version\s*=|service\s+cloud\.firestore|service\s+firebase\.storage/.test(content);
}

export function checkFirebase(root, files) {
  const out = [];
  for (const file of files) {
    const rel = relPath(root, file);
    const content = read(file);
    if (!content || !isRulesFile(rel, content)) continue;

    // Firestore / Storage: `allow read, write: if true;`
    const allowRe = /allow\s+([a-z,\s]+?)\s*:\s*if\s+true\b/gi;
    let m;
    while ((m = allowRe.exec(content))) {
      const ops = m[1].toLowerCase();
      const writes = /write|create|update|delete/.test(ops);
      out.push(finding({
        id: writes ? 'FIREBASE_RULES_PUBLIC_WRITE' : 'FIREBASE_RULES_PUBLIC_READ',
        severity: writes ? SEV.CRITICAL : SEV.HIGH,
        title: writes
          ? 'Firebase rule allows anyone to WRITE (allow …: if true)'
          : 'Firebase rule allows anyone to READ (allow read: if true)',
        file: rel,
        line: lineAt(content, m.index),
        detail: writes
          ? 'This security rule grants write access to everyone (`if true`). Anyone on the internet can add, overwrite, or delete data in this collection — no login required.'
          : 'This security rule grants read access to everyone (`if true`). Anyone on the internet can read every document in this collection.',
        fix: 'Replace `if true` with a real condition — e.g. `allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;`. Never ship `if true` for anything but genuinely public, read-only data. Test in the Firebase Rules Playground.',
      }));
    }

    // Realtime Database JSON rules: ".read": true / ".write": true
    const rtdbRe = /"\.(read|write)"\s*:\s*true\b/gi;
    while ((m = rtdbRe.exec(content))) {
      const isWrite = /write/i.test(m[0]);
      out.push(finding({
        id: isWrite ? 'FIREBASE_RTDB_PUBLIC_WRITE' : 'FIREBASE_RTDB_PUBLIC_READ',
        severity: isWrite ? SEV.CRITICAL : SEV.HIGH,
        title: `Realtime Database rule is public (".${isWrite ? 'write' : 'read'}": true)`,
        file: rel,
        line: lineAt(content, m.index),
        detail: `A Realtime Database rule sets ".${isWrite ? 'write' : 'read'}": true, exposing this path to anyone on the internet.`,
        fix: 'Scope the rule to authenticated owners, e.g. ".read": "auth != null && auth.uid === $uid". Only use true for public, read-only data.',
      }));
    }
  }
  return out;
}
