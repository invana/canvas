/**
 * Canvas Events - Event type constants
 */

export const CanvasEvents = {
  // Lifecycle
  INITIALIZED: 'canvas:initialized',
  DESTROYED: 'canvas:destroyed',
  RESIZED: 'canvas:resized',

  // Render
  BEFORE_RENDER: 'render:before',
  AFTER_RENDER: 'render:after',

  // Viewport
  VIEWPORT_CHANGED: 'viewport:changed',
  VIEWPORT_PAN: 'viewport:pan',
  VIEWPORT_ZOOM: 'viewport:zoom',

  // Node Events
  NODE_ADDED: 'node:added',
  NODE_REMOVED: 'node:removed',
  NODE_UPDATED: 'node:updated',
  NODE_HOVER: 'node:hover',
  NODE_HOVER_END: 'node:hoverEnd',
  NODE_CLICK: 'node:click',
  NODE_DOUBLE_CLICK: 'node:doubleClick',
  NODE_CONTEXT_MENU: 'node:contextMenu',
  NODE_DRAG_START: 'node:dragStart',
  NODE_DRAG: 'node:drag',
  NODE_DRAG_END: 'node:dragEnd',
  NODE_STATE_CHANGED: 'node:stateChanged',

  // Edge Events
  EDGE_ADDED: 'edge:added',
  EDGE_REMOVED: 'edge:removed',
  EDGE_UPDATED: 'edge:updated',
  EDGE_HOVER: 'edge:hover',
  EDGE_HOVER_END: 'edge:hoverEnd',
  EDGE_CLICK: 'edge:click',
  EDGE_DOUBLE_CLICK: 'edge:doubleClick',
  EDGE_CONTEXT_MENU: 'edge:contextMenu',
  EDGE_STATE_CHANGED: 'edge:stateChanged',

  // Selection
  SELECTION_CHANGED: 'selection:changed',

  // Canvas background
  CANVAS_CLICK: 'canvas:click',
  CANVAS_DOUBLE_CLICK: 'canvas:doubleClick',
  CANVAS_CONTEXT_MENU: 'canvas:contextMenu',

  // Data
  DATA_IMPORTED: 'data:imported',
  DATA_CLEARED: 'data:cleared',

  // Theme
  THEME_CHANGED: 'theme:changed',

  // Plugin
  PLUGIN_INSTALLED: 'plugin:installed',
  PLUGIN_UNINSTALLED: 'plugin:uninstalled',
  PLUGIN_ENABLED: 'plugin:enabled',
  PLUGIN_DISABLED: 'plugin:disabled',
} as const;

export type CanvasEventType = (typeof CanvasEvents)[keyof typeof CanvasEvents];
