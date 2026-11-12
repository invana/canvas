import * as react from 'react';
import { PointerEvent } from 'react';
import { CardElement, FreeformStructure } from '@invana/graph';
import { FieldConfig } from '@invana/forms';

/** The element kinds the designer can place. */
type ElementType = CardElement['type'];
/**
 * Flat react-hook-form state for the **selected element**'s properties. Only the
 * fields relevant to the element's `type` are rendered (see `elementFields`);
 * `x` / `y` are driven by dragging on the canvas, not by this form. Roles/binds
 * carry sentinels (`NO_ROLE` / `NO_BIND`) since Radix selects forbid `''`.
 */
interface ElementFormState {
    bind: string;
    text: string;
    fontSize: number;
    fontWeight: number;
    colorRole: string;
    uppercase: boolean;
    maxWidth: number;
    width: number;
    height: number;
    cornerRadius: number;
    fillRole: string;
    radius: number;
    x2: number;
    y2: number;
    strokeWidth: number;
    size: number;
    shape: string;
}
/** react-hook-form state for the card-level properties. */
interface CardFormState {
    name: string;
    width: number;
    height: number;
    cornerRadius: number;
    bgRole: string;
}

/** Sentinel for "static text / no data binding" (Radix selects forbid `''`). */
declare const NO_BIND = "__static__";
/** Card-level controls (name + size + background role). */
declare const CARD_FIELDS: FieldConfig[];
/** Property controls for the selected element, by kind. */
declare function elementFields(type: ElementType, dataFields: {
    key: string;
    label: string;
}[]): FieldConfig[];

interface NodeCardDesignerProps {
    /** Initial template, loaded once on mount. Remount (via `key`) to reload. */
    defaults?: FreeformStructure;
    /** Data fields the host offers for binding (slot → data path), e.g. the KG schema. */
    dataFields?: {
        key: string;
        label: string;
    }[];
    /** Active role → hex palette, so the design canvas previews themed colours. */
    palette?: Record<string, number>;
    /** Live callback — fired on every edit with the current template. */
    onChange?: (template: FreeformStructure) => void;
    /** Called with the produced template on Apply. */
    onSubmit?: (template: FreeformStructure) => void;
    /** Apply button label. Default `'Apply template'`. */
    submitLabel?: string;
}
/**
 * Full-featured visual **node card designer** — a free-form WYSIWYG builder that
 * produces a `FreeformStructure` (the self-contained card template the engine
 * renders via its `composite` shape). Drop elements, drag to position, bind text
 * to data fields, style by colour role; reorder + show/hide via the **layers**
 * panel; **undo/redo** and **save/load** from the toolbar. Engine-agnostic —
 * emits JSON via `onChange` / `onSubmit`.
 */
declare function NodeCardDesigner({ defaults, dataFields, palette, onChange, onSubmit, submitLabel, }: NodeCardDesignerProps): react.JSX.Element;

interface CardElementViewProps {
    el: CardElement;
    palette: Record<string, number>;
    /** Display text for a `text` element — the caller resolves bind / sample / placeholder. */
    text?: string;
    /** Draw a selection ring. */
    selected?: boolean;
    /** When provided, the element is interactive (draggable) and shows a move cursor. */
    onPointerDown?: (e: PointerEvent) => void;
}
/**
 * Renders one {@link CardElement} as an absolutely-positioned DOM node — the
 * shared visual used by both the designer's interactive canvas (pass
 * `onPointerDown` + `selected`) and the read-only {@link CardPreview}. Colours
 * resolve from the active theme palette so previews match the rendered graph.
 */
declare function CardElementView({ el, palette, text, selected, onPointerDown }: CardElementViewProps): react.JSX.Element;

interface CardPreviewProps {
    /** The template to render (read-only). */
    template: FreeformStructure;
    /** Active role → hex palette, so the preview matches the rendered graph. */
    palette?: Record<string, number>;
    /**
     * Sample node (e.g. `{ type, data }`) used to resolve each element's `bind`
     * path to a real value. Without it, bound text shows the dotted path.
     */
    sample?: Record<string, unknown>;
    /** Uniform scale (e.g. to fit a thumbnail). Default `1`. */
    scale?: number;
}
/**
 * Read-only render of a {@link FreeformStructure} — the same element visuals as
 * the designer canvas (via {@link CardElementView}), but non-interactive and
 * optionally scaled. Bound text resolves against `sample`. Used for the layer
 * thumbnails in {@link NodeTemplateList} and any standalone template preview.
 */
