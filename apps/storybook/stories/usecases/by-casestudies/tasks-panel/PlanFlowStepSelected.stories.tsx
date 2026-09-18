import {
  CanvasThemeSync,
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
  TextResolutionLODBehaviour,
  ElkLayout,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, NodeStructureRegistry, NodeTypeRegistry } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';


/**
 * **The Tasks Panel — a plan, with a task picked.** The design's *"D6 · setting
 * a task's parameters — the form is the catalogue contract"* (`PlanStepParams`;
 * `CatalogueDetail` shows the same selection from the other side — a catalogue
 * entry highlighting where it is used).
 *
 * Identical to the sibling `PlanFlow` story but for one card: `import_dataset`
 * takes the `accent`-role outline, because the parameter form beside it is
 * generated from *that* task's catalogue contract. The selection is the only
 * thing tying the form to the flow, so it is the only channel spent here.
 *
 * **Themed by role, not by palette.** The card is a `FreeformStructure`: every
 * chrome colour is a `*Role` (`cardBg` · `stroke` · `heading` · `muted` ·
 * `accent` · `divider`), which `GraphLayer` recompiles against the live palette
 * on every `theme:change` — so the story holds no light/dark values and the
 * layer never remounts. Only the status colours (dot, bound swatch, approval
 * outline) stay literal; see the note above them for why.
 *
 * **Known gaps.** `CompositePart`'s `label` declares no `fontFamily`, so the
 * design's monospaced task names render sans-serif; and template text is placed
 * a font-size low by `compileFreeform` (see {@link textY}).
 *
 * **Everything above the component is data.** `STRUCTURES` · `TYPES` · `DATA` ·
 * `NODE` · `EDGE` · `CONFIG` are literal JSON — no helpers, no factories, no
 * computed values — so the whole definition survives `JSON.stringify` into a row
 * and comes back identical. The only things in this file that are *not*
 * serialisable are the `<GraphCanvas>` tree and its behaviours.
 *
 * **Placed by ELK, not by the artboard.** No node carries a `position`: a
 * `layered` solve running left to right (`CONFIG.layouts.elk`) decides the
 * columns and lanes, sizing each box from its own card structure. So the picture
 * keeps the design's grammar — the cards, the bounds, the dashed branch — while
 * the geometry is whatever the topology implies, which is what a flow drawn from
 * live data has to do.
 *
 * **Everything above the component is data.** `STRUCTURES` · `TYPES` · `DATA` ·
 * `NODE` · `EDGE` · `CONFIG` are literal JSON — no helpers, no factories, no
 * computed values — so the whole definition survives `JSON.stringify` into a row
 * and comes back identical. The only things in this file that are *not*
 * serialisable are the `<GraphCanvas>` tree and its behaviours.
 */
const meta: Meta = { title: 'usecases/by-casestudies/tasks-panel/PlanFlowStepSelected' };
export default meta;
type Story = StoryObj;

// ── The definition — literal JSON, top to bottom ─────────────────────────────
/**
 * The card templates. Every chrome colour is a `*Role` (`cardBg` · `stroke` ·
 * `heading` · `muted` · `accent` · `divider`) that `GraphLayer` re-resolves
 * against the live palette on `theme:change`; the four status colours are the
 * numeric half of the template's colour pair, because the role vocabulary has no
 * `success` / `warning` / `danger` / `info` and these carry meaning rather than
 * chrome (a task ran · a bound is `network` · an approval is held · a drop is
 * refused). Their values are the design's light tokens:
 * `0x1da54f` success · `0xce8509` warning · `0x0b73da` info · `0xe05252` danger.
 *
 * A structure is static apart from its bound text, so the *variant* (dot · chip ·
 * outline · quiet) is what a node's `type` selects — hence one entry per task.
 *
 * ⚠️ **Text `y` looks a line high on purpose.** `CardElementCommon.y` is the
 * element's top-left, and the designer renders it that way, but
 * `compileFreeform` emits the label part at `el.y + fontSize`
 * (`packages/graph/src/template/compile.ts`). So a 12px name whose rendered top
 * must land at 8 is authored as `-4`. When that is fixed these become 8 / 28 / 46.
 */
