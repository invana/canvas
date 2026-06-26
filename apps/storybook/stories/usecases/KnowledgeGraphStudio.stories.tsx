/**
 * **Knowledge Graph Studio** — a full-capability showcase of the three-layer
 * node model (structure · styling · theme) on a real-world knowledge graph.
 *
 *   - **Multiple card node types** — `Person` nodes render as composite
 *     **IdCards** (type tag · avatar · name + role); `Organization` nodes use a
 *     **custom card structure** (`orgCard`: type tag · name + founded);
 *     `Concept` nodes are simple themed circles. All declared as `nodeTypes` +
 *     structure/styling templates — no hand-authored `parts[]`.
 *   - **Theming** — the six built-in palettes (`default/forest/ocean/gold/rose/
 *     minimal`) × light/dark, pushed live through the engine `ThemeBehaviour`.
 *     One switch recolours background, cards, circles, edges, labels — structure
 *     + styling never change.
 *   - **Live editors** — pick a node type, then edit its **structure binding**
 *     (`<NodeStructureEditor>`: structure + styling + the slot→data-field map)
 *     and its **styling** (`<NodeStylingEditor>`: roles + typography). Each Apply
 *     pushes a `canvas.update({ layers: { graph: { … } } })` and the graph
 *     re-resolves instantly.
 *
 * The editors are engine-agnostic `@invana/canvas-ui` forms — they produce JSON;
 * this story owns the `canvas.update` that applies it.
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
import { NodeStylingEditor, NodeStructureEditor } from '@invana/canvas-ui';
import {
  BUILT_IN_STRUCTURES,
  BUILT_IN_STYLINGS,
  type CardStructure,
  type GraphCanvas,
  type GraphData,
  type NodeStylingTemplate,
  type NodeStructureRegistry,
  type NodeStylingRegistry,
  type NodeTypeBinding,
  type NodeTypeRegistry,
  type ThemeMode,
} from '@invana/graph';

const meta: Meta = { title: 'Usecases/Knowledge Graph Studio' };
export default meta;
type Story = StoryObj;

// ─── Data — people + organisations (cards) · concepts (simple circles) ──────
const DATA: GraphData = {
  nodes: [
    { id: 'ada', type: 'Person', data: { name: 'Ada Lovelace', role: 'Mathematician', avatar: 'ada' } },
    { id: 'alan', type: 'Person', data: { name: 'Alan Turing', role: 'Computer Scientist', avatar: 'alan' } },
    { id: 'grace', type: 'Person', data: { name: 'Grace Hopper', role: 'Rear Admiral', avatar: 'grace' } },
    { id: 'tim', type: 'Person', data: { name: 'Tim Berners-Lee', role: 'Engineer', avatar: 'tim' } },
    { id: 'cambridge', type: 'Organization', data: { name: 'Univ. of Cambridge', founded: 'est. 1209' } },
    { id: 'cern', type: 'Organization', data: { name: 'CERN', founded: 'est. 1954' } },
    { id: 'ae', type: 'Concept', data: { name: 'Analytical Engine' } },
    { id: 'tm', type: 'Concept', data: { name: 'Turing Machine' } },
    { id: 'cobol', type: 'Concept', data: { name: 'COBOL' } },
    { id: 'www', type: 'Concept', data: { name: 'World Wide Web' } },
  ],
  edges: [
    { id: 'e1', source: 'ada', target: 'ae', type: 'DESIGNED' },
    { id: 'e2', source: 'alan', target: 'tm', type: 'DESCRIBED' },
    { id: 'e3', source: 'grace', target: 'cobol', type: 'CREATED' },
    { id: 'e4', source: 'tim', target: 'www', type: 'INVENTED' },
    { id: 'e5', source: 'alan', target: 'cambridge', type: 'STUDIED_AT' },
    { id: 'e6', source: 'tim', target: 'cern', type: 'WORKED_AT' },
    { id: 'e7', source: 'ada', target: 'alan', type: 'INFLUENCED' },
    { id: 'e8', source: 'alan', target: 'grace', type: 'INFLUENCED' },
    { id: 'e9', source: 'ae', target: 'tm', type: 'INSPIRED' },
  ],
};

// ─── Custom card structure + styling for `Organization` ─────────────────────
// (Built-in `idCard` / `circle` come free — only the custom ones are declared.)
const ORG_CARD: CardStructure = {
  name: 'orgCard',
  kind: 'card',
  width: 200,
  height: 78,
  rows: [
    { slots: [{ slot: 'type', kind: 'tag' }] },
    { divider: true },
    { slots: [{ stack: [{ slot: 'title', kind: 'text' }, { slot: 'subtitle', kind: 'text' }] }] },
  ],
};
const ORG_CARD_STYLING: NodeStylingTemplate = {
  name: 'orgCard',
  bgRole: 'cardBg',
  accentRole: 'accent',
  slots: {
    type: { colorRole: 'accent', fontSize: 10, fontWeight: 700, uppercase: true },
    title: { colorRole: 'heading', fontSize: 15, fontWeight: 700 },
    subtitle: { colorRole: 'muted', fontSize: 11 },
    divider: { colorRole: 'divider' },
  },
};

const STRUCTURES: NodeStructureRegistry = { orgCard: ORG_CARD };
const STYLINGS: NodeStylingRegistry = {
  idCard: BUILT_IN_STYLINGS.idCard!,
  circle: BUILT_IN_STYLINGS.circle!,
  orgCard: ORG_CARD_STYLING,
};
const NODE_TYPES: NodeTypeRegistry = {
  Person: {
    structure: 'idCard',
    styling: 'idCard',
    bindings: { type: 'type', avatar: 'data.avatar', title: 'data.name', subtitle: 'data.role' },
  },
  Organization: {
    structure: 'orgCard',
    styling: 'orgCard',
    bindings: { type: 'type', title: 'data.name', subtitle: 'data.founded' },
  },
  Concept: { structure: 'circle', styling: 'circle', bindings: { label: 'data.name' } },
};

const THEMES = ['default', 'forest', 'ocean', 'gold', 'rose', 'minimal'];
const MODES: ThemeMode[] = ['system', 'light', 'dark'];
const EDITABLE_TYPES = ['Person', 'Organization', 'Concept'];

const CONFIG = {
  activeLayout: 'force',
  layers: {
    background: { type: 'pattern', patternType: 'grid', alpha: 0.5 },
    graph: { edge: { style: { strokeWidth: 1.2, arrowTargetShape: 'none' } } },
  },
  layouts: {
    force: { charge: { strength: -1400 }, link: { distance: 200 }, collide: { radius: 130 }, animate: false },
  },
  behaviours: {
    pan: { enabled: true },
    wheel: { enabled: true },
    'drag-node': { enabled: true },
    // Hover/select intentionally omitted: their `dimmed` state drops cards to
    // 25% alpha, which reads as the card text "disappearing". The studio is
    // about templates + theming, so we keep the canvas plain and legible.
    theme: { enabled: true, mode: 'system', active: 'default', accent: 'css-var' },
  },
};

function KnowledgeGraphStudio() {
  const canvasRef = useRef<GraphCanvas>(null);
  const [active, setActive] = useState('default');
  const [mode, setMode] = useState<ThemeMode>('system');
  const [editType, setEditType] = useState('Person');

  // Live registries — seeded from the config, mutated as the editors Apply.
  const [stylings, setStylings] = useState<NodeStylingRegistry>(STYLINGS);
  const [nodeTypes, setNodeTypes] = useState<NodeTypeRegistry>(NODE_TYPES);

  const structureNames = useMemo(
    () => [...Object.keys(BUILT_IN_STRUCTURES), ...Object.keys(STRUCTURES)],
    [],
  );
  const stylingNames = useMemo(() => Object.keys(stylings), [stylings]);

  const binding: NodeTypeBinding = nodeTypes[editType] ?? NODE_TYPES[editType]!;
  const stylingName = binding.styling;
  const styling: NodeStylingTemplate =
    stylings[stylingName] ?? BUILT_IN_STYLINGS[stylingName] ?? { name: stylingName };
  // Pick which styling controls are relevant by the structure kind, so every
  // field in the form actually affects the canvas (cards ignore fill/stroke/
  // label; simple shapes have no slots).
  const structure = STRUCTURES[binding.structure] ?? BUILT_IN_STRUCTURES[binding.structure];
  const stylingVariant: 'card' | 'simple' = structure?.kind === 'card' ? 'card' : 'simple';

  const setTheme = (name: string) => {
    setActive(name);
    canvasRef.current?.update({ behaviours: { theme: { active: name } } });
  };
  const setThemeMode = (m: ThemeMode) => {
    setMode(m);
    canvasRef.current?.update({ behaviours: { theme: { mode: m } } });
  };
  // Live edits: pin the template name to the one the active type references, so
  // typing in the editor's `name` field can't fork it into an orphan template.
  const applyStyling = useCallback(
    (next: NodeStylingTemplate) => {
      const pinned = { ...next, name: stylingName };
      setStylings((prev) => ({ ...prev, [stylingName]: pinned }));
      canvasRef.current?.update({ layers: { graph: { nodeStylingTemplates: { [stylingName]: pinned } } } });
    },
    [stylingName],
  );
  const applyBinding = useCallback(
    (next: NodeTypeBinding) => {
      setNodeTypes((prev) => ({ ...prev, [editType]: next }));
      canvasRef.current?.update({ layers: { graph: { nodeTypes: { [editType]: next } } } });
    },
    [editType],
  );

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
          <h3 style={h3Style}>Edit node type</h3>
          <div style={rowStyle}>
            {EDITABLE_TYPES.map((t) => (
              <button key={t} onClick={() => setEditType(t)} style={chipStyle(editType === t)}>
                {t}
              </button>
            ))}
          </div>
          <p style={hintStyle}>Edits below apply live to the canvas as you change them.</p>
        </section>

        <section style={cardStyle}>
          <h3 style={h3Style}>{editType} · structure</h3>
          <NodeStructureEditor
            key={`struct-${editType}`}
            defaults={binding}
            structures={structureNames}
            stylings={stylingNames}
            onChange={applyBinding}
            onSubmit={applyBinding}
          />
        </section>

        <section style={cardStyle}>
          <h3 style={h3Style}>{editType} · styling ({stylingName})</h3>
          <NodeStylingEditor
            key={`style-${editType}-${stylingName}`}
            defaults={styling}
            variant={stylingVariant}
            onChange={applyStyling}
            onSubmit={applyStyling}
          />
        </section>
      </aside>

      <div style={canvasHostStyle}>
        <Canvas ref={canvasRef} autoResize config={CONFIG}>
          <BackgroundLayer id="background" />
          <GraphLayer
            id="graph"
            data={DATA}
            nodeStructureTemplates={STRUCTURES}
            nodeStylingTemplates={STYLINGS}
            nodeTypes={NODE_TYPES}
          />
          <D3ForceLayout id="force" targetLayerId="graph" />
          <ThemeBehaviour id="theme" />
          <DragPanBehaviour id="pan" />
          <WheelZoomBehaviour id="wheel" />
          <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
        </Canvas>
      </div>
    </div>
  );
}

export const KnowledgeGraphStudioStory: Story = {
  name: 'Knowledge Graph Studio',
  render: () => <KnowledgeGraphStudio />,
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
const hintStyle: CSSProperties = {
  margin: 0,
  padding: '0 12px 12px',
  fontSize: 11,
  opacity: 0.6,
};
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
