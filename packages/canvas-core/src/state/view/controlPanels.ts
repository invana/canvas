/**
 * Control panels — floating UI chrome inside the canvas, as **pure data**.
 *
 * A control panel is a small toolbar / widget cluster pinned over the canvas
 * (zoom buttons bottom-right, a brand + mode picker top-left, …). Its spec lives
 * in `CanvasView.definition.controlPanels`, so panels persist, export and
 * (later) sync like every other part of the definition. Edits are ordinary
 * `view` patches: a Studio edit (`canvas.update(…, 'edit:control-panels')`) is
 * recorded by `Canvas.history` and undone by the `history.undo` command, while a
 * programmatic write (a `<ControlPanel>` mount) is not.
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
 *
 * Unlike a {@link ControlToggleItemSpec} it never shows a pressed state, but it
 * may still **swap its face** while the command's `isActive(args)` is true — the
 * `active*` fields below. That's a Run button that turns into Stop while a
 * layout runs (`layout.toggle`), or an Erase button that reads "Selection"
 * while something is selected (`graph.erase`).
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
  /** Icon name while the command is active. Defaults to {@link icon}. */
  activeIcon?: string;
  /** Tooltip + label while the command is active. Defaults to {@link label}. */
  activeLabel?: string;
  /** Visible text while the command is active. Defaults to {@link text}. */
  activeText?: string;
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

/** One option of a {@link ControlChoiceItemSpec}. */
export interface ControlChoiceOption {
  /** Passed to the command as `args.value` when picked. */
  value: string;
  /** Human label. */
  label: string;
  /** Icon name, resolved by the UI kit's icon registry. */
  icon?: string;
}

/**
 * A pick-one control (select mode, edge type, active layout) bound to a command
 * that reports a `value`. Picking an option runs the command with
 * `{ ...args, value }`.
 */
export interface ControlChoiceItemSpec extends ControlItemBase {
  type: 'choice';
  /** Command name in the canvas's `CommandRegistry`, e.g. `'select.mode'`. */
  command: string;
  /** Arguments passed to the command (plus `value` when picking). Must be JSON. */
  args?: Record<string, unknown>;
  /** Trigger label + menu heading. */
  label: string;
  /** The options. Default: the command's own `options()`. */
  options?: ControlChoiceOption[];
  /** A collapsed dropdown (default) or every option inline as a segmented group. */
  display?: 'dropdown' | 'segmented';
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
  | ControlChoiceItemSpec
  | ControlWidgetItemSpec
  | ControlDividerItemSpec
  | ControlTextItemSpec
  | ControlSlotItemSpec;

/**
 * Which surface draws a panel. `'canvas'` floats it over the canvas (the
 * `position` / `offset` / `stretch` fields place it there). The `header-*` and
 * `footer-*` placements put it in a region of the app shell's header or footer
 * rail instead — `GraphCanvasApp`'s left / centre / right — where it flows
 * inline after that region's own content: `position`, `offset` and `stretch`
 * are ignored, it is always a row, and `surface` defaults to `false`. A shell
 * that doesn't draw a rail ignores panels placed in it.
 */
export type ControlPanelPlacement =
  | 'canvas'
  | 'header-left'
  | 'header-center'
  | 'header-right'
  | 'footer-left'
  | 'footer-center'
  | 'footer-right';

/**
 * A control panel — pure JSON, stored in `CanvasView.definition.controlPanels`
 * keyed by panel id. Floats over the canvas by default; {@link placement} can
 * put it in the app header or footer instead.
 */
export interface ControlPanelSpec {
  /** Stable discriminator for tooling (the Studio's editor lookup). */
  kind: 'control-panel';
  /**
   * The surface that draws the panel. Default `'canvas'`. A header / footer
   * placement is drawn by a host that renders those rail regions
   * (`GraphCanvasApp`, or `<RegionControlPanels>` in a custom shell);
   * `<ControlPanels>` skips it.
   */
  placement?: ControlPanelPlacement;
  /** Where the panel sits over the canvas. Default `'top-left'`. Ignored for a header / footer placement. */
  position?: ControlPanelPosition;
  /**
   * Distance from the anchored edges for a preset {@link position}, in px —
   * one number for both axes or `{ x, y }`. Ignored for insets and header / footer
   * placements. Default `8`.
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
  /** Draw the card surface (background, border, shadow). Default `true` over the canvas, `false` in a header / footer rail. */
  surface?: boolean;
  /** Show the panel. Default `true`. */
  visible?: boolean;
  /** The panel's items, in order. */
  items: ControlItemSpec[];
}
