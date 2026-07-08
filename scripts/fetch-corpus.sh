#!/usr/bin/env bash
# Fetch a corpus of public "vibe-coded" app repos to scan for the launch stat.
# These tools leave fingerprints in public repos; we search for them, then
# shallow-clone the matches into ./corpus/.
#
# Requires: gh (GitHub CLI, authenticated: `gh auth login`) and jq.
#
# Usage:
#   bash scripts/fetch-corpus.sh [max_per_query]
#   node scripts/corpus-stats.js ./corpus
#
# RESPONSIBLE USE: you're scanning PUBLIC code (legal), but you WILL find real
# leaked secrets. Use them ONLY for aggregate/anonymized stats. Never publish
# anyone's keys. If you find a live secret, the kind thing is a heads-up to the
# author (a quiet issue/DM), not a public callout.

set -euo pipefail
MAX="${1:-40}"
mkdir -p corpus

# HIGH-SIGNAL code-search fingerprints = the actual files these tools GENERATE
# into real apps (not tooling that merely mentions them). Rate-limited ~10/min,
# so we page through several and sleep between calls.
CODE_QUERIES=(
  'vite_react_shadcn_ts'                    # Lovable default package.json name
  'filename:package.json vite_react_shadcn_ts'
  '"lovable-tagger"'                        # Lovable dev dependency it injects
  '"Generated with Lovable"'                # Lovable README boilerplate
  '"This project is built with" Lovable'
)

echo "Searching GitHub for GENERATED vibe-coded apps (max $MAX per query)..."
> /tmp/leaktrap_repos_raw.txt

for q in "${CODE_QUERIES[@]}"; do
  echo "  → code: $q"
  gh search code "$q" --limit "$MAX" --json repository \
    2>/dev/null | jq -r '.[].repository.nameWithOwner' >> /tmp/leaktrap_repos_raw.txt || true
  sleep 7   # respect the ~10/min code-search rate limit
done

# Filter OUT tooling / clones / templates / awesome-lists that dilute the signal
# (we want real generated apps, not projects that build or clone Lovable/Bolt).
grep -viE '(clone|template|starter|boilerplate|awesome|-tagger|gpt-engineer|open-lovable|/(lovable|bolt|v0)$|example|demo-repo|tutorial|course)' \
  /tmp/leaktrap_repos_raw.txt > /tmp/leaktrap_repos.txt || cp /tmp/leaktrap_repos_raw.txt /tmp/leaktrap_repos.txt

# Dedupe.
sort -u /tmp/leaktrap_repos.txt > /tmp/leaktrap_repos_uniq.txt
COUNT=$(wc -l < /tmp/leaktrap_repos_uniq.txt | tr -d ' ')
echo "Found $COUNT unique repos. Shallow-cloning into ./corpus/ ..."

CLONED=0
while IFS= read -r repo; do
  [ -z "$repo" ] && continue
  dir="corpus/$(echo "$repo" | tr '/' '__')"
  if [ -d "$dir" ]; then continue; fi
  if git clone --depth 1 --quiet "https://github.com/$repo.git" "$dir" 2>/dev/null; then
    CLONED=$((CLONED+1))
    printf '.'
  fi
done < /tmp/leaktrap_repos_uniq.txt

echo ""
echo "Cloned $CLONED repos into ./corpus/"
echo "Now run:  node scripts/corpus-stats.js ./corpus"
