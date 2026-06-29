/**
 * `<HoverPreviewCardEditor>` — the schema-driven form that produces one
 * serializable `HoverElementPreviewCardSpec` (the per-type card definition).
 *
 * This is the building block for a per-type cards UI: render one editor per
 * node / edge type, store each result into `cards.nodes[type]` /
 * `cards.edges[type]`, and feed that object to `<HoverElementPreviewBehaviour>`.
 * The story shows the editor next to the live JSON it produces on Apply.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { HoverPreviewCardEditor } from '@invana/canvas-ui';
import type { HoverElementPreviewCardSpec } from '@invana/graph';

const meta: Meta = { title: 'canvas-ui/editors/HoverPreviewCardEditor' };
export default meta;
type Story = StoryObj;

const initial: HoverElementPreviewCardSpec = {
  image: { field: 'data.avatar', shape: 'circle' },
  title: { field: 'data.name' },
  subtitle: { field: 'data.bio', maxLines: 2 },
  rows: [
    { label: 'Role', field: 'data.role' },
    { label: 'Email', field: 'data.email' },
  ],
};

export const HoverPreviewCardEditorStory: Story = {
  name: 'HoverPreviewCardEditor',
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [spec, setSpec] = useState<HoverElementPreviewCardSpec>(initial);
    return (
      <div style={{ display: 'flex', gap: 24, padding: 24, alignItems: 'flex-start' }}>
        <div style={{ width: 380, borderRadius: 8, border: '1px solid var(--border)' }}>
          <HoverPreviewCardEditor defaults={initial} onSubmit={setSpec} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            Produced HoverElementPreviewCardSpec (on Apply)
          </div>
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              padding: 16,
              borderRadius: 8,
              background: 'var(--muted)',
              color: 'var(--foreground)',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(spec, null, 2)}
          </pre>
        </div>
      </div>
    );
  },
};
