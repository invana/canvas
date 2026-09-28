/**
 * Typed commands (phase D of rfc:feat-2026-09-29-commands-stop-at-saved-control-panels):
 * `canvas.commands` checks the args of the names in its command map at compile
 * time and takes `unknown` for any other name. The `@ts-expect-error` lines are
 * the test — `pnpm check-types` type-checks this file and fails if one of them
 * stops being an error. The runtime assertions only prove nothing changed there.
 */
import { describe, expect, expectTypeOf, it } from 'vitest';
import { CommandRegistry, HeadlessRenderer, type Canvas, type CommandArgsOf, type EngineCommandMap } from '@invana/canvas';
import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import type { GraphCanvasCommandMap } from '../../src/canvas/graphCommands';

/** Only compiled, never called: the calls a typed registry accepts and rejects. */
function typeChecks(canvas: Canvas, graph: GraphCanvas): void {
  canvas.commands.run('camera.fit', { padding: 40 });
  // @ts-expect-error — `padding` is a number
  canvas.commands.run('camera.fit', { padding: 'x' });
  // @ts-expect-error — `behaviour.toggle` needs `id`
  canvas.commands.run('behaviour.toggle', {});
  canvas.commands.isActive('behaviour.toggle', { id: 'pan' });
  // Any other name takes `unknown` args — app-registered commands keep working.
  canvas.commands.run('my-app.do-thing', { anything: [1, 2, 3] });
  canvas.commands.register('my-app.do-thing', { run: () => {} });

  // A GraphCanvas knows the graph commands too.
  graph.commands.run('graph.clear', { layerId: 'graph' });
  // @ts-expect-error — `layerId` is a string
  graph.commands.run('graph.clear', { layerId: 5 });
  graph.commands.run('history.undo', { layerId: 'g2' });
  graph.commands.run('camera.zoomIn', { factor: 2 });

  // A handler registered under a known name gets typed args.
  graph.commands.register('clipboard.copy', {
    run: (_c, args) => {
      expectTypeOf(args).toEqualTypeOf<GraphCanvasCommandMap['clipboard.copy'] | undefined>();
    },
  });

  // Covariant in the map: a typed registry still passes where an untyped one is expected.
  const untyped: CommandRegistry<Canvas> = graph.commands;
  const engineTyped: CommandRegistry<Canvas, EngineCommandMap> = graph.commands;
  const asCanvas: Canvas = graph;
  void untyped;
  void engineTyped;
  void asCanvas;
}

describe('typed commands', () => {
  it('resolves args per name', () => {
    expectTypeOf<CommandArgsOf<EngineCommandMap, 'camera.pan'>>().toEqualTypeOf<{ dx?: number; dy?: number } | undefined>();
    expectTypeOf<CommandArgsOf<EngineCommandMap, 'not.a.command'>>().toEqualTypeOf<unknown>();
    expect(typeof typeChecks).toBe('function');
  });

  it('changes nothing at runtime', () => {
    const graph = new GraphCanvas();
    graph.initWithRenderer(new HeadlessRenderer(), 800, 600);
    expect(graph.commands.run('not.a.command', { x: 1 })).toBe(false);
    expect(graph.commands.has('graph.clear')).toBe(true);
    graph.destroy();
  });
});
