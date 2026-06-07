#!/usr/bin/env bash
#
# release.sh — lockstep release for the @invana/canvas monorepo.
#
# Sets EVERY publishable package to one shared version and creates a matching
# `v<version>` git tag. Pushing that tag triggers .github/workflows/publish.yml,
# which builds and publishes the packages to npm.
#
# Lockstep (one version for all packages) is deliberate: packages depend on each
# other via `workspace:*`, which pnpm rewrites to the concrete version at publish
# time. Shipping every package at the same version keeps those cross-refs valid.
#
# Usage:
#   ./release.sh 0.1.0        # explicit version
#   ./release.sh patch        # bump current patch  (0.0.1 -> 0.0.2)
#   ./release.sh minor        # bump current minor  (0.0.1 -> 0.1.0)
#   ./release.sh major        # bump current major  (0.0.1 -> 1.0.0)
#
# This script does NOT push. It prints the exact push command so you control the
# moment a publish is triggered.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

die() { echo "error: $*" >&2; exit 1; }

[ $# -eq 1 ] || die "usage: ./release.sh <version|major|minor|patch>"
ARG="$1"

# --- preflight ---------------------------------------------------------------
command -v node >/dev/null || die "node not found"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not a git repo"
[ -z "$(git status --porcelain)" ] || die "working tree is dirty — commit or stash first"

# Canonical current version = whatever @invana/canvas is at (lockstep => all equal).
CURRENT="$(node -p "require('./packages/canvas/package.json').version")"

# --- resolve target version --------------------------------------------------
if [[ "$ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.]+)?$ ]]; then
  VERSION="$ARG"
else
  case "$ARG" in
    major|minor|patch)
      VERSION="$(node -e '
        const [maj,min,pat] = process.argv[1].split(".").map(Number);
        const t = process.argv[2];
        const out = t==="major" ? [maj+1,0,0] : t==="minor" ? [maj,min+1,0] : [maj,min,pat+1];
        console.log(out.join("."));
      ' "$CURRENT" "$ARG")"
      ;;
    *) die "invalid version/bump: '$ARG' (expected semver or major|minor|patch)" ;;
  esac
fi

TAG="v$VERSION"
git rev-parse "$TAG" >/dev/null 2>&1 && die "tag $TAG already exists"

echo "Releasing $CURRENT -> $VERSION  (tag $TAG)"

# --- bump every publishable (non-private) package ----------------------------
CHANGED="$(node -e '
  const { readFileSync, writeFileSync, readdirSync } = require("fs");
  const version = process.argv[1];
  const dirs = readdirSync("packages", { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => `packages/${d.name}/package.json`);
  const changed = [];
  for (const path of dirs) {
    let j;
    try { j = JSON.parse(readFileSync(path, "utf8")); } catch { continue; }
    if (j.private) continue;            // skip @repo/* internal configs
    j.version = version;
    writeFileSync(path, JSON.stringify(j, null, 2) + "\n");
    changed.push(j.name);
  }
  console.error(changed.length + " packages bumped:");
  for (const n of changed) console.error("  " + n);
  console.log(changed.join(" "));
' "$VERSION")"

[ -n "$CHANGED" ] || die "no publishable packages found"

# --- commit + tag ------------------------------------------------------------
git add packages/*/package.json
git commit -m "chore(release): $TAG"
git tag -a "$TAG" -m "$TAG"

echo
echo "✓ committed and tagged $TAG"
echo
echo "Next — push to trigger the npm publish workflow:"
echo "    git push origin HEAD && git push origin $TAG"
