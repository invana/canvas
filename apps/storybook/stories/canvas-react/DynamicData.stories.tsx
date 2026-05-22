/**
 * Stability test — drives the `<GraphLayer>` `data` prop from React state
 * and switches the active dataset on demand (manual buttons + optional
 * auto-cycle). Exercises:
 *
 *   - `<GraphLayer>`'s reactive `data` prop calling `layer.setData(data)`
 *     when the referenced object changes
 *   - `<D3ForceLayout>` remounting via a changing `key` to reseed the
 *     simulation against the new node/edge set
 *   - `<Canvas>` lifecycle stability under repeated child reconciliation
 *     (no engine teardown — only the layout remounts)
 */

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  D3ForceLayout,
  DragPanBehaviour,
  GraphLayer,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { GraphData, GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-react/DynamicData' };
export default meta;
type Story = StoryObj;

const PALETTE = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;

function ring(n: number): GraphData {
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `n${i}`,
    data: { group: i % PALETTE.length },
  }));
  const edges = Array.from({ length: n }, (_, i) => ({
    id: `e${i}`,
    source: `n${i}`,
    target: `n${(i + 1) % n}`,
  }));
  return { nodes, edges };
}

function lattice(side: number): GraphData {
  const nodes = [] as GraphData['nodes'];
  const edges = [] as GraphData['edges'];
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const id = `n${x}-${y}`;
      nodes.push({ id, data: { group: (x + y) % PALETTE.length } });
      if (x > 0) edges.push({ id: `eh-${x}-${y}`, source: `n${x - 1}-${y}`, target: id });
      if (y > 0) edges.push({ id: `ev-${x}-${y}`, source: `n${x}-${y - 1}`, target: id });
    }
  }
  return { nodes, edges };
}

const DATASETS = {
  'ring-10': () => ring(10),
  'ring-40': () => ring(40),
  'lattice-6x6': () => lattice(6),
  'les-miserables': () => lesMiserables as GraphData,
} as const;

type DatasetName = keyof typeof DATASETS;
const NAMES = Object.keys(DATASETS) as DatasetName[];

function Demo() {
  const [name, setName] = useState<DatasetName>('ring-10');
  const [auto, setAuto] = useState(false);
  const [cycles, setCycles] = useState(0);

  const data = useMemo(() => DATASETS[name](), [name]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setName((prev) => {
        const next = NAMES[(NAMES.indexOf(prev) + 1) % NAMES.length]!;
        setCycles((c) => c + 1);
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <div style={containerStyle}>
      <div style={toolbarStyle}>
        {NAMES.map((k) => (
          <button
            key={k}
            onClick={() => setName(k)}
            style={buttonStyle(name === k)}
          >
            {k}
          </button>
        ))}
        <label style={autoLabelStyle}>
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />
          Auto-cycle (3s)
        </label>
        <span style={countStyle}>
          {data.nodes.length} nodes · {data.edges.length} edges · {cycles} switches
        </span>
      </div>
      <div style={canvasHostStyle}>
        <Canvas autoResize>
          <DragPanBehaviour />
          <WheelZoomBehaviour />
          <GraphLayer
            id="graph"
            data={data}
            node={{
              style: {
                shape: { kind: 'circle', radius: 6 },
                bgFill: (n: GraphNode) =>
                  PALETTE[(n.data as { group: number }).group % PALETTE.length]!,
              },
            }}
            edge={{ style: { strokeColor: 0xcbd5e1, strokeWidth: 0.6 } }}
          />
          <D3ForceLayout
            key={name}
            targetLayerId="graph"
            options={{ link: {}, charge: {}, center: { x: 0, y: 0 } }}
          />
        </Canvas>
      </div>
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
};
const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: '#1f2937',
  color: '#e5e7eb',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
};
const buttonStyle = (active: boolean): CSSProperties => ({
  background: active ? '#3b82f6' : '#374151',
  color: '#fff',
  border: 'none',
  padding: '6px 10px',
  borderRadius: 4,
  cursor: 'pointer',
});
const autoLabelStyle: CSSProperties = {
  marginLeft: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};
const countStyle: CSSProperties = { marginLeft: 'auto', opacity: 0.7 };
const canvasHostStyle: CSSProperties = { flex: 1, minHeight: 0 };

export const DynamicData: Story = {
  render: () => <Demo />,
};
