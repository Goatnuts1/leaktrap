# LeakTrap — master launch runbook

*Everything in `launch/` in the order to execute it. Each step links a detailed file. Nothing here needs new code — the product is built and tested.*

---

## Phase 0 — Refresh the number (30 min)
- [ ] `bash scripts/fetch-corpus.sh 60` then `node scripts/corpus-stats.js ./corpus`
- [ ] Update the stat in `show-hn.md`, `product-hunt.md`, `seeding-posts.md`, `README.md` if it moved. (Current: 68% any / 24% critical, n=101.)

## Phase 1 — Reserve names (do FIRST, before any public post)
- [ ] `npm view leaktrap` — grab the name (or pick an alt). → `npm-publish.md`
- [ ] Register **leaktrap.dev** (Cloudflare/Porkbun — you've done this flow).
- [ ] `gh repo create leaktrap --public` — but don't share the URL yet. → `github-setup.md`

## Phase 2 — Polish the surfaces (2–3 hrs)
- [ ] Split `leaktrap/` into its own repo root (subtree or copy) so README is at root.
- [ ] Add `repository`/`homepage`/`bugs`/`author` to package.json. → `npm-publish.md`
- [ ] Repo: description, 15 topics, social-preview image, pinned roadmap issue. → `github-setup.md`
- [ ] Deploy `landing.html` to leaktrap.dev; wire the waitlist form to a real service (Loops/Formspree/ConvertKit). → `landing.html`
- [ ] Record the terminal-scan GIF + hero screenshot. → `product-hunt.md`

## Phase 3 — Ship the package (1 hr)
- [ ] `npm pack --dry-run` — confirm no corpus/secrets ship.
- [ ] Clean-install test from `/tmp`: `npx leaktrap` works first try.
- [ ] `npm publish --access public`, then verify `npx leaktrap@latest`. → `npm-publish.md`
- [ ] Cut GitHub release v0.1.0. → `github-setup.md`

## Phase 4 — Launch (the anchor)
- [ ] **Show HN**, Tue–Thu ~8–9am ET. Reply to every comment for 4 hrs. → `show-hn.md`
- [ ] Same morning: notify waitlist + drop in the builder Discords.

## Phase 5 — Seed (over the next 3–4 days, spaced out)
Order: r/Supabase → Lovable Discord → Bolt Discord → r/vibecoding → Indie Hackers → r/SaaS/webdev/nextjs → X thread. → `seeding-posts.md`
- [ ] One community per post, not all at once. Lead with the finding.

## Phase 6 — Product Hunt (a few days after HN, once you have stars/testimonials)
- [ ] Launch with the gallery assets + maker comment. → `product-hunt.md`

---

## The kill-criteria (decide, don't drift)
- **Week 2 checkpoint:** ≥150 waitlist signups **OR** ≥300 GitHub stars → **GO**, build the paid Fix/Monitor tier.
- **Miss both** → the demand isn't there; **pivot to the runner-up (Florida STR alerts)**, which is pre-scoped in `../reports/INCOME_LEDGER.md`. Don't sink months into a flat launch.
- **Week 4:** ≥5 paying customers (any tier) → validated; keep building.

## After validation — the second surface
Once Ship-Safe has traction, the MCP-server security scanner reuses the same static-analysis core (21k+ exposed servers, acqui-hire-adjacent). List it on PulseMCP/Glama/Smithery + r/mcp. → see `../reports/DECISION_and_distribution_map.md`.

---

## What's done vs. what's yours
**Done (in this repo):** working scanner, 6 checks, tests, README, landing page, Show HN + PH + seeding drafts with real numbers, corpus tooling, this runbook.
**Yours (accounts/money/identity):** npm name, domain, GitHub publish, form wiring, hitting "post," replying to comments.
