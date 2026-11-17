/**
 * Provenance — where a feature came from and how far to trust it. Types live on
 * {@link GeoFeatureProperties}; this module is the checks and the one reading of
 * the Admiralty code.
 */

import type { GeoFeatureProperties } from './types';

/** A parsed Admiralty reliability code. */
export interface Reliability {
  /** Source grade: `A` (completely reliable) … `F` (cannot be judged). */
  source: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  /** Information grade: `1` (confirmed) … `6` (cannot be judged). */
  information: 1 | 2 | 3 | 4 | 5 | 6;
}

/** Parse `'B2'` → `{ source: 'B', information: 2 }`; `null` when it is not a valid code. */
export function parseReliability(code: unknown): Reliability | null {
  if (typeof code !== 'string') return null;
  const m = /^([A-Fa-f])([1-6])$/.exec(code.trim());
  if (!m) return null;
  return { source: m[1]!.toUpperCase() as Reliability['source'], information: Number(m[2]) as Reliability['information'] };
}

/**
 * Problems with a feature's provenance, as short messages. Empty when it is fine;
 * every field is optional, so only a value that is present and wrong is reported.
 */
export function provenanceProblems(p: GeoFeatureProperties | null | undefined): string[] {
  if (!p) return [];
  const out: string[] = [];
  if (p.confidence !== undefined && !(typeof p.confidence === 'number' && p.confidence >= 0 && p.confidence <= 1)) {
    out.push('confidence must be a number from 0 to 1');
  }
  if (p.reliability !== undefined && parseReliability(p.reliability) === null) {
    out.push('reliability must be an Admiralty code such as "B2" (A–F then 1–6)');
  }
  if (p.reportedAt !== undefined && (typeof p.reportedAt !== 'string' || Number.isNaN(Date.parse(p.reportedAt)))) {
    out.push('reportedAt must be an ISO 8601 date string');
  }
  for (const key of ['source', 'author', 'classification'] as const) {
    if (p[key] !== undefined && typeof p[key] !== 'string') out.push(`${key} must be a string`);
  }
  return out;
}
