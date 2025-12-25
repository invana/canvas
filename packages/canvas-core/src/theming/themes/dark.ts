/**
 * Dark Theme
 */

import type { Theme } from '../../types/theme.js';

export const darkTheme: Theme = {
  name: 'dark',
  mode: 'dark',

  colors: {
    background: '#1a1a2e',
    primary: '#64B5F6',
    secondary: '#CE93D8',
    accent: '#FFB74D',
    success: '#81C784',
    warning: '#FFD54F',
    error: '#E57373',
    text: '#FAFAFA',
    textMuted: '#9E9E9E',
    border: '#424242',
  },

  node: {
    default: {
      fill: '#81C784',
      stroke: '#4CAF50',
      strokeWidth: 2,
      opacity: 1,
      label: {
        textColor: '#FAFAFA',
        fontSize: 12,
        visible: true,
        position: 'bottom',
      },
    },
    hovered: {
      stroke: '#A5D6A7',
      strokeWidth: 3,
      scale: 1.05,
    },
    selected: {
      stroke: '#64B5F6',
      strokeWidth: 3,
    },
    highlighted: {
      stroke: '#FFB74D',
      strokeWidth: 3,
      animation: { type: 'pulse', duration: 1000, loop: true },
    },
    muted: {
      opacity: 0.3,
    },
    locked: {
      opacity: 0.7,
    },
    disabled: {
      opacity: 0.4,
      fill: '#616161',
    },
  },

  edge: {
    default: {
      stroke: '#757575',
      strokeWidth: 2,
      opacity: 1,
      targetArrow: { type: 'triangleFilled', size: 10 },
      label: {
        textColor: '#9E9E9E',
        fontSize: 10,
        visible: false,
      },
    },
    hovered: {
      stroke: '#BDBDBD',
      strokeWidth: 3,
    },
    selected: {
      stroke: '#64B5F6',
      strokeWidth: 3,
    },
    highlighted: {
      stroke: '#FFB74D',
      strokeWidth: 3,
    },
    muted: {
      opacity: 0.2,
    },
    locked: {
      opacity: 0.5,
    },
    disabled: {
      opacity: 0.3,
      stroke: '#424242',
    },
  },

  autoColor: {
    enabled: true,
    strategy: 'hash',
    palette: [
      '#81C784', // Green
      '#64B5F6', // Blue
      '#CE93D8', // Purple
      '#FFB74D', // Orange
      '#E57373', // Red
      '#4DD0E1', // Cyan
      '#FFF176', // Yellow
      '#F48FB1', // Pink
      '#B39DDB', // Deep Purple
      '#4DB6AC', // Teal
    ],
  },
};
