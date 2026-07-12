import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the D3ForceLayout editor, grouped into
 * accordion sections. Field `name`s match {@link D3ForceLayoutFields} 1:1 so
 * the generator's `options.<name>` paths line up with `mapping.ts`.
 *
 * Static (no cross-field dependency) — a plain `FieldConfig[]`.
 */

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

const SIMULATION_FIELDS: FieldConfig[] = [
  {
    name: 'animate',
    type: 'boolean',
    label: 'Animate',
    description: 'Write positions every tick (live settle) vs. flush once when settled.',
  },
  {
    name: 'reheatAlpha',
    type: 'number',
    label: 'Reheat alpha',
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Alpha for incremental streaming adds (only with Animate off). Default 0.5.',
  },
  { name: 'alpha', type: 'number', label: 'Alpha', min: 0, max: 1, step: 0.01, description: 'Initial simulation heat. d3 default 1.' },
  { name: 'alphaMin', type: 'number', label: 'Alpha min', min: 0, max: 1, step: 0.001, description: 'Stop threshold. d3 default 0.001.' },
  { name: 'alphaDecay', type: 'number', label: 'Alpha decay', min: 0, max: 1, step: 0.001, description: 'Cooling rate per tick. d3 default ~0.0228.' },
  { name: 'alphaTarget', type: 'number', label: 'Alpha target', min: 0, max: 1, step: 0.01, description: 'Alpha the sim decays toward. d3 default 0.' },
  { name: 'velocityDecay', type: 'number', label: 'Velocity decay', min: 0, max: 1, step: 0.01, description: 'Friction per tick. d3 default 0.4.' },
];

const LINK_FIELDS: FieldConfig[] = [
  { name: 'linkDistance', type: 'number', label: 'Distance', min: 0, max: 2000, step: 1, description: 'Target distance between connected nodes.' },
  { name: 'linkStrength', type: 'number', label: 'Strength', min: 0, max: 2, step: 0.01, description: 'How rigidly links hold their distance.' },
  { name: 'linkIterations', type: 'number', label: 'Iterations', min: 1, max: 20, step: 1, description: 'Constraint-relaxation passes per tick.' },
];

const CHARGE_FIELDS: FieldConfig[] = [
  { name: 'chargeStrength', type: 'number', label: 'Strength', min: -2000, max: 2000, step: 10, description: 'n-body charge: negative repels, positive attracts.' },
  { name: 'chargeTheta', type: 'number', label: 'Theta', min: 0, max: 2, step: 0.1, description: 'Barnes–Hut accuracy threshold. d3 default 0.9.' },
  { name: 'chargeDistanceMin', type: 'number', label: 'Distance min', min: 0, max: 1000, step: 1, description: 'Minimum inter-node distance considered.' },
  { name: 'chargeDistanceMax', type: 'number', label: 'Distance max', min: 0, max: 100000, step: 10, description: 'Maximum inter-node distance considered.' },
];

const CENTER_FIELDS: FieldConfig[] = [
  { name: 'centerX', type: 'number', label: 'Center X', min: -10000, max: 10000, step: 10, description: 'Centroid target x.' },
  { name: 'centerY', type: 'number', label: 'Center Y', min: -10000, max: 10000, step: 10, description: 'Centroid target y.' },
  { name: 'centerStrength', type: 'number', label: 'Strength', min: 0, max: 2, step: 0.01, description: 'Recentring strength.' },
];

const COLLIDE_FIELDS: FieldConfig[] = [
  { name: 'collideRadius', type: 'number', label: 'Radius', min: 0, max: 500, step: 1, description: 'Collision radius (constant). Per-node functions are out of scope here.' },
  { name: 'collideStrength', type: 'number', label: 'Strength', min: 0, max: 1, step: 0.01, description: 'Overlap-resolution strength in [0, 1].' },
  { name: 'collideIterations', type: 'number', label: 'Iterations', min: 1, max: 20, step: 1, description: 'Constraint-relaxation passes per tick.' },
];

const CLUSTER_FIELDS: FieldConfig[] = [
  { name: 'clusterStrength', type: 'number', label: 'Strength', min: 0, max: 1, step: 0.01, description: 'Pull `parentId` group members toward their centroid so group frames stay compact. Empty = off. Default 0.2.' },
];

/**
 * The full D3ForceLayout field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<D3ForceLayoutEditor>`.
 */
export const d3ForceLayoutFields: FieldConfig[] = [
  ...SIMULATION_FIELDS.map(withGroup('Simulation')),
  ...LINK_FIELDS.map(withGroup('Link force')),
  ...CHARGE_FIELDS.map(withGroup('Charge force')),
  ...CENTER_FIELDS.map(withGroup('Center force')),
  ...COLLIDE_FIELDS.map(withGroup('Collide force')),
  ...CLUSTER_FIELDS.map(withGroup('Group cluster')),
];
