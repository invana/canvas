import {
  BackgroundLayer,
  CanvasThemeSync,
  DragPanBehaviour,
  GraphCanvas,
  GraphLayer,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  WheelZoomBehaviour,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, NodeStructureRegistry, NodeStyle, NodeTypeRegistry } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **A server rack with blinking dials** — and the seam it runs into.
 *
 * The **chassis** and the four **blades** are `FreeformStructure`s: rails,
 * screws, handles, drive bays, vents, a brand plate and two empty dial sockets,
 * all drawn from `rect` · `circle` · `line` · `text`. That part is just the
 * format doing what the `Elements` story shows.
 *
 * **The blinking is not.** A `FreeformStructure` is static JSON — it compiles
 * once per data/theme change and has no notion of a frame, so nothing inside an
 * element list can pulse, breathe or tick. The lights come from the **engine**
 * instead, and that forces one structural decision worth stating plainly:
 *
 * > **A decoration attaches to a *node*, not to an element inside a composite.**
 * > `NodeStyle.decorations` traces the host's silhouette
 * > (`file:packages/graph/src/layer/types.ts#L772`), and the host is the whole
 * > card. So a dial that must blink on its own is **its own node**, parked over
 * > a socket the structure drew for it.
 *
 * Hence the cast: 1 chassis + 4 blades (structures) + 8 LEDs + 2 gauges (plain
 * circle nodes carrying decorations). Paint order is insertion order — the
 * renderer sorts by `spec.zIndex` with a stable sort and `NodeStyle` has no
 * `zIndex` field — so `nodes[]` is ordered chassis → blades → dials, and that
 * is load-bearing, not cosmetic.
 *
 * What each dial is made of, all of it per-frame work the renderer already does:
 *
 * | Part | Decoration / effect | Why |
 * |---|---|---|
 * | LED blink | `glow` with `pulse: { periodMs, amplitude }` | alpha-multiplies the halo on a sine — the actual blink |
 * | LED ping | `pulse-ring` | concentric rings expanding off the silhouette |
 * | LED throb | `effects: { breathing }` | sinusoidal **scale**; `phaseOffsetMs` desynchronises them |
 * | Gauge fluid | `liquid-fill` with `wave` | an animated meniscus — a tank reading that never settles |
 * | Gauge bezel | `ring` | a detached ring at `gap`, the chrome around the glass |
 *
 * The four LED styles carry **different `periodMs`** (700 · 900 · 1250 · 1600),
 * so they drift out of phase against each other on their own — `glow.pulse` has
 * no phase offset of its own, only `breathing` does.
 *
 * **Deliberately literal colours.** A rack is an illustration, not chrome: the
 * greens, ambers and slates are numbers, not `*Role`s, and the card stays dark
 * in both themes. Only the backdrop follows the palette. That is the same call
 * the `Theming` sibling describes — meaning stays literal.
 */
const meta: Meta = { title: 'graph/Nodes/Types/FreeformStructure/ServerRack' };
export default meta;
type Story = StoryObj;

