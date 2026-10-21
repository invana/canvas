/**
 * `AnnotationsOverlay` — the few pieces of annotating that are HTML, over the
 * graph. The annotations themselves are drawn **in** the graph by
 * {@link AnnotationsProjection}: cards, links, highlight rings, group frames and
 * count pills are nodes and edges the layout places and the export carries.
 *
 * What stays here, placed over the element it belongs to:
 *
 * | Piece | When |
 * |---|---|
 * | the text editor | a note or value being written, over its card |
 * | the name field | a group being named, over its frame |
 * | the format bar | the annotation selected in Annotate: colour, delete — or why not |
 * | the tools' pointer | Annotate's *Annotate* · *Highlight* · *Group*: a click on a record, a drag round several |
 *
 * Outside Annotate nothing here takes the pointer.
 */

import { useBoardMode, useCommandStates, useGraphCanvas } from '@invana/canvas-react';
import { Input, Textarea } from '@invana/forms';
import { type GraphLayer, type GroupFramesLayer, isAnnotationElement, resolveNodeSize } from '@invana/graph';
import { type AnnotationColor, Button, cn } from '@invana/ui';
import { Trash2 } from 'lucide-react';
import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';

import { BOARD_IDS } from '../presets';
import { ANNOTATION_FRAMES_LAYER, annotationNodeId } from './AnnotationsProjection';
import { DRAFT_ID, recordsOf, useAnnotations } from './AnnotationsProvider';
import type { BoardAnnotation } from './types';

const BAR_H = 34;
const COLORS: AnnotationColor[] = ['amber', 'blue', 'green', 'red', 'grey'];
const COLOR_NAME: Record<AnnotationColor, string> = { amber: 'Amber', blue: 'Blue', green: 'Green', red: 'Red', grey: 'Grey' };
const BG: Record<AnnotationColor, string> = {
  amber: 'bg-warning',
  blue: 'bg-primary',
  green: 'bg-success',
  red: 'bg-destructive',
  grey: 'bg-muted-foreground',
};

export interface AnnotationsOverlayProps {
  /** Kept for hosts that pass it; the cards no longer avoid the panel by hand — they are laid out with the graph. */
  panelWidth?: number;
}

interface ScreenBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function AnnotationsOverlay(_props: AnnotationsOverlayProps) {
  const canvas = useGraphCanvas();
  const ctx = useAnnotations();
  const mode = useBoardMode(canvas) ?? 'explore';
  const { states } = useCommandStates([{ command: 'tool.active' }], canvas);
  const tool = states[0]?.value ?? 'select';
  const host = useRef<HTMLDivElement>(null);
  const [, setFrame] = useState(0);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  const annotating = mode === 'annotate';
  const selected = ctx.selectedId;
  const following = ctx.draft !== null || (annotating && selected !== null);

