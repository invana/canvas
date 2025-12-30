/**
 * Built-in Processors
 * 
 * Example processors that ship with canvas-core
 */

import type { ProcessorConfig, ProcessorContext, CanvasEvent } from '../types';
// LEGACY: Old NodeData type removed, needs refactoring
type NodeData = any;
import { BaseProcessor } from './BaseProcessor';

// =============================================================================
// LoggingProcessor - Logs all events (useful for debugging)
// =============================================================================

export class LoggingProcessor extends BaseProcessor {
  constructor(config: ProcessorConfig) {
    super({ ...config, type: 'logging' });
  }

  initialize(_context: ProcessorContext): void {
    console.log('[LoggingProcessor] Initialized');
  }

  process(event: CanvasEvent, _context: ProcessorContext): void {
    const logLevel = this.options.level as string ?? 'debug';
    const prefix = this.options.prefix as string ?? '[Canvas]';
    
    if (logLevel === 'verbose') {
      console.log(`${prefix} ${event.type}`, event);
    } else {
      console.log(`${prefix} ${event.type}`);
    }
  }

  destroy(): void {
    console.log('[LoggingProcessor] Destroyed');
  }
}

// =============================================================================
// SelectionProcessor - Manages node/edge selection state
// =============================================================================

export class SelectionProcessor extends BaseProcessor {
  private selectedNodes: Set<string> = new Set();
  private selectedEdges: Set<string> = new Set();

  constructor(config: ProcessorConfig) {
    super({ ...config, type: 'selection' });
  }

  initialize(_context: ProcessorContext): void {
    this.selectedNodes.clear();
    this.selectedEdges.clear();
  }

  process(event: CanvasEvent, context: ProcessorContext): void {
    switch (event.type) {
      case 'node:clicked':
        this.handleNodeClick(event, context);
        break;
      case 'edge:clicked':
        this.handleEdgeClick(event, context);
        break;
    }
  }

  private handleNodeClick(event: CanvasEvent, _context: ProcessorContext): void {
    const nodeId = (event.target as NodeData)?.id;
    if (!nodeId) return;

    const multiSelect = this.options.multiSelect as boolean ?? false;
    const originalEvent = event.originalEvent as MouseEvent | undefined;
    const isModifierPressed = originalEvent?.ctrlKey || originalEvent?.metaKey;

    if (multiSelect && isModifierPressed) {
      // Toggle selection
      if (this.selectedNodes.has(nodeId)) {
        this.selectedNodes.delete(nodeId);
      } else {
        this.selectedNodes.add(nodeId);
      }
    } else {
      // Single selection
      this.selectedNodes.clear();
      this.selectedNodes.add(nodeId);
    }
  }

  private handleEdgeClick(event: CanvasEvent, _context: ProcessorContext): void {
    const edgeId = (event.target as { id?: string })?.id;
    if (!edgeId) return;

    this.selectedEdges.clear();
    this.selectedEdges.add(edgeId);
  }

  getSelectedNodes(): string[] {
    return Array.from(this.selectedNodes);
  }

  getSelectedEdges(): string[] {
    return Array.from(this.selectedEdges);
  }

  clearSelection(): void {
    this.selectedNodes.clear();
    this.selectedEdges.clear();
  }

  destroy(): void {
    this.clearSelection();
  }
}

// =============================================================================
// HighlightNeighborsProcessor - Highlights neighbors on hover
// =============================================================================

export class HighlightNeighborsProcessor extends BaseProcessor {
  constructor(config: ProcessorConfig) {
    super({ ...config, type: 'highlight-neighbors' });
  }

  initialize(_context: ProcessorContext): void {}

  process(event: CanvasEvent, _context: ProcessorContext): void {
    if (event.type === 'node:hover') {
      // Could add logic to highlight neighbors using sceneGraph
      // _context.sceneGraph.getNeighbors(nodeId)
    } else if (event.type === 'node:hoverend') {
      // Remove highlights
    }
  }

  destroy(): void {}
}

// =============================================================================
// ZoomLevelProcessor - Adjusts detail level based on zoom
// =============================================================================

export class ZoomLevelProcessor extends BaseProcessor {
  private currentDetailLevel: 'low' | 'medium' | 'high' = 'medium';

  constructor(config: ProcessorConfig) {
    super({ ...config, type: 'zoom-level' });
  }

  initialize(_context: ProcessorContext): void {
    this.currentDetailLevel = 'medium';
  }

  process(event: CanvasEvent, _context: ProcessorContext): void {
    if (event.type === 'viewport:zoomed') {
      const zoom = event.data as number;
      const lowThreshold = this.options.lowThreshold as number ?? 0.3;
      const highThreshold = this.options.highThreshold as number ?? 1.5;

      if (zoom < lowThreshold) {
        this.setDetailLevel('low');
      } else if (zoom > highThreshold) {
        this.setDetailLevel('high');
      } else {
        this.setDetailLevel('medium');
      }
    }
  }

  private setDetailLevel(level: 'low' | 'medium' | 'high'): void {
    if (this.currentDetailLevel !== level) {
      this.currentDetailLevel = level;
      // Could emit event or update rendering
    }
  }

  getDetailLevel(): 'low' | 'medium' | 'high' {
    return this.currentDetailLevel;
  }

  destroy(): void {}
}
