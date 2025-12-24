/**
 * State Manager - handles node and edge states
 */

import type { EdgeState, NodeState } from '../types/index.js';

export type StateChangeHandler<T extends NodeState | EdgeState> = (
  id: string,
  newStates: Set<T>,
  oldStates: Set<T>,
) => void;

export class StateManager<T extends NodeState | EdgeState> {
  private _states: Map<string, Set<T>> = new Map();
  private _handlers: StateChangeHandler<T>[] = [];

  /**
   * Get states for an element
   */
  getStates(id: string): Set<T> {
    return this._states.get(id) ?? new Set(['default'] as T[]);
  }

  /**
   * Check if element has a specific state
   */
  hasState(id: string, state: T): boolean {
    return this.getStates(id).has(state);
  }

  /**
   * Add a state to an element
   */
  addState(id: string, state: T): void {
    const currentStates = this.getStates(id);
    if (currentStates.has(state)) return;

    const oldStates = new Set(currentStates);
    const newStates = new Set(currentStates);
    
    // Remove 'default' when adding other states
    if (state !== 'default') {
      newStates.delete('default' as T);
    }
    newStates.add(state);

    this._states.set(id, newStates);
    this._notifyChange(id, newStates, oldStates);
  }

  /**
   * Remove a state from an element
   */
  removeState(id: string, state: T): void {
    const currentStates = this.getStates(id);
    if (!currentStates.has(state)) return;

    const oldStates = new Set(currentStates);
    const newStates = new Set(currentStates);
    newStates.delete(state);

    // Add 'default' back if no other states
    if (newStates.size === 0) {
      newStates.add('default' as T);
    }

    this._states.set(id, newStates);
    this._notifyChange(id, newStates, oldStates);
  }

  /**
   * Set states for an element (replaces existing)
   */
  setStates(id: string, states: T[]): void {
    const oldStates = this.getStates(id);
    const newStates = new Set(states.length > 0 ? states : ['default' as T]);

    this._states.set(id, newStates);
    this._notifyChange(id, newStates, oldStates);
  }

  /**
   * Clear all states for an element (reset to default)
   */
  clearStates(id: string): void {
    const oldStates = this.getStates(id);
    const newStates = new Set(['default'] as T[]);

    this._states.set(id, newStates);
    this._notifyChange(id, newStates, oldStates);
  }

  /**
   * Remove element from state tracking
   */
  remove(id: string): void {
    this._states.delete(id);
  }

  /**
   * Clear all state tracking
   */
  clear(): void {
    this._states.clear();
  }

  /**
   * Get all elements with a specific state
   */
  getElementsWithState(state: T): string[] {
    const result: string[] = [];
    this._states.forEach((states, id) => {
      if (states.has(state)) {
        result.push(id);
      }
    });
    return result;
  }

  /**
   * Subscribe to state changes
   */
  onChange(handler: StateChangeHandler<T>): () => void {
    this._handlers.push(handler);
    return () => {
      const index = this._handlers.indexOf(handler);
      if (index >= 0) {
        this._handlers.splice(index, 1);
      }
    };
  }

  private _notifyChange(id: string, newStates: Set<T>, oldStates: Set<T>): void {
    for (const handler of this._handlers) {
      handler(id, newStates, oldStates);
    }
  }
}

/**
 * Node-specific state manager
 */
export class NodeStateManager extends StateManager<NodeState> {}

/**
 * Edge-specific state manager
 */
export class EdgeStateManager extends StateManager<EdgeState> {}