  // Follow the camera and the layout a frame at a time — only while something is placed over the graph.
  useEffect(() => {
    if (!following) return;
    let raf: number | null = null;
    const tick = () => {
      if (raf === null)
        raf = requestAnimationFrame(() => {
          raf = null;
          setFrame((f) => f + 1);
        });
    };
    const layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
    const offs = [
      canvas.events.on('input:camera:pan', tick),
      canvas.events.on('input:camera:zoom', tick),
      canvas.store.view.subscribe(tick),
      ...(layer ? [layer.events.on('data:changed', tick)] : []),
    ];
    tick();
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      for (const off of offs) off?.();
    };
  }, [canvas, following]);

  const layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
  const cam = canvas.camera;

  /** A drawn node's box on screen. */
  const boxOf = (id: string): ScreenBox | null => {
    const n = layer?.store.getNode(id);
    const p = n ? layer!.store.getPosition(id) : undefined;
    if (!n || !p) return null;
    const size = resolveNodeSize(layer!, n);
    const c = cam.toScreen(p.x, p.y);
    const w = size.width * cam.scale;
    const h = size.height * cam.scale;
    return { x: c.x - w / 2, y: c.y - h / 2, w, h };
  };
  /** Where an annotation is drawn: its card, its frame, or round its highlighted records. */
  const boxOfAnnotation = (a: BoardAnnotation): ScreenBox | null => {
    if (a.kind === 'note' || a.kind === 'value') return boxOf(annotationNodeId(a.id));
    if (a.kind === 'group') {
      const f = canvas.layers.get<GroupFramesLayer>(ANNOTATION_FRAMES_LAYER)?.frameBounds(a.id);
      if (f) {
        const c = cam.toScreen(f.x, f.y);
        return { x: c.x, y: c.y, w: f.width * cam.scale, h: f.height * cam.scale };
      }
    }
    const boxes = a.records.map((r) => boxOf(r.id)).filter((b): b is ScreenBox => b !== null);
    if (!boxes.length) return null;
    const x = Math.min(...boxes.map((b) => b.x));
    const y = Math.min(...boxes.map((b) => b.y));
    return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y };
  };

  // ── the tools ─────────────────────────────────────────────────────────────
  const toolOn = annotating && ctx.actor.canWrite && (tool === 'annotate' || tool === 'highlight' || tool === 'group');
  const records = () => [...(layer?.store.nodes() ?? [])].filter((n) => !isAnnotationElement(n) && !n.hidden);
  const hit = (x: number, y: number): { id: string; kind: 'node' | 'edge' } | null => {
    let best: { id: string; d: number } | null = null;
    for (const n of records()) {
      const b = boxOf(n.id);
      if (!b) continue;
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const d = Math.hypot(cx - x, cy - y);
      if (d <= Math.max(b.w, b.h) / 2 + 6 && (!best || d < best.d)) best = { id: n.id, d };
    }
    if (best) return { id: best.id, kind: 'node' };
    for (const e of layer?.store.edges() ?? []) {
      if (isAnnotationElement(e)) continue;
      const p = boxOf(e.source);
      const q = boxOf(e.target);
      if (p && q && segmentDistance(x, y, centre(p), centre(q)) <= 5) return { id: e.id, kind: 'edge' };
    }
    return null;
  };
  const say = (text: string) => canvas.showMessage(text, 3000);
  const local = (e: PointerEvent) => {
    const r = host.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const p = local(e);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const p = local(e);
    setDrag({ ...drag, x1: p.x, y1: p.y });
  };
  const onUp = () => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    const moved = Math.abs(d.x1 - d.x0) + Math.abs(d.y1 - d.y0) > 6;
    if (!moved) {
      const t = hit(d.x0, d.y0);
      if (tool === 'annotate') {
        if (!t) return say('Annotations go on data. Click a node or a relationship.');
        return ctx.begin({ kind: 'note', records: recordsOf(canvas, [t.id], t.kind) });
      }
      if (tool === 'highlight') {
        if (!t || t.kind !== 'node') return say('Click a node, or drag over several, to highlight them.');
        return ctx.begin({ kind: 'highlight', records: recordsOf(canvas, [t.id], 'node') });
      }
      return say('Drag around two or more records to group them.');
    }
    const area = { x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1), w: Math.abs(d.x1 - d.x0), h: Math.abs(d.y1 - d.y0) };
    const inside = records()
      .filter((n) => {
        const b = boxOf(n.id);
        if (!b) return false;
        const c = centre(b);
        return c.x >= area.x && c.x <= area.x + area.w && c.y >= area.y && c.y <= area.y + area.h;
      })
      .map((n) => n.id);
    if (tool === 'group') {
      if (inside.length < 2) return say('A group holds two or more records. Drag around them.');
      return ctx.begin({ kind: 'group', records: recordsOf(canvas, inside, 'node') });
    }
    if (tool === 'highlight') {
      if (!inside.length) return say('Nothing to highlight there. Click a node, or drag over several.');
      return ctx.begin({ kind: 'highlight', records: recordsOf(canvas, inside, 'node') });
    }
    say('Annotations go on data. Click a node or a relationship.');
  };

  // ── what is placed over the graph ─────────────────────────────────────────
  const draft = ctx.draft;
  const draftBox = draft ? boxOfAnnotation(draft) : null;
  const selectedA = annotating && selected && selected !== DRAFT_ID ? ctx.annotations.find((a) => a.id === selected) : undefined;
  const selectedBox = selectedA ? boxOfAnnotation(selectedA) : null;

  return (
    <div ref={host} className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-label="Annotations">
      {drag && (
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          <rect
            x={Math.min(drag.x0, drag.x1)}
            y={Math.min(drag.y0, drag.y1)}
            width={Math.abs(drag.x1 - drag.x0)}
            height={Math.abs(drag.y1 - drag.y0)}
            fill="color-mix(in srgb, var(--color-primary) 6%, transparent)"
            stroke="var(--color-primary)"
            strokeDasharray="5 4"
          />
        </svg>
      )}

      {draft && draftBox && (draft.kind === 'note' || draft.kind === 'value') && (
        <div className="bg-card pointer-events-auto absolute rounded-md border p-1 shadow-md" style={{ left: draftBox.x, top: draftBox.y, width: Math.max(220, draftBox.w) }}>
          <DraftEditor kind={draft.kind} />
        </div>
      )}
      {draft && draftBox && draft.kind === 'group' && (
        <div className="bg-card pointer-events-auto absolute rounded-md border p-1 shadow-md" style={{ left: draftBox.x, top: Math.max(4, draftBox.y - 44), width: 220 }}>
          <GroupNameField />
        </div>
      )}

      {selectedA && selectedBox && (
        <FormatBar
          a={selectedA}
          x={selectedBox.x}
          y={Math.max(4, selectedBox.y - BAR_H - 6)}
          onColor={(c) => ctx.update(selectedA.id, { color: c })}
          onDelete={() => ctx.remove(selectedA.id)}
        />
      )}

      {toolOn && (
        <div
          className="pointer-events-auto absolute inset-0 cursor-crosshair"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => setDrag(null)}
        />
      )}
    </div>
  );
}

