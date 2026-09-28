import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  type CanvasConfig,
  type PlaybookSpec
} from '@invana/canvas';
import { FocusBehaviour, GraphCanvas, GraphLayer, ThemeBehaviour } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Playbook/CameraSteps' };
export default meta;
type Story = StoryObj;

/**
 * **The camera in a step: intents, not pixels.** A step names where to look
 * — `view.camera: 'focus' | 'visible' | 'all'` — and whoever owns that framing
 * performs it once the canvas settles: `FocusBehaviour` frames the focus, the
 * engine frames every visible node (`'visible'`) or everything, hidden nodes
 * included (`'all'`). A saved step therefore frames correctly on any screen
 * size.
 *
 * Zoom in / out isn't state, so it rides the step's `do` verbs
 * (`camera.zoomIn`, `camera.zoomOut`, `camera.reset`), which run after the
 * step's writes, each awaited.
 *
 * Step 5 hides a cluster on the edge of the graph and fits `'visible'`; step 6
 * fits `'all'` with the cluster still hidden, so the frame widens to include
 * the space where it would be.
 */
export const CameraStepsStory: Story = {
  name: 'CameraSteps',
  render: () => createContainer({ id: 'graph-playbook-camera-steps' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-playbook-camera-steps')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: lesMiserables } }));
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph' }));
    // Keep the camera where the steps put it when hiding re-flows the graph.
    const force = new D3ForceLayout({ id: 'force', targetLayerId: 'graph', onData: { preserveCamera: true } });
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
        zoom: { enabled: true },
        focus: { enabled: true, frameMaxZoom: 3 }
      },
      layouts: {
        force: { animate: false, link: { distance: 45 }, charge: { strength: -160 }, collide: { radius: 16 } }
      },
      activeLayout: 'force'
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const playbook: PlaybookSpec<CanvasConfig> = {
      version: 1,
      title: 'Camera steps',
      source: 'graph',
      steps: [
        { id: 'zoom-in', title: 'Zoom in ×2', do: [{ command: 'camera.zoomIn' }, { command: 'camera.zoomIn' }] },
        {
          id: 'frame-gavroche',
          title: 'Frame Gavroche and his scenes',
          view: {
            focus: {
              ids: [
                'Gavroche', 'Mme.Burgon', 'Thenardier', 'Javert', 'Valjean', 'Marius', 'Mabeuf',
                'Enjolras', 'Combeferre', 'Prouvaire', 'Feuilly', 'Courfeyrac', 'Bahorel', 'Bossuet',
                'Joly', 'Grantaire', 'Gueulemer', 'Babet', 'Montparnasse', 'Child1', 'Child2', 'Brujon',
                'Mme.Hucheloup'
              ],
              dim: false
            },
            camera: 'focus'
          }
        },
        {
          id: 'zoom-out',
          title: 'Zoom out ×3',
          do: [{ command: 'camera.zoomOut' }, { command: 'camera.zoomOut' }, { command: 'camera.zoomOut' }]
        },
        { id: 'reset', title: 'Reset the camera', view: { focus: null }, do: [{ command: 'camera.reset' }] },
        {
          id: 'hide-fit-visible',
          title: 'Hide Fantine\'s Paris, fit what is visible',
          data: {
            hidden: {
              nodeIds: [
                'Marguerite', 'Tholomyes', 'Listolier', 'Fameuil', 'Blacheville', 'Favourite', 'Dahlia',
                'Zephine', 'Perpetue'
              ]
            }
          },
          view: { camera: 'visible' }
        },
        { id: 'fit-all', title: 'Fit all, hidden included', view: { camera: 'all' } }
      ]
    };
    await canvas.playbook.load(playbook);

    const gui = new GUI({ title: playbook.title, width: 320 });
    onStoryTeardown(() => gui.destroy());
    const readout = { step: `0 / ${playbook.steps.length}`, zoom: '1.00', error: '' };
    onStoryTeardown(
      canvas.playbook.subscribe(() => {
        const pb = canvas.playbook;
        readout.step = `${pb.index + 1} / ${pb.steps.length}${pb.current ? ` · ${pb.current.title}` : ''}`;
      })
    );
    onStoryTeardown(
      canvas.store.view.subscribe((state, prev) => {
        if (state.interaction.camera.zoom !== prev.interaction.camera.zoom) {
          readout.zoom = state.interaction.camera.zoom.toFixed(2);
        }
      })
    );
    const report = (err: unknown): void => {
      readout.error = err instanceof Error ? err.message : String(err);
    };
    gui.add(readout, 'step').name('Step').disable().listen();
    gui.add(readout, 'zoom').name('Zoom').disable().listen();
    gui.add(readout, 'error').name('Error').disable().listen();
    gui.add({ previous: () => void canvas.playbook.previous().catch(report) }, 'previous').name('◀ Previous');
    gui.add({ next: () => void canvas.playbook.next().catch(report) }, 'next').name('Next ▶');
  }
};
