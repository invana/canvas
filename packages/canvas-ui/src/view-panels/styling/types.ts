// Per-type styling **value** types — the contract between `StylingViewPanel` and
// its host. Kept apart from the component because this is a *persisted* shape:
// Invana stores a `TypeStylingPatch` on the canvas record and feeds it straight
// back as `value`, so it needs to be importable without pulling the view in.
//
// > **Overlaps the engine vocabulary.** `@invana/graph` already models per-type
// > styling as `NodeTypeBinding` / `NodeStylingRegistry` (structure + styling +
// > slot bindings, colours as `ColorRole`), and per-type *colour* specifically is
// > `ColorByBehaviour({ nodeValueKey: 'type', valueColors })`. These types are a
// > flat, hex-encoded narrowing of that, which is why the patch can't be handed
// > to `GraphLayer` as-is. Unifying them is deferred — see the discussion in
// > `StylingViewPanel.tsx`'s header.

import type { GraphCanvas } from '@invana/graph';
import type { ColorPreset } from '@invana/forms';

/** Styling a host may set on one **node type**. */
export interface NodeTypeStyling {
  /** CSS colour (`#rrggbb`) painted on every node of the type. */
  color?: string;
  /**
   * **Root-relative dot path** to the value that labels the node, instead of the
   * default label — `'id'`, `'type'`, `'data.name'`, `'data.meta.tier'`.
   *
   * The same addressing `ColorByBehaviour.nodeValueKey` uses, and for the same
   * reason: a string path survives serialisation, so it can be persisted on the
   * canvas record and handed back. It also disambiguates a node's root `type`
   * from a `type` **key inside `data`** — both occur (`defaultNodeTypeOf` reads
   * `data.type` as a fallback), and a bare property name could not tell them
   * apart.
   */
  labelKey?: string;
  /** Node size (radius/diameter, host's convention) in canvas units. */
  size?: number;
}

/** Styling a host may set on one **edge type**. */
export interface EdgeTypeStyling {
  /** CSS colour (`#rrggbb`) painted on every edge of the type. */
  color?: string;
  /** Connector width in canvas units. */
  width?: number;
}

/**
 * The whole patch — per-type styling keyed by type name, for the node and edge
 * types on the canvas. Plain JSON by design: a host persists it as it stands and
 * hands it straight back as {@link StylingViewPanelProps.value}.
 */
export interface TypeStylingPatch {
  nodeTypes?: Record<string, NodeTypeStyling>;
  edgeTypes?: Record<string, EdgeTypeStyling>;
}

export interface StylingViewPanelProps {
  /**
   * The live canvas engine — the source of the type list. **Optional**: omit it
   * inside a `<GraphCanvas>` / `GraphCanvasApp` tree and the panel binds to the
   * nearest one via `GraphCanvasContext`. Pass it to target a specific instance
   * from outside that subtree.
   */
  canvas?: GraphCanvas | null;
  /** GraphLayer id whose types are styled. Default `'graph'`. */
  layerId?: string;
  /** The current styling — controlled. */
  value: TypeStylingPatch;
  /** Called with the **whole** next patch on every edit; the host persists it. */
  onChange: (next: TypeStylingPatch) => void;
  /**
   * Swatch presets offered in each colour popover. Default `COLOR_PRESETS` —
   * the same palette every `editors/` colour field offers, so a colour picked
   * here matches one picked in a style editor.
   */
  presetColors?: ColorPreset[];
  /** Smallest / largest node size offered. Defaults `4` / `64`. */
  sizeRange?: [number, number];
  /** Smallest / largest edge width offered. Defaults `0.5` / `12`. */
  widthRange?: [number, number];
  /**
   * Paint the patch onto the canvas as it's edited. Default `true`.
   *
   * The panel applies it as **template field resolvers** on the target
   * `GraphLayer`, so later-arriving nodes are styled on arrival (see
   * `useApplyTypeStyling`). Set `false` for a host that renders the patch its
   * own way, or to show the panel against a canvas it must not touch.
   *
   * Independent of {@link onChange} — that always fires, because the host still
   * owns *persisting* the patch.
   */
  apply?: boolean;
  /** Shown when the canvas holds no types yet. */
  emptyText?: string;
  /** Class on the panel's root. */
  className?: string;
}