declare function CardPreview({ template, palette, sample, scale }: CardPreviewProps): react.JSX.Element;

/** One node type + the template it renders with, for the list. */
interface NodeTemplateItem {
    /** Node type / label (e.g. `'Tweet'`). */
    type: string;
    /** The card template for this type. */
    template: FreeformStructure;
    /** A representative node (`{ type, data }`) to make the thumbnail realistic. */
    sample?: Record<string, unknown>;
}
interface NodeTemplateListProps {
    items: NodeTemplateItem[];
    /** Active role → hex palette for the thumbnails. */
    palette?: Record<string, number>;
    /** Fired with the node type when its **Edit** is clicked. */
    onEdit: (type: string) => void;
    /** Thumbnail box size. Default `{ w: 168, h: 100 }`. */
    thumb?: {
        w: number;
        h: number;
    };
}
/**
 * A list of node types, each with a live **thumbnail** of its card template and
 * an **Edit** action — the entry point to the {@link NodeCardDesigner}. The host
 * owns the templates and opens the editor on `onEdit(type)`. Engine-agnostic
 * (renders via {@link CardPreview}); produces no side effects of its own.
 */
declare function NodeTemplateList({ items, palette, onEdit, thumb, }: NodeTemplateListProps): react.JSX.Element;

declare function cardToForm(tpl: FreeformStructure): CardFormState;
/** Apply card-form edits onto a template (keeps elements). */
declare function applyFormToCard(tpl: FreeformStructure, v: CardFormState): FreeformStructure;
declare function elementToForm(el: CardElement): ElementFormState;
/** Merge element-form edits back onto an element (preserves id + position). */
declare function applyFormToElement(el: CardElement, v: ElementFormState): CardElement;
/** Resolve a role/fixed colour pair to a CSS hex for the design canvas. */
declare function previewColor(role: string | undefined, direct: number | undefined, palette: Record<string, number>, fallback: number): string;
/** Pretty-print a template for download. */
declare function templateToJson(tpl: FreeformStructure): string;
/** Parse + minimally validate a saved template. Returns `null` on bad input. */
declare function parseTemplate(text: string): FreeformStructure | null;
/** A short human label for an element, shown in the layers list. */
declare function elementLabel(el: CardElement): string;
/** A fresh element of the requested kind, placed near the card's top-left. */
declare function newElement(type: ElementType, id: string): CardElement;

/**
 * Minimal undo/redo history for a single value (the card template).
 *
 * - `set(next)` — replace the present **without** recording (transient: live
 *   drags / typing, so a gesture isn't a hundred undo steps).
 * - `commit(next, tag?)` — record the present onto the undo stack, then set
 *   `next`. Consecutive commits sharing a `tag` within a short window
 *   **coalesce** into one entry (so editing a field reads as one undo step).
 * - `record(snapshot)` — push an explicit restore point (e.g. the pre-drag
 *   state captured on pointer-down), used when the change itself went through
 *   transient `set`s.
 * - `undo` / `redo` / `reset`.
 */
interface History<T> {
    state: T;
    set: (next: T) => void;
    commit: (next: T, tag?: string) => void;
    record: (snapshot: T) => void;
    undo: () => void;
    redo: () => void;
    reset: (next: T) => void;
    canUndo: boolean;
    canRedo: boolean;
    /**
     * Bumps on **external jumps** (undo / redo / reset) but NOT on live edits
     * (set / commit). Key uncontrolled forms on it so they re-seed after a jump
     * without resetting mid-typing.
     */
    version: number;
}
declare function useHistory<T>(initial: T): History<T>;

export { CARD_FIELDS, CardElementView, type CardElementViewProps, type CardFormState, CardPreview, type CardPreviewProps, type ElementFormState, type ElementType, type History, NO_BIND, NodeCardDesigner, type NodeCardDesignerProps, type NodeTemplateItem, NodeTemplateList, type NodeTemplateListProps, applyFormToCard, applyFormToElement, cardToForm, elementFields, elementLabel, elementToForm, newElement, parseTemplate, previewColor, templateToJson, useHistory };
