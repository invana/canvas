/**
 * The board's annotations — what a host says about its records, drawn on the
 * board. The board keeps no backend: a host maps its own rows onto
 * {@link BoardAnnotation} and is called back to create, change and delete them.
 */

import type { AnnotationColor, AuthorTone } from '@invana/ui';

/** The anchor's shape: one record, one of its values, a set or path, a group of two or more. */
export type AnnotationKind = 'note' | 'value' | 'highlight' | 'group';

/** A record an annotation is on. `label` is what the panel calls it when the record is not on the board. */
export interface AnnotationRecordRef {
  id: string;
  kind: 'node' | 'edge';
  label?: string;
}

export interface AnnotationAuthorRef {
  /** The person's id, so the board can tell *yours* from *others'*. */
  id?: string | null;
  name: string;
  kind: 'person' | 'assistant';
  initials?: string;
  tone?: AuthorTone;
}

/** One annotation, as the board draws it. */
export interface BoardAnnotation {
  id: string;
  kind: AnnotationKind;
  records: readonly AnnotationRecordRef[];
  /** The property a `value` annotation is on. */
  prop?: string | null;
  /** The value when it was written — compared with the record's now. */
  valueThen?: unknown;
  text: string;
  /** A group's name. */
  label?: string;
  color: AnnotationColor;
  author: AnnotationAuthorRef;
  /** Beside the author — `2 Oct`, `Answer 1`. */
  meta?: string;
  /** Seen only in one session: the tag it carries. `null` — the graph's. */
  sessionTag?: string | null;
  /** The person looking may change it. */
  canEdit?: boolean;
  /** The person looking may delete it; when not, `whyNot` says why. */
  canDelete?: boolean;
  whyNot?: string;
}

/** What the board hands its host to write. */
export interface AnnotationDraft {
  kind: AnnotationKind;
  records: AnnotationRecordRef[];
  prop?: string;
  valueThen?: unknown;
  text: string;
  label?: string;
  color: AnnotationColor;
}

export type AnnotationPatch = Partial<Pick<BoardAnnotation, 'text' | 'label' | 'color'>>;

/** The Legend's switches. `all` hides every one; the rest hide by author or kind. */
export type AnnotationHideKey = 'all' | 'mine' | 'others' | 'assistant' | 'highlight' | 'group';

/** How the board shows annotations — saved with the board by its host. */
export interface AnnotationView {
  /** `full`: every card beside its record · `badges`: a count on each annotated record. Annotate is always `full`. */
  density: 'full' | 'badges';
  hidden: Partial<Record<AnnotationHideKey, boolean>>;
  /** Hidden one by one, from the panel's eye. */
  hiddenIds?: readonly string[];
}

/** Who is looking. */
export interface AnnotationActor {
  /** The person's id — *By you* is theirs. */
  id?: string | null;
  /** May write annotations. Without it, Annotate is off and says `whyNot`. */
  canWrite: boolean;
  whyNot?: string;
  /** May save the board's view; without it, the Legend's eyes are theirs alone and it says so. */
  canSaveView?: boolean;
}

export const DEFAULT_ANNOTATION_VIEW: AnnotationView = { density: 'full', hidden: {} };

/** Each colour's token — never a hex. */
export const ANNOTATION_TOKEN: Record<AnnotationColor, string> = {
  amber: 'var(--color-warning)',
  blue: 'var(--color-primary)',
  green: 'var(--color-success)',
  red: 'var(--color-destructive)',
  grey: 'var(--color-muted-foreground)',
};
