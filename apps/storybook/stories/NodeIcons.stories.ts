import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@aspect-ui/canvas-core';

const meta: Meta = {
  title: 'Nodes/Icons',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

/**
 * Unicode icons embedded in node labels
 */
export const UnicodeIcons: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '700px';
    container.style.backgroundColor = '#f5f5f5';

    const canvas = new Canvas({
      container,
      width: 1400,
      height: 700,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      // Unicode emoji and symbols
      const unicodeIcons = [
        // Emojis
        { icon: '🏠', label: 'Home', category: 'Places' },
        { icon: '👤', label: 'User', category: 'People' },
        { icon: '⚙️', label: 'Settings', category: 'Objects' },
        { icon: '📊', label: 'Analytics', category: 'Charts' },
        { icon: '🔔', label: 'Notifications', category: 'Objects' },
        { icon: '📧', label: 'Email', category: 'Objects' },
        { icon: '🔒', label: 'Security', category: 'Objects' },
        { icon: '💼', label: 'Business', category: 'Objects' },
        
        // Geometric shapes
        { icon: '⬤', label: 'Circle', category: 'Shapes' },
        { icon: '■', label: 'Square', category: 'Shapes' },
        { icon: '▲', label: 'Triangle', category: 'Shapes' },
        { icon: '★', label: 'Star', category: 'Shapes' },
        
        // Arrows
        { icon: '→', label: 'Arrow Right', category: 'Arrows' },
        { icon: '↑', label: 'Arrow Up', category: 'Arrows' },
        { icon: '↓', label: 'Arrow Down', category: 'Arrows' },
        { icon: '⇄', label: 'Exchange', category: 'Arrows' },
        
        // Symbols
        { icon: '✓', label: 'Check', category: 'Symbols' },
        { icon: '✗', label: 'Cross', category: 'Symbols' },
        { icon: '⚡', label: 'Lightning', category: 'Symbols' },
        { icon: '♥', label: 'Heart', category: 'Symbols' },
        
        // Tech
        { icon: '🌐', label: 'Globe', category: 'Tech' },
        { icon: '💾', label: 'Save', category: 'Tech' },
        { icon: '🔍', label: 'Search', category: 'Tech' },
        { icon: '📱', label: 'Mobile', category: 'Tech' },
      ];

      const nodes = unicodeIcons.map((item, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        return {
          id: `unicode-${i}`,
          x: 120 + col * 160,
          y: 100 + row * 200,
          shape: 'circle' as const,
          size: 80,
          label: `${item.icon}\n${item.label}`, // Icon embedded in label
          labelPlacement: 'center' as const,
          style: {
            fill: '#ffffff',
            stroke: '#3498db',
            strokeWidth: 3,
            labelStyle: {
              fill: '#2c3e50',
              fontSize: 14,
              fontWeight: 'normal' as const,
              align: 'center',
            },
          },
        };
      });

      canvas.render({ nodes, edges: [] });

      // Add info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '10px';
      info.style.left = '10px';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '14px';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <strong>Unicode Icons & Symbols</strong><br/>
        <span style="color: #666;">Native system emojis and unicode characters</span><br/>
        <br/>
        Features:<br/>
        • Zero dependencies<br/>
        • Native rendering<br/>
        • Wide compatibility<br/>
        • Embedded in labels<br/>
        <br/>
        Categories:<br/>
        • Places & Objects<br/>
        • Geometric Shapes<br/>
        • Arrows & Symbols<br/>
        • Tech Icons<br/>
        <br/>
        <em>Icons move with nodes when panning!</em>
      `;
      container.style.position = 'relative';
      container.appendChild(info);
    });

    return container;
  },
};

/**
 * Mixed icon types with different shapes and styles
 */
export const MixedIconTypes: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.backgroundColor = '#f5f5f5';

    const canvas = new Canvas({
      container,
      width: 1200,
      height: 600,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      const mixedNodes = [
        // Row 1: Circles
        { id: 'u1', icon: '🎯', label: 'Goal', x: 200, y: 150, shape: 'circle' as const, color: '#e74c3c' },
        { id: 'u2', icon: '📈', label: 'Growth', x: 400, y: 150, shape: 'circle' as const, color: '#27ae60' },
        { id: 'u3', icon: '💡', label: 'Idea', x: 600, y: 150, shape: 'circle' as const, color: '#f39c12' },
        { id: 'u4', icon: '🚀', label: 'Launch', x: 800, y: 150, shape: 'circle' as const, color: '#9b59b6' },
        { id: 'u5', icon: '⭐', label: 'Star', x: 1000, y: 150, shape: 'circle' as const, color: '#f1c40f' },
        
        // Row 2: Rounded Rectangles
        { id: 'r1', icon: '📊', label: 'Analytics', x: 200, y: 350, shape: 'rect' as const, cornerRadius: 8, color: '#3498db' },
        { id: 'r2', icon: '🎨', label: 'Design', x: 400, y: 350, shape: 'rect' as const, cornerRadius: 8, color: '#e74c3c' },
        { id: 'r3', icon: '🔧', label: 'Tools', x: 600, y: 350, shape: 'rect' as const, cornerRadius: 8, color: '#95a5a6' },
        { id: 'r4', icon: '📱', label: 'Mobile', x: 800, y: 350, shape: 'rect' as const, cornerRadius: 8, color: '#16a085' },
        { id: 'r5', icon: '💻', label: 'Desktop', x: 1000, y: 350, shape: 'rect' as const, cornerRadius: 8, color: '#34495e' },
        
        // Row 3: Hexagons
        { id: 'h1', icon: '⚙️', label: 'Process', x: 200, y: 550, shape: 'hexagon' as const, color: '#16a085' },
        { id: 'h2', icon: '🎯', label: 'Target', x: 400, y: 550, shape: 'hexagon' as const, color: '#e67e22' },
        { id: 'h3', icon: '📦', label: 'Package', x: 600, y: 550, shape: 'hexagon' as const, color: '#95a5a6' },
        { id: 'h4', icon: '🔐', label: 'Secure', x: 800, y: 550, shape: 'hexagon' as const, color: '#c0392b' },
        { id: 'h5', icon: '🌐', label: 'Global', x: 1000, y: 550, shape: 'hexagon' as const, color: '#2980b9' },
      ];

      const nodes = mixedNodes.map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        shape: item.shape,
        size: 90,
        label: `${item.icon}\n${item.label}`,
        labelPlacement: 'center' as const,
        style: {
          fill: '#ffffff',
          stroke: item.color,
          strokeWidth: 3,
          labelStyle: {
            fill: item.color,
            fontSize: 14,
            fontWeight: 'bold' as const,
            align: 'center',
          },
        },
      }));

      canvas.render({ nodes, edges: [] });

      // Add info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '10px';
      info.style.right = '10px';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '14px';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <strong>Mixed Icon Types</strong><br/>
        <br/>
        <div style="margin: 8px 0;">
          <span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Circles</span><br/>
          Goals • Growth • Ideas • Launch • Stars
        </div>
        <div style="margin: 8px 0;">
          <span style="background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Rounded Rect</span><br/>
          Analytics • Design • Tools • Mobile • Desktop
        </div>
        <div style="margin: 8px 0;">
          <span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Hexagons</span><br/>
          Process • Target • Package • Secure • Global
        </div>
        <br/>
        <em>Unicode icons work with all shapes!</em>
      `;
      container.style.position = 'relative';
      container.appendChild(info);
    });

    return container;
  },
};

