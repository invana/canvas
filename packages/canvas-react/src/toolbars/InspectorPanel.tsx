import type { Canvas as EngineCanvas } from '@invana/canvas';

import { Panel, PropertiesEditor } from '../components';
import type { PanelPosition } from '../components';
import { useEntityEditor } from '../hooks/useEntityEditor';

export interface InspectorPanelProps {
  /** GraphLayer to read/write. Default `'graph'`. */
  layerId?: string;
  /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Where the panel pins. Default `'top-right'`. */
  position?: PanelPosition;
  /** Show the label field. Default `true`. */
  showLabel?: boolean;
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
 * selected node/edge and commits edits (label + `data`) back to the store
 * undoably. The property-editing analogue of `CanvasControlsToolbar`: drop it
 * inside `<Canvas>` and it appears whenever exactly one element is selected,
 * and renders nothing otherwise.
 *
 * Needs a `ClickSelectBehaviour` (for selection) and, for undoable commits, a
 * `<GraphHistoryProvider>` ancestor. Remounts the editor (via `key`) when the
 * selected element changes, so the form reloads from the new element.
 */
export function InspectorPanel({
  layerId,
  clickSelectId,
  position = 'top-right',
  showLabel,
  nodeTitle = 'Node',
  edgeTitle = 'Edge',
  bare = false,
  canvas,
  className,
}: InspectorPanelProps) {
  const opts: { layerId?: string; clickSelectId?: string } = {};
  if (layerId !== undefined) opts.layerId = layerId;
  if (clickSelectId !== undefined) opts.clickSelectId = clickSelectId;

  const target = useEntityEditor(opts, canvas);
  if (!target) return null;

  const editor = (
    <PropertiesEditor
      key={`${target.kind}:${target.id}`}
      title={target.kind === 'node' ? nodeTitle : edgeTitle}
      defaults={{ label: target.label, data: target.data }}
      onSubmit={target.commit}
      {...(showLabel !== undefined ? { showLabel } : {})}
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
