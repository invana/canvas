import {
  BackgroundLayer,
  CanvasThemeSync,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphCanvas,
  GraphLayer,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  WheelZoomBehaviour,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, NodeStructureRegistry, NodeTypeRegistry } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **`FreeformStructure` — one template, many nodes.** A structure is a
 * *skeleton*: the element list is fixed, and each `text` element either binds to
 * a **dotted data path** (`bind`) or carries a **literal** (`text`). Five nodes
 * below share one structure — the card is authored once and read five times.
 *
 * **The path is rooted at the node, not at `data`**
 * (`file:packages/graph/src/template/bindings.ts#L11`), so:
 *
 * | `bind` | Reads |
 * |---|---|
 * | `data.name` | `node.data.name` |
 * | `data.contact.email` | nested — the resolver walks every segment |
 * | `type` | `node.type` (the tag top-right) |
 * | `id` | `node.id` |
 *
 * Two behaviours the cards make visible, both worth knowing before you debug a
 * blank line:
 *
 * - **`text` is not a fallback for a failed `bind`.** The compiler picks `text`
 *   only when `bind` is *absent* — `el.bind ? resolveText(…) : (el.text ?? '')`
 *   (`file:packages/graph/src/template/compile.ts#L431`). A bind that resolves
 *   to nothing renders **empty**, and the element keeps its slot. `grace` has no
 *   `role` and `alan` no `contact`; both gaps are the same gap. (The field's own
 *   TSDoc says the literal is the fallback when `bind` is "empty *or
 *   unresolved*" — only the first half of that is true.)
 * - **A missing path never throws.** `resolvePath` returns `undefined` for any
 *   broken segment and `resolveText` maps that to `''`, so a typo'd path is a
 *   silent blank rather than a crash — which is exactly why the blank line above
 *   is worth recognising on sight.
 *
 * `maxWidth` + `maxLines` on the bio row ellipsises the long ones and leaves the
 * short one alone — same element, data-dependent result.
 *
 * Two node **types** (`person` · `contractor`) point at the **one** structure,
 * which is the normal shape of a registry: types are the domain vocabulary,
 * structures are the drawings.
 */
const meta: Meta = { title: 'graph/Nodes/Types/FreeformStructure/DataBinding' };
export default meta;
type Story = StoryObj;

// ── The definition — literal JSON, one structure for every node ──────────────
const STRUCTURES: NodeStructureRegistry = {
  person: {
    name: 'person',
    kind: 'freeform',
    width: 300,
    height: 132,
    cornerRadius: 12,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.2,
    elements: [
      { id: 'chip', type: 'circle', x: 14, y: 16, radius: 18, fillRole: 'accent', fillAlpha: 0.22 },
      // Rendered top 20 = y 6 + fontSize 14.
      { id: 'name', type: 'text', x: 62, y: 6, bind: 'data.name', fontSize: 14, fontWeight: 600, colorRole: 'heading' },
      // Bound, and blank when the node has no `role`.
      { id: 'role', type: 'text', x: 62, y: 29, bind: 'data.role', fontSize: 11, colorRole: 'muted' },
      // Binds `node.type` — the path is rooted at the node, so it needs no `data.` prefix.
      { id: 'type', type: 'text', x: 286, y: 10.5, bind: 'type', anchor: 'right', fontSize: 9.5, uppercase: true, colorRole: 'accent' },
      // Binds `node.id`.
      { id: 'id', type: 'text', x: 286, y: 30.5, bind: 'id', anchor: 'right', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule', type: 'line', x: 14, y: 62, x2: 286, y2: 62, colorRole: 'divider' },
      // A nested path: two segments below `data`.
      { id: 'email', type: 'text', x: 14, y: 61.5, bind: 'data.contact.email', fontSize: 10.5, colorRole: 'foreground' },
      // No `bind` → the literal is used. The same on every card, by definition.
      { id: 'onfile', type: 'text', x: 14, y: 82.5, text: 'on file', fontSize: 9.5, uppercase: true, colorRole: 'muted' },
      { id: 'bio', type: 'text', x: 14, y: 98, bind: 'data.bio', fontSize: 10, maxWidth: 272, maxLines: 1, colorRole: 'muted' }
    ]
  }
};

// Two domain types, one drawing. `styling` / `bindings` stay empty — a
// free-form structure carries its own colour roles and its own paths.
const TYPES: NodeTypeRegistry = {
  person: { structure: 'person', styling: '', bindings: {} },
  contractor: { structure: 'person', styling: '', bindings: {} }
};

const DATA: GraphData = {
  nodes: [
    {
      id: 'EMP-001',
      type: 'person',
      position: { x: -340, y: -90 },
      data: {
        name: 'Ada Lovelace',
        role: 'Principal Analyst',
        contact: { email: 'ada@analytical.example' },
        bio: 'Wrote the first algorithm intended for a machine, and the note about it is longer than the card.'
      }
    },
    {
      id: 'EMP-002',
      type: 'person',
      position: { x: 0, y: -90 },
      data: {
        name: 'Grace Hopper',
        // No `role`: the element keeps its slot and renders empty.
        contact: { email: 'grace@navy.example' },
        bio: 'Short bio — no ellipsis needed.'
      }
    },
    {
      id: 'CTR-014',
      type: 'contractor',
      position: { x: 340, y: -90 },
      data: {
        name: 'Alan Turing',
        role: 'Cryptanalysis Lead',
        // No `contact` at all: the *nested* path breaks at its first segment
        // and resolves to '' — the same blank as a missing leaf.
        bio: 'On contract. The type tag reads node.type, so this card says CONTRACTOR without any per-node styling.'
      }
    },
    {
      id: 'EMP-003',
      type: 'person',
      position: { x: -170, y: 90 },
      data: {
        name: 'Katherine Johnson',
        role: 'Orbital Mechanics',
        contact: { email: 'katherine@nasa.example' },
        bio: 'Same element, same maxWidth — data decides whether the ellipsis appears.'
      }
    },
    {
      id: 'EMP-004',
      type: 'person',
      position: { x: 170, y: 90 },
      // Everything missing at once: only the literals survive.
      data: {}
    }
  ],
  edges: []
};

const NODE: GraphLayerProps['node'] = { style: { labelText: '' } };

const CONFIG: CanvasConfig = { fitOnLoad: true };

export const DataBinding: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <CanvasThemeSync />
        <GraphLayer id="graph" data={DATA} node={NODE} nodeStructureTemplates={STRUCTURES} nodeTypes={TYPES} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag" />
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />
      </GraphCanvas>
    </div>
  )
};
