// Core public types — no PixiJS types exposed

/** A 2D point in world or screen space */
export interface Point {
  x: number;
  y: number;
}

/** An axis-aligned bounding rectangle */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Width and height dimensions */
export interface Size {
  width: number;
  height: number;
}

/** Canvas initialisation options */
export interface CanvasOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  /** Behaviour preset — registers a curated set of interaction plugins */
  behavior?: 'default' | 'minimal' | 'full' | false;
  /** Plugins to register at init time */
  plugins?: PluginConfig[];
  /** Background color for the renderer */
  backgroundColor?: string | number;
  /** Whether antialiasing is enabled (default: true) */
  antialias?: boolean;
}

/** Plugin config entry in CanvasOptions.plugins */
export type PluginConfig =
  | string
  | { plugin: string; key?: string; options?: Record<string, unknown> };
