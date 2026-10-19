import { createContext, useContext } from 'react';

/**
 * How large the toolbar controls of a region are. `'sm'` — the floating chrome
 * over the canvas — is the kit's small control: a 26 px target with a 13 px
 * icon, the size of a segmented control's items, so every control in a row
 * matches. `'md'` (the default) is a header row's. The kit sizes the icon from
 * the button size, so a control only picks the size.
 */
export type ToolbarSize = 'sm' | 'md';

export const ToolbarSizeContext = createContext<ToolbarSize>('md');

/** The control size of the toolbar region this control sits in. */
export function useToolbarSize(): ToolbarSize {
  return useContext(ToolbarSizeContext);
}

/** The kit `Button` size for an icon-only control of `size`. */
export function iconButtonSize(size: ToolbarSize): 'icon-sm' | 'icon' {
  return size === 'sm' ? 'icon-sm' : 'icon';
}
