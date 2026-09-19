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
 * **`FreeformStructure` — every colour is a pair.** Each colour on a structure
 * or an element is two fields: a **`*Role`** (themed — resolved from the active
 * palette) and a **direct number** (a fixed literal). `GraphLayer` recompiles
 * every structure against the live palette on each `theme:change`, so a
 * role-coloured card follows the theme without remounting the layer.
 *
 * **Flip the Storybook theme toolbar and watch the three cards disagree.**
 *
 * | Card | Authored with | On a theme switch |
 * |---|---|---|
 * | `themed` | `bgRole` · `strokeRole` · `colorRole` · `fillRole` throughout | recolours — body, text, rule and chip all move |
 * | `pinned` | numeric literals throughout | doesn't move; stays a light card on a dark canvas |
 * | `pair` | **both** halves set on every colour | recolours — the role wins |
 *
 * The rule, exactly: `color()` returns the palette entry when the role is set
 * *and the palette defines it*, and falls back to the literal otherwise
 * (`file:packages/graph/src/template/compile.ts#L~360`). So the literal half of
 * a pair is a **fallback**, not an override — which is why the `pair` card
 * renders identically to `themed` even though it carries `pinned`'s numbers.
 *
 * **What stays literal on purpose.** The role vocabulary is chrome only —
 * `surface` · `cardBg` · `foreground` · `heading` · `muted` · `accent` ·
 * `divider` · `stroke` · `selectionRing` · `hoverRing`. There is no `success` /
 * `warning` / `danger` / `info`, so a **meaning** — a run state, a bound, a key
 * — keeps a numeric colour. All three cards pin the same green status dot
 * (`0x1da54f`), and that is correct in every one of them: the state is not
 * chrome, and it must read the same in both modes.
 *
 * The wiring that makes this work is two components, never a hand-read of the
 * document: **`<ThemeBehaviour>`** (the sole publisher of `theme:change`) and
 * **`<CanvasThemeSync>`** (carries the host toolbar's mode *and* family into the
 * canvas).
 */
const meta: Meta = { title: 'graph/Nodes/Types/FreeformStructure/Theming' };
export default meta;
type Story = StoryObj;

