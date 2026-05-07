import { defineConfig } from 'vitepress';
import { readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const docsRoot = resolve(__dirname, '..');

/** Build a sidebar section from a generated api/<dir> folder. */
function apiSection(label: string, dir: string) {
  const folder = join(docsRoot, 'api', dir);
  if (!existsSync(folder)) return [];
  const files = readdirSync(folder)
    .filter((f) => f.endsWith('.md'))
    .sort();
  return [
    {
      text: label,
      collapsed: true,
      items: files.map((f) => ({
        text: f.replace('.md', ''),
        link: `/api/${dir}/${f.replace('.md', '')}`,
      })),
    },
  ];
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
      {
        text: 'Plugins',
        items: [
          {
            text: 'Decorations',
            items: [
              { text: 'Overview', link: '/plugins/decorations/' },
              { text: 'halo', link: '/plugins/decorations/halo' },
              { text: 'border', link: '/plugins/decorations/border' },
              { text: 'glow', link: '/plugins/decorations/glow' },
              { text: 'marching-ants', link: '/plugins/decorations/marching-ants' },
              { text: 'pulse-ring', link: '/plugins/decorations/pulse-ring' },
              { text: 'dashed-border-rotating', link: '/plugins/decorations/dashed-border-rotating' },
            ],
          },
          {
            text: 'Layers',
            items: [
              { text: 'Overview', link: '/plugins/layers/' },
              { text: 'BackgroundLayer', link: '/plugins/layers/background' },
              { text: 'ThemedBackgroundLayer', link: '/plugins/layers/themed-background' },
              { text: 'DevInfoLayer', link: '/plugins/layers/dev-info' },
            ],
          },
          {
            text: 'Behaviours',
            items: [
              { text: 'Overview', link: '/plugins/behaviours/' },
              { text: 'DragPanBehaviour', link: '/plugins/behaviours/drag-pan' },
              { text: 'WheelZoomBehaviour', link: '/plugins/behaviours/wheel-zoom' },
              { text: 'PinchZoomBehaviour', link: '/plugins/behaviours/pinch-zoom' },
              { text: 'KeyboardCameraInputBehaviour', link: '/plugins/behaviours/keyboard-camera-input' },
            ],
          },
        ],
      },
      { text: 'API Reference', link: '/api/' },
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
            { text: 'Architecture overview', link: '/guide/architecture' },
          ],
        },
        {
          text: 'Concepts',
          items: [
            { text: 'Layers', link: '/guide/layers' },
            { text: 'Behaviours', link: '/guide/behaviours' },
            { text: 'Layouts', link: '/guide/layouts' },
            { text: 'Renderers', link: '/guide/renderers' },
            { text: 'Events', link: '/guide/events' },
          ],
        },
      ],
      '/plugins/': [
        { text: 'Overview', link: '/plugins/' },
        {
          text: 'Decorations',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/plugins/decorations/' },
            { text: 'halo', link: '/plugins/decorations/halo' },
            { text: 'border', link: '/plugins/decorations/border' },
            { text: 'glow', link: '/plugins/decorations/glow' },
            { text: 'marching-ants', link: '/plugins/decorations/marching-ants' },
            { text: 'pulse-ring', link: '/plugins/decorations/pulse-ring' },
            { text: 'dashed-border-rotating', link: '/plugins/decorations/dashed-border-rotating' },
          ],
        },
        {
          text: 'Layers',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/plugins/layers/' },
            { text: 'BackgroundLayer', link: '/plugins/layers/background' },
            { text: 'ThemedBackgroundLayer', link: '/plugins/layers/themed-background' },
            { text: 'DevInfoLayer', link: '/plugins/layers/dev-info' },
          ],
        },
        {
          text: 'Behaviours',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/plugins/behaviours/' },
            { text: 'DragPanBehaviour', link: '/plugins/behaviours/drag-pan' },
            { text: 'WheelZoomBehaviour', link: '/plugins/behaviours/wheel-zoom' },
            { text: 'PinchZoomBehaviour', link: '/plugins/behaviours/pinch-zoom' },
            { text: 'KeyboardCameraInputBehaviour', link: '/plugins/behaviours/keyboard-camera-input' },
          ],
        },
      ],
      '/api/': [
        { text: 'Overview', link: '/api/' },
        ...apiSection('Classes', 'classes'),
        ...apiSection('Interfaces', 'interfaces'),
        ...apiSection('Type Aliases', 'type-aliases'),
        ...apiSection('Enumerations', 'enumerations'),
        ...apiSection('Functions', 'functions'),
        ...apiSection('Variables', 'variables'),
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
