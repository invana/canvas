/**
 * `<SchemaToolbar>` — the turnkey control bar for the schema metagraph
 * (`SchemaViewer`), the schema-view analogue of `GraphControlsToolbar`. Four
 * groups, assembled into one data-driven `<ToolbarItems>`:
 *
 *   1. **Nodes** — Simple discs ⇄ composite ER **Table** cards.
 *   2. **Layout** — Hierarchical (ELK) ⇄ Force (d3).
 *   3. **Edges** — connector routing: Straight · Orthogonal · Curved.
 *   4. **Fit** — fit the metagraph to view.
 *
 * Groups 1–3 are **controlled** (value in → `onChange` out) — the `SchemaViewer`
 * owns that state because it drives what the metagraph renders. **Fit self-wires**
 * from context (the inner schema canvas) via {@link useViewSection}, so the
 * toolbar must render inside the schema `<GraphCanvas>` (or be handed an explicit
 * `canvas`). Renders a **bare** `<ToolbarItems>` meant to drop into a header slot.
 */

import type { Canvas } from '@invana/canvas';
import { CornerDownRight, Minus, Share2, Spline, Table as TableIcon, Circle, Workflow } from 'lucide-react';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon, ToolbarItem } from '../components';
import { useViewSection } from '@invana/canvas-react';
import type {
  SchemaEdgeRouting,
  SchemaLayoutKind,
  SchemaNodeMode,
} from '../views/schema/schema';

const NODE_LABELS: Record<SchemaNodeMode, string> = { simple: 'Simple', table: 'Table' };
const NODE_ICONS: Record<SchemaNodeMode, ToolbarIcon> = { simple: Circle, table: TableIcon };

const LAYOUT_ICONS: Record<SchemaLayoutKind, ToolbarIcon> = { elk: Workflow, force: Share2 };
const DEFAULT_LAYOUT_LABELS: Record<SchemaLayoutKind, string> = { elk: 'Hierarchical', force: 'Force' };

const EDGE_LABELS: Record<SchemaEdgeRouting, string> = {
  straight: 'Straight',
  orth: 'Orthogonal',
  bezier: 'Curved',
};
const EDGE_ICONS: Record<SchemaEdgeRouting, ToolbarIcon> = {
  straight: Minus,
  orth: CornerDownRight,
  bezier: Spline,
};

/** Per-section visibility. Omitted keys default on. */
export interface SchemaToolbarSections {
  /** Simple ⇄ Table node mode. */
  nodes?: boolean;
  /** Layout picker. */
  layout?: boolean;
  /** Edge routing picker. */
  edges?: boolean;
  /** Fit-to-content. */
  fit?: boolean;
}

export interface SchemaToolbarProps {
  /** Current node-render mode. */
  nodeMode: SchemaNodeMode;
  onNodeModeChange: (mode: SchemaNodeMode) => void;
  /** Current layout. */
  layout: SchemaLayoutKind;
  onLayoutChange: (layout: SchemaLayoutKind) => void;
  /** Labels for the layout options. Default `{ elk: 'Hierarchical', force: 'Force' }`. */
  layoutLabels?: Record<SchemaLayoutKind, string>;
  /** Current edge routing. */
  edgeRouting: SchemaEdgeRouting;
  onEdgeRoutingChange: (routing: SchemaEdgeRouting) => void;
  /** Schema layer id the Fit button targets. Default `'schema'`. */
  layerId?: string;
  /** Subtract sections from the default set. */
  sections?: SchemaToolbarSections;
  /** Override the Fit icon. */
  icons?: Partial<Record<'fit', ToolbarIcon>>;
  /** Bar orientation. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Explicit canvas for Fit; defaults to the context (inner schema) canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/** Join non-empty groups with dividers (no leading / trailing / doubled dividers). */
function assemble(groups: ToolbarItem[][]): ToolbarItem[] {
  const present = groups.filter((g) => g.length > 0);
  return present.flatMap((g, i) => (i === 0 ? g : [{ type: 'divider', key: `d${i}` } as ToolbarItem, ...g]));
}

/**
 * The schema metagraph's control bar — node mode · layout · edge routing · fit.
 * Controlled for the first three (the `SchemaViewer` owns them); Fit self-wires.
 * Render inside the schema `<GraphCanvas>` so Fit resolves the right instance.
 */
export function SchemaToolbar({
  nodeMode,
  onNodeModeChange,
  layout,
  onLayoutChange,
  layoutLabels = DEFAULT_LAYOUT_LABELS,
  edgeRouting,
  onEdgeRoutingChange,
  layerId = 'schema',
  sections,
  icons,
  orientation = 'horizontal',
  canvas,
  className,
}: SchemaToolbarProps) {
  const s: Required<SchemaToolbarSections> = {
    nodes: true,
    layout: true,
    edges: true,
    fit: true,
    ...sections,
  };

  // Fit rides the view section (zoom + lock off → just the fit item).
  const viewItems = useViewSection({ showZoom: false, showLock: false, layerId, canvas });

  const nodeGroup: ToolbarItem[] = s.nodes
    ? [
        {
          type: 'select',
          key: 'schema-node-mode',
          label: 'Nodes',
          value: nodeMode,
          options: NODE_LABELS,
          icons: NODE_ICONS,
          display: 'segmented',
          onChange: (v) => onNodeModeChange(v as SchemaNodeMode),
        },
      ]
    : [];
  const layoutGroup: ToolbarItem[] = s.layout
    ? [
        {
          type: 'select',
          key: 'schema-layout',
          label: 'Layout',
          value: layout,
          options: layoutLabels,
          icons: LAYOUT_ICONS,
          display: 'segmented',
          onChange: (v) => onLayoutChange(v as SchemaLayoutKind),
        },
      ]
    : [];
  const edgeGroup: ToolbarItem[] = s.edges
    ? [
        {
          type: 'select',
          key: 'schema-edge-routing',
          label: 'Edges',
          value: edgeRouting,
          options: EDGE_LABELS,
          icons: EDGE_ICONS,
          display: 'segmented',
          onChange: (v) => onEdgeRoutingChange(v as SchemaEdgeRouting),
        },
      ]
    : [];
  const fitGroup: ToolbarItem[] = s.fit ? applyIconOverrides(viewItems, icons) : [];

  const items = assemble([nodeGroup, layoutGroup, edgeGroup, fitGroup]);
  return <ToolbarItems items={items} orientation={orientation} className={className} />;
}
