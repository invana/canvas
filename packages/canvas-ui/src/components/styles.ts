/**
 * Shared design-kit "active / selected" styling for toolbar controls. Reused by
 * the {@link ToolbarItems} renderer so active toggles and selected dropdown
 * options match the design-kit sidebar nav-item treatment without per-control
 * style forks. Requires the host to run the design-kit Tailwind theme (which
 * provides the `primary` token).
 */

/**
 * Active-state classes mirroring the design-kit sidebar nav items: a faint
 * primary tint, primary-coloured icon/text, and a thin primary ring — a subtle
 * "selected" affordance rather than a solid fill.
 */
export const ACTIVE_CLASS = 'bg-primary/15 text-primary ring-1 ring-primary/25';

/**
 * Active-state classes for a **selected item inside a dropdown menu** (radio
 * pickers). A lighter variant of {@link ACTIVE_CLASS} — primary text + medium
 * weight only, dropping the tint + ring that read as heavy in a menu list.
 */
export const ACTIVE_MENU_ITEM_CLASS = 'text-primary font-medium';

/**
 * Active-segment styling for a segmented `ToggleGroup` picker — the
 * {@link ACTIVE_CLASS} nav-item treatment (primary tint + primary text/icon +
 * thin primary ring) expressed as an **inline style** rather than Tailwind
 * classes.
 *
 * Why inline: the base design-kit toggle already sets a `bg-accent`
 * `data-[state=on]` on-state whose attribute-selector specificity beats plain
 * utilities, and a consumer's Tailwind build isn't guaranteed to scan this
 * package's `dist` for the `data-[state=on]:*` compound variants. An inline
 * style sidesteps both — it wins on specificity and renders in any consumer.
 * Colours come from the design-kit `--color-primary` token (the `/15` and `/25`
 * tints mirror Tailwind v4's `oklab` `color-mix`). Applied only to the selected
 * segment; the icon inherits the colour via `currentColor`.
 */
export const ACTIVE_SEGMENT_STYLE = {
  color: 'var(--color-primary)',
  backgroundColor: 'color-mix(in oklab, var(--color-primary) 15%, transparent)',
  boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-primary) 25%, transparent)',
} as const;
