import { config } from "@repo/eslint-config/base";

/**
 * This package **owns** the state boundary, so the repo-wide ban on importing a
 * state library (see `base.js`) is lifted here — but only for the files that are
 * the boundary itself, not the whole package:
 *
 *   - `src/adapters/zustand/**` — the one sanctioned zustand importer. Everything
 *     else in the kernel programs against the `ReactiveStore` port, exactly like
 *     every consumer does.
 *   - `src/port|history|telemetry/**` — immer's legitimate callers: the machinery
 *     that turns mutations into the patches the port exposes.
 *
 * The drawing-library ban still applies in full: this package renders nothing.
 * `scripts/check-renderer-boundary.mjs` allows the same paths for the same reason
 * — change one, change the other.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...config,
  {
    files: [
      "src/adapters/zustand/**",
      "src/port/**",
      "src/history/**",
      "src/telemetry/**",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
