# Show HN post — DRAFT (real numbers baked in 2026-07-08)

*Measured on 101 public repos carrying the Lovable generated-app fingerprint
(`vite_react_shadcn_ts` / `lovable-tagger`), tooling & clones filtered out.
Re-run `fetch-corpus.sh` + `corpus-stats.js` right before posting to refresh.*

---

**Title options (A/B — both true):**
- `Show HN: 24% of AI-built apps I scanned expose a secret key in the browser`
- `Show HN: 1 in 5 Lovable apps ships its database god-mode key to the browser`
- `Show HN: LeakTrap – a free scanner for the ways AI-built apps leak`

---

**Body:**

I kept seeing the same story: someone ships an app they built on Lovable/Bolt/Replit in a weekend, and a week later there's a thread about their Stripe key being in the browser bundle or their whole Supabase table being world-readable.

So I scanned **101 public repos** built with these tools (I used the fingerprint files the generators leave behind, and filtered out tooling/clones so it's real apps). The result:

- **68%** had at least one security issue.
- **24%** had a *critical* one — a secret key or the Supabase `service_role` key sitting in browser-reachable code.
- **21%** shipped the Supabase `service_role` key specifically — that key bypasses all row-level security, so it's full read/write on the entire database, for anyone who opens devtools.
- 35% had a `USING (true)` RLS policy (everyone can read/write every row); 19% had a hardcoded secret; 37% had wildcard CORS.

To be clear about method: I only counted **six specific, high-confidence checks** — so 68% is a floor, not the ceiling. (Independent testing has put the any-vulnerability rate around 91%.)

LeakTrap is a zero-dependency CLI that checks for exactly those six failure modes and explains each in plain English, because the person shipping these apps usually isn't a security engineer:

    npx leaktrap

It runs locally, your code never leaves your machine, and it's MIT-licensed. Publishable/anon keys are allowlisted so it doesn't cry wolf.

It's deliberately NOT a full SAST tool — Snyk/Semgrep exist and are great, but they're built and priced for security teams, and they bury the 6 things that actually bite vibe-coders under 200 that don't. I wanted the "is this safe to ship, and what exactly do I fix" answer in 10 seconds.

Repo: [github link]. Would love feedback on false positives and on which checks to add next (I'm weighing: exposed Firebase rules, SSRF in fetch(), and a Supabase-specific RLS deep check).

*(Honesty note for the thread: heuristic/regex-based, so it's precision-over-recall by design — it will miss things a real audit catches. Roadmap includes a hosted version with auto-fix PRs + monitoring, but the CLI is and will stay free and open source.)*

---

**Timing:** Post Tue–Thu, ~8–9am ET. Reply to every comment for the first 4 hours. Expect (and welcome) "just use Semgrep" — answer with the plain-English/6-checks-that-matter positioning, not defensiveness.
