#!/usr/bin/env bash
#
# release.sh — cut a lockstep release of all @invana/* packages.
#
# All publishable packages share ONE version. This script bumps every
# publishable package.json under packages/* to the given version, commits,
# and tags the commit. Pushing the tag triggers the "Publish to npm" GitHub
# Action (.github/workflows/publish.yml), which builds and publishes to npm.
#
# Because the version is written into package.json *before* the tag is
# created on that same commit, the git tag and the published version always
# match — no drift. Cross-package workspace:* deps are left as-is; pnpm
# rewrites them to the concrete version at publish time.
#
# Usage:
#   ./release.sh 0.0.1
#   ./release.sh 0.2.0
#
set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh <version>   e.g. ./release.sh 0.0.1"
  exit 1
fi

# Releases are cut from main with a clean working tree.
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "main" ]; then
  echo "Error: releases must be cut from 'main' (you are on '$BRANCH')."
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree is not clean. Commit or stash your changes first."
  exit 1
fi

if git rev-parse "v$VERSION" >/dev/null 2>&1; then
  echo "Error: tag v$VERSION already exists."
  exit 1
fi

echo "Bumping all publishable packages to $VERSION ..."
# Bump only the version field of each publishable package. The private
# @repo/* internal configs are excluded — they never publish, so bumping
# them would just be noise in the release commit. --allow-same-version makes
# the very first release (packages already at the target version) a no-op
# instead of an error.
pnpm -r --filter "./packages/*" --filter "!@repo/*" \
  exec npm version "$VERSION" --no-git-tag-version --allow-same-version

# Regenerate CHANGELOG.md from the conventional-commit history. --tag labels the
# not-yet-tagged commits as v$VERSION, so this release's section lands under the
# right heading even though the tag is created below. git-cliff config lives in
# cliff.toml. The result is committed alongside the version bump, so the tag
# created next points at a commit that already contains its own changelog.
echo "Generating CHANGELOG.md ..."
pnpm exec git-cliff --tag "v$VERSION" -o CHANGELOG.md
# Stage explicitly: on the first release CHANGELOG.md is untracked, so `git
# commit -a` alone would miss it.
git add CHANGELOG.md

# Commit if anything is staged or modified (the version bump and/or changelog).
# On a re-run where nothing changed, tag the current commit instead.
if git diff --quiet && git diff --cached --quiet; then
  echo "Nothing to commit — tagging current commit."
else
  git commit -am "release: v$VERSION"
fi

# Annotated tag so `git push --follow-tags` will push it (lightweight tags are skipped).
git tag -a "v$VERSION" -m "v$VERSION"

echo
echo "Created tag v$VERSION."
echo "Push to publish:"
echo
echo "    git push origin main --follow-tags"
echo
echo "The tag push triggers the 'Publish to npm' workflow."
