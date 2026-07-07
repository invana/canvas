import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    {
      name: getAbsolutePath('@storybook/addon-docs'),
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {},
        },
      },
    },
  ],
  docs: {
    defaultName: 'Docs',
  },
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    // Tailwind v4 pass. The design kit ships component *class names* and expects
    // the consuming app to run Tailwind, scanning those packages to generate the
    // utilities — `@invana/forms` in particular ships **no** CSS (its `Switch`
    // uses `translate-x-5` etc.), and `@invana/ui`'s prebuilt CSS doesn't cover
    // it. Without this pass those utilities are absent, so e.g. the settings-form
    // Switch toggles state but not appearance. See `.storybook/tailwind.css`;
    // mirrors the design-kit repo's own Storybook setup.
    const tailwindcss = (await import('@tailwindcss/vite')).default;
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      resolve: {
        alias: [
          // Upstream packaging bug: `@invana/themes@0.0.6`'s `dist/index.js`
          // does `import { cn } from '@invana/ui/lib/utils'`, but
          // `@invana/ui@0.0.6` exposes no `./lib/utils` subpath (no such file,
          // and not in its `exports`) — `cn` lives on the package **main**
          // entry. Vite/esbuild respect `exports`, so the dep pre-bundle fails.
          // Redirect the dead subpath to the main entry, which exports `cn`.
          // Remove once the design-kit republishes `@invana/themes` to import
          // `cn` from `@invana/ui` (or `@invana/ui` ships `./lib/utils`).
          { find: /^@invana\/ui\/lib\/utils$/, replacement: '@invana/ui' },
        ],
      },
    });
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
