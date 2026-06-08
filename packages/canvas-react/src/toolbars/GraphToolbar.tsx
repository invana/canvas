import type { Canvas as EngineCanvas } from '@invana/canvas';
import type { EdgePathType } from '@invana/graph';

import { Panel, ToolbarItems } from '../components';
import type { PanelPosition, ToolbarIcon, ToolbarItem } from '../components';
import { useStyleEditorSection } from '../hooks/useStyleEditorSection';
import { useClipboard } from '../hooks/useClipboard';
import { useClearGraph } from '../hooks/useClearGraph';

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
  canvas?: EngineCanvas | null;

  /** Where the toolbar pins within the canvas host. Default `'top-center'`. */
  position?: PanelPosition;
  className?: string;
}

/**
 * Turnkey **horizontal** graph toolbar: a callback-driven layout picker +
 * selection-mode picker + the self-wiring **Style Editor** edge-routing section
 * ({@link useStyleEditorSection}) + a selection-aware erase action. Compiled by
 * {@link ToolbarItems} and pinned with a {@link Panel}.
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
  position = 'top-center',
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

  return (
    <Panel position={position} orientation="horizontal">
      <ToolbarItems items={items} orientation="horizontal" className={className} />
    </Panel>
  );
}
