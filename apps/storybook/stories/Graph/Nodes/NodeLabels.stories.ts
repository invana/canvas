import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelPlacement } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
  type NodeLabelHint,
  type NodeRenderHints,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Nodes/NodeLabels' };
export default meta;
type Story = StoryObj;

/**
 * `GraphLayer` rendering nodes with text labels via the `label` hint on
 * `NodeRenderHints`. Demonstrates the full surface of `ShapeLabelStyle`:
 *
 * - String shorthand (`label: 'Hello'`) for the simple case.
 * - Full payload with placement, pill background, wrap / maxLines / ellipsis,
 *   font controls, and a single html-text example with inline tag styles.
 * - Eight outside-side placements rendered in a ring around a hub so the
 *   anchor math is immediately readable.
 * - A separate row of rect nodes demonstrating each `inside-*` placement.
 *   These carry a containment contract: the label is constrained to the
 *   shape via the shrink → truncate → hide cascade. Toggle the "long label"
 *   and "tiny shape" GUI options to see the cascade in action.
 *
 * Drag any node to confirm labels track their host across moves; pan / zoom
 * to verify positioning stays correct under the camera.
 */
export const NodeLabels: Story = {
  render: () => createContainer({ id: 'graph-node-labels' }),

  play: async ({ canvasElement }) => {
    // Each entry is a self-contained node with its render hints (shape +
    // label) inlined. The label hint demonstrates a distinct facet of the
    // ShapeLabelStyle surface — placement, background, wrap, html-text.
    type Node = GraphNode<NodeRenderHints>;

    const ring: Array<{ id: string; placement: ShapeLabelPlacement }> = [
      { id: 'n-top',    placement: 'top' },
      { id: 'n-tr',     placement: 'top-right' },
      { id: 'n-right',  placement: 'right' },
      { id: 'n-br',     placement: 'bottom-right' },
      { id: 'n-bottom', placement: 'bottom' },
      { id: 'n-bl',     placement: 'bottom-left' },
      { id: 'n-left',   placement: 'left' },
      { id: 'n-tl',     placement: 'top-left' },
    ];

    const ringNodes: Node[] = ring.map((r, i) => {
      const theta = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 260;
      return {
        id: r.id,
        position: { x: Math.cos(theta) * radius, y: Math.sin(theta) * radius },
        data: {
          shape: 'circle',
          size: 32,
          fill: 0x4f9cf9,
          stroke: 0x1d4ed8,
          label: {
            content: {
              kind: 'text',
              text: r.placement,
              fontSize: 12,
              fontWeight: 600,
              fill: 0x0f172a,
            },
            background: {
              fill: 0xffffff,
              stroke: 0xcbd5e1,
              strokeWidth: 1,
              radius: 4,
              padding: [3, 6],
            },
            placement: r.placement,
            offset: { y: r.placement.startsWith('top') ? -4 : r.placement.startsWith('bottom') ? 4 : 0 },
          },
        },
      };
    });

    // Hub at the centre — wide rect with a centred-inside label demonstrating
    // that `placement: 'center'` subsumes the legacy inset text use case.
    const hub: Node = {
      id: 'hub',
      position: { x: 0, y: 0 },
      data: {
        shape: 'rect',
        size: 180,
        height: 56,
        cornerRadius: 10,
        fill: 0x0f172a,
        stroke: 0x0f172a,
        label: {
          content: {
            kind: 'text',
            text: 'Centered Inside',
            fontSize: 14,
            fontWeight: 700,
            fill: 0xffffff,
          },
          placement: 'center',
        },
      },
    };

    // Two extra nodes off to the side — one with wrap + ellipsis, one with
    // html-text demonstrating rich content.
    const wrappy: Node = {
      id: 'n-wrap',
      position: { x: 460, y: -160 },
      data: {
        shape: 'circle',
        size: 36,
        fill: 0xfb923c,
        stroke: 0xea580c,
        label: {
          content: {
            kind: 'text',
            text: 'A very long server description that needs to wrap and eventually ellipse out',
            fontSize: 12,
            fontWeight: 500,
            fill: 0x0f172a,
          },
          wrap: { maxWidth: 140, maxLines: 2, wordWrap: true, overflow: 'ellipsis' },
          background: { fill: 0xfff7ed, stroke: 0xfb923c, strokeWidth: 1, radius: 4, padding: [4, 8] },
          placement: 'bottom',
          offset: { y: 6 },
        },
      },
    };

    const rich: Node = {
      id: 'n-rich',
      position: { x: 460, y: 160 },
      data: {
        shape: 'circle',
        size: 36,
        fill: 0x10b981,
        stroke: 0x047857,
        label: {
          content: {
            kind: 'html-text',
            html: '<role>API</role> <name>users-service</name> <ver>v2.4.1</ver>',
            defaultFontFamily: 'sans-serif',
            defaultFontSize: 12,
            defaultFill: '#0f172a',
            width: 200,
            tagStyles: {
              role: { fontSize: 10, fill: '#10b981', fontWeight: 700 },
              name: { fontSize: 12, fill: '#0f172a', fontWeight: 600 },
              ver:  { fontSize: 10, fill: '#64748b', fontWeight: 400 },
            },
          },
          background: { fill: 0xecfdf5, stroke: 0x10b981, strokeWidth: 1, radius: 4, padding: [4, 8] },
          placement: 'bottom',
          offset: { y: 6 },
        },
      },
    };

    // String shorthand demo — `label: 'Quick label'` is the simplest case.
    const simple: Node = {
      id: 'n-simple',
      position: { x: -460, y: 0 },
      data: {
        shape: 'circle',
        size: 36,
        fill: 0x8b5cf6,
        stroke: 0x6d28d9,
        label: 'shorthand',
      },
    };

    // Inside-placement demo row — 9 rect nodes, each pinned to one of the
    // `inside-*` placements (4 sides + 4 corners + inside-center). Their
    // labels prove the containment contract: they shrink to fit and never
    // bleed past the rect bounds.
    const insidePlacements: ShapeLabelPlacement[] = [
      'inside-top-left',    'inside-top',    'inside-top-right',
      'inside-left',        'inside-center', 'inside-right',
      'inside-bottom-left', 'inside-bottom', 'inside-bottom-right',
    ];
    const insideRowY = 460;
    const insideRowSpacing = 160;
    const insideRowStartX = -((insidePlacements.length - 1) * insideRowSpacing) / 2;
    const insideNodes: Node[] = insidePlacements.map((p, i) => ({
      id: `inside-${p}`,
      position: { x: insideRowStartX + i * insideRowSpacing, y: insideRowY },
      data: {
        shape: 'rect',
        size: 130,
        height: 80,
        cornerRadius: 8,
        fill: 0xf1f5f9,
        stroke: 0x475569,
        label: {
          content: {
            kind: 'text',
            text: p,
            fontSize: 14,
            fontWeight: 600,
            fill: 0x0f172a,
          },
          placement: p,
        },
      },
    }));

    const nodes: Node[] = [hub, ...ringNodes, ...insideNodes, wrappy, rich, simple];

    // Edges fan from the hub to every ring node so the labels sit on top of
    // a visible relationship.
    const edges: GraphEdge[] = ring.map((r) => ({
      id: `hub->${r.id}`,
      source: 'hub',
      target: r.id,
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-labels')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: { edgeDefaults: { stroke: 0xcbd5e1, strokeWidth: 1, arrow: false } },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);

    // GUI: a single picked node exposes its label fields so the viewer can
    // sweep through placements, background, and wrap live. All 18 placement
    // values are exposed; pick an inside-* one and toggle `longLabel` /
    // `tinyShape` to see the shrink → truncate → hide cascade kick in.
    const ALL_PLACEMENTS: ShapeLabelPlacement[] = [
      // outside sides + corners
      'top', 'top-right', 'right', 'bottom-right',
      'bottom', 'bottom-left', 'left', 'top-left',
      // anchor-only centre (may overflow)
      'center',
      // inside sides
      'inside-top', 'inside-right', 'inside-bottom', 'inside-left',
      // inside corners
      'inside-top-left', 'inside-top-right', 'inside-bottom-left', 'inside-bottom-right',
      // inside centre (containment contract)
      'inside-center',
    ];
    const LONG_LABEL = 'A very long descriptive label that will not fit naturally';

    const allPickableIds = [
      ...ring.map((r) => r.id),
      'hub',
      ...insideNodes.map((n) => n.id),
    ];

    const settings = {
      pickedNode: 'inside-inside-center',
      text: 'inside-center',
      placement: 'inside-center' as ShapeLabelPlacement,
      longLabel: false,
      tinyShape: false,
      background: false,
      fontSize: 14,
      fontWeight: 600,
      minFontSize: 9,
      maxWidth: 0,
      maxHeight: 0,
      maxLines: 1,
    };

    const applyToPicked = (): void => {
      const node = graph.store.getNode(settings.pickedNode);
      if (!node) return;
      const wrap = settings.maxWidth > 0 || settings.maxHeight > 0 || settings.maxLines > 1
        ? {
            ...(settings.maxWidth > 0 ? { maxWidth: settings.maxWidth, wordWrap: true } : {}),
            ...(settings.maxHeight > 0 ? { maxHeight: settings.maxHeight } : {}),
            maxLines: settings.maxLines,
            overflow: 'ellipsis' as const,
          }
        : undefined;
      const label: NodeLabelHint = {
        content: {
          kind: 'text',
          text: settings.longLabel ? LONG_LABEL : settings.text,
          fontSize: settings.fontSize,
          fontWeight: settings.fontWeight,
          fill: 0x0f172a,
        },
        background: settings.background ? {
          fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [3, 6],
        } : undefined,
        wrap,
        placement: settings.placement,
        minFontSize: settings.minFontSize,
      };
      // Tiny-shape toggle shrinks the picked node so the inside-fit cascade
      // visibly kicks in. Only affects rect-shaped nodes (the inside row);
      // the ring of circles uses `size` only.
      const prevData = node.data as NodeRenderHints;
      const sizeOverride = settings.tinyShape
        ? { size: 60, height: 30 }
        : prevData.shape === 'rect'
          ? { size: 130, height: 80 }
          : { size: prevData.size };
      graph.store.updateNode(settings.pickedNode, {
        data: { ...prevData, ...sizeOverride, label },
      });
    };

    const gui = new GUI({ title: 'Node Label' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'pickedNode', allPickableIds).onChange(applyToPicked);
    gui.add(settings, 'text').onChange(applyToPicked);
    gui.add(settings, 'placement', ALL_PLACEMENTS).onChange(applyToPicked);
    gui.add(settings, 'longLabel').name('long label').onChange(applyToPicked);
    gui.add(settings, 'tinyShape').name('tiny shape').onChange(applyToPicked);
    gui.add(settings, 'background').onChange(applyToPicked);
    gui.add(settings, 'fontSize', 8, 24, 1).onChange(applyToPicked);
    gui.add(settings, 'fontWeight', { regular: 400, semibold: 600, bold: 700 }).onChange(applyToPicked);
    gui.add(settings, 'minFontSize', 6, 16, 1).name('minFontSize (inside-*)').onChange(applyToPicked);
    const wr = gui.addFolder('wrap');
    wr.add(settings, 'maxWidth', 0, 240, 10).name('maxWidth (0=off)').onChange(applyToPicked);
    wr.add(settings, 'maxHeight', 0, 200, 10).name('maxHeight (0=off)').onChange(applyToPicked);
    wr.add(settings, 'maxLines', 1, 4, 1).onChange(applyToPicked);
  },
};
