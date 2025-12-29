import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs"
  ],
  docs: {
    defaultName: 'Docs',
  },
  framework: {
    name: '@storybook/html-vite',
    options: {},
  }
};

export default config;
