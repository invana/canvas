/**
 * `<CanvasSettingsPanelView>` from `@invana/canvas-ui` — one JSON-driven settings
 * panel over a whole canvas definition. It takes the serialisable set of
 * registered **layers / behaviours / layouts** + their settings, lists them in a
 * file-browser accordion (folders = sections, files = instances), and expands each
 * row in place to a schema-driven `SettingsPanel`.
 *
 * This story is fully **standalone** — a static `CanvasSettingsDefinition` in, and
 * every edit logged to the side as the engine-shaped patch a host would apply via
 * `canvas.update({ [section]: { [id]: patch } })`. No engine anywhere. Each
 * instance's `settings` are in the engine's option shape; the panel maps them to
 * the flat form via the built-in registry (`kind` → fields + mappers) and maps
 * edits back on the way out.
 */

import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasSettingsPanelView,
  type CanvasSettingsDefinition,
  type SettingsSection,
} from '@invana/canvas-ui';

const meta: Meta = { title: 'canvas-ui/editors/CanvasSettingsPanelView' };
export default meta;
type Story = StoryObj;

/**
 * A seed definition — the shape a host builds by introspecting a live canvas
 * (`kind` per instance, current engine-shaped `settings`, `enabled` for
 * layers / behaviours, and the active layout id).
 */
const INITIAL_DEFINITION: CanvasSettingsDefinition = {
  layers: [
    {
      id: 'background',
      kind: 'background-layer',
      settings: {
        type: 'pattern',
        patternType: 'dots',
        backgroundColor: 0x0f172a,
        color: 0x334155,
        size: 1.5,
        spacing: 24,
        alpha: 0.6,
        followCamera: true,
      },
    },
    { id: 'minimap', kind: 'minimap-layer', settings: { position: 'bottom-right', width: 240, height: 160, enableDrag: true } },
    { id: 'graph-density', kind: 'density-contour-fill-layer', settings: { bandwidth: 40, thresholds: 8, palette: 'viridis' } },
  ],
  behaviours: [
    { id: 'pan', kind: 'drag-pan', enabled: true, settings: { modifier: 'none', decelerate: true } },
    { id: 'zoom', kind: 'wheel-zoom', enabled: true, settings: { requireCtrl: true, percent: 0.15, smooth: true, smoothFrames: 24 } },
    { id: 'drag', kind: 'drag-node', enabled: true, settings: { pinOnRelease: true, groupAware: true } },
    { id: 'hover', kind: 'hover-activate', enabled: false, settings: { degree: 1, direction: 'both' } },
    { id: 'brush', kind: 'brush-select', enabled: true, settings: { enableElements: ['shape'], style: { fill: 0x3b82f6, fillAlpha: 0.1 } } },
  ],
  layouts: [
    { id: 'force', kind: 'd3-force-layout', settings: { linkDistance: 90, chargeStrength: -300, animate: true } },
    { id: 'elk', kind: 'elk-layout', settings: { algorithm: 'layered', direction: 'RIGHT', nodeSpacing: 40, layerSpacing: 60 } },
  ],
  activeLayoutId: 'force',
};

function StandaloneDemo() {
  const [definition, setDefinition] = useState(INITIAL_DEFINITION);
  const [lastPatch, setLastPatch] = useState<{
    section: SettingsSection;
    id: string;
    patch: Record<string, unknown>;
  } | null>(null);

  // Mirror a live host: fold each edit into the running definition and log the
  // patch a canvas would receive.
  const applyPatch = (section: SettingsSection, id: string, patch: Record<string, unknown>) => {
    setLastPatch({ section, id, patch });
    setDefinition((d) => ({
      ...d,
      [section]: (d[section] ?? []).map((inst) =>
        inst.id === id ? { ...inst, settings: { ...(inst.settings ?? {}), ...patch } } : inst,
      ),
    }));
  };

  const toggle = (section: SettingsSection, id: string, enabled: boolean) =>
    setDefinition((d) => ({
      ...d,
      [section]: (d[section] ?? []).map((inst) => (inst.id === id ? { ...inst, enabled } : inst)),
    }));

  return (
    <div style={pageStyle}>
      <div style={{ width: 380 }}>
        <CanvasSettingsPanelView
          definition={definition}
          onChange={applyPatch}
          onToggle={toggle}
          onActiveLayoutChange={(id) => setDefinition((d) => ({ ...d, activeLayoutId: id }))}
        />
      </div>

      <div style={colStyle}>
        <div style={labelStyle}>Live → canvas.update()</div>
        <pre style={preStyle}>
          {lastPatch
            ? `canvas.update(${JSON.stringify(
                { [lastPatch.section]: { [lastPatch.id]: lastPatch.patch } },
                null,
                2,
              )})`
            : '// edit any field to see the engine-shaped patch'}
        </pre>
        <div style={labelStyle}>Definition document</div>
        <pre style={preStyle}>{JSON.stringify(definition, null, 2)}</pre>
      </div>
    </div>
  );
}

export const Standalone: Story = {
  render: () => <StandaloneDemo />,
};

// ─── Layout ──────────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 16,
  height: '100vh',
  padding: 16,
  boxSizing: 'border-box',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'var(--background, #fff)',
  color: 'var(--foreground, #111)',
};

const colStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: 360,
  minWidth: 0,
  overflow: 'auto',
  maxHeight: '100%',
};

const labelStyle: CSSProperties = { fontWeight: 600, fontSize: 13 };

const preStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  fontSize: 12,
  lineHeight: 1.5,
  background: 'var(--muted, #f4f4f5)',
  borderRadius: 8,
  overflow: 'auto',
};