// ── The chassis + blade structures — literal JSON ───────────────────────────
const STRUCTURES: NodeStructureRegistry = {
  /**
   * The 380 × 380 cabinet. `cornerRadius: 0`, which is what lets the top plate
   * and the vent strip run edge to edge — the compiler sets no clip, so a
   * full-bleed rect on a rounded card would escape the corner.
   */
  rackChassis: {
    name: 'rackChassis',
    kind: 'freeform',
    width: 380,
    height: 380,
    cornerRadius: 0,
    bg: 0x111827,
    stroke: 0x334155,
    strokeWidth: 2,
    elements: [
      // Top plate + brand.
      { id: 'plate', type: 'rect', x: 0, y: 0, width: 380, height: 30, fill: 0x0b1220 },
      { id: 'brand', type: 'text', x: 20, y: 6, bind: 'data.brand', fontSize: 12, fontWeight: 700, uppercase: true, color: 0x94a3b8 },
      { id: 'units', type: 'text', x: 360, y: 10.5, bind: 'data.units', anchor: 'right', fontSize: 9.5, color: 0x475569 },
      { id: 'platerule', type: 'line', x: 0, y: 30, x2: 380, y2: 30, color: 0x334155, strokeWidth: 2 },

      // Mounting rails + their screws.
      { id: 'rail-l', type: 'rect', x: 8, y: 38, width: 14, height: 300, cornerRadius: 3, fill: 0x334155 },
      { id: 'rail-r', type: 'rect', x: 358, y: 38, width: 14, height: 300, cornerRadius: 3, fill: 0x334155 },
      { id: 'screw-l1', type: 'circle', x: 12, y: 50, radius: 3, fill: 0x64748b },
      { id: 'screw-l2', type: 'circle', x: 12, y: 130, radius: 3, fill: 0x64748b },
      { id: 'screw-l3', type: 'circle', x: 12, y: 210, radius: 3, fill: 0x64748b },
      { id: 'screw-l4', type: 'circle', x: 12, y: 290, radius: 3, fill: 0x64748b },
      { id: 'screw-r1', type: 'circle', x: 362, y: 50, radius: 3, fill: 0x64748b },
      { id: 'screw-r2', type: 'circle', x: 362, y: 130, radius: 3, fill: 0x64748b },
      { id: 'screw-r3', type: 'circle', x: 362, y: 210, radius: 3, fill: 0x64748b },
      { id: 'screw-r4', type: 'circle', x: 362, y: 290, radius: 3, fill: 0x64748b },

      // The instrument shelf the two gauges sit on.
      { id: 'shelf', type: 'rect', x: 40, y: 288, width: 300, height: 60, cornerRadius: 6, fill: 0x0b1220 },
      { id: 'shelf-rule', type: 'line', x: 40, y: 288, x2: 340, y2: 288, color: 0x1f2937, strokeWidth: 1.5 },

      // Vent strip along the floor.
      { id: 'vent1', type: 'rect', x: 44, y: 364, width: 24, height: 8, cornerRadius: 4, fill: 0x0b1220 },
      { id: 'vent2', type: 'rect', x: 82, y: 364, width: 24, height: 8, cornerRadius: 4, fill: 0x0b1220 },
      { id: 'vent3', type: 'rect', x: 120, y: 364, width: 24, height: 8, cornerRadius: 4, fill: 0x0b1220 },
      { id: 'vent4', type: 'rect', x: 158, y: 364, width: 24, height: 8, cornerRadius: 4, fill: 0x0b1220 },
      { id: 'vent5', type: 'rect', x: 196, y: 364, width: 24, height: 8, cornerRadius: 4, fill: 0x0b1220 },
      { id: 'vent6', type: 'rect', x: 234, y: 364, width: 24, height: 8, cornerRadius: 4, fill: 0x0b1220 },
      { id: 'vent7', type: 'rect', x: 272, y: 364, width: 24, height: 8, cornerRadius: 4, fill: 0x0b1220 },
      { id: 'vent8', type: 'rect', x: 310, y: 364, width: 24, height: 8, cornerRadius: 4, fill: 0x0b1220 }
    ]
  },

  /**
   * One 1U blade, 320 × 56. The two stroke-only circles at the right are the
   * **dial sockets** — empty rings the LED nodes park in. The structure draws
   * the bezel; the engine draws the light.
   */
  blade: {
    name: 'blade',
    kind: 'freeform',
    width: 320,
    height: 56,
    cornerRadius: 6,
    bg: 0x0f172a,
    stroke: 0x1f2937,
    strokeWidth: 1.5,
    elements: [
      { id: 'handle', type: 'rect', x: 8, y: 14, width: 10, height: 28, cornerRadius: 3, fill: 0x475569 },
      { id: 'grip1', type: 'line', x: 10, y: 22, x2: 16, y2: 22, color: 0x0f172a, strokeWidth: 1.5 },
      { id: 'grip2', type: 'line', x: 10, y: 28, x2: 16, y2: 28, color: 0x0f172a, strokeWidth: 1.5 },
      { id: 'grip3', type: 'line', x: 10, y: 34, x2: 16, y2: 34, color: 0x0f172a, strokeWidth: 1.5 },

      { id: 'bay1', type: 'rect', x: 30, y: 12, width: 20, height: 32, cornerRadius: 2, fill: 0x1e293b, stroke: 0x334155 },
      { id: 'bay2', type: 'rect', x: 56, y: 12, width: 20, height: 32, cornerRadius: 2, fill: 0x1e293b, stroke: 0x334155 },
      { id: 'bay3', type: 'rect', x: 82, y: 12, width: 20, height: 32, cornerRadius: 2, fill: 0x1e293b, stroke: 0x334155 },
      { id: 'bay4', type: 'rect', x: 108, y: 12, width: 20, height: 32, cornerRadius: 2, fill: 0x1e293b, stroke: 0x334155 },

      { id: 'host', type: 'text', x: 148, y: 4, bind: 'data.host', fontSize: 12, fontWeight: 600, color: 0xe2e8f0 },
      { id: 'role', type: 'text', x: 148, y: 24.5, bind: 'data.role', fontSize: 9.5, color: 0x64748b },

      // Empty sockets. Local centres (262, 30) and (292, 30) — the LED nodes
      // sit at those points in world space.
      { id: 'socket-a', type: 'circle', x: 252, y: 20, radius: 10, stroke: 0x1f2937, strokeWidth: 2 },
      { id: 'socket-b', type: 'circle', x: 282, y: 20, radius: 10, stroke: 0x1f2937, strokeWidth: 2 }
    ]
  }
};

