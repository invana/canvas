// The board's chrome as control-panel widgets, so a saved `<ControlPanel>` can
// name them: the layout button and its preset popover, the playbook stepper,
// the view readout and full screen.
//
// Presenting itself is the host's state — whether the toolbar has collapsed to
// the stepper is a product decision, not the canvas's — so *Present* and the
// stepper's ✕ are host widgets built from `PlaybookPresentButton` and
// `PlaybookStepper` (`<GraphCanvasApp controlPanels={{ widgets }}>`).

import { select, type Canvas, type CanvasLayoutPreset } from '@invana/canvas';
import { useCommandStates, usePlaybook } from '@invana/canvas-react';
import { Button, Popover, PopoverContent, PopoverTrigger, Tooltip, TooltipContent, TooltipTrigger } from '@invana/ui';
import { ChevronDown, Expand, Network, Shrink, Presentation, Workflow, Orbit, Share2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from 'react';

import { ToolbarItems } from '../components';
import { DEFAULT_LAYOUT_PRESET_CARDS, LayoutPresetsViewPanel, type LayoutPresetValue } from '../view-panels/layout-presets';
import { PlaybookStepper } from '../view-panels/playbook/PlaybookStepper';
import { GraphLegend } from '../view-panels/legend';
import type { GraphCanvas } from '@invana/graph';
import type { ControlWidgetOptionsSpec, ControlWidgetProps } from './widgets';

// ── layout presets ─────────────────────────────────────────────────────────

/** Each preset's toolbar glyph. */
const PRESET_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  network: Share2,
  tree: Network,
  flow: Workflow,
  radial: Orbit,
};

/**
 * The layout button — the active preset's glyph and a chevron — and its popover,
 * `LayoutPresetsViewPanel`, bound to the `layout.preset` command: the cards are
 * the command's options (a preset the board can't take is disabled, its reason
 * the card's tooltip), a pick or an option change runs it with the overrides,
 * and *Run again* runs `layout.presetRun`. The active preset and its options
 * are read back from `definition.layoutPreset`, so undo, an import and a
 * walkthrough step all show here.
 */
function LayoutPresetsWidget({ canvas }: ControlWidgetProps) {
  const { states, run } = useCommandStates([{ command: 'layout.preset' }, { command: 'layout.presetRun' }], canvas);
  const preset = useLayoutPreset(canvas);
  const value: LayoutPresetValue = { presetId: preset?.id ?? '', overrides: preset?.overrides ?? {} };

  const offered = states[0]?.options ?? [];
  const presets = DEFAULT_LAYOUT_PRESET_CARDS.flatMap((card) => {
    const option = offered.find((o) => o.value === card.id);
    if (!option) return [];
    return [{ ...card, label: option.label, ...(option.disabled ? { disabledReason: option.description ?? 'Unavailable' } : {}) }];
  });
  const Icon = PRESET_ICONS[value.presetId] ?? Share2;
  const label = presets.find((p) => p.id === value.presetId)?.label ?? 'Layout';

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={`Layout · ${label}`} className="gap-0.5 px-1.5">
              <Icon />
              <ChevronDown className="size-3 opacity-70" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Layout · {label}</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-auto p-0">
        <LayoutPresetsViewPanel
          value={value}
          presets={presets}
          onChange={(next) => run('layout.preset', { value: next.presetId, overrides: next.overrides })}
          {...(states[1]?.enabled ? { onRunAgain: () => run('layout.presetRun') } : {})}
        />
      </PopoverContent>
    </Popover>
  );
}
LayoutPresetsWidget.optionsSpec = {} satisfies ControlWidgetOptionsSpec;

/** `definition.layoutPreset`, kept current. */
function useLayoutPreset(canvas: Canvas): CanvasLayoutPreset | null {
  const subscribe = useCallback((onChange: () => void) => canvas.store.view.subscribe(onChange), [canvas]);
  const read = () => canvas.store.view.getState().definition.layoutPreset;
  return useSyncExternalStore(subscribe, read, read);
}

// ── playbook ───────────────────────────────────────────────────────────────

export interface PlaybookPresentButtonProps {
  canvas: Canvas;
  onPresent: () => void;
  /** Fewest steps that make a walkthrough. Default `2`. */
  minSteps?: number;
}

