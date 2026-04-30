/**
 * ELK Layered Layout — Research Lab Org Chart
 *
 * A hierarchical org chart of a fictional research lab rendered with
 * ElkLayoutPlugin using the `layered` algorithm (LEFT→RIGHT direction).
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { ElkLayoutPlugin } from '@invana/plugin-layouts-elkjs';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: 'Layouts/ELK/Org Chart Scientists' };
export default meta;
type Story = StoryObj;

interface Scientist {
  id: string;
  name: string;
  role: 'pi' | 'postdoc' | 'phd' | 'undergrad';
}

const SCIENTISTS: Scientist[] = [
  // Principal Investigators
  { id: 'dr-chen', name: 'Dr. Ava Chen', role: 'pi' },
  { id: 'dr-rodriguez', name: 'Dr. Mateo Rodriguez', role: 'pi' },

  // Postdocs
  { id: 'dr-kim', name: 'Dr. Ji-soo Kim', role: 'postdoc' },
  { id: 'dr-patel', name: 'Dr. Anika Patel', role: 'postdoc' },
  { id: 'dr-novak', name: 'Dr. Lukas Novak', role: 'postdoc' },

  // PhD students
  { id: 'sam-okafor', name: 'Sam Okafor', role: 'phd' },
  { id: 'yuki-tanaka', name: 'Yuki Tanaka', role: 'phd' },
  { id: 'lea-schmidt', name: 'Lea Schmidt', role: 'phd' },
  { id: 'ari-mehra', name: 'Ari Mehra', role: 'phd' },
  { id: 'nina-petrov', name: 'Nina Petrov', role: 'phd' },

  // Undergrad researchers
  { id: 'jordan-lee', name: 'Jordan Lee', role: 'undergrad' },
  { id: 'talia-brown', name: 'Talia Brown', role: 'undergrad' },
  { id: 'max-voss', name: 'Max Voss', role: 'undergrad' },
  { id: 'priya-singh', name: 'Priya Singh', role: 'undergrad' },
  { id: 'noah-dubois', name: 'Noah Dubois', role: 'undergrad' },
];

const EDGES: { source: string; target: string }[] = [
  // PI → Postdoc
  { source: 'dr-chen', target: 'dr-kim' },
  { source: 'dr-chen', target: 'dr-patel' },
  { source: 'dr-rodriguez', target: 'dr-novak' },

  // Postdoc → PhD
  { source: 'dr-kim', target: 'sam-okafor' },
  { source: 'dr-kim', target: 'yuki-tanaka' },
  { source: 'dr-patel', target: 'lea-schmidt' },
  { source: 'dr-patel', target: 'ari-mehra' },
  { source: 'dr-novak', target: 'nina-petrov' },

  // PhD → Undergrad assistants
  { source: 'sam-okafor', target: 'jordan-lee' },
  { source: 'sam-okafor', target: 'talia-brown' },
  { source: 'yuki-tanaka', target: 'max-voss' },
  { source: 'lea-schmidt', target: 'priya-singh' },
  { source: 'ari-mehra', target: 'noah-dubois' },
];

const ROLE_COLORS: Record<Scientist['role'], { fill: string; stroke: string; labelColor: string }> = {
  pi:       { fill: '#f97316', stroke: '#fdba74', labelColor: '#fff7ed' },
  postdoc:  { fill: '#8b5cf6', stroke: '#c4b5fd', labelColor: '#f5f3ff' },
  phd:      { fill: '#0ea5e9', stroke: '#7dd3fc', labelColor: '#f0f9ff' },
  undergrad:{ fill: '#10b981', stroke: '#6ee7b7', labelColor: '#ecfdf5' },
};

export const OrgChartScientists: Story = {
  name: 'Research Lab Org Chart (layered, RIGHT)',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width:  container.clientWidth  || 1200,
      height: container.clientHeight || 800,
      backgroundColor: '#0f172a',
    });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg',
      type: 'pattern',
      patternType: 'dots',
      color: '#1e293b',
      backgroundColor: '#0f172a',
      size: 1,
      spacing: 30,
    }));

    const graph = new GraphDataPlugin({ key: 'graph-data' });
    await canvas.plugins.register(graph);

    const roleOf = (id: string) => SCIENTISTS.find(s => s.id === id)?.role ?? 'undergrad';

    graph.setStyles({
      node: {
        fill:        n => ROLE_COLORS[roleOf(n.id)].fill,
        stroke:      n => ROLE_COLORS[roleOf(n.id)].stroke,
        strokeWidth: () => 2,
        labelColor:  n => ROLE_COLORS[roleOf(n.id)].labelColor,
        labelSize: () => 11,
      },
      edge: {
        stroke:      () => '#334155',
        strokeWidth: () => 1.5,
      },
    });

    const layout = new ElkLayoutPlugin({
      algorithm: 'layered',
      layoutOptions: {
        'elk.direction':                             'RIGHT',
        'elk.spacing.nodeNode':                      '50',
        'elk.layered.spacing.nodeNodeBetweenLayers': '80',
        'elk.layered.nodePlacement.strategy':        'NETWORK_SIMPLEX',
      },
      defaultNodeWidth:  140,
      defaultNodeHeight: 44,
    });
    await canvas.plugins.register(layout);

    graph.setData({
      nodes: SCIENTISTS.map(s => ({
        id:          s.id,
        label:       s.name,
        shape:       'rect' as const,
        data:        { width: 140, height: 44 },
        interactive: true,
        draggable:   true,
      })),
      edges: EDGES.map((e, i) => ({
        id:       `e-${i}`,
        source:   e.source,
        target:   e.target,
        pathType: 'orthogonal' as const,
      })),
    });

    await layout.run();
    graph.fitContent(60);
  },
};