/**
 * Icon sizes comparison - proportional scaling
 */
export const IconSizes: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '500px';
    container.style.backgroundColor = '#f5f5f5';

    const canvas = new Canvas({
      container,
      width: 1200,
      height: 500,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      const sizes = [
        { size: 60, iconSize: 24, textSize: 10, label: 'Small', x: 150 },
        { size: 80, iconSize: 32, textSize: 11, label: 'Medium', x: 350 },
        { size: 100, iconSize: 40, textSize: 12, label: 'Large', x: 550 },
        { size: 120, iconSize: 48, textSize: 14, label: 'X-Large', x: 750 },
        { size: 140, iconSize: 56, textSize: 16, label: 'XX-Large', x: 950 },
      ];

      const nodes = sizes.map((s, i) => ({
        id: `size-${i}`,
        x: s.x,
        y: 250,
        shape: 'circle' as const,
        size: s.size,
        label: `⚙️\n${s.label}`,
        labelPlacement: 'center' as const,
        style: {
          fill: '#ffffff',
          stroke: '#3498db',
          strokeWidth: 3,
          labelStyle: {
            fill: '#2c3e50',
            fontSize: s.textSize,
            fontWeight: 'bold' as const,
            align: 'center',
          },
        },
      }));

      canvas.render({ nodes, edges: [] });

      // Add info
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '50%';
      info.style.left = '50%';
      info.style.transform = 'translate(-50%, -200px)';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px 24px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '14px';
      info.style.textAlign = 'center';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <strong style="font-size: 16px;">Proportional Icon Scaling</strong><br/>
        <span style="color: #666;">Icon size: 40% of node size</span><br/>
        <br/>
        <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          iconSize = nodeSize * 0.4
        </code>
      `;
      container.style.position = 'relative';
      container.appendChild(info);
    });

    return container;
  },
};

/**
 * Custom icon sizing strategies
 */
export const CustomIconSizing: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '700px';
    container.style.backgroundColor = '#f5f5f5';

    const canvas = new Canvas({
      container,
      width: 1400,
      height: 700,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      // Different sizing strategies
      const strategies = [
        // Row 1: Fixed size (icons don't scale with node)
        { id: 'f1', icon: '🎯', label: 'Fixed\n24px', size: 60, iconFontSize: 24, strategy: 'fixed', color: '#e74c3c' },
        { id: 'f2', icon: '🎯', label: 'Fixed\n24px', size: 80, iconFontSize: 24, strategy: 'fixed', color: '#e74c3c' },
        { id: 'f3', icon: '🎯', label: 'Fixed\n24px', size: 100, iconFontSize: 24, strategy: 'fixed', color: '#e74c3c' },
        { id: 'f4', icon: '🎯', label: 'Fixed\n24px', size: 120, iconFontSize: 24, strategy: 'fixed', color: '#e74c3c' },
        
        // Row 2: Proportional (40% of node size)
        { id: 'p1', icon: '📊', label: 'Proportional\n40%', size: 60, iconFontSize: 24, strategy: 'proportional', color: '#3498db' },
        { id: 'p2', icon: '📊', label: 'Proportional\n40%', size: 80, iconFontSize: 32, strategy: 'proportional', color: '#3498db' },
        { id: 'p3', icon: '📊', label: 'Proportional\n40%', size: 100, iconFontSize: 40, strategy: 'proportional', color: '#3498db' },
        { id: 'p4', icon: '📊', label: 'Proportional\n40%', size: 120, iconFontSize: 48, strategy: 'proportional', color: '#3498db' },
        
        // Row 3: Clamped (min 20px, max 50px)
        { id: 'c1', icon: '⚙️', label: 'Clamped\n20-50px', size: 60, iconFontSize: 24, strategy: 'clamped', color: '#27ae60' },
        { id: 'c2', icon: '⚙️', label: 'Clamped\n20-50px', size: 80, iconFontSize: 32, strategy: 'clamped', color: '#27ae60' },
        { id: 'c3', icon: '⚙️', label: 'Clamped\n20-50px', size: 100, iconFontSize: 40, strategy: 'clamped', color: '#27ae60' },
        { id: 'c4', icon: '⚙️', label: 'Clamped\n20-50px', size: 120, iconFontSize: 48, strategy: 'clamped', color: '#27ae60' },
        
        // Row 4: Stepped (discrete sizes)
        { id: 's1', icon: '🔔', label: 'Stepped\nSmall', size: 60, iconFontSize: 20, strategy: 'stepped', color: '#f39c12' },
        { id: 's2', icon: '🔔', label: 'Stepped\nMedium', size: 80, iconFontSize: 28, strategy: 'stepped', color: '#f39c12' },
        { id: 's3', icon: '🔔', label: 'Stepped\nLarge', size: 100, iconFontSize: 36, strategy: 'stepped', color: '#f39c12' },
        { id: 's4', icon: '🔔', label: 'Stepped\nX-Large', size: 120, iconFontSize: 44, strategy: 'stepped', color: '#f39c12' },
      ];

      const nodes = strategies.map((item, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        
        // Calculate icon font size separately from label text
        let displayIcon = item.icon;
        
        return {
          id: item.id,
          x: 220 + col * 280,
          y: 120 + row * 160,
          shape: 'circle' as const,
          size: item.size,
          label: `${displayIcon}\n${item.label}`,
          labelPlacement: 'center' as const,
          style: {
            fill: '#ffffff',
            stroke: item.color,
            strokeWidth: 3,
            labelStyle: {
              fill: item.color,
              fontSize: 9,
              fontWeight: 'normal' as const,
              align: 'center',
            },
          },
        };
      });

      canvas.render({ nodes, edges: [] });

      // Add info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '10px';
      info.style.left = '10px';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '13px';
      info.style.zIndex = '1000';
      info.style.maxWidth = '320px';
      info.innerHTML = `
        <strong>Icon Sizing Strategies</strong><br/>
        <br/>
        <div style="margin: 8px 0;">
          <span style="color: #e74c3c;">●</span> <strong>Fixed</strong><br/>
          <code style="font-size: 11px;">iconSize = 24</code><br/>
          <em style="font-size: 11px; color: #666;">Same size regardless of node</em>
        </div>
        
        <div style="margin: 8px 0;">
          <span style="color: #3498db;">●</span> <strong>Proportional</strong><br/>
          <code style="font-size: 11px;">iconSize = nodeSize * 0.4</code><br/>
          <em style="font-size: 11px; color: #666;">Scales with node size</em>
        </div>
        
        <div style="margin: 8px 0;">
          <span style="color: #27ae60;">●</span> <strong>Clamped</strong><br/>
          <code style="font-size: 11px;">clamp(20, nodeSize * 0.4, 50)</code><br/>
          <em style="font-size: 11px; color: #666;">Min 20px, max 50px</em>
        </div>
        
        <div style="margin: 8px 0;">
          <span style="color: #f39c12;">●</span> <strong>Stepped</strong><br/>
          <code style="font-size: 11px;">sizes[bucket(nodeSize)]</code><br/>
          <em style="font-size: 11px; color: #666;">Discrete size levels</em>
        </div>
        
        <br/>
        <strong>Usage Example:</strong>
        <pre style="background: #f8f8f8; padding: 8px; border-radius: 4px; font-size: 10px; overflow-x: auto;">
fontSize: nodeSize * 0.4 // Proportional
fontSize: Math.max(20, 
  Math.min(50, nodeSize * 0.4)) // Clamped</pre>
      `;
      container.style.position = 'relative';
      container.appendChild(info);
    });

    return container;
  },
};

/**
 * Icon-only nodes (no text labels)
 */
export const IconOnlyNodes: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.backgroundColor = '#f5f5f5';

    const canvas = new Canvas({
      container,
      width: 1200,
      height: 600,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      const iconNodes = [
        { icon: '🏠', size: 70, color: '#e74c3c', x: 150, y: 150 },
        { icon: '👤', size: 85, color: '#3498db', x: 300, y: 150 },
        { icon: '⚙️', size: 100, color: '#95a5a6', x: 450, y: 150 },
        { icon: '📊', size: 115, color: '#9b59b6', x: 600, y: 150 },
        { icon: '🔔', size: 130, color: '#f39c12', x: 750, y: 150 },
        { icon: '📧', size: 145, color: '#1abc9c', x: 900, y: 150 },
        { icon: '🚀', size: 90, color: '#e67e22', x: 225, y: 350 },
        { icon: '💡', size: 105, color: '#f1c40f', x: 375, y: 350 },
        { icon: '🎯', size: 120, color: '#16a085', x: 525, y: 350 },
        { icon: '⭐', size: 95, color: '#8e44ad', x: 675, y: 350 },
        { icon: '🔒', size: 110, color: '#c0392b', x: 825, y: 350 },
        { icon: '🌐', size: 125, color: '#2980b9', x: 975, y: 350 },
      ];

      const nodes = iconNodes.map((item, i) => ({
        id: `icon-only-${i}`,
        x: item.x,
        y: item.y,
        shape: 'circle' as const,
        size: item.size,
        label: item.icon, // Just the icon, no text
        labelPlacement: 'center' as const,
        style: {
          fill: '#ffffff',
          stroke: item.color,
          strokeWidth: 4,
          labelStyle: {
            fill: item.color,
            fontSize: Math.floor(item.size * 0.45), // Icon is 45% of node size
            fontWeight: 'normal' as const,
          },
        },
      }));

      canvas.render({ nodes, edges: [] });

      // Add info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '10px';
      info.style.right = '10px';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '14px';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <strong>Icon-Only Nodes</strong><br/>
        <span style="color: #666;">Large icons without text labels</span><br/>
        <br/>
        Configuration:<br/>
        • Icon size: 45% of node<br/>
        • No text labels<br/>
        • Varied node sizes<br/>
        • Color-matched borders<br/>
        <br/>
        Perfect for:<br/>
        • Visual dashboards<br/>
        • Quick recognition<br/>
        • Space-constrained UIs<br/>
        <br/>
        <em>Hover shows tooltips!</em>
      `;
      container.style.position = 'relative';
      container.appendChild(info);
    });

    return container;
  },
};

