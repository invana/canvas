import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    // ─── The renderer boundary ────────────────────────────────────────────
    // A drawing library belongs to a backend package (`@invana/renderer-pixijs`,
    // and a future `@invana/renderer-threejs`); nothing else may import one.
    // That is the invariant the P6 split bought — see
    // `docs/renderer-split-design.md` §1.
    //
    // NOTE: `eslint-plugin-only-warn` above downgrades every rule to a warning,
    // so this surfaces the violation in your editor but cannot fail a build.
    // The hard gate is `pnpm check-boundaries`
    // (`scripts/check-renderer-boundary.mjs`), which runs as part of the root
    // `pnpm lint`. Change one, change the other.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "pixi.js",
              message:
                "Drawing libraries live in @invana/renderer-pixijs. If the engine needs " +
                "something from pixi, add it to the renderer contract " +
                "(packages/canvas/src/renderer/IRenderer.ts) and implement it in the backend.",
            },
            {
              name: "pixi-viewport",
              message:
                "The viewport is the backend's. Drive the camera through Camera / ICameraBinding instead.",
            },
            {
              name: "three",
              message: "Drawing libraries live in a renderer package, not here.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["dist/**"],
  },
];
