import type { ToolbarIcon } from '../toolbars/types';

/**
 * Where a {@link Panel} pins itself within its nearest positioned ancestor.
 * Mirrors React Flow's `<Panel position>`: one of the four corners or the two
 * horizontal edge-centres.
 */
export type PanelPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

// Re-export so layout consumers can import the icon contract from one place.
export type { ToolbarIcon };
