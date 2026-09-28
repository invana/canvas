import type { ReactNode } from 'react';
import type { Canvas, ControlPanelPlacement, ControlPanelSpec } from '@invana/canvas';
import { cn } from '@invana/ui';
import { useControlPanels, useResolvedCanvas } from '@invana/canvas-react';

import { ToolbarItems, type ToolbarIcon } from '../components';
import { useControlItems } from './ControlItems';
import type { ControlWidget } from './widgets';

/** A rail region a panel can be placed in — left, centre or right. */
export type HeaderRegion = 'left' | 'center' | 'right';

/** An app-shell rail that draws placed panels. */
export type ControlPanelRail = 'header' | 'footer';

export interface RegionControlPanelsProps {
  /** The rail to draw for. */
  rail: ControlPanelRail;
  /** The region to draw — panels whose `placement` is `<rail>-<region>`. */
  region: HeaderRegion;
  /** Extra / overriding icons by name, merged over `DEFAULT_CONTROL_ICONS`. */
  icons?: Record<string, ToolbarIcon>;
  /** Extra / overriding widgets by name, merged over `DEFAULT_CONTROL_WIDGETS`. */
  widgets?: Record<string, ControlWidget>;
  /** Explicit canvas; defaults to the context canvas. */
  canvas?: Canvas | null;
}

export type HeaderControlPanelsProps = Omit<RegionControlPanelsProps, 'rail'>;

/** Does `placement` put a panel in `rail`? */
function inRail(placement: ControlPanelPlacement | undefined, rail: ControlPanelRail): boolean {
  return placement?.startsWith(`${rail}-`) ?? false;
}

/**
 * Whether any **visible** panel in `panels` is placed in `rail` — what a shell
 * reads to show an otherwise empty rail (`GraphCanvasApp`'s footer).
 */
export function hasRailControlPanels(
  panels: Readonly<Record<string, ControlPanelSpec>>,
  rail: ControlPanelRail,
): boolean {
  return Object.values(panels).some((p) => p.visible !== false && inRail(p.placement, rail));
}

/** One rail-placed panel: a row of its items, no card unless `surface` asks for one. */
function RailPanelView({
  spec,
  canvas,
  rail,
  icons,
  widgets,
}: {
  spec: ControlPanelSpec;
  canvas: Canvas;
  rail: ControlPanelRail;
  icons?: Record<string, ToolbarIcon>;
  widgets?: Record<string, ControlWidget>;
}) {
  const items = useControlItems(spec.items, { canvas, ...(icons ? { icons } : {}), ...(widgets ? { widgets } : {}) });
  return (
    <div className={cn('flex shrink-0', spec.surface === true && 'rounded-md border border-border bg-background p-0.5')}>
      {/* Tooltips open away from the window edge the rail sits on. */}
      <ToolbarItems items={items} orientation="horizontal" tooltipSide={rail === 'header' ? 'bottom' : 'top'} />
    </div>
  );
}

/**
 * Draws the **rail-placed control panels** of one region of the header or
 * footer — every visible panel in `definition.controlPanels` whose `placement`
 * is `<rail>-<region>`, in insertion order, as inline rows. So controls the
 * Studio puts in the header or footer save and restore with the canvas like any
 * other panel.
 *
 * `GraphCanvasApp` renders it in each header and footer region (after the
 * region's own content). A custom shell renders one per region where its rails
 * live; it must sit under the canvas root's context, or be given `canvas`.
 */
export function RegionControlPanels({ rail, region, icons, widgets, canvas }: RegionControlPanelsProps): ReactNode {
  const resolved = useResolvedCanvas(canvas);
  const panels = useControlPanels(resolved);
  const placement: ControlPanelPlacement = `${rail}-${region}`;

  return (
    <>
      {Object.entries(panels).map(([id, spec]) =>
        spec.visible === false || spec.placement !== placement ? null : (
          <RailPanelView key={id} spec={spec} canvas={resolved} rail={rail} icons={icons} widgets={widgets} />
        ),
      )}
    </>
  );
}

/**
 * The header-placed control panels of one header region —
 * `<RegionControlPanels rail="header">`.
 */
export function HeaderControlPanels(props: HeaderControlPanelsProps): ReactNode {
  return <RegionControlPanels rail="header" {...props} />;
}
