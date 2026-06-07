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
    return mergeConfig(config, {
      resolve: {
        alias: [
          // Upstream packaging bug: `@invana/themes@0.0.4`'s `dist/index.js`
          // does `import { cn } from '@invana/ui/lib/utils'`, but
          // `@invana/ui@0.0.4` exposes no `./lib/utils` subpath (no such file,
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
