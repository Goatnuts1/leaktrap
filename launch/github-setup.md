# GitHub repo setup — LeakTrap

*Copy-paste values for when you create the public repo. A polished repo page is the conversion surface for every Show HN / PH / Reddit click — spend 15 min here.*

---

## Repo name
`leaktrap`  (or `leaktrap-cli` if the org name `leaktrap` is taken)

## Description (the "About" one-liner — 120 char max)
```
Scan your AI-built app for exposed keys, broken RLS & missing auth — in plain English. npx leaktrap
```

## Website
`https://leaktrap.dev`

## Topics (add all — they drive GitHub discovery)
```
security  vibe-coding  lovable  bolt  supabase  rls  api-security
static-analysis  cli  devsecurity  ai-generated-code  secrets-detection
nextjs  appsec  security-scanner
```

## About settings
- ✅ Releases
- ✅ Packages (links the npm package)
- ⬜ Wiki (off — keep it lean)
- Include in the repo: `Issues` ON (people report false positives = free signal).

---

## Social preview image (Settings → Social preview)
Make a 1280×640 PNG. Simplest high-impact version: a dark terminal screenshot of the `🔴 Score: 0/100 — Do not ship` scan output on a vulnerable app, with the tagline underneath:
> **LeakTrap** — is your AI-built app safe to ship? `npx leaktrap`

This image is what renders when the repo is shared on X/Slack/Discord — it's worth getting right.

---

## Pinned issue (create right after publishing)
Title: **Roadmap & "what should we check next?"**
Body: list the current 6 checks, then the candidates (Firebase rules, SSRF in `fetch()`, exposed `.git` folder, JWT-in-localStorage, deeper Supabase RLS). Ask people to 👍 the ones they want. Turns your backlog into engagement.

---

## First release (v0.1.0)
Tag `v0.1.0`, title **"LeakTrap v0.1.0 — the first-line security check for AI-built apps"**, notes:
```
First public release.

Checks 6 of the most common ways vibe-coded apps leak:
- Exposed API keys in browser code
- Supabase Row-Level Security gaps (off, or USING (true))
- Unauthenticated write endpoints
- Path traversal
- Committed secrets
- Open / wildcard CORS

Run it on your app:  npx leaktrap

Free, open source (MIT), runs locally — your code never leaves your machine.
Auto-fix PRs + push monitoring coming: https://leaktrap.dev
```

---

## README badges (top of README, once published)
```markdown
![npm](https://img.shields.io/npm/v/leaktrap)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%3E%3D18-blue)
```

---

## Create-and-push commands
```bash
cd ~/projects/forge/leaktrap
# make sure corpus/ and node_modules/ are gitignored (they are)
gh repo create leaktrap --public --source=. --description "Scan your AI-built app for exposed keys, broken RLS & missing auth — in plain English. npx leaktrap" --push
# then add topics:
gh repo edit --add-topic security,vibe-coding,lovable,bolt,supabase,rls,cli,static-analysis,secrets-detection,appsec
```
*(Note: this repo currently lives inside the `forge` monorepo. To publish just LeakTrap, either `git subtree split` it out or copy `leaktrap/` into its own fresh repo/folder first so it has its own git history and the README is at the root.)*
