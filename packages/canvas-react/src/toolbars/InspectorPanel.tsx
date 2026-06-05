import type { Canvas as EngineCanvas } from '@invana/canvas';

import { Panel, PropertiesEditor } from '../components';
import type { PanelPosition } from '../components';
import { useEntityEditor } from '../hooks/useEntityEditor';

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
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring **inspector** — shows a {@link PropertiesEditor} for the single
 * node/edge the user clicked to edit and commits edits (label + `data`, plus
 * `type` + reverse for edges) back to the store undoably. The property-editing
 * analogue of `CanvasControlsToolbar`: drop it inside `<Canvas>` and it appears
 * whenever an element is clicked for editing, and renders nothing otherwise.
 *
 * Needs a `ClickInspectBehaviour` (for the click-to-edit target) and, for
 * undoable commits, a `<GraphHistoryProvider>` ancestor. Remounts the editor
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
  // The `type` field shows for edges always, and for nodes too in `typeAsLabel`
  // mode; the `label` field shows only for nodes when NOT in `typeAsLabel` mode.
  const showTypeField = typeAsLabel || isEdge;
  const showLabelField = !showTypeField && (showLabel ?? true);
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
