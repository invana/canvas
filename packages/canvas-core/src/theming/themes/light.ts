/**
 * Light Theme
 */

import type { Theme } from '../../types/theme.js';

export const lightTheme: Theme = {
  name: 'light',
  mode: 'light',

  colors: {
    background: '#ffffff',
    primary: '#2196F3',
    secondary: '#9C27B0',
    accent: '#FF9800',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    text: '#212121',
    textMuted: '#757575',
    border: '#E0E0E0',
  },

  node: {
    default: {
      fill: '#4CAF50',
      stroke: '#2E7D32',
      strokeWidth: 2,
      opacity: 1,
      label: {
        textColor: '#212121',
        fontSize: 12,
        visible: true,
        position: 'bottom',
      },
    },
    hovered: {
      stroke: '#1B5E20',
      strokeWidth: 3,
      scale: 1.05,
    },
    selected: {
      stroke: '#2196F3',
      strokeWidth: 3,
    },
    highlighted: {
      stroke: '#FF9800',
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
      fill: '#BDBDBD',
    },
  },

  edge: {
    default: {
      stroke: '#9E9E9E',
      strokeWidth: 2,
      opacity: 1,
      targetArrow: { type: 'triangle', size: 10 },
      label: {
        textColor: '#757575',
        fontSize: 10,
        visible: false,
      },
    },
    hovered: {
      stroke: '#616161',
      strokeWidth: 3,
    },
    selected: {
      stroke: '#2196F3',
      strokeWidth: 3,
    },
    highlighted: {
      stroke: '#FF9800',
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
      stroke: '#BDBDBD',
    },
  },

  autoColor: {
    enabled: true,
    strategy: 'hash',
    palette: [
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#9C27B0', // Purple
      '#FF9800', // Orange
      '#F44336', // Red
      '#00BCD4', // Cyan
      '#FFEB3B', // Yellow
      '#E91E63', // Pink
      '#673AB7', // Deep Purple
      '#009688', // Teal
    ],
  },
};
