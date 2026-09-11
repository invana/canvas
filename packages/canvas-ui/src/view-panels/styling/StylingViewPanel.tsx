// StylingViewPanel — per **type on this canvas**: colour, label property, and
// size/width.
//
// The other style surfaces in this package edit either one *element*
// (`toolbars/InspectorPanel` → `PropertiesEditor`) or one *style object*
// (`editor-panels/node-style`). This one edits the **types the canvas is
// currently painting**: it reads them from `useDerivedSchema` (so a type appears
// the moment data carrying it loads, and its property keys become the
// label-key choices, alongside the root `id` / `type`) and emits a serialisable
// `{ nodeTypes, edgeTypes }` patch keyed by type name. Label keys are
// **root-relative dot paths** (`'id'` · `'type'` · `'data.name'`) — the same
// addressing `ColorByBehaviour.nodeValueKey` uses.
//
// **Controlled for persistence, live for painting.** The patch is a value the
// host owns — Invana persists it on the canvas record and feeds it back as
// `value`, which is why the panel can be reopened on another machine and still
// show the same styling. On top of that the panel *applies* it (`apply`,
// default on) as template field resolvers on the target `GraphLayer`, so an
// edit paints immediately and later-arriving nodes are styled on arrival. It
// writes no per-node style into the store — see `useApplyTypeStyling`.
//
// Import-clean like its neighbours: `@invana/graph` for **types only**, chrome
// from `@invana/ui` / `@invana/forms`.

import { useContext } from 'react';
import { Button, Popover, PopoverContent, PopoverTrigger, ScrollArea, cn } from '@invana/ui';
import {
  ColorSwatches,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ColorPreset,
} from '@invana/forms';
import { RotateCcw } from 'lucide-react';
import { GraphCanvasContext } from '@invana/canvas-react';

import { COLOR_PRESETS } from '../../shared/colors';
import { useDerivedSchema } from '../schema/useDerivedSchema';
import type { EdgeTypeStyling, NodeTypeStyling, StylingViewPanelProps } from './types';
import { useApplyTypeStyling } from './useApplyTypeStyling';
import { defaultTypeColor, LABEL_DEFAULT, labelKeyOptions } from './utils';

