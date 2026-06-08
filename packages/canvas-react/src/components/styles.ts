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