const STRUCTURES: NodeStructureRegistry = {
  check_bundle: {
    name: 'check_bundle',
    kind: 'freeform',
    width: 146,
    height: 68,
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1,
    elements: [
      { id: 'name', type: 'text', x: 10, y: -4, bind: 'data.name', fontSize: 12, colorRole: 'heading' },
      { id: 'swatch', type: 'rect', x: 10, y: 31, width: 6, height: 6, fill: 0x0b73da },
      { id: 'bound', type: 'text', x: 22, y: 18, bind: 'data.bound', fontSize: 10, colorRole: 'muted' },
      { id: 'detail', type: 'text', x: 10, y: 35.5, bind: 'data.detail', fontSize: 10.5, colorRole: 'muted' }
    ]
  },
  fetch_source: {
    name: 'fetch_source',
    kind: 'freeform',
    width: 146,
    height: 68,
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1,
    elements: [
      { id: 'name', type: 'text', x: 10, y: -4, bind: 'data.name', fontSize: 12, colorRole: 'heading' },
      { id: 'swatch', type: 'rect', x: 10, y: 31, width: 6, height: 6, fill: 0xce8509 },
      { id: 'bound', type: 'text', x: 22, y: 18, bind: 'data.bound', fontSize: 10, colorRole: 'muted' },
      { id: 'detail', type: 'text', x: 10, y: 35.5, bind: 'data.detail', fontSize: 10.5, colorRole: 'muted' }
    ]
  },
  validate_records: {
    name: 'validate_records',
    kind: 'freeform',
    width: 146,
    height: 68,
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1,
    elements: [
      { id: 'name', type: 'text', x: 10, y: -4, bind: 'data.name', fontSize: 12, colorRole: 'heading' },
      { id: 'swatch', type: 'rect', x: 10, y: 31, width: 6, height: 6, fill: 0x0b73da },
      { id: 'bound', type: 'text', x: 22, y: 18, bind: 'data.bound', fontSize: 10, colorRole: 'muted' },
      { id: 'detail', type: 'text', x: 10, y: 35.5, bind: 'data.detail', fontSize: 10.5, colorRole: 'muted' }
    ]
  },
  import_dataset: {
    name: 'import_dataset',
    kind: 'freeform',
    width: 146,
    height: 68,
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'accent',
    strokeWidth: 1,
    elements: [
      { id: 'name', type: 'text', x: 10, y: -4, bind: 'data.name', fontSize: 12, colorRole: 'heading' },
      { id: 'swatch', type: 'rect', x: 10, y: 31, width: 6, height: 6, fill: 0x0b73da },
      { id: 'bound', type: 'text', x: 22, y: 18, bind: 'data.bound', fontSize: 10, colorRole: 'muted' },
      { id: 'detail', type: 'text', x: 10, y: 35.5, bind: 'data.detail', fontSize: 10.5, colorRole: 'muted' }
    ]
  },
  verify_counts: {
    name: 'verify_counts',
    kind: 'freeform',
    width: 146,
    height: 68,
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1,
    elements: [
      { id: 'name', type: 'text', x: 10, y: -4, bind: 'data.name', fontSize: 12, colorRole: 'heading' },
      { id: 'swatch', type: 'rect', x: 10, y: 31, width: 6, height: 6, fillRole: 'muted' },
      { id: 'bound', type: 'text', x: 22, y: 18, bind: 'data.bound', fontSize: 10, colorRole: 'muted' },
      { id: 'detail', type: 'text', x: 10, y: 35.5, bind: 'data.detail', fontSize: 10.5, colorRole: 'muted' }
    ]
  },
  triage: {
    name: 'triage',
    kind: 'freeform',
    width: 146,
    height: 68,
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1,
    elements: [
      { id: 'name', type: 'text', x: 10, y: -4, bind: 'data.name', fontSize: 12, colorRole: 'heading' },
      { id: 'swatch', type: 'rect', x: 10, y: 31, width: 6, height: 6, fill: 0xe05252 },
      { id: 'bound', type: 'text', x: 22, y: 18, bind: 'data.bound', fontSize: 10, colorRole: 'muted' },
      { id: 'detail', type: 'text', x: 10, y: 35.5, bind: 'data.detail', fontSize: 10.5, colorRole: 'muted' }
    ]
  },
  import_report: {
    name: 'import_report',
    kind: 'freeform',
    width: 146,
    height: 68,
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1,
    elements: [
      { id: 'name', type: 'text', x: 10, y: -4, bind: 'data.name', fontSize: 12, colorRole: 'heading' },
      { id: 'swatch', type: 'rect', x: 10, y: 31, width: 6, height: 6, fill: 0x0b73da },
      { id: 'bound', type: 'text', x: 22, y: 18, bind: 'data.bound', fontSize: 10, colorRole: 'muted' },
      { id: 'detail', type: 'text', x: 10, y: 35.5, bind: 'data.detail', fontSize: 10.5, colorRole: 'muted' }
    ]
  },
  announce: {
    name: 'announce',
    kind: 'freeform',
    width: 146,
    height: 68,
    cornerRadius: 0,
    bgRole: 'cardBg',
    stroke: 0xce8509,
    strokeWidth: 1,
    elements: [
      { id: 'name', type: 'text', x: 10, y: -4, bind: 'data.name', fontSize: 12, colorRole: 'heading' },
      { id: 'swatch', type: 'rect', x: 10, y: 31, width: 6, height: 6, fill: 0xe05252 },
      { id: 'bound', type: 'text', x: 22, y: 18, bind: 'data.bound', fontSize: 10, colorRole: 'muted' },
      { id: 'detail', type: 'text', x: 10, y: 35.5, bind: 'data.detail', fontSize: 10.5, color: 0xce8509 }
    ]
  }
};

