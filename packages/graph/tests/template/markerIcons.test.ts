/**
 * Marker presentation as config — the P2 rows of `docs/geo-intelligence-plan.md`
 * (`rfc:feat-2026-11-17-marker-icons-and-zoom-labels-are-not-config`):
 *
 * - **T1** a styling template carries an `icon`; `slots.icon: false` opts out
 * - **T2** a `named` icon resolves through `GraphLayerOptions.iconSet` into an
 *   `svg-url` layer; an unknown name draws nothing and warns once; `setOptions`
 *   merges the set
 * - **T3** a node type's `states[name].label` template fills from the record,
 *   between the layer's overlay and the node's own
 * - **T4** `rotationBind` / `rotationUnit` / `rotationOffset` turn a record field
 *   into an icon `rotation` in radians
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import type { GraphLayerOptions, NodeIcon } from '../../src/layer/types';
import { compileIcon } from '../../src/template/compile';
import type { GraphNode } from '../../src/store/types';

beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  function FakeCtx2D(): void {}
  FakeCtx2D.prototype.letterSpacing = '';
  g['CanvasRenderingContext2D'] = FakeCtx2D;
  const element = (): unknown => ({
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 800, height: 600, top: 0, left: 0 }),
    getContext: () => ({
      font: '',
      measureText: (t: string) => ({
        width: t.length * 7,
        actualBoundingBoxAscent: 8,
        actualBoundingBoxDescent: 2,
        fontBoundingBoxAscent: 10,
        fontBoundingBoxDescent: 3,
      }),
    }),
  });
  g['document'] ??= { createElement: element };
});

const WAVES = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></svg>';

const NODE = (data: Record<string, unknown>): GraphNode => ({ id: 'n', type: 'vessel', data, position: { x: 0, y: 0 } }) as GraphNode;

function mount(options: GraphLayerOptions): { canvas: Canvas; layer: GraphLayer } {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  return { canvas, layer };
}

const BASE: GraphLayerOptions = {
  nodeStructureTemplates: {
    marker: { name: 'marker', kind: 'simple', shape: { kind: 'circle', radius: 10 }, slots: { label: true, icon: true } },
    bare: { name: 'bare', kind: 'simple', shape: { kind: 'circle', radius: 10 }, slots: { label: true, icon: false } }
  },
  nodeStylingTemplates: {
    ship: { name: 'ship', fill: 0x0284c7, icon: { kind: 'named', name: 'waves', color: 0xffffff } }
  },
  nodeTypes: {
    vessel: { structure: 'marker', styling: 'ship', bindings: { label: 'data.name' } },
    hidden: { structure: 'bare', styling: 'ship', bindings: {} }
  },
  iconSet: { waves: WAVES }
};

afterEach(() => vi.restoreAllMocks());

describe('T1 — an icon in a styling template', () => {
  it('reaches the resolved node style', () => {
    const { canvas, layer } = mount(BASE);
    layer.setData({ nodes: [NODE({ name: 'MV Alpha' })], edges: [] });
    layer.store.flush();
    const icon = layer.resolveNodeStyle(layer.store.getNode('n')!).icon;
    expect(icon).toMatchObject({ kind: 'named', name: 'waves', color: 0xffffff });
    canvas.destroy();
  });

  it('is left out when the structure declares slots.icon: false', () => {
    const { canvas, layer } = mount(BASE);
    layer.setData({ nodes: [{ id: 'h', type: 'hidden', data: {}, position: { x: 0, y: 0 } } as GraphNode], edges: [] });
    layer.store.flush();
    expect(layer.resolveNodeStyle(layer.store.getNode('h')!).icon).toBeUndefined();
    canvas.destroy();
  });

  it('is absent when the template has none (control: compiles as before)', () => {
    const { canvas, layer } = mount({
      ...BASE,
      nodeStylingTemplates: { ship: { name: 'ship', fill: 0x0284c7 } }
    });
    layer.setData({ nodes: [NODE({ name: 'x' })], edges: [] });
    layer.store.flush();
    expect(layer.resolveNodeStyle(layer.store.getNode('n')!).icon).toBeUndefined();
    canvas.destroy();
  });
});

describe('T2 — a named icon resolves through the layer iconSet', () => {
  const fillOf = (canvas: Canvas, id: string): unknown => (canvas.store.specs['graph']!.get(id) as { fill?: unknown }).fill;

  it('publishes an svg-url layer over a data: URL, keeping colour, size and rotation', () => {
    const { canvas, layer } = mount({
      ...BASE,
      nodeStylingTemplates: {
        ship: { name: 'ship', fill: 0x0284c7, icon: { kind: 'named', name: 'waves', color: 0xffffff, sizeRatio: 0.7, rotation: 1 } }
      }
    });
    layer.setData({ nodes: [NODE({ name: 'a' })], edges: [] });
    layer.store.flush();
    layer.flush();
    const fill = fillOf(canvas, 'n') as Array<Record<string, unknown>>;
    expect(Array.isArray(fill)).toBe(true);
    const icon = fill.find((l) => l.kind === 'svg-url')!;
    expect(icon).toMatchObject({ kind: 'svg-url', color: 0xffffff, sizeRatio: 0.7, rotation: 1 });
    expect(String(icon.url)).toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(WAVES)}`);
    expect(icon).not.toHaveProperty('name');
    expect(() => JSON.stringify(fill)).not.toThrow();
    canvas.destroy();
  });

  it('draws nothing for an unknown name, and warns once per name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { canvas, layer } = mount({
      ...BASE,
      nodeStylingTemplates: { ship: { name: 'ship', fill: 0x0284c7, icon: { kind: 'named', name: 'nope' } } }
    });
    layer.setData({
      nodes: [NODE({ name: 'a' }), { id: 'm', type: 'vessel', data: {}, position: { x: 1, y: 1 } } as GraphNode],
      edges: []
    });
    layer.store.flush();
    layer.flush();
    expect(fillOf(canvas, 'n')).toBe(0x0284c7); // bare solid — as if it had no icon
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain('"nope"');
    canvas.destroy();
  });

  it('merges iconSet in setOptions, so a late icon starts to draw', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { canvas, layer } = mount({ ...BASE, iconSet: {} });
    layer.setData({ nodes: [NODE({ name: 'a' })], edges: [] });
    layer.store.flush();
    layer.flush();
    expect(fillOf(canvas, 'n')).toBe(0x0284c7);

    layer.setOptions({ iconSet: { waves: WAVES } });
    layer.store.flush();
    layer.flush();
    expect(Array.isArray(fillOf(canvas, 'n'))).toBe(true);
    canvas.destroy();
  });

  it('passes glyph / svg / svg-url icons through untouched (control)', () => {
    const { canvas, layer } = mount({
      ...BASE,
      nodeStylingTemplates: { ship: { name: 'ship', fill: 0x0284c7, icon: { kind: 'svg-url', url: 'https://example.test/a.svg' } } }
    });
    layer.setData({ nodes: [NODE({ name: 'a' })], edges: [] });
    layer.store.flush();
    layer.flush();
    const fill = fillOf(canvas, 'n') as Array<Record<string, unknown>>;
    expect(fill.find((l) => l.kind === 'svg-url')).toMatchObject({ url: 'https://example.test/a.svg' });
    canvas.destroy();
  });
});

describe('T3 — a node type fills its own label per state', () => {
  const withStates: GraphLayerOptions = {
    ...BASE,
    nodeTypes: {
      vessel: {
        structure: 'marker',
        styling: 'ship',
        bindings: { label: 'data.name' },
        states: { detail: { label: '{data.name}\n{data.flag} · {data.cargo}' } }
      },
      port: { structure: 'marker', styling: 'ship', bindings: { label: 'data.name' }, states: { detail: { label: '{data.name} ({data.country})' } } }
    },
    node: { state: { detail: { labelText: 'LAYER OVERLAY' } } }
  };

  it('keeps the base label until the state is active', () => {
    const { canvas, layer } = mount(withStates);
    layer.setData({ nodes: [NODE({ name: 'MV Alpha', flag: 'IN', cargo: 'grain' })], edges: [] });
    layer.store.flush();
    expect(layer.resolveNodeStyle(layer.store.getNode('n')!).labelText).toBe('MV Alpha');
    canvas.destroy();
  });

  it("fills the type's template from the record, per type", () => {
    const { canvas, layer } = mount(withStates);
    layer.setData({
      nodes: [
        NODE({ name: 'MV Alpha', flag: 'IN', cargo: 'grain' }),
        { id: 'p', type: 'port', data: { name: 'Kakinada', country: 'India' }, position: { x: 5, y: 5 } } as GraphNode
      ],
      edges: []
    });
    layer.store.flush();
    layer.store.internal.setNodeState('n', 'detail', true);
    layer.store.internal.setNodeState('p', 'detail', true);
    expect(layer.resolveNodeStyle(layer.store.getNode('n')!).labelText).toBe('MV Alpha\nIN · grain');
    expect(layer.resolveNodeStyle(layer.store.getNode('p')!).labelText).toBe('Kakinada (India)');
    canvas.destroy();
  });

  it('wins over the layer overlay and loses to the node’s own overlay', () => {
    const { canvas, layer } = mount(withStates);
    layer.setData({
      nodes: [
        NODE({ name: 'MV Alpha', flag: 'IN', cargo: 'grain' }),
        { id: 'o', type: 'vessel', data: { name: 'MV Own', flag: 'SG', cargo: 'oil' }, state: { detail: { labelText: 'OWN' } }, position: { x: 9, y: 9 } } as GraphNode
      ],
      edges: []
    });
    layer.store.flush();
    layer.store.internal.setNodeState('n', 'detail', true);
    layer.store.internal.setNodeState('o', 'detail', true);
    expect(layer.resolveNodeStyle(layer.store.getNode('n')!).labelText).toBe('MV Alpha\nIN · grain'); // type > layer
    expect(layer.resolveNodeStyle(layer.store.getNode('o')!).labelText).toBe('OWN'); // node > type
    canvas.destroy();
  });

  it('falls back to the layer overlay for a type with no states (control)', () => {
    const { canvas, layer } = mount({ ...withStates, nodeTypes: { vessel: { structure: 'marker', styling: 'ship', bindings: { label: 'data.name' } } } });
    layer.setData({ nodes: [NODE({ name: 'MV Alpha' })], edges: [] });
    layer.store.flush();
    layer.store.internal.setNodeState('n', 'detail', true);
    expect(layer.resolveNodeStyle(layer.store.getNode('n')!).labelText).toBe('LAYER OVERLAY');
    canvas.destroy();
  });
});

describe('T4 — an icon rotation bound to a record field', () => {
  const ICON = (extra: Record<string, unknown>) => ({ kind: 'named', name: 'waves', ...extra }) as never;
  const rotationOf = (icon: NodeIcon | undefined): number | undefined => (icon as { rotation?: number } | undefined)?.rotation;

  it('turns degrees into radians, clockwise from up (0° = north)', () => {
    expect(rotationOf(compileIcon(ICON({ rotationBind: 'data.course' }), NODE({ course: 0 })))).toBe(0);
    expect(rotationOf(compileIcon(ICON({ rotationBind: 'data.course' }), NODE({ course: 90 })))).toBeCloseTo(Math.PI / 2, 10);
    expect(rotationOf(compileIcon(ICON({ rotationBind: 'data.course' }), NODE({ course: 180 })))).toBeCloseTo(Math.PI, 10);
    expect(rotationOf(compileIcon(ICON({ rotationBind: 'data.course' }), NODE({ course: 270 })))).toBeCloseTo((3 * Math.PI) / 2, 10);
  });

  it('honours rotationUnit "rad" and a rotationOffset in the same unit', () => {
    expect(rotationOf(compileIcon(ICON({ rotationBind: 'data.h', rotationUnit: 'rad' }), NODE({ h: 1.25 })))).toBe(1.25);
    // an icon drawn pointing east (90° clockwise from up) needs -90° to read as north
    expect(rotationOf(compileIcon(ICON({ rotationBind: 'data.course', rotationOffset: -90 }), NODE({ course: 90 })))).toBeCloseTo(0, 10);
  });

  it('draws unrotated when the record has no number at the path', () => {
    for (const data of [{}, { course: 'north' }, { course: null }, { course: Number.NaN }]) {
      expect(rotationOf(compileIcon(ICON({ rotationBind: 'data.course' }), NODE(data)))).toBeUndefined();
    }
  });

  it('keeps a static rotation when nothing is bound, and strips the template-only fields', () => {
    const plain = compileIcon(ICON({ rotation: 0.5 }), NODE({}))!;
    expect(rotationOf(plain)).toBe(0.5);
    const bound = compileIcon(ICON({ rotationBind: 'data.course', rotationUnit: 'deg', rotationOffset: 5 }), NODE({ course: 10 }))!;
    expect(bound).not.toHaveProperty('rotationBind');
    expect(bound).not.toHaveProperty('rotationUnit');
    expect(bound).not.toHaveProperty('rotationOffset');
  });

  it('is undefined for no icon', () => {
    expect(compileIcon(undefined, NODE({}))).toBeUndefined();
  });

  it('reaches the published spec, and follows a changed heading', () => {
    const { canvas, layer } = mount({
      ...BASE,
      nodeStylingTemplates: { ship: { name: 'ship', fill: 0x0284c7, icon: { kind: 'named', name: 'waves', rotationBind: 'data.course' } } }
    });
    layer.setData({ nodes: [NODE({ course: 90 })], edges: [] });
    layer.store.flush();
    layer.flush();
    const rot = (): number | undefined => {
      const fill = (canvas.store.specs['graph']!.get('n') as { fill?: Array<{ kind: string; rotation?: number }> }).fill!;
      return fill.find((l) => l.kind === 'svg-url')?.rotation;
    };
    expect(rot()).toBeCloseTo(Math.PI / 2, 10);

    layer.store.internal.updateNode('n', { data: { course: 180 } });
    layer.store.flush();
    layer.flush();
    expect(rot()).toBeCloseTo(Math.PI, 10);
    canvas.destroy();
  });
});
