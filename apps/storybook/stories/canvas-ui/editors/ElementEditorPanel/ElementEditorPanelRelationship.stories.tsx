/**
 * **`ElementEditorPanel` for a relationship.** Its ends are shown read-only
 * above the fields — drawing fixed them; another pair is another relationship.
 * *Reverse direction* swaps them at once, not on Apply (`onReverse`).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ElementEditorPanel, type ElementEditorValues } from '@invana/canvas-ui';
import { Column } from './shared';

const meta: Meta = { title: 'canvas-ui/editors/ElementEditorPanel/ElementEditorPanelRelationship' };
export default meta;
type Story = StoryObj;

const EDGE_MODEL = [{ type: 'co-appears-with', keys: [{ key: 'chapter', kind: 'text' }, { key: 'value', kind: 'number' }] }];

export const ElementEditorPanelRelationshipStory: Story = {
  name: 'ElementEditorPanelRelationship',
  render: function Render() {
    const [ends, setEnds] = useState({ from: 'Valjean', to: 'Javert' });
    const [applied, setApplied] = useState<ElementEditorValues | null>(null);
    const [log, setLog] = useState<string[]>([]);
    return (
      <Column applied={applied} log={log}>
        <ElementEditorPanel
          title="Relationship"
          showLabel={false}
          showType
          schema={EDGE_MODEL}
          defaults={{ type: 'co-appears-with', data: { chapter: 'I.2' } }}
          endpoints={ends}
          onReverse={() => {
            setEnds((e) => ({ from: e.to, to: e.from }));
            setLog((l) => ['reversed', ...l]);
          }}
          onSubmit={setApplied}
        />
      </Column>
    );
  }
};
