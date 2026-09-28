import { useRef } from 'react';
import {
  GraphCanvas,
  ControlPanel,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
  ClickSelectBehaviour,
  CreateNodeBehaviour,
  DrawEdgeBehaviour,
  EraseBehaviour,
  GraphToolProvider,
  GraphClipboardProvider,
  useTool,
  type GraphLayerProps
} from '@invana/canvas-react';
import { ControlPanels, MODELLER_CONTROL_ITEMS } from '@invana/canvas-ui';
import type { ControlItemSpec } from '@invana/canvas';
import type { GraphData, NodeShapeOptions } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/ControlPanel/GraphCanvas/Modeller` — **the modeller preset.**
 * `MODELLER_CONTROL_ITEMS` (top) is tool · shape · undo / redo · delete
 * selection · clear · fit. It's the saveable counterpart of `ModellerToolbar`.
 *
 * - **Tool** (select / add / connect / delete) is `tool.active`. The
 *   `<GraphCanvas>` root registers it because a `<GraphToolProvider>` wraps it.
 *   Each drawing behaviour below is enabled only for its tool. Esc returns to
 *   Select.
 * - **Shape** is `tool.nodeKind`, enabled only while adding. The preset item is
 *   copied with `args.kinds` so it lists this story's shapes.
 * - **Undo / redo** are the canvas's own history — every drawing edit is
 *   recorded — and **delete** / **clear** come from `<GraphClipboardProvider>`,
 *   mounted inside the root.
 */
const meta: Meta = { title: 'canvas-react/ControlPanel/GraphCanvas/Modeller' };
export default meta;
type Story = StoryObj;

// No layout runs, so every node carries its position.
const DATA: GraphData = {
  nodes: [
    { id: 'start', type: 'Step', position: { x: -160, y: 0 } },
    { id: 'check', type: 'Step', position: { x: 0, y: 0 } },
    { id: 'end', type: 'Step', position: { x: 160, y: 0 } },
  ],
  edges: [
    { id: 'e-1', source: 'start', target: 'check', type: 'NEXT' },
    { id: 'e-2', source: 'check', target: 'end', type: 'NEXT' },
  ]
};

const NODE: GraphLayerProps['node'] = { style: { shape: { kind: 'circle', radius: 22 }, bgFill: 0xa78bfa } };

/** The shapes the Add tool drops, by node kind. */
const SHAPES: Record<string, NodeShapeOptions> = {
  circle: { kind: 'circle', radius: 22 },
  rect: { kind: 'rect', width: 52, height: 36, cornerRadius: 6 },
  diamond: { kind: 'regular-polygon', sides: 4, radius: 26 }
};

/** The preset, with the shape picker listing {@link SHAPES}. */
const ITEMS: ControlItemSpec[] = MODELLER_CONTROL_ITEMS.map((item) =>
  item.key === 'node-kind' && item.type === 'choice'
    ? { ...item, args: { kinds: { circle: 'Circle', rect: 'Rectangle', diamond: 'Diamond' } } }
    : item,
);

/** The drawing behaviours, each enabled only while its tool is active. */
function DrawingTools() {
  const { tool, nodeKind } = useTool();
  // The Add tool's factory is captured once; read the live shape through a ref.
  const kindRef = useRef(nodeKind);
  kindRef.current = nodeKind;
  const seqRef = useRef(0);

  return (
    <>
      <DragNodeBehaviour id="drag-node" targetLayerId="graph" enabled={tool === 'select'} />
      <ClickSelectBehaviour targetLayerId="graph" enabled={tool === 'select'} />
      <CreateNodeBehaviour
        targetLayerId="graph"
        enabled={tool === 'add'}
        createNode={(world) => {
          const n = (seqRef.current += 1);
          return {
            type: 'node',
            id: `n-${n}-${Date.now().toString(36)}`,
            position: world,
            style: { shape: SHAPES[kindRef.current] ?? SHAPES.circle, labelText: String(n) }
          };
        }}
      />
      <DrawEdgeBehaviour targetLayerId="graph" enabled={tool === 'connect'} />
      <EraseBehaviour targetLayerId="graph" enabled={tool === 'delete'} />
    </>
  );
}

export const Modeller: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <GraphToolProvider defaultNodeKind="circle">
        <GraphCanvas autoResize>
          <BackgroundLayer id="background" type="pattern" patternType="dots" />
          <ThemeBehaviour id="theme" mode="document" />
          <GraphLayer id="graph" data={DATA} node={NODE} />
          <DragPanBehaviour id="pan" />
          <WheelZoomBehaviour id="zoom" />

          <GraphClipboardProvider>
            <DrawingTools />
            <ControlPanel id="modeller" position="top" items={ITEMS} />
          </GraphClipboardProvider>

          <ControlPanels />
        </GraphCanvas>
      </GraphToolProvider>
    </div>
  )
};
