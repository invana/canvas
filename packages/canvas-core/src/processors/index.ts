/**
 * Processors module - Extensible behavior customization
 */

export { BaseProcessor, FunctionalProcessorWrapper } from './BaseProcessor';
export type { FunctionalProcessor } from './BaseProcessor';
export { ProcessorRegistry } from './ProcessorRegistry';
export type { ProcessorConstructor } from './ProcessorRegistry';
export { ProcessorPipeline } from './ProcessorPipeline';

// Built-in processors
export {
  LoggingProcessor,
  SelectionProcessor,
  HighlightNeighborsProcessor,
  ZoomLevelProcessor,
} from './builtins';

// Register built-in processors
import { ProcessorRegistry } from './ProcessorRegistry';
import {
  LoggingProcessor,
  SelectionProcessor,
  HighlightNeighborsProcessor,
  ZoomLevelProcessor,
} from './builtins';

ProcessorRegistry.register('logging', LoggingProcessor);
ProcessorRegistry.register('selection', SelectionProcessor);
ProcessorRegistry.register('highlight-neighbors', HighlightNeighborsProcessor);
ProcessorRegistry.register('zoom-level', ZoomLevelProcessor);
