import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../../layer/types';
import { CompositeCard, type CardFrame } from './base';
import { CARD_BG, CARD_STROKE, chip, iconifyUrl } from './shared';
import type { TaskCardData } from './types';

/** Full configuration for a {@link TaskCard} — edit any field to re-style. */
export interface TaskCardSpec {
  width: number;
  height: number;
  padding: number;
  cornerRadius: number;
  /** Bottom accent bar height (0 to hide it). */
  accentHeight: number;
  /**
   * Corner radius of the priority pill and tag chips, in pixels. Half the chip's
   * height reads as a full pill; drop it toward `4` for a squarer tag.
   */
  chipRadius: number;
  bg: number;
  stroke: number;
  titleColor: number;
  /** Colour per priority (pill + accent). */
  priorityColors: Record<TaskCardData['priority'], number>;
  /** Display text per priority. */
  priorityLabels: Record<TaskCardData['priority'], string>;
}

/** Default {@link TaskCardSpec}. */
export const TASK_CARD_DEFAULTS: TaskCardSpec = {
  width: 230,
  height: 130,
  padding: 14,
  cornerRadius: 12,
  accentHeight: 4,
  chipRadius: 9,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  titleColor: 0xf1f5f9,
  priorityColors: { high: 0xf43f5e, med: 0xf59e0b, low: 0x64748b },
  priorityLabels: { high: 'High', med: 'Medium', low: 'Low' },
};

/**
 * **Kanban task** card — a wrapped title, a priority pill + coloured tag chips,
 * a divider, and a footer (assignee avatar + due date). A bottom accent bar
 * (priority colour) follows the rounded corners via `clip`. Configured by
 * {@link TaskCardSpec}; override {@link pill} / {@link title} / {@link tags} /
 * {@link footer} for structural changes.
 */
export class TaskCard extends CompositeCard<TaskCardSpec, TaskCardData> {
  constructor(spec: Partial<TaskCardSpec> = {}) {
    super({ ...TASK_CARD_DEFAULTS, ...spec });
  }

  /**
   * A rounded pill chip. Delegates to the shared {@link chip} builder so every
   * pill in the catalogue measures and centres identically — there used to be
   * two implementations here and they drifted apart.
   */
  protected pill(parts: CompositePart[], x: number, y: number, text: string, color: number): number {
    return chip(parts, { x, y, text, color, cornerRadius: this.spec.chipRadius });
  }

  /** Bottom accent bar (priority colour). */
  protected bottomAccent(data: TaskCardData, parts: CompositePart[]): void {
    if (this.spec.accentHeight > 0) parts.push({ part: 'rect', x: 0, y: this.spec.height - this.spec.accentHeight, width: this.spec.width, height: this.spec.accentHeight, fill: this.spec.priorityColors[data.priority] });
  }

  /** Title (wraps to 2 lines) + the priority pill top-right. */
  protected title(data: TaskCardData, parts: CompositePart[]): void {
    const { width, padding, titleColor, priorityColors, priorityLabels } = this.spec;
    const pText = priorityLabels[data.priority];
    // Lay the pill out first; its measured width is what the title wraps around.
    const pw = this.pill(parts, width - padding - pText.length * 6.5 - 16, padding, pText, priorityColors[data.priority]);
    parts.push({ part: 'label', x: padding, y: padding, text: data.title, fontSize: 14, fontWeight: 700, fill: titleColor, align: 'left', maxWidth: width - padding * 2 - pw - 8, maxLines: 2, overflow: 'ellipsis', lineHeight: 18 });
  }

  /** Tag chips, left → right. */
  protected tags(data: TaskCardData, parts: CompositePart[]): void {
    let tx = this.spec.padding;
    const y = this.spec.padding + 44;
    for (const tag of data.tags ?? []) tx += this.pill(parts, tx, y, tag.label, tag.color) + 6;
  }

  /** Footer: assignee avatar (left) + due date (right). */
  protected footer(data: TaskCardData, footY: number, parts: CompositePart[]): void {
    const { width, padding } = this.spec;
    if (data.assignee) {
      parts.push({ part: 'circle', x: padding + 12, y: footY + 10, radius: 12, fill: data.assignee.color });
      parts.push({ part: 'label', x: padding + 12, y: footY + 10, anchor: 'center', vAnchor: 'middle', text: data.assignee.initials, fontSize: 10, fontWeight: 700, fill: 0xffffff });
    }
    if (data.due) {
      parts.push({ part: 'icon', x: width - padding - 78, y: footY + 4, size: 14, icon: { kind: 'svg-url', url: iconifyUrl('lucide/calendar'), color: 0x94a3b8, strokeWidth: 2 } });
      parts.push({ part: 'label', x: width - padding, y: footY + 5, text: data.due, anchor: 'right', fontSize: 11, fill: 0x94a3b8, maxWidth: 58, maxLines: 1, overflow: 'ellipsis' });
    }
  }

  protected parts(data: TaskCardData): CompositePart[] {
    const parts: CompositePart[] = [];
    this.bottomAccent(data, parts);
    this.title(data, parts);
    this.tags(data, parts);
    const divY = this.spec.padding + 44 + 26;
    parts.push({ part: 'line', x: this.spec.padding, y: divY, x2: this.spec.width - this.spec.padding, y2: divY, stroke: { color: this.spec.stroke, width: 1 } });
    this.footer(data, divY + 12, parts);
    return parts;
  }

  protected frame(): CardFrame {
    const { width, height, bg, stroke, cornerRadius } = this.spec;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
}

const DEFAULT = new TaskCard();

/** Convenience builder with the stock spec — `new TaskCard().build(data)`. */
export function taskCard(data: TaskCardData): CompositeShapeOption {
  return DEFAULT.build(data);
}
