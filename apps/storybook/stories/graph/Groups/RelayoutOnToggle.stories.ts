import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  ThemeBehaviour,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Groups/RelayoutOnToggle' };
export default meta;
type Story = StoryObj;

/**
 * **Re-layout on toggle** — four group frames with edges crossing between
 * them, laid out by ELK (or d3-force, switch it in the GUI).
 *
 * Double-click a frame (or its `+` / `−`) and, with
 * `CollapseExpandBehaviour.relayoutOnToggle` on, the active layout re-runs:
 * the toggled frame **stays where you clicked it** and everything else glides
 * to close the gap it left (collapse) or make room for it (expand). The camera
 * never moves — the re-flow leaves it alone. A frame always re-opens where its
 * tab was, even after the layout changed while it was closed (collapse one,
 * switch the layout, then open it).
 *
 * Collapsed frames show their hidden-member count as a corner badge
 * (`collapsedCountDisplay: 'badge'`). Under d3-force, `separateGroups` keeps
 * the frames from overlapping each other — turn it off in the GUI to see them
 * pile up. Turn `relayoutOnToggle` off to compare with a plain toggle, where
 * only the frame changes and its neighbours stay put.
 */
export const RelayoutOnToggleStory: Story = {
  name: 'RelayoutOnToggle',
  render: () => createContainer({ id: 'graph-relayout-on-toggle' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { type: 'frame', id: 'ingest', data: { label: 'Ingest' } },
      { type: 'card', id: 'kafka', parentId: 'ingest' },
      { type: 'card', id: 'webhooks', parentId: 'ingest' },
      { type: 'card', id: 'batch', parentId: 'ingest' },

      { type: 'frame', id: 'process', data: { label: 'Process' } },
      { type: 'card', id: 'clean', parentId: 'process' },
      { type: 'card', id: 'enrich', parentId: 'process' },
      { type: 'card', id: 'dedupe', parentId: 'process' },

      { type: 'frame', id: 'store', data: { label: 'Store' } },
      { type: 'card', id: 'warehouse', parentId: 'store' },
      { type: 'card', id: 'lake', parentId: 'store' },

      { type: 'frame', id: 'serve', data: { label: 'Serve' } },
      { type: 'card', id: 'api', parentId: 'serve' },
      { type: 'card', id: 'dashboards', parentId: 'serve' },
      { type: 'card', id: 'alerts', parentId: 'serve' },

      // A loose card outside every frame.
      { type: 'card', id: 'audit' },
    ];

    const edges: GraphEdge[] = [
      { type: 'edge', id: 'kafka-clean', source: 'kafka', target: 'clean' },
      { type: 'edge', id: 'webhooks-clean', source: 'webhooks', target: 'clean' },
      { type: 'edge', id: 'batch-dedupe', source: 'batch', target: 'dedupe' },
      { type: 'edge', id: 'clean-enrich', source: 'clean', target: 'enrich' },
      { type: 'edge', id: 'dedupe-enrich', source: 'dedupe', target: 'enrich' },
      { type: 'edge', id: 'enrich-warehouse', source: 'enrich', target: 'warehouse' },
      { type: 'edge', id: 'enrich-lake', source: 'enrich', target: 'lake' },
      { type: 'edge', id: 'warehouse-api', source: 'warehouse', target: 'api' },
      { type: 'edge', id: 'warehouse-dashboards', source: 'warehouse', target: 'dashboards' },
      { type: 'edge', id: 'lake-alerts', source: 'lake', target: 'alerts' },
      { type: 'edge', id: 'api-audit', source: 'api', target: 'audit' },
      { type: 'edge', id: 'batch-audit', source: 'batch', target: 'audit' },
    ];

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-relayout-on-toggle')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph' }));
    canvas.behaviours.register(new CollapseExpandBehaviour({ id: 'collapse-expand', targetLayerId: 'graph' }));

    // Both layouts are registered; `activeLayout` picks the one that runs.
    const elk = new ElkLayout({ id: 'elk', targetLayerId: 'graph' });
    const force = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(elk);
    canvas.layouts.add(force);
    onStoryTeardown(() => elk.stop());
    onStoryTeardown(() => force.stop());

    // The whole visualisation as data. Two node types: `frame` (a group — its
    // styling carries `group`) and `card` (a member, label inside so a layout
    // measures it exactly — a label hanging outside a shape would make the
    // drawn frames bigger than the boxes the layout packed).
    const canvasOptions = {
      // Frames the graph after each ordinary layout run. A toggle's re-flow
      // carries `preserveCamera`, which this fitter skips.
      fitOnLoad: true,
      layers: {
        bg: { type: 'pattern', patternType: 'dots', size: 1.5, spacing: 24, alpha: 0.85 },
        graph: {
          nodeStructureTemplates: {
            frame: {
              name: 'frame',
              kind: 'simple',
              // Small declared base: auto-fit grows the frame around its members
              // while open; closed, this is the size it shrinks to.
              shape: { kind: 'rect', width: 110, height: 36, cornerRadius: 8 },
              slots: { label: true }
            },
            card: {
              name: 'card',
              kind: 'simple',
              shape: { kind: 'rect', width: 96, height: 30, cornerRadius: 6 },
              slots: { label: true }
            }
          },
          nodeStylingTemplates: {
            frame: {
              name: 'frame',
              group: {
                autoFit: true,
                padding: 20,
                headerHeight: 22,
                showToggle: true,
                showCollapsedCount: true,
                collapsedCountDisplay: 'badge'
              },
              strokeRole: 'divider',
              strokeWidth: 1,
              label: { fontSize: 11, fontWeight: 600, colorRole: 'heading', placement: 'inside-top-left' }
            },
            card: {
              name: 'card',
              fillRole: 'accent',
              label: { fontSize: 11, colorRole: 'cardBg', placement: 'center' }
            }
          },
          nodeTypes: {
            frame: { structure: 'frame', styling: 'frame', bindings: { label: 'data.label' } },
            card: { structure: 'card', styling: 'card', bindings: { label: 'id' } }
          }
        }
      },
      behaviours: {
        theme: { enabled: true, mode: 'document' },
        pan: { enabled: true },
        zoom: { enabled: true },
        drag: { enabled: true },
        'collapse-expand': { enabled: true, relayoutOnToggle: true }
      },
      layouts: {
        elk: { algorithm: 'layered', direction: 'RIGHT', nodeSpacing: 30, layerSpacing: 60, padding: 30 },
        force: {
          link: { distance: 90 },
          charge: { strength: -500 },
          collide: { radius: 56 },
          cluster: { strength: 0.5 },
          separateGroups: {} as { strength?: number; padding?: number } | undefined
        }
      },
      activeLayout: 'elk' as 'elk' | 'force'
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ── GUI — each control pushes its change through update() ──────────────
    // lil-gui binds to its own plain object: `init` hands the config to the
    // store, which freezes it, so the controls can't write into
    // `canvasOptions` itself.
    const gui = new GUI({ title: 'Re-layout on toggle' });
    onStoryTeardown(() => gui.destroy());
    const settings = {
      layout: canvasOptions.activeLayout,
      relayoutOnToggle: canvasOptions.behaviours['collapse-expand'].relayoutOnToggle,
      separateGroups: true,
      showToggle: canvasOptions.layers.graph.nodeStylingTemplates.frame.group.showToggle,
      collapsedCountDisplay: canvasOptions.layers.graph.nodeStylingTemplates.frame.group.collapsedCountDisplay as
        | 'center'
        | 'badge'
    };

    gui
      .add(settings, 'layout', ['elk', 'force'])
      .onChange((id: 'elk' | 'force') => canvas.update({ activeLayout: id }));
    gui
      .add(settings, 'relayoutOnToggle')
      .onChange((on: boolean) => canvas.update({ behaviours: { 'collapse-expand': { relayoutOnToggle: on } } }));
    gui
      .add(settings, 'separateGroups')
      .name('separateGroups (force)')
      .onChange((on: boolean) => canvas.update({ layouts: { force: { separateGroups: on ? {} : undefined } } }));
    // A styling template is replaced whole by an update, not merged — so the
    // two frame controls push the complete `frame` template with their field
    // changed.
    const pushFrameGroup = (): void => {
      const frame = canvasOptions.layers.graph.nodeStylingTemplates.frame;
      canvas.update({
        layers: {
          graph: {
            nodeStylingTemplates: {
              frame: {
                ...frame,
                group: {
                  ...frame.group,
                  showToggle: settings.showToggle,
                  collapsedCountDisplay: settings.collapsedCountDisplay
                }
              }
            }
          }
        }
      });
    };
    gui.add(settings, 'showToggle').name('showToggle (off = double-click only)').onChange(pushFrameGroup);
    gui.add(settings, 'collapsedCountDisplay', ['center', 'badge']).onChange(pushFrameGroup);
  }
};
