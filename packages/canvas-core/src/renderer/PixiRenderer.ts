/**
 * PixiJS Renderer Implementation
 * WebGPU-first with WebGL2 fallback
 */

import { Application, Container } from 'pixi.js';
import type { RendererConfig, Size } from '../types/index.js';
import type { IRenderer } from './IRenderer.js';

export class PixiRenderer implements IRenderer {
  private _app: Application | null = null;
  private _viewport: Container | null = null;
  private _renderCallbacks: ((deltaTime: number) => void)[] = [];
  private _size: Size = { width: 800, height: 600 };
  private _initialized = false;
  private _isWebGPU = false;

  get app(): Application {
    if (!this._app) {
      throw new Error('Renderer not initialized');
    }
    return this._app;
  }

  get stage(): Container {
    return this.app.stage;
  }

  get viewport(): Container {
    if (!this._viewport) {
      throw new Error('Renderer not initialized');
    }
    return this._viewport;
  }

  get size(): Size {
    return { ...this._size };
  }

  get initialized(): boolean {
    return this._initialized;
  }

  get isWebGPU(): boolean {
    return this._isWebGPU;
  }

  async initialize(canvas: HTMLCanvasElement, config?: RendererConfig): Promise<void> {
    if (this._initialized) {
      throw new Error('Renderer already initialized');
    }

    const preferredType = config?.type ?? 'auto';
    const useWebGPU = preferredType === 'webgpu' || preferredType === 'auto';

    // Get device pixel ratio for sharp rendering on high-DPI displays
    const dpr = config?.resolution ?? window.devicePixelRatio ?? 1;

    // Ensure dimensions are valid and even (WebGPU multisampling works better with even dimensions)
    const width = Math.max(2, Math.floor((canvas.width || 800) / 2) * 2);
    const height = Math.max(2, Math.floor((canvas.height || 600) / 2) * 2);

    this._app = new Application();

    await this._app.init({
      canvas,
      width,
      height,
      antialias: config?.antialias ?? true,
      // Use device pixel ratio for sharp rendering on Retina/high-DPI displays
      resolution: dpr,
      autoDensity: true,
      backgroundColor: config?.backgroundColor ?? '#ffffff',
      backgroundAlpha: config?.backgroundAlpha ?? 1,
      preference: useWebGPU ? 'webgpu' : 'webgl',
    });

    this._size = {
      width: this._app.screen.width,
      height: this._app.screen.height,
    };

    // Check if WebGPU was actually used
    this._isWebGPU = this._app.renderer.type === 0x02; // WebGPU type

    // Create viewport container for pan/zoom
    this._viewport = new Container();
    this._viewport.label = 'viewport';
    this._app.stage.addChild(this._viewport);

    // Setup render loop callback
    this._app.ticker.add((ticker) => {
      const deltaTime = ticker.deltaMS;
      for (const callback of this._renderCallbacks) {
        callback(deltaTime);
      }
    });

    this._initialized = true;

    console.log(
      `Canvas initialized with ${this._isWebGPU ? 'WebGPU' : 'WebGL'} renderer`,
    );
  }

  resize(width: number, height: number): void {
    if (!this._initialized) return;

    // Ensure dimensions are valid and even (WebGPU multisampling works better with even dimensions)
    const w = Math.max(2, Math.floor(width / 2) * 2);
    const h = Math.max(2, Math.floor(height / 2) * 2);

    this._size = { width: w, height: h };
    this.app.renderer.resize(w, h);
  }

  start(): void {
    if (!this._initialized) return;
    this.app.ticker.start();
  }

  stop(): void {
    if (!this._initialized) return;
    this.app.ticker.stop();
  }

  render(): void {
    if (!this._initialized) return;
    this.app.render();
  }

  destroy(): void {
    if (!this._initialized) return;

    this._renderCallbacks = [];
    this._viewport?.destroy({ children: true });
    this._app?.destroy(true, { children: true, texture: true });
    this._app = null;
    this._viewport = null;
    this._initialized = false;
  }

  setBackgroundColor(color: string, alpha = 1): void {
    if (!this._initialized) return;
    this.app.renderer.background.color = color;
    this.app.renderer.background.alpha = alpha;
  }

  onRender(callback: (deltaTime: number) => void): () => void {
    this._renderCallbacks.push(callback);
    return () => {
      const index = this._renderCallbacks.indexOf(callback);
      if (index >= 0) {
        this._renderCallbacks.splice(index, 1);
      }
    };
  }
}
