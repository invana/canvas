import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import type { Canvas, ControlPanelAnchor, ControlPanelSpec } from '@invana/canvas';
import { cn } from '@invana/ui';
import { useControlPanels, useResolvedCanvas } from '@invana/canvas-react';

import { ToolbarSizeContext, ToolbarItems, type ToolbarIcon, type ToolbarItem, type TooltipSide } from '../components';
import { useControlItems } from './ControlItems';
import type { ControlWidget } from './widgets';
import { surfaceClass } from './surface';

export interface ControlPanelsProps {
  /** Extra / overriding icons by name, merged over {@link DEFAULT_CONTROL_ICONS}. */
  icons?: Record<string, ToolbarIcon>;
  /** Extra / overriding widgets by name, merged over {@link DEFAULT_CONTROL_WIDGETS}. */
  widgets?: Record<string, ControlWidget>;
  /** Stacking order over the canvas. Default `5`. */
  zIndex?: number;
  /** Explicit canvas; defaults to the context canvas. */
  canvas?: Canvas | null;
}

/** Default flow for an anchor: stacked on the side edges, a row everywhere else. */
function defaultOrientation(position: ControlPanelSpec['position']): 'horizontal' | 'vertical' {
  return position === 'left' || position === 'right' ? 'vertical' : 'horizontal';
}

/** Tooltips open away from the edge the panel hugs. */
function tooltipSideFor(position: ControlPanelSpec['position']): TooltipSide {
  if (position === 'right') return 'left';
  if (position === 'left') return 'right';
  if (typeof position === 'string' && position.startsWith('bottom')) return 'top';
  return 'bottom';
}

/** `stretch` applies only to the four edge-centre anchors. */
function stretches(spec: ControlPanelSpec): boolean {
  const p = spec.position;
  return spec.stretch === true && (p === 'top' || p === 'bottom' || p === 'left' || p === 'right');
}

/**
 * Absolute placement for a panel inside the positioned canvas host. A preset
 * anchor pins to its edge(s) at `offset` and centres on the free axis;
 * `stretch` spans the anchored edge instead of centring; insets pass through.
 */
function placement(spec: ControlPanelSpec): CSSProperties {
  const position = spec.position ?? 'top-left';
  if (typeof position !== 'string') return { position: 'absolute', ...position };

  const off = spec.offset ?? 8;
  const ox = typeof off === 'number' ? off : off.x;
  const oy = typeof off === 'number' ? off : off.y;
  const anchor: ControlPanelAnchor = position;
  const vertical = anchor.startsWith('top') ? 'top' : anchor.startsWith('bottom') ? 'bottom' : 'middle';
  const horizontal = anchor.endsWith('left') ? 'left' : anchor.endsWith('right') ? 'right' : 'middle';
  const stretch = stretches(spec);

  const style: CSSProperties = { position: 'absolute' };
  const translate: string[] = [];
  if (vertical === 'top') style.top = oy;
  else if (vertical === 'bottom') style.bottom = oy;
  else if (stretch) {
    style.top = oy;
    style.bottom = oy;
  } else {
    style.top = '50%';
    translate.push('translateY(-50%)');
  }

  if (horizontal === 'left') style.left = ox;
  else if (horizontal === 'right') style.right = ox;
  else if (stretch) {
    style.left = ox;
    style.right = ox;
  } else {
    style.left = '50%';
    translate.push('translateX(-50%)');
  }

  if (translate.length) style.transform = translate.join(' ');
  return style;
}