/** Freeform structures are self-contained, so `styling` / `bindings` go unread. */
const TYPES: NodeTypeRegistry = {
  check_bundle: { structure: 'check_bundle', styling: '', bindings: {} },
  fetch_source: { structure: 'fetch_source', styling: '', bindings: {} },
  validate_records: { structure: 'validate_records', styling: '', bindings: {} },
  import_dataset: { structure: 'import_dataset', styling: '', bindings: {} },
  verify_counts: { structure: 'verify_counts', styling: '', bindings: {} },
  triage: { structure: 'triage', styling: '', bindings: {} },
  import_report: { structure: 'import_report', styling: '', bindings: {} },
  announce: { structure: 'announce', styling: '', bindings: {} }
};

/**
 * The eight tasks and the seven links — topology only. No node carries a
 * `position`: the ELK layer-and-lane solve named in `CONFIG.layouts.elk` places
 * them, left to right, and re-runs whenever the topology changes. Node sizes come
 * from each card's own structure, so ELK spaces 146×68 boxes rather than guesses.
 */
const DATA: GraphData = {
  nodes: [
    {
      id: 'check_bundle',
      type: 'check_bundle',
      data: {
        name: 'check_bundle',
        bound: 'ingest'
      }
    },
    {
      id: 'fetch_source',
      type: 'fetch_source',
      data: {
        name: 'fetch_source',
        bound: 'network'
      }
    },
    {
      id: 'validate_records',
      type: 'validate_records',
      data: {
        name: 'validate_records',
        bound: 'ingest'
      }
    },
    {
      id: 'import_dataset',
      type: 'import_dataset',
      data: {
        name: 'import_dataset',
        bound: 'ingest',
        detail: 'map_over: datasets'
      }
    },
    {
      id: 'verify_counts',
      type: 'verify_counts',
      data: {
        name: 'verify_counts',
        bound: 'none'
      }
    },
    {
      id: 'triage',
      type: 'triage',
      data: {
        name: 'triage',
        bound: 'work_write',
        detail: 'when: counts differ'
      }
    },
    {
      id: 'import_report',
      type: 'import_report',
      data: {
        name: 'import_report',
        bound: 'ingest'
      }
    },
    {
      id: 'announce',
      type: 'announce',
      data: {
        name: 'announce',
        bound: 'work_write',
        detail: 'approval before it writes'
      }
    }
  ],
  edges: [
    { id: 'e1', source: 'check_bundle', target: 'fetch_source', type: 'THEN' },
    { id: 'e2', source: 'fetch_source', target: 'validate_records', type: 'THEN' },
    { id: 'e3', source: 'validate_records', target: 'import_dataset', type: 'THEN' },
    { id: 'e4', source: 'import_dataset', target: 'verify_counts', type: 'THEN' },
    // The conditional branch — dashed and 60%, pointing at `verify_counts`
    // exactly as the artboard draws it. Only the dash and the alpha are
    // declared: the colour is left to the layer's themed edge default (`muted`).
    {
      id: 'e5',
      source: 'triage',
      target: 'verify_counts',
      type: 'BRANCH',
      style: { strokeAlpha: 0.6, strokeDashArray: [5, 4], arrowTargetAlpha: 0.6 }
    },
    { id: 'e6', source: 'verify_counts', target: 'import_report', type: 'THEN' },
    { id: 'e7', source: 'announce', target: 'import_report', type: 'THEN' }
  ]
};

