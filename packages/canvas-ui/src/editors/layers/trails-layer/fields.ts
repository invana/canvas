import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../../shared/colors';

/**
 * `@invana/forms` field schema for the TrailsLayer editor. Field `name`s match
 * the keys of `TrailsLayerFields` 1:1.
 */
export const trailsLayerFields: FieldConfig[] = [
  { name: 'ids', type: 'text', label: 'Trails for', description: '"all", or comma-separated object ids. Every id costs a few paths — name the ones you need at scale.' },
  { name: 'maxPoints', type: 'number', label: 'Most points', min: 2, max: 2000, step: 1, description: 'Points kept in a recent trail. Default 30.' },
  { name: 'maxAgeMs', type: 'number', label: 'Max age (ms)', min: 0, step: 1000, description: 'Drop points older than this, from the object\'s newest fix. Default 600000.' },
  { name: 'fadeBands', type: 'number', label: 'Fade bands', min: 1, max: 20, step: 1, description: 'Segments the trail fades over. Default 5.' },
  { name: 'color', type: 'color', label: 'Colour', presetColors: [...COLOR_PRESETS], description: 'Stroke colour.' },
  { name: 'alpha', type: 'number', label: 'Alpha', min: 0, max: 1, step: 0.01, description: 'Alpha of the newest band; older bands fall off. Default 0.85.' },
  { name: 'strokeWidthPx', type: 'number', label: 'Width (px)', min: 0.5, max: 20, step: 0.5, description: 'Stroke width in screen pixels. Default 2.' },
  { name: 'fullTrackIds', type: 'text', label: 'Full track for', description: 'Comma-separated ids that also draw their whole track.' },
  { name: 'fullTrackMaxPoints', type: 'number', label: 'Full track points', min: 2, max: 20000, step: 100, description: 'Points kept for a full track. Default 2000.' },
  { name: 'publishDebounceMs', type: 'number', label: 'Republish debounce (ms)', min: 0, step: 10, description: 'Wait this long after a fix or a zoom before redrawing. Default 100.' },
];
