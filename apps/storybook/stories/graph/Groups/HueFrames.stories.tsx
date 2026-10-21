/**
 * **Frames and nodes coloured by a categorical slot.** A colour lookup with
 * `categorical: true` reads its bound value as a 1-based slot into the theme's
 * categorical ramp, wrapping past its end; a styling template's `fillLookup` /
 * `strokeLookup` puts it on a simple shape — here a frame's wash and border,
 * and its member's fill.
 *
 * | Frame | `data.hue` | Resolves to |
 * |---|---|---|
 * | 1 – 8 | its slot | ramp colour 1 – 8 |
 * | 33 | past the ramp's end | wraps — slot 33 of a ramp of n is slot `(33 − 1) mod n + 1` |
 * | none | unset | the styling's own `muted` / `stroke` roles |
 *
 * Toggle the theme in the header: every colour follows the new ramp, and no
 * host code re-reads anything.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { GraphLayer } from '@invana/canvas-react';
import { GraphCanvasApp, ToolbarItems } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';
import { Moon, Sun } from 'lucide-react';

const meta: Meta = { title: 'graph/Groups/HueFrames' };
export default meta;
type Story = StoryObj;

const HUE = { bind: 'data.hue', categorical: true };

const CONFIG = {
  fitOnLoad: true,
  layers: {
    graph: {
      nodeStructureTemplates: {
        frame: { name: 'frame', kind: 'simple', shape: { kind: 'rect', width: 120, height: 90, cornerRadius: 8 }, slots: { label: true } },
        dot: { name: 'dot', kind: 'simple', shape: { kind: 'circle', radius: 14 }, slots: { label: true } }
      },
      nodeStylingTemplates: {
        frame: {
          name: 'frame',
          fillRole: 'muted',
          fillLookup: HUE,
          fillAlpha: 0.12,
          strokeRole: 'stroke',
          strokeLookup: HUE,
          strokeAlpha: 0.7,
          strokeWidth: 1.5,
          group: { autoFit: true, padding: 24, headerHeight: 24 },
          label: { fontSize: 12, fontWeight: 700, colorRole: 'heading', placement: 'inside-top-left' }
        },
        dot: { name: 'dot', fillRole: 'accent', fillLookup: HUE, label: { fontSize: 11, colorRole: 'foreground', placement: 'bottom' } }
      },
      nodeTypes: {
        frame: { structure: 'frame', styling: 'frame', bindings: { label: 'data.name' } },
        dot: { structure: 'dot', styling: 'dot', bindings: { label: 'data.name' } }
      }
    }
  },
  behaviours: { theme: { enabled: true, mode: 'document' } }
} as unknown as CanvasConfig;

export const HueFramesStory: Story = {
  name: 'HueFrames',
  render: function Render() {
    const data = useMemo<GraphData>(() => {
      const hues: (number | undefined)[] = [1, 2, 3, 4, 5, 6, 7, 8, 33, undefined];
      const nodes = hues.flatMap((hue, i) => {
        const x = (i % 5) * 200;
        const y = Math.floor(i / 5) * 200;
        const name = hue === undefined ? 'no hue' : `hue ${hue}`;
        const data = hue === undefined ? { name } : { name, hue };
        return [
          { id: `f${i}`, type: 'frame', data },
          { id: `n${i}`, type: 'dot', parentId: `f${i}`, data, position: { x, y } }
        ];
      });
      return { nodes, edges: [] } as unknown as GraphData;
    }, []);
    return (
      <GraphCanvasApp
        data={data}
        config={CONFIG}
        bundle={false}
        header={{
          title: 'HueFrames',
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  type: 'toggle',
                  key: 'theme',
                  icon: Sun,
                  activeIcon: Moon,
                  label: 'Switch to dark theme',
                  activeLabel: 'Switch to light theme',
                  active: ctx.themeKind === 'dark',
                  onToggle: ctx.toggleTheme
                }
              ]}
            />
          )
        }}
      >
        <GraphLayer id="graph" data={data} />
      </GraphCanvasApp>
    );
  }
};
