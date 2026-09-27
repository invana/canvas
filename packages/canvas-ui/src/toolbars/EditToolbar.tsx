import type { Canvas } from '@invana/canvas';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon } from '../components';
import { useEditorSection } from '@invana/canvas-react';

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
 * Editor bar — cut / copy / paste / erase (the {@link useEditorSection}
 * section). Erase is selection-aware (deletes the selection when something is
 * selected, otherwise clears the layer). Requires a `<GraphClipboardProvider>` +
 * `ClickSelectBehaviour`; edits are undoable with a `<GraphHistoryProvider>`.
 * Icons are baked in (lucide).
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
  const section = useEditorSection({
    ...(clickSelectId ? { clickSelectId } : {}),
    ...(layerId ? { layerId } : {}),
    canvas,
  });
  const items = showClear ? section : section.filter((i) => i.key !== 'erase');

  return (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
}
