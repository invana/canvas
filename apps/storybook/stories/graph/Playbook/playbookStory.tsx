import type { StoryObj } from '@storybook/react-vite';
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
import { HistoryViewPanel, PlaybookPresenterBar, PlaybookViewPanel } from '@invana/canvas-ui';
import { useEffect, useRef, useState } from 'react';

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
  /**
   * Overlay `PlaybookPresenterBar` on the bottom of the canvas — the playbook as
   * a deck (title, narration, n / N, ◀ / ▶, a dot per step; ← / → once it has
   * focus). Default `false`.
   */
  presenter?: boolean;
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
 * A story that plays `playbook` on a standard graph canvas, with the real
 * playbook controls beside it: `PlaybookViewPanel` (the step and its narration,
 * ◀ Previous, Next ▶, jump to a step, Save as step, Copy JSON) above
 * `HistoryViewPanel` (every entry, who made it, the step it belongs to). With
 * `presenter: true`, `PlaybookPresenterBar` also sits over the bottom of the
 * canvas.
 *
 * The canvas: a `GraphLayer` (`'graph'`), pan / zoom / drag / theme, and the
 * behaviours that draw a step's `view` — `ClickSelectBehaviour` (selection),
 * `ClickViewBehaviour` (inspect; `shortcuts: []` so it doesn't compete with
 * select for the click) and `FocusBehaviour` (focus + `'focus'` framing). The
 * `force` layout re-runs on data changes at most every 300 ms and keeps the
 * camera where the step put it (`onData`).
 */
export function playbookStory(options: PlaybookStoryOptions): StoryObj {
  return { render: () => <PlaybookStage {...options} /> };
}

/** The canvas host + the playbook / history panels. Built once per mount. */
function PlaybookStage({ playbook, data = lesMiserables, layouts, config, presenter = false }: PlaybookStoryOptions) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;
    let cancelled = false;
    const canvas = new GraphCanvas();

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: data } }));
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ClickViewBehaviour({ id: 'view', targetLayerId: 'graph', shortcuts: [] }));
    canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph' }));
    const all: StoppableLayout[] = [
      new D3ForceLayout({ id: 'force', targetLayerId: 'graph', onData: { throttleMs: 300, preserveCamera: true } }),
      ...(layouts?.() ?? [])
    ];
    for (const layout of all) canvas.layouts.add(layout);

    void canvas
      .init({
        container,
        autoResize: true,
        config: (config ? deepMerge(STANDARD_CONFIG, config) : STANDARD_CONFIG) as CanvasConfig
      })
      .then(async () => {
        // Unmounted while init ran (StrictMode's double effect): tear down now.
        if (cancelled) return canvas.destroy();
        await canvas.playbook.load(playbook);
        if (!cancelled) setCanvas(canvas);
      });

    return () => {
      cancelled = true;
      setCanvas(null);
      for (const layout of all) layout.stop();
      if (canvas.isInitialised) canvas.destroy();
    };
    // One engine per mount; the options are the story's constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="relative min-w-0 flex-1">
        <div ref={hostRef} className="absolute inset-0" />
        {presenter && (
          <PlaybookPresenterBar canvas={canvas} className="absolute inset-x-4 bottom-4 mx-auto max-w-2xl shadow-lg" />
        )}
      </div>
      <aside className="border-border bg-card flex w-80 shrink-0 flex-col border-l">
        <PlaybookViewPanel canvas={canvas} className="max-h-[60%] shrink-0" />
        <HistoryViewPanel canvas={canvas} className="min-h-0 flex-1 border-border border-t" />
      </aside>
    </div>
  );
}
