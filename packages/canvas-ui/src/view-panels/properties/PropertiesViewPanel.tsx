// PropertiesViewPanel — the clicked node or relationship, read-only, or its editor.
//
// One panel for both readings of an element, because a board needs them in one
// place: a click shows what the element is (`ElementInspectorViewPanel`); *Edit*
// — the panel's own button, or `editProperties` from a context menu or a drawing
// tool — swaps in the generated form (`PropertiesEditor`). Apply saves through
// `useEntityEditor` (undoable, one history entry) and goes back to the view;
// Cancel goes back without saving; clicking another element leaves the editor.
//
// `editable` is the host's: a board passes its mode (`editable={mode === 'edit'}`),
// so the same panel is a viewer in Explore and an editor in Edit.

import type { Canvas } from '@invana/canvas';
import type { GraphCanvas, GraphEdge, GraphNode } from '@invana/graph';
import { useEntityEditor } from '@invana/canvas-react';
import { Button } from '@invana/ui';
import { Pencil } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

import { PropertiesEditor } from '../../components/PropertiesEditor';
import { ElementInspectorViewPanel } from '../element-inspector';
import { editProperties, propertiesKey, stopEditingProperties, usePropertiesEditing } from './editing';

export interface PropertiesViewPanelProps {
  /** The live canvas engine (null until `<Canvas>` publishes it). */
  canvas: Canvas | null;
  /** GraphLayer the element is read from and written to. Default `'graph'`. */
  layerId?: string;
  /** `ClickInspectBehaviour` id the element is read from. Default `'click-inspect'`. */
  inspectBehaviourId?: string;
  /** Allow editing — the *Edit* button and `editProperties`. Default `true`. */
  editable?: boolean;
  /**
   * Modeller mode: one `type` field that is also the drawn label, for nodes and
   * relationships alike. Default `false` — a node edits its label and its type.
   */
  typeAsLabel?: boolean;
  /** The editor's heading for a node. Default `'Node'`. */
  nodeTitle?: string;
  /** The editor's heading for a relationship. Default `'Relationship'`. */
  edgeTitle?: string;
  /** Minimum zoom **Focus** zooms a node in to. Default `2`. */
  focusZoom?: number;
  /** App-specific content in the view, between identity and properties. */
  renderExtra?: (element: GraphNode | GraphEdge, kind: 'node' | 'edge') => ReactNode;
  /** Extra classes for the panel root. */
  className?: string;
}

/**
 * The **Properties** panel: the clicked node or relationship, read-only, with an
 * *Edit* that turns it into the element's editor. Needs a `ClickInspectBehaviour`
 * (it reads the click from it) and, for undoable saves, a graph history.
 *
 * ```tsx
 * { id: 'properties', title: 'Properties', render: (c) => <PropertiesViewPanel canvas={c} editable={mode === 'edit'} /> }
 * // from a context menu, or a drawing tool's onNodeCreate:
 * editProperties(canvas, { kind: 'node', id });
 * ```
 */
export function PropertiesViewPanel({
  canvas,
  layerId = 'graph',
  inspectBehaviourId = 'click-inspect',
  editable = true,
  typeAsLabel = false,
  nodeTitle = 'Node',
  edgeTitle = 'Relationship',
  focusZoom,
  renderExtra,
  className,
}: PropertiesViewPanelProps) {
  const target = useEntityEditor({ layerId, inspectId: inspectBehaviourId, typeAsLabel }, canvas);
  const editingKey = usePropertiesEditing(canvas);
  const key = target ? propertiesKey(target) : null;
  const editing = editable && key !== null && editingKey === key;

  // Clicking another element (or the board) leaves the editor; so does losing edit rights.
  useEffect(() => {
    if (canvas && editingKey !== null && (!editable || editingKey !== key)) stopEditingProperties(canvas);
  }, [canvas, editable, editingKey, key]);

  if (editing && target && canvas) {
    const isEdge = target.kind === 'edge';
    return (
      <PropertiesEditor
        key={key}
        title={isEdge ? edgeTitle : nodeTitle}
        defaults={{ label: target.label, type: target.type, data: target.data }}
        showLabel={!isEdge && !typeAsLabel}
        showType
        {...(isEdge && target.reverse ? { onReverse: target.reverse } : {})}
        onCancel={() => stopEditingProperties(canvas)}
        onSubmit={(values) => {
          target.commit(values);
          stopEditingProperties(canvas);
        }}
        {...(className !== undefined ? { className } : {})}
      />
    );
  }

  return (
    <ElementInspectorViewPanel
      canvas={canvas as GraphCanvas | null}
      layerId={layerId}
      inspectBehaviourId={inspectBehaviourId}
      {...(focusZoom !== undefined ? { focusZoom } : {})}
      {...(renderExtra ? { renderExtra } : {})}
      {...(className !== undefined ? { className } : {})}
      actions={
        editable && target && canvas ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editProperties(canvas, target, { inspectBehaviourId })}
            className="gap-1.5 [&_svg]:size-3.5"
          >
            <Pencil className="text-muted-foreground/70" />
            Edit
          </Button>
        ) : undefined
      }
    />
  );
}
