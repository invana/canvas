/**
 * Renderer Interface - Abstract rendering layer
 */

import type { Application, Container } from 'pixi.js';
import type { RendererConfig, Size } from '../types/index.js';

export interface IRenderer {
  /** The underlying application instance */
  readonly app: Application;

  /** The main stage container */
  readonly stage: Container;

  /** The viewport/camera container */
  readonly viewport: Container;

  /** Current canvas size */
  readonly size: Size;

  /** Whether renderer is initialized */
  readonly initialized: boolean;

  /** Whether WebGPU is being used */
  readonly isWebGPU: boolean;

  /**
   * Initialize the renderer
   */
  initialize(canvas: HTMLCanvasElement, config?: RendererConfig): Promise<void>;

  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void;

  /**
   * Start the render loop
   */
  start(): void;

  /**
   * Stop the render loop
   */
  stop(): void;

  /**
   * Render a single frame
   */
  render(): void;

  /**
   * Destroy the renderer and clean up resources
   */
  destroy(): void;

  /**
   * Set background color
   */
  setBackgroundColor(color: string, alpha?: number): void;

  /**
   * Add a callback to the render loop
   */
  onRender(callback: (deltaTime: number) => void): () => void;
}
