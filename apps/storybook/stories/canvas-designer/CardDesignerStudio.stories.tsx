/**
 * **Card Designer Studio** — end-users build their own node card, no developer
 * round-trip. The bottom panel is the free-form {@link NodeCardDesigner}: drag
 * elements onto the card, bind text to data fields, and colour by theme role.
 * Every edit live-registers the card as the `Movie` type's structure template,
 * so the real graph nodes above adopt it instantly. Switch themes and every
 * designed card recolours from the palette — the design (layout + bindings)
 * never changes.
 *
 * This is the self-service path: the designer emits a `FreeformStructure` (pure
 * JSON, rendered by the engine's `composite` shape); the host just pushes it via
 * `canvas.update({ layers: { graph: { nodeStructureTemplates, nodeTypes } } })`.
 */

import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  GraphLayer,
  ThemeBehaviour,
  D3ForceLayout,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
} from '@invana/canvas-react';
import { NodeCardDesigner } from '@invana/canvas-designer';
import {
  BUILT_IN_THEMES,
  type FreeformStructure,
  type GraphCanvas,
  type GraphData,
  type NodeStructureRegistry,
  type NodeTypeRegistry,
} from '@invana/graph';

const meta: Meta = { title: 'canvas-designer/Card Designer Studio' };
export default meta;
type Story = StoryObj;

// ─── Data — movies (designable cards) + people (simple) ─────────────────────
const DATA: GraphData = {
  nodes: [
    { id: 'm1', type: 'Movie', data: { title: 'Unforgiven', year: 1992, tagline: "It's a hell of a thing, killing a man", votes: 71 } },
    { id: 'm2', type: 'Movie', data: { title: 'The Matrix', year: 1999, tagline: 'Welcome to the real world', votes: 142 } },
    { id: 'm3', type: 'Movie', data: { title: 'Heat', year: 1995, tagline: 'A crew is only as strong as its weakest link', votes: 96 } },
    { id: 'p1', type: 'Person', data: { name: 'Clint Eastwood' } },
    { id: 'p2', type: 'Person', data: { name: 'Keanu Reeves' } },
    { id: 'p3', type: 'Person', data: { name: 'Al Pacino' } },
  ],
  edges: [
    { id: 'e1', source: 'p1', target: 'm1', type: 'DIRECTED' },
    { id: 'e2', source: 'p2', target: 'm2', type: 'ACTED_IN' },
    { id: 'e3', source: 'p3', target: 'm3', type: 'ACTED_IN' },
  ],
};

const MOVIE_FIELDS = [
  { key: 'data.title', label: 'Title' },
  { key: 'data.year', label: 'Year' },
  { key: 'data.tagline', label: 'Tagline' },
  { key: 'data.votes', label: 'Votes' },
  { key: 'type', label: 'Type' },
];

// A starter Movie card the user then tweaks (mirrors the yFiles sample card).
const STARTER: FreeformStructure = {
  name: 'movieCard',
  kind: 'freeform',
  width: 264,
  height: 150,
  cornerRadius: 12,
  bgRole: 'cardBg',
  elements: [
    { id: 'bar', type: 'rect', x: 0, y: 0, width: 264, height: 46, fillRole: 'accent' },
    { id: 'type', type: 'text', x: 16, y: 14, text: 'Movie', uppercase: true, fontSize: 14, fontWeight: 700, color: 0xffffff },
    { id: 'year', type: 'text', x: 210, y: 14, bind: 'data.year', fontSize: 14, fontWeight: 700, color: 0xffffff },
    { id: 'title', type: 'text', x: 16, y: 60, bind: 'data.title', fontSize: 22, fontWeight: 700, colorRole: 'heading', maxWidth: 232 },
    { id: 'tagline', type: 'text', x: 16, y: 92, bind: 'data.tagline', fontSize: 13, colorRole: 'muted', maxWidth: 232 },
    { id: 'votes', type: 'text', x: 16, y: 120, bind: 'data.votes', fontSize: 14, fontWeight: 600, colorRole: 'accent' },
  ],
};

const STRUCTURES: NodeStructureRegistry = { movieCard: STARTER };
const NODE_TYPES: NodeTypeRegistry = {
  Movie: { structure: 'movieCard', styling: '', bindings: {} },
  Person: { structure: 'circle', styling: 'circle', bindings: { label: 'data.name' } },
};

const THEMES = ['default', 'forest', 'ocean', 'gold', 'rose', 'minimal'];
const MODES = ['light', 'dark'] as const;

