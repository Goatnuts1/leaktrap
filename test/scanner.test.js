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

test('does NOT flag fake secrets in test fixture files', () => {
  const dir = fixture({ 'test/a.test.js': 'const k = "sk_live_abcd1234efgh5678ijkl";' });
  const { findings } = scan(dir);
  assert.ok(!findings.some((f) => f.id === 'SECRET_EXPOSED'), 'test fixtures are skipped');
});

test('.leaktrapignore suppresses matched paths', () => {
  const dir = fixture({
    'src/leak.js': 'const k = "sk_live_abcd1234efgh5678ijkl";',
    '.leaktrapignore': 'src/leak.js\n',
  });
  const { findings } = scan(dir);
  assert.ok(!findings.some((f) => f.id === 'SECRET_EXPOSED'), 'ignored path is skipped');
});

test('flags a real service_role key in client code', () => {
  const dir = fixture({
    'src/admin.js': 'export const a = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);',
  });
  const { findings } = scan(dir);
  assert.ok(findings.some((f) => f.id === 'RLS_SERVICE_ROLE_CLIENT'));
});

test('does NOT flag prose that merely mentions Supabase', () => {
  const dir = fixture({ 'README.md': 'We use Supabase for auth. Check your Supabase RLS!' });
  const { findings } = scan(dir);
  assert.ok(!findings.some((f) => f.id === 'RLS_UNVERIFIABLE'), 'word "supabase" alone should not trigger');
});

test('flags a public Firebase write rule (allow …: if true)', () => {
  const dir = fixture({
    'firestore.rules': "rules_version = '2';\nmatch /{d=**} { allow read, write: if true; }",
  });
  const { findings } = scan(dir);
  assert.ok(findings.some((f) => f.id === 'FIREBASE_RULES_PUBLIC_WRITE'));
});

test('does NOT flag the public Firebase web apiKey', () => {
  const dir = fixture({
    'src/firebase.js': 'const firebaseConfig = { apiKey: "AIzaSyABCDEF1234567890abcdefGHIJKLMNOPq", authDomain: "x.firebaseapp.com" };',
  });
  const { findings } = scan(dir);
  assert.ok(!findings.some((f) => f.id === 'SECRET_EXPOSED'), 'Firebase apiKey is public by design');
});

test('flags a DB connection string with a password', () => {
  const dir = fixture({ 'src/db.js': 'const url = "postgres://admin:hunter2@db.example.com:5432/prod";' });
  const { findings } = scan(dir);
  assert.ok(findings.some((f) => f.id === 'SECRET_EXPOSED'));
});

test('flags an auth token stored in localStorage', () => {
  const dir = fixture({ 'src/auth.js': 'localStorage.setItem("access_token", t);' });
  const { findings } = scan(dir);
  assert.ok(findings.some((f) => f.id === 'TOKEN_IN_LOCALSTORAGE'));
});

test('catches a raw service_role JWT by decoding it', () => {
  // payload {"role":"service_role"}
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.abcdefghijklmnop';
  const dir = fixture({ 'src/db.js': `const admin = createClient(url, "${jwt}");` });
  const { findings } = scan(dir);
  assert.ok(findings.some((f) => f.id === 'RLS_SERVICE_ROLE_CLIENT'), 'decoded service_role → flagged');
});

test('does NOT flag the public anon JWT (role: anon)', () => {
  // payload {"role":"anon"}
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.abcdefghijklmnop';
  const dir = fixture({ 'src/db.js': `const supabase = createClient(url, "${jwt}");` });
  const { findings } = scan(dir);
  assert.ok(!findings.some((f) => f.id === 'RLS_SERVICE_ROLE_CLIENT'), 'anon key is public — not flagged');
});
