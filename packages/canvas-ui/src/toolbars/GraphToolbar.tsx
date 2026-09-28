import type { Canvas } from '@invana/canvas';
import type { EdgePathType } from '@invana/graph';

import { ToolbarItems } from '../components';
import type { ToolbarIcon, ToolbarItem } from '../components';
import { useStyleEditorSection } from '@invana/canvas-react';
import { useClipboard } from '@invana/canvas-react';
import { useClearGraph } from '@invana/canvas-react';

export interface GraphToolbarProps {
  /** Layout switcher. */
  layout: string;
  layoutOptions: Record<string, string>;
  onLayoutChange: (value: string) => void;

  /** Selection-mode switcher (e.g. click / brush / lasso). */
  selectMode: string;
  selectModeOptions: Record<string, string>;
  onSelectModeChange: (value: string) => void;

  /**
   * Self-wiring edge-routing picker (straight / orthogonal / curved …) targeting
   * this `GraphLayer` id. Default `'graph'`; pass `null` to hide the picker.
   */
  edgeTypeLayerId?: string | null;
  /** Path types the edge picker exposes, in order. Default: straight / orth / bezier / rounded / smooth. */
  edgeTypes?: readonly EdgePathType[];
  /** Optional key → label map for the edge picker. */
  edgeTypeLabels?: Record<string, string>;
  /** Per-option icons for the edge picker (key → icon component). */
  edgeTypeIcons?: Record<string, ToolbarIcon>;

  /** Erase button — layer to clear. Default `'graph'`. */
  clearLayerId?: string;
  /** Eraser icon for the selection-aware erase button. */
  clearIcon: ToolbarIcon;
  /** Explicit canvas instance; forwarded to the self-wiring erase action. Defaults to context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * Turnkey **horizontal** graph toolbar: a callback-driven layout picker +
 * selection-mode picker + the self-wiring **Style Editor** edge-routing section
 * ({@link useStyleEditorSection}) + a selection-aware erase action. Compiled by
 * {@link ToolbarItems}. To float it over the canvas, put it in a `<ControlPanel>`.
 *
 * @deprecated Callback-driven, with no command behind its controls, so it can't
 * share the control-spec renderer. Use `GraphControlsToolbar`, or
 * `<ControlItems items={…}>` with the `*_CONTROL_ITEMS` presets. Kept for
 * compatibility; see `docs/rfcs/feat/2026-09-28-toolbars-and-control-panels-draw-controls-twice.md` D3.
 * Removal deferred to the next breaking release (rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic G1).
 */
export function GraphToolbar({
  layout,
  layoutOptions,
  onLayoutChange,
  selectMode,
  selectModeOptions,
  onSelectModeChange,
  edgeTypeLayerId = 'graph',
  edgeTypes,
  edgeTypeLabels,
  edgeTypeIcons,
  clearLayerId = 'graph',
  clearIcon,
  canvas,
  className,
}: GraphToolbarProps) {
  // Always call the section hook (rules of hooks); include its item only when
  // the edge picker is enabled.
  const edgeItems = useStyleEditorSection({
    ...(edgeTypeLayerId != null ? { layerId: edgeTypeLayerId } : {}),
    ...(edgeTypes ? { types: edgeTypes } : {}),
    ...(edgeTypeLabels ? { labels: edgeTypeLabels } : {}),
    ...(edgeTypeIcons ? { icons: edgeTypeIcons } : {}),
    canvas,
  });
  const { remove, hasSelection } = useClipboard({}, canvas);
  const { clear } = useClearGraph(clearLayerId, canvas);

  const items: ToolbarItem[] = [
    { type: 'select', key: 'layout', label: 'Layout', value: layout, options: layoutOptions, onChange: onLayoutChange },
    { type: 'select', key: 'select-mode', label: 'Select', value: selectMode, options: selectModeOptions, onChange: onSelectModeChange },
    ...(edgeTypeLayerId != null ? edgeItems : []),
    {
      type: 'button',
      key: 'erase',
      icon: clearIcon,
      label: hasSelection ? 'Erase selection' : 'Clear canvas',
      ...(hasSelection ? { text: 'Selection' } : {}),
      onClick: hasSelection ? remove : () => clear(),
    },
  ];

  return <ToolbarItems items={items} orientation="horizontal" className={className} />;
}
