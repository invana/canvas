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
 * **Cartoons, part 1 — a character sheet.** Five drawings, no edges. The point
 * is that `FreeformStructure` is not a *card* format: it is absolute-positioned
 * geometry with a silhouette, and a node can be a picture.
 *
 * The whole cast comes out of the five element kinds plus the `frame`:
 *
 * | Character | Built from |
 * |---|---|
 * | **Robot** | rounded `rect`s (head, visor, grille, ears, body) + a `line` antenna + `circle` eyes |
 * | **Cat** | a big `circle` head over four `line` ear strokes, with `line` whiskers and a `circle` nose |
 * | **Cloud** | three overlapping `circle` puffs + a pill `rect` base, `fillAlpha` blush, a hollow-stroke "O" mouth |
 * | **Rocket** | `frame: polygon` silhouette (nose + fins), details as elements, exhaust `line`s **outside** the silhouette |
 * | **Ghost** | `frame: polygon` with a nine-point wavy hem |
 *
 * Three techniques worth lifting:
 *
 * - **The silhouette is the drawing.** A rocket and a ghost aren't rectangles,
 *   so they take a `polygon` frame — `points` are normalised `[0, 1]` box
 *   coordinates, which is what lets the same list rescale with `width`/`height`.
 * - **Order is z-order, and that's the whole trick for overlaps.** The cat's
 *   ears are drawn *before* its head so the circle covers their roots; the
 *   cloud's base `rect` lands after the puffs so it fuses them into one blob.
 * - **Elements are not clipped to the frame.** Usually a hazard (see `Frames`);
 *   here it's the feature — the rocket's exhaust is drawn below the silhouette's
 *   tip and reads as flame.
 * - **A hollow shape is just a colour pair with no fill half.** The cloud's
 *   mouth is a `circle` with `strokeRole`-less `stroke` + `strokeWidth` and no
 *   `fill` at all.
 *
 * **Captions are node labels, not elements.** A cartoon silhouette has no
 * spare room for a text row, so the names come from the layer's `labelText`
 * resolver with `labelPlacement: 'bottom'` — the compiled structure sets
 * `shape` / `bgFill` / `bgStrokeWidth` and never touches the label fields, so a
 * layer-level label survives underneath a structure.
 *
 * **Colours are literal on purpose.** A ginger cat is ginger in dark mode too:
 * the palette roles are chrome vocabulary (`cardBg`, `heading`, `muted`…) and a
 * drawing is content. Only the backdrop and the captions follow the theme.
 */
const meta: Meta = { title: 'graph/Nodes/Types/FreeformStructure/Cartoons/Characters' };
export default meta;
type Story = StoryObj;

