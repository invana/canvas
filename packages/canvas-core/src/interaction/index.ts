/**
 * Interaction module - User interaction management
 * 
 * Provides managers for:
 * - Selection (single/multi-select nodes and edges)
 * - Drag and drop
 * - Hover states
 * - Keyboard shortcuts
 * 
 * Note: This module is a placeholder for future implementation.
 * Currently, interaction is handled within the element shapes themselves.
 */

// TODO: InteractionManager - coordinate all interaction handlers
// TODO: SelectionManager - track and manage selected elements
// TODO: DragManager - handle drag operations with constraints
// TODO: HoverManager - manage hover states across elements

export { InteractionManager } from './InteractionManager';
export type { InteractionConfig, InteractionEventType, InteractionEventCallback } from './InteractionManager';

export { SelectionManager } from './SelectionManager';
export type { SelectableElement, SelectionConfig, SelectionEventCallback } from './SelectionManager';

export { DragManager } from './DragManager';
export type { DragConfig, DragData, DragEventType, DragEventCallback } from './DragManager';

export { HoverManager } from './HoverManager';
export type { HoverableElement, HoverConfig, HoverEventType, HoverEventCallback } from './HoverManager';
