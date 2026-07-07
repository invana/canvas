const path = require('node:path');

/*
 * Tailwind v4 content config for the Storybook.
 *
 * The Invana design kit is source-based: components ship class *names* and the
 * consuming app runs Tailwind to generate the utilities. `@invana/forms` ships
 * NO CSS at all (its `Switch` uses `translate-x-5` / `data-[state=…]:bg-*`), and
 * `@invana/ui`'s prebuilt CSS doesn't cover it. So we scan the packages' built
 * output here.
 *
 * We consume the *published* packages, so we point at their `dist` — resolved
 * through Node (`require.resolve`), which follows pnpm's symlink into the `.pnpm`
 * store and is immune to the version-hash in that path. A bare
 * `@source "node_modules/@invana/…"` does NOT work: Tailwind skips node_modules
 * (gitignored) and its scanner doesn't traverse the pnpm symlink.
 */
const uiDist = path.dirname(require.resolve('@invana/ui'));
const formsDist = path.dirname(require.resolve('@invana/forms'));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Our own app content (real, local source).
    path.join(__dirname, 'stories/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(__dirname, '../../packages/canvas-ui/src/**/*.{js,ts,jsx,tsx}'),
    path.join(__dirname, '../../packages/canvas-react/src/**/*.{js,ts,jsx,tsx}'),
    // Design-kit components — their published dist (per package, not local copies).
    path.join(uiDist, '**/*.{js,cjs,mjs}'),
    path.join(formsDist, '**/*.{js,cjs,mjs}'),
  ],
};
