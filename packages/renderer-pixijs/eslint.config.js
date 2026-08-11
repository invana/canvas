import { config } from "@repo/eslint-config/base";

/**
 * This package **is** the drawing backend, so the repo-wide ban on importing a
 * drawing library (see `base.js`) is lifted here and only here. The hard gate,
 * `scripts/check-renderer-boundary.mjs`, allows this directory for the same
 * reason.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...config,
  {
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
