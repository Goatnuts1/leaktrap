# Community seeding posts — LeakTrap

*The #1 rule: lead with the finding, not the product. You did real research (101 apps, 29% critical) — that's inherently interesting and shareable. The tool is the "oh, and I made this" at the end. Posts that pitch first get removed; posts that give value first get upvoted AND convert.*

*Sequence: GitHub + npm live → Show HN (the anchor) → then seed these over ~3–4 days, not all at once. Read each community's rules first; several require a "self-promo Saturday" or flair. Reply to every comment.*

---

## Priority order (where your buyers actually are)
1. **Hacker News** (Show HN — see `show-hn.md`) — the anchor launch
2. **Lovable Discord / community** — your exact users, actively hitting this wall
3. **Bolt.new / StackBlitz Discord**
4. **r/Supabase** — RLS is their #1 footgun; deeply relevant
5. **r/vibecoding** — literally the audience
6. **Indie Hackers**
7. **r/SaaS**, **r/webdev**, **r/nextjs** — broader, post last

---

## 1. r/Supabase  (STRONGEST fit — RLS is their pain)
**Title:** `I scanned 101 AI-built apps: 23% shipped their service_role key to the browser`

> I got curious how often vibe-coded apps leak, so I scanned 101 public repos built with AI tools (Lovable/Bolt fingerprints). The Supabase-specific findings were rough:
>
> - **23%** had the `service_role` key reachable in client code — full RLS bypass, read/write on the whole DB.
> - **35%** had at least one `USING (true)` policy (every row, every user).
> - **15%** created tables with RLS never enabled.
>
> The pattern is almost always the same: the generator wires up Supabase with the anon key correctly, then somewhere a dev pastes the service_role key into a `.ts` file to "make it work," and it ends up in the bundle.
>
> I turned the checks into a free CLI (`npx leaktrap`, MIT, runs locally) so people can catch it before shipping. Not trying to sell anything — genuinely curious if r/Supabase thinks the RLS checks match what you see in the wild, and what I'm missing. Repo: [link]

*(r/Supabase loves concrete RLS content. This is your best-converting post — lead here after HN.)*

---

## 2. Lovable Discord / community
*(Tone: peer helping peers, not a vendor. Post in #show-and-tell or #resources, NOT #general spam. Check if self-promo is allowed; if unsure, ask a mod.)*

> Hey all — I love what Lovable lets you ship, but I noticed a lot of apps go live with security gaps the generator doesn't warn about (keys in the client, Supabase RLS off, etc.). I scanned ~100 public Lovable-built repos and ~2 in 3 had at least one issue.
>
> So I made a free tool that checks your app for the 6 most common ones and explains each fix in plain English — no security background needed:
>
> `npx leaktrap`
>
> Runs locally, nothing leaves your machine, open source. Would genuinely love feedback from people building here — especially if it flags something wrong. 🙏 [link]

---

## 3. Bolt.new / StackBlitz Discord
> Built a free `npx` tool that scans Bolt-built apps for the stuff that leaks in production — exposed API keys, missing auth on endpoints, open CORS, Supabase RLS gaps. Scanned 100 public AI-built repos and 68% had at least one issue, so this is common, not a you-problem.
>
> `npx leaktrap` — local, open source, plain-English fixes. Feedback welcome, especially false positives. [link]

---

## 4. r/vibecoding
**Title:** `Vibe-coded 101 apps' worth of security holes so you don't have to — free scanner`

> Vibe coding is amazing but the generators ship insecure defaults. I scanned 101 public AI-built apps: **68% had a security issue, 29% exposed a critical secret** (like a database key in the browser).
>
> Made a free CLI that catches the 6 most common ones and tells you exactly what to fix, in plain English — because the whole point of vibe coding is you're not a security engineer:
>
> `npx leaktrap`
>
> Open source, runs locally. What checks would you want added? [link]

---

## 5. Indie Hackers
**Title:** `I scanned 101 AI-built apps for security holes — here's what I found (and the free tool)`

> Quick build-in-public share. I kept seeing "my Stripe key leaked" / "someone wiped my Supabase" threads from people shipping AI-built apps, so I measured it: scanned 101 public repos built with Lovable/Bolt fingerprints.
>
> - 68% had ≥1 security issue
> - 29% had a critical secret exposure
> - 23% shipped their Supabase service_role key (full DB access) to the browser
>
> I only counted 6 high-confidence checks, so it's a floor. Turned it into `npx leaktrap` (free, MIT). The plan is a paid tier later (auto-fix PRs + monitoring) but the CLI stays free.
>
> Sharing the method + numbers in case useful, and happy to answer anything about the build. [link]

---

## 6. r/SaaS  /  r/webdev  /  r/nextjs  (post last, broadest)
**Title:** `68% of the AI-built apps I scanned had a security issue — made a free scanner`

> Scanned 101 public repos built with AI code tools. 68% had at least one of: an API key in browser code, Supabase RLS off, an unauthenticated write endpoint, path traversal, a committed .env, or wildcard CORS. 29% had a critical secret exposure.
>
> Built a free, open-source CLI to catch these in your own app before shipping — plain-English fixes, runs locally:
>
> `npx leaktrap`
>
> Not a full audit — it checks the 6 things that actually bite AI-built apps. Feedback / false positives welcome. [link]

*(r/webdev and r/nextjs are stricter on self-promo — check rules, use the right day/flair, and consider leading purely with the findings and putting the tool link in a comment.)*

---

## 7. X / Twitter  (thread — no personal brand needed; the data carries it)
**Tweet 1:**
> I scanned 101 public apps built with AI code tools (Lovable, Bolt, v0).
>
> 68% had a security hole.
> 29% exposed a critical secret.
> 23% shipped their database god-mode key straight to the browser.
>
> Made a free tool so you can check yours in 10 seconds 🧵

**Tweet 2:**
> `npx leaktrap`
>
> It checks the 6 ways AI-built apps actually leak — exposed keys, Supabase RLS off, open endpoints, path traversal, committed .env, wildcard CORS — and explains each fix in plain English.
>
> Runs locally. Open source. [link]

**Tweet 3 (the visceral one):**
> The scariest pattern: the Supabase `service_role` key in client code.
>
> That key bypasses ALL row-level security. If it's in your bundle, anyone who opens devtools can read and delete your entire database.
>
> nearly 1 in 4 apps I scanned had this. Check yours: `npx leaktrap`

---

## Universal rules for all of these
- **One post per community, spaced out.** Blasting all at once on the same day looks coordinated and gets flagged.
- **Reply to every single comment** for the first few hours — engagement is the algorithm.
- **Never post anyone's actual leaked keys**, even censored. Aggregate stats only.
- **Expect "just use Semgrep/Snyk."** Answer: "Those are great and built for security engineers — I wanted the 6-things-that-matter answer in 10 seconds for people who don't know what a CSP is." Don't get defensive.
- **Lead with the finding; the tool is the P.S.** Always.
