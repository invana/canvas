import type { CSSProperties } from 'react';

import { Panel, PropertiesViewer } from '../components';
import type { PanelPosition, PropertiesViewerRow } from '../components';
import type { ViewContext } from '../hooks/useViewContext';

export interface PropertyViewerPanelProps {
  /**
   * The clicked element's full context — passed in by the `panel` render-prop of
   * `<ClickViewBehaviour>` (`panel={(ctx) => <PropertyViewerPanel ctx={ctx} />}`).
   */
  ctx: ViewContext;
  /** Where the panel pins. Default `'top-right'`. */
  position?: PanelPosition;
  /** Heading when a node is viewed. Default `'Node'`. */
  nodeTitle?: string;
  /** Heading when an edge is viewed. Default `'Edge'`. */
  edgeTitle?: string;
  /** Show the element id as the card subtitle. Default `true`. */
  showId?: boolean;
  /** Render the bare viewer without the `<Panel>` wrapper. Default `false`. */
  bare?: boolean;
  /**
   * Dock the viewer to the full canvas height on its side (derived from
   * `position` — `*-left` docks left, otherwise right) instead of the floating
   * corner card. Renders translucent + scrollable. Default `false`.
   */
  fullHeight?: boolean;
  /** Width of the docked panel when `fullHeight`, in px. Default `300`. */
  width?: number;
  className?: string;
}

/**
 * The **default** read-only viewer UI for `<ClickViewBehaviour>` — a turnkey
 * `panel` render-prop target. It's presentational: it takes a {@link ViewContext}
 * (resolved by the behaviour wrapper) and renders a {@link PropertiesViewer}
 * (label / type / data, plus source/target for edges) inside a `<Panel>`.
 *
 * Swap it for your own component to customise per use case — e.g. a form editor
 * in a modeller — since the behaviour hands the same `ctx` to whatever you pass:
 *
 * ```tsx
 * <ClickViewBehaviour panel={(ctx) => <PropertyViewerPanel ctx={ctx} />} />        // visualiser
 * <ClickViewBehaviour panel={(ctx) => <ModelEditorPanel ctx={ctx} />} />           // modeller
 * ```
 */
export function PropertyViewerPanel({
  ctx,
  position = 'top-right',
  nodeTitle = 'Node',
  edgeTitle = 'Edge',
  showId = true,
  bare = false,
  fullHeight = false,
  width = 300,
  className,
}: PropertyViewerPanelProps) {
  const isEdge = ctx.kind === 'edge';
  // `type` (the graph-DB label / predicate) and `labelText` (the drawn text) are
  // distinct — show both, as labeled rows, for nodes and edges alike.
  const rows: PropertiesViewerRow[] = [];
  if (ctx.type) rows.push({ label: 'Type', value: ctx.type });
  if (ctx.label) rows.push({ label: 'Label', value: ctx.label });
  if (isEdge) {
    rows.push({ label: 'Source', value: ctx.source ?? '', mono: true });
    rows.push({ label: 'Target', value: ctx.target ?? '', mono: true });
  }

  const viewer = (
    <PropertiesViewer
      title={isEdge ? edgeTitle : nodeTitle}
      onClose={ctx.close}
      {...(showId ? { subtitle: ctx.id } : {})}
      rows={rows}
      data={ctx.data}
      {...(fullHeight ? { style: fullHeightCardStyle(width) } : {})}
      {...(className !== undefined ? { className } : {})}
    />
  );

  if (bare) return viewer;

  // Full-height dock — a translucent, scrollable sidebar spanning the canvas
  // height on one side. Bypasses `<Panel>` (which only pins to a corner) but
  // keeps its pointer-events discipline: the positioner is click-through, only
  // the card captures.
  if (fullHeight) {
    const side: 'left' | 'right' = position.includes('left') ? 'left' : 'right';
    return (
      <div style={{ ...dockOuterStyle, [side]: 0 }}>{viewer}</div>
    );
  }

  return (
    <Panel position={position} orientation="vertical">
      {viewer}
    </Panel>
  );
}

const dockOuterStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  zIndex: 5,
  // Click-through frame; the card itself (pointerEvents from cardStyle) captures.
  pointerEvents: 'none',
};

/** Card overrides that turn the floating card into a translucent full-height dock. */
function fullHeightCardStyle(width: number): CSSProperties {
  return {
    height: '100%',
    width,
    minWidth: 0,
    maxWidth: 'none',
    borderRadius: 0,
    overflowY: 'auto',
    pointerEvents: 'auto',
    // Slight transparency + blur so the canvas reads through without hurting
    // legibility. `color-mix` keeps it theme-token-driven.
    background: 'color-mix(in srgb, var(--color-popover) 85%, transparent)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  } as CSSProperties;
}
