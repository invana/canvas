import type { ReactNode } from 'react';
import type { Canvas, ControlPanelPlacement, ControlPanelSpec } from '@invana/canvas';
import { cn } from '@invana/ui';
import { useControlPanels, useResolvedCanvas } from '@invana/canvas-react';

import { ToolbarItems, type ToolbarIcon } from '../components';
import { useControlItems } from './ControlItems';
import type { ControlWidget } from './widgets';

/** A header region a panel can be placed in. */
export type HeaderRegion = 'left' | 'center' | 'right';

export interface HeaderControlPanelsProps {
  /** The header region to draw — panels whose `placement` is `header-<region>`. */
  region: HeaderRegion;
  /** Extra / overriding icons by name, merged over `DEFAULT_CONTROL_ICONS`. */
  icons?: Record<string, ToolbarIcon>;
  /** Extra / overriding widgets by name, merged over `DEFAULT_CONTROL_WIDGETS`. */
  widgets?: Record<string, ControlWidget>;
  /** Explicit canvas; defaults to the context canvas. */
  canvas?: Canvas | null;
}

/** One header-placed panel: a row of its items, no card unless `surface` asks for one. */
function HeaderPanelView({
  spec,
  canvas,
  icons,
  widgets,
}: {
  spec: ControlPanelSpec;
  canvas: Canvas;
  icons?: Record<string, ToolbarIcon>;
  widgets?: Record<string, ControlWidget>;
}) {
  const items = useControlItems(spec.items, { canvas, ...(icons ? { icons } : {}), ...(widgets ? { widgets } : {}) });
  return (
    <div className={cn('flex shrink-0', spec.surface === true && 'rounded-md border border-border bg-background p-0.5')}>
      <ToolbarItems items={items} orientation="horizontal" tooltipSide="bottom" />
    </div>
  );
}

/**
 * Draws the **header-placed control panels** of one header region — every
 * visible panel in `definition.controlPanels` whose `placement` is
 * `header-<region>`, in insertion order, as inline rows. So controls the Studio
 * puts in the header save and restore with the canvas like any other panel.
 *
 * `GraphCanvasApp` renders it in each header region (after the region's own
 * content). A custom shell renders one per region where its header lives; it
 * must sit under the canvas root's context, or be given `canvas`.
 */
export function HeaderControlPanels({ region, icons, widgets, canvas }: HeaderControlPanelsProps): ReactNode {
  const resolved = useResolvedCanvas(canvas);
  const panels = useControlPanels(resolved);
  const placement: ControlPanelPlacement = `header-${region}`;

  return (
    <>
      {Object.entries(panels).map(([id, spec]) =>
        spec.visible === false || spec.placement !== placement ? null : (
          <HeaderPanelView key={id} spec={spec} canvas={resolved} icons={icons} widgets={widgets} />
        ),
      )}
    </>
  );
}
