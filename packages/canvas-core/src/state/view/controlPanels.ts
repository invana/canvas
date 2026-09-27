/**
 * Control panels — floating UI chrome inside the canvas, as **pure data**.
 *
 * A control panel is a small toolbar / widget cluster pinned over the canvas
 * (zoom buttons bottom-right, a brand + mode picker top-left, …). Its spec lives
 * in `CanvasView.definition.controlPanels`, so panels persist, export, undo and
 * (later) sync like every other part of the definition.
 *
 * Specs hold **no closures and no components**: an item names what it does by
 * string — a `command` (resolved by the canvas's `CommandRegistry`), an `icon`
 * and a `widget` (resolved by the UI kit's registries), or a `slot` (non-persisted
 * React content registered by the declaring component). The kernel only stores
 * and validates the shape; drawing it is the UI kit's job.
 */

/** A preset anchor on the canvas's 9-point grid. */
export type ControlPanelAnchor =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

/**
 * Exact insets from the canvas edges, in px or any CSS length. Set one of
 * `top`/`bottom` and one of `left`/`right` (setting both opposite sides
 * stretches the panel between them).
 */
export interface ControlPanelInsets {
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
}

/** Where a panel sits: a preset {@link ControlPanelAnchor} or exact {@link ControlPanelInsets}. */
export type ControlPanelPosition = ControlPanelAnchor | ControlPanelInsets;

/** Fields shared by every {@link ControlItemSpec}. */
interface ControlItemBase {
  /** Stable key within the panel; defaults to the item's index. */
  key?: string;
}

/**
 * A button that runs a named command on click. Disabled while the command is
 * missing or reports `isEnabled() === false`.
 */
export interface ControlCommandItemSpec extends ControlItemBase {
  type: 'command';
  /** Command name in the canvas's `CommandRegistry`, e.g. `'camera.fit'`. */
  command: string;
  /** Arguments passed to the command's `run` / `isEnabled`. Must be JSON. */
  args?: unknown;
  /** Icon name, resolved by the UI kit's icon registry (e.g. `'maximize'`). */
  icon?: string;
  /** Tooltip + accessible label. */
  label: string;
  /** Optional visible text beside the icon. */
  text?: string;
}

/**
 * A two-state toggle bound to a command: its active state is the command's
 * `isActive(args)`, and clicking runs the command (which flips it).
 */
export interface ControlToggleItemSpec extends ControlItemBase {
  type: 'toggle';
  /** Command name in the canvas's `CommandRegistry`, e.g. `'view.lock'`. */
  command: string;
  /** Arguments passed to the command's `run` / `isActive` / `isEnabled`. Must be JSON. */
  args?: unknown;
  /** Icon name while inactive (and while active, unless {@link activeIcon} is set). */
  icon?: string;
  /** Icon name while active. */
  activeIcon?: string;
  /** Tooltip + label while inactive. */
  label: string;
  /** Tooltip + label while active. Defaults to {@link label}. */
  activeLabel?: string;
}

/** A named widget from the UI kit's widget registry (e.g. `'zoom-readout'`). */
export interface ControlWidgetItemSpec extends ControlItemBase {
  type: 'widget';
  /** Widget name in the UI kit's widget registry. */
  widget: string;
  /** Widget options. Must be JSON. */
  options?: Record<string, unknown>;
}

/** A group separator. */
export interface ControlDividerItemSpec extends ControlItemBase {
  type: 'divider';
}

/** Static text (a brand, a caption). */
export interface ControlTextItemSpec extends ControlItemBase {
  type: 'text';
  text: string;
}

/**
 * A placeholder for **non-persisted** React content, registered at runtime under
 * {@link slot} (the declaring component's `children` use the panel id). Exported
 * state keeps the placeholder; a canvas that never registers the slot renders
 * nothing there.
 */
export interface ControlSlotItemSpec extends ControlItemBase {
  type: 'slot';
  /** Slot name in the runtime slot registry. */
  slot: string;
}

/** One item in a {@link ControlPanelSpec} — pure JSON, resolved by name at render time. */
export type ControlItemSpec =
  | ControlCommandItemSpec
  | ControlToggleItemSpec
  | ControlWidgetItemSpec
  | ControlDividerItemSpec
  | ControlTextItemSpec
  | ControlSlotItemSpec;

/**
 * A floating control panel over the canvas — pure JSON, stored in
 * `CanvasView.definition.controlPanels` keyed by panel id.
 */
export interface ControlPanelSpec {
  /** Stable discriminator for tooling (the Studio's editor lookup). */
  kind: 'control-panel';
  /** Where the panel sits. Default `'top-left'`. */
  position?: ControlPanelPosition;
  /**
   * Distance from the anchored edges for a preset {@link position}, in px —
   * one number for both axes or `{ x, y }`. Ignored for insets. Default `8`.
   */
  offset?: number | { x: number; y: number };
  /**
   * Item flow. Default: `'vertical'` for the `left` / `right` anchors,
   * `'horizontal'` everywhere else.
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Stretch along the anchored edge — full height for `left` / `right`, full
   * width for `top` / `bottom`. Ignored for corners, `center` and insets.
   * Default `false`.
   */
  stretch?: boolean;
  /** Draw the card surface (background, border, shadow). Default `true`. */
  surface?: boolean;
  /** Show the panel. Default `true`. */
  visible?: boolean;
  /** The panel's items, in order. */
  items: ControlItemSpec[];
}
