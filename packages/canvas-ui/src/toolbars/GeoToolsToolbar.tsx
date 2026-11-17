import { useEffect, useReducer } from 'react';
import type { Canvas } from '@invana/canvas';
import { useResolvedCanvas } from '@invana/canvas-react';
import { Download, Hexagon, MapPin, Ruler, Spline, SquareDashed } from 'lucide-react';

import { ToolbarItems } from '../components';
import type { ToolbarIcon, ToolbarItem } from '../components';

export interface GeoToolsToolbarProps {
  /** Id of the `DrawGeoFeatureBehaviour`. Default `'draw'`. */
  drawId?: string;
  /** Id of the `MeasureBehaviour`. Default `'measure'`. */
  measureId?: string;
  /** Id of the `GeoFeaturesLayer` the export reads. Default `'geo'`. */
  featuresLayerId?: string;
  /** File name for the GeoJSON export. Default `'features'`. */
  exportName?: string;
  /** Show the export button. Default `true`. */
  showExport?: boolean;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Explicit canvas instance; defaults to the `<Canvas>` context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/** The slice of the draw / measure behaviours the toolbar uses (no dependency on the maplibre package). */
interface ToolBehaviour {
  getOptions(): { tool?: string | null };
  subscribe(cb: () => void): () => void;
}

/** The slice of `GeoFeaturesLayer` the export uses. */
interface Exportable {
  toGeoJSONString(opts?: { pretty?: boolean }): string;
}

/**
 * Geo tools: draw a polygon, line or circle; measure a distance or an area; export
 * what was drawn as GeoJSON. Each tool button is a **toggle**: pressing one sets
 * that tool on the draw or measure behaviour (through `canvas.update`, so the
 * config stays the source of truth) and enables the behaviour; pressing it again
 * turns it off. Choosing a drawing tool turns the measuring tool off, and the
 * other way round. The buttons follow the behaviours, so leaving a tool with
 * Escape un-presses its button.
 *
 * Undo is not here — drawn features are in the canvas history, so
 * `HistoryToolbar` undoes a drawing like any edit.
 *
 * ```tsx
 * header={{ right: <GeoToolsToolbar drawId="draw" measureId="measure" featuresLayerId="geo" /> }}
 * ```
 */
export function GeoToolsToolbar({
  drawId = 'draw',
  measureId = 'measure',
  featuresLayerId = 'geo',
  exportName = 'features',
  showExport = true,
  orientation = 'horizontal',
  canvas,
  className,
}: GeoToolsToolbarProps) {
  const resolved = useResolvedCanvas(canvas);
  const [, refresh] = useReducer((n: number) => n + 1, 0);

  const behaviour = (id: string): ToolBehaviour | undefined => resolved.behaviours.get(id) as unknown as ToolBehaviour | undefined;

  // Follow both behaviours: an Escape inside the map un-presses the button.
  useEffect(() => {
    const offs = [drawId, measureId].map((id) => behaviour(id)?.subscribe(refresh));
    return () => offs.forEach((off) => off?.());
    // `behaviour` closes over `resolved` only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved, drawId, measureId]);

  const current = (id: string): string | null => behaviour(id)?.getOptions().tool ?? null;

  /** Set one tool (or none) across both behaviours; the other is switched off. */
  const pick = (id: string, tool: string): void => {
    const turningOff = current(id) === tool;
    const other = id === drawId ? measureId : drawId;
    resolved.update({
      behaviours: {
        [id]: { enabled: true, tool: turningOff ? null : tool },
        [other]: { tool: null },
      },
    } as never);
  };

  const toggle = (id: string, tool: string, label: string, icon: ToolbarIcon): ToolbarItem => ({
    type: 'toggle',
    key: `${id}-${tool}`,
    icon,
    label,
    activeLabel: `${label} (Esc to leave)`,
    active: current(id) === tool,
    onToggle: () => pick(id, tool),
  });

  const items: ToolbarItem[] = [
    toggle(drawId, 'polygon', 'Draw polygon', Hexagon),
    toggle(drawId, 'line', 'Draw line', Spline),
    toggle(drawId, 'circle', 'Draw circle (centre, then radius)', MapPin),
    toggle(measureId, 'distance', 'Measure distance', Ruler),
    toggle(measureId, 'area', 'Measure area', SquareDashed),
  ];
  if (showExport) {
    items.push({
      type: 'button',
      key: 'export-geojson',
      icon: Download,
      label: 'Export drawn features as GeoJSON',
      onClick: () => {
        const layer = resolved.layers.get(featuresLayerId) as unknown as Exportable | undefined;
        if (!layer) return;
        const blob = new Blob([layer.toGeoJSONString({ pretty: true })], { type: 'application/geo+json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = /\.(geo)?json$/i.test(exportName) ? exportName : `${exportName}.geojson`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      },
    });
  }

  return <ToolbarItems items={items} orientation={orientation} className={className} />;
}
