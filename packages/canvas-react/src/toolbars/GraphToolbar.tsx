import { NavHorizontal } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';
import type { EdgePathType } from '@invana/graph';

import { ClearButton, EdgeTypePicker, OptionPicker, Panel } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';

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

  /** Clear button — layer to clear. Default `'graph'`. */
  clearLayerId?: string;
  clearIcon?: ToolbarIcon;
  /** Explicit canvas instance; forwarded to the self-wiring {@link ClearButton}. Defaults to context canvas. */
  canvas?: EngineCanvas | null;

  /** Where the toolbar pins within the canvas host. Default `'top-center'`. */
  position?: PanelPosition;
  className?: string;
}

/**
 * Turnkey **horizontal** graph toolbar: a layout picker + selection-mode picker
 * + a self-wiring {@link EdgeTypePicker} (edge routing) + clear action, grouped
 * in a `@invana/ui` `NavHorizontal`. The layout / select pickers are
 * callback-driven (the consumer wires them to the engine); the edge-type and
 * clear actions self-wire from their layer id. Compose the underlying
 * {@link OptionPicker} / {@link EdgeTypePicker} / {@link ClearButton} primitives
 * directly for a custom arrangement.
 *
 * Self-positioning: it wraps itself in a {@link Panel}, so it overlays the
 * canvas host directly — render it as a child of `<Canvas>` (no hand-rolled
 * absolute wrapper needed). Positioning is the Panel's job (`position`); there
 * is no internal `align` knob.
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
  return (
    <Panel position={position} orientation="horizontal">
      <NavHorizontal
        className={className}
        center={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <OptionPicker
              label="Layout"
              value={layout}
              options={layoutOptions}
              onChange={onLayoutChange}
            />
            <OptionPicker
              label="Select"
              value={selectMode}
              options={selectModeOptions}
              onChange={onSelectModeChange}
            />
            {edgeTypeLayerId != null && (
              <EdgeTypePicker
                layerId={edgeTypeLayerId}
                {...(edgeTypes ? { types: edgeTypes } : {})}
                {...(edgeTypeLabels ? { labels: edgeTypeLabels } : {})}
                {...(edgeTypeIcons ? { icons: edgeTypeIcons } : {})}
                canvas={canvas}
              />
            )}
            <ClearButton icon={clearIcon} layerId={clearLayerId} canvas={canvas} />
          </div>
        }
      />
    </Panel>
  );
}