// `led` and `gauge` are absent on purpose: a node whose `type` has no binding
// skips the template path entirely and renders from its own `style`.
const TYPES: NodeTypeRegistry = {
  rack: { structure: 'rackChassis', styling: '', bindings: {} },
  blade: { structure: 'blade', styling: '', bindings: {} }
};

// ── The dials — engine decorations, one node each ───────────────────────────
// Four LED recipes. The differing `periodMs` is what desynchronises the blink:
// `glow.pulse` has no phase control, only `breathing.phaseOffsetMs` does.
const LED_GREEN: NodeStyle = {
  shape: { kind: 'circle', radius: 5 },
  bgFill: 0x22c55e,
  bgStrokeColor: 0x052e16,
  bgStrokeWidth: 1,
  decorations: [
    { id: 'halo', kind: 'glow', color: 0x22c55e, strokeWidth: 12, layers: 5, innerAlpha: 0.55, pulse: { periodMs: 900, amplitude: 0.75 } },
    { id: 'ping', kind: 'pulse-ring', color: 0x22c55e, maxRadius: 14, periodMs: 1800, rings: 2, strokeWidth: 1.2, innerAlpha: 0.5 }
  ],
  effects: { breathing: { amplitude: 0.22, periodMs: 900, phaseOffsetMs: 0 } }
};

const LED_CYAN: NodeStyle = {
  shape: { kind: 'circle', radius: 5 },
  bgFill: 0x22d3ee,
  bgStrokeColor: 0x083344,
  bgStrokeWidth: 1,
  decorations: [
    { id: 'halo', kind: 'glow', color: 0x22d3ee, strokeWidth: 11, layers: 5, innerAlpha: 0.5, pulse: { periodMs: 700, amplitude: 0.8 } }
  ],
  effects: { breathing: { amplitude: 0.3, periodMs: 700, phaseOffsetMs: 180 } }
};

const LED_AMBER: NodeStyle = {
  shape: { kind: 'circle', radius: 5 },
  bgFill: 0xf59e0b,
  bgStrokeColor: 0x451a03,
  bgStrokeWidth: 1,
  decorations: [
    { id: 'halo', kind: 'glow', color: 0xf59e0b, strokeWidth: 12, layers: 5, innerAlpha: 0.55, pulse: { periodMs: 1250, amplitude: 0.7 } },
    { id: 'ping', kind: 'pulse-ring', color: 0xf59e0b, maxRadius: 16, periodMs: 1250, rings: 1, strokeWidth: 1.4, innerAlpha: 0.55 }
  ],
  effects: { breathing: { amplitude: 0.25, periodMs: 1250, phaseOffsetMs: 420 } }
};

// The one that is actually telling you something.
const LED_RED: NodeStyle = {
  shape: { kind: 'circle', radius: 5 },
  bgFill: 0xef4444,
  bgStrokeColor: 0x450a0a,
  bgStrokeWidth: 1,
  decorations: [
    { id: 'halo', kind: 'glow', color: 0xef4444, strokeWidth: 14, layers: 6, innerAlpha: 0.65, pulse: { periodMs: 1600, amplitude: 0.85 } },
    { id: 'ping', kind: 'pulse-ring', color: 0xef4444, maxRadius: 22, periodMs: 1600, rings: 3, strokeWidth: 1.6, innerAlpha: 0.6 }
  ],
  effects: { breathing: { amplitude: 0.35, periodMs: 1600, phaseOffsetMs: 640 } }
};

// Two tank gauges. `liquid-fill` + `wave` is the only decoration here that
// animates without a pulse block — the meniscus phase advances every frame.
const GAUGE_LOAD: NodeStyle = {
  shape: { kind: 'circle', radius: 28 },
  bgFill: 0x0b1220,
  bgStrokeColor: 0x1f2937,
  bgStrokeWidth: 2,
  decorations: [
    { id: 'fluid', kind: 'liquid-fill', fillLevel: 0.62, colorTop: 0x38bdf8, colorBottom: 0x0369a1, alpha: 0.9, wave: { amplitude: 3, wavelength: 44, periodMs: 2200 } },
    { id: 'bezel', kind: 'ring', color: 0x475569, width: 3, gap: 2 }
  ],
  labelText: 'LOAD 62%',
  labelColor: 0x94a3b8,
  labelFontSize: 10,
  labelPlacement: 'bottom',
  labelOffsetY: 10
};

