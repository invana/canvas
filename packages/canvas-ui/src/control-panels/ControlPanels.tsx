import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import type { Canvas, ControlItemSpec, ControlPanelAnchor, ControlPanelSpec } from '@invana/canvas';
import { cn } from '@invana/ui';
import { inBoardMode, useBoardMode, useControlPanels, useResolvedCanvas } from '@invana/canvas-react';

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

/**
 * The items that show in board mode `mode`, with the dividers that would now
 * lead, trail or double up removed — a group hidden by its mode takes its
 * separator with it.
 */
export function itemsInMode(items: readonly ControlItemSpec[], mode: string | null): ControlItemSpec[] {
  const out: ControlItemSpec[] = [];
  for (const item of items) {
    if (!inBoardMode(item.modes, mode)) continue;
    if (item.type === 'divider' && (out.length === 0 || out[out.length - 1]!.type === 'divider')) continue;
    out.push(item);
  }
  while (out.length > 0 && out[out.length - 1]!.type === 'divider') out.pop();
  return out;
}

/** How long the pointer rests before an `fade: 'idle'` panel fades. */
const IDLE_MS = 2000;

/** `true` once the pointer has rested `IDLE_MS` over the page; any movement wakes it. */
function usePointerIdle(on: boolean): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!on) {
      setIdle(false);
      return;
    }
    let timer = setTimeout(() => setIdle(true), IDLE_MS);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), IDLE_MS);
    };
    window.addEventListener('pointermove', wake);
    window.addEventListener('keydown', wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [on]);
  return idle;
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
  mode,
}: {
  spec: ControlPanelSpec;
  /** The board's mode; items limited to other modes are left out. */
  mode: string | null;
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
  const shown = useMemo(() => {
    const items = itemsInMode(spec.items, mode);
    return fold && folded ? items.filter((it) => it.key !== undefined && fold.keep.includes(it.key)) : items;
  }, [spec.items, fold, folded, mode]);
  const idle = usePointerIdle(spec.fade === 'idle');
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
          'pointer-events-auto flex transition-opacity duration-300',
          fill ? 'h-full w-full' : 'shrink-0',
          surfaceClass(surface),
          idle && 'opacity-35 focus-within:opacity-100 hover:opacity-100',
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
  const mode = useBoardMode(resolved);
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
        spec.visible === false || hidden.has(id) || !inBoardMode(spec.modes, mode) || (spec.placement ?? 'canvas') !== 'canvas' ? null : (
          <ControlPanelView
            key={id}
            spec={spec}
            canvas={resolved}
            icons={icons}
            widgets={widgets}
            zIndex={zIndex}
            folded={isFolded(id, spec)}
            mode={mode}
            onFold={(next) => setFolded((f) => ({ ...f, [id]: next }))}
          />
        ),
      )}
    </>
  );
}
