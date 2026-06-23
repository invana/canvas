import type { Canvas } from '@invana/canvas';

import { Panel, ToolbarItems, applyIconOverrides } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';
import { useEditorSection } from '../hooks/useEditorSection';

export interface EditToolbarProps {
  /** Override the baked icons, by item key. */
  icons?: Partial<Record<'cut' | 'copy' | 'paste' | 'erase', ToolbarIcon>>;
  /** Where the toolbar pins. Default `'top-left'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Show the erase button. Default `true`. */
  showClear?: boolean;
  /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Layer that erase / clipboard target. Default `'graph'`. */
  layerId?: string;
  /** Render without the `<Panel>` wrapper. Default `false`. */
  bare?: boolean;
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
  position = 'top-left',
  orientation = 'horizontal',
  showClear = true,
  clickSelectId,
  layerId,
  bare = false,
  canvas,
  className,
}: EditToolbarProps) {
  const section = useEditorSection({
    ...(clickSelectId ? { clickSelectId } : {}),
    ...(layerId ? { layerId } : {}),
    canvas,
  });
  const items = showClear ? section : section.filter((i) => i.key !== 'erase');

  const nav = (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
