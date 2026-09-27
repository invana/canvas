import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { Canvas, ControlItemSpec, ControlPanelAnchor, ControlPanelSpec } from '@invana/canvas';
import { cn } from '@invana/ui';
import {
  useCommandStates,
  useControlPanelSlot,
  useControlPanels,
  useResolvedCanvas,
  type CommandRef,
} from '@invana/canvas-react';

import { ToolbarItems, type ToolbarIcon, type ToolbarItem, type TooltipSide } from '../components';
import { DEFAULT_CONTROL_ICONS } from './icons';
import { DEFAULT_CONTROL_WIDGETS, type ControlWidget } from './widgets';

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

/** Stand-in glyph for an item whose icon name isn't registered — the button shows its text instead. */
const NoIcon: ToolbarIcon = () => null;

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

/** Renders a runtime slot's node (see `ControlPanel` children). */
function SlotContent({ name, canvas }: { name: string; canvas: Canvas }) {
  return <>{useControlPanelSlot(name, canvas)}</>;
}

/** One panel: resolve its items against the command / icon / widget / slot registries and draw them. */
function ControlPanelView({
  spec,
  canvas,
  icons,
  widgets,
  zIndex,
}: {
  spec: ControlPanelSpec;
  canvas: Canvas;
  icons: Record<string, ToolbarIcon>;
  widgets: Record<string, ControlWidget>;
  zIndex: number;
}) {
  // One ref per command-bound item (command / toggle / choice), in item order.
  const refs = useMemo<CommandRef[]>(
    () =>
      spec.items.flatMap((it) =>
        it.type === 'command' || it.type === 'toggle' || it.type === 'choice'
          ? [{ command: it.command, args: it.args }]
          : [],
      ),
    [spec.items],
  );
  const { states, run } = useCommandStates(refs, canvas);

  let c = 0;
  const items: ToolbarItem[] = spec.items.flatMap((it: ControlItemSpec, i): ToolbarItem[] => {
    const key = it.key ?? `${it.type}-${i}`;
    switch (it.type) {
      case 'command': {
        const st = states[c++];
        const icon = it.icon ? icons[it.icon] : undefined;
        const text = it.text ?? (icon ? undefined : it.label);
        return [{
          type: 'button',
          key,
          icon: icon ?? NoIcon,
          label: it.label,
          ...(text !== undefined ? { text } : {}),
          disabled: !st?.enabled,
          onClick: () => void run(it.command, it.args),
        }];
      }
      case 'toggle': {
        const st = states[c++];
        const icon = (it.icon ? icons[it.icon] : undefined) ?? NoIcon;
        const activeIcon = it.activeIcon ? icons[it.activeIcon] : undefined;
        return [{
          type: 'toggle',
          key,
          icon,
          ...(activeIcon ? { activeIcon } : {}),
          label: it.label,
          ...(it.activeLabel !== undefined ? { activeLabel: it.activeLabel } : {}),
          active: st?.active ?? false,
          disabled: !st?.enabled,
          onToggle: () => void run(it.command, it.args),
        }];
      }
      case 'choice': {
        const st = states[c++];
        const options = it.options ?? st?.options ?? [];
        if (options.length === 0) return [];
        const optionIcons: Record<string, ToolbarIcon> = {};
        for (const o of options) {
          const Icon = o.icon ? icons[o.icon] : undefined;
          if (Icon) optionIcons[o.value] = Icon;
        }
        return [{
          type: 'select',
          key,
          label: it.label,
          value: st?.value ?? options[0]!.value,
          options: Object.fromEntries(options.map((o) => [o.value, o.label])),
          ...(Object.keys(optionIcons).length > 0 ? { icons: optionIcons, triggerLabelOnly: true } : {}),
          ...(it.display ? { display: it.display } : {}),
          disabled: !st?.enabled,
          onChange: (value: string) => void run(it.command, { ...it.args, value }),
        }];
      }
      case 'divider':
        return [{ type: 'divider', key }];
      case 'text':
        return [{
          type: 'custom',
          key,
          render: () => <span className="px-2 text-xs font-semibold whitespace-nowrap text-foreground">{it.text}</span>,
        }];
      case 'widget': {
        const Widget = widgets[it.widget];
        return Widget ? [{ type: 'custom', key, render: () => <Widget canvas={canvas} {...(it.options ? { options: it.options } : {})} /> }] : [];
      }
      case 'slot':
        return [{ type: 'custom', key, render: () => <SlotContent name={it.slot} canvas={canvas} /> }];
      default:
        return [];
    }
  });

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
          surface && 'rounded-md border border-border bg-background p-0.5 shadow-sm',
        )}
      >
        <ToolbarItems items={items} orientation={orientation} tooltipSide={tooltipSideFor(spec.position)} />
      </div>
    </div>
  );
}

/**
 * Draws every **control panel** in the canvas's `definition.controlPanels` —
 * the UI projection of the panel specs, however they got there (`<ControlPanel>`
 * children, `canvas.update({ controlPanels })`, an imported state, the Studio).
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
  const iconMap = useMemo(() => ({ ...DEFAULT_CONTROL_ICONS, ...icons }), [icons]);
  const widgetMap = useMemo(() => ({ ...DEFAULT_CONTROL_WIDGETS, ...widgets }), [widgets]);

  return (
    <>
      {Object.entries(panels).map(([id, spec]) =>
        spec.visible === false ? null : (
          <ControlPanelView key={id} spec={spec} canvas={resolved} icons={iconMap} widgets={widgetMap} zIndex={zIndex} />
        ),
      )}
    </>
  );
}