/** One panel: its specs resolved by {@link useControlItems}, pinned over the canvas. */
function ControlPanelView({
  spec,
  canvas,
  icons,
  widgets,
  zIndex,
  folded,
  onFold,
}: {
  spec: ControlPanelSpec;
  canvas: Canvas;
  icons?: Record<string, ToolbarIcon>;
  widgets?: Record<string, ControlWidget>;
  zIndex: number;
  /**
   * Whether a collapsible panel is folded. The viewer's, not the spec's: a host
   * re-writes its spec whenever its items change, which would undo a fold kept there.
   */
  folded: boolean;
  onFold: (folded: boolean) => void;
}) {
  const fold = spec.collapsible;
  const shown = useMemo(
    () => (fold && folded ? spec.items.filter((it) => it.key !== undefined && fold.keep.includes(it.key)) : spec.items),
    [spec.items, fold, folded],
  );
  const controls = useControlItems(shown, { canvas, ...(icons ? { icons } : {}), ...(widgets ? { widgets } : {}) });
  const items: ToolbarItem[] = fold
    ? [
        ...controls,
        { type: 'divider', key: 'fold-divider' },
        folded
          ? {
              type: 'button',
              key: 'fold',
              icon: ChevronDown,
              label: fold.showLabel ?? 'Show the tools',
              text: fold.showLabel ?? 'Show the tools',
              onClick: () => onFold(false),
            }
          : { type: 'button', key: 'fold', icon: ChevronLeft, label: fold.hideLabel ?? 'Hide the tools', onClick: () => onFold(true) },
      ]
    : controls;

  const orientation = spec.orientation ?? defaultOrientation(spec.position);
  const surface = spec.surface ?? true;
  const fill = stretches(spec);

  return (
    // The positioner lets the canvas keep every pointer event its content doesn't claim.
    <div style={{ ...placement(spec), zIndex, pointerEvents: 'none' }}>
      <div
        className={cn(
          'pointer-events-auto flex',
          fill ? 'h-full w-full' : 'shrink-0',
          surfaceClass(surface),
        )}
      >
        {/* The panel lays its items out itself — a tight row or column, 4 px
            apart — rather than in the kit's nav shell, which is full-width as a
            row and a 45 px rail as a column. Canvas chrome is the kit's small
            control size (GC21), every control in a row alike. */}
        <div className={cn('flex items-center gap-0.5', orientation === 'vertical' && 'flex-col')}>
          <ToolbarSizeContext.Provider value="sm">
            <ToolbarItems items={items} orientation={orientation} tooltipSide={tooltipSideFor(spec.position)} bare />
          </ToolbarSizeContext.Provider>
        </div>
      </div>
    </div>
  );
}

/**
 * Draws every **canvas-placed control panel** in the canvas's
 * `definition.controlPanels` — the UI projection of the panel specs, however
 * they got there (`<ControlPanel>` children, `canvas.update({ controlPanels })`,
 * an imported state, the Studio). Panels with a `header-*` placement are left to
 * {@link HeaderControlPanels}; a custom shell that doesn't mount it won't show
 * them.
 *
 * Mount it once **inside** the `<Canvas>` / `<GraphCanvas>` (whose host is the
 * positioned ancestor the panels pin to). `GraphCanvasApp` mounts it for you.
 * Item names resolve against the canvas's `commands` registry and the
 * {@link ControlPanelsProps.icons icon} / {@link ControlPanelsProps.widgets widget}
 * registries; an unknown widget renders nothing and an unknown icon falls back
 * to the item's text.
 */
export function ControlPanels({ icons, widgets, zIndex = 5, canvas }: ControlPanelsProps): ReactNode {
  const resolved = useResolvedCanvas(canvas);
  const panels = useControlPanels(resolved);
  // Which collapsible panels are folded — held here, not per panel, so a folded
  // panel can hide the ones its `collapsible.hides` names.
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const isFolded = (id: string, spec: ControlPanelSpec) => folded[id] ?? spec.collapsed === true;
  const hidden = new Set<string>();
  for (const [id, spec] of Object.entries(panels)) {
    if (spec.collapsible && isFolded(id, spec)) for (const other of spec.collapsible.hides ?? []) hidden.add(other);
  }

  return (
    <>
      {Object.entries(panels).map(([id, spec]) =>
        spec.visible === false || hidden.has(id) || (spec.placement ?? 'canvas') !== 'canvas' ? null : (
          <ControlPanelView
            key={id}
            spec={spec}
            canvas={resolved}
            icons={icons}
            widgets={widgets}
            zIndex={zIndex}
            folded={isFolded(id, spec)}
            onFold={(next) => setFolded((f) => ({ ...f, [id]: next }))}
          />
        ),
      )}
    </>
  );
}
