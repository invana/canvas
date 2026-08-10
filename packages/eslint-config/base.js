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
            {
              name: "zustand",
              message:
                "Program against the ReactiveStore port, not zustand. Build stores with " +
                "createReactiveStore / createMemoryStore from @invana/canvas-store — that is " +
                "what makes writes emit patches, so history, telemetry and a future Yjs " +
                "backend can observe them. zustand belongs only to the adapter " +
                "(packages/canvas-store/src/adapters/zustand).",
            },
            {
              name: "immer",
              message:
                "immer is the kernel's patch engine, not a general utility. Mutate through " +
                "store.update(recipe) and let the port produce the patches.",
            },
          ],
          // Subpath imports (`zustand/vanilla`, `zustand/middleware`) are the same
          // boundary and were how the last violation was written.
          patterns: [
            {
              group: ["zustand/*", "immer/*"],
              message:
                "Same boundary as the bare import: state libraries live behind the " +
                "ReactiveStore port in @invana/canvas-store.",
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
