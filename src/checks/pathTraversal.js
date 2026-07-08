// Check 4: path traversal — user input flowing into filesystem paths.
import { read, lineAt, finding, SEV, relPath } from '../util.js';

// File-system sinks that take a path argument.
const FS_SINK = /\b(?:fs|fsPromises|fs\/promises)?\.?(readFile|readFileSync|createReadStream|sendFile|writeFile|writeFileSync|unlink|unlinkSync|readdir|readdirSync)\s*\(/g;

// Sources of untrusted input.
const TAINT = /(req\.(query|params|body)|request\.(query|params|body)|searchParams|params\.[a-z]|ctx\.params|url\.searchParams|formData)/i;

export function checkPathTraversal(root, files) {
  const out = [];
  for (const file of files) {
    const rel = relPath(root, file);
    const content = read(file);
    if (!content) continue;

    let m;
    FS_SINK.lastIndex = 0;
    while ((m = FS_SINK.exec(content))) {
      // Look at the argument window of this sink call.
      const start = m.index;
      const window = content.slice(start, start + 240);
      const argEnd = window.indexOf(')');
      const args = argEnd === -1 ? window : window.slice(0, argEnd);

      const usesTaint = TAINT.test(args) || /path\.join\([^)]*(req\.|params|query|searchParams)/i.test(window);
      const sanitized = /path\.basename|sanitize|allowlist|whitelist|\.\.\s*replace|normalize\([^)]*\)\s*\.startsWith/i.test(window);

      if (usesTaint && !sanitized) {
        out.push(finding({
          id: 'PATH_TRAVERSAL',
          severity: SEV.HIGH,
          title: 'User input used to build a file path (possible path traversal)',
          file: rel,
          line: lineAt(content, start),
          detail: 'A filesystem call uses values from the request (query/params/body) without sanitizing them. An attacker can pass "../../.env" or similar to read files outside the intended folder — including your secrets.',
          fix: 'Never pass raw user input to fs paths. Use path.basename() to strip directories, resolve against a fixed base dir, and verify the resolved path startsWith that base before reading. Prefer an allowlist of permitted filenames.',
        }));
      }
    }
  }
  return out;
}
