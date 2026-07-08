// Orchestrates all checks and returns findings + metadata.
import { walk, isTestFixture, loadIgnore, relPath } from './util.js';
import { checkSecrets } from './checks/secrets.js';
import { checkRLS } from './checks/rls.js';
import { checkAuth } from './checks/auth.js';
import { checkPathTraversal } from './checks/pathTraversal.js';
import { checkCORS } from './checks/cors.js';

export function scan(root) {
  const all = walk(root);
  const ignored = loadIgnore(root);
  // Test/fixture/example files routinely contain intentionally-fake secrets and
  // toy-vulnerable snippets; scanning them just cries wolf. Skip those + anything
  // the user listed in .leaktrapignore.
  const files = all.filter((f) => {
    const rel = relPath(root, f);
    return !isTestFixture(rel) && !ignored(rel);
  });
  const findings = [
    ...checkSecrets(root, files),
    ...checkRLS(root, files),
    ...checkAuth(root, files),
    ...checkPathTraversal(root, files),
    ...checkCORS(root, files),
  ];
  // Stable sort: most severe first.
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return { files: files.length, findings };
}
