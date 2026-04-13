/**
 * Shared helpers for interaction stories.
 * Provides a split-panel layout (canvas + event log) and a typed logger.
 */

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/**
 * Creates a full-screen split layout: canvas on the left, event-log panel on the right.
 * Returns the outer wrapper element. The canvas container is given `id = canvasId`.
 * The log list element gets `id = "${canvasId}-log"`.
 */
export function createLogLayout(
  canvasId: string,
  title: string,
  hint: string,
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText =
    'display:flex;width:100vw;height:100vh;overflow:hidden;' +
    'font-family:ui-monospace,"Cascadia Code",monospace;background:#0d1117;';

  // Canvas side
  const canvasContainer = document.createElement('div');
  canvasContainer.id = canvasId;
  canvasContainer.style.cssText = 'flex:1;min-width:0;position:relative;';

  // Panel
  const panel = document.createElement('div');
  panel.style.cssText =
    'width:300px;flex-shrink:0;display:flex;flex-direction:column;' +
    'background:#161b22;border-left:1px solid #21262d;color:#c9d1d9;';

  const header = document.createElement('div');
  header.style.cssText =
    'padding:11px 13px;background:#0d1117;border-bottom:1px solid #21262d;';
  header.innerHTML =
    `<div style="font-size:12px;font-weight:700;color:#58a6ff;letter-spacing:.4px;">${title}</div>` +
    `<div style="font-size:10px;color:#8b949e;margin-top:3px;">${hint}</div>`;

  const logEl = document.createElement('div');
  logEl.id = `${canvasId}-log`;
  logEl.style.cssText =
    'flex:1;overflow-y:auto;padding:8px 8px 4px;';
  logEl.innerHTML =
    '<div style="color:#484f58;font-size:10px;padding:6px 4px;">Waiting for events…</div>';

  const footer = document.createElement('div');
  footer.style.cssText = 'padding:7px;border-top:1px solid #21262d;';
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear log';
  clearBtn.style.cssText =
    'width:100%;padding:5px;background:#21262d;color:#8b949e;' +
    'border:1px solid #30363d;border-radius:4px;cursor:pointer;font-size:11px;';
  clearBtn.onmouseenter = () => { clearBtn.style.background = '#30363d'; };
  clearBtn.onmouseleave = () => { clearBtn.style.background = '#21262d'; };
  clearBtn.onclick = () => { logEl.innerHTML = ''; };
  footer.appendChild(clearBtn);

  panel.appendChild(header);
  panel.appendChild(logEl);
  panel.appendChild(footer);
  wrapper.appendChild(canvasContainer);
  wrapper.appendChild(panel);

  return wrapper;
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

/**
 * Returns a log() function bound to the panel created by createLogLayout.
 */
export function makeLogger(canvasId: string, defaultColor = '#58a6ff') {
  return (eventType: string, fields: Record<string, string>, color = defaultColor) => {
    const el = document.getElementById(`${canvasId}-log`);
    if (!el) return;

    // Remove placeholder text on first entry
    const placeholder = el.querySelector('div[style*="Waiting"]');
    if (placeholder) placeholder.remove();

    const entry = document.createElement('div');
    const time = new Date().toLocaleTimeString('en', { hour12: false });
    const rows = Object.entries(fields)
      .map(
        ([k, v]) =>
          `<div><span style="color:#8b949e;">${k}:</span> ` +
          `<span style="color:#e6edf3;">${v}</span></div>`,
      )
      .join('');
    entry.style.cssText =
      `padding:7px 8px;margin-bottom:5px;background:#0d1117;` +
      `border-left:3px solid ${color};border-radius:0 4px 4px 0;font-size:11px;line-height:1.6;`;
    entry.innerHTML =
      `<div style="font-weight:700;color:${color};margin-bottom:3px;">${eventType}` +
      `<span style="float:right;font-weight:400;color:#484f58;">${time}</span></div>${rows}`;

    el.insertBefore(entry, el.firstChild);
    // Keep log bounded
    while (el.children.length > 80) el.removeChild(el.lastChild!);
  };
}

// ---------------------------------------------------------------------------
// Canvas factory
// ---------------------------------------------------------------------------

import { Canvas, GraphDataPlugin } from '@invana/canvas-core';

export const BG_PLUGIN = {
  plugin: 'background' as const,
  key: 'bg',
  options: {
    type: 'pattern' as const,
    patternType: 'dots' as const,
    backgroundColor: '#0d1117',
    color: '#30363d',
    size: 1.5,
    spacing: 28,
    alpha: 0.7,
  },
};

export async function buildCanvas(
  container: HTMLElement,
  graphData: { nodes: object[]; edges: object[] },
  fitPadding = 60,
): Promise<{ canvas: Canvas; graphPlugin: GraphDataPlugin }> {
  const canvas = new Canvas({
    container,
    width: container.clientWidth || 800,
    height: container.clientHeight || 600,
    behavior: 'default',
    plugins: [BG_PLUGIN],
  });
  await canvas.init();

  const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding });
  await canvas.registerPlugin(graphPlugin);
  graphPlugin.setData(graphData as any);

  return { canvas, graphPlugin };
}

// ---------------------------------------------------------------------------
// Shared graph data
// ---------------------------------------------------------------------------

export const GRAPH_DATA = {
  nodes: [
    { id: 'n1', x: -220, y: -110, shape: 'circle',  size: 44, label: 'Circle'  },
    { id: 'n2', x:    0, y: -110, shape: 'rect',    width: 90, height: 56, label: 'Rect' },
    { id: 'n3', x:  220, y: -110, shape: 'diamond', size: 50, label: 'Diamond' },
    { id: 'n4', x: -110, y:  110, shape: 'hexagon', size: 44, label: 'Hexagon' },
    { id: 'n5', x:  110, y:  110, shape: 'star',    size: 44, label: 'Star'    },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
    { id: 'e2', source: 'n2', target: 'n3', pathType: 'bezier' },
    { id: 'e3', source: 'n1', target: 'n4', pathType: 'bezier' },
    { id: 'e4', source: 'n3', target: 'n5', pathType: 'bezier' },
    { id: 'e5', source: 'n4', target: 'n5', pathType: 'bezier' },
  ],
};
