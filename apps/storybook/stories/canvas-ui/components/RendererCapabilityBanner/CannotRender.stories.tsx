/**
 * **`<RendererCapabilityBanner>` — cannot render.** Neither WebGPU nor WebGL is
 * available, so the canvas cannot draw at all: a destructive alert that cannot be
 * dismissed, naming what to try instead.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { RendererCapabilityBanner } from '@invana/canvas-ui';

const meta: Meta = { title: 'canvas-ui/components/RendererCapabilityBanner' };
export default meta;
type Story = StoryObj;

export const CannotRender: Story = {
  name: 'Cannot render',
  render: () => (
    <div className="relative h-80 w-full rounded-lg border bg-muted">
      <RendererCapabilityBanner
        capabilities={{ webgpu: false, webgl: false, webgpuApi: false }}
      />
    </div>
  ),
};
