# LeakTrap 🛡️

[![npm](https://img.shields.io/npm/v/leaktrap?color=3ddc97)](https://www.npmjs.com/package/leaktrap)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-2bb8ff)](https://nodejs.org)
![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

**Scan your AI-built app for the ways vibe-coded apps leak — exposed keys, broken row-level security, missing auth — in plain English.**

> In a scan of 101 public apps built with AI code tools, **68% had a security issue** and **24% exposed a critical secret** — including 1 in 5 shipping their Supabase `service_role` key (full database access) straight to the browser. LeakTrap catches these before your users (or attackers) do.

You built something great on Lovable, Bolt, v0, Replit, or Cursor. Before you send it to real users, run one command:

```bash
npx leaktrap
```

No install, no signup, no account. It scans your project and gives you a **production-readiness score** with plain-English fixes a non-security-person can actually follow.

---

## Why this exists

AI code builders are incredible — and they ship insecure defaults at scale. Independent testing in 2026 found **~91% of vibe-coded apps had at least one security vulnerability**, and real incidents have exposed live Stripe/OpenAI keys in browser code and entire user databases through a single missing Supabase RLS toggle (CVE-2025-48757 hit ~170 apps; one leak exposed ~1.5M API keys).

The tools that catch these (Snyk, Veracode) are built and priced for security engineers. LeakTrap is built for the person who just wants to know: **is my app safe to ship, and if not, exactly what do I fix?**

---

## What it checks

| # | Check | Why it matters |
|---|-------|----------------|
| 1 | **Exposed API keys in browser code** | A `sk_live_…` in your front-end = anyone can spend your money |
| 2 | **Supabase Row-Level Security gaps** | No RLS = your whole database is public via the anon key |
| 3 | **Unauthenticated endpoints** | A write route with no auth = anyone can call it directly |
| 4 | **Path traversal** | `../../.env` in a file path = attacker reads your secrets |
| 5 | **Committed secrets** | Keys in `.env` or source that got committed to git |
| 6 | **Open CORS** | `Origin: *` + credentials = other sites act as your users |

It's tuned for the **vibe-code failure modes specifically** — high signal, low noise. Public/publishable keys (`pk_live_`, `NEXT_PUBLIC_`, anon keys) are allowlisted so you don't get false alarms.

---

## Usage

```bash
npx leaktrap                 # scan the current folder
npx leaktrap ./my-app        # scan a specific path
npx leaktrap --json          # machine-readable output
npx leaktrap --fail-on high  # exit 1 for CI if any high+ issue (default: critical)
```

Add it to CI so a leak never ships again:

```yaml
# .github/workflows/leaktrap.yml
- run: npx leaktrap --fail-on high
```

---

## Example output

```
  🔴  Score: 0/100  —  Do not ship
  2 critical   6 high   0 medium   0 low

  1. [CRITICAL] Stripe live secret key found in browser-shipped code
     src/config.js:1
     Anyone who opens your site's source can copy it and run up charges.
     Fix: Move this to a server route, read it from an env var, and ROTATE
          the key immediately — assume it is already compromised.
```

---

## What LeakTrap is (and isn't)

- ✅ A fast, honest, first-line check for the most common AI-code leaks.
- ✅ Free and open source (MIT). Runs locally. Your code never leaves your machine.
- ❌ Not a full penetration test or a substitute for a security engineer on a high-stakes app.

Findings are **prioritized signals**, not proof. Fix the criticals, re-run, ship with more confidence.

---

## Want it automatic?

The free CLI catches issues when you remember to run it. **[leaktrap.dev](https://leaktrap.dev)** adds:
- 🔧 **One-click fix PRs** — not just "here's the problem," but the patch
- 🔁 **Monitoring on every push** — catch a new leak the moment it's introduced
- 📋 **Shareable reports** — for agencies handing off client apps

[Join the waitlist →](https://leaktrap.dev)

---

## Contributing

New check ideas and false-positive reports are very welcome — open an issue with a minimal example. The checks live in [`src/checks/`](src/checks/) and are deliberately simple to read.

MIT © LeakTrap
