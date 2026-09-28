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
  FocusBehaviour,
  GraphCanvas,
  GraphLayer,
  ThemeBehaviour,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Playbook/ExpandAndRelayout' };
export default meta;
type Story = StoryObj;

/**
 * **Expand, re-layout, switch layout — as steps.** The graph starts from four
 * characters. Each "expand" step is a `data.added` delta: the answer an engine
 * would send to "who else shares a scene with Cosette?". New nodes re-run the
 * active layout (throttled, camera kept) and the step frames what it added.
 *
 * `layout.run` in a step's `do` is awaited — the step ends when the layout has
 * settled. A `settings` step is exactly a `canvas.update` patch: here it
 * switches the active layout to ELK, and as an `edit:` change plain Ctrl+Z
 * takes it back.
 */
export const ExpandAndRelayoutStory: Story = {
  name: 'ExpandAndRelayout',
  render: () => createContainer({ id: 'graph-playbook-expand-and-relayout' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { id: 'Valjean', type: 'character' },
      { id: 'Cosette', type: 'character' },
      { id: 'Javert', type: 'character' },
      { id: 'Fantine', type: 'character' }
    ];
    const edges: GraphEdge[] = [
      { id: 'Cosette__Valjean', type: 'co-appears-with', source: 'Cosette', target: 'Valjean' },
      { id: 'Javert__Valjean', type: 'co-appears-with', source: 'Javert', target: 'Valjean' },
      { id: 'Fantine__Valjean', type: 'co-appears-with', source: 'Fantine', target: 'Valjean' },
      { id: 'Javert__Fantine', type: 'co-appears-with', source: 'Javert', target: 'Fantine' },
      { id: 'Javert__Cosette', type: 'co-appears-with', source: 'Javert', target: 'Cosette' }
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-playbook-expand-and-relayout')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } }));
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph' }));
    const force = new D3ForceLayout({
      id: 'force',
      targetLayerId: 'graph',
      onData: { throttleMs: 250, preserveCamera: true }
    });
    const elk = new ElkLayout({ id: 'elk', targetLayerId: 'graph', onData: { preserveCamera: true } });
    canvas.layouts.add(force);
    canvas.layouts.add(elk);
    onStoryTeardown(() => force.stop());
    onStoryTeardown(() => elk.stop());

    const canvasOptions = {
      fitOnLoad: true,
      layers: {
        bg: { type: 'pattern', patternType: 'dots', size: 1.5, spacing: 24, alpha: 0.85 },
        graph: {
          nodeStructureTemplates: {
            dot: { name: 'dot', kind: 'simple', shape: { kind: 'circle', radius: 10 }, slots: { label: true } }
          },
          nodeStylingTemplates: {
            dot: { name: 'dot', fillRole: 'accent', label: { fontSize: 11, colorRole: 'foreground', placement: 'bottom' } }
          },
          nodeTypes: { character: { structure: 'dot', styling: 'dot', bindings: { label: 'id' } } }
        }
      },
      behaviours: {
        theme: { enabled: true, mode: 'document' },
        pan: { enabled: true },
        zoom: { enabled: true },
        focus: { enabled: true }
      },
      layouts: {
        force: { animate: false, link: { distance: 70 }, charge: { strength: -260 }, collide: { radius: 24 } },
        elk: { algorithm: 'layered', direction: 'RIGHT', nodeSpacing: 30, layerSpacing: 70, padding: 30 }
      },
      activeLayout: 'force'
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const playbook: PlaybookSpec<CanvasConfig> = {
      version: 1,
      title: 'Expand and re-layout',
      source: 'graph',
      steps: [
        {
          id: 'expand-cosette',
          title: 'Expand Cosette',
          actor: 'engine',
          data: {
            added: {
              nodes: [
                { id: 'Marius', type: 'character' },
                { id: 'Gillenormand', type: 'character' },
                { id: 'Toussaint', type: 'character' },
                { id: 'Mme.Thenardier', type: 'character' },
                { id: 'Thenardier', type: 'character' }
              ],
              edges: [
                { id: 'Marius__Cosette', type: 'co-appears-with', source: 'Marius', target: 'Cosette' },
                { id: 'Gillenormand__Cosette', type: 'co-appears-with', source: 'Gillenormand', target: 'Cosette' },
                { id: 'Toussaint__Cosette', type: 'co-appears-with', source: 'Toussaint', target: 'Cosette' },
                { id: 'Mme.Thenardier__Cosette', type: 'co-appears-with', source: 'Mme.Thenardier', target: 'Cosette' },
                { id: 'Thenardier__Cosette', type: 'co-appears-with', source: 'Thenardier', target: 'Cosette' },
                { id: 'Thenardier__Mme.Thenardier', type: 'co-appears-with', source: 'Thenardier', target: 'Mme.Thenardier' },
                { id: 'Marius__Gillenormand', type: 'co-appears-with', source: 'Marius', target: 'Gillenormand' }
              ]
            }
          },
          view: {
            focus: { ids: ['Cosette', 'Marius', 'Gillenormand', 'Toussaint', 'Mme.Thenardier', 'Thenardier'] },
            camera: 'focus'
          }
        },
        {
          id: 'expand-marius',
          title: 'Expand Marius',
          actor: 'engine',
          data: {
            added: {
              nodes: [
                { id: 'Enjolras', type: 'character' },
                { id: 'Courfeyrac', type: 'character' },
                { id: 'Gavroche', type: 'character' },
                { id: 'Eponine', type: 'character' }
              ],
              edges: [
                { id: 'Enjolras__Marius', type: 'co-appears-with', source: 'Enjolras', target: 'Marius' },
                { id: 'Courfeyrac__Marius', type: 'co-appears-with', source: 'Courfeyrac', target: 'Marius' },
                { id: 'Gavroche__Marius', type: 'co-appears-with', source: 'Gavroche', target: 'Marius' },
                { id: 'Eponine__Marius', type: 'co-appears-with', source: 'Eponine', target: 'Marius' },
                { id: 'Courfeyrac__Enjolras', type: 'co-appears-with', source: 'Courfeyrac', target: 'Enjolras' },
                { id: 'Gavroche__Enjolras', type: 'co-appears-with', source: 'Gavroche', target: 'Enjolras' },
                { id: 'Eponine__Thenardier', type: 'co-appears-with', source: 'Eponine', target: 'Thenardier' }
              ]
            }
          },
          view: { focus: { ids: ['Marius', 'Enjolras', 'Courfeyrac', 'Gavroche', 'Eponine'] }, camera: 'focus' }
        },
        {
          id: 'relayout',
          title: 'Re-run the layout, fit everything',
          view: { focus: null, camera: 'all' },
          do: [{ command: 'layout.run' }]
        },
        {
          id: 'elk',
          title: 'Switch to a layered layout (ELK)',
          settings: { activeLayout: 'elk' },
          view: { camera: 'all' }
        }
      ]
    };
    await canvas.playbook.load(playbook);

    const gui = new GUI({ title: playbook.title, width: 320 });
    onStoryTeardown(() => gui.destroy());
    const readout = { step: `0 / ${playbook.steps.length}`, nodes: canvas.layers.get<GraphLayer>('graph')!.store.nodeCount(), error: '' };
    onStoryTeardown(
      canvas.playbook.subscribe(() => {
        const pb = canvas.playbook;
        readout.step = `${pb.index + 1} / ${pb.steps.length}${pb.current ? ` · ${pb.current.title}` : ''}`;
        readout.nodes = canvas.layers.get<GraphLayer>('graph')!.store.nodeCount();
      })
    );
    const report = (err: unknown): void => {
      readout.error = err instanceof Error ? err.message : String(err);
    };
    gui.add(readout, 'step').name('Step').disable().listen();
    gui.add(readout, 'nodes').name('Nodes').disable().listen();
    gui.add(readout, 'error').name('Error').disable().listen();
    gui.add({ previous: () => void canvas.playbook.previous().catch(report) }, 'previous').name('◀ Previous');
    gui.add({ next: () => void canvas.playbook.next().catch(report) }, 'next').name('Next ▶');
    gui.add({ undo: () => canvas.history.undo() }, 'undo').name('Undo (one history entry)');
  }
};
