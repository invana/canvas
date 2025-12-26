/**
 * ProcessorPipeline - Manages and executes processors in order
 */

import type { ProcessorConfig, ProcessorContext, CanvasEvent } from '../types';
import { BaseProcessor, FunctionalProcessor, FunctionalProcessorWrapper } from './BaseProcessor';
import { ProcessorRegistry } from './ProcessorRegistry';

export class ProcessorPipeline {
  private readonly processors: BaseProcessor[] = [];
  private context: ProcessorContext | null = null;

  constructor(configs?: ProcessorConfig[]) {
    if (configs) {
      for (const config of configs) {
        this.add(config);
      }
    }
  }

  /**
   * Initialize the pipeline with a context
   */
  initialize(context: ProcessorContext): void {
    this.context = context;
    for (const processor of this.processors) {
      if (processor.enabled) {
        processor.initialize(context);
      }
    }
  }

  /**
   * Add a processor from config
   */
  add(config: ProcessorConfig): BaseProcessor {
    const processor = ProcessorRegistry.create(config);
    this.addProcessor(processor);
    return processor;
  }

  /**
   * Add a processor instance directly
   */
  addProcessor(processor: BaseProcessor): void {
    this.processors.push(processor);
    this.sortByPriority();
    
    // Initialize if context is available
    if (this.context && processor.enabled) {
      processor.initialize(this.context);
    }
  }

  /**
   * Add a functional processor
   */
  addFunctional(fn: FunctionalProcessor): BaseProcessor {
    const processor = new FunctionalProcessorWrapper(fn);
    this.addProcessor(processor);
    return processor;
  }

  /**
   * Remove a processor by type
   */
  remove(type: string): boolean {
    const index = this.processors.findIndex(p => p.type === type);
    if (index !== -1) {
      const processor = this.processors[index]!;
      processor.destroy();
      this.processors.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove a processor instance
   */
  removeProcessor(processor: BaseProcessor): boolean {
    const index = this.processors.indexOf(processor);
    if (index !== -1) {
      processor.destroy();
      this.processors.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get a processor by type
   */
  get(type: string): BaseProcessor | undefined {
    return this.processors.find(p => p.type === type);
  }

  /**
   * Get all processors
   */
  getAll(): BaseProcessor[] {
    return [...this.processors];
  }

  /**
   * Enable a processor
   */
  enable(type: string): void {
    const processor = this.get(type);
    if (processor) {
      processor.enabled = true;
      if (this.context) {
        processor.initialize(this.context);
      }
    }
  }

  /**
   * Disable a processor
   */
  disable(type: string): void {
    const processor = this.get(type);
    if (processor) {
      processor.enabled = false;
    }
  }

  /**
   * Check if a processor type exists
   */
  has(type: string): boolean {
    return this.processors.some(p => p.type === type);
  }

  /**
   * Process an event through the pipeline
   */
  process(event: CanvasEvent): void {
    if (!this.context) {
      console.warn('ProcessorPipeline not initialized');
      return;
    }

    for (const processor of this.processors) {
      if (!processor.enabled) {
        continue;
      }

      const result = processor.process(event, this.context);
      
      // If processor returns false, stop propagation
      if (result === false) {
        break;
      }
    }
  }

  /**
   * Sort processors by priority (lower priority runs first)
   */
  private sortByPriority(): void {
    this.processors.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Clear all processors
   */
  clear(): void {
    for (const processor of this.processors) {
      processor.destroy();
    }
    this.processors.length = 0;
  }

  /**
   * Destroy the pipeline
   */
  destroy(): void {
    this.clear();
    this.context = null;
  }
}
