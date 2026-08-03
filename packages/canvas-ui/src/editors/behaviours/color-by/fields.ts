import type { FieldConfig } from '@invana/forms';

import type { ColorByFields } from './types';

/**
 * `@invana/forms` field schema for the `ColorByBehaviour` editor.
 *
 * **A function of the live values, not a static array** — which is the whole
 * reason category and range are one behaviour rather than two. The two modes
 * read disjoint option sets, so the schema is resolved from the current `mode`
 * and `scale` (the panel feeds it from a `useWatch`), exactly as
 * `DensityContourFillLayerEditorPanel` and ~20 other editors already do.
 *
 * It implements the behaviour's validity matrix directly:
 *
 * ```
 * always            → mode, nodeValueKey, edgeValueKey, colorNodes, colorEdges, fallbackColor
 * mode 'categorical'   → + maxCategories
 * mode 'range'      → + scale
 *   continuous        → + nodeDomain[min,max], edgeDomain[min,max]   (blank = auto)
 *   'quantile'        → + bins, nodeDomain[min,max], edgeDomain[min,max]
 *   'threshold'       → + nodeThresholds, edgeThresholds
 * ```
 *
 * Field `name`s match {@link ColorByFields} 1:1 so the `options.<name>` paths
 * line up with `mapping.ts`. `palette` and `valueColors` have no fields —
 * `FieldType` has no array or map kind.
 */
export function colorByFields(values: ColorByFields = {}): FieldConfig[] {
  const mode = values.mode ?? 'categorical';
  const scale = values.scale ?? 'linear';
  const continuous = scale === 'linear' || scale === 'sqrt' || scale === 'log';

  const shared: FieldConfig[] = [
    {
      name: 'mode',
      type: 'select',
      label: 'Mode',
      options: [
        { value: 'categorical', label: 'Categorical (which kind is this?)' },
        { value: 'range', label: 'Range (how much of this is there?)' },
      ],
      description:
        'Category assigns one colour per distinct value. Range maps a number onto a colour ramp.',
    },
    {
      name: 'nodeValueKey',
      type: 'text',
      label: 'Node field',
      description:
        "Root-relative dot path — 'type' (default), 'data.riskScore', 'style.shape.kind'.",
    },
    {
      name: 'edgeValueKey',
      type: 'text',
      label: 'Edge field',
      description: "Root-relative dot path — 'type' (default), 'data.errorRate'.",
    },
    {
      name: 'colorNodes',
      type: 'boolean',
      label: 'Colour nodes',
      description: "Fill each node from its field value. Default on.",
    },
    {
      name: 'colorEdges',
      type: 'boolean',
      label: 'Colour edges',
      description: 'Stroke each edge from its field value. Default on.',
    },
    {
      name: 'fallbackColor',
      type: 'color',
      label: 'Fallback colour',
      description:
        'Colour for items whose value is missing, empty, or (in range mode) not a number. Default grey.',
    },
  ];

  if (mode === 'categorical') {
    return [
      ...shared,
      {
        name: 'maxCategories',
        type: 'number',
        label: 'Max categories',
        description:
          'Values beyond this many distinct ones share the fallback colour and collapse into one "other" legend row. Guards against colouring by a high-cardinality field. Default 24.',
      },
    ];
  }

  const rangeFields: FieldConfig[] = [
    ...shared,
    {
      name: 'scale',
      type: 'select',
      label: 'Scale',
      options: [
        { value: 'linear', label: 'Linear (continuous)' },
        { value: 'sqrt', label: 'Square root (continuous)' },
        { value: 'log', label: 'Logarithmic (continuous)' },
        { value: 'quantile', label: 'Quantile (equal-count bins)' },
        { value: 'threshold', label: 'Threshold (explicit bins)' },
      ],
      description: 'How a number becomes a colour.',
    },
  ];

  if (scale === 'threshold') {
    return [
      ...rangeFields,
      {
        name: 'nodeThresholds',
        type: 'text',
        label: 'Node bucket edges',
        description: 'Comma-separated, in the node field’s units — "10, 50, 200" gives four buckets.',
      },
      {
        name: 'edgeThresholds',
        type: 'text',
        label: 'Edge bucket edges',
        description: 'Comma-separated, in the edge field’s units.',
      },
    ];
  }

  const domainFields: FieldConfig[] = [
    {
      name: 'nodeDomainMin',
      type: 'number',
      label: 'Node domain min',
      description:
        'Leave both bounds blank to auto-scan. ⚠️ With auto-domain, loading a node that widens the range recolours every other node — set it explicitly for stable colours across a streaming load.',
    },
    { name: 'nodeDomainMax', type: 'number', label: 'Node domain max' },
    {
      name: 'edgeDomainMin',
      type: 'number',
      label: 'Edge domain min',
      description: 'Leave both bounds blank to auto-scan. Separate from the node domain because the two fields rarely share units.',
    },
    { name: 'edgeDomainMax', type: 'number', label: 'Edge domain max' },
  ];

  if (scale === 'quantile') {
    return [
      ...rangeFields,
      {
        name: 'bins',
        type: 'number',
        label: 'Bins',
        description: 'Number of equal-count buckets. Default 5.',
      },
      ...domainFields,
    ];
  }

  return continuous ? [...rangeFields, ...domainFields] : rangeFields;
}
