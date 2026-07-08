// Shared utilities: file walking, styling, finding model. Zero dependencies.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

// Directories we never scan (noise / not shipped source we control).
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage',
  '.turbo', '.vercel', '.netlify', 'vendor', '.cache', 'tmp', '.pnpm-store',
]);

// Extensions worth reading as source/text.
const TEXT_EXT = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte',
  '.json', '.env', '.sql', '.html', '.astro', '.py', '.rb', '.go',
  '.yml', '.yaml', '.toml', '.sh',
]);

const MAX_FILE_BYTES = 1_500_000; // skip huge bundles/minified blobs

/** Recursively collect readable source files under root. */
export function walk(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) stack.push(full);
      } else if (e.isFile()) {
        const ext = extname(e.name).toLowerCase();
        // Always include dotfiles like .env even without a mapped ext.
        if (TEXT_EXT.has(ext) || e.name.startsWith('.env')) {
          try {
            if (statSync(full).size <= MAX_FILE_BYTES) files.push(full);
          } catch { /* ignore */ }
        }
      }
    }
  }
  return files;
}

/** Read a file as UTF-8, returning '' on failure. */
export function read(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

/** 1-indexed line number for a character offset. */
export function lineAt(content, index) {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
}

/** Heuristic: is this file shipped to / runnable in the browser? */
export function isClientFile(relPath) {
  const p = relPath.replace(/\\/g, '/');
  if (/(^|\/)(src|app|components|pages|public|client|assets)\//.test(p)) {
    // ...but API routes and server files are NOT client, even under app/ or pages/.
    if (/(^|\/)(pages|app)\/api\//.test(p)) return false;
    if (/\.server\.[jt]sx?$/.test(p)) return false;
    return /\.(jsx?|tsx?|vue|svelte|astro|html)$/.test(p);
  }
  return /\.(jsx?|tsx?|vue|svelte|astro|html)$/.test(p) && !/\bserver\b/.test(p);
}

/** Heuristic: is this an API/route/server handler file? */
export function isApiFile(relPath) {
  const p = relPath.replace(/\\/g, '/');
  return (
    /(^|\/)(pages|app)\/api\//.test(p) ||
    /(^|\/)(routes|controllers|handlers|api|server|functions)\//.test(p) ||
    /\.(route|api|handler|server)\.[jt]sx?$/.test(p) ||
    /(^|\/)(supabase\/functions)\//.test(p)
  );
}

export const SEV = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };
export const SEV_WEIGHT = { critical: 40, high: 20, medium: 8, low: 3 };

export function finding({ id, severity, title, file, line, detail, fix }) {
  return { id, severity, title, file, line: line ?? null, detail, fix };
}

// ---- terminal styling (no deps) ----
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
export const c = {
  red: wrap('31'), green: wrap('32'), yellow: wrap('33'),
  blue: wrap('34'), magenta: wrap('35'), cyan: wrap('36'),
  gray: wrap('90'), bold: wrap('1'), dim: wrap('2'),
};

export function relPath(root, file) {
  return relative(root, file) || file;
}