// The layer template carries no colour at all. `GraphLayer.applyTheme` writes the
// themed defaults (node border ← `stroke`, edge stroke + arrows ← `muted`) on
// every `theme:change`, and the structures above resolve their own roles — so
// nothing here has to know which palette is live.
const NODE: GraphLayerProps['node'] = {
  // Each card draws its own words; the node-level label would double them up.
  style: { labelText: '' }
};

const EDGE: GraphLayerProps['edge'] = {
  style: {
    // Both ends ride the card silhouette — `boundary` is the layer's default,
    // named here because it is what puts the arrows in the 10px gutters the
    // design draws them in rather than under the cards.
    shape: { sourceAnchor: 'boundary', targetAnchor: 'boundary' },
    strokeWidth: 1.5,
    arrowTargetShape: 'triangle',
    arrowTargetSize: 7
  }
};

/**
 * `activeLayout` names the layout by id, so `GraphCanvas` runs it as soon as data
 * is present and again on every topology change — the params live here as data,
 * not as component props, which keeps them part of the serialisable definition.
 */
const CONFIG: CanvasConfig = {
  fitOnLoad: true,
  activeLayout: 'elk',
  layouts: {
    elk: {
      algorithm: 'layered',
      direction: 'RIGHT',
      // Orthogonal routes read as a flow diagram, and ELK's own routing assumes
      // centre-origin nodes — which is what `GraphLayer` gives a composite.
      edgeRouting: 'ORTHOGONAL',
      // Across a lane, and between layers. The artboard's 10px gutters are too
      // tight for a solver that has to fit arrowheads between the cards.
      nodeSpacing: 28,
      layerSpacing: 72
    }
  }
};

export const PlanFlowStepSelected: Story = {
  render: () => (
    // The host <div> sizes the engine's render surface — structural, and exempt
    // from the no-inline-CSS rule (root rule 13), as in the `designs/*` stories.
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        {/* `color` / `backgroundColor` left at `'inherit'`: the backdrop follows
            the `surface` role and the 28px grid the `divider` role. */}
        <BackgroundLayer id="bg" type="pattern" patternType="grid" spacing={28} alpha={0.3} />
        <ThemeBehaviour id="theme" />
        {/* Drives the behaviour's mode + family from the host `@invana/themes`
            theme, which is what makes every role above follow the toolbar. */}
        <CanvasThemeSync />
        <GraphLayer
          id="graph"
          data={DATA}
          node={NODE}
          edge={EDGE}
          nodeStructureTemplates={STRUCTURES}
          nodeTypes={TYPES}
        />
        {/* Mounted after the layer it drives: the wrapper looks `targetLayerId`
            up at mount. Config-first — the params are in `CONFIG.layouts.elk`. */}
        <ElkLayout id="elk" targetLayerId="graph" fitPadding={72} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag" />
        {/* The card's words are 10–12px composite labels, rasterised once at
            renderer DPR — zooming in to read a detail row upsamples that texture
            and goes soft. This re-rasterises in discrete tiers as the camera
            comes in, so the type stays crisp. Registered *and* enabled
            explicitly: no behaviour auto-activates. */}
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" enabled />
      </GraphCanvas>
    </div>
  )
};
