# npm publish checklist — LeakTrap

*Goal: `npx leaktrap` works for anyone, from a clean machine, first try. That command IS the product's front door — test it like a customer.*

---

## 0. Reserve the name FIRST (before Show HN)
```bash
npm view leaktrap        # if this 404s, the name is free — grab it now
```
If `leaktrap` is taken, options: `leaktrap-cli`, `@yourname/leaktrap`, `leaktrapscan`. Pick one and make it consistent with the repo + domain.

## 1. One-time account setup
```bash
npm login                # or: npm adduser
npm whoami               # confirm you're logged in
```
Enable 2FA on your npm account (Settings → 2FA → auth-and-writes). Publishing a security tool with a hijackable account is a bad look.

## 2. Pre-flight the package
```bash
cd ~/projects/forge/leaktrap

# What will actually ship? Should be bin/, src/, README, LICENSE, package.json.
# Must NOT include corpus/, node_modules/, test/, launch/.
npm pack --dry-run
```
Check the file list. The `files` field in package.json already scopes it to `bin`, `src`, `README.md` — confirm `corpus/` and secrets are NOT in the output.

## 3. Verify it runs from a clean install (the real test)
```bash
# Simulate what a user gets:
npm pack                                   # creates leaktrap-0.1.0.tgz
cd /tmp && mkdir clean-test && cd clean-test
npm init -y >/dev/null
npm install ~/projects/forge/leaktrap/leaktrap-0.1.0.tgz
npx leaktrap --help
npx leaktrap .                             # scan the empty test dir → should score 100
```
If `npx leaktrap` errors on a clean machine (missing shebang, ESM issue, path bug), fix before publishing. Common gotchas:
- `bin/cli.js` needs the `#!/usr/bin/env node` shebang (it has it) and executable bit.
- `"type": "module"` is set, so all imports must be ESM (they are).
- Node `>=18` engine (set).

## 4. Publish
```bash
cd ~/projects/forge/leaktrap
npm publish --access public
```
For a scoped name (`@you/leaktrap`) the `--access public` is required. Unscoped, it's public by default.

## 5. Immediately verify the live package
```bash
cd /tmp && npx leaktrap@latest --help     # pulls from the real registry
npm view leaktrap                          # confirm version, description, links
```
Open `https://www.npmjs.com/package/leaktrap` — the README renders here too, so it's a second landing page. Make sure the description + repo link are right.

## 6. Version bumps (later)
```bash
npm version patch        # 0.1.0 → 0.1.1 (bugfix)  — also creates a git tag
git push --tags
npm publish
```

---

## Pre-publish gotcha checklist
- [ ] `npm view leaktrap` name is free (or you picked an alternative everywhere)
- [ ] `npm pack --dry-run` output contains NO corpus/, no .env, no secrets
- [ ] `npx leaktrap` works from a clean `/tmp` install
- [ ] `--help`, `--json`, `--fail-on` all work
- [ ] README renders correctly on npmjs.com preview
- [ ] repository/homepage/bugs URLs added to package.json (see below)
- [ ] 2FA on the npm account

## Add these fields to package.json before publishing
```json
"repository": { "type": "git", "url": "https://github.com/YOURNAME/leaktrap.git" },
"homepage": "https://leaktrap.dev",
"bugs": "https://github.com/YOURNAME/leaktrap/issues",
"author": "YOUR NAME"
```
