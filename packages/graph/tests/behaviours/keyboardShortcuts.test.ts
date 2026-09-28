/**
 * `KeyboardShortcutsBehaviour` (`@invana/canvas`): keys run commands, a disabled
 * or missing command lets the key fall through, typing in an input is never
 * taken, and `mod` means ⌘ on macOS / Ctrl elsewhere (phase E of
 * rfc:feat-2026-09-29-commands-stop-at-saved-control-panels). Tested here because
 * `packages/canvas` takes no tests (root rule 10); the graph commands make the
 * bindings meaningful.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`; keys
 * go straight to `handleKey` (the DOM listener only adds the scope check).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SHORTCUTS,
  HeadlessRenderer,
  KeyboardShortcutsBehaviour,
  eventShortcut,
  normalizeShortcut,
  type ShortcutKeyEvent,
} from '@invana/canvas';
import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { ClickSelectBehaviour } from '../../src/behaviours/ClickSelectBehaviour';

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

/** A key event; `mod` isn't a real modifier, so tests say ctrl / meta explicitly. */
function key(k: string, mods: Partial<ShortcutKeyEvent> = {}): ShortcutKeyEvent & { preventDefault: () => void } {
  return { key: k, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, preventDefault: vi.fn(), ...mods };
}

function makeCanvas() {
  const canvas = new GraphCanvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  const click = new ClickSelectBehaviour({ id: 'click-select', targetLayerId: 'graph', enabled: true });
  canvas.behaviours.register(click);
  layer.store.addNode({ id: 'a', type: 'node', position: { x: 0, y: 0 } });
  layer.store.addNode({ id: 'b', type: 'node', position: { x: 50, y: 0 } });
  const keys = new KeyboardShortcutsBehaviour({ id: 'keys', bindings: [...DEFAULT_SHORTCUTS], enabled: true });
  canvas.behaviours.register(keys);
  return { canvas, layer, click, keys };
}

describe('normalizeShortcut / eventShortcut', () => {
  it('maps mod to ⌘ on macOS and Ctrl elsewhere, in a fixed modifier order', () => {
    expect(normalizeShortcut('Mod+Shift+Z', true)).toEqual(['shift+meta+z']);
    expect(normalizeShortcut('Mod+Shift+Z', false)).toEqual(['ctrl+shift+z']);
    expect(normalizeShortcut('delete, Backspace', false)).toEqual(['delete', 'backspace']);
    expect(normalizeShortcut('esc', false)).toEqual(['escape']);
    expect(normalizeShortcut('cmd+option+k', false)).toEqual(['alt+meta+k']);
    expect(normalizeShortcut('ctrl++', false)).toEqual(['ctrl++']);
  });

  it('reads an event the same way, and ignores a bare modifier', () => {
    expect(eventShortcut(key('Z', { metaKey: true, shiftKey: true }))).toBe('shift+meta+z');
    expect(eventShortcut(key('Escape'))).toBe('escape');
    expect(eventShortcut(key(' '))).toBe('space');
    expect(eventShortcut(key('Shift', { shiftKey: true }))).toBeNull();
  });
});

describe('KeyboardShortcutsBehaviour', () => {
  it('runs the bound command: Ctrl/⌘+Z undoes a drag', () => {
    const { canvas, layer, keys } = makeCanvas();
    layer.events.emit('node:drag-start', { nodeId: 'a', nodeIds: ['a'] });
    layer.store.setPosition('a', { x: 90, y: 90 });
    layer.events.emit('node:drag-end', { nodeId: 'a', nodeIds: ['a'] });

    // Whichever `mod` this platform has — `keys` read it at construction.
    const undo = key('z', { ctrlKey: true, metaKey: true });
    const e = key('z', normalizeShortcut('mod+z')[0]!.startsWith('ctrl') ? { ctrlKey: true } : { metaKey: true });
    expect(keys.handleKey(undo)).toBe(false); // both modifiers: no binding matches
    expect(keys.handleKey(e)).toBe(true);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(layer.store.getPosition('a')).toEqual({ x: 0, y: 0 });
    canvas.destroy();
  });

  it('a disabled command lets the key fall through (no preventDefault)', () => {
    const { canvas, keys } = makeCanvas();
    // Nothing selected → `clipboard.delete` is disabled.
    const del = key('Delete');
    expect(keys.handleKey(del)).toBe(false);
    expect(del.preventDefault).not.toHaveBeenCalled();
    canvas.destroy();
  });

  it('Delete removes the selection; alternatives match; args pass through', () => {
    const { canvas, layer, click, keys } = makeCanvas();
    click.select('a');
    expect(keys.handleKey(key('Backspace'))).toBe(true);
    expect(layer.store.getNode('a')).toBeUndefined();

    canvas.store.actions.viewMode.set('add');
    expect(keys.handleKey(key('Escape'))).toBe(true);
    expect(canvas.store.view.getState().interaction.viewMode).toBe('select');
    canvas.destroy();
  });

  it('never takes keys typed into an editable element', () => {
    const { canvas, click, keys } = makeCanvas();
    click.select('a');
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) {
      expect(keys.handleKey(key('Delete', { target: { tagName } as unknown as EventTarget }))).toBe(false);
    }
    expect(keys.handleKey(key('Delete', { target: { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget }))).toBe(false);
    canvas.destroy();
  });

  it('bindings edit live through canvas.update, and save in the definition', () => {
    const { canvas, keys } = makeCanvas();
    canvas.update({ behaviours: { keys: { bindings: [{ keys: 'f', command: 'camera.reset' }] } } });
    expect(canvas.store.view.getState().definition.behaviours['keys']?.['bindings']).toEqual([{ keys: 'f', command: 'camera.reset' }]);
    const run = vi.spyOn(canvas.commands, 'run');
    keys.handleKey(key('f'));
    expect(run).toHaveBeenCalledWith('camera.reset', undefined);
    expect(keys.handleKey(key('Delete'))).toBe(false); // the defaults are gone
    canvas.destroy();
  });
});
