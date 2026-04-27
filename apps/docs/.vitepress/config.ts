import { defineConfig } from 'vitepress'
import { readdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'

const docsRoot = resolve(__dirname, '..')

/** Build a sidebar section from a generated api/<dir> folder. */
function apiSection(label: string, dir: string) {
  const folder = join(docsRoot, 'api', dir)
  if (!existsSync(folder)) return []
  const files = readdirSync(folder)
    .filter(f => f.endsWith('.md'))
    .sort()
  return [{
    text: label,
    collapsed: true,
    items: files.map(f => ({
      text: f.replace('.md', ''),
      link: `/api/${dir}/${f.replace('.md', '')}`,
    })),
  }]
}

export default defineConfig({
  title: '@invana/canvas',
  description: 'WebGPU-first canvas rendering engine and graph visualization toolkit',
  base: '/',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Plugins', link: '/plugins/background' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Storybook', link: 'http://localhost:6006', target: '_blank' },
      { text: 'GitHub', link: 'https://github.com/invana/canvas', target: '_blank' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/getting-started' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Canvas', link: '/guide/canvas' },
            { text: 'Camera', link: '/guide/camera' },
            { text: 'Layers', link: '/guide/layers' },
            { text: 'Events', link: '/guide/events' },
            { text: 'Plugin System', link: '/guide/plugins' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: 'Built-in Plugins',
          items: [
            { text: 'BackgroundPlugin', link: '/plugins/background' },
            { text: 'ElementPlugin', link: '/plugins/element' },
            { text: 'DrawingPlugin', link: '/plugins/drawing' },
            { text: 'DevInfoPlugin', link: '/plugins/dev-info' },
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
      message: 'Released under the MIT License.',
    },
  },
})