// ── The cast — literal JSON, one structure per character ────────────────────
const STRUCTURES: NodeStructureRegistry = {
  /** Boxes and one antenna. Nothing here needs a custom silhouette. */
  robot: {
    name: 'robot',
    kind: 'freeform',
    width: 200,
    height: 200,
    cornerRadius: 0,
    // A transparent-looking card: the drawing is the elements, not the box.
    bg: 0x0f172a,
    elements: [
      { id: 'ear-l', type: 'rect', x: 28, y: 74, width: 14, height: 30, cornerRadius: 4, fill: 0x475569 },
      { id: 'ear-r', type: 'rect', x: 158, y: 74, width: 14, height: 30, cornerRadius: 4, fill: 0x475569 },
      { id: 'antenna', type: 'line', x: 100, y: 16, x2: 100, y2: 46, color: 0x475569, strokeWidth: 3 },
      { id: 'bulb', type: 'circle', x: 92, y: 4, radius: 9, fill: 0xef4444 },
      { id: 'head', type: 'rect', x: 42, y: 44, width: 116, height: 100, cornerRadius: 18, fill: 0x94a3b8, stroke: 0x334155, strokeWidth: 3 },
      { id: 'visor', type: 'rect', x: 56, y: 60, width: 88, height: 40, cornerRadius: 10, fill: 0x0f172a },
      { id: 'eye-l', type: 'circle', x: 68, y: 70, radius: 10, fill: 0x38bdf8 },
      { id: 'eye-r', type: 'circle', x: 112, y: 70, radius: 10, fill: 0x38bdf8 },
      { id: 'glint-l', type: 'circle', x: 72, y: 74, radius: 3, fill: 0xffffff },
      { id: 'glint-r', type: 'circle', x: 116, y: 74, radius: 3, fill: 0xffffff },
      { id: 'grille', type: 'rect', x: 72, y: 112, width: 56, height: 18, cornerRadius: 4, fill: 0x0f172a },
      { id: 'bar-1', type: 'line', x: 86, y: 112, x2: 86, y2: 130, color: 0x94a3b8, strokeWidth: 2 },
      { id: 'bar-2', type: 'line', x: 100, y: 112, x2: 100, y2: 130, color: 0x94a3b8, strokeWidth: 2 },
      { id: 'bar-3', type: 'line', x: 114, y: 112, x2: 114, y2: 130, color: 0x94a3b8, strokeWidth: 2 },
      { id: 'neck', type: 'rect', x: 86, y: 144, width: 28, height: 12, fill: 0x475569 },
      { id: 'body', type: 'rect', x: 62, y: 156, width: 76, height: 34, cornerRadius: 8, fill: 0x64748b, stroke: 0x334155, strokeWidth: 2.5 }
    ]
  },

  /**
   * Ears first, head second — the circle paints over the ear roots, which is
   * how you get a filled triangle out of a vocabulary that has no triangle.
   */
  cat: {
    name: 'cat',
    kind: 'freeform',
    width: 200,
    height: 200,
    cornerRadius: 0,
    bg: 0x0f172a,
    elements: [
      { id: 'ear-l1', type: 'line', x: 56, y: 74, x2: 70, y2: 30, color: 0xf59e0b, strokeWidth: 8 },
      { id: 'ear-l2', type: 'line', x: 70, y: 30, x2: 94, y2: 56, color: 0xf59e0b, strokeWidth: 8 },
      { id: 'ear-r1', type: 'line', x: 144, y: 74, x2: 130, y2: 30, color: 0xf59e0b, strokeWidth: 8 },
      { id: 'ear-r2', type: 'line', x: 130, y: 30, x2: 106, y2: 56, color: 0xf59e0b, strokeWidth: 8 },
      { id: 'head', type: 'circle', x: 46, y: 44, radius: 54, fill: 0xf59e0b, stroke: 0x7c2d12, strokeWidth: 3 },
      { id: 'whisk-l1', type: 'line', x: 40, y: 104, x2: 74, y2: 100, color: 0x7c2d12, strokeWidth: 2 },
      { id: 'whisk-l2', type: 'line', x: 40, y: 118, x2: 74, y2: 112, color: 0x7c2d12, strokeWidth: 2 },
      { id: 'whisk-r1', type: 'line', x: 126, y: 100, x2: 160, y2: 104, color: 0x7c2d12, strokeWidth: 2 },
      { id: 'whisk-r2', type: 'line', x: 126, y: 112, x2: 160, y2: 118, color: 0x7c2d12, strokeWidth: 2 },
      { id: 'eye-l', type: 'circle', x: 68, y: 82, radius: 10, fill: 0x0f172a },
      { id: 'eye-r', type: 'circle', x: 112, y: 82, radius: 10, fill: 0x0f172a },
      { id: 'glint-l', type: 'circle', x: 72, y: 84, radius: 3, fill: 0xffffff },
      { id: 'glint-r', type: 'circle', x: 116, y: 84, radius: 3, fill: 0xffffff },
      { id: 'nose', type: 'circle', x: 94, y: 104, radius: 6, fill: 0xef4444 },
      { id: 'mouth-l', type: 'line', x: 100, y: 114, x2: 88, y2: 124, color: 0x7c2d12, strokeWidth: 2.5 },
      { id: 'mouth-r', type: 'line', x: 100, y: 114, x2: 112, y2: 124, color: 0x7c2d12, strokeWidth: 2.5 }
    ]
  },

  /** Three puffs fused by a pill. The mouth is a stroke with no fill. */
  cloud: {
    name: 'cloud',
    kind: 'freeform',
    width: 200,
    height: 200,
    cornerRadius: 0,
    bg: 0x0f172a,
    elements: [
      { id: 'puff-l', type: 'circle', x: 18, y: 62, radius: 34, fill: 0xffffff },
      { id: 'puff-c', type: 'circle', x: 58, y: 34, radius: 44, fill: 0xffffff },
      { id: 'puff-r', type: 'circle', x: 114, y: 60, radius: 34, fill: 0xffffff },
      { id: 'base', type: 'rect', x: 18, y: 92, width: 164, height: 34, cornerRadius: 17, fill: 0xffffff },
      { id: 'hem', type: 'line', x: 22, y: 126, x2: 178, y2: 126, color: 0xcbd5e1, strokeWidth: 3 },
      { id: 'blush-l', type: 'circle', x: 56, y: 90, radius: 9, fill: 0xfda4af, fillAlpha: 0.7 },
      { id: 'blush-r', type: 'circle', x: 132, y: 90, radius: 9, fill: 0xfda4af, fillAlpha: 0.7 },
      { id: 'eye-l', type: 'circle', x: 74, y: 70, radius: 9, fill: 0x0f172a },
      { id: 'eye-r', type: 'circle', x: 110, y: 70, radius: 9, fill: 0x0f172a },
      // No `fill` at all → a hollow ring. A surprised little cloud.
      { id: 'mouth', type: 'circle', x: 90, y: 92, radius: 11, stroke: 0x0f172a, strokeWidth: 3 },
      { id: 'rain-1', type: 'line', x: 62, y: 140, x2: 54, y2: 166, color: 0x38bdf8, strokeWidth: 4 },
      { id: 'rain-2', type: 'line', x: 100, y: 140, x2: 92, y2: 166, color: 0x38bdf8, strokeWidth: 4 },
      { id: 'rain-3', type: 'line', x: 138, y: 140, x2: 130, y2: 166, color: 0x38bdf8, strokeWidth: 4 }
    ]
  },

  /**
   * The silhouette carries the character: nose cone, body, two fins. The
   * exhaust sits *below* the polygon's tip — elements aren't clipped to the
   * frame, so it reads as flame instead of as a bug.
   */
  rocket: {
    name: 'rocket',
    kind: 'freeform',
    width: 200,
    height: 200,
    frame: {
      kind: 'polygon',
      points: [
        { x: 0.5, y: 0.02 },
        { x: 0.68, y: 0.22 },
        { x: 0.68, y: 0.6 },
        { x: 0.88, y: 0.78 },
        { x: 0.62, y: 0.74 },
        { x: 0.5, y: 0.9 },
        { x: 0.38, y: 0.74 },
        { x: 0.12, y: 0.78 },
        { x: 0.32, y: 0.6 },
        { x: 0.32, y: 0.22 }
      ]
    },
    bg: 0xe2e8f0,
    stroke: 0x334155,
    strokeWidth: 3,
    elements: [
      { id: 'window', type: 'circle', x: 82, y: 60, radius: 18, fill: 0x38bdf8, stroke: 0x0f172a, strokeWidth: 3 },
      { id: 'glint', type: 'circle', x: 88, y: 66, radius: 5, fill: 0xffffff },
      { id: 'band', type: 'rect', x: 68, y: 104, width: 64, height: 12, fill: 0xef4444 },
      { id: 'rivet-1', type: 'circle', x: 76, y: 124, radius: 3, fill: 0x94a3b8 },
      { id: 'rivet-2', type: 'circle', x: 96, y: 124, radius: 3, fill: 0x94a3b8 },
      { id: 'rivet-3', type: 'circle', x: 116, y: 124, radius: 3, fill: 0x94a3b8 },
      { id: 'flame-l', type: 'line', x: 92, y: 182, x2: 100, y2: 200, color: 0xf59e0b, strokeWidth: 5 },
      { id: 'flame-r', type: 'line', x: 108, y: 182, x2: 100, y2: 200, color: 0xf59e0b, strokeWidth: 5 },
      { id: 'flame-c', type: 'line', x: 100, y: 180, x2: 100, y2: 198, color: 0xef4444, strokeWidth: 4 }
    ]
  },

  /** A nine-point hem is the entire ghost. Everything else is two eyes. */
  ghost: {
    name: 'ghost',
    kind: 'freeform',
    width: 200,
    height: 200,
    frame: {
      kind: 'polygon',
      points: [
        { x: 0.1, y: 0.46 },
        { x: 0.13, y: 0.3 },
        { x: 0.24, y: 0.15 },
        { x: 0.4, y: 0.07 },
        { x: 0.6, y: 0.07 },
        { x: 0.76, y: 0.15 },
        { x: 0.87, y: 0.3 },
        { x: 0.9, y: 0.46 },
        { x: 0.9, y: 0.78 },
        { x: 0.82, y: 0.92 },
        { x: 0.74, y: 0.8 },
        { x: 0.66, y: 0.92 },
        { x: 0.58, y: 0.8 },
        { x: 0.5, y: 0.92 },
        { x: 0.42, y: 0.8 },
        { x: 0.34, y: 0.92 },
        { x: 0.26, y: 0.8 },
        { x: 0.18, y: 0.92 },
        { x: 0.1, y: 0.78 }
      ]
    },
    bg: 0xf8fafc,
    stroke: 0x94a3b8,
    strokeWidth: 3,
    elements: [
      { id: 'blush-l', type: 'circle', x: 48, y: 88, radius: 9, fill: 0xfda4af, fillAlpha: 0.6 },
      { id: 'blush-r', type: 'circle', x: 134, y: 88, radius: 9, fill: 0xfda4af, fillAlpha: 0.6 },
      { id: 'eye-l', type: 'circle', x: 64, y: 60, radius: 11, fill: 0x0f172a },
      { id: 'eye-r', type: 'circle', x: 106, y: 60, radius: 11, fill: 0x0f172a },
      { id: 'glint-l', type: 'circle', x: 68, y: 62, radius: 3.5, fill: 0xffffff },
      { id: 'glint-r', type: 'circle', x: 110, y: 62, radius: 3.5, fill: 0xffffff },
      { id: 'mouth', type: 'circle', x: 88, y: 96, radius: 12, fill: 0x0f172a }
    ]
  }
};

