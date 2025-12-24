/**
 * Selection Manager - handles node and edge selection
 */

export type SelectionChangeHandler = (
  selectedNodes: string[],
  selectedEdges: string[],
  previousNodes: string[],
  previousEdges: string[],
) => void;

export interface SelectionManagerConfig {
  multiSelect?: boolean;
  selectNodes?: boolean;
  selectEdges?: boolean;
}

export class SelectionManager {
  private _selectedNodes: Set<string> = new Set();
  private _selectedEdges: Set<string> = new Set();
  private _handlers: SelectionChangeHandler[] = [];
  private _config: Required<SelectionManagerConfig>;

  constructor(config: SelectionManagerConfig = {}) {
    this._config = {
      multiSelect: config.multiSelect ?? true,
      selectNodes: config.selectNodes ?? true,
      selectEdges: config.selectEdges ?? true,
    };
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  configure(config: Partial<SelectionManagerConfig>): void {
    Object.assign(this._config, config);
  }

  get config(): Required<SelectionManagerConfig> {
    return { ...this._config };
  }

  // ============================================================================
  // Node Selection
  // ============================================================================

  selectNode(id: string, additive = false): void {
    if (!this._config.selectNodes) return;

    const previousNodes = this.selectedNodes;
    const previousEdges = this.selectedEdges;

    if (!additive || !this._config.multiSelect) {
      this._selectedNodes.clear();
      this._selectedEdges.clear();
    }

    this._selectedNodes.add(id);
    this._notifyChange(previousNodes, previousEdges);
  }

  deselectNode(id: string): void {
    if (!this._selectedNodes.has(id)) return;

    const previousNodes = this.selectedNodes;
    const previousEdges = this.selectedEdges;

    this._selectedNodes.delete(id);
    this._notifyChange(previousNodes, previousEdges);
  }

  toggleNodeSelection(id: string, additive = false): void {
    if (this._selectedNodes.has(id)) {
      this.deselectNode(id);
    } else {
      this.selectNode(id, additive);
    }
  }

  selectNodes(ids: string[], additive = false): void {
    if (!this._config.selectNodes) return;

    const previousNodes = this.selectedNodes;
    const previousEdges = this.selectedEdges;

    if (!additive || !this._config.multiSelect) {
      this._selectedNodes.clear();
      this._selectedEdges.clear();
    }

    for (const id of ids) {
      this._selectedNodes.add(id);
    }

    this._notifyChange(previousNodes, previousEdges);
  }

  isNodeSelected(id: string): boolean {
    return this._selectedNodes.has(id);
  }

  get selectedNodes(): string[] {
    return Array.from(this._selectedNodes);
  }

  // ============================================================================
  // Edge Selection
  // ============================================================================

  selectEdge(id: string, additive = false): void {
    if (!this._config.selectEdges) return;

    const previousNodes = this.selectedNodes;
    const previousEdges = this.selectedEdges;

    if (!additive || !this._config.multiSelect) {
      this._selectedNodes.clear();
      this._selectedEdges.clear();
    }

    this._selectedEdges.add(id);
    this._notifyChange(previousNodes, previousEdges);
  }

  deselectEdge(id: string): void {
    if (!this._selectedEdges.has(id)) return;

    const previousNodes = this.selectedNodes;
    const previousEdges = this.selectedEdges;

    this._selectedEdges.delete(id);
    this._notifyChange(previousNodes, previousEdges);
  }

  toggleEdgeSelection(id: string, additive = false): void {
    if (this._selectedEdges.has(id)) {
      this.deselectEdge(id);
    } else {
      this.selectEdge(id, additive);
    }
  }

  selectEdges(ids: string[], additive = false): void {
    if (!this._config.selectEdges) return;

    const previousNodes = this.selectedNodes;
    const previousEdges = this.selectedEdges;

    if (!additive || !this._config.multiSelect) {
      this._selectedNodes.clear();
      this._selectedEdges.clear();
    }

    for (const id of ids) {
      this._selectedEdges.add(id);
    }

    this._notifyChange(previousNodes, previousEdges);
  }

  isEdgeSelected(id: string): boolean {
    return this._selectedEdges.has(id);
  }

  get selectedEdges(): string[] {
    return Array.from(this._selectedEdges);
  }

  // ============================================================================
  // Combined Operations
  // ============================================================================

  selectAll(nodeIds: string[], edgeIds: string[]): void {
    const previousNodes = this.selectedNodes;
    const previousEdges = this.selectedEdges;

    this._selectedNodes.clear();
    this._selectedEdges.clear();

    if (this._config.selectNodes) {
      for (const id of nodeIds) {
        this._selectedNodes.add(id);
      }
    }
    if (this._config.selectEdges) {
      for (const id of edgeIds) {
        this._selectedEdges.add(id);
      }
    }

    this._notifyChange(previousNodes, previousEdges);
  }

  clearSelection(): void {
    if (this._selectedNodes.size === 0 && this._selectedEdges.size === 0) return;

    const previousNodes = this.selectedNodes;
    const previousEdges = this.selectedEdges;

    this._selectedNodes.clear();
    this._selectedEdges.clear();

    this._notifyChange(previousNodes, previousEdges);
  }

  get hasSelection(): boolean {
    return this._selectedNodes.size > 0 || this._selectedEdges.size > 0;
  }

  get selectionCount(): number {
    return this._selectedNodes.size + this._selectedEdges.size;
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  onChange(handler: SelectionChangeHandler): () => void {
    this._handlers.push(handler);
    return () => {
      const index = this._handlers.indexOf(handler);
      if (index >= 0) {
        this._handlers.splice(index, 1);
      }
    };
  }

  private _notifyChange(previousNodes: string[], previousEdges: string[]): void {
    const selectedNodes = this.selectedNodes;
    const selectedEdges = this.selectedEdges;

    for (const handler of this._handlers) {
      handler(selectedNodes, selectedEdges, previousNodes, previousEdges);
    }
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  serialize(): { nodes: string[]; edges: string[] } {
    return {
      nodes: this.selectedNodes,
      edges: this.selectedEdges,
    };
  }

  deserialize(data: { nodes?: string[]; edges?: string[] }): void {
    this._selectedNodes.clear();
    this._selectedEdges.clear();

    if (data.nodes) {
      for (const id of data.nodes) {
        this._selectedNodes.add(id);
      }
    }
    if (data.edges) {
      for (const id of data.edges) {
        this._selectedEdges.add(id);
      }
    }
  }
}
