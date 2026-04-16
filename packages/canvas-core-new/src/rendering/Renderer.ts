import { Application, Container } from 'pixi.js';
import type { EventSystem } from 'pixi.js';
import type { Camera } from '../camera/Camera.js';

export interface RendererOptions {
  container: HTMLElement;
  width: number;
  height: number;
  backgroundColor: number;
  antialias: boolean;
}

/**
 * Renderer — internal class. Wraps PixiJS Application.
 * Never exposed through Canvas public API.
 */
export class Renderer {
  private _app: Application;

  /** The root stage container (camera mounts here) */
  readonly stage: Container;

  /** Screen-space container — not affected by camera pan/zoom */
  readonly screenStage: Container;

  private constructor(app: Application) {
    this._app = app;
    this.stage = app.stage;
    this.screenStage = new Container();
    app.stage.addChild(this.screenStage);
  }

  static async create(options: RendererOptions): Promise<Renderer> {
    const app = new Application();
    await app.init({
      resizeTo: options.container,
      width: options.width,
      height: options.height,
      background: options.backgroundColor,
      antialias: options.antialias,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgpu',
    });
    options.container.appendChild(app.canvas as HTMLCanvasElement);
    return new Renderer(app);
  }

  getCanvasElement(): HTMLCanvasElement {
    return this._app.canvas as HTMLCanvasElement;
  }

  /** The PixiJS EventSystem — needed by pixi-viewport */
  getEvents(): EventSystem {
    return this._app.renderer.events as EventSystem;
  }

  getRendererType(): 'webgpu' | 'webgl' {
    return (this._app.renderer.type as unknown as string).toLowerCase().includes('webgpu')
      ? 'webgpu'
      : 'webgl';
  }

  resize(width: number, height: number): void {
    this._app.renderer.resize(width, height);
  }

  addTicker(fn: () => void): void {
    this._app.ticker.add(fn);
  }

  removeTicker(fn: () => void): void {
    this._app.ticker.remove(fn);
  }

  mountCamera(camera: Camera): void {
    // Viewport must be AFTER screenStage so shapes render in front of background.
    // stage[0] = screenStage (background, rendered first / behind)
    // stage[1] = viewport     (world content, rendered second / in front)
    this._app.stage.addChild(camera._viewport);
  }

  createStageSurface(zIndex: number): Container {
    const surface = new Container();
    surface.zIndex = zIndex;
    this._app.stage.addChild(surface);
    return surface;
  }

  destroy(): void {
    this._app.destroy(true, { children: true });
  }
}
