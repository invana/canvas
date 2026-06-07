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

# Commit only if the bump actually changed anything. On a first release where
# the packages are already at $VERSION, there is nothing to commit — tag the
# current commit (which already carries $VERSION) instead.
if git diff --quiet; then
  echo "Packages already at $VERSION — tagging current commit."
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
