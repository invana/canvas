/**
 * Export the canvas as an image — an interactive panel over `useCanvasExport`
 * (from `@invana/canvas-react`), which wraps the engine's `Canvas.export`.
 *
 * The control panel (top-right) exposes every export option so you can compare
 * results:
 *   - **Format** — `PNG` / `JPG` / `WebP` (raster via GPU `extract`) or `SVG`
 *     (true vector projection of the scene).
 *   - **Area** — `viewport` (WYSIWYG at the on-screen zoom) or `content` (the
 *     whole graph, off-screen included, regardless of the camera).
 *   - **Background** — `canvas` (matches the on-screen bg), `transparent`
 *     (alpha PNG/WebP/SVG), or a solid colour.
 *   - **Scale** — resolution multiplier for the raster formats.
 *   - **Aspect ratio** — force a specific output ratio. The capture region is
 *     *letterboxed* to it (grown + re-centred, never cropped), so pick e.g.
 *     `16:9` or `1:1` and the download keeps that ratio exactly while all
 *     content stays visible — the background fills the added margin.
 *
 * How to test the ratio: set **Aspect ratio = 1:1**, **Area = content**, export
 * PNG — the file is square with the graph centred. Switch to **16:9** and it's
 * wide. Open an **SVG** export in a browser and zoom — it stays crisp, and its
 * `viewBox` carries the same ratio. The graph mixes `circle`, `rect`, and `arc`
 * node shapes plus labels so the vector serialiser is exercised across kinds.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@invana/themes';
import {
  BackgroundLayer,
  DragPanBehaviour,
  GraphCanvasApp,
  GraphLayer,
  Panel,
  WheelZoomBehaviour,
  useCanvasExport,
} from '@invana/canvas-react';
import type { DownloadExportOptions } from '@invana/canvas-react';
import type { GraphData, GraphNode } from '@invana/graph';

const meta: Meta = { title: 'canvas-react/export/ExportImage' };
export default meta;
type Story = StoryObj;

// Fixed positions + a mix of shape kinds (circle / rect / arc) and labels so the
// SVG serialiser is exercised across shapes.
const data: GraphData = {
  nodes: [
    { id: 'core', type: 'Service', position: { x: 0, y: 0 }, data: { name: 'Core API' },
      style: { shape: { kind: 'rect', width: 96, height: 44, cornerRadius: 8 }, bgFill: 0x6366f1 } },
    { id: 'auth', type: 'Service', position: { x: -190, y: -110 }, data: { name: 'Auth' } },
    { id: 'db', type: 'Store', position: { x: 190, y: -110 }, data: { name: 'Database' },
      style: { bgFill: 0x10b981 } },
    { id: 'cache', type: 'Store', position: { x: 200, y: 110 }, data: { name: 'Cache' },
      style: { bgFill: 0x10b981 } },
    { id: 'worker', type: 'Job', position: { x: -200, y: 120 }, data: { name: 'Worker' },
      style: { bgFill: 0xf59e0b } },
    { id: 'gauge', type: 'Metric', position: { x: 0, y: 190 }, data: { name: 'SLA' },
      style: { shape: { kind: 'arc', innerR: 14, outerR: 26, startAngle: -1.9, endAngle: 1.2 }, bgFill: 0xef4444 } },
  ],
  edges: [
    { id: 'auth-core', source: 'auth', target: 'core' },
    { id: 'core-db', source: 'core', target: 'db' },
    { id: 'core-cache', source: 'core', target: 'cache' },
    { id: 'worker-core', source: 'worker', target: 'core' },
    { id: 'core-gauge', source: 'core', target: 'gauge' },
  ],
};

// ─── Option tables the panel selects from ────────────────────────────────────

const FORMATS = ['png', 'jpeg', 'webp', 'svg'] as const;
const AREAS = ['viewport', 'content'] as const;
const BACKGROUNDS = [
  { label: 'canvas', value: 'canvas' },
  { label: 'transparent', value: 'transparent' },
  { label: 'white', value: '#ffffff' },
  { label: 'dark', value: '#0b1220' },
] as const;
const SCALES = [1, 2, 3] as const;
const RATIOS = [
  { label: 'Free (natural)', value: 0 },
  { label: '1:1 (square)', value: 1 },
  { label: '16:9 (wide)', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '9:16 (portrait)', value: 9 / 16 },
] as const;

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: '#cbd5e1' };
const selectStyle: React.CSSProperties = {
  background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '5px 8px', fontSize: 12,
};

/**
 * Live export panel — holds the option state, calls `useCanvasExport().download`.
 * Rendered as a child of `GraphCanvasApp`, so the hook resolves the engine from
 * the `<Canvas>` context.
 */
function ExportControls() {
  const { download } = useCanvasExport();
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('png');
  const [area, setArea] = useState<(typeof AREAS)[number]>('content');
  const [background, setBackground] = useState<string>('canvas');
  const [scale, setScale] = useState<number>(2);
  const [ratio, setRatio] = useState<number>(0);

  const onExport = () => {
    const opts: DownloadExportOptions = {
      format,
      area,
      background,
      scale,
      filename: `export-${area}`,
      ...(ratio > 0 ? { aspectRatio: ratio } : {}),
    };
    void download(opts);
  };

  return (
    <Panel position="top-right">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, minWidth: 190,
        background: '#1e293b', border: '1px solid #334155', borderRadius: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Export</div>

        <label style={labelStyle}>Format
          <select style={selectStyle} value={format} onChange={(e) => setFormat(e.target.value as (typeof FORMATS)[number])}>
            {FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
          </select>
        </label>

        <label style={labelStyle}>Area
          <select style={selectStyle} value={area} onChange={(e) => setArea(e.target.value as (typeof AREAS)[number])}>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>

        <label style={labelStyle}>Background
          <select style={selectStyle} value={background} onChange={(e) => setBackground(e.target.value)}>
            {BACKGROUNDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </label>

        <label style={labelStyle}>Scale (raster)
          <select style={selectStyle} value={scale} onChange={(e) => setScale(Number(e.target.value))}>
            {SCALES.map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
        </label>

        <label style={labelStyle}>Aspect ratio
          <select style={selectStyle} value={ratio} onChange={(e) => setRatio(Number(e.target.value))}>
            {RATIOS.map((r) => <option key={r.label} value={r.value}>{r.label}</option>)}
          </select>
        </label>

        <button
          type="button"
          onClick={onExport}
          style={{ marginTop: 2, padding: '7px 10px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7 }}
        >
          Download
        </button>
      </div>
    </Panel>
  );
}

export const ExportImage: Story = {
  render: () => (
    <ThemeProvider storageKey={null}>
      <GraphCanvasApp data={data} bundle={false} height="100vh">
        <BackgroundLayer id="background" type="pattern" patternType="dots" backgroundColor="#0b1220" color="#1e293b" />
        <GraphLayer
          id="graph"
          data={data}
          node={{
            style: {
              shape: { kind: 'circle', radius: 26 },
              bgFill: 0x6366f1,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 2,
              labelText: (n: GraphNode) => (n.data as { name: string }).name,
              labelColor: 0xf8fafc,
              labelFontSize: 12,
              labelPlacement: 'center',
            },
          }}
          edge={{ style: { strokeColor: 0x64748b, strokeWidth: 2 } }}
        />

        <DragPanBehaviour id="pan" enabled />
        <WheelZoomBehaviour id="zoom" enabled />

        <ExportControls />
      </GraphCanvasApp>
    </ThemeProvider>
  ),
};
