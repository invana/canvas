/**
 * **`<SchemaBoard>` with one schema, unframed and controlled.** No frame nodes:
 * the types sit on the board directly, and a card's subtitle is left out
 * because no type has a `frame`. The selection is the host's — `selected` in,
 * `onSelect` out — shown in the line under the board; click a type or an edge,
 * or the empty board to clear it.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { SchemaBoard, type SchemaBoardSelection } from '@invana/canvas-ui';
import { Eyebrow } from '@invana/ui';
import { oneSchema } from './data';

const meta: Meta = { title: 'canvas-ui/apps/SchemaBoard/SchemaBoardUnframed' };
export default meta;
type Story = StoryObj;

export const SchemaBoardUnframedStory: Story = {
  name: 'SchemaBoardUnframed',
  render: function Render() {
    const data = useMemo(() => oneSchema(), []);
    const [selected, setSelected] = useState<SchemaBoardSelection>(null);
    return (
      <div className="flex h-screen flex-col">
        <div className="min-h-0 flex-1">
          <SchemaBoard data={data} title="NewsArticles" selected={selected} onSelect={setSelected} />
        </div>
        <Eyebrow>{selected ? `selected ${selected.kind} · ${selected.id}` : 'nothing selected'}</Eyebrow>
      </div>
    );
  }
};
