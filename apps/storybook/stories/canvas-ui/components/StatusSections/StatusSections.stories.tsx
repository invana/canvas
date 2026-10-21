/**
 * **A board's status sections, laid into a host's footer** — on Flare's
 * imports, dense enough to thin:
 *
 *   `flare.vis · module` │ About 1 in 10 relationships drawn · 3 selected  32%  WebGL · 60 fps
 *
 * | Section | Shows |
 * |---|---|
 * | `MessageStatus` | what the pointer is over (`type · label`), else the canvas's latest message |
 * | `ViewStatus` | thinned edges while zoomed out, the selection, the zoom |
 * | `RendererStatus` | the backend and its median frame rate, polled once a second |
 *
 * Hover a node, select a few, zoom in past 50 % and the thinning note goes.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useState } from 'react';
import { GraphCanvasApp, MessageStatus, RendererStatus, ViewStatus } from '@invana/canvas-ui';
import type { GraphCanvas } from '@invana/graph';
import { flareImports } from '../../apps/GraphBoard/data';

const meta: Meta = { title: 'canvas-ui/components/StatusSections' };
export default meta;
type Story = StoryObj;

export const StatusSectionsStory: Story = {
  name: 'StatusSections',
  render: function Render() {
    const data = useMemo(flareImports, []);
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
    const onReady = useCallback((c: GraphCanvas | null) => setCanvas(c), []);
    return (
      <GraphCanvasApp
        data={data}
        config={{ layoutPreset: { id: 'network' } }}
        onReady={onReady}
        preference="webgl"
        header={{ title: 'StatusSections' }}
        footer={{
          left: <MessageStatus canvas={canvas} />,
          right: (
            <>
              <ViewStatus canvas={canvas} />
              <RendererStatus canvas={canvas} backend="webgl" />
            </>
          )
        }}
      />
    );
  }
};
