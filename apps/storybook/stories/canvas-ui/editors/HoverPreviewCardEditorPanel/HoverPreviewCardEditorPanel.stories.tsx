/**
 * `<HoverPreviewCardEditorPanel>` from `@invana/canvas-ui` — the schema-driven form that
 * produces one serializable `HoverElementPreviewCardSpec` (the per-type hover-card
 * definition), docked **live** into a `<GraphCanvasApp>`'s resizable `right`
 * region.
 *
 * Edit the card (image / title / subtitle / rows) and **Apply**, then hover any
 * node: the headless `<HoverElementPreviewBehaviour>` resolves the edited spec
 * against the hovered node's `data` and renders the canvas-ui `HoverElementPreviewCard`
 * live. That's exactly how a consumer wires the behaviour — the editor produces
 * JSON, the behaviour + card render it — with no floating `Panel`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { HoverElementPreviewBehaviour } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  HoverElementPreviewCard,
  HoverPreviewCardEditorPanel,
  ThemeToggle
} from '@invana/canvas-ui';
import type { GraphData, HoverElementPreviewCardSpec } from '@invana/graph';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/editors/HoverPreviewCardEditorPanel' };
export default meta;
type Story = StoryObj;

// The starting card spec — field paths resolve against each hovered node's
// record (`data.*`). Editing + Apply pushes a new spec to the behaviour.
const INITIAL_SPEC: HoverElementPreviewCardSpec = {
  image: { field: 'data.avatar', shape: 'circle' },
  title: { field: 'data.name' },
  subtitle: { field: 'data.bio', maxLines: 2 },
  rows: [
    { label: 'Role', field: 'data.role' },
    { label: 'Email', field: 'data.email' },
  ]
};

// A small `Person` graph carrying exactly the fields the spec references
// (`data.avatar` / `data.name` / `data.bio` / `data.role` / `data.email`), so the
// hover card renders fully populated. The bundle's force layout places them.
const DATA: GraphData = {
  nodes: [
    { id: 'ada', type: 'Person', data: { name: 'Ada Lovelace', role: 'Mathematician', bio: 'Credited as the first computer programmer for her work on the Analytical Engine.', email: 'ada@analytical.engine', avatar: 'https://i.pravatar.cc/96?img=5' } },
    { id: 'alan', type: 'Person', data: { name: 'Alan Turing', role: 'Computer Scientist', bio: 'Pioneer of theoretical computer science and artificial intelligence.', email: 'alan@turing.machine', avatar: 'https://i.pravatar.cc/96?img=12' } },
    { id: 'grace', type: 'Person', data: { name: 'Grace Hopper', role: 'Computer Scientist', bio: 'Popularised machine-independent programming languages.', email: 'grace@cobol.dev', avatar: 'https://i.pravatar.cc/96?img=47' } },
    { id: 'edsger', type: 'Person', data: { name: 'Edsger Dijkstra', role: 'Computer Scientist', bio: 'Foundational contributions to algorithms and structured programming.', email: 'edsger@shortest.path', avatar: 'https://i.pravatar.cc/96?img=33' } },
    { id: 'katherine', type: 'Person', data: { name: 'Katherine Johnson', role: 'Mathematician', bio: 'Orbital-mechanics calculations critical to early US crewed spaceflight.', email: 'katherine@orbit.nasa', avatar: 'https://i.pravatar.cc/96?img=20' } },
  ],
  edges: [
    { type: 'edge', id: 'ada-alan', source: 'ada', target: 'alan' },
    { type: 'edge', id: 'alan-grace', source: 'alan', target: 'grace' },
    { type: 'edge', id: 'ada-edsger', source: 'ada', target: 'edsger' },
    { type: 'edge', id: 'edsger-katherine', source: 'edsger', target: 'katherine' },
    { type: 'edge', id: 'grace-katherine', source: 'grace', target: 'katherine' },
  ]
};

export const HoverPreviewCardEditorStory: Story = {
  name: 'HoverPreviewCardEditorPanel',
  render: function Render() {
    // The live card spec — seeded from INITIAL_SPEC, replaced on each editor Apply.
    // Passed to the behaviour's `card` option (re-synced via setOptions), so the
    // next hover renders the edited card.
    const [spec, setSpec] = useState<HoverElementPreviewCardSpec>(INITIAL_SPEC);

    return (
      // A real consumer mounts the app under its own <ThemeProvider>.
      <ThemeProvider>
        <GraphCanvasApp
          data={DATA}
          onReady={(c) => c?.showMessage('Edit the card in the right panel · Apply · then hover a node')}
          header={{
            title: 'Hover Preview Card Editor',
            center: <GraphControlsToolbar />,
            right: (ctx) => <ThemeToggle ctx={ctx} />
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          // The controlled editor, docked in the resizable right region — a pure
          // form (defaults in → spec out on Apply), no engine reference of its own.
          right={{
            content: <HoverPreviewCardEditorPanel defaults={INITIAL_SPEC} onSubmit={setSpec} />,
            defaultSize: '380px',
            maxSize: '460px',
            collapsible: true
          }}
        >
          {/* Headless hover preview: resolves the live `spec` against the hovered
              node and renders the canvas-ui card. `card` re-syncs on every edit. */}
          <HoverElementPreviewBehaviour
            targetLayerId="graph"
            card={spec}
            renderCard={(s) => <HoverElementPreviewCard card={s.card} />}
          />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  }
};