const TYPES: NodeTypeRegistry = {
  robot: { structure: 'robot', styling: '', bindings: {} },
  cat: { structure: 'cat', styling: '', bindings: {} },
  cloud: { structure: 'cloud', styling: '', bindings: {} },
  rocket: { structure: 'rocket', styling: '', bindings: {} },
  ghost: { structure: 'ghost', styling: '', bindings: {} }
};

const DATA: GraphData = {
  nodes: [
    { id: 'robot', type: 'robot', position: { x: -520, y: 0 }, data: { name: 'Bolt' } },
    { id: 'cat', type: 'cat', position: { x: -260, y: 0 }, data: { name: 'Marmalade' } },
    { id: 'cloud', type: 'cloud', position: { x: 0, y: 0 }, data: { name: 'Drizzle' } },
    { id: 'rocket', type: 'rocket', position: { x: 260, y: 0 }, data: { name: 'Sputnik Jr.' } },
    { id: 'ghost', type: 'ghost', position: { x: 520, y: 0 }, data: { name: 'Boo' } }
  ],
  edges: []
};

// The caption is a node label: a silhouette has no room for a text row, and the
// compiled structure never writes the label fields, so this survives under it.
const NODE: GraphLayerProps['node'] = {
  style: {
    labelText: (n) => String((n.data as { name?: string } | undefined)?.name ?? ''),
    labelFontSize: 13,
    labelPlacement: 'bottom',
    labelOffsetY: 14
  }
};

const CONFIG: CanvasConfig = { fitOnLoad: true };

export const Characters: Story = {
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
