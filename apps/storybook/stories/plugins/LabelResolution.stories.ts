/**
 * Plugins/Behaviours — Label Resolution
 *
 * Demonstrates the opt-in `LabelResolutionPlugin`.  Zoom into the canvas
 * (mouse-wheel / pinch) and observe label crispness with the plugin enabled
 * vs disabled.  GUI knobs expose every option:
 *
 *   - `enable`         — register / unregister the plugin live
 *   - `resolver`       — pow2 (default) | linear | fixed
 *   - `maxResolution`  — hard cap, bounds GPU memory
 *   - `threshold`      — minimum delta before re-rasterisation kicks in
 *   - `debounce`       — debounce window during continuous zoom
 *   - `pinHero`        — opt some labels into a per-element override
 *                        (LabelStyle.resolution) that the plugin honours
 *   - `refresh()`      — force an immediate re-evaluation
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import {
  ShapesPlugin,
  LabelResolutionPlugin,
  type LabelResolutionResolver,
  type CircleShapeSpec,
  type NodeLabelSpec,
} from '@invana/plugins-shapes';
import { createContainer } from '../../src/div-utils.js';

const meta: Meta = {
  title: 'Plugins/Behaviours',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Re-rasterises PIXI.Text labels at higher resolution as the camera zooms in, so labels stay crisp without a hard-coded resolution cap. Per-element `LabelStyle.resolution` overrides are preserved.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

// ── Resolver presets exposed by the GUI ──────────────────────────────────────
const RESOLVERS: Record<string, LabelResolutionResolver> = {
  // Power-of-two buckets (default). Cheapest — at most ~3 re-rasters across the
  // entire useful zoom range.
  pow2: (zoom, dpr) => Math.pow(2, Math.ceil(Math.log2(Math.max(1, dpr * zoom)))),
  // Linear — re-raster on every zoom delta. Sharper, more texture churn.
  linear: (zoom, dpr) => Math.max(1, dpr * zoom),
  // Fixed at 4x DPR — ignores zoom. Useful as a static "always crisp-ish" baseline.
  fixed: (_zoom, dpr) => dpr * 4,
};

export const LabelResolution: Story = {
  name: 'Label Resolution',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width:           container.clientWidth  || 1200,
      height:          container.clientHeight || 800,
      backgroundColor: '#0f172a',
    });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key:             'bg',
      type:            'pattern',
      patternType:     'dots',
      color:           '#1e293b',
      backgroundColor: '#0f172a',
      size:            1,
      spacing:         30,
    }));

    const shapes = new ShapesPlugin({ key: 'shapes' });
    await canvas.plugins.register(shapes);

    // Build a 5×4 grid of circles with varying-length labels so the
    // pixelation effect is obvious at high zoom.
    const COLS = 5, ROWS = 4, GAP = 180;
    const labels = [
      'Customers', 'Orders', 'Products', 'Reviews', 'Suppliers',
      'Invoices',  'Payouts','Refunds',  'Tickets', 'Sessions',
      'Devices',   'Tags',   'Streams',  'Topics',  'Events',
      'Audits',    'Roles',  'Tokens',   'Quotas',  'Webhooks',
    ];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const spec: CircleShapeSpec = {
          id:     `n${i}`,
          x:      (c - (COLS - 1) / 2) * GAP,
          y:      (r - (ROWS - 1) / 2) * GAP,
          radius: 36,
          style:  { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 },
          label:  {
            text:     labels[i] ?? `Node ${i + 1}`,
            position: 'bottom',
            offsetY:  6,
            fill:     '#ffffff',
            fontSize: 14,
          },
        };
        shapes.addShape('circle', spec);
      }
    }
    shapes.fitContent(80);

    // ── State + plugin lifecycle ───────────────────────────────────────────
    const params = {
      enable:        true,
      resolver:      'pow2'  as keyof typeof RESOLVERS,
      maxResolution: 8,
      threshold:     0,
      debounce:      80,
      pinHero:       false,
      heroResolution: 8,
    };

    let plugin: LabelResolutionPlugin | null = null;

    const buildPlugin = () => new LabelResolutionPlugin({
      shapes,
      resolve:       RESOLVERS[params.resolver],
      maxResolution: params.maxResolution,
      threshold:     params.threshold,
      debounce:      params.debounce,
    });

    const enable = async () => {
      if (plugin) return;
      plugin = buildPlugin();
      await canvas.plugins.register(plugin);
    };

    const disable = async () => {
      if (!plugin) return;
      await canvas.plugins.unregister(plugin.id);
      plugin = null;
    };

    /**
     * Re-create the plugin so option changes take effect.  The plugin reads
     * its options at construction time, so the simplest path is unregister →
     * re-register with the new values.
     */
    const restart = async () => {
      if (!params.enable) return;
      await disable();
      await enable();
    };

    /**
     * Toggle the per-element `LabelStyle.resolution` override on the four
     * corner nodes.  When pinned, the plugin's `setResolution` is a no-op on
     * those labels — they stay at `heroResolution` regardless of zoom.
     */
    const applyHeroPins = () => {
      const corners = ['n0', `n${COLS - 1}`, `n${(ROWS - 1) * COLS}`, `n${ROWS * COLS - 1}`];
      for (const id of corners) {
        const obj = shapes.getShape(id);
        if (!obj) continue;
        const label = obj.element.spec.label;
        if (!label || typeof label === 'string' || Array.isArray(label)) continue;
        // The element is a shape (we registered it via addShape('circle', …))
        // so its label is a NodeLabelSpec. The TS union over connector specs
        // forces an explicit narrowing here.
        const next: NodeLabelSpec = {
          ...(label as NodeLabelSpec),
          resolution: params.pinHero ? params.heroResolution : undefined,
          // Visually flag pinned labels so the demo is unambiguous.
          fill:       params.pinHero ? '#fbbf24' : '#ffffff',
        };
        shapes.updateShape(id, { label: next });
      }
      // After updating styles, ask the plugin to re-evaluate so any newly
      // un-pinned labels pick up the global resolution again.
      plugin?.refresh();
    };

    await enable();

    // ── lil-gui ────────────────────────────────────────────────────────────
    const gui = new GUI({ container, title: 'Label Resolution' });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    gui.add(params, 'enable').name('enable plugin')
      .onChange((v: boolean) => (v ? enable() : disable()));

    gui.add(params, 'resolver', Object.keys(RESOLVERS)).name('resolver')
      .onChange(restart);

    gui.add(params, 'maxResolution', 1, 16, 1).name('maxResolution')
      .onChange(restart);

    gui.add(params, 'threshold', 0, 2, 0.1).name('threshold')
      .onChange(restart);

    gui.add(params, 'debounce', 0, 500, 10).name('debounce (ms)')
      .onChange(restart);

    gui.add({ refresh: () => plugin?.refresh() }, 'refresh').name('refresh()');

    const heroFolder = gui.addFolder('Per-element override');
    heroFolder.add(params, 'pinHero').name('pin corners').onChange(applyHeroPins);
    heroFolder.add(params, 'heroResolution', 1, 16, 1).name('hero resolution')
      .onChange(applyHeroPins);

    // Hint overlay so users know to zoom in.
    const hint = document.createElement('div');
    hint.textContent = 'Mouse-wheel to zoom in — labels should stay crisp with the plugin enabled.';
    hint.style.cssText =
      'position:absolute;bottom:12px;left:12px;z-index:100;' +
      'padding:6px 10px;background:rgba(15,23,42,0.85);' +
      'color:#e2e8f0;border:1px solid #334155;' +
      'border-radius:4px;font-size:12px;pointer-events:none;';
    container.appendChild(hint);
  },
};