/**
 * Icons filling the entire node shape
 */
export const FullSizeIcons: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.backgroundColor = '#f5f5f5';

    const canvas = new Canvas({
      container,
      width: 1200,
      height: 600,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      const fullSizeIcons = [
        // Row 1: Large icons with circles
        { icon: '🎨', size: 100, color: '#e74c3c', x: 150, y: 150, shape: 'circle' as const },
        { icon: '🚀', size: 100, color: '#3498db', x: 350, y: 150, shape: 'circle' as const },
        { icon: '⚡', size: 100, color: '#f39c12', x: 550, y: 150, shape: 'circle' as const },
        { icon: '🎯', size: 100, color: '#9b59b6', x: 750, y: 150, shape: 'circle' as const },
        { icon: '💎', size: 100, color: '#1abc9c', x: 950, y: 150, shape: 'circle' as const },
        
        // Row 2: Large icons with rounded rectangles
        { icon: '🔥', size: 100, color: '#e67e22', x: 150, y: 350, shape: 'rect' as const, cornerRadius: 8 },
        { icon: '⭐', size: 100, color: '#f1c40f', x: 350, y: 350, shape: 'rect' as const, cornerRadius: 8 },
        { icon: '💡', size: 100, color: '#27ae60', x: 550, y: 350, shape: 'rect' as const, cornerRadius: 8 },
        { icon: '🎵', size: 100, color: '#8e44ad', x: 750, y: 350, shape: 'rect' as const, cornerRadius: 8 },
        { icon: '🌟', size: 100, color: '#16a085', x: 950, y: 350, shape: 'rect' as const, cornerRadius: 8 },
      ];

      const nodes = fullSizeIcons.map((item, i) => ({
        id: `full-size-${i}`,
        x: item.x,
        y: item.y,
        shape: item.shape,
        size: item.size,
        label: item.icon,
        labelPlacement: 'center' as const,
        style: {
          fill: '#ffffff',
          stroke: item.color,
          strokeWidth: 4,
          labelStyle: {
            fill: item.color,
            fontSize: Math.floor(item.size * 0.75), // Icon is 75% of node - nearly fills it
            fontWeight: 'normal' as const,
          },
        },
      }));

      canvas.render({ nodes, edges: [] });

      // Add info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '10px';
      info.style.left = '10px';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '14px';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <strong>Full-Size Icons</strong><br/>
        <span style="color: #666;">Icons filling entire node shapes</span><br/>
        <br/>
        Configuration:<br/>
        • Icon size: <strong>75% of node</strong><br/>
        • Maximum visual impact<br/>
        • Minimal padding<br/>
        • No text labels<br/>
        <br/>
        Formula:<br/>
        <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          fontSize = nodeSize * 0.75
        </code><br/>
        <br/>
        Use cases:<br/>
        • App launchers<br/>
        • Navigation menus<br/>
        • Status indicators<br/>
        • Icon grids<br/>
        <br/>
        <em>Icons scale perfectly with nodes!</em>
      `;
      container.style.position = 'relative';
      container.appendChild(info);
    });

    return container;
  },
};
