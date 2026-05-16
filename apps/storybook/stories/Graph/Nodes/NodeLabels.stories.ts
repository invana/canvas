import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelPlacement, ShapeLabelStyle } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
  type NodeStyle,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Nodes/NodeLabels' };
export default meta;
type Story = StoryObj;

/**
 * `GraphLayer` rendering nodes with text labels via the v3 `NodeData` shape.
 *
 * Demonstrates two label paths on `NodeStyle`:
 * - **Flat fields** (`labelText`, `labelColor`, `labelFontSize`,
 *   `labelPlacement`, `labelBackground*`, etc.) for the common case.
 * - **`labelStyle` escape hatch** for advanced cases the flat fields don't
 *   cover (wrap, maxLines / ellipsis, html-text). Pass a full
 *   `ShapeLabelStyle` payload and the adapter uses it verbatim.
 *
 * - String shorthand replaced by `labelText: 'Hello'`.
 * - Eight outside-side placements rendered in a ring around a hub.
 * - A separate row of rect nodes demonstrating each `inside-*` placement
 *   with the shrink → truncate → hide cascade.
 *
 * Drag any node to confirm labels track their host across moves; pan / zoom
 * to verify positioning stays correct under the camera.
 */
export const NodeLabels: Story = {
  render: () => createContainer({ id: 'graph-node-labels' }),

  play: async ({ canvasElement }) => {
    type Node = NodeData;

    // 8-node ring at radius 260, polar angles −π/2, −π/4, 0, π/4, π/2, 3π/4,
    // π, 5π/4 (i.e. top, top-right, right, bottom-right, bottom, bottom-left,
    // left, top-left). The shared circle / fill / stroke / font lives on the
    // layer's `node.style` template; each node carries only its per-instance
    // difference (position, labelText, placement, offset, pill background).
    const ringNodes: Node[] = [
      {
        id: 'n-top',
        position: { x: 0, y: -260 },
        style: {
          labelText: 'top', labelPlacement: 'top', labelOffsetY: -4,
          labelBackgroundFill: 0xffffff, labelBackgroundStrokeColor: 0xcbd5e1,
          labelBackgroundStrokeWidth: 1, labelBackgroundCornerRadius: 4, labelBackgroundPadding: 4,
        },
      },
      {
        id: 'n-tr',
        position: { x: 184, y: -184 },
        style: {
          labelText: 'top-right', labelPlacement: 'top-right', labelOffsetY: -4,
          labelBackgroundFill: 0xffffff, labelBackgroundStrokeColor: 0xcbd5e1,
          labelBackgroundStrokeWidth: 1, labelBackgroundCornerRadius: 4, labelBackgroundPadding: 4,
        },
      },
      {
        id: 'n-right',
        position: { x: 260, y: 0 },
        style: {
          labelText: 'right', labelPlacement: 'right', labelOffsetY: 0,
          labelBackgroundFill: 0xffffff, labelBackgroundStrokeColor: 0xcbd5e1,
          labelBackgroundStrokeWidth: 1, labelBackgroundCornerRadius: 4, labelBackgroundPadding: 4,
        },
      },
      {
        id: 'n-br',
        position: { x: 184, y: 184 },
        style: {
          labelText: 'bottom-right', labelPlacement: 'bottom-right', labelOffsetY: 4,
          labelBackgroundFill: 0xffffff, labelBackgroundStrokeColor: 0xcbd5e1,
          labelBackgroundStrokeWidth: 1, labelBackgroundCornerRadius: 4, labelBackgroundPadding: 4,
        },
      },
      {
        id: 'n-bottom',
        position: { x: 0, y: 260 },
        style: {
          labelText: 'bottom', labelPlacement: 'bottom', labelOffsetY: 4,
          labelBackgroundFill: 0xffffff, labelBackgroundStrokeColor: 0xcbd5e1,
          labelBackgroundStrokeWidth: 1, labelBackgroundCornerRadius: 4, labelBackgroundPadding: 4,
        },
      },
      {
        id: 'n-bl',
        position: { x: -184, y: 184 },
        style: {
          labelText: 'bottom-left', labelPlacement: 'bottom-left', labelOffsetY: 4,
          labelBackgroundFill: 0xffffff, labelBackgroundStrokeColor: 0xcbd5e1,
          labelBackgroundStrokeWidth: 1, labelBackgroundCornerRadius: 4, labelBackgroundPadding: 4,
        },
      },
      {
        id: 'n-left',
        position: { x: -260, y: 0 },
        style: {
          labelText: 'left', labelPlacement: 'left', labelOffsetY: 0,
          labelBackgroundFill: 0xffffff, labelBackgroundStrokeColor: 0xcbd5e1,
          labelBackgroundStrokeWidth: 1, labelBackgroundCornerRadius: 4, labelBackgroundPadding: 4,
        },
      },
      {
        id: 'n-tl',
        position: { x: -184, y: -184 },
        style: {
          labelText: 'top-left', labelPlacement: 'top-left', labelOffsetY: -4,
          labelBackgroundFill: 0xffffff, labelBackgroundStrokeColor: 0xcbd5e1,
          labelBackgroundStrokeWidth: 1, labelBackgroundCornerRadius: 4, labelBackgroundPadding: 4,
        },
      },
    ];

    // Hub at the centre — wide rect with a centred-inside label demonstrating
    // that `placement: 'center'` subsumes the legacy inset text use case.
    const hub: Node = {
      id: 'hub',
      position: { x: 0, y: 0 },
      style: {
        shape: { kind: 'rect', width: 180, height: 56, cornerRadius: 10 },
        bgFill: 0x0f172a,
        bgStrokeColor: 0x0f172a,
        labelText: 'Centered Inside',
        labelFontSize: 14,
        labelFontWeight: 700,
        labelColor: 0xffffff,
        labelPlacement: 'center',
      },
    };

    // Two extra nodes off to the side — one with wrap + ellipsis, one with
    // html-text. Both use the `labelStyle` escape hatch because flat fields
    // don't cover wrap config or html-text content kind.
    const wrappy: Node = {
      id: 'n-wrap',
      position: { x: 460, y: -160 },
      style: {
        shape: { kind: 'circle', radius: 18 },
        bgFill: 0xfb923c,
        bgStrokeColor: 0xea580c,
        labelStyle: {
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
      style: {
        shape: { kind: 'circle', radius: 18 },
        bgFill: 0x10b981,
        bgStrokeColor: 0x047857,
        labelStyle: {
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

    // Simple flat-field label — the simplest case.
    const simple: Node = {
      id: 'n-simple',
      position: { x: -460, y: 0 },
      style: {
        shape: { kind: 'circle', radius: 18 },
        bgFill: 0x8b5cf6,
        bgStrokeColor: 0x6d28d9,
        labelText: 'shorthand',
        labelPlacement: 'bottom',
        labelFontSize: 12,
        labelOffsetY: 4,
      },
    };

    // Inside-placement demo row — 9 rect nodes at y=460, x from -640 to +640
    // in 160-pixel steps, each pinned to one of the 9 `inside-*` placements
    // (3×3: corners + sides + center). The shrink → truncate → hide cascade
    // is a wrap/fit feature; we use `labelStyle` so the `minFontSize` knob
    // in the GUI can drive the cascade.
    const insideNodes: Node[] = [
      {
        id: 'inside-inside-top-left',
        position: { x: -640, y: 460 },
        style: {
          shape: { kind: 'rect', width: 130, height: 80, cornerRadius: 8 },
          bgFill: 0xf1f5f9, bgStrokeColor: 0x475569,
          labelStyle: {
            content: { kind: 'text', text: 'inside-top-left', fontSize: 14, fontWeight: 600, fill: 0x0f172a },
            placement: 'inside-top-left',
          },
        },
      },
      {
        id: 'inside-inside-top',
        position: { x: -480, y: 460 },
        style: {
          shape: { kind: 'rect', width: 130, height: 80, cornerRadius: 8 },
          bgFill: 0xf1f5f9, bgStrokeColor: 0x475569,
          labelStyle: {
            content: { kind: 'text', text: 'inside-top', fontSize: 14, fontWeight: 600, fill: 0x0f172a },
            placement: 'inside-top',
          },
        },
      },
      {
        id: 'inside-inside-top-right',
        position: { x: -320, y: 460 },
        style: {
          shape: { kind: 'rect', width: 130, height: 80, cornerRadius: 8 },
          bgFill: 0xf1f5f9, bgStrokeColor: 0x475569,
          labelStyle: {
            content: { kind: 'text', text: 'inside-top-right', fontSize: 14, fontWeight: 600, fill: 0x0f172a },
            placement: 'inside-top-right',
          },
        },
      },
      {
        id: 'inside-inside-left',
        position: { x: -160, y: 460 },
        style: {
          shape: { kind: 'rect', width: 130, height: 80, cornerRadius: 8 },
          bgFill: 0xf1f5f9, bgStrokeColor: 0x475569,
          labelStyle: {
            content: { kind: 'text', text: 'inside-left', fontSize: 14, fontWeight: 600, fill: 0x0f172a },
            placement: 'inside-left',
          },
        },
      },
      {
        id: 'inside-inside-center',
        position: { x: 0, y: 460 },
        style: {
          shape: { kind: 'rect', width: 130, height: 80, cornerRadius: 8 },
          bgFill: 0xf1f5f9, bgStrokeColor: 0x475569,
          labelStyle: {
            content: { kind: 'text', text: 'inside-center', fontSize: 14, fontWeight: 600, fill: 0x0f172a },
            placement: 'inside-center',
          },
        },
      },
      {
        id: 'inside-inside-right',
        position: { x: 160, y: 460 },
        style: {
          shape: { kind: 'rect', width: 130, height: 80, cornerRadius: 8 },
          bgFill: 0xf1f5f9, bgStrokeColor: 0x475569,
          labelStyle: {
            content: { kind: 'text', text: 'inside-right', fontSize: 14, fontWeight: 600, fill: 0x0f172a },
            placement: 'inside-right',
          },
        },
      },
      {
        id: 'inside-inside-bottom-left',
        position: { x: 320, y: 460 },
        style: {
          shape: { kind: 'rect', width: 130, height: 80, cornerRadius: 8 },
          bgFill: 0xf1f5f9, bgStrokeColor: 0x475569,
          labelStyle: {
            content: { kind: 'text', text: 'inside-bottom-left', fontSize: 14, fontWeight: 600, fill: 0x0f172a },
            placement: 'inside-bottom-left',
          },
        },
      },
      {
        id: 'inside-inside-bottom',
        position: { x: 480, y: 460 },
        style: {
          shape: { kind: 'rect', width: 130, height: 80, cornerRadius: 8 },
          bgFill: 0xf1f5f9, bgStrokeColor: 0x475569,
          labelStyle: {
            content: { kind: 'text', text: 'inside-bottom', fontSize: 14, fontWeight: 600, fill: 0x0f172a },
            placement: 'inside-bottom',
          },
        },
      },
      {
        id: 'inside-inside-bottom-right',
        position: { x: 640, y: 460 },
        style: {
          shape: { kind: 'rect', width: 130, height: 80, cornerRadius: 8 },
          bgFill: 0xf1f5f9, bgStrokeColor: 0x475569,
          labelStyle: {
            content: { kind: 'text', text: 'inside-bottom-right', fontSize: 14, fontWeight: 600, fill: 0x0f172a },
            placement: 'inside-bottom-right',
          },
        },
      },
    ];

    const nodes: Node[] = [hub, ...ringNodes, ...insideNodes, wrappy, rich, simple];

    // Edges fan from the hub to every ring node so the labels sit on top of
    // a visible relationship. Hardcoded literal list — one per ring node.
    const edges: EdgeData[] = [
      { id: 'hub->n-top',    source: 'hub', target: 'n-top' },
      { id: 'hub->n-tr',     source: 'hub', target: 'n-tr' },
      { id: 'hub->n-right',  source: 'hub', target: 'n-right' },
      { id: 'hub->n-br',     source: 'hub', target: 'n-br' },
      { id: 'hub->n-bottom', source: 'hub', target: 'n-bottom' },
      { id: 'hub->n-bl',     source: 'hub', target: 'n-bl' },
      { id: 'hub->n-left',   source: 'hub', target: 'n-left' },
      { id: 'hub->n-tl',     source: 'hub', target: 'n-tl' },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-labels')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        // Layer-wide node template — every node renders against these unless
        // it overrides a field in its own `style`. Ring nodes only declare
        // their per-instance differences (position, labelText, placement).
        // Hub / inside / wrap / rich / simple override `shape` and / or
        // bg colours.
        node: {
          style: {
            shape: { kind: 'circle', radius: 16 },
            bgFill: 0x4f9cf9,
            bgStrokeColor: 0x1d4ed8,
            labelFontSize: 12,
            labelFontWeight: 600,
            labelColor: 0x0f172a,
            labelBackgroundFill: 0xffffff,
            labelBackgroundStrokeColor: 0xcbd5e1,
            labelBackgroundStrokeWidth: 1,
            labelBackgroundCornerRadius: 4,
            labelBackgroundPadding: 4,
          },
        },
        edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },
      },
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
      'n-top', 'n-tr', 'n-right', 'n-br',
      'n-bottom', 'n-bl', 'n-left', 'n-tl',
      'hub',
      'inside-inside-top-left', 'inside-inside-top', 'inside-inside-top-right',
      'inside-inside-left', 'inside-inside-center', 'inside-inside-right',
      'inside-inside-bottom-left', 'inside-inside-bottom', 'inside-inside-bottom-right',
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
      const wrap =
        settings.maxWidth > 0 || settings.maxHeight > 0 || settings.maxLines > 1
          ? {
              ...(settings.maxWidth > 0 ? { maxWidth: settings.maxWidth, wordWrap: true } : {}),
              ...(settings.maxHeight > 0 ? { maxHeight: settings.maxHeight } : {}),
              maxLines: settings.maxLines,
              overflow: 'ellipsis' as const,
            }
          : undefined;
      const labelStyle: ShapeLabelStyle = {
        content: {
          kind: 'text',
          text: settings.longLabel ? LONG_LABEL : settings.text,
          fontSize: settings.fontSize,
          fontWeight: settings.fontWeight,
          fill: 0x0f172a,
        },
        background: settings.background
          ? { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [3, 6] }
          : undefined,
        wrap,
        placement: settings.placement,
        minFontSize: settings.minFontSize,
      };
      // Tiny-shape toggle shrinks the picked node so the inside-fit cascade
      // visibly kicks in. Only affects rect-shaped nodes (the inside row);
      // the ring of circles uses circle radius only.
      const prevStyle = (node.style as NodeStyle | undefined) ?? {};
      const prevShape = prevStyle.shape;
      const nextShape =
        settings.tinyShape && prevShape?.kind === 'rect'
          ? { ...prevShape, width: 60, height: 30 }
          : prevShape?.kind === 'rect'
            ? { ...prevShape, width: 130, height: 80 }
            : prevShape;
      const nextStyle: NodeStyle = {
        ...prevStyle,
        shape: nextShape,
        labelStyle,
      };
      graph.store.updateNode(settings.pickedNode, { style: nextStyle });
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
