import type { StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  deepMerge,
  type CanvasConfig,
  type Layout,
  type PlaybookSpec
} from '@invana/canvas';
import {
  ClickSelectBehaviour,
  ClickViewBehaviour,
  DragNodeBehaviour,
  FocusBehaviour,
  GraphCanvas,
  GraphLayer,
  ThemeBehaviour,
  type GraphData
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import { createContainer, onStoryTeardown } from '../../div-util';

/** What a playbook story varies — everything else is the standard canvas below. */
export interface PlaybookStoryOptions {
  /** The script: plain JSON steps, as an engine or an assistant would send them. */
  playbook: PlaybookSpec<CanvasConfig>;
  /** The starting data (the baseline, unrecorded). Default: Les Misérables. */
  data?: GraphData;
  /**
   * Layouts beside the standard `force` one — a step's
   * `settings: { activeLayout }` can switch to them. A factory, so each mount
   * gets fresh instances.
   */
  layouts?: () => StoppableLayout[];
  /** Deep-merged over the standard config (node templates, behaviour / layout options). */
  config?: Record<string, unknown>;
}

/** A layout the story can stop on teardown (every shipped graph layout). */
type StoppableLayout = Layout & { stop(): void };

/** The canvas every playbook story starts from. */
const STANDARD_CONFIG = {
  fitOnLoad: true,
  layers: {
    bg: {
      type: 'pattern',
      patternType: 'dots',
      size: 1.5,
      spacing: 24,
      alpha: 0.85
    },
    graph: {
      nodeStructureTemplates: {
        dot: {
          name: 'dot',
          kind: 'simple',
          shape: { kind: 'circle', radius: 7 },
          slots: { label: true }
        }
      },
      nodeStylingTemplates: {
        dot: {
          name: 'dot',
          fillRole: 'accent',
          label: { fontSize: 10, colorRole: 'foreground', placement: 'bottom' }
        }
      },
      nodeTypes: {
        character: {
          structure: 'dot',
          styling: 'dot',
          bindings: { label: 'id' }
        }
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
      collide: { radius: 16 }
    }
  },
  activeLayout: 'force'
};

/**
 * A story that plays `playbook` on a standard graph canvas, with a panel of
 * playbook controls: the step and its narration, ◀ Previous, Next ▶, Go to.
 *
 * The canvas: a `GraphLayer` (`'graph'`), pan / zoom / drag / theme, and the
 * behaviours that draw a step's `view` — `ClickSelectBehaviour` (selection),
 * `ClickViewBehaviour` (inspect; `shortcuts: []` so it doesn't compete with
 * select for the click) and `FocusBehaviour` (focus + `'focus'` framing). The
 * `force` layout re-runs on data changes at most every 300 ms and keeps the
 * camera where the step put it (`onData`).
 */
export function playbookStory({ playbook, data = lesMiserables, layouts, config }: PlaybookStoryOptions): StoryObj {
  const containerId = `graph-playbook-${playbook.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return {
    render: () => createContainer({ id: containerId }),

    play: async ({ canvasElement }) => {
      const container = canvasElement.querySelector<HTMLDivElement>(`#${containerId}`)!;
      const canvas = new GraphCanvas();
      onStoryTeardown(() => canvas.destroy());

      canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
      canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: data } }));
      canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
      canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
      canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
      canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph' }));
      canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph' }));
      canvas.behaviours.register(
        new ClickViewBehaviour({
          id: 'view',
          targetLayerId: 'graph',
          shortcuts: []
        })
      );
      canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph' }));
      const all: StoppableLayout[] = [
        new D3ForceLayout({
          id: 'force',
          targetLayerId: 'graph',
          onData: { throttleMs: 300, preserveCamera: true }
        }),
        ...(layouts?.() ?? [])
      ];
      for (const layout of all) {
        canvas.layouts.add(layout);
        onStoryTeardown(() => layout.stop());
      }

      await canvas.init({
        container,
        autoResize: true,
        config: (config ? deepMerge(STANDARD_CONFIG, config) : STANDARD_CONFIG) as CanvasConfig
      });
      await canvas.playbook.load(playbook);

      // ── Playbook controls ───────────────────────────────────────────────
      const pb = canvas.playbook;
      const gui = new GUI({ title: playbook.title, width: 340 });
      onStoryTeardown(() => gui.destroy());
      const panel = { step: '', narration: '', goTo: '' };
      const refresh = (): void => {
        panel.step = `${pb.index + 1} / ${pb.steps.length}${pb.current ? ` · ${pb.current.title}` : ''}`;
        panel.narration = pb.current ? (pb.current.narration ?? '') : 'Press Next to play the first step.';
        panel.goTo = pb.current?.id ?? '';
      };
      const report = (err: unknown): void => {
        panel.narration = `⚠ ${err instanceof Error ? err.message : String(err)}`;
      };
      refresh();
      onStoryTeardown(pb.subscribe(refresh));

      gui.add(panel, 'step').name('Step').disable().listen();
      gui.add(panel, 'narration').name('Narration').disable().listen();
      gui.add({ previous: () => void pb.previous().catch(report) }, 'previous').name('◀ Previous');
      gui.add({ next: () => void pb.next().catch(report) }, 'next').name('Next ▶');
      gui
        .add(panel, 'goTo', Object.fromEntries(playbook.steps.map((s) => [s.title, s.id])))
        .name('Go to')
        .listen()
        .onFinishChange((id: string) => void pb.goTo(id).catch(report));
    }
  };
}
