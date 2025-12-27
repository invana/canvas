import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@aspect-ui/canvas-core';
import {
  DEFAULT_NODE_STYLE,
  DEFAULT_EDGE_STYLE,
  DEFAULT_NODE_DIMENSIONS,
  LABEL_VARIANTS,
  EDGE_STROKE_PRESETS,
  mergeNodeStyle,
  mergeEdgeStyle,
} from '@aspect-ui/canvas-core';

const meta: Meta = {
  title: 'Core/Centralized Defaults',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

/**
 * Demonstrates the new centralized defaults system.
 * All default values for nodes and edges are now in one place.
 */
export const DefaultsOverview: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100vh';
    container.style.position = 'relative';

    setTimeout(() => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth,
        height: container.clientHeight,
      });

      // ============================================
      // Section 1: Using Complete Defaults
      // ============================================
      canvas.addNode({
        id: 'default-node',
        x: 150,
        y: 150,
        label: 'Default Style',
        style: DEFAULT_NODE_STYLE,
      });

      // ============================================
      // Section 2: Customizing Specific Properties
      // ============================================
      canvas.addNode({
        id: 'custom-node',
        x: 400,
        y: 150,
        label: 'Custom Fill',
        style: mergeNodeStyle({
          fill: 0x1890ff,
          strokeWidth: 8,
        }),
      });

      // ============================================
      // Section 3: Using Label Variants
      // ============================================
      canvas.addNode({
        id: 'title-node',
        x: 650,
        y: 150,
        label: 'Title Style',
        style: mergeNodeStyle({
          fill: 0x722ed1,
          labelStyle: LABEL_VARIANTS.title,
        }),
      });

      // ============================================
      // Section 4: Custom State Styling
      // ============================================
      canvas.addNode({
        id: 'state-node',
        x: 150,
        y: 350,
        label: 'Custom States',
        style: mergeNodeStyle({
          fill: 0xfa8c16,
          states: {
            selected: {
              fill: 0xff4d4f,
              strokeWidth: 12,
              halo: true,
            },
          },
        }),
      });

      // ============================================
      // Section 5: Using Edge Stroke Presets
      // ============================================
      canvas.addNode({
        id: 'edge-source',
        x: 400,
        y: 350,
        label: 'Dashed Edge',
        style: mergeNodeStyle({
          fill: 0x52c41a,
        }),
      });

      canvas.addNode({
        id: 'edge-target',
        x: 650,
        y: 350,
        label: 'Target',
        style: mergeNodeStyle({
          fill: 0x52c41a,
        }),
      });

      // Default edge
      canvas.addEdge({
        id: 'edge1',
        source: 'default-node',
        target: 'custom-node',
        style: DEFAULT_EDGE_STYLE,
      });

      // Dashed edge using preset
      canvas.addEdge({
        id: 'edge2',
        source: 'edge-source',
        target: 'edge-target',
        style: mergeEdgeStyle({
          strokeStyle: EDGE_STROKE_PRESETS.dashed.strokeStyle,
          strokeDashPattern: [...EDGE_STROKE_PRESETS.dashed.strokeDashPattern],
          stroke: '#1890ff',
          strokeWidth: 3,
        }),
      });

      // ============================================
      // Section 6: All Dimensions
      // ============================================
      console.log('Default Node Dimensions:', DEFAULT_NODE_DIMENSIONS);
      console.log('Default Node Style:', DEFAULT_NODE_STYLE);
      console.log('Default Edge Style:', DEFAULT_EDGE_STYLE);

      // Add info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '20px';
      info.style.right = '20px';
      info.style.background = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '20px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      info.style.fontFamily = 'Inter, sans-serif';
      info.style.fontSize = '13px';
      info.style.maxWidth = '300px';
      info.innerHTML = `
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Centralized Defaults</h3>
        <div style="margin-bottom: 12px;">
          <strong>✓ Single source of truth</strong><br/>
          <span style="color: #666; font-size: 12px;">All defaults in one place</span>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>✓ Easy customization</strong><br/>
          <span style="color: #666; font-size: 12px;">Override only what you need</span>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>✓ Type-safe</strong><br/>
          <span style="color: #666; font-size: 12px;">Full TypeScript support</span>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>✓ No hard-coded values</strong><br/>
          <span style="color: #666; font-size: 12px;">All magic numbers eliminated</span>
        </div>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e8e8e8;">
          <small style="color: #999;">
            Click nodes to see state changes<br/>
            Check console for default values
          </small>
        </div>
      `;
      container.appendChild(info);

      // Note: Node interaction would require accessing nodes via canvas.getNode(id)
      // which returns internal node instances. Keeping demo simple for now.
    }, 0);

    return container;
  },
};

/**
 * Shows all available default constants and their values
 */
