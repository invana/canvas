import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  HoverElementPreviewBehaviour,
  type HoverElementPreviewCardSpec,
  type PreviewPlacement,
  type PreviewRowFormat,
  type PreviewRowSpec,
  type PreviewSnapshot,
  type GraphElementKind,
  type ResolvedPreviewCard,
  GraphCanvas,
  GraphLayer,
  type GraphNode,
  type GraphEdge
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/HoverElementPreview/HoverElementPreview' };
export default meta;
type Story = StoryObj;

export const HoverElementPreviewStory: Story = {
  name: 'HoverElementPreview',
  render: () => createContainer({ id: 'graph-element-preview' }),

  play: async ({ canvasElement }) => {
    // ─── Data — literal per-item; shared styling lives in canvasOptions ──────
    // Each node carries an identity payload (name / description / email / score /
    // avatar) the preview card resolves by field path. Edges carry a lighter
    // payload — the SAME card degrades gracefully (no avatar, no email row).
    // UUID-length ids + a long Neo4j-style multi-label type, to show how the
    // header strip handles overflow (it truncates the id + caps the type).
    const nodes: GraphNode[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        position: { x: -170, y: -70 },
        type: 'Person:Scientist:HistoricalFigure',
        data: {
          name: 'Ada Lovelace',
          description: 'Mathematician and writer, credited as the first computer programmer.',
          email: 'ada@analytical.engine',
          score: 0.98,
          avatar: 'https://i.pravatar.cc/96?img=5'
        },
        style: { labelText: 'Ada' }
      },
      {
        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        position: { x: 10, y: -120 },
        type: 'Person:Scientist:HistoricalFigure',
        data: {
          name: 'Alan Turing',
          description: 'Pioneer of theoretical computer science and artificial intelligence.',
          email: 'alan@turing.machine',
          score: 0.99,
          avatar: 'https://i.pravatar.cc/96?img=12'
        },
        style: { labelText: 'Alan' }
      },
      {
        id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        position: { x: 180, y: -50 },
        type: 'Person:Scientist:HistoricalFigure',
        data: {
          name: 'Grace Hopper',
          description: 'Computer scientist; popularised machine-independent programming languages.',
          email: 'grace@cobol.dev',
          score: 0.95,
          avatar: 'https://i.pravatar.cc/96?img=47'
        },
        style: { labelText: 'Grace' }
      },
      {
        id: '9f8e7d6c-5b4a-3c2d-1e0f-a9b8c7d6e5f4',
        position: { x: -90, y: 100 },
        type: 'Person:Scientist:HistoricalFigure',
        data: {
          name: 'Edsger Dijkstra',
          description: 'Foundational contributions to algorithms and structured programming.',
          email: 'edsger@shortest.path',
          score: 0.93,
          avatar: 'https://i.pravatar.cc/96?img=33'
        },
        style: { labelText: 'Edsger' }
      },
      {
        id: '110ec58a-a0f2-4ac4-8393-c866d813b8d1',
        position: { x: 110, y: 120 },
        type: 'Person:Scientist:HistoricalFigure',
        data: {
          name: 'Katherine Johnson',
          description: 'Orbital-mechanics calculations critical to early US crewed spaceflight.',
          email: 'katherine@orbit.nasa',
          score: 0.97,
          avatar: 'https://i.pravatar.cc/96?img=20'
        },
        style: { labelText: 'Katherine' }
      },
    ];
    const edges: GraphEdge[] = [
      { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', source: '550e8400-e29b-41d4-a716-446655440000', target: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', type: 'INFLUENCED_THE_WORK_OF', data: { name: 'INFLUENCES', description: 'Foundational ideas carried forward.', score: 0.7 } },
      { id: '16fd2706-8baf-433b-82eb-8c7fada847da', source: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', target: '7c9e6679-7425-40de-944b-e07fc1f90ae7', type: 'COLLABORATED_WITH', data: { name: 'COLLABORATES', description: 'Worked toward practical computing.', score: 0.6 } },
      { id: '3f333df6-90a4-4fda-8dd3-9485d27cee36', source: '550e8400-e29b-41d4-a716-446655440000', target: '9f8e7d6c-5b4a-3c2d-1e0f-a9b8c7d6e5f4', type: 'INFLUENCED_THE_WORK_OF', data: { name: 'INFLUENCES', description: 'Algorithmic rigour.', score: 0.8 } },
      { id: '21f7f8de-8051-5b89-8680-0195ef798b6a', source: '9f8e7d6c-5b4a-3c2d-1e0f-a9b8c7d6e5f4', target: '110ec58a-a0f2-4ac4-8393-c866d813b8d1', type: 'COLLABORATED_WITH', data: { name: 'COLLABORATES', description: 'Numerical methods.', score: 0.5 } },
      { id: '0d8fb9a7-7c3e-4e9a-bb2f-2c6f3a1d5e80', source: '7c9e6679-7425-40de-944b-e07fc1f90ae7', target: '110ec58a-a0f2-4ac4-8393-c866d813b8d1', type: 'COLLABORATED_WITH', data: { name: 'COLLABORATES', description: 'Applied computation.', score: 0.65 } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-element-preview')!;
    container.style.position = 'relative'; // anchor the absolutely-positioned card

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Data is content — it rides on the layer via initData.
    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    // ─── The serializable preview-card spec (display-settings JSON) ──────────
    // Identity-card layout: id · type header → image-left / title + subtitle
    // right → property rows below a divider. `id` + `type` are structural (no
    // field needed). The same spec is used for nodes and edges; fields that
    // don't resolve (avatar / email on edges) are simply dropped. Every knob
    // below is exposed in the GUI — `buildCardSpec()` re-assembles this object
    // from `settings` on each change and pushes it via `canvas.update(...)`.
    //
    // Full option surface (all serializable JSON):
    //   {
    //     image?:    { field: string; shape?: 'rounded' | 'circle' },  // omit → no-image version
    //     title?:    { field: string },
    //     subtitle?: { field: string; maxLines?: number },
    //     rows?:     { label: string; field: string; format?: 'text' | 'percent' }[],
    //   }
    // and behaviour-level: { targets, openDelay, closeDelay, placement, enabled }.

    // ─── Card overlay (consumer-owned DOM; the behaviour is headless) ────────
    const card = document.createElement('div');
    card.style.cssText =
      'position:absolute; display:none; width:320px; z-index:1000; padding:12px; ' +
      'box-sizing:border-box; pointer-events:auto; user-select:text; ' + // interactive by default
      'background:rgba(15,23,42,.97); border:1px solid #334155; border-radius:10px; ' +
      'box-shadow:0 10px 30px rgba(0,0,0,.45); color:#e2e8f0; ' +
      'font:13px/1.45 ui-sans-serif, system-ui;';
    container.appendChild(card);

    const renderCard = (snapshot: PreviewSnapshot): void => {
      const c: ResolvedPreviewCard = snapshot.card;
      card.replaceChildren();

      // Identity row — image left, title + subtitle right. Optional: `id` /
      // `type` now live in the rows below, so an element with no image / title /
      // subtitle renders rows only.
      const hasIdentity = !!(c.imageUrl || c.title || c.subtitle);
      if (hasIdentity) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; gap:10px; align-items:flex-start;';

        if (c.imageUrl) {
          const img = document.createElement('img');
          img.src = c.imageUrl;
          img.style.cssText =
            `width:48px; height:48px; flex:0 0 auto; object-fit:cover; ` +
            `border-radius:${c.imageShape === 'circle' ? '50%' : '8px'}; background:#1e293b;`;
          // Image is optional — collapse the column if it fails to load.
          img.addEventListener('error', () => img.remove());
          row.appendChild(img);
        }

        const textCol = document.createElement('div');
        textCol.style.cssText = 'min-width:0; flex:1 1 auto;';
        if (c.title) {
          const title = document.createElement('div');
          title.style.cssText = 'font-size:14px; font-weight:600; color:#f8fafc;';
          title.textContent = c.title;
          textCol.appendChild(title);
        }
        if (c.subtitle) {
          const subtitle = document.createElement('div');
          subtitle.style.cssText =
            `margin-top:2px; color:#cbd5e1; font-size:12px; overflow:hidden; ` +
            `display:-webkit-box; -webkit-box-orient:vertical; ` +
            `-webkit-line-clamp:${c.subtitleMaxLines};`;
          subtitle.textContent = c.subtitle;
          textCol.appendChild(subtitle);
        }
        row.appendChild(textCol);
        card.appendChild(row);
      }

      // Rows — `id` / `type` first (auto-added by resolvePreviewCard), then the
      // spec rows. The divider only shows when an identity block sits above.
      if (c.rows.length > 0) {
        if (hasIdentity) {
          const divider = document.createElement('div');
          divider.style.cssText = 'height:1px; background:#334155; margin:10px 0;';
          card.appendChild(divider);
        }
        for (const r of c.rows) {
          const line = document.createElement('div');
          line.style.cssText = 'display:flex; justify-content:space-between; gap:12px; padding:2px 0;';
          const label = document.createElement('span');
          label.style.cssText = 'color:#94a3b8; flex:0 0 auto;';
          label.textContent = r.label;
          const value = document.createElement('span');
          value.style.cssText =
            'color:#e2e8f0; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
          value.textContent = r.value;
          value.title = r.value;
          line.appendChild(label);
          line.appendChild(value);
          card.appendChild(line);
        }
      }
    };

    // Collision-aware positioning (consumer-owned, like Floating UI): the card
    // is measured here, so this is where `'auto'` resolves and where the card is
    // flipped inward / clamped on-screen near corners and edges. The headless
    // behaviour only hands us the anchor + placement hint.
    // The snapshot currently on screen — kept so GUI layout edits (width / gap /
    // edge margin) can re-run the positioner against the live card.
    let shownSnapshot: PreviewSnapshot | null = null;

    const positionCard = (snapshot: PreviewSnapshot): void => {
      const { x, y } = snapshot.screen;
      const gap = settings.gap; // px between the anchor and the card
      const edge = settings.edgeMargin; // px min gap from the container edge
      const cw = card.offsetWidth;
      const ch = card.offsetHeight;
      const W = container.clientWidth;
      const H = container.clientHeight;

      // Resolve `'auto'` → flip onto the vertical side with more room. Left /
      // right corners are then handled by the clamp below.
      let place = snapshot.placement;
      if (place === 'auto') place = y < H / 2 ? 'bottom' : 'top';

      let left: number;
      let top: number;
      switch (place) {
        case 'bottom':
          left = x - cw / 2;
          top = y + gap;
          break;
        case 'left':
          left = x - cw - gap;
          top = y - ch / 2;
          break;
        case 'right':
          left = x + gap;
          top = y - ch / 2;
          break;
        case 'top-left':
          left = x - cw - gap;
          top = y - ch - gap;
          break;
        case 'top-right':
          left = x + gap;
          top = y - ch - gap;
          break;
        case 'bottom-left':
          left = x - cw - gap;
          top = y + gap;
          break;
        case 'bottom-right':
          left = x + gap;
          top = y + gap;
          break;
        case 'top':
        default:
          left = x - cw / 2;
          top = y - ch - gap;
          break;
      }

      // Nudge clear of the node / connector, then clamp inside the container so
      // corner / edge nodes never clip — runs for every placement, not just `'auto'`.
      left += settings.offsetX;
      top += settings.offsetY;
      left = Math.max(edge, Math.min(left, W - cw - edge));
      top = Math.max(edge, Math.min(top, H - ch - edge));

      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.style.transform = 'none';
    };

    // Re-run the positioner against the live card (after a width / gap / margin
    // edit). No-op when nothing is shown.
    const repositionShown = (): void => {
      if (shownSnapshot) positionCard(shownSnapshot);
    };

    // ─── The behaviour ────────────────────────────────────────────────────────
    const preview = new HoverElementPreviewBehaviour({
      id: 'preview',
      targetLayerId: 'graph'
    });
    canvas.behaviours.register(preview);

    const settings = {
      // ── behaviour ──
      enable: true,
      openDelay: 0,
      closeDelay: 50,
      placement: 'bottom-right' as PreviewPlacement,
      interactive: true,
      node: true,
      edge: true,
      // ── card › image ── (toggle off for the no-image / text-only version)
      image: true,
      imageField: 'data.avatar',
      imageShape: 'rounded' as 'rounded' | 'circle',
      // ── card › title ──
      title: true,
      titleField: 'data.name',
      // ── card › subtitle ──
      subtitle: true,
      subtitleField: 'data.description',
      subtitleMaxLines: 2,
      // ── card › rows ──
      rowEmail: true,
      rowScore: true,
      scoreFormat: 'percent' as PreviewRowFormat,
      // ── card › layout ── (consumer-owned size + positioning)
      width: 320,
      gap: 12,
      offsetX: 0,
      offsetY: 0,
      edgeMargin: 8,
      // ── readout ──
      showing: '—'
    };

    // Re-assemble the serializable card spec from the GUI settings. Omitting a
    // section (image / title / subtitle / rows) drops that block from the card.
    const buildCardSpec = (): HoverElementPreviewCardSpec => {
      const spec: HoverElementPreviewCardSpec = {};
      if (settings.image && settings.imageField) {
        spec.image = { field: settings.imageField, shape: settings.imageShape };
      }
      if (settings.title && settings.titleField) {
        spec.title = { field: settings.titleField };
      }
      if (settings.subtitle && settings.subtitleField) {
        spec.subtitle = { field: settings.subtitleField, maxLines: settings.subtitleMaxLines };
      }
      const rows: PreviewRowSpec[] = [];
      if (settings.rowEmail) rows.push({ label: 'Email', field: 'data.email' });
      if (settings.rowScore) rows.push({ label: 'Score', field: 'data.score', format: settings.scoreFormat });
      if (rows.length > 0) spec.rows = rows;
      return spec;
    };
    const applyCard = (): void => {
      canvas.update({ behaviours: { preview: { card: buildCardSpec() } } });
    };

    preview.events.on('preview:show', (snapshot) => {
      shownSnapshot = snapshot;
      renderCard(snapshot);
      card.style.display = 'block'; // display before measuring so offsetWidth/Height are real
      positionCard(snapshot);
      settings.showing = `${snapshot.kind} "${snapshot.id}"`;
      gui.controllersRecursive().forEach((ctrl) => ctrl.updateDisplay());
    });
    preview.events.on('preview:move', (snapshot) => {
      shownSnapshot = snapshot;
      positionCard(snapshot);
    });
    preview.events.on('preview:hide', () => {
      shownSnapshot = null;
      card.style.display = 'none';
      settings.showing = '—';
      gui.controllersRecursive().forEach((ctrl) => ctrl.updateDisplay());
    });

    // Interactive mode — keep the card open while the pointer rests on it, so its
    // text can be selected / links clicked. The behaviour's `holdOpen` cancels
    // the pending close; `releaseHold` restarts it on leave. (Only fires when the
    // card has `pointer-events: auto`, toggled by the `interactive` control.)
    card.addEventListener('pointerenter', () => preview.holdOpen());
    card.addEventListener('pointerleave', () => preview.releaseHold());

    // ─── One serialisable config; init() last ────────────────────────────────
    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 22 },
              bgFill: 0x6366f1,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 2,
              labelColor: 0xf8fafc,
              labelFontSize: 12,
              labelPlacement: 'center'
            }
          },
          edge: {
            style: { strokeColor: 0xcbd5e1, strokeWidth: 2, arrowTargetShape: 'none' }
          }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        preview: {
          enabled: true,
          openDelay: settings.openDelay,
          closeDelay: settings.closeDelay,
          placement: settings.placement,
          interactive: settings.interactive,
          targets: ['node', 'edge'] as GraphElementKind[],
          card: buildCardSpec()
        }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 120);

    // ─── lil-gui ─────────────────────────────────────────────────────────────
    const applyTargets = (): void => {
      const targets: GraphElementKind[] = [];
      if (settings.node) targets.push('node');
      if (settings.edge) targets.push('edge');
      canvas.update({ behaviours: { preview: { targets } } });
    };

    const gui = new GUI({ title: 'Element Preview' });
    onStoryTeardown(() => gui.destroy());

    // ── Behaviour ──
    const behaviourFolder = gui.addFolder('behaviour');
    behaviourFolder.add(settings, 'enable').onChange((on: boolean) => {
      if (on) preview.enable();
      else {
        preview.disable();
        card.style.display = 'none';
      }
    });
    behaviourFolder.add(settings, 'openDelay', 0, 1000, 10).onChange((v: number) =>
      canvas.update({ behaviours: { preview: { openDelay: v } } }),
    );
    behaviourFolder.add(settings, 'closeDelay', 0, 1000, 10).onChange((v: number) =>
      canvas.update({ behaviours: { preview: { closeDelay: v } } }),
    );
    behaviourFolder
      .add(settings, 'placement', [
        'auto',
        'top',
        'right',
        'bottom',
        'left',
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ])
      .onChange((v: PreviewPlacement) => canvas.update({ behaviours: { preview: { placement: v } } }));
    behaviourFolder.add(settings, 'interactive').onChange((on: boolean) => {
      // Let the pointer enter the card (select text / click) vs. passive tooltip.
      card.style.pointerEvents = on ? 'auto' : 'none';
      card.style.userSelect = on ? 'text' : 'none';
      canvas.update({ behaviours: { preview: { interactive: on } } });
      // Interactive needs a grace period to bridge the node → card gap; a 0ms
      // close would hide before the pointer arrives. Bump it if too low.
      if (on && settings.closeDelay < 150) {
        settings.closeDelay = 250;
        canvas.update({ behaviours: { preview: { closeDelay: settings.closeDelay } } });
        gui.controllersRecursive().forEach((ctrl) => ctrl.updateDisplay());
      }
    });
    behaviourFolder.add(settings, 'node').onChange(applyTargets);
    behaviourFolder.add(settings, 'edge').onChange(applyTargets);

    // ── Card › image ── (toggle `image` off for the no-image, text-only card)
    const imageFolder = gui.addFolder('card › image');
    imageFolder.add(settings, 'image').name('show image').onChange(applyCard);
    imageFolder.add(settings, 'imageField').name('field').onChange(applyCard);
    imageFolder.add(settings, 'imageShape', ['rounded', 'circle']).name('shape').onChange(applyCard);

    // ── Card › title ──
    const titleFolder = gui.addFolder('card › title');
    titleFolder.add(settings, 'title').name('show title').onChange(applyCard);
    titleFolder.add(settings, 'titleField').name('field').onChange(applyCard);

    // ── Card › subtitle ──
    const subtitleFolder = gui.addFolder('card › subtitle');
    subtitleFolder.add(settings, 'subtitle').name('show subtitle').onChange(applyCard);
    subtitleFolder.add(settings, 'subtitleField').name('field').onChange(applyCard);
    subtitleFolder.add(settings, 'subtitleMaxLines', 1, 5, 1).name('max lines').onChange(applyCard);

    // ── Card › rows ──
    const rowsFolder = gui.addFolder('card › rows');
    rowsFolder.add(settings, 'rowEmail').name('Email row').onChange(applyCard);
    rowsFolder.add(settings, 'rowScore').name('Score row').onChange(applyCard);
    rowsFolder.add(settings, 'scoreFormat', ['text', 'percent']).name('Score format').onChange(applyCard);

    // ── Card › layout ── (size + positioning — consumer-owned, like the React
    // `HoverElementPreviewCard` `gap` / `edgeMargin` props)
    const layoutFolder = gui.addFolder('card › layout');
    layoutFolder.add(settings, 'width', 200, 440, 2).name('width').onChange((v: number) => {
      card.style.width = `${v}px`;
      repositionShown();
    });
    layoutFolder.add(settings, 'gap', 0, 40, 1).name('anchor gap').onChange(repositionShown);
    layoutFolder.add(settings, 'offsetX', -100, 100, 1).name('offset x').onChange(repositionShown);
    layoutFolder.add(settings, 'offsetY', -100, 100, 1).name('offset y').onChange(repositionShown);
    layoutFolder.add(settings, 'edgeMargin', 0, 40, 1).name('edge margin').onChange(repositionShown);

    gui.add(settings, 'showing').disable();
  }
};