/** The text of the one being written: Enter with ⌘ or leaving it saves, Esc drops it. */
function DraftEditor({ kind }: { kind: BoardAnnotation['kind'] }) {
  const ctx = useAnnotations();
  const [text, setText] = useState(ctx.draft?.text ?? '');
  const done = () => ctx.commit(text);
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Escape') ctx.cancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) done();
  };
  const prompt = kind === 'value' ? 'What does this value say?' : 'What does the data say here?';
  return (
    <Textarea aria-label={prompt} placeholder={prompt} rows={3} autoFocus value={text} onChange={(e) => setText(e.target.value)} onBlur={done} onKeyDown={key} />
  );
}

/** A group's name, while it is first named: Enter or leaving saves, Esc drops it. */
function GroupNameField() {
  const ctx = useAnnotations();
  const [label, setLabel] = useState(ctx.draft?.label ?? '');
  return (
    <Input
      aria-label="Name the group"
      placeholder="Name the group"
      autoFocus
      value={label}
      onChange={(e) => setLabel(e.target.value)}
      onBlur={() => ctx.commit('', label)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') ctx.commit('', label);
        if (e.key === 'Escape') ctx.cancel();
      }}
    />
  );
}

/** Over the selected annotation: its colour, then delete — or why not. */
function FormatBar({ a, x, y, onColor, onDelete }: { a: BoardAnnotation; x: number; y: number; onColor: (c: AnnotationColor) => void; onDelete: () => void }): ReactNode {
  return (
    <div role="toolbar" aria-label={`Annotation by ${a.author.name}`} className="bg-card pointer-events-auto absolute flex items-center gap-0.5 rounded-md border p-0.5 shadow-md" style={{ left: x, top: y }}>
      {a.canEdit &&
        COLORS.map((c) => (
          <Button key={c} size="xs" variant="ghost" aria-label={COLOR_NAME[c]} title={COLOR_NAME[c]} aria-pressed={a.color === c} onClick={() => onColor(c)}>
            <span className={cn('size-3 rounded-full', BG[c], a.color === c && 'ring-foreground ring-2 ring-offset-1')} />
          </Button>
        ))}
      {a.canDelete ? (
        <Button size="xs" variant="ghost" aria-label="Delete" title="Delete" className="text-destructive" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
        </Button>
      ) : (
        <span className="text-muted-foreground px-1.5 text-xs whitespace-nowrap">{a.whyNot ?? `Only ${a.author.name} can delete it`}</span>
      )}
    </div>
  );
}

function centre(b: ScreenBox) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

function segmentDistance(x: number, y: number, p: { x: number; y: number }, q: { x: number; y: number }): number {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const L = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - p.x) * dx + (y - p.y) * dy) / L));
  return Math.hypot(x - (p.x + t * dx), y - (p.y + t * dy));
}

/** A record's value as the panel prints it. */
export function fmt(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
