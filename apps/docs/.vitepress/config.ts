import { defineConfig } from 'vitepress';
import { readdirSync, existsSync, statSync } from 'fs';
import { resolve, join } from 'path';

const docsRoot = resolve(__dirname, '..');

/**
 * Build a single sidebar subsection (Classes / Interfaces / …) for one
 * generated TypeDoc package folder, e.g. `api/canvas/src/classes/`.
 */
function apiKindSubsection(label: string, packageDir: string, kindDir: string) {
  const folder = join(docsRoot, 'api', packageDir, kindDir);
  if (!existsSync(folder)) return [];
  const files = readdirSync(folder)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .sort();
  if (files.length === 0) return [];
  return [
    {
      text: label,
      collapsed: true,
      items: files.map((f) => ({
        text: f.replace('.md', ''),
        link: `/api/${packageDir}/${kindDir}/${f.replace('.md', '')}`,
      })),
    },
  ];
}

/**
 * Build a top-level sidebar group for one TypeDoc package, e.g. `canvas/src`.
 * Produces an entry per generated kind folder (classes, interfaces, …).
 */
function apiPackageSection(label: string, packageDir: string) {
  const root = join(docsRoot, 'api', packageDir);
  if (!existsSync(root)) return [];
  const items: { text: string; link?: string; collapsed?: boolean; items?: unknown[] }[] = [
    { text: 'Overview', link: `/api/${packageDir}/` },
    ...apiKindSubsection('Classes', packageDir, 'classes'),
    ...apiKindSubsection('Interfaces', packageDir, 'interfaces'),
    ...apiKindSubsection('Type Aliases', packageDir, 'type-aliases'),
    ...apiKindSubsection('Enumerations', packageDir, 'enumerations'),
    ...apiKindSubsection('Functions', packageDir, 'functions'),
    ...apiKindSubsection('Variables', packageDir, 'variables'),
  ];
  return [{ text: label, collapsed: true, items }];
}

/**
 * Discover every `<package>/src/` folder under `api/` and build a sidebar
 * group per package. Falls back gracefully when typedoc hasn't run yet.
 */
function apiSidebar() {
  const apiRoot = join(docsRoot, 'api');
  if (!existsSync(apiRoot)) return [];
  const packages = readdirSync(apiRoot)
    .filter((name) => statSync(join(apiRoot, name)).isDirectory())
    .filter((name) => existsSync(join(apiRoot, name, 'src')))
    .sort();
  return packages.flatMap((pkg) => apiPackageSection(`@invana/${pkg}`, `${pkg}/src`));
}

export default defineConfig({
  title: '@invana/canvas',
  description:
    'WebGPU-first canvas rendering engine and graph visualization toolkit',
  base: '/',

  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/' },
      {
        text: 'Layers',
        items: [
          { text: 'Layer basics', link: '/layers/' },
          { text: 'DevInfoLayer', link: '/layers/dev-info-layer' },
          { text: 'LayersPanelLayer', link: '/layers/layers-panel-layer' },
        ],
      },
      {
        text: 'Storybook',
        link: 'http://localhost:6006',
        target: '_blank',
      },
      {
        text: 'GitHub',
        link: 'https://github.com/invana/canvas',
        target: '_blank',
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation & first scene', link: '/guide/getting-started' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Package status', link: '/guide/packages' },
          ],
        },
        {
          text: 'Engine',
          items: [
            { text: 'Canvas & Camera', link: '/guide/canvas' },
            { text: 'Layers', link: '/guide/layers' },
            { text: 'Behaviours', link: '/guide/behaviours' },
            { text: 'Events', link: '/guide/events' },
          ],
        },
        {
          text: 'Rendering',
          items: [
            { text: 'Primitives renderer', link: '/guide/primitives' },
          ],
        },
      ],
      '/api/': [
        { text: 'Overview', link: '/api/' },
        ...apiSidebar(),
      ],
      '/layers/': [
        {
          text: 'Layers',
          items: [
            { text: 'Layer basics', link: '/layers/' },
          ],
        },
        {
          text: 'Built-in layers',
          items: [
            { text: 'DevInfoLayer', link: '/layers/dev-info-layer' },
            { text: 'LayersPanelLayer', link: '/layers/layers-panel-layer' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/invana/canvas' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the Apache 2.0 License.',
    },
  },
});