export const DefaultsReference: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100vh';
    container.style.padding = '40px';
    container.style.background = '#fafafa';
    container.style.overflow = 'auto';
    container.style.fontFamily = 'Inter, system-ui, sans-serif';

    const html = `
      <style>
        .defaults-ref {
          max-width: 1200px;
          margin: 0 auto;
        }
        .defaults-ref h1 {
          font-size: 32px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .defaults-ref .subtitle {
          font-size: 16px;
          color: #666;
          margin-bottom: 32px;
        }
        .defaults-section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .defaults-section h2 {
          font-size: 20px;
          margin: 0 0 16px 0;
          font-weight: 600;
          color: #1890ff;
        }
        .defaults-section h3 {
          font-size: 16px;
          margin: 16px 0 8px 0;
          font-weight: 600;
        }
        .defaults-section pre {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 13px;
          line-height: 1.6;
        }
        .defaults-section code {
          font-family: 'Monaco', 'Courier New', monospace;
        }
        .badge {
          display: inline-block;
          background: #e6f7ff;
          color: #1890ff;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          margin-right: 8px;
          margin-bottom: 8px;
        }
      </style>
      
      <div class="defaults-ref">
        <h1>🎨 Centralized Defaults Reference</h1>
        <div class="subtitle">
          Complete reference for all default configurations
        </div>

        <div class="defaults-section">
          <h2>📦 Node Defaults</h2>
          
          <span class="badge">DEFAULT_NODE_DIMENSIONS</span>
          <span class="badge">DEFAULT_NODE_SHAPE_STYLE</span>
          <span class="badge">DEFAULT_NODE_LABEL</span>
          <span class="badge">DEFAULT_NODE_BADGE</span>
          <span class="badge">DEFAULT_NODE_STATE_STYLES</span>
          <span class="badge">DEFAULT_NODE_STYLE</span>
          <span class="badge">DEFAULT_NODE_BEHAVIOR</span>
          
          <h3>Complete Node Style</h3>
          <pre><code>${JSON.stringify(DEFAULT_NODE_STYLE, null, 2)}</code></pre>
          
          <h3>Node Dimensions</h3>
          <pre><code>${JSON.stringify(DEFAULT_NODE_DIMENSIONS, null, 2)}</code></pre>
        </div>

        <div class="defaults-section">
          <h2>🔗 Edge Defaults</h2>
          
          <span class="badge">DEFAULT_EDGE_PATH_STYLE</span>
          <span class="badge">DEFAULT_EDGE_ARROW</span>
          <span class="badge">DEFAULT_EDGE_ROUTING</span>
          <span class="badge">DEFAULT_EDGE_LABEL</span>
          <span class="badge">DEFAULT_EDGE_STATE_STYLES</span>
          <span class="badge">DEFAULT_EDGE_STYLE</span>
          <span class="badge">EDGE_STROKE_PRESETS</span>
          
          <h3>Complete Edge Style</h3>
          <pre><code>${JSON.stringify(DEFAULT_EDGE_STYLE, null, 2)}</code></pre>
          
          <h3>Stroke Presets</h3>
          <pre><code>${JSON.stringify(EDGE_STROKE_PRESETS, null, 2)}</code></pre>
        </div>

        <div class="defaults-section">
          <h2>📝 Label Defaults</h2>
          
          <span class="badge">DEFAULT_LABEL_STYLE</span>
          <span class="badge">DEFAULT_LABEL_POSITION</span>
          <span class="badge">LABEL_VARIANTS</span>
          
          <h3>Label Variants</h3>
          <pre><code>${JSON.stringify(LABEL_VARIANTS, null, 2)}</code></pre>
        </div>

        <div class="defaults-section">
          <h2>🛠️ Utility Functions</h2>
          
          <h3>mergeNodeStyle(userStyle)</h3>
          <pre><code>import { mergeNodeStyle } from '@aspect-ui/canvas-core';

const style = mergeNodeStyle({
  fill: 0x1890ff,
  strokeWidth: 8,
  // All other properties filled from defaults
});</code></pre>

          <h3>mergeEdgeStyle(userStyle)</h3>
          <pre><code>import { mergeEdgeStyle } from '@aspect-ui/canvas-core';

const style = mergeEdgeStyle({
  stroke: '#ff4d4f',
  strokeWidth: 4,
});</code></pre>

          <h3>mergeNodeStateStyles(userStates)</h3>
          <pre><code>import { mergeNodeStateStyles } from '@aspect-ui/canvas-core';

const states = mergeNodeStateStyles({
  selected: { strokeWidth: 12 },
  custom: { fill: 0xff0000 },
});</code></pre>
        </div>
      </div>
    `;

    container.innerHTML = html;
    return container;
  },
};
