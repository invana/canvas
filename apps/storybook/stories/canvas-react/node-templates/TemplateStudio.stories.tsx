/**
 * **Template Studio** — the full-feature showcase of the three-layer node model
 * (structure · styling · theme) wired live:
 *
 *   - **Card + simple nodes** — `person` nodes render as composite **IdCards**
 *     (type tag · divider · avatar + title/subtitle); `Concept` nodes render as
 *     simple themed circles. Both come from `config`-authored `nodeTypes` +
 *     built-in structure/styling templates — no hand-authored `parts[]`.
 *   - **Theme switching** — the six built-in palettes (`default/forest/ocean/
 *     gold/rose/minimal`) × light/dark, pushed live through the engine
 *     `ThemeBehaviour`. One switch recolours background, cards, circles, edges,
 *     labels — structure + styling never change.
 *   - **Live editors** — `<NodeStylingEditor>` edits the IdCard's roles +
 *     typography; `<NodeStructureEditor>` edits the `person` binding (structure
 *     + styling + the slot→data-field map). Each Apply pushes a
 *     `canvas.update({ layers: { graph: { … } } })` and the graph re-resolves.
 *
 * The editors are engine-agnostic `@invana/canvas-ui` forms — they just produce
 * JSON; this story owns the `canvas.update` that applies it.
 */

import { useMemo, useRef, useState, type CSSProperties } from 'react';
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
  HoverActivateBehaviour,
  ClickSelectBehaviour,
} from '@invana/canvas-react';
import { NodeStylingEditor, NodeStructureEditor } from '@invana/canvas-ui';
import {
  BUILT_IN_STRUCTURES,
  BUILT_IN_STYLINGS,
  type GraphCanvas,
  type GraphData,
  type NodeStylingTemplate,
  type NodeTypeBinding,
  type ThemeMode,
} from '@invana/graph';

const meta: Meta = { title: 'canvas-react/node-templates/Template Studio' };
export default meta;
type Story = StoryObj;

// ─── Data — people (cards) + concepts (simple circles) ──────────────────────
const DATA: GraphData = {
  nodes: [
    { id: 'ada', type: 'person', data: { name: 'Ada Lovelace', role: 'Mathematician', avatar: 'ada' } },
    { id: 'alan', type: 'person', data: { name: 'Alan Turing', role: 'Computer Scientist', avatar: 'alan' } },
    { id: 'grace', type: 'person', data: { name: 'Grace Hopper', role: 'Rear Admiral', avatar: 'grace' } },
    { id: 'ae', type: 'Concept', data: { name: 'Analytical Engine' } },
    { id: 'tm', type: 'Concept', data: { name: 'Turing Machine' } },
    { id: 'compiler', type: 'Concept', data: { name: 'Compiler' } },
  ],
  edges: [
    { id: 'e1', source: 'ada', target: 'ae', type: 'DESIGNED' },
    { id: 'e2', source: 'alan', target: 'tm', type: 'DESCRIBED' },
    { id: 'e3', source: 'grace', target: 'compiler', type: 'INVENTED' },
    { id: 'e4', source: 'ada', target: 'alan', type: 'INFLUENCED' },
    { id: 'e5', source: 'alan', target: 'grace', type: 'INFLUENCED' },
  ],
};

// Per-type bindings: card for people, simple circle for concepts. Both reference
// built-in structure + styling templates (merged in automatically).
const PERSON_BINDING: NodeTypeBinding = {
  structure: 'idCard',
  styling: 'idCard',
  bindings: { type: 'type', avatar: 'data.avatar', title: 'data.name', subtitle: 'data.role' },
};
const CONCEPT_BINDING: NodeTypeBinding = {
  structure: 'circle',
  styling: 'circle',
  bindings: { label: 'data.name' },
};

const THEMES = ['default', 'forest', 'ocean', 'gold', 'rose', 'minimal'];
const MODES: ThemeMode[] = ['system', 'light', 'dark'];

const CONFIG = {
  activeLayout: 'force',
  layers: {
    background: { type: 'pattern', patternType: 'grid', alpha: 0.5 },
    graph: { edge: { style: { strokeWidth: 1.2, arrowTargetShape: 'none' } } },
  },
  layouts: {
    force: { charge: { strength: -700 }, link: { distance: 150 }, collide: { radius: 120 }, animate: false },
  },
  behaviours: {
    pan: { enabled: true },
    wheel: { enabled: true },
    'drag-node': { enabled: true },
    hover: { enabled: true, state: 'highlighted', degree: 1 },
    'click-select': { enabled: true, multiple: true },
    // Sole theme publisher — named-palette path drives the whole canvas.
    theme: { enabled: true, mode: 'system', active: 'default', accent: 'css-var' },
  },
};

