/**
 * `<SchemaToolbar>` — the turnkey control bar for the schema metagraph
 * (`SchemaViewer`), the schema-view analogue of `GraphControlsToolbar`. Up to four
 * groups, assembled into one data-driven `<ToolbarItems>`:
 *
 *   1. **Nodes** — Simple discs ⇄ composite ER **Table** cards.
 *   2. **Layout** — a picker over the **injected** layouts (rendered only when
 *      `layoutOptions` is supplied — the viewer stays layout-package-agnostic).
 *   3. **Edges** — connector routing: Straight · Orthogonal · Curved.
 *   4. **Fit** — fit the metagraph to view.
 *
 * Groups 1–3 are **controlled** (value in → `onChange` out) — the `SchemaViewer`
 * owns that state because it drives what the metagraph renders. **Fit self-wires**
 * from context (the schema canvas) via {@link useViewSection}, so the toolbar must
 * render inside the schema `<GraphCanvas>` (or be handed an explicit `canvas`).
 * Renders a **bare** `<ToolbarItems>` meant to drop into a header slot.
 */

import type { Canvas } from '@invana/canvas';
import { CornerDownRight, Minus, Spline, Table as TableIcon, Circle } from 'lucide-react';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon, ToolbarItem } from '../components';
import { useViewSection } from '@invana/canvas-react';
import type { SchemaEdgeRouting, SchemaNodeMode } from '../views/schema/schema';

const NODE_LABELS: Record<SchemaNodeMode, string> = { simple: 'Simple', table: 'Table' };
const NODE_ICONS: Record<SchemaNodeMode, ToolbarIcon> = { simple: Circle, table: TableIcon };

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
  /** Layout picker (also requires `layoutOptions` to be supplied). */
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
  /**
   * Layout picker: the selected key, the change handler, and the option labels
   * (`{ key: label }`). The layout section renders **only** when `layoutOptions`
   * is non-empty — so a viewer with no injected layouts shows no picker.
   */
  layout?: string;
  onLayoutChange?: (layout: string) => void;
  layoutOptions?: Record<string, string>;
  /** Optional per-layout icons for the segmented picker. */
  layoutIcons?: Record<string, ToolbarIcon>;
  /** Current edge routing. */
  edgeRouting: SchemaEdgeRouting;
  onEdgeRoutingChange: (routing: SchemaEdgeRouting) => void;
  /** Graph layer id the Fit button targets. Default `'graph'`. */
  layerId?: string;
  /** Subtract sections from the default set. */
  sections?: SchemaToolbarSections;
  /** Override the Fit icon. */
  icons?: Partial<Record<'fit', ToolbarIcon>>;
  /** Bar orientation. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Explicit canvas for Fit; defaults to the context (schema) canvas. */
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
  layoutOptions,
  layoutIcons,
  edgeRouting,
  onEdgeRoutingChange,
  layerId = 'graph',
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
  // Layout section only when injected layouts are available.
  const hasLayouts = !!layoutOptions && Object.keys(layoutOptions).length > 0;
  const layoutGroup: ToolbarItem[] =
    s.layout && hasLayouts && layout !== undefined && onLayoutChange
      ? [
          {
            type: 'select',
            key: 'schema-layout',
            label: 'Layout',
            value: layout,
            options: layoutOptions,
            ...(layoutIcons ? { icons: layoutIcons } : {}),
            display: 'segmented',
            onChange: onLayoutChange,
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
