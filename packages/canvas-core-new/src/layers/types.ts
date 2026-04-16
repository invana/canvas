import type { Container } from 'pixi.js';

export interface LayerOptions {
  id: string;
  zIndex: number;
  label?: string;
  visible?: boolean;
  opacity?: number;
  locked?: boolean;
}

export interface Layer {
  readonly id: string;
  readonly zIndex: number;
  label?: string;
  locked?: boolean;
  visible: boolean;
  opacity: number;
  /** @internal PixiJS container backing this layer */
  readonly _container: Container;
}

export interface LayerManager {
  getLayers(): Layer[];
  getLayer(id: string): Layer | undefined;
  showLayer(id: string): void;
  hideLayer(id: string): void;
  setLayerOpacity(id: string, opacity: number): void;
  setLayerZIndex(id: string, zIndex: number): void;
}
