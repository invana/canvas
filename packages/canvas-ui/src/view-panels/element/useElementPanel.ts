// useElementPanel — the Element panel's acts, for a host that draws them in its own bar.
//
// `ElementViewPanel` draws Focus · Edit in its body's top row. A host whose panel
// has a bar of its own (a `PanelContent` header, a `FloatingPanel`) draws them
// there instead and passes `inlineActions={false}`: this hook gives it what the
// bar needs — what is shown, whether it is being edited, and the two acts.

import type { Canvas } from '@invana/canvas';
import { useInspectTarget } from '@invana/canvas-react';
import type { GraphLayer } from '@invana/graph';
import { useCallback } from 'react';

import { editElement, elementKey, isEditingNewElement, useElementEditing } from './editing';

export interface UseElementPanelOptions {
  /** GraphLayer the element is read from. Default `'graph'`. */
  layerId?: string;
  /** `ClickInspectBehaviour` id the element is read from. Default `'click-inspect'`. */
  inspectBehaviourId?: string;
  /** Minimum zoom **Focus** zooms a node in to. Default `2`. */
  focusZoom?: number;
}

export interface ElementPanelState {
  /** What the panel shows: `node`, `relationship`, or `null` while nothing is picked. */
  kind: 'node' | 'relationship' | null;
  /** The shown element is open in its editor. */
  editing: boolean;
  /** The element being edited was just drawn. */
  isNew: boolean;
  /** Frame the shown element on the board. */
  focus: () => void;
  /** Open the shown element in its editor. */
  edit: () => void;
}

/**
 * The Element panel's state and acts, for a host's panel bar:
 *
 * ```tsx
 * const el = useElementPanel(canvas);
 * <PanelContent header="Element" headerActions={[
 *   { id: 'focus', label: 'Focus', icon: <Crosshair />, onClick: el.focus },
 *   ...(mode === 'edit' && !el.editing ? [{ id: 'edit', label: 'Edit', icon: <Pencil />, onClick: el.edit }] : []),
 * ]}>
 *   <ElementViewPanel canvas={canvas} editable={mode === 'edit'} inlineActions={false} />
 * </PanelContent>
 * ```
 */
export function useElementPanel(canvas: Canvas | null, options: UseElementPanelOptions = {}): ElementPanelState {
  const { layerId = 'graph', inspectBehaviourId = 'click-inspect', focusZoom = 2 } = options;
  const target = useInspectTarget({ inspectId: inspectBehaviourId }, canvas);
  const editingKey = useElementEditing(canvas);
  const editing = target !== null && editingKey === elementKey(target);

  const focus = useCallback((): void => {
    const layer = canvas?.layers.get<GraphLayer>(layerId);
    if (!layer || !target) return;
    if (target.kind === 'node') layer.focusNode(target.id, { zoom: focusZoom, includeHidden: true });
    else layer.focusEdges([target.id], { includeHidden: true });
  }, [canvas, layerId, target, focusZoom]);

  const edit = useCallback((): void => {
    if (canvas && target) editElement(canvas, target, { inspectBehaviourId });
  }, [canvas, target, inspectBehaviourId]);

  return {
    kind: target ? (target.kind === 'node' ? 'node' : 'relationship') : null,
    editing,
    isNew: editing && canvas ? isEditingNewElement(canvas) : false,
    focus,
    edit,
  };
}
