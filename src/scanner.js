// Orchestrates all checks and returns findings + metadata.
import { walk } from './util.js';
import { checkSecrets } from './checks/secrets.js';
import { checkRLS } from './checks/rls.js';
import { checkAuth } from './checks/auth.js';
import { checkPathTraversal } from './checks/pathTraversal.js';
import { checkCORS } from './checks/cors.js';

export function scan(root) {
  const files = walk(root);
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