const GAUGE_TEMP: NodeStyle = {
  shape: { kind: 'circle', radius: 28 },
  bgFill: 0x0b1220,
  bgStrokeColor: 0x1f2937,
  bgStrokeWidth: 2,
  decorations: [
    { id: 'fluid', kind: 'liquid-fill', fillLevel: 0.84, colorTop: 0xfbbf24, colorBottom: 0xb45309, alpha: 0.9, wave: { amplitude: 4, wavelength: 38, periodMs: 1500 } },
    { id: 'bezel', kind: 'ring', color: 0x475569, width: 3, gap: 2 },
    // Over temperature: the bezel itself pings.
    { id: 'alarm', kind: 'pulse-ring', color: 0xf59e0b, maxRadius: 18, periodMs: 2000, rings: 2, strokeWidth: 1.4, innerAlpha: 0.45 }
  ],
  labelText: 'TEMP 84°',
  labelColor: 0x94a3b8,
  labelFontSize: 10,
  labelPlacement: 'bottom',
  labelOffsetY: 10
};

// ── The scene ───────────────────────────────────────────────────────────────
// Order matters: the renderer sorts shapes by `spec.zIndex` (all 0 here) with a
// stable sort, so `nodes[]` order *is* paint order — chassis, then blades, then
// the dials on top of their sockets.
//
// A blade's local socket centres are (262, 30) and (292, 30) in a 320 × 56 box,
// so in world space they land at blade.x − 160 + socket.x and blade.y − 28 + 30.
const DATA: GraphData = {
  nodes: [
    { id: 'rack', type: 'rack', position: { x: 0, y: 0 }, data: { brand: 'invana · rack 01', units: '4U / 12U' } },

    { id: 'blade-1', type: 'blade', position: { x: 0, y: -128 }, data: { host: 'kepler-01', role: 'ingest · primary' } },
    { id: 'blade-2', type: 'blade', position: { x: 0, y: -64 }, data: { host: 'kepler-02', role: 'ingest · replica' } },
    { id: 'blade-3', type: 'blade', position: { x: 0, y: 0 }, data: { host: 'halley-01', role: 'query · shard a' } },
    { id: 'blade-4', type: 'blade', position: { x: 0, y: 64 }, data: { host: 'halley-02', role: 'query · shard b — degraded' } },

    // Power + activity pair per blade. Paired colours vary so the rack reads
    // as four machines in four different moods.
    { id: 'led-1a', type: 'led', position: { x: 102, y: -126 }, style: LED_GREEN },
    { id: 'led-1b', type: 'led', position: { x: 132, y: -126 }, style: LED_CYAN },
    { id: 'led-2a', type: 'led', position: { x: 102, y: -62 }, style: LED_GREEN },
    { id: 'led-2b', type: 'led', position: { x: 132, y: -62 }, style: LED_CYAN },
    { id: 'led-3a', type: 'led', position: { x: 102, y: 2 }, style: LED_GREEN },
    { id: 'led-3b', type: 'led', position: { x: 132, y: 2 }, style: LED_AMBER },
    { id: 'led-4a', type: 'led', position: { x: 102, y: 66 }, style: LED_RED },
    { id: 'led-4b', type: 'led', position: { x: 132, y: 66 }, style: LED_AMBER },

    { id: 'gauge-load', type: 'gauge', position: { x: -70, y: 128 }, style: GAUGE_LOAD },
    { id: 'gauge-temp', type: 'gauge', position: { x: 70, y: 128 }, style: GAUGE_TEMP }
  ],
  edges: []
};

// Every word on the rack is drawn by a structure or pinned on a dial's own
// style, so the layer-wide label stays empty.
const NODE: GraphLayerProps['node'] = { style: { labelText: '' } };

const CONFIG: CanvasConfig = { fitOnLoad: true };

export const ServerRack: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <CanvasThemeSync />
        <GraphLayer id="graph" data={DATA} node={NODE} nodeStructureTemplates={STRUCTURES} nodeTypes={TYPES} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        {/* No DragNodeBehaviour: the dials are parked on their sockets by
            absolute position, and dragging one would strand it. */}
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />
      </GraphCanvas>
    </div>
  )
};
