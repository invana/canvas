import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the TrackingBehaviour editor. Field `name`s
 * match the keys of `TrackingFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`.
 */
export const trackingFields: FieldConfig[] = [
  { name: 'renderDelayMs', type: 'number', label: 'Render delay (ms)', min: 0, step: 100, description: 'Objects are drawn this far in the past so there are two fixes to interpolate between. The picture is this far behind the feed. Default 1500.' },
  { name: 'maxExtrapolateMs', type: 'number', label: 'Dead-reckon for (ms)', min: 0, step: 1000, description: 'Past the newest fix, move on speed and course for at most this long, then hold. Default 30000.' },
  { name: 'staleAfterMs', type: 'number', label: 'Stale after (ms)', min: 0, step: 1000, description: 'No fix for this long → the stale state. Default 60000.' },
  { name: 'lostAfterMs', type: 'number', label: 'Lost after (ms)', min: 0, step: 1000, description: 'No fix for this long → the lost state. Default 180000.' },
  { name: 'stoppedBelowSpeed', type: 'number', label: 'Stopped below speed', min: 0, step: 0.0001, description: 'Speed in world units per second under which an object counts as stopped. Leave empty for no stopped state.' },
  { name: 'stoppedAfterMs', type: 'number', label: 'Stopped after (ms)', min: 0, step: 1000, description: 'How long the speed must stay below the threshold. Default 30000.' },
  { name: 'courseKey', type: 'text', label: 'Heading data key', description: 'The data key the sampled heading is written to, for an icon bound with rotationBind. Default "course"; empty writes no heading.' },
  { name: 'courseEpsilonDeg', type: 'number', label: 'Heading step (°)', min: 0, step: 0.5, description: 'Write the heading only when it moved by this much. Default 1.' },
  { name: 'followTargetId', type: 'text', label: 'Follow object', description: 'Id of the object the camera follows. Empty follows nothing.' },
];
