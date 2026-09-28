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

const meta: Meta = { title: 'graph/Playbook/FocusAndFrame' };
export default meta;
type Story = StoryObj;

/**
 * **Highlight and frame, as steps.** Each step writes `view.focus` (which ids
 * to emphasise, and whether to dim the rest) and `view.camera: 'focus'`.
 * `FocusBehaviour` draws the focus — `highlighted` on the ids and the edges
 * between them, `dimmed` on everything else, written as runtime states that
 * history never records — and frames the focused nodes once the canvas has
 * settled.
 *
 * The panel exposes every `FocusBehaviourOptions` field; each change goes
 * through `canvas.update` and redraws the current focus.
 */
export const FocusAndFrameStory: Story = {
  name: 'FocusAndFrame',
  render: () => createContainer({ id: 'graph-playbook-focus-and-frame' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-playbook-focus-and-frame')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: lesMiserables } }));
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph' }));
    const force = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
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
        // Every option from FocusBehaviourOptions exposed here.
        focus: {
          enabled: true,
          focusState: 'highlighted',
          dimState: 'dimmed',
          includeEdges: true,
          frame: false,
          framePadding: 80,
          frameDurationMs: 450,
          frameMaxZoom: 2
        }
      },
      layouts: {
        force: { animate: false, link: { distance: 45 }, charge: { strength: -160 }, collide: { radius: 16 } }
      },
      activeLayout: 'force'
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const playbook: PlaybookSpec<CanvasConfig> = {
      version: 1,
      title: 'Focus and frame',
      source: 'graph',
      steps: [
        {
          id: 'thenardiers',
          title: 'The Thénardiers and their gang',
          view: {
            focus: {
              ids: [
                'Thenardier', 'Mme.Thenardier', 'Eponine', 'Anzelma', 'Gueulemer', 'Babet',
                'Claquesous', 'Montparnasse', 'Brujon'
              ]
            },
            camera: 'focus'
          }
        },
        {
          id: 'students',
          title: 'The students at the barricade',
          view: {
            focus: {
              ids: [
                'Marius', 'Enjolras', 'Combeferre', 'Prouvaire', 'Feuilly', 'Courfeyrac', 'Bahorel',
                'Bossuet', 'Joly', 'Grantaire', 'Gavroche'
              ]
            },
            camera: 'focus'
          }
        },
        {
          id: 'no-dim',
          title: 'Cosette, without dimming the rest',
          view: { focus: { ids: ['Cosette', 'Valjean', 'Marius'], dim: false }, camera: 'focus' }
        },
        {
          id: 'one',
          title: 'One node: the zoom stops at frameMaxZoom',
          view: { focus: { ids: ['Myriel'] }, camera: 'focus' }
        },
        {
          id: 'clear',
          title: 'Clear the focus, fit everything',
          view: { focus: null, camera: 'all' }
        }
      ]
    };
    await canvas.playbook.load(playbook);

    const gui = new GUI({ title: playbook.title, width: 320 });
    onStoryTeardown(() => gui.destroy());
    const readout = { step: `0 / ${playbook.steps.length}`, error: '' };
    onStoryTeardown(
      canvas.playbook.subscribe(() => {
        const pb = canvas.playbook;
        readout.step = `${pb.index + 1} / ${pb.steps.length}${pb.current ? ` · ${pb.current.title}` : ''}`;
      })
    );
    const report = (err: unknown): void => {
      readout.error = err instanceof Error ? err.message : String(err);
    };
    gui.add(readout, 'step').name('Step').disable().listen();
    gui.add(readout, 'error').name('Error').disable().listen();
    gui.add({ previous: () => void canvas.playbook.previous().catch(report) }, 'previous').name('◀ Previous');
    gui.add({ next: () => void canvas.playbook.next().catch(report) }, 'next').name('Next ▶');

    const fb = { ...canvasOptions.behaviours.focus };
    const push = (patch: Record<string, unknown>): void => canvas.update({ behaviours: { focus: patch } });
    const options = gui.addFolder('FocusBehaviour');
    options.add(fb, 'enabled').onChange((v: boolean) => push({ enabled: v }));
    options.add(fb, 'focusState', ['highlighted', 'selected', 'hovered']).onChange((v: string) => push({ focusState: v }));
    options.add(fb, 'dimState', { dimmed: 'dimmed', disabled: 'disabled', 'never dim': '' }).onChange((v: string) => push({ dimState: v }));
    options.add(fb, 'includeEdges').onChange((v: boolean) => push({ includeEdges: v }));
    options.add(fb, 'frame').name('frame on every focus').onChange((v: boolean) => push({ frame: v }));
    options.add(fb, 'framePadding', 0, 240, 4).onChange((v: number) => push({ framePadding: v }));
    options.add(fb, 'frameDurationMs', 0, 1500, 50).onChange((v: number) => push({ frameDurationMs: v }));
    options.add(fb, 'frameMaxZoom', 0.5, 6, 0.1).onChange((v: number) => push({ frameMaxZoom: v }));
  }
};
