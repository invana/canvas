import type { Canvas } from '@invana/canvas';

import { Panel, PropertiesEditor } from '../components';
import type { PanelPosition } from '../components';
import { useEntityEditor } from '@invana/canvas-react';

export interface InspectorPanelProps {
  /** GraphLayer to read/write. Default `'graph'`. */
  layerId?: string;
  /** Id of the `ClickInspectBehaviour` the edit target is read from. Default `'click-inspect'`. */
  inspectId?: string;
  /** Where the panel pins. Default `'top-right'`. */
  position?: PanelPosition;
  /** Show the label field (nodes, non-`typeAsLabel` mode only). Default `true`. */
  showLabel?: boolean;
  /**
   * Modeller mode — edit a single `type` field on both nodes and edges that also
   * drives the drawn label. Hides the label field for both. Default `false`.
   */
  typeAsLabel?: boolean;
  /** Heading when a node is selected. Default `'Node'`. */
  nodeTitle?: string;
  /** Heading when an edge is selected. Default `'Edge'`. */
  edgeTitle?: string;
  /** Render the bare editor without the `<Panel>` wrapper. Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * @deprecated Use `PropertiesViewPanel` — the same editor, behind a read-only view
 * and an *Edit*, in a board's panel rail.
 *
 * Self-wiring **inspector** — shows a {@link PropertiesEditor} for the single
 * node/edge the user clicked to edit and commits edits (`type` + `data`, a
 * node's label, an edge's reverse) back to the store undoably. The property-editing
 * analogue of `CanvasControlsToolbar`: drop it inside `<Canvas>` and it appears
 * whenever an element is clicked for editing, and renders nothing otherwise.
 *
 * Needs a `ClickInspectBehaviour` (for the click-to-edit target) and, for
 * undoable commits, a graph history (every `GraphCanvas` has one). Remounts the editor
 * (via `key`) when the targeted element changes, so the form reloads from it.
 */
export function InspectorPanel({
  layerId,
  inspectId,
  position = 'top-right',
  showLabel,
  typeAsLabel = false,
  nodeTitle = 'Node',
  edgeTitle = 'Edge',
  bare = false,
  canvas,
  className,
}: InspectorPanelProps) {
  const opts: { layerId?: string; inspectId?: string; typeAsLabel?: boolean } = {};
  if (layerId !== undefined) opts.layerId = layerId;
  if (inspectId !== undefined) opts.inspectId = inspectId;
  if (typeAsLabel) opts.typeAsLabel = true;

  const target = useEntityEditor(opts, canvas);
  if (!target) return null;

  const isEdge = target.kind === 'edge';
  // Every element edits its `type`; a node also edits its `label`, except in
  // `typeAsLabel` mode, where the type is the drawn label.
  const showTypeField = true;
  const showLabelField = !isEdge && !typeAsLabel && (showLabel ?? true);
  const editor = (
    <PropertiesEditor
      key={`${target.kind}:${target.id}`}
      title={isEdge ? edgeTitle : nodeTitle}
      defaults={{ label: target.label, type: target.type, data: target.data }}
      onSubmit={target.commit}
      showLabel={showLabelField}
      {...(showTypeField ? { showType: true } : {})}
      {...(isEdge && target.reverse ? { onReverse: target.reverse } : {})}
      {...(className !== undefined ? { className } : {})}
    />
  );

  if (bare) return editor;
  return (
    <Panel position={position} orientation="vertical">
      {editor}
    </Panel>
  );
}
