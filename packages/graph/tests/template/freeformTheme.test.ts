/**
 * A `FreeformStructure`'s colour **roles** are resolved at compile time against
 * the live palette, so a themed card follows `theme:change` with no work from
 * the consumer — and the *literal* half of each colour pair does not move,
 * because a literal is meaning (a key, a status) rather than chrome.
 *
 * Also pins the three element fields the plate-book stories need on top of a
 * role: `hitId` (addressable sub-parts), `fillAlpha` (a tint of a themed fill)
 * and a rect `stroke` (an outlined glyph).
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import type { CompositeShapeOption } from '../../src/layer/types';
import type { NodeStructureRegistry, NodeTypeRegistry } from '../../src/template/types';

beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  function FakeCtx2D(): void {}
  FakeCtx2D.prototype.letterSpacing = '';
  g['CanvasRenderingContext2D'] = FakeCtx2D;
  const element = (): unknown => ({
    style: {}, addEventListener: () => {}, removeEventListener: () => {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 800, height: 600, top: 0, left: 0 }),
    getContext: () => ({ font: '', measureText: (t: string) => ({ width: t.length * 7, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2, fontBoundingBoxAscent: 10, fontBoundingBoxDescent: 3 }) }),
  });
  g['document'] ??= { createElement: element };
});

const STRUCTURES: NodeStructureRegistry = {
  table: {
    name: 'table', kind: 'freeform', width: 200, height: 60, cornerRadius: 0,
    bgRole: 'cardBg', strokeRole: 'muted', strokeWidth: 1.8,
    elements: [
      { id: 'row', type: 'rect', x: 0, y: 0, width: 200, height: 24, fillRole: 'muted', fillAlpha: 0.14, hitId: 'row:id' },
      { id: 'glyph', type: 'rect', x: 4, y: 4, width: 7, height: 7, stroke: 0xce8509, strokeWidth: 1.4 },
      { id: 'title', type: 'text', x: 12, y: -4, bind: 'data.table', fontSize: 12, colorRole: 'heading' },
    ],
  },
};
const TYPES: NodeTypeRegistry = { table: { structure: 'table', styling: '', bindings: {} } };

describe('freeform structure follows the published theme', () => {
  it('recompiles role colours on theme:change, and passes hitId / fillAlpha / stroke through', () => {
    const canvas = new Canvas();
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
    const layer = new GraphLayer({
      id: 'graph',
      options: { node: { style: { labelText: '' } }, nodeStructureTemplates: STRUCTURES, nodeTypes: TYPES },
    });
    canvas.layers.add(layer);
    canvas.layers.mountAll();
    layer.setData({ nodes: [{ id: 'n', type: 'table', data: { table: 'customer' } }], edges: [] });
    layer.store.flush();

    const shape = (): CompositeShapeOption =>
      layer.resolveNodeStyle([...layer.store.nodes()][0]!).shape as CompositeShapeOption;

    canvas.context.theme.set({ kind: 'light', name: 'default', palette: { cardBg: 0xffffff, muted: 0x64748b, heading: 0x0f172a } });
    const light = shape();
    expect(light.fill).toBe(0xffffff);
    expect(light.stroke?.color).toBe(0x64748b);
    // the three passthroughs
    expect(light.parts[0]).toMatchObject({ part: 'rect', fill: 0x64748b, fillAlpha: 0.14, hitId: 'row:id' });
    expect(light.parts[1]).toMatchObject({ stroke: { color: 0xce8509, width: 1.4 } });
    expect(light.parts[2]).toMatchObject({ part: 'label', text: 'customer', fill: 0x0f172a });

    canvas.context.theme.set({ kind: 'dark', name: 'default', palette: { cardBg: 0x1e293b, muted: 0x94a3b8, heading: 0xf8fafc } });
    const dark = shape();
    expect(dark.fill).toBe(0x1e293b);
    expect(dark.stroke?.color).toBe(0x94a3b8);
    expect(dark.parts[0]).toMatchObject({ fill: 0x94a3b8, fillAlpha: 0.14, hitId: 'row:id' });
    expect(dark.parts[2]).toMatchObject({ fill: 0xf8fafc });
    // The literal key glyph is meaning, not chrome — it must NOT move.
    expect(dark.parts[1]).toMatchObject({ stroke: { color: 0xce8509, width: 1.4 } });

    canvas.destroy();
  });
});
