import type { Canvas, ControlItemSpec } from '@invana/canvas';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon } from '../components';
import { useControlItems } from '../control-panels/ControlItems';
import { eraseSpec } from './controlSpecs';

export interface EditToolbarProps {
  /** Override the baked icons, by item key. */
  icons?: Partial<Record<'cut' | 'copy' | 'paste' | 'erase', ToolbarIcon>>;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Show the erase button. Default `true`. */
  showClear?: boolean;
  /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Layer that erase / clipboard target. Default `'graph'`. */
  layerId?: string;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * Editor bar — cut / copy / paste / erase (`clipboard.*` + `graph.erase`),
 * drawn from control specs like a saved panel. Erase is selection-aware (deletes the selection when something is
 * selected, otherwise clears the layer). Requires a `<GraphClipboardProvider>` +
 * `ClickSelectBehaviour`; edits are undoable with a `<GraphHistoryProvider>`.
 */
export function EditToolbar({
  icons,
  orientation = 'horizontal',
  showClear = true,
  clickSelectId,
  layerId,
  canvas,
  className,
}: EditToolbarProps) {
  const selection = clickSelectId ? { clickSelectId } : undefined;
  const specs: ControlItemSpec[] = [
    { type: 'command', key: 'cut', command: 'clipboard.cut', ...(selection ? { args: selection } : {}), icon: 'scissors', label: 'Cut' },
    { type: 'command', key: 'copy', command: 'clipboard.copy', ...(selection ? { args: selection } : {}), icon: 'copy', label: 'Copy' },
    { type: 'command', key: 'paste', command: 'clipboard.paste', ...(selection ? { args: selection } : {}), icon: 'clipboard-paste', label: 'Paste' },
    ...(showClear
      ? [eraseSpec({ icon: 'eraser', ...(layerId ? { layerId } : {}), ...(clickSelectId ? { clickSelectId } : {}) })]
      : []),
  ];
  const items = useControlItems(specs, { canvas });
  return (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
}
