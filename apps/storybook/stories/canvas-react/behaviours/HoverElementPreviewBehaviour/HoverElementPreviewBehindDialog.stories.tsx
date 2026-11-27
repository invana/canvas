/**
 * `<HoverElementPreviewBehaviour>` with a dialog open over the canvas.
 *
 * A dialog or sheet that covers the canvas must not let the canvas show hover
 * cards through it: the card opens only while the pointer is over the canvas,
 * and a card that is open closes the moment a dialog covers the canvas.
 *
 * Try it: hover a node (a card opens), press **Open dialog**, then move the
 * pointer over the same spot. The dialog (`z-index: 50`, as the design kit's
 * dialog) keeps the pointer; no card opens above or under it. Close the dialog
 * and hover again: the card is back.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodePreviewCard, type PreviewCardRow } from '@invana/canvas-ui';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  GraphLayer,
  HoverElementPreviewBehaviour,
  ThemeBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { GraphData, GraphNode } from '@invana/graph';

const meta: Meta = { title: 'canvas-react/behaviours/HoverElementPreviewBehaviour/HoverElementPreviewBehindDialog' };
export default meta;
type Story = StoryObj;

interface PlaceData {
  name: string;
  about: string;
}

const data: GraphData = {
  nodes: [
    { id: 'sydney', type: 'Airport', position: { x: -160, y: 0 }, data: { name: 'Sydney', about: 'SYD, New South Wales.' } },
    { id: 'london', type: 'Airport', position: { x: 0, y: -90 }, data: { name: 'London', about: 'LHR, England.' } },
    { id: 'lima', type: 'Airport', position: { x: 160, y: 40 }, data: { name: 'Lima', about: 'LIM, Peru.' } },
  ],
  edges: [
    { id: 'syd-lhr', source: 'sydney', target: 'london', type: 'ROUTE', data: {} },
    { id: 'lhr-lim', source: 'london', target: 'lima', type: 'ROUTE', data: {} },
  ],
};

function renderNode(node: GraphNode) {
  const d = node.data as PlaceData;
  const rows: PreviewCardRow[] = [{ label: 'id', value: node.id, mono: true }];
  return <NodePreviewCard title={d.name} subtitle={d.about} tags={[node.type ?? '']} rows={rows} />;
}

export const HoverElementPreviewBehindDialog: Story = {
  name: 'HoverElementPreviewBehindDialog',
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <Canvas autoResize>
          <BackgroundLayer id="background" type="pattern" patternType="dots" />
          <ThemeBehaviour id="theme" mode="document" />
          <GraphLayer
            id="graph"
            data={data}
            node={{
              style: {
                shape: { kind: 'circle', radius: 24 },
                bgFill: 0x6366f1,
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 2,
                labelText: (n: GraphNode) => (n.data as PlaceData).name,
                labelColor: 0xf8fafc,
                labelFontSize: 12,
                labelPlacement: 'center',
              },
            }}
            edge={{ style: { strokeColor: 0x64748b, strokeWidth: 2 } }}
          />
          <DragPanBehaviour id="pan" enabled />
          <WheelZoomBehaviour id="zoom" enabled />
          <HoverElementPreviewBehaviour targetLayerId="graph" renderNode={renderNode} />
        </Canvas>

        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ position: 'absolute', top: 12, left: 12, zIndex: 20, padding: '6px 12px' }}
        >
          Open dialog
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Dialog over the canvas"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                width: 640,
                height: 360,
                padding: 16,
                background: 'var(--color-card, #fff)',
                color: 'var(--color-card-foreground, #111)',
                border: '1px solid var(--color-border, #ccc)',
              }}
            >
              <p style={{ marginTop: 0 }}>A dialog over the canvas. Move the pointer over the nodes behind it: no card opens.</p>
              <button type="button" onClick={() => setOpen(false)}>
                Close dialog
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
};
