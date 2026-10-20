/**
 * The board's rail panels, as `BoardPanels` takes them: Legend · Styling ·
 * History · Element · Changes · Export, in that order.
 *
 * Each panel takes its own props from {@link DefaultBoardPanelsOptions}, so a
 * host adds what only it knows — a model to edit against, a save, a block
 * under the element — without rebuilding the rail. A host's own panel goes in
 * as an ordinary `BoardPanelSpec`; `GraphBoard`'s `panels` hands it this list
 * to insert into.
 */

import type { Canvas } from '@invana/canvas';
import { useBoardMode } from '@invana/canvas-react';
import { type GraphCanvas, UNSAVED_COUNT_COMMAND } from '@invana/graph';
import type { ReactNode } from 'react';
import { ControlItems, HISTORY_CONTROL_ITEMS } from '../control-panels';
import { ChangesCount, ChangesViewPanel, type ChangesViewPanelProps } from '../view-panels/changes';
import { ElementViewPanel, type ElementViewPanelProps } from '../view-panels/element';
import { ExportViewPanel, type ExportViewPanelProps } from '../view-panels/export';
import { HistoryViewPanel } from '../view-panels/history';
import { LegendViewPanel, type LegendViewPanelProps } from '../view-panels/legend';
import { StylingViewPanel } from '../view-panels/styling';
import type { TypeStylingPatch } from '../view-panels/styling/types';
import type { BoardPanelSpec } from './BoardPanels';
import { BOARD_IDS } from './presets';

export interface DefaultBoardPanelsOptions {
  /** The board's styling, controlled — the Styling panel edits it, the board paints it. */
  styling: TypeStylingPatch;
  onStylingChange: (next: TypeStylingPatch) => void;
  /** Legend props. */
  legend?: Omit<LegendViewPanelProps, 'canvas'>;
  /**
   * Element props. `editable` defaults to the board being in Edit: the panel
   * reads in Explore and edits in Edit.
   */
  element?: Omit<ElementViewPanelProps, 'canvas'>;
  /** Changes props — `onSave`, `saveDisabledReason`, `saveTarget`. */
  changes?: Omit<ChangesViewPanelProps, 'canvas'>;
  /** Export props. */
  export?: Omit<ExportViewPanelProps, 'canvas'>;
}

/** The board's rail, in order. */
export function defaultBoardPanels(options: DefaultBoardPanelsOptions): BoardPanelSpec[] {
  const { styling, onStylingChange, legend, element, changes } = options;
  return [
    {
      id: 'legend',
      title: 'Legend',
      icon: 'legend',
      render: (c) => <LegendViewPanel className="p-2" {...legend} canvas={c as GraphCanvas} />,
    },
    {
      id: 'styling',
      title: 'Styling',
      icon: 'palette',
      actions: (
        <ControlItems
          items={[
            {
              type: 'toggle',
              command: 'behaviour.toggle',
              args: { id: BOARD_IDS.sizeByConnections },
              icon: 'size-by-connections',
              label: 'Size by connections',
            },
          ]}
        />
      ),
      // The board paints the styling; the panel only edits it.
      render: (c) => (
        <StylingViewPanel canvas={c as GraphCanvas} apply={false} value={styling} onChange={onStylingChange} />
      ),
    },
    {
      id: 'history',
      title: 'Canvas history',
      icon: 'history',
      actions: <ControlItems items={HISTORY_CONTROL_ITEMS} />,
      render: (c) => <HistoryViewPanel canvas={c} showUndoRedo={false} />,
    },
    {
      id: 'element',
      title: 'Element',
      icon: 'properties',
      modes: ['explore', 'edit'],
      render: (c) => <BoardElementPanel canvas={c} {...element} />,
    },
    {
      id: 'changes',
      title: 'Changes',
      icon: 'changes',
      modes: ['edit'],
      alsoWhen: UNSAVED_COUNT_COMMAND,
      badge: UNSAVED_COUNT_COMMAND,
      count: <ChangesCount />,
      render: (c) => <ChangesViewPanel {...changes} canvas={c} />,
    },
    {
      id: 'export',
      title: 'Export',
      icon: 'download',
      separatorBefore: true,
      render: (c) => <ExportViewPanel {...options.export} canvas={c} />,
    },
  ];
}

/** *Element*: read-only in Explore, editable in Edit — unless the host says otherwise. */
function BoardElementPanel({
  canvas,
  editable,
  ...rest
}: Omit<ElementViewPanelProps, 'canvas'> & { canvas: Canvas }): ReactNode {
  const mode = useBoardMode(canvas);
  return <ElementViewPanel canvas={canvas} editable={editable ?? mode === 'edit'} {...rest} />;
}
