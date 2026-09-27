import { useMemo, type ReactNode } from 'react';
import type { Canvas, ControlItemSpec } from '@invana/canvas';
import { useCommandStates, useControlPanelSlot, useResolvedCanvas, type CommandRef } from '@invana/canvas-react';

import { ToolbarItems, type ToolbarIcon, type ToolbarItem, type TooltipSide } from '../components';
import { DEFAULT_CONTROL_ICONS } from './icons';
import { DEFAULT_CONTROL_WIDGETS, type ControlWidget } from './widgets';

export interface UseControlItemsOptions {
  /** Extra / overriding icons by name, merged over {@link DEFAULT_CONTROL_ICONS}. */
  icons?: Record<string, ToolbarIcon>;
  /** Extra / overriding widgets by name, merged over {@link DEFAULT_CONTROL_WIDGETS}. */
  widgets?: Record<string, ControlWidget>;
  /** Explicit canvas; defaults to the context canvas. */
  canvas?: Canvas | null;
}

/** Stand-in glyph for an item whose icon name isn't registered — the button shows its text instead. */
const NoIcon: ToolbarIcon = () => null;

/** Renders a runtime slot's node (see `ControlPanel` children). */
function SlotContent({ name, canvas }: { name: string; canvas: Canvas }) {
  return <>{useControlPanelSlot(name, canvas)}</>;
}

/**
 * Resolve control-item **specs** into live {@link ToolbarItem}s — the one
 * spec → pixels mapping behind both `<ControlPanels>` (floating, saved) and the
 * `*Toolbar`s (header content). Commands resolve against the canvas's
 * `commands` registry (enabled / active / value / options stay live), icons
 * and widgets against the registries, and slots against `<ControlPanel>`
 * children.
 *
 * Returns plain `ToolbarItem`s, so a caller can still apply icon overrides,
 * append its own items, or filter before handing them to `<ToolbarItems>`.
 * `items` may be rebuilt every render.
 */
export function useControlItems(
  items: readonly ControlItemSpec[],
  { icons, widgets, canvas }: UseControlItemsOptions = {},
): ToolbarItem[] {
  const resolved = useResolvedCanvas(canvas);
  const iconMap = useMemo(() => ({ ...DEFAULT_CONTROL_ICONS, ...icons }), [icons]);
  const widgetMap = useMemo(() => ({ ...DEFAULT_CONTROL_WIDGETS, ...widgets }), [widgets]);

  // One ref per command-bound item (command / toggle / choice), in item order.
  const refs: CommandRef[] = items.flatMap((it) =>
    it.type === 'command' || it.type === 'toggle' || it.type === 'choice' ? [{ command: it.command, args: it.args }] : [],
  );
  const { states, run } = useCommandStates(refs, resolved);

  let c = 0;
  return items.flatMap((it: ControlItemSpec, i): ToolbarItem[] => {
    const key = it.key ?? `${it.type}-${i}`;
    switch (it.type) {
      case 'command': {
        const st = states[c++];
        const active = st?.active ?? false;
        const iconName = (active ? it.activeIcon : undefined) ?? it.icon;
        const icon = iconName ? iconMap[iconName] : undefined;
        const label = (active ? it.activeLabel : undefined) ?? it.label;
        const text = (active ? it.activeText : undefined) ?? it.text ?? (icon ? undefined : label);
        return [{
          type: 'button',
          key,
          icon: icon ?? NoIcon,
          label,
          ...(text !== undefined ? { text } : {}),
          disabled: !st?.enabled,
          onClick: () => void run(it.command, it.args),
        }];
      }
      case 'toggle': {
        const st = states[c++];
        const icon = (it.icon ? iconMap[it.icon] : undefined) ?? NoIcon;
        const activeIcon = it.activeIcon ? iconMap[it.activeIcon] : undefined;
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
          const Icon = o.icon ? iconMap[o.icon] : undefined;
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
          onChange: (value: string) => void run(it.command, { ...(it.args as object | undefined), value }),
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
        const Widget = widgetMap[it.widget];
        return Widget
          ? [{ type: 'custom', key, render: () => <Widget canvas={resolved} {...(it.options ? { options: it.options } : {})} /> }]
          : [];
      }
      case 'slot':
        return [{ type: 'custom', key, render: () => <SlotContent name={it.slot} canvas={resolved} /> }];
      default:
        return [];
    }
  });
}

export interface ControlItemsProps extends UseControlItemsOptions {
  /** The control specs to draw — a `*_CONTROL_ITEMS` preset or your own. */
  items: readonly ControlItemSpec[];
  /** Flow. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Side tooltips open on. */
  tooltipSide?: TooltipSide;
  /** Plain `ToolbarItem`s appended after the specs (closures, custom renders). */
  extra?: readonly ToolbarItem[];
  /** Class on the `<ToolbarItems>` root. */
  className?: string;
}

/**
 * Draw control-item specs as a toolbar row, **in place** — no floating panel,
 * nothing written to the canvas definition. Use it wherever a `ReactNode` goes
 * (a `GraphCanvasApp` header slot, a side rail, your own chrome):
 *
 * ```tsx
 * <GraphCanvasApp header={{ right: <ControlItems items={GRAPH_CONTROL_ITEMS} /> }} … />
 * ```
 *
 * To float the same items over the canvas *and* save them with it, use
 * `<ControlPanel items={…}>` instead.
 */
export function ControlItems({ items, orientation = 'horizontal', tooltipSide, extra, className, ...opts }: ControlItemsProps): ReactNode {
  const resolved = useControlItems(items, opts);
  const all = extra && extra.length > 0 ? [...resolved, ...extra] : resolved;
  return (
    <ToolbarItems
      items={all}
      orientation={orientation}
      {...(tooltipSide ? { tooltipSide } : {})}
      {...(className ? { className } : {})}
    />
  );
}
