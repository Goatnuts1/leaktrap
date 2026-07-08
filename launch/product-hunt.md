# Product Hunt launch — DRAFT

**Name:** LeakTrap

**Tagline (60 char max):**
`Scan your AI-built app for leaks before you ship — in plain English`

**Alt taglines:**
- `The security check for vibe-coded apps`
- `npx leaktrap — is your Lovable/Bolt app safe to ship?`

**Topics:** Developer Tools, Security, Artificial Intelligence, No-Code, SaaS

---

**Description (first comment from maker):**

Hey PH 👋

If you've shipped an app built on Lovable, Bolt, v0, Replit, or Cursor, this is for you.

AI code builders are magic — but they ship insecure defaults. ~91% of vibe-coded apps tested in 2026 had at least one vulnerability, and there've been real incidents: live Stripe keys in browser bundles, entire Supabase databases left world-readable by one missing RLS toggle.

The tools that catch this (Snyk, Veracode) are built for security engineers. **LeakTrap is built for founders.** One command:

    npx leaktrap

It checks the 6 leaks that actually bite AI-built apps — exposed keys, Supabase RLS gaps, unauthenticated endpoints, path traversal, committed secrets, open CORS — and gives you a production-readiness score with fixes in plain English. Runs locally, code never leaves your machine, free + open source (MIT).

**What's live today:** the free CLI.
**Coming (waitlist on the site):** one-click fix PRs + monitoring on every push, so a leak never sneaks back in.

I'd love your feedback — especially false positives and which checks to add next. AMA 🙏

---

**Gallery assets to make (before launch):**
1. Hero: the terminal output (the red "0/100 — Do not ship" scan is visceral — screenshot it).
2. GIF: `npx leaktrap` running start-to-finish in ~8 seconds.
3. The 6-checks table.
4. A before/after "fix" for one finding.

**Launch-day:** notify the waitlist + the communities you seeded (Discords, subreddits) the morning of. First comment = maker story above. Reply to everything.