/** A swatch button that opens the design-kit colour picker. */
function ColorControl({
  color,
  label,
  presets,
  onPick,
}: {
  color: string;
  label: string;
  presets: ColorPreset[];
  onPick: (next: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={`${label} colour`}
          title={`${label} colour`}
          className="h-6 w-8 shrink-0 p-0"
        >
          {/* Dynamic colour — the one inline style rule 13 allows. */}
          <span className="h-4 w-6 rounded-sm" style={{ backgroundColor: color }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <ColorSwatches value={color} onChange={onPick} presetColors={presets} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Per-type styling for the types a live `GraphCanvas` is painting — one row per
 * node type (colour · label property · size) and one per edge type (colour ·
 * width), read reactively from the canvas's derived schema.
 *
 * Controlled: `value` in, a whole `TypeStylingPatch` out of `onChange` on every
 * edit, which the host persists. It also paints the patch on the target layer
 * unless {@link StylingViewPanelProps.apply} is false. A per-row reset (↺)
 * appears once a type carries an override, so "styled" and "default" stay
 * distinguishable.
 *
 * Bare content, like every `view-panels/` surface — wrap it in a `<Panel>` +
 * `<PanelContent>` for the floating-card chrome.
 */
export function StylingViewPanel({
  canvas: explicit,
  layerId = 'graph',
  value,
  onChange,
  presetColors,
  sizeRange = [4, 64],
  widthRange = [0.5, 12],
  apply = true,
  emptyText = 'Load some data, then style its node & edge types here.',
  className,
}: StylingViewPanelProps) {
  const contextCanvas = useContext(GraphCanvasContext);
  const canvas = explicit ?? contextCanvas;
  const schema = useDerivedSchema(canvas, { layerId });
  useApplyTypeStyling(canvas, layerId, value, apply);
  const presets = presetColors ?? [...COLOR_PRESETS];

  const setNode = (type: string, patch: NodeTypeStyling): void => {
    const nodeTypes = { ...(value.nodeTypes ?? {}) };
    nodeTypes[type] = { ...nodeTypes[type], ...patch };
    onChange({ ...value, nodeTypes });
  };
  const setEdge = (type: string, patch: EdgeTypeStyling): void => {
    const edgeTypes = { ...(value.edgeTypes ?? {}) };
    edgeTypes[type] = { ...edgeTypes[type], ...patch };
    onChange({ ...value, edgeTypes });
  };
  const resetNode = (type: string): void => {
    const nodeTypes = { ...(value.nodeTypes ?? {}) };
    delete nodeTypes[type];
    onChange({ ...value, nodeTypes });
  };
  const resetEdge = (type: string): void => {
    const edgeTypes = { ...(value.edgeTypes ?? {}) };
    delete edgeTypes[type];
    onChange({ ...value, edgeTypes });
  };

  const empty = schema.nodeTypes.length === 0 && schema.edgeTypes.length === 0;

  return (
    <div className={cn('flex h-full min-h-0 flex-col text-sm', className)}>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-2">
          {empty && <p className="px-1 text-xs text-muted-foreground">{emptyText}</p>}

          {schema.nodeTypes.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Node types
              </p>
              {schema.nodeTypes.map((t) => {
                const style = value.nodeTypes?.[t.name] ?? {};
                const styled = Object.keys(style).length > 0;
                return (
                  <div key={t.name} className="flex flex-col gap-1.5 rounded-md border border-border p-2">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate" title={t.name}>
                        {t.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{t.count}</span>
                      {styled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          title={`Reset ${t.name} to the default styling`}
                          aria-label={`Reset ${t.name} to the default styling`}
                          onClick={() => resetNode(t.name)}
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </Button>
                      )}
                      <ColorControl
                        color={style.color ?? defaultTypeColor(t.name)}
                        label={t.name}
                        presets={presets}
                        onPick={(color) => setNode(t.name, { color })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={style.labelKey ?? LABEL_DEFAULT}
                        onValueChange={(next) =>
                          setNode(t.name, {
                            labelKey: next === LABEL_DEFAULT ? undefined : next,
                          })
                        }
                      >
                        <SelectTrigger triggerSize="sm" className="min-w-0 flex-1" aria-label={`${t.name} label key`}>
                          <SelectValue placeholder="default" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={LABEL_DEFAULT}>default</SelectItem>
                          {labelKeyOptions(t.properties).map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        inputSize="sm"
                        type="number"
                        min={sizeRange[0]}
                        max={sizeRange[1]}
                        placeholder="size"
                        aria-label={`${t.name} size`}
                        className="w-16 shrink-0"
                        value={style.size ?? ''}
                        onChange={(e) =>
                          setNode(t.name, {
                            size: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {schema.edgeTypes.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Edge types
              </p>
              {schema.edgeTypes.map((t) => {
                const style = value.edgeTypes?.[t.name] ?? {};
                const styled = Object.keys(style).length > 0;
                return (
                  <div key={t.name} className="flex items-center gap-2 rounded-md border border-border p-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-xs" title={t.name}>
                      {t.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{t.count}</span>
                    {styled && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        title={`Reset ${t.name} to the default styling`}
                        aria-label={`Reset ${t.name} to the default styling`}
                        onClick={() => resetEdge(t.name)}
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-muted-foreground/70" />
                      </Button>
                    )}
                    <Input
                      inputSize="sm"
                      type="number"
                      min={widthRange[0]}
                      max={widthRange[1]}
                      step={0.5}
                      placeholder="width"
                      aria-label={`${t.name} width`}
                      className="w-16 shrink-0"
                      value={style.width ?? ''}
                      onChange={(e) =>
                        setEdge(t.name, {
                          width: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                    <ColorControl
                      color={style.color ?? defaultTypeColor(t.name)}
                      label={t.name}
                      presets={presets}
                      onPick={(color) => setEdge(t.name, { color })}
                    />
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