function TemplateStudio() {
  const canvasRef = useRef<GraphCanvas>(null);
  const [active, setActive] = useState('default');
  const [mode, setMode] = useState<ThemeMode>('system');

  const structureNames = useMemo(() => Object.keys(BUILT_IN_STRUCTURES), []);
  const stylingNames = useMemo(() => Object.keys(BUILT_IN_STYLINGS), []);

  const setTheme = (name: string) => {
    setActive(name);
    canvasRef.current?.update({ behaviours: { theme: { active: name } } });
  };
  const setThemeMode = (m: ThemeMode) => {
    setMode(m);
    canvasRef.current?.update({ behaviours: { theme: { mode: m } } });
  };
  const applyStyling = (styling: NodeStylingTemplate) =>
    canvasRef.current?.update({ layers: { graph: { nodeStylingTemplates: { [styling.name]: styling } } } });
  const applyBinding = (binding: NodeTypeBinding) =>
    canvasRef.current?.update({ layers: { graph: { nodeTypes: { person: binding } } } });

  return (
    <div style={pageStyle}>
      <aside style={sidebarStyle}>
        <section style={cardStyle}>
          <h3 style={h3Style}>Theme</h3>
          <div style={rowStyle}>
            {THEMES.map((t) => (
              <button key={t} onClick={() => setTheme(t)} style={chipStyle(active === t)}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ ...rowStyle, marginTop: 8 }}>
            {MODES.map((m) => (
              <button key={m} onClick={() => setThemeMode(m)} style={chipStyle(mode === m)}>
                {m}
              </button>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          <h3 style={h3Style}>IdCard styling</h3>
          <NodeStylingEditor defaults={BUILT_IN_STYLINGS.idCard} onSubmit={applyStyling} />
        </section>

        <section style={cardStyle}>
          <h3 style={h3Style}>person binding</h3>
          <NodeStructureEditor
            defaults={PERSON_BINDING}
            structures={structureNames}
            stylings={stylingNames}
            onSubmit={applyBinding}
          />
        </section>
      </aside>

      <div style={canvasHostStyle}>
        <Canvas ref={canvasRef} autoResize config={CONFIG}>
          <BackgroundLayer id="background" />
          <GraphLayer
            id="graph"
            data={DATA}
            nodeTypes={{ person: PERSON_BINDING, Concept: CONCEPT_BINDING }}
          />
          <D3ForceLayout id="force" targetLayerId="graph" />
          <ThemeBehaviour id="theme" />
          <DragPanBehaviour id="pan" />
          <WheelZoomBehaviour id="wheel" />
          <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
          <HoverActivateBehaviour id="hover" targetLayerId="graph" />
          <ClickSelectBehaviour id="click-select" targetLayerId="graph" />
        </Canvas>
      </div>
    </div>
  );
}

export const TemplateStudioStory: Story = {
  name: 'Template Studio',
  render: () => <TemplateStudio />,
};

// ─── Layout ──────────────────────────────────────────────────────────────────
const pageStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '340px 1fr',
  height: '100vh',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'var(--background, #fff)',
  color: 'var(--foreground, #111)',
};
const sidebarStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 12,
  overflow: 'auto',
  borderRight: '1px solid var(--border, #e4e4e7)',
};
const cardStyle: CSSProperties = {
  border: '1px solid var(--border, #e4e4e7)',
  borderRadius: 8,
  overflow: 'hidden',
};
const h3Style: CSSProperties = { margin: 0, padding: '10px 12px', fontSize: 13, fontWeight: 600 };
const rowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 12px 12px' };
const chipStyle = (on: boolean): CSSProperties => ({
  padding: '4px 10px',
  fontSize: 12,
  borderRadius: 6,
  cursor: 'pointer',
  textTransform: 'capitalize',
  border: `1px solid ${on ? 'var(--primary, #3b82f6)' : 'var(--border, #d4d4d8)'}`,
  background: on ? 'var(--primary, #3b82f6)' : 'transparent',
  color: on ? 'var(--primary-foreground, #fff)' : 'inherit',
});
const canvasHostStyle: CSSProperties = { position: 'relative', minWidth: 0 };
