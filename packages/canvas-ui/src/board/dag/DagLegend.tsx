/**
 * `<DagLegend>` — the strip along a DAG board's bottom: one key per colour and
 * line the board draws, then a note. An error takes the strip's place, in the
 * destructive colour.
 *
 * A key's mark is what the canvas draws: a node is a dot (a ring when it is
 * drawn hollow), an edge a line (dashed when it is). A node's dot wears its
 * tone's colour from the same table the board draws with.
 */

import { cn, Legend, LegendItem, type LegendSwatchKind } from '@invana/ui';
import { DAG_TONES, type DagTones } from './presets';

/** One key: a node's tone or an edge's line, and what it means. */
export interface DagLegendKey {
  swatch: 'node' | 'edge';
  /** A node's tone. Default `muted`. */
  tone?: string;
  /** A hollow node, or a dashed edge. */
  dashed?: boolean;
  label: string;
}

/** What a DAG board's legend says. */
export interface DagLegendSpec {
  keys: readonly DagLegendKey[];
  note?: string;
}

export interface DagLegendProps {
  legend?: DagLegendSpec | undefined;
  /** The colours the keys' dots wear. Default {@link DAG_TONES}. */
  tones?: DagTones;
  /** Said in place of the keys and the note. */
  error?: string | null | undefined;
  /** Said in place of the legend's note — e.g. what a tool does while it is on. */
  note?: string | undefined;
  className?: string;
}

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

function swatchKind({ swatch, dashed }: DagLegendKey): LegendSwatchKind {
  if (swatch === 'node') return dashed ? 'ring' : 'dot';
  return dashed ? 'dashed' : 'line';
}

export function DagLegend({ legend, tones = DAG_TONES, error, note, className }: DagLegendProps) {
  const copy = note ?? legend?.note;
  return (
    <div
      className={cn(
        'pointer-events-none max-w-2xl rounded-sm border bg-card/90 px-2 py-1.5 backdrop-blur',
        error ? 'border-destructive/50' : 'border-border',
        className,
      )}
    >
      {error ? (
        <span className="text-destructive">{error}</span>
      ) : (
        <>
          {legend?.keys.length ? (
            <Legend className="mb-1 text-muted-foreground">
              {legend.keys.map((key) => (
                <LegendItem
                  key={key.label}
                  kind={swatchKind(key)}
                  color={
                    key.swatch === 'node'
                      ? hex(tones[key.tone ?? 'muted'] ?? tones.muted ?? 0x646b73)
                      : 'var(--muted-foreground)'
                  }
                  label={key.label}
                />
              ))}
            </Legend>
          ) : null}
          {copy ? <span className="text-muted-foreground">{copy}</span> : null}
        </>
      )}
    </div>
  );
}
