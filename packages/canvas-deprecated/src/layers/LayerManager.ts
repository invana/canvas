import { Container } from 'pixi.js';
import type { Layer, LayerManager, LayerOptions } from './types.js';
import type { EventBus } from '../events/EventBus.js';
import { LayerAddedEvent, LayerRemovedEvent, LayerVisibilityChangedEvent } from '../events/layer-events.js';

class LayerImpl implements Layer {
  readonly id: string;
  readonly zIndex: number;
  label?: string;
  locked?: boolean;
  readonly _container: Container;

  constructor(options: LayerOptions) {
    this.id = options.id;
    this.zIndex = options.zIndex;
    this.label = options.label;
    this.locked = options.locked ?? false;
    this._container = new Container();
    this._container.zIndex = options.zIndex;
    this._container.visible = options.visible ?? true;
    this._container.alpha = options.opacity ?? 1;
  }

  get visible(): boolean { return this._container.visible; }
  set visible(v: boolean) { this._container.visible = v; }

  get opacity(): number { return this._container.alpha; }
  set opacity(v: number) { this._container.alpha = v; }
}

export class LayerManagerImpl implements LayerManager {
  private _layers = new Map<string, LayerImpl>();
  private _events: EventBus;
  /** @internal PixiJS container that holds all layers (should be inside camera viewport) */
  readonly _root: Container;

  constructor(events: EventBus) {
    this._events = events;
    this._root = new Container();
    this._root.sortableChildren = true;
  }

  /** Create and register a layer. Returns the backing PixiJS Container for use by plugins. */
  createLayer(options: LayerOptions): Container {
    if (this._layers.has(options.id)) {
      return this._layers.get(options.id)!._container;
    }
    const layer = new LayerImpl(options);
    this._layers.set(options.id, layer);
    this._root.addChild(layer._container);
    this._events.emit('layer:added', new LayerAddedEvent({ layerId: options.id }));
    return layer._container;
  }

  getLayers(): Layer[] {
    return [...this._layers.values()];
  }

  getLayer(id: string): Layer | undefined {
    return this._layers.get(id);
  }

  showLayer(id: string): void {
    const layer = this._layers.get(id);
    if (layer) {
      layer.visible = true;
      this._events.emit('layer:visibility-changed', new LayerVisibilityChangedEvent({ layerId: id, visible: true }));
    }
  }

  hideLayer(id: string): void {
    const layer = this._layers.get(id);
    if (layer) {
      layer.visible = false;
      this._events.emit('layer:visibility-changed', new LayerVisibilityChangedEvent({ layerId: id, visible: false }));
    }
  }

  setLayerOpacity(id: string, opacity: number): void {
    const layer = this._layers.get(id);
    if (layer) layer.opacity = Math.max(0, Math.min(1, opacity));
  }

  setLayerZIndex(id: string, zIndex: number): void {
    const layer = this._layers.get(id);
    if (layer) {
      layer._container.zIndex = zIndex;
    }
  }

  removeLayer(id: string): void {
    const layer = this._layers.get(id);
    if (layer) {
      this._root.removeChild(layer._container);
      layer._container.destroy({ children: true });
      this._layers.delete(id);
      this._events.emit('layer:removed', new LayerRemovedEvent({ layerId: id }));
    }
  }

  destroy(): void {
    for (const id of this._layers.keys()) {
      this.removeLayer(id);
    }
    this._root.destroy({ children: true });
  }
}