/** *Present* — only when the playbook has something to walk through. */
export function PlaybookPresentButton({ canvas, onPresent, minSteps = 2 }: PlaybookPresentButtonProps) {
  const { steps } = usePlaybook(canvas);
  if (steps.length < minSteps) return null;
  return (
    <Button variant="ghost" size="sm" onClick={onPresent} className="gap-1 px-2">
      <Presentation /> Present
    </Button>
  );
}

/** The playbook stepper without a ✕ — a host adds its own close. */
function PlaybookStepperWidget({ canvas }: ControlWidgetProps) {
  return <PlaybookStepper canvas={canvas} />;
}

// ── view ───────────────────────────────────────────────────────────────────

/** Read the world point at the viewport's centre. */
function viewCentre(canvas: Canvas) {
  const cam = canvas.camera;
  const p = cam.toWorld(cam.screenWidth / 2, cam.screenHeight / 2);
  return { x: Math.round(p.x), y: Math.round(p.y), zoom: cam.scale };
}

/**
 * `Zoom 87% · Pan 1,240, −380` — the zoom, then the world point at the
 * viewport's centre (the same view on any screen size). Plain text that follows
 * the camera as it moves — drag, wheel, the zoom buttons, a fit — read at most
 * once a frame.
 */
function ViewReadoutWidget({ canvas }: ControlWidgetProps) {
  const [view, setView] = useState(() => viewCentre(canvas));
  useEffect(() => {
    let frame: number | null = null;
    const read = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setView(viewCentre(canvas));
      });
    };
    const offs = [
      select(canvas.store.view, (s) => s.interaction.camera).subscribe(read),
      canvas.events.on('input:camera:pan', read),
      canvas.events.on('input:camera:zoom', read),
    ];
    read();
    return () => {
      for (const off of offs) off();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [canvas]);
  const fmt = (n: number) => n.toLocaleString().replace('-', '−');
  return (
    <span className="text-sm whitespace-nowrap tabular-nums text-muted-foreground">
      Zoom {Math.round(view.zoom * 100)}% · Pan {fmt(view.x)}, {fmt(view.y)}
    </span>
  );
}
ViewReadoutWidget.optionsSpec = {} satisfies ControlWidgetOptionsSpec;

/** Full screen for the canvas host — the browser Fullscreen API. */
function FullscreenWidget() {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(document.fullscreenElement != null);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  return (
    <span ref={ref} className="contents">
      <ToolbarItems
        // One button, placed inside whatever row holds it.
        bare
        items={[{
          type: 'toggle',
          key: 'fullscreen',
          icon: Expand,
          activeIcon: Shrink,
          label: 'Full screen',
          activeLabel: 'Leave full screen',
          active: on,
          onToggle: () => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void positionedHost(ref.current)?.requestFullscreen();
          },
        }]}
      />
    </span>
  );
}

/** The nearest positioned ancestor of the panel — the canvas host the panels pin to. */
function positionedHost(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  let passedPanel = false;
  while (node) {
    const pos = getComputedStyle(node).position;
    if (pos === 'absolute') passedPanel = true;
    else if (passedPanel && pos === 'relative') return node;
    node = node.parentElement;
  }
  return document.documentElement;
}

/** The board's legend — `GraphLegend` on a card, for a panel with no surface. */
function GraphLegendWidget({ canvas, options }: ControlWidgetProps) {
  return (
    <GraphLegend
      canvas={canvas as GraphCanvas}
      layerId={(options?.layerId as string) ?? 'graph'}
      className="bg-background/90 w-48 rounded-md border border-border p-2"
    />
  );
}
GraphLegendWidget.optionsSpec = {
  layerId: { kind: 'string', label: 'Graph layer', default: 'graph' },
} satisfies ControlWidgetOptionsSpec;

/** The chrome widgets, merged into `DEFAULT_CONTROL_WIDGETS`. */
export const CHROME_CONTROL_WIDGETS = {
  'layout-presets': LayoutPresetsWidget,
  'playbook-stepper': PlaybookStepperWidget,
  'view-readout': ViewReadoutWidget,
  fullscreen: FullscreenWidget,
  'graph-legend': GraphLegendWidget,
};
