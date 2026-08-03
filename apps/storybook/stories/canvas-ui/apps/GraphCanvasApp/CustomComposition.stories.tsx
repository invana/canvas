/**
 * `<GraphCanvasApp bundle={false}>` — **compose your own graph** inside the app
 * shell. The default bundle (background · graph · colour · force · the camera /
 * selection behaviours) is the one structural thing `config` *can't* express, so
 * turning it off and supplying your own `children` is the escape hatch: you keep
 * the `AppLayoutV2` chrome (header / footer / side regions, theme-scoped root) but
 * own every layer, behaviour and layout in the canvas yourself.
 *
 * Here the replacement graph is a hand-styled look — a dark dotted backdrop,
 * star-shaped nodes coloured per community, thin diamond-tipped edges — wired up
 * from scratch: `<BackgroundLayer>` · `<GraphLayer>` · `<D3ForceLayout>` (pointed
 * at by `config.activeLayout`) · pan / zoom / drag-node / hover. With `bundle`
 * off, `config` is applied verbatim (no deep-merge over the bundle defaults).
 *
 * Contrast with `Default`, where the same `data` rides the batteries-included
 * bundle with zero children.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, D3ForceLayout, DragNodeBehaviour, DragPanBehaviour, GraphLayer, HoverActivateBehaviour, TextResolutionLODBehaviour, WheelZoomBehaviour } from '@invana/canvas-react';
import { CanvasMessageBar, GraphCanvasApp, GraphStatusBar } from '@invana/canvas-ui';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/CustomComposition' };
export default meta;
type Story = StoryObj;
const DATA = lesMiserables;

export const CustomCompositionStory: Story = {
  name: 'CustomComposition',
  render: () => (
    // A real consumer mounts the app under its own <ThemeProvider>. With `bundle`
    // off there's no engine ThemeBehaviour, so the canvas colours are fixed here
    // (the shell chrome still themes light/dark from the provider).
    <ThemeProvider>
      <GraphCanvasApp
        data={DATA}
        // No bundle — we own every layer/behaviour/layout below. `config` is
        // applied as-is; `activeLayout` points at our own <D3ForceLayout id="force">.
        bundle={false}
        config={{ activeLayout: 'force' }}
        onReady={(c) => c?.showMessage('bundle={false} — this whole graph is composed by hand')}
        header={{ title: 'Custom Composition' }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
      >
        {/* Own backdrop — a dark dotted pattern (no themed BackgroundLayer here). */}
        <BackgroundLayer
          id="bg"
          type="pattern"
          patternType="dots"
          backgroundColor="#0f172a"
          color="#334155"
        />
        {/* The graph layer + its hand-authored node / edge styling. Declared
            before the layout that targets it. */}
        <GraphLayer
          id="graph"
          data={DATA}
          node={{
            style: {
              shape: { kind: 'star', points: 5, innerRadius: 5, outerRadius: 11 },
              bgStrokeColor: 0x0f172a,
              bgStrokeWidth: 1.5,
              labelText: (n: GraphNode) => n.id,
              labelColor: 0xe2e8f0,
              labelFontSize: 10,
              labelPlacement: 'bottom',
              labelOffsetY: 5,
            },
          }}
          edge={{ style: { strokeColor: 0x475569, strokeWidth: 1, arrowTargetShape: 'diamond' } }}
        />
        <D3ForceLayout
          id="force"
          targetLayerId="graph"
          options={{
            charge: { strength: -220 },
            link: { distance: 60 },
            collide: { radius: 16 },
            animate: false,
          }}
        />
        {/* Camera + interaction, wired up by hand. */}
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
        <HoverActivateBehaviour id="hover" targetLayerId="graph" state="highlighted" degree={1} />
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />
      </GraphCanvasApp>
    </ThemeProvider>
  ),
};
