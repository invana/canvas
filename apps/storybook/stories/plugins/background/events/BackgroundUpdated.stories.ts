/**
 * Background — Events — background:updated
 *
 * Live demo of `'background:updated'`. Every `setOptions()` call emits an
 * event with the partial diff (`changes`) and the resolved options after
 * the update. Events are logged to the Storybook Actions panel.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { action } from 'storybook/actions';
import GUI from 'lil-gui';
import {
  Canvas,
  BackgroundPlugin,
  type BackgroundOptions,
  type BackgroundType,
  type PatternType,
  type BackgroundUpdatedEvent,
} from '@invana/canvas';
import { GraphDataPlugin, type IGraphStyles } from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
import { createContainer } from '../../../../src/div-utils.js';
import { buildTreeGraphData } from '../themes/_themes.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);
Canvas.registerPlugin('layout-d3-force', D3ForceLayoutPlugin);

const styles: IGraphStyles = {
  node: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
  edge: { stroke: '#58a6ff', strokeWidth: 2 },
};

const meta: Meta = { title: 'Plugins/Background/Events' };
export default meta;
type Story = StoryObj;

export const BackgroundUpdated: Story = {
  name: 'background:updated',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      backgroundColor: '#1a1a2e',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'dots',
            color: '#595959',
            backgroundColor: '#1a1a2e',
            size: 1.5,
            spacing: 30,
            alpha: 0.6,
          } satisfies BackgroundOptions,
        },
        {
          plugin: 'graph-data',
          key: 'graph-data',
          options: { styles },
        },
        {
          plugin: 'layout-d3-force',
          options: { charge: -250, linkDistance: 60, animate: true },
        },
      ],
    });

    const logBackgroundUpdated = action('background:updated');

    canvas.events.on('background:updated', (e: BackgroundUpdatedEvent) => {
      logBackgroundUpdated(e);
    });

    await canvas.init();
    const bg = canvas.plugins.get<BackgroundPlugin>('bg')!;
    const graph = canvas.plugins.get<GraphDataPlugin>('graph-data')!;
    const layout = canvas.plugins.get<D3ForceLayoutPlugin>('layout-d3-force')!;

    graph.setData(buildTreeGraphData());
    await layout.start();
    setTimeout(() => graph.fitContent(60), 1500);

    const params = {
      type: 'pattern' as BackgroundType,
      patternType: 'dots' as PatternType,
      color: '#595959',
      backgroundColor: '#1a1a2e',
      size: 1.5,
      spacing: 30,
      alpha: 0.6,
      followCamera: false,
    };

    const gui = new GUI({ title: 'setOptions(...)', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    gui.add(params, 'type', ['solid', 'pattern']).name('type').onChange((v: BackgroundType) => bg.setOptions({ type: v }));
    gui.add(params, 'patternType', ['dots', 'grid', 'lines']).name('patternType').onChange((v: PatternType) => bg.setOptions({ patternType: v }));
    gui.addColor(params, 'backgroundColor').name('backgroundColor').onChange((v: string) => bg.setOptions({ backgroundColor: v }));
    gui.addColor(params, 'color').name('color').onChange((v: string) => bg.setOptions({ color: v }));
    gui.add(params, 'size', 0.5, 8, 0.5).name('size').onChange((v: number) => bg.setOptions({ size: v }));
    gui.add(params, 'spacing', 5, 100, 2).name('spacing').onChange((v: number) => bg.setOptions({ spacing: v }));
    gui.add(params, 'alpha', 0, 1, 0.05).name('alpha').onChange((v: number) => bg.setOptions({ alpha: v }));
    gui.add(params, 'followCamera').name('followCamera').onChange((v: boolean) => bg.setOptions({ followCamera: v }));
  },
};
