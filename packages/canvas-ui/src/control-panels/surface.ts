import type { ControlPanelSpec } from '@invana/canvas';

/** The classes for a panel's {@link ControlPanelSpec.surface}: the card, the light hairline, or none. */
export function surfaceClass(surface: ControlPanelSpec['surface']): string | false {
  if (surface === 'hairline') return 'rounded-md border border-border bg-background/80 p-0.5 backdrop-blur-sm';
  return surface === true && 'rounded-md border border-border bg-background p-0.5 shadow-sm';
}
