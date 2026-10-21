/**
 * **Detail levels as config patches, on any board** — `useDetailTemplates`
 * outside the schema board. Three levels over a Les Misérables cast:
 *
 * | Level | The `*` type binds | How |
 * |---|---|---|
 * | Dots | the built-in `circle` | one binding, copied to every type |
 * | Cards | the built-in `idCard` (type · name · group) | one binding, copied to every type |
 * | Per type | `tag:<type>` | `structures.tag(name, node)` builds one freeform card per type |
 *
 * A level change writes the patch with `canvas.update` and re-runs ELK with the
 * camera following; selection and camera survive. `fitMaxZoom: 1` keeps a
 * small graph at its drawn size — a fit never zooms past 100 %. The same hook
 * drives `<SchemaBoard>`'s High · Medium · Low.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useState } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { ClickSelectBehaviour, DragNodeBehaviour, ElkLayout, GraphLayer } from '@invana/canvas-react';
import { GraphCanvasApp, ToolbarItems, useDetailTemplates, type DetailTemplates } from '@invana/canvas-ui';
import type { FreeformStructure, GraphCanvas, GraphData } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-ui/apps/DetailTemplates' };
export default meta;
type Story = StoryObj;

type Level = 'dots' | 'cards' | 'perType';

const CONFIG = {
  activeLayout: 'elk',
  layouts: { elk: { algorithm: 'layered', direction: 'RIGHT' } },
  layers: { graph: { nodeTypes: { '*': { structure: 'circle', styling: 'circle', bindings: { label: 'id' } } } } }
} as unknown as CanvasConfig;

const level = (binding: object, size: { width: number; height: number }) =>
  ({ layers: { graph: { nodeTypes: { '*': binding } } }, layouts: { elk: { defaultNodeSize: size } } }) as unknown as Partial<CanvasConfig>;

const DETAIL: DetailTemplates<Level> = {
  templates: {
    dots: level({ structure: 'circle', styling: 'circle', bindings: { label: 'id' } }, { width: 40, height: 40 }),
    cards: level({ structure: 'idCard', styling: 'idCard', bindings: { type: 'type', title: 'id', subtitle: 'data.group' } }, { width: 220, height: 96 }),
    perType: level({ structure: 'tag:*', styling: 'circle', bindings: {} }, { width: 160, height: 44 })
  },
  options: { dots: 'Dots', cards: 'Cards', perType: 'Per type' },
  initial: 'dots'
};

/** One card per type: the type's name in a pill. */
const tagCard = (name: string, type: string): FreeformStructure => ({
  name,
  kind: 'freeform',
  width: 160,
  height: 44,
  cornerRadius: 22,
  bgRole: 'cardBg',
  strokeRole: 'accent',
  strokeWidth: 1.5,
  elements: [
    { id: 'type', type: 'text', x: 14, y: 4, text: type, fontSize: 10, uppercase: true, colorRole: 'muted' },
    { id: 'name', type: 'text', x: 14, y: 18, bind: 'id', fontSize: 13, fontWeight: 700, colorRole: 'heading', maxWidth: 132 }
  ]
});

export const DetailTemplatesStory: Story = {
  name: 'DetailTemplates',
  render: function Render() {
    const data = useMemo<GraphData>(() => {
      const ids = new Set(['Valjean', 'Javert', 'Fantine', 'Cosette', 'Marius', 'Thenardier', 'Eponine', 'Gavroche']);
      return {
        nodes: lesMiserables.nodes.filter((n) => ids.has(n.id)),
        edges: lesMiserables.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
      };
    }, []);
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
    const structures = useMemo(() => ({ tag: (name: string, node: { type?: string }) => tagCard(name, node.type ?? '') }), []);
    const { level: current, setLevel, initialConfig } = useDetailTemplates({
      canvas,
      config: CONFIG,
      detail: DETAIL,
      data,
      layout: 'elk',
      fitMaxZoom: 1,
      structures
    });
    const onReady = useCallback((c: GraphCanvas | null) => setCanvas(c), []);
    return (
      <GraphCanvasApp
        data={data}
        config={initialConfig}
        onReady={onReady}
        bundle={false}
        header={{
          title: 'DetailTemplates',
          right: () => (
            <ToolbarItems
              orientation="horizontal"
              items={[{ type: 'select', key: 'detail', label: 'Detail', value: current, options: DETAIL.options, onChange: (v) => setLevel(v as Level) }]}
            />
          )
        }}
      >
        <GraphLayer id="graph" data={data} />
        <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
        <ClickSelectBehaviour id="click-select" targetLayerId="graph" />
        <ElkLayout id="elk" targetLayerId="graph" fitPadding={60} />
      </GraphCanvasApp>
    );
  }
};
