import type { Container } from 'pixi.js';

/** Options for creating a new layer */
export interface LayerOptions {
  /** Unique identifier for this layer */
  id: string;
  /** Z-order index — higher values render on top */
  zIndex: number;
  /** Optional human-readable label for debugging */
  label?: string;
  /** Whether the layer is initially visible (default: true) */
  visible?: boolean;
  /** Initial opacity 0–1 (default: 1) */
  opacity?: number;
  /** When true, hides layer in UI pickers but still renders (default: false) */
  locked?: boolean;
}

/** A single named rendering layer with visibility and opacity controls */
export interface Layer {
  /** Unique identifier */
  readonly id: string;
  /** Z-order index — higher values render on top */
  readonly zIndex: number;
  /** Optional human-readable label */
  label?: string;
  /** When true, hidden from UI pickers (still rendered) */
  locked?: boolean;
  /** Whether this layer is visible */
  visible: boolean;
  /** Layer opacity, 0 (transparent) to 1 (fully opaque) */
  opacity: number;
  /** @internal PixiJS container backing this layer */
  readonly _container: Container;
}

/**
 * LayerManager — controls layer visibility, opacity, and z-order.
 * Access via `canvas.layers`.
 */
export interface LayerManager {
  /** Returns all registered layers sorted by zIndex */
  getLayers(): Layer[];
  /**
   * Look up a layer by id.
   * @returns The layer, or `undefined` if not found
   */
  getLayer(id: string): Layer | undefined;
  /** Make a layer visible. Emits `layer:visibility-changed` */
  showLayer(id: string): void;
  /** Hide a layer. Emits `layer:visibility-changed` */
  hideLayer(id: string): void;
  /**
   * Set layer opacity.
   * @param id - Layer id
   * @param opacity - Value between 0 (transparent) and 1 (opaque)
   */
  setLayerOpacity(id: string, opacity: number): void;
  /**
   * Change the z-order of a layer.
   * @param id - Layer id
   * @param zIndex - New z-order index
   */
  setLayerZIndex(id: string, zIndex: number): void;
}
