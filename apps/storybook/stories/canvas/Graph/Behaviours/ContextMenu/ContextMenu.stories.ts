import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ContextMenuBehaviour,
  type ContextMenuEvent,
  type ContextMenuTargetType,
  GraphCanvas,
  GraphLayer,
  type GraphNode,
  type GraphEdge,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Behaviours/ContextMenu/ContextMenu' };
export default meta;
type Story = StoryObj;

export const ContextMenu: Story = {
  render: () => createContainer({ id: 'graph-context-menu' }),

  play: async ({ canvasElement }) => {
    // ─── Data — literal per-item; shared styling lives in canvasOptions ──────
    const nodes: GraphNode[] = [
      { id: 'a', position: { x: -160, y: -80 }, data: { label: 'Alpha' }, style: { labelText: 'Alpha' } },
      { id: 'b', position: { x: 0, y: -120 }, data: { label: 'Beta' }, style: { labelText: 'Beta' } },
      { id: 'c', position: { x: 160, y: -60 }, data: { label: 'Gamma' }, style: { labelText: 'Gamma' } },
      { id: 'd', position: { x: -120, y: 90 }, data: { label: 'Delta' }, style: { labelText: 'Delta' } },
      { id: 'e', position: { x: 60, y: 120 }, data: { label: 'Epsilon' }, style: { labelText: 'Epsilon' } },
    ];
    const edges: GraphEdge[] = [
      { id: 'a-b', source: 'a', target: 'b', data: { rel: 'links' } },
      { id: 'b-c', source: 'b', target: 'c', data: { rel: 'links' } },
      { id: 'a-d', source: 'a', target: 'd', data: { rel: 'links' } },
      { id: 'd-e', source: 'd', target: 'e', data: { rel: 'links' } },
      { id: 'b-e', source: 'b', target: 'e', data: { rel: 'links' } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-context-menu')!;
    container.style.position = 'relative'; // anchor the absolutely-positioned menu

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Data is content — it rides on the layer via initData.
    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    // GUI state — declared up front so the menu callbacks below can update it.
    // (`gui` itself is created later and forward-referenced, as in the
    // ClickSelect story — only touched inside callbacks at click time.)
    const settings = {
      enable: true,
      node: true,
      edge: true,
      canvas: true,
      target: '—',
      'last action': '—',
    };

    // ─── Menu overlay (consumer-owned DOM; the behaviour is headless) ───────
    const menu = document.createElement('div');
    menu.style.cssText =
      'position:absolute; min-width:140px; padding:4px; display:none; z-index:1000; ' +
      'background:rgba(15,23,42,.96); border:1px solid #334155; border-radius:6px; ' +
      'box-shadow:0 6px 20px rgba(0,0,0,.4); font:13px/1.4 ui-sans-serif, system-ui;';
    container.appendChild(menu);

    const hideMenu = (): void => {
      menu.style.display = 'none';
    };
    const showMenu = (x: number, y: number, items: string[]): void => {
      menu.replaceChildren();
      for (const label of items) {
        const item = document.createElement('button');
        item.textContent = label;
        item.style.cssText =
          'display:block; width:100%; text-align:left; padding:6px 10px; border:0; ' +
          'background:transparent; color:#e2e8f0; cursor:pointer; border-radius:4px;';
        item.addEventListener('mouseenter', () => (item.style.background = '#1e293b'));
        item.addEventListener('mouseleave', () => (item.style.background = 'transparent'));
        item.addEventListener('click', () => {
          settings['last action'] = label;
          gui.controllersRecursive().forEach((c) => c.updateDisplay());
          hideMenu();
        });
        menu.appendChild(item);
      }
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      menu.style.display = 'block';
    };

    // Dismiss on outside-click and Escape.
    const onDocPointerDown = (ev: PointerEvent): void => {
      if (!menu.contains(ev.target as Node)) hideMenu();
    };
    const onKeyDown = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') hideMenu();
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onKeyDown);
    onStoryTeardown(() => document.removeEventListener('pointerdown', onDocPointerDown));
    onStoryTeardown(() => document.removeEventListener('keydown', onKeyDown));

    // ─── The behaviour ──────────────────────────────────────────────────────
    const itemsFor: Record<ContextMenuTargetType, string[]> = {
      node: ['Pin node', 'Expand neighbours', 'Delete node'],
      edge: ['Reverse edge', 'Delete edge'],
      canvas: ['Add node here', 'Fit to content'],
    };
    const onContextMenu = (e: ContextMenuEvent): void => {
      const label =
        e.targetType === 'canvas' ? 'canvas' : `${e.targetType} "${e.id}"`;
      settings.target = label;
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
      showMenu(e.screen.x, e.screen.y, itemsFor[e.targetType]);
    };

    // state + onContextMenu (function) stay in the constructor; enabled → config.
    const ctxMenu = new ContextMenuBehaviour({
      id: 'context-menu',
      layerId: 'graph',
      state: 'context-open',
      onContextMenu,
    });
    canvas.behaviours.register(ctxMenu);

    // ─── One serialisable config; init() last ────────────────────────────────
    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 22 },
              bgFill: 0x3b82f6,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 2,
              labelColor: 0xf8fafc,
              labelFontSize: 12,
              labelPlacement: 'center',
            },
            // Transient state the behaviour toggles on the right-clicked node.
            state: { 'context-open': { bgStrokeColor: 0xf97316, bgStrokeWidth: 4 } },
          },
          edge: {
            style: { strokeColor: 0xcbd5e1, strokeWidth: 2, arrowTargetShape: 'none' },
            state: { 'context-open': { strokeColor: 0xf97316, strokeWidth: 4 } },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'context-menu': { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 100);

    // ─── lil-gui ─────────────────────────────────────────────────────────────
    const applyTargets = (): void => {
      const targets: ContextMenuTargetType[] = [];
      if (settings.node) targets.push('node');
      if (settings.edge) targets.push('edge');
      if (settings.canvas) targets.push('canvas');
      ctxMenu.setOptions({ targets });
    };

    const gui = new GUI({ title: 'Context Menu' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enable').onChange((on: boolean) => {
      if (on) ctxMenu.enable();
      else {
        ctxMenu.disable();
        hideMenu();
      }
    });
    const targetsFolder = gui.addFolder('targets');
    targetsFolder.add(settings, 'node').onChange(applyTargets);
    targetsFolder.add(settings, 'edge').onChange(applyTargets);
    targetsFolder.add(settings, 'canvas').onChange(applyTargets);
    gui.add(settings, 'target').disable();
    gui.add(settings, 'last action').disable();
  },
};
