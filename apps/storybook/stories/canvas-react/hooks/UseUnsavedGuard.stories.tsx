/**
 * **`useUnsavedGuard` — leaving with unsaved changes asks first.** While the
 * `UnsavedChangesBehaviour` counts a change, the browser's own *Leave site?*
 * prompt guards the page; unsaved changes live in the page and do not survive
 * a reload.
 *
 * | Do | What happens |
 * |---|---|
 * | *Rename Valjean* | one unsaved change — the count goes up |
 * | *Reload* | the browser asks before leaving |
 * | *Mark saved* | the count is 0; *Reload* leaves without asking |
 * | *Guard off* | `enabled: false` — reload leaves even with changes |
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useState } from 'react';
import { UnsavedChangesBehaviour, useUnsavedChanges, useUnsavedGuard } from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import type { GraphCanvas, GraphLayer } from '@invana/graph';
import { Button, Eyebrow, PanelBox } from '@invana/ui';
import { valjeanScenes } from '../../canvas-ui/apps/GraphBoard/data';

const meta: Meta = { title: 'canvas-react/hooks/UseUnsavedGuard' };
export default meta;
type Story = StoryObj;

export const UseUnsavedGuardStory: Story = {
  name: 'UseUnsavedGuard',
  render: function Render() {
    const data = useMemo(valjeanScenes, []);
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
    const [guard, setGuard] = useState(true);
    const onReady = useCallback((c: GraphCanvas | null) => setCanvas(c), []);
    return (
      <GraphCanvasApp
        data={data}
        config={{ layoutPreset: { id: 'network' } }}
        onReady={onReady}
        header={{ title: 'UseUnsavedGuard' }}
        right={{ content: canvas ? <Controls canvas={canvas} guard={guard} onGuard={setGuard} /> : null, defaultSize: '300px' }}
      >
        <UnsavedChangesBehaviour />
      </GraphCanvasApp>
    );
  }
};

function Controls({ canvas, guard, onGuard }: { canvas: GraphCanvas; guard: boolean; onGuard: (on: boolean) => void }) {
  useUnsavedGuard({ enabled: guard }, canvas);
  const { count, markSaved } = useUnsavedChanges('unsaved-changes', canvas);
  const rename = () => {
    const store = canvas.layers.get<GraphLayer>('graph')?.store;
    const n = store?.getNode('Valjean');
    store?.updateNode('Valjean', { data: { ...(n?.data as object), alias: `Madeleine ${Date.now() % 100}` } });
  };
  return (
    <PanelBox title="Leaving">
      <Eyebrow>{`${count} unsaved · guard ${guard ? 'on' : 'off'}`}</Eyebrow>
      <Button onClick={rename}>Rename Valjean</Button>
      <Button variant="outline" onClick={markSaved}>
        Mark saved
      </Button>
      <Button variant="outline" onClick={() => onGuard(!guard)}>
        {guard ? 'Guard off' : 'Guard on'}
      </Button>
      <Button variant="ghost" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </PanelBox>
  );
}
