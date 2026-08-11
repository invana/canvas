/**
 * **Template Studio** — the full-feature showcase of the three-layer node model
 * (structure · styling · theme), built on `<GraphCanvasApp>` with the live editors
 * docked into the app's resizable `right` region:
 *
 *   - **Card + simple nodes** — `person` nodes render as composite **IdCards**
 *     (type tag · divider · avatar + title/subtitle); `Concept` nodes render as
 *     simple themed circles. Both come from `config`-authored `nodeTypes` +
 *     built-in structure/styling templates — no hand-authored `parts[]`.
 *   - **Theme** — light/dark via the header toggle; the six built-in palettes
 *     (`default/forest/ocean/gold/rose/minimal`) pushed live through the engine
 *     `ThemeBehaviour` (connected `update`). One switch recolours background,
 *     cards, circles, edges, labels — structure + styling never change.
 *   - **Live editors** — `<NodeStylingEditorPanel>` edits the IdCard's roles +
 *     typography; `<NodeStructureEditorPanel>` edits the `person` binding (structure
 *     + styling + the slot→data-field map). Each Apply pushes a
 *     `update({ layers: { graph: { … } } })` and the graph re-resolves.
 *
 * The editors are engine-agnostic `@invana/canvas-ui` forms — they produce JSON;
 * the docked panel owns the connected `useGraphCanvasUpdate()` that applies it. No
 * floating `Panel`, no hand-rolled CSS — chrome is `@invana/ui`.
 */

import { useContext, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CanvasConfig } from '@invana/canvas';
import { GraphCanvasContext, useGraphCanvasUpdate } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  NodeStylingEditorPanel,
  NodeStructureEditorPanel,
  ThemeToggle
} from '@invana/canvas-ui';
import {
  BUILT_IN_STRUCTURES,
  BUILT_IN_STYLINGS,
  type GraphData,
  type NodeStylingTemplate,
  type NodeTypeBinding
} from '@invana/graph';
import { ThemeProvider } from '@invana/themes';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@invana/ui';

const meta: Meta = { title: 'canvas-ui/editors/Template Studio' };
export default meta;
type Story = StoryObj;

// Active-toggle treatment for the palette chips (a subtle primary tint + ring
// over a ghost Button — the canvas-ui ACTIVE_CLASS convention).
const ACTIVE_CLASS = 'bg-primary/15 text-primary ring-1 ring-primary/25';

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
  ]
};

// Per-type bindings: card for people, simple circle for concepts. Both reference
// built-in structure + styling templates (merged in automatically).
const PERSON_BINDING: NodeTypeBinding = {
  structure: 'idCard',
  styling: 'idCard',
  bindings: { type: 'type', avatar: 'data.avatar', title: 'data.name', subtitle: 'data.role' }
};
const CONCEPT_BINDING: NodeTypeBinding = {
  structure: 'circle',
  styling: 'circle',
  bindings: { label: 'data.name' }
};

const THEMES = ['default', 'forest', 'ocean', 'gold', 'rose', 'minimal'];

// Config deep-merged over the GraphCanvasApp bundle: the per-type node bindings +
// edge style on the graph layer, force spacing tuned for wide cards, and
// colour-by-label OFF so the templates' own fills stick (the bundle tints by type
// otherwise). Light/dark + theme family ride the bundle's own ThemeBehaviour.
const CONFIG: CanvasConfig = {
  layers: {
    graph: {
      nodeTypes: { person: PERSON_BINDING, Concept: CONCEPT_BINDING },
      edge: { style: { strokeWidth: 1.2, arrowTargetShape: 'none' } }
    }
  },
  layouts: {
    'graph-force': {
      charge: { strength: -700 },
      link: { distance: 150 },
      collide: { radius: 120 },
      animate: false
    }
  },
  behaviours: { color: { enabled: false } }
};

/**
 * The docked right-region body — theme-family chips + the two live editors, wired
 * to the canvas via the connected `useGraphCanvasUpdate()`. Renders inside
 * `GraphCanvasApp`'s `right` section (a sibling of `<Canvas>`), so it's gated on
 * the lifted canvas being ready (`useCanvas()` — used by the update hook — throws
 * on null).
 */
function StudioEditors() {
  const update = useGraphCanvasUpdate();
  const [active, setActive] = useState('default');

  const structureNames = useMemo(() => Object.keys(BUILT_IN_STRUCTURES), []);
  const stylingNames = useMemo(() => Object.keys(BUILT_IN_STYLINGS), []);

  const setTheme = (name: string) => {
    setActive(name);
    update({ behaviours: { theme: { active: name } } });
  };
  const applyStyling = (styling: NodeStylingTemplate) =>
    update({ layers: { graph: { nodeStylingTemplates: { [styling.name]: styling } } } });
  const applyBinding = (binding: NodeTypeBinding) =>
    update({ layers: { graph: { nodeTypes: { person: binding } } } });

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Theme palette</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <Button
              key={t}
              variant="ghost"
              size="sm"
              onClick={() => setTheme(t)}
              className={`h-7 px-3 capitalize ${active === t ? ACTIVE_CLASS : ''}`}
            >
              {t}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">IdCard styling</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <NodeStylingEditorPanel defaults={BUILT_IN_STYLINGS.idCard} onSubmit={applyStyling} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">person binding</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <NodeStructureEditorPanel
            defaults={PERSON_BINDING}
            structures={structureNames}
            stylings={stylingNames}
            onSubmit={applyBinding}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/** Holds the editors until GraphCanvasApp's lifted context publishes the engine
 *  (`null` until then; the editors' `useGraphCanvasUpdate` → `useCanvas` throws on null). */
function StudioEditorsGate() {
  const canvas = useContext(GraphCanvasContext);
  if (!canvas) return null;
  return <StudioEditors />;
}

export const TemplateStudioStory: Story = {
  name: 'Template Studio',
  render: () => (
    <ThemeProvider>
      <GraphCanvasApp
        data={DATA}
        config={CONFIG}
        onReady={(c) => c?.showMessage('Edit styling / structure in the right panel · switch the theme palette')}
        header={{
          title: 'Template Studio',
          center: <GraphControlsToolbar />,
          right: (ctx) => <ThemeToggle ctx={ctx} />
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        // The three-layer editors, docked into the resizable right region.
        right={{ content: <StudioEditorsGate />, defaultSize: '360px', maxSize: '460px', collapsible: true }}
      />
    </ThemeProvider>
  )
};
