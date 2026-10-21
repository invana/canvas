/**
 * **`<SchemaBoard>` with connect — the host vetoes, the board asks.** The link
 * tool in the header arms a drag from one type onto another; holding **Shift**
 * does the same while it is held. The board never draws the edge: it hands
 * both ends to `onConnect`.
 *
 * | Drag | Host answers | Board shows |
 * |---|---|---|
 * | onto a type in the same frame | a refusal | the refusal in the message line |
 * | onto a type in another frame | `null` — accepted | the host's card, docked on the right |
 *
 * The card here only names the pair; *Close* clears it, and closing the dock
 * from its toggle does too (`onClosePanel`).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { SchemaBoard } from '@invana/canvas-ui';
import { Button, PanelBox, PropertyList, PropertyRow } from '@invana/ui';
import { airwaysSchema, frameOf } from './data';

const meta: Meta = { title: 'canvas-ui/apps/SchemaBoard/SchemaBoardConnect' };
export default meta;
type Story = StoryObj;

export const SchemaBoardConnectStory: Story = {
  name: 'SchemaBoardConnect',
  render: function Render() {
    const data = useMemo(airwaysSchema, []);
    const [pair, setPair] = useState<{ source: string; target: string } | null>(null);
    const panel = pair ? (
      <PanelBox title="Link two types">
        <PropertyList>
          <PropertyRow label="from" mono>
            {pair.source}
          </PropertyRow>
          <PropertyRow label="to" mono>
            {pair.target}
          </PropertyRow>
        </PropertyList>
        <Button variant="ghost" onClick={() => setPair(null)}>
          Close
        </Button>
      </PanelBox>
    ) : null;
    return (
      <SchemaBoard
        data={data}
        title="Airways — link across models"
        message="Turn on the link tool, or hold Shift, and drag a type onto a type in another model"
        initialDetail="high"
        connect={{
          label: 'Link mode — drag a type onto a type in another model (or hold Shift)',
          panelLabel: 'Link two types',
          panel,
          onClosePanel: () => setPair(null),
          onConnect: (source, target) => {
            if (frameOf(data, source) === frameOf(data, target)) return 'Both types are in one model — a link crosses models';
            setPair({ source, target });
            return null;
          }
        }}
      />
    );
  }
};
