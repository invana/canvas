/**
 * ProcessorRegistry - Registry for processor types
 * 
 * Allows registration of processor constructors by type name
 */

import type { ProcessorConfig } from '../types';
import { BaseProcessor, FunctionalProcessor, FunctionalProcessorWrapper } from './BaseProcessor';

export type ProcessorConstructor = new (config: ProcessorConfig) => BaseProcessor;

export class ProcessorRegistry {
  private static readonly processors: Map<string, ProcessorConstructor> = new Map();
  private static readonly functionalProcessors: Map<string, FunctionalProcessor> = new Map();

  /**
   * Register a processor class
   */
  static register(type: string, constructor: ProcessorConstructor): void {
    if (ProcessorRegistry.processors.has(type)) {
      console.warn(`Processor "${type}" is already registered. Overwriting.`);
    }
    ProcessorRegistry.processors.set(type, constructor);
  }

  /**
   * Register a functional processor
   */
  static registerFunctional(processor: FunctionalProcessor): void {
    if (ProcessorRegistry.functionalProcessors.has(processor.type)) {
      console.warn(`Processor "${processor.type}" is already registered. Overwriting.`);
    }
    ProcessorRegistry.functionalProcessors.set(processor.type, processor);
  }

  /**
   * Get a processor constructor by type
   */
  static get(type: string): ProcessorConstructor | undefined {
    return ProcessorRegistry.processors.get(type);
  }

  /**
   * Get a functional processor by type
   */
  static getFunctional(type: string): FunctionalProcessor | undefined {
    return ProcessorRegistry.functionalProcessors.get(type);
  }

  /**
   * Create a processor instance from config
   */
  static create(config: ProcessorConfig): BaseProcessor {
    // First check class-based processors
    const Constructor = ProcessorRegistry.processors.get(config.type);
    if (Constructor) {
      return new Constructor(config);
    }

    // Then check functional processors
    const functional = ProcessorRegistry.functionalProcessors.get(config.type);
    if (functional) {
      return new FunctionalProcessorWrapper({
        ...functional,
        enabled: config.enabled ?? functional.enabled,
        priority: config.priority ?? functional.priority,
      });
    }

    throw new Error(`Unknown processor type: "${config.type}"`);
  }

  /**
   * Check if a processor type is registered
   */
  static has(type: string): boolean {
    return ProcessorRegistry.processors.has(type) || 
           ProcessorRegistry.functionalProcessors.has(type);
  }

  /**
   * Get all registered processor types
   */
  static getTypes(): string[] {
    return [
      ...ProcessorRegistry.processors.keys(),
      ...ProcessorRegistry.functionalProcessors.keys(),
    ];
  }

  /**
   * Clear all registered processors
   */
  static clear(): void {
    ProcessorRegistry.processors.clear();
    ProcessorRegistry.functionalProcessors.clear();
  }
}
