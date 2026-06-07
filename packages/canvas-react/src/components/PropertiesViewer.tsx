import type { CSSProperties } from 'react';
import { Badge, Button } from '@invana/ui';

/** One fixed top-of-card row, e.g. `Label`, `Source`, `Target`. */
export interface PropertiesViewerRow {
  /** Caption shown on the left. */
  label: string;
  /** Value shown on the right. */
  value: string;
  /** Render the value in a monospace face (ids, etc.). Default `false`. */
  mono?: boolean;
}

export interface PropertiesViewerProps {
  /** Heading, e.g. `'Node'` / `'Edge'`. */
  title?: string;
  /** Muted sub-heading under the title — typically the element id. */
  subtitle?: string;
  /** Small chip beside the title — typically the element `type`. */
  badge?: string;
  /** Fixed rows shown above the properties list (e.g. label, source, target). */
  rows?: PropertiesViewerRow[];
  /** Arbitrary key/value metadata (the element's `data`). */
  data?: Record<string, string>;
  /** Shown when there are no `data` entries. Default `'No properties.'`. */
  emptyText?: string;
  /** When provided, renders a close (✕) button in the header. */
  onClose?: () => void;
  className?: string;
  /** Inline styles merged onto the card — e.g. to make it full-height / translucent. */
  style?: CSSProperties;
}

/**
 * Dumb, engine-agnostic, **read-only** viewer for an element's identity +
 * key/value properties — the display counterpart of {@link PropertiesEditor}
 * (no inputs, no Apply, no commit). Props in; it only renders.
 *
 * It holds **no** engine / layer logic — the consumer (see
 * {@link PropertyViewerPanel}) resolves the element to `{ title, subtitle,
 * badge, rows, data }` and hands it over. Chrome (`Badge`, optional close
 * `Button`) comes from `@invana/ui`; everything else is theme-token-styled
 * markup, mirroring `PropertiesEditor`.
 */
export function PropertiesViewer({
  title,
  subtitle,
  badge,
  rows,
  data,
  emptyText = 'No properties.',
  onClose,
  className,
  style,
}: PropertiesViewerProps) {
  const entries = Object.entries(data ?? {});
  return (
    <div className={className} style={{ ...cardStyle, ...style }}>
      {(title || badge || onClose) && (
        <div style={headerStyle}>
          <div style={headerTextStyle}>
            {title && <span style={titleStyle}>{title}</span>}
            {badge && (
              <Badge variant="secondary" style={badgeStyle}>
                {badge}
              </Badge>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      )}

      {subtitle && <div style={subtitleStyle}>{subtitle}</div>}

      {rows && rows.length > 0 && (
        <div style={fieldStyle}>
          {rows.map((row) => (
            <div key={row.label} style={kvRowStyle}>
              <span style={kvKeyStyle}>{row.label}</span>
              <span style={row.mono ? kvValueMonoStyle : kvValueStyle}>{row.value}</span>
            </div>
          ))}
        </div>
      )}

      <div style={fieldStyle}>
        <span style={captionStyle}>Properties</span>
        {entries.length === 0 && <span style={emptyStyle}>{emptyText}</span>}
        {entries.map(([k, v]) => (
          <div key={k} style={kvRowStyle}>
            <span style={kvKeyStyle}>{k}</span>
            <span style={kvValueStyle}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 12,
  minWidth: 240,
  maxWidth: 320,
  background: 'var(--color-popover)',
  color: 'var(--color-popover-foreground)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
};
const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
};
const headerTextStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 };
const titleStyle: CSSProperties = { fontSize: 13, fontWeight: 600, opacity: 0.85 };
const badgeStyle: CSSProperties = { fontSize: 11 };
const subtitleStyle: CSSProperties = {
  fontSize: 12,
  opacity: 0.6,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  wordBreak: 'break-all',
  marginTop: -6,
};
const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const captionStyle: CSSProperties = { fontSize: 12, fontWeight: 500, opacity: 0.8 };
const emptyStyle: CSSProperties = { fontSize: 12, opacity: 0.6 };
const kvRowStyle: CSSProperties = { display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13 };
const kvKeyStyle: CSSProperties = {
  flex: '0 0 38%',
  opacity: 0.7,
  wordBreak: 'break-word',
};
const kvValueStyle: CSSProperties = { flex: 1, wordBreak: 'break-word' };
const kvValueMonoStyle: CSSProperties = {
  ...kvValueStyle,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
};
