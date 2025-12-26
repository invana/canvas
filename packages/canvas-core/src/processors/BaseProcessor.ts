/**
 * BaseProcessor - Abstract base class for all processors
 * 
 * Processors are used to customize, extend, or override canvas behaviors
 */

import type { ProcessorConfig, ProcessorContext, CanvasEvent } from '../types';

export abstract class BaseProcessor {
  public readonly type: string;
  public enabled: boolean;
  public priority: number;
  protected options: Record<string, unknown>;

  constructor(config: ProcessorConfig) {
    this.type = config.type;
    this.enabled = config.enabled ?? true;
    this.priority = config.priority ?? 0;
    this.options = config.options ?? {};
  }

  /**
   * Called when the processor is initialized
   */
  abstract initialize(context: ProcessorContext): void;

  /**
   * Called to process an event/action
   * Return false to stop the event from propagating to other processors
   */
  abstract process(event: CanvasEvent, context: ProcessorContext): boolean | void;

  /**
   * Called when the processor is destroyed
   */
  abstract destroy(): void;

  /**
   * Update processor options
   */
  updateOptions(options: Record<string, unknown>): void {
    this.options = { ...this.options, ...options };
  }
}

/**
 * Functional processor - a simpler alternative to class-based processors
 */
export interface FunctionalProcessor {
  type: string;
  enabled?: boolean;
  priority?: number;
  initialize?: (context: ProcessorContext) => void;
  process: (event: CanvasEvent, context: ProcessorContext) => boolean | void;
  destroy?: () => void;
}

/**
 * Wrap a functional processor into a BaseProcessor
 */
export class FunctionalProcessorWrapper extends BaseProcessor {
  private readonly fn: FunctionalProcessor;

  constructor(fn: FunctionalProcessor) {
    super({
      type: fn.type,
      enabled: fn.enabled,
      priority: fn.priority,
    });
    this.fn = fn;
  }

  initialize(context: ProcessorContext): void {
    this.fn.initialize?.(context);
  }

  process(event: CanvasEvent, context: ProcessorContext): boolean | void {
    return this.fn.process(event, context);
  }

  destroy(): void {
    this.fn.destroy?.();
  }
}
