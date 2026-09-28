import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  type CanvasConfig,
  type PlaybookSpec
} from '@invana/canvas';
import { GraphCanvas, GraphLayer, ThemeBehaviour } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Playbook/HideAndReflow' };
export default meta;
type Story = StoryObj;

/**
 * **Narrow by hiding, and the layout re-flows.** Each step is only a `data`
 * delta — `hidden` / `shown` node ids. Layouts skip hidden nodes, and the
 * active layout now re-runs on an explicit hide or show (not only on add /
 * remove), so the rest closes the gap instead of leaving holes.
 *
 * Data-triggered re-runs follow the layout's `onData`: `throttleMs` collapses
 * a burst of changes into one run at the start of the window and one at its
 * end, and `preserveCamera` keeps the view where it is. Turn
 * `preserveCamera` off to let the auto-fitter re-frame after each re-flow.
 * Step back to show the clusters again.
 */
export const HideAndReflowStory: Story = {
  name: 'HideAndReflow',
  render: () => createContainer({ id: 'graph-playbook-hide-and-reflow' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-playbook-hide-and-reflow')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: lesMiserables } }));
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
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
            dot: { name: 'dot', kind: 'simple', shape: { kind: 'circle', radius: 7 }, slots: { label: true } }
          },
          nodeStylingTemplates: {
            dot: { name: 'dot', fillRole: 'accent', label: { fontSize: 10, colorRole: 'foreground', placement: 'bottom' } }
          },
          nodeTypes: { character: { structure: 'dot', styling: 'dot', bindings: { label: 'id' } } }
        }
      },
      behaviours: {
        theme: { enabled: true, mode: 'document' },
        pan: { enabled: true },
        zoom: { enabled: true }
      },
      layouts: {
        force: { animate: false, link: { distance: 45 }, charge: { strength: -160 }, collide: { radius: 16 } }
      },
      activeLayout: 'force'
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const playbook: PlaybookSpec<CanvasConfig> = {
      version: 1,
      title: 'Narrow by hiding',
      source: 'graph',
      steps: [
        {
          id: 'bishop',
          title: 'Hide the bishop\'s household',
          data: {
            hidden: {
              nodeIds: [
                'Myriel', 'Napoleon', 'Mlle.Baptistine', 'Mme.Magloire', 'CountessdeLo', 'Geborand',
                'Champtercier', 'Cravatte', 'Count', 'OldMan'
              ]
            }
          }
        },
        {
          id: 'fantine',
          title: 'Hide Fantine\'s Paris',
          data: {
            hidden: {
              nodeIds: [
                'Marguerite', 'Tholomyes', 'Listolier', 'Fameuil', 'Blacheville', 'Favourite', 'Dahlia',
                'Zephine', 'Perpetue'
              ]
            }
          }
        },
        {
          id: 'trial',
          title: 'Hide the Champmathieu trial',
          data: {
            hidden: {
              nodeIds: [
                'Labarre', 'Mme.deR', 'Isabeau', 'Gervais', 'Bamatabois', 'Simplice', 'Scaufflaire',
                'Woman1', 'Judge', 'Champmathieu', 'Brevet', 'Chenildieu', 'Cochepaille'
              ]
            }
          },
          view: { camera: 'visible' }
        },
        {
          id: 'bishop-back',
          title: 'Show the bishop\'s household again',
          data: {
            shown: {
              nodeIds: [
                'Myriel', 'Napoleon', 'Mlle.Baptistine', 'Mme.Magloire', 'CountessdeLo', 'Geborand',
                'Champtercier', 'Cravatte', 'Count', 'OldMan'
              ]
            }
          },
          view: { camera: 'visible' }
        }
      ]
    };
    await canvas.playbook.load(playbook);

    const gui = new GUI({ title: playbook.title, width: 320 });
    onStoryTeardown(() => gui.destroy());
    const readout = { step: `0 / ${playbook.steps.length}`, runs: 0, error: '' };
    onStoryTeardown(
      canvas.playbook.subscribe(() => {
        const pb = canvas.playbook;
        readout.step = `${pb.index + 1} / ${pb.steps.length}${pb.current ? ` · ${pb.current.title}` : ''}`;
      })
    );
    onStoryTeardown(canvas.events.on('layout:run:start', () => void readout.runs++));
    const report = (err: unknown): void => {
      readout.error = err instanceof Error ? err.message : String(err);
    };
    gui.add(readout, 'step').name('Step').disable().listen();
    gui.add(readout, 'runs').name('Layout runs').disable().listen();
    gui.add(readout, 'error').name('Error').disable().listen();
    gui.add({ previous: () => void canvas.playbook.previous().catch(report) }, 'previous').name('◀ Previous');
    gui.add({ next: () => void canvas.playbook.next().catch(report) }, 'next').name('Next ▶');

    // `onData` is read on every data change, so assigning it takes effect on the next one.
    const onData = { throttleMs: 300, preserveCamera: true };
    const layoutFolder = gui.addFolder('Layout onData');
    layoutFolder.add(onData, 'throttleMs', 0, 2000, 50).onChange(() => (force.onData = { ...onData }));
    layoutFolder.add(onData, 'preserveCamera').onChange(() => (force.onData = { ...onData }));
  }
};
