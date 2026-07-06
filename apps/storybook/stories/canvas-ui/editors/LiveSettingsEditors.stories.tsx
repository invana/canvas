import { Canvas, BackgroundLayer, GraphLayer, WheelZoomBehaviour, DragPanBehaviour, useCanvas } from '@invana/canvas-react';
import {
  BackgroundLayerEditor,
  WheelZoomEditor,
  GeometricLayoutEditor,
  backgroundLayerOptionsToForm,
  backgroundLayerFormToOptions,
  wheelZoomOptionsToForm,
  wheelZoomFormToOptions,
  geometricLayoutOptionsToForm,
  geometricLayoutFormToOptions,
  type BackgroundLayerOptions,
  type WheelZoomOptions,
  type GeometricLayoutOptions,
} from '@invana/canvas-ui';
import type { GraphData, GraphLayer as GraphLayerInstance } from '@invana/graph';
import { GeometricLayout } from '@invana/graph-layout-geometric';
import { lesMiserables } from '@invana/graph-datasets';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';

/**
 * `canvas-ui/editors/Live Settings Editors` — the three Behaviour / Layer /
 * Layout settings editors driving a **live** graph canvas.
 *
 * Each editor is engine-agnostic: it emits a serialisable options patch on
 * Apply. This story is the *consumer* — it holds the patch in React state and
 * feeds it to the `@invana/canvas-react` children, which project it onto the
 * running canvas:
 *  - **BackgroundLayer** — reactive props → `layer.setOptions` (updates instantly).
 *  - **WheelZoomBehaviour** — options are init-only, so a `key` remount recreates
 *    the behaviour with the new zoom settings.
 *  - **GeometricLayout** — no React wrapper, so an inline runner re-`apply`s the
 *    one-shot layout whenever its options change (nodes re-lay-out + auto-fit).
 *
 * This is the "state level" the editors expose: a class's constructor options
 * *are* the editable state of the visualisation (root CLAUDE.md rule 12).
 */
const meta: Meta = { title: 'canvas-ui/editors/Live Settings Editors' };
export default meta;
type Story = StoryObj;

// ─── Data ────────────────────────────────────────────────────────────────
// Les Misérables co-occurrence graph, typed by character group for colour.
const DATA: GraphData = {
  nodes: lesMiserables.nodes.map((n) => ({ id: n.id, type: `Group ${n.data.group}` })),
  edges: lesMiserables.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'APPEARS_WITH',
  })),
};

// ─── Initial option state (seeds both the canvas and the editors) ──────────
const INITIAL_BG: BackgroundLayerOptions = {
  type: 'pattern',
  patternType: 'dots',
  color: '#94a3b8',
  backgroundColor: '#f8fafc',
  size: 1,
  spacing: 24,
  alpha: 0.6,
  followCamera: true,
  mode: 'auto',
};

const INITIAL_WHEEL: WheelZoomOptions = { requireCtrl: false, percent: 0.1, smooth: false };

const INITIAL_GEO: GeometricLayoutOptions = {
  mode: 'grid',
  columnGap: 90,
  rowGap: 90,
  center: { x: 0, y: 0 },
};

/**
 * Inline declarative runner for the one-shot `GeometricLayout` (canvas-react
 * has no wrapper for it). Re-`apply`s the layout — with a fresh instance — every
 * time `options` changes, then fits the view. Must be mounted *after* the target
 * `<GraphLayer>` so the layer exists when the effect runs.
 */
function GeometricLayoutRunner({
  layerId,
  options,
}: {
  layerId: string;
  options: GeometricLayoutOptions;
}) {
  const canvas = useCanvas();
  useEffect(() => {
    const layer = canvas.layers.get<GraphLayerInstance>(layerId);
    if (!layer) return;
    let active = true;
    // The editor emits `transitionEase` as a free string; the layout narrows it
    // to `EasingName`. Adapt at the consumer boundary (an unknown ease is ignored).
    const layout = new GeometricLayout({
      targetLayerId: layerId,
      ...options,
    } as ConstructorParameters<typeof GeometricLayout>[0]);
    Promise.resolve(layout.apply(layer)).then(() => {
      if (active) canvas.camera.fitContent(layer.getBounds(), 80);
    });
    return () => {
      active = false;
      layout.stop?.();
    };
  }, [canvas, layerId, options]);
  return null;
}

// ─── Styles ────────────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '360px 1fr',
  height: '100vh',
  background: 'var(--background, #fff)',
  color: 'var(--foreground, #111)',
};
const sidebarStyle: React.CSSProperties = {
  overflowY: 'auto',
  borderRight: '1px solid var(--border, #e2e8f0)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};
const sectionHeaderStyle: React.CSSProperties = {
  margin: 0,
  padding: '12px 16px 0',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  opacity: 0.7,
};
const canvasHostStyle: React.CSSProperties = { position: 'relative', minWidth: 0 };

/**
 * The story. Editors live in the sidebar and, on Apply, push a serialisable
 * options patch into React state; the `<Canvas>` children read that state and
 * update the live canvas.
 */
export const LiveSettingsEditors: Story = {
  name: 'Live Settings Editors',
  render: function Render() {
    const [bgOpts, setBgOpts] = useState<BackgroundLayerOptions>(INITIAL_BG);
    const [wheelOpts, setWheelOpts] = useState<WheelZoomOptions>(INITIAL_WHEEL);
    const [wheelKey, setWheelKey] = useState(0);
    const [geoOpts, setGeoOpts] = useState<GeometricLayoutOptions>(INITIAL_GEO);

    return (
      <div style={pageStyle}>
        <aside style={sidebarStyle}>
          <h3 style={sectionHeaderStyle}>Layer · BackgroundLayer</h3>
          <BackgroundLayerEditor
            defaults={backgroundLayerOptionsToForm(INITIAL_BG)}
            onSubmit={(v) => setBgOpts(backgroundLayerFormToOptions(v))}
          />

          <h3 style={sectionHeaderStyle}>Behaviour · WheelZoom</h3>
          <WheelZoomEditor
            defaults={wheelZoomOptionsToForm(INITIAL_WHEEL)}
            onSubmit={(v) => {
              setWheelOpts(wheelZoomFormToOptions(v));
              setWheelKey((k) => k + 1); // remount to recreate with new options
            }}
          />

          <h3 style={sectionHeaderStyle}>Layout · GeometricLayout</h3>
          <GeometricLayoutEditor
            defaults={geometricLayoutOptionsToForm(INITIAL_GEO)}
            onSubmit={(v) => setGeoOpts(geometricLayoutFormToOptions(v))}
          />
        </aside>

        <div style={canvasHostStyle}>
          <Canvas autoResize style={{ width: '100%', height: '100%' }}>
            <BackgroundLayer id="background" {...bgOpts} />
            <GraphLayer id="graph" data={DATA} />
            <DragPanBehaviour id="pan" />
            <WheelZoomBehaviour key={wheelKey} id="wheel" {...wheelOpts} />
            <GeometricLayoutRunner layerId="graph" options={geoOpts} />
          </Canvas>
        </div>
      </div>
    );
  },
};
