import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  type CanvasConfig,
  type PlaybookSpec
} from '@invana/canvas';
import {
  ClickSelectBehaviour,
  ClickViewBehaviour,
  DragNodeBehaviour,
  FocusBehaviour,
  GraphCanvas,
  GraphLayer,
  ThemeBehaviour
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Playbook/Walkthrough' };
export default meta;
type Story = StoryObj;

/**
 * **A playbook: an analysis as JSON steps.** Les Misérables' co-appearance
 * network (an edge = two characters share a scene), walked through as nine
 * steps — overview, highlight the hub, zoom in, follow the pursuit, narrow by
 * hiding, expand with new nodes, re-layout, zoom out, fit everything.
 *
 * Every step below is plain data (`PlaybookSpec`) — what an engine or an
 * assistant would send. `canvas.playbook.load(doc)` only stores it; **Next**
 * plays a step: its `data` (a delta through the graph layer's `applyDelta`) and
 * `view` (select / focus / inspect / camera intent) land as **one** history
 * entry tagged with the step, then its `do` verbs run (zoom, re-layout) and the
 * canvas settles. **Previous** takes the step back; **Next** again replays it.
 *
 * What draws each field: `FocusBehaviour` (highlight + dim, frames a `'focus'`
 * intent), `ClickSelectBehaviour` (follows the store's selection),
 * `ClickViewBehaviour` (follows `inspect` — shown in the panel), the engine
 * (frames `'visible'` / `'all'`), and the active layout (re-flows on hide /
 * show / add, throttled, camera kept — `onData`).
 *
 * Click or drag between steps: those are ordinary history entries by `'user'`.
 * Ctrl+Z still undoes one entry at a time; the panel counts them by actor.
 */
export const WalkthroughStory: Story = {
  name: 'Walkthrough',
  render: () => createContainer({ id: 'graph-playbook-walkthrough' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-playbook-walkthrough')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: lesMiserables } }));

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph' }));
    // Follows `inspect` for the panel. It claims no click gesture, so it runs
    // beside ClickSelect (two behaviours can't both own `pointer+click`).
    canvas.behaviours.register(new ClickViewBehaviour({ id: 'view', targetLayerId: 'graph', shortcuts: [] }));
    canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph' }));

    // Data changes re-run the layout at most every 300 ms and leave the camera
    // where the step put it.
    const force = new D3ForceLayout({
      id: 'force',
      targetLayerId: 'graph',
      onData: { throttleMs: 300, preserveCamera: true }
    });
    canvas.layouts.add(force);
    onStoryTeardown(() => force.stop());

    const canvasOptions = {
      fitOnLoad: true,
      layers: {
        bg: { type: 'pattern', patternType: 'dots', size: 1.5, spacing: 24, alpha: 0.85 },
        graph: {
          nodeStructureTemplates: {
            dot: { name: 'dot', kind: 'simple', shape: { kind: 'circle', radius: 7 }, slots: { label: true } },
            alias: { name: 'alias', kind: 'simple', shape: { kind: 'circle', radius: 9 }, slots: { label: true } }
          },
          nodeStylingTemplates: {
            dot: { name: 'dot', fillRole: 'accent', label: { fontSize: 10, colorRole: 'foreground', placement: 'bottom' } },
            alias: {
              name: 'alias',
              fillRole: 'heading',
              strokeWidth: 2,
              label: { fontSize: 11, fontWeight: 600, colorRole: 'heading', placement: 'bottom' }
            }
          },
          nodeTypes: {
            character: { structure: 'dot', styling: 'dot', bindings: { label: 'id' } },
            alias: { structure: 'alias', styling: 'alias', bindings: { label: 'data.label' } }
          }
        }
      },
      behaviours: {
        theme: { enabled: true, mode: 'document' },
        pan: { enabled: true },
        zoom: { enabled: true },
        drag: { enabled: true },
        select: { enabled: true },
        view: { enabled: true },
        focus: { enabled: true }
      },
      layouts: {
        force: {
          animate: false,
          link: { distance: 45 },
          charge: { strength: -160 },
          collide: { radius: 16 },
          center: { x: 0, y: 0 }
        }
      },
      activeLayout: 'force'
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ── The script — plain JSON, as an engine would send it ──────────────────
    const playbook: PlaybookSpec<CanvasConfig> = {
      version: 1,
      title: 'Who holds Les Misérables together?',
      source: 'graph',
      steps: [
        {
          id: 'overview',
          title: 'The whole cast',
          narration: '77 characters. An edge means two of them share a scene.',
          view: { camera: 'all' }
        },
        {
          id: 'hub',
          title: 'Valjean is the hub',
          narration: 'Valjean shares a scene with 36 characters, more than anyone else.',
          actor: 'assistant',
          view: {
            select: ['Valjean'],
            inspect: 'Valjean',
            focus: {
              ids: [
                'Valjean', 'Labarre', 'Mme.Magloire', 'Mlle.Baptistine', 'Myriel', 'Marguerite', 'Mme.deR',
                'Isabeau', 'Gervais', 'Fantine', 'Mme.Thenardier', 'Thenardier', 'Cosette', 'Javert',
                'Fauchelevent', 'Bamatabois', 'Simplice', 'Scaufflaire', 'Woman1', 'Judge', 'Champmathieu',
                'Brevet', 'Chenildieu', 'Cochepaille', 'Woman2', 'MotherInnocent', 'Gavroche', 'Gillenormand',
                'Mlle.Gillenormand', 'Marius', 'Enjolras', 'Bossuet', 'Gueulemer', 'Babet', 'Claquesous',
                'Montparnasse', 'Toussaint'
              ]
            },
            camera: 'focus'
          }
        },
        {
          id: 'zoom-in',
          title: 'Zoom in',
          narration: 'Zoom is not state, so it is a verb: two camera.zoomIn commands.',
          do: [{ command: 'camera.zoomIn' }, { command: 'camera.zoomIn' }]
        },
        {
          id: 'pursuit',
          title: 'The pursuit: Valjean and Javert',
          narration: 'Javert shares scenes with 17 characters, and every one of the other 16 also shares a scene with Valjean.',
          actor: 'assistant',
          view: {
            select: ['Valjean', 'Javert'],
            inspect: 'Javert',
            focus: { ids: ['Valjean', 'Javert', 'Fantine', 'Cosette', 'Thenardier', 'Mme.Thenardier'] },
            camera: 'focus'
          }
        },
        {
          id: 'narrow',
          title: 'Set aside the bishop and the convent',
          narration: 'Hide two clusters. The layout re-flows around the rest; the camera frames what is visible.',
          actor: 'assistant',
          data: {
            hidden: {
              nodeIds: [
                'Myriel', 'Napoleon', 'Mlle.Baptistine', 'Mme.Magloire', 'CountessdeLo', 'Geborand',
                'Champtercier', 'Cravatte', 'Count', 'OldMan', 'Fauchelevent', 'MotherInnocent', 'Gribier'
              ]
            }
          },
          view: { focus: null, select: [], inspect: null, camera: 'visible' }
        },
        {
          id: 'expand',
          title: 'Expand: Valjean\'s aliases',
          narration: 'New nodes arrive as a delta: the two names Valjean lives under.',
          actor: 'assistant',
          data: {
            added: {
              nodes: [
                { id: 'alias:Madeleine', type: 'alias', data: { label: 'M. Madeleine' } },
                { id: 'alias:Fauchelevent', type: 'alias', data: { label: 'Ultime Fauchelevent' } }
              ],
              edges: [
                { id: 'alias:Madeleine__Valjean', type: 'alias-of', source: 'alias:Madeleine', target: 'Valjean' },
                { id: 'alias:Fauchelevent__Valjean', type: 'alias-of', source: 'alias:Fauchelevent', target: 'Valjean' },
                { id: 'alias:Madeleine__Fantine', type: 'co-appears-with', source: 'alias:Madeleine', target: 'Fantine' },
                { id: 'alias:Fauchelevent__Cosette', type: 'co-appears-with', source: 'alias:Fauchelevent', target: 'Cosette' }
              ]
            }
          },
          view: { focus: { ids: ['Valjean', 'alias:Madeleine', 'alias:Fauchelevent', 'Fantine', 'Cosette'] }, camera: 'focus' }
        },
        {
          id: 'relayout',
          title: 'Re-run the layout',
          narration: 'A verb that waits: the step finishes when the layout has settled.',
          do: [{ command: 'layout.run' }]
        },
        {
          id: 'zoom-out',
          title: 'Zoom out',
          do: [{ command: 'camera.zoomOut' }, { command: 'camera.zoomOut' }, { command: 'camera.zoomOut' }]
        },
        {
          id: 'restore',
          title: 'Bring everyone back',
          narration: 'Show the hidden clusters and fit the whole graph, hidden or not.',
          data: {
            shown: {
              nodeIds: [
                'Myriel', 'Napoleon', 'Mlle.Baptistine', 'Mme.Magloire', 'CountessdeLo', 'Geborand',
                'Champtercier', 'Cravatte', 'Count', 'OldMan', 'Fauchelevent', 'MotherInnocent', 'Gribier'
              ]
            }
          },
          view: { focus: null, select: [], inspect: null, camera: 'all' }
        }
      ]
    };
    await canvas.playbook.load(playbook);

    // ── Presenter panel ──────────────────────────────────────────────────────
    const gui = new GUI({ title: playbook.title, width: 340 });
    onStoryTeardown(() => gui.destroy());
    const titles = playbook.steps.map((s) => s.title);
    const readout = {
      step: '—',
      narration: 'Press Next to play the first step.',
      inspecting: '—',
      history: '0 entries',
      goTo: titles[0]!
    };
    const report = (err: unknown): void => {
      readout.narration = err instanceof Error ? err.message : String(err);
    };
    const refresh = (): void => {
      const pb = canvas.playbook;
      readout.step = pb.current ? `${pb.index + 1} / ${pb.steps.length} · ${pb.current.title}` : `0 / ${pb.steps.length}`;
      readout.narration = pb.current?.narration ?? (pb.current ? '' : 'Press Next to play the first step.');
      if (pb.current) readout.goTo = pb.current.title;
      const entries = canvas.history.entries();
      const byActor = new Map<string, number>();
      for (const e of entries) byActor.set(e.actor, (byActor.get(e.actor) ?? 0) + 1);
      readout.history = `${entries.length} entries · ${[...byActor].map(([a, n]) => `${a} ${n}`).join(' · ')}`;
    };
    onStoryTeardown(canvas.playbook.subscribe(refresh));
    onStoryTeardown(canvas.history.subscribe(refresh));
    onStoryTeardown(
      canvas.store.view.subscribe((state, prev) => {
        if (state.interaction.inspect !== prev.interaction.inspect) readout.inspecting = state.interaction.inspect ?? '—';
      })
    );

    gui.add(readout, 'step').name('Step').disable().listen();
    gui.add(readout, 'narration').name('Narration').disable().listen();
    gui.add(readout, 'inspecting').name('Inspecting').disable().listen();
    gui.add(readout, 'history').name('History').disable().listen();
    gui.add({ previous: () => void canvas.playbook.previous().catch(report) }, 'previous').name('◀ Previous');
    gui.add({ next: () => void canvas.playbook.next().catch(report) }, 'next').name('Next ▶');
    gui
      .add(readout, 'goTo', titles)
      .name('Go to')
      .listen()
      .onFinishChange((title: string) => {
        const step = playbook.steps.find((s) => s.title === title);
        if (step) void canvas.playbook.goTo(step.id).catch(report);
      });
    gui.add({ log: () => console.log(JSON.stringify(canvas.playbook.toJSON(), null, 2)) }, 'log').name('Log script JSON');
  }
};