// ── The definition — the same card, three colour strategies ─────────────────
const STRUCTURES: NodeStructureRegistry = {
  /** Every chrome colour is a role. The one literal is the status dot. */
  themed: {
    name: 'themed',
    kind: 'freeform',
    width: 260,
    height: 140,
    cornerRadius: 12,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.2,
    elements: [
      { id: 'bar', type: 'rect', x: 14, y: 18, width: 4, height: 40, cornerRadius: 2, fillRole: 'accent' },
      { id: 'title', type: 'text', x: 30, y: 4, bind: 'data.title', fontSize: 14, fontWeight: 600, colorRole: 'heading' },
      { id: 'note', type: 'text', x: 30, y: 29.5, bind: 'data.note', fontSize: 10.5, colorRole: 'muted' },
      { id: 'rule', type: 'line', x: 14, y: 70, x2: 246, y2: 70, colorRole: 'divider' },
      // Meaning, not chrome: pinned in all three cards, deliberately.
      { id: 'dot', type: 'circle', x: 14, y: 84, radius: 5, fill: 0x1da54f },
      { id: 'state', type: 'text', x: 30, y: 73.5, text: 'healthy', fontSize: 10.5, colorRole: 'foreground' },
      { id: 'foot', type: 'text', x: 14, y: 98.5, bind: 'data.foot', fontSize: 9.5, colorRole: 'muted' }
    ]
  },

  /** The same card with the light palette's numbers baked in. */
  pinned: {
    name: 'pinned',
    kind: 'freeform',
    width: 260,
    height: 140,
    cornerRadius: 12,
    bg: 0xffffff,
    stroke: 0xe2e8f0,
    strokeWidth: 1.2,
    elements: [
      { id: 'bar', type: 'rect', x: 14, y: 18, width: 4, height: 40, cornerRadius: 2, fill: 0x6366f1 },
      { id: 'title', type: 'text', x: 30, y: 4, bind: 'data.title', fontSize: 14, fontWeight: 600, color: 0x0f172a },
      { id: 'note', type: 'text', x: 30, y: 29.5, bind: 'data.note', fontSize: 10.5, color: 0x64748b },
      { id: 'rule', type: 'line', x: 14, y: 70, x2: 246, y2: 70, color: 0xe2e8f0 },
      { id: 'dot', type: 'circle', x: 14, y: 84, radius: 5, fill: 0x1da54f },
      { id: 'state', type: 'text', x: 30, y: 73.5, text: 'healthy', fontSize: 10.5, color: 0x0f172a },
      { id: 'foot', type: 'text', x: 14, y: 98.5, bind: 'data.foot', fontSize: 9.5, color: 0x94a3b8 }
    ]
  },

  /**
   * Both halves of every pair, to show the precedence: the role wins whenever
   * the palette defines it, so these literals only ever act as a fallback.
   */
  pair: {
    name: 'pair',
    kind: 'freeform',
    width: 260,
    height: 140,
    cornerRadius: 12,
    bgRole: 'cardBg',
    bg: 0xffffff,
    strokeRole: 'stroke',
    stroke: 0xe2e8f0,
    strokeWidth: 1.2,
    elements: [
      { id: 'bar', type: 'rect', x: 14, y: 18, width: 4, height: 40, cornerRadius: 2, fillRole: 'accent', fill: 0x6366f1 },
      { id: 'title', type: 'text', x: 30, y: 4, bind: 'data.title', fontSize: 14, fontWeight: 600, colorRole: 'heading', color: 0x0f172a },
      { id: 'note', type: 'text', x: 30, y: 29.5, bind: 'data.note', fontSize: 10.5, colorRole: 'muted', color: 0x64748b },
      { id: 'rule', type: 'line', x: 14, y: 70, x2: 246, y2: 70, colorRole: 'divider', color: 0xe2e8f0 },
      { id: 'dot', type: 'circle', x: 14, y: 84, radius: 5, fill: 0x1da54f },
      { id: 'state', type: 'text', x: 30, y: 73.5, text: 'healthy', fontSize: 10.5, colorRole: 'foreground', color: 0x0f172a },
      { id: 'foot', type: 'text', x: 14, y: 98.5, bind: 'data.foot', fontSize: 9.5, colorRole: 'muted', color: 0x94a3b8 }
    ]
  }
};

const TYPES: NodeTypeRegistry = {
  themed: { structure: 'themed', styling: '', bindings: {} },
  pinned: { structure: 'pinned', styling: '', bindings: {} },
  pair: { structure: 'pair', styling: '', bindings: {} }
};

const DATA: GraphData = {
  nodes: [
    { id: 'themed', type: 'themed', position: { x: -300, y: 0 }, data: { title: 'themed by role', note: 'bgRole · strokeRole · colorRole', foot: 'follows the toolbar' } },
    { id: 'pinned', type: 'pinned', position: { x: 0, y: 0 }, data: { title: 'pinned literals', note: 'bg · stroke · color (numbers)', foot: 'stays light in dark mode' } },
    { id: 'pair', type: 'pair', position: { x: 300, y: 0 }, data: { title: 'both halves set', note: 'role + literal on every colour', foot: 'the role wins the pair' } }
  ],
  edges: []
};

// The layer template carries no colour: `GraphLayer.applyTheme` writes the
// themed defaults on every `theme:change`, so anything pinned here is
// overwritten on the first publish anyway.
const NODE: GraphLayerProps['node'] = { style: { labelText: '' } };

const CONFIG: CanvasConfig = { fitOnLoad: true };

export const Theming: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        {/* Colours left unset: the backdrop follows `surface`, the dots `divider`. */}
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
