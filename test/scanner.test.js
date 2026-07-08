// Basic smoke tests. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan } from '../src/scanner.js';
import { score } from '../src/report.js';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'leaktrap-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

test('flags a Stripe live key in client code', () => {
  const dir = fixture({ 'src/a.js': 'const k = "sk_live_abcd1234efgh5678ijkl";' });
  const { findings } = scan(dir);
  assert.ok(findings.some((f) => f.id === 'SECRET_EXPOSED'), 'should flag exposed secret');
});

test('does NOT flag a publishable pk_live key', () => {
  const dir = fixture({ 'src/a.js': 'const k = "pk_live_abcd1234efgh5678ijkl";' });
  const { findings } = scan(dir);
  assert.ok(!findings.some((f) => f.id === 'SECRET_EXPOSED'), 'publishable key is safe');
});

test('flags a table without RLS enabled', () => {
  const dir = fixture({ 'supabase/migrations/1.sql': 'create table public.profiles (id uuid);' });
  const { findings } = scan(dir);
  assert.ok(findings.some((f) => f.id === 'RLS_NOT_ENABLED'));
});

test('does NOT flag a table WITH RLS enabled', () => {
  const dir = fixture({
    'supabase/migrations/1.sql':
      'create table public.profiles (id uuid);\nalter table public.profiles enable row level security;',
  });
  const { findings } = scan(dir);
  assert.ok(!findings.some((f) => f.id === 'RLS_NOT_ENABLED'));
});

test('clean project scores 100', () => {
  const dir = fixture({ 'src/a.js': 'export const hello = () => "hi";' });
  const { findings } = scan(dir);
  assert.strictEqual(score(findings), 100);
});

test('flags path traversal from req.query', () => {
  const dir = fixture({
    'pages/api/f.js': 'import fs from "fs";\nexport default (req,res)=>fs.readFileSync(req.query.path);',
  });
  const { findings } = scan(dir);
  assert.ok(findings.some((f) => f.id === 'PATH_TRAVERSAL'));
});
