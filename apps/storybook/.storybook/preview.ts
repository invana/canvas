import type { Preview } from '@storybook/html';

import './global.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a2e' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
    docs: {
      source: {
        type: 'code',
      },
    },
  },
};

export default preview;