const CONFIG = {
  activeLayout: 'force',
  layers: {
    background: { type: 'pattern', patternType: 'grid', alpha: 0.5 },
    graph: { edge: { style: { strokeWidth: 1.2, arrowTargetShape: 'none' } } },
  },
  layouts: {
    force: { charge: { strength: -2000 }, link: { distance: 260 }, collide: { radius: 160 }, animate: false },
  },
  behaviours: {
    pan: { enabled: true },
    wheel: { enabled: true },
    'drag-node': { enabled: true },
    theme: { enabled: true, mode: 'dark', active: 'default', accent: 'css-var' },
  },
};

function CardDesignerStudio() {
  const canvasRef = useRef<GraphCanvas>(null);
  const [active, setActive] = useState('default');
  const [mode, setMode] = useState<(typeof MODES)[number]>('dark');

  // Role → hex palette for the active theme/mode, fed to the designer preview so
  // its canvas matches what the graph draws.
  const palette = useMemo(() => {
    const theme = BUILT_IN_THEMES[active] ?? BUILT_IN_THEMES.default!;
    const { categorical: _c, ...roles } = mode === 'dark' ? theme.dark : theme.light;
    return roles as Record<string, number>;
  }, [active, mode]);

  const setTheme = (name: string) => {
    setActive(name);
    canvasRef.current?.update({ behaviours: { theme: { active: name } } });
  };
  const setThemeMode = (m: (typeof MODES)[number]) => {
    setMode(m);
    canvasRef.current?.update({ behaviours: { theme: { mode: m } } });
  };

  // Live: re-register the designed card under a fixed name + keep Movie pointed at it.
  const applyTemplate = useCallback((tpl: FreeformStructure) => {
    const pinned: FreeformStructure = { ...tpl, name: 'movieCard' };
    canvasRef.current?.update({
      layers: {
        graph: {
          nodeStructureTemplates: { movieCard: pinned },
          nodeTypes: { Movie: { structure: 'movieCard', styling: '', bindings: {} } },
        },
      },
    });
  }, []);

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <strong style={{ fontSize: 14 }}>Card Designer Studio</strong>
        <span style={dimStyle}>theme</span>
        {THEMES.map((t) => (
          <button key={t} onClick={() => setTheme(t)} style={chip(active === t)}>
            {t}
          </button>
        ))}
        <span style={{ ...dimStyle, marginLeft: 8 }}>mode</span>
        {MODES.map((m) => (
          <button key={m} onClick={() => setThemeMode(m)} style={chip(mode === m)}>
            {m}
          </button>
        ))}
      </header>

      <div style={canvasHostStyle}>
        <Canvas ref={canvasRef} autoResize config={CONFIG}>
          <BackgroundLayer id="background" />
          <GraphLayer id="graph" data={DATA} nodeStructureTemplates={STRUCTURES} nodeTypes={NODE_TYPES} />
          <D3ForceLayout id="force" targetLayerId="graph" />
          <ThemeBehaviour id="theme" />
          <DragPanBehaviour id="pan" />
          <WheelZoomBehaviour id="wheel" />
          <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
        </Canvas>
      </div>

      <div style={designerStyle}>
        <NodeCardDesigner
          defaults={STARTER}
          dataFields={MOVIE_FIELDS}
          palette={palette}
          onChange={applyTemplate}
        />
      </div>
    </div>
  );
}

export const CardDesignerStudioStory: Story = {
  name: 'Card Designer Studio',
  render: () => <CardDesignerStudio />,
};

// ─── Layout ──────────────────────────────────────────────────────────────────
const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'var(--background, #fff)',
  color: 'var(--foreground, #111)',
};
const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  padding: '8px 12px',
  borderBottom: '1px solid var(--border, #e4e4e7)',
};
const dimStyle: CSSProperties = { fontSize: 11, opacity: 0.6, marginLeft: 4 };
const canvasHostStyle: CSSProperties = { position: 'relative', flex: 1, minHeight: 0 };
const designerStyle: CSSProperties = {
  borderTop: '1px solid var(--border, #e4e4e7)',
  maxHeight: '46vh',
  overflow: 'auto',
  background: 'var(--background, #fff)',
};
const chip = (on: boolean): CSSProperties => ({
  padding: '3px 9px',
  fontSize: 12,
  borderRadius: 6,
  cursor: 'pointer',
  textTransform: 'capitalize',
  border: `1px solid ${on ? 'var(--primary, #3b82f6)' : 'var(--border, #d4d4d8)'}`,
  background: on ? 'var(--primary, #3b82f6)' : 'transparent',
  color: on ? 'var(--primary-foreground, #fff)' : 'inherit',
});
