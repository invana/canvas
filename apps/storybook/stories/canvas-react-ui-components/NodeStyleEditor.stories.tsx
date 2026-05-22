/**
 * Demonstrates `<NodeStyleEditor>` from `@invana/canvas-react-ui-components`
 * — the design-kit-based style editor that commits via per-node
 * `store.updateNode` patches (the engine has no public layer-template
 * setter — see `feedback_graphlayer_no_template_setter`).
 *
 * Two stories cover the two host topologies the editor supports:
 *
 *   1. **InsideCanvas** — editor lives in a right-rail panel *inside* the
 *      `<Canvas>` subtree. It picks the target up automatically from the
 *      surrounding `CanvasContext`. Most common shape.
 *
 *   2. **TwoCanvasInspector** — two `<Canvas>` instances side-by-side with a
 *      single editor in a top bar that switches target via an explicit
 *      `canvas` prop. Demonstrates the multi-canvas case where the editor
 *      sits *outside* every canvas tree.
 *
 * The TwoCanvas story uses `useState<EngineCanvas | null>(null)` plus a
 * ref-callback rather than `useRef` so the editor re-renders once each
 * `<Canvas>` finishes initialising — `useRef.current` mutations don't
 * trigger React updates.
 */

import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Canvas as EngineCanvas } from '@invana/canvas';
import {
  Canvas,
  D3ForceLayout,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphLayer,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { NodeStyleEditor } from '@invana/canvas-react-ui-components';

const meta: Meta = { title: 'canvas-react-ui-components/NodeStyleEditor' };
export default meta;
type Story = StoryObj;

const GROUP_COLORS = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;

type LesMisNodeData = { group: number };

// ─── Story 1 — InsideCanvas ──────────────────────────────────────────────

function InsideCanvasDemo() {
  return (
    <div style={pageStyle}>
      <div style={canvasHostStyle}>
        <Canvas autoResize>
          <DragPanBehaviour />
          <WheelZoomBehaviour />
          <GraphLayer
            id="graph"
            data={lesMiserables}
            node={{
              style: {
                shape: { kind: 'circle', radius: 6 },
                bgFill: (n: GraphNode) =>
                  GROUP_COLORS[(n.data as LesMisNodeData).group % GROUP_COLORS.length]!,
              },
            }}
            edge={{ style: { strokeColor: 0xcbd5e1, strokeWidth: 0.5 } }}
          />
          <DragNodeBehaviour layerId="graph" />
          <D3ForceLayout
            targetLayerId="graph"
            options={{ link: {}, charge: {}, center: { x: 0, y: 0 } }}
          />
          {/*
            Editor lives inside the <Canvas> subtree, so it reads the engine
            from CanvasContext automatically.
          */}
          <SidePanel>
            <NodeStyleEditor layerId="graph" title="Node style" />
          </SidePanel>
        </Canvas>
      </div>
    </div>
  );
}

function SidePanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 320,
        height: '100%',
        background: 'var(--background, #fff)',
        color: 'var(--foreground, #111)',
        borderLeft: '1px solid var(--border, #e4e4e7)',
        overflow: 'auto',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
}

export const InsideCanvas: Story = {
  render: () => <InsideCanvasDemo />,
};

// ─── Story 2 — TwoCanvasInspector ────────────────────────────────────────

function TwoCanvasInspectorDemo() {
  // State-backed canvas handles — using useState (not useRef) so the editor
  // re-renders once each <Canvas> finishes its async init.
  const [canvasA, setCanvasA] = useState<EngineCanvas | null>(null);
  const [canvasB, setCanvasB] = useState<EngineCanvas | null>(null);
  const [active, setActive] = useState<'a' | 'b'>('a');

  const activeCanvas = active === 'a' ? canvasA : canvasB;

  return (
    <div style={pageStyle}>
      <div style={toolbarStyle}>
        <span style={{ fontWeight: 600 }}>Inspector targets:</span>
        <button onClick={() => setActive('a')} style={tabButtonStyle(active === 'a')}>
          Canvas A
        </button>
        <button onClick={() => setActive('b')} style={tabButtonStyle(active === 'b')}>
          Canvas B
        </button>
      </div>

      <div style={splitStyle}>
        <div style={paneStyle(active === 'a')}>
          <Canvas ref={setCanvasA} autoResize>
            <DragPanBehaviour />
            <WheelZoomBehaviour />
            <GraphLayer
              id="graph"
              data={lesMiserables}
              node={{
                style: {
                  shape: { kind: 'circle', radius: 6 },
                  bgFill: 0x3b82f6,
                },
              }}
              edge={{ style: { strokeColor: 0xcbd5e1, strokeWidth: 0.5 } }}
            />
            <D3ForceLayout
              targetLayerId="graph"
              options={{ link: {}, charge: {}, center: { x: 0, y: 0 } }}
            />
          </Canvas>
        </div>

        <div style={paneStyle(active === 'b')}>
          <Canvas ref={setCanvasB} autoResize>
            <DragPanBehaviour />
            <WheelZoomBehaviour />
            <GraphLayer
              id="graph"
              data={lesMiserables}
              node={{
                style: {
                  shape: { kind: 'rect', width: 12, height: 12 },
                  bgFill: 0xef4444,
                },
              }}
              edge={{ style: { strokeColor: 0xcbd5e1, strokeWidth: 0.5 } }}
            />
            <D3ForceLayout
              targetLayerId="graph"
              options={{ link: {}, charge: {}, center: { x: 0, y: 0 } }}
            />
          </Canvas>
        </div>

        <div style={inspectorStyle}>
          {/*
            Editor sits OUTSIDE every <Canvas> tree. It receives the active
            canvas instance via `canvas`. Key on the active id so internal
            state (snapshot, dirty buffer) re-seeds cleanly on swap.
          */}
          <NodeStyleEditor
            key={active}
            canvas={activeCanvas}
            layerId="graph"
            title={`Editing canvas ${active.toUpperCase()}`}
          />
        </div>
      </div>
    </div>
  );
}

export const TwoCanvasInspector: Story = {
  render: () => <TwoCanvasInspectorDemo />,
};

// ─── Shared inline styles ────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const canvasHostStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  position: 'relative',
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: '#1f2937',
  color: '#e5e7eb',
  fontSize: 13,
};

const tabButtonStyle = (active: boolean): CSSProperties => ({
  background: active ? '#3b82f6' : '#374151',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
});

const splitStyle: CSSProperties = {
  flex: 1,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 360px',
  minHeight: 0,
};

const paneStyle = (active: boolean): CSSProperties => ({
  minHeight: 0,
  position: 'relative',
  outline: active ? '2px solid #3b82f6' : '2px solid transparent',
  outlineOffset: -2,
});

const inspectorStyle: CSSProperties = {
  minHeight: 0,
  overflow: 'auto',
  background: 'var(--background, #fff)',
  color: 'var(--foreground, #111)',
  borderLeft: '1px solid var(--border, #e4e4e7)',
};
