import * as react from 'react';
import { ReactNode, ComponentType, CSSProperties, ReactElement } from 'react';
import { GraphCanvas, CompositePart, CompositeShapeOption, NodeStyle, HoverElementPreviewCardSpec, PreviewRowFormat, NodeTypeBinding, ResolvedPreviewCard, NodeStylingTemplate, ColorRole, GraphNode, GraphEdge, DeriveSchemaOptions, GraphSchema, EdgePathType, GraphCanvasCommandMap, GraphData } from '@invana/graph';
export { DeriveSchemaOptions, GraphSchema, SchemaEdgeConnection, SchemaEdgeType, SchemaNodeType, SchemaProperty, defaultEdgeTypeOf, defaultNodeTypeOf, deriveSchema, schemaSignature } from '@invana/graph';
import { FieldConfig, ColorPreset } from '@invana/forms';
import { CommandArgSpec, ControlPanelPlacement, ControlItemSpec, ControlPanelSpec, Canvas, CanvasStateSnapshot, CommandName, CanvasConfig, CanvasTelemetryConfig, BackgroundLayerOptions as BackgroundLayerOptions$1 } from '@invana/canvas';
import { LayoutFactory, RenderPreference, GraphTool, ViewContext, MiniMapLayerProps, DevInfoLayerProps } from '@invana/canvas-react';
export { CanvasThemeSync, CanvasThemeSyncProps } from '@invana/canvas-react';
import { BottomSpan } from '@invana/themes';
export { BottomSpan } from '@invana/themes';
import { MenuItem } from '@invana/ui';

/**
 * The three id-keyed config sections, mirroring `CanvasConfig`
 * (`layers` / `behaviours` / `layouts`). A patch for an instance applies under
 * its section: `canvas.update({ [section]: { [id]: patch } })`.
 */
type SettingsSection$1 = 'layers' | 'behaviours' | 'layouts';
/**
 * One editable instance in the definition — a registered Layer / Behaviour /
 * Layout. `kind` keys into the schema registry to resolve its form; `settings`
 * are the instance's current **engine-shaped** options (the panel maps them to
 * flat form values internally via the registry entry's `toForm`).
 */
interface CanvasSettingsInstance {
    /** The instance's registry id — the key its config lives under. */
    id: string;
    /** Registry key (e.g. `'background-layer'`); resolves the field schema + mappers. */
    kind: string;
    /** Overrides the registry's display label for this instance. */
    typeLabel?: string;
    /**
     * Enable state for layers / behaviours — drives the row's toggle. `undefined`
     * (the norm for layouts) hides the toggle.
     */
    enabled?: boolean;
    /** The instance's current options, in the engine's shape (pre-mapping). */
    settings?: Record<string, unknown>;
}
/**
 * The full canvas settings definition the panel browses — every registered
 * instance grouped by section, plus the active layout id (badged in the Layouts
 * group).
 */
interface CanvasSettingsDefinition {
    layers?: CanvasSettingsInstance[];
    behaviours?: CanvasSettingsInstance[];
    layouts?: CanvasSettingsInstance[];
    /** Id of the active layout — badged `active` in the Layouts group. */
    activeLayoutId?: string;
}

/**
 * One registry entry: everything `CanvasSettingsEditorPanel` needs to render + wire
 * one instance's settings form. Bundles the display label, the `@invana/forms`
 * field schema (static array or a `(values) => FieldConfig[]` function for the
 * conditional schemas), and the two pure mappers that bridge the engine's option
 * encoding and the flat scalar fields the form edits.
 *
 * `settings` is left untyped (`any`) here on purpose — each entry pairs a schema
 * with its own `Options`/`Fields` shapes, and the panel treats them opaquely.
 */
interface SettingsSchemaEntry {
    /** Which config section this kind lives under (`layers` / `behaviours` / `layouts`). */
    section: SettingsSection$1;
    /** Human label for the kind, shown next to the instance id (e.g. `'Background Layer'`). */
    typeLabel: string;
    /** `@invana/forms` schema — a static array or a function of the live form values. */
    fields: FieldConfig[] | ((values: any) => FieldConfig[]);
    /** Seed the flat form values from an instance's engine-shaped options. */
    toForm: (options: any) => any;
    /** Map the flat form values back to an engine-shaped options patch. */
    toOptions: (fields: any) => any;
}
/**
 * The built-in schema registry keyed by `kind`. Covers every Behaviour / Layer /
 * Layout that ships an editor in `@invana/canvas-ui` — the same coverage the
 * live `ALL_SETTINGS_EDITORS` descriptor list carries. Hosts can pass a superset
 * / subset via `CanvasSettingsEditorPanel`'s `schemas` prop.
 */
declare const DEFAULT_CANVAS_SETTINGS_SCHEMAS: Record<string, SettingsSchemaEntry>;

interface CanvasSettingsEditorPanelProps {
    /**
     * The live engine to edit — **required**. Pass it explicitly (e.g. from a
     * `GraphCanvasApp` region's `content: (ctx) => …ctx.canvas`). `null` until the
     * engine is ready; the panel renders a fallback while it is.
     */
    canvas: GraphCanvas | null;
    /** Extra classes merged onto the outer `Card` (e.g. to flatten chrome in a docked region). */
    className?: string;
    /**
     * Map a live layer/behaviour/layout instance to its settings-schema registry
     * `kind`. Defaults to `instance.kind ?? constructor.name`; pass a class-based
     * (`instanceof`) resolver for minified builds.
     */
    resolveKind?: (instance: unknown) => string | undefined;
    /**
     * The schema registry (`kind` → fields + mappers). Defaults to
     * {@link DEFAULT_CANVAS_SETTINGS_SCHEMAS} — the full built-in coverage. Pass a
     * superset to register custom kinds, or a subset to narrow it.
     */
    schemas?: Record<string, SettingsSchemaEntry>;
    /**
     * `'live'` (default) applies every field edit immediately; `'manual'` batches
     * edits behind a per-row **Apply** button.
     */
    applyMode?: 'live' | 'manual';
    /** Panel heading. Default `'Canvas Settings'`; pass `null` to omit. */
    title?: ReactNode;
    /**
     * Add a **Control panels** section (the `ControlPanelsEditor`: the floating
     * panels in `definition.controlPanels`) after Layouts. Default `true`.
     */
    showControlPanels?: boolean;
}
/**
 * Store-connected canvas settings panel over a whole canvas definition. Pass the
 * live engine as the **required `canvas` prop** (e.g. from a `GraphCanvasApp`
 * region's `content: (ctx) => <CanvasSettingsEditorPanel canvas={ctx.canvas} />`).
 * It reads the settings from `store.view.definition` and writes every edit back
 * via `canvas.update(...)` — no bridge to hand-wire.
 *
 * A **file-browser-style** panel: the three sections (Layers / Behaviours /
 * Layouts) are a `PanelStack` (the VS-Code "view container": collapsible,
 * resizable panels whose headers stay visible). Each section lists its live
 * instances (files); expanding a row reveals that instance's schema-driven form
 * **in place** and every edit maps to an engine-shaped patch applied via
 * `canvas.update(...)`.
 *
 * This is a thin **validation guard**: `canvas` is required, so if it's missing
 * (or not ready yet) it renders a fallback and the real work runs in
 * {@link CanvasSettingsEditorPanelContent} with a guaranteed-live canvas — which
 * lets the body read the store with the plain reactive `useStore`, no null-safety
 * plumbing.
 *
 * **Sizing:** the `PanelStack` fills its parent's height, so mount this in a
 * sized container (a fixed-height sidebar, a flex/grid track, `h-full`).
 */
declare function CanvasSettingsEditorPanel({ canvas, className, ...rest }: CanvasSettingsEditorPanelProps): react.JSX.Element;

/**
 * Root-silhouette kinds the composite editor's **Root** section exposes.
 * `'none'` omits `root` → the default rounded-rect body built from
 * `cornerRadius` + the body `fill` / `stroke`. `CompositeRootSpec` also allows
 * `ellipse` / `polygon` / `arc`; the editor covers the common four for v1 (a
 * root of another kind round-trips as `'none'` — see `mapping.ts`).
 */
type CompositeRootKind = 'none' | 'rect' | 'circle' | 'regular-polygon' | 'star';
/** Part kinds the parts list can add — the full {@link CompositePart} union. */
type CompositePartKind = CompositePart['part'];
/**
 * Icon-inset kinds the `icon` part exposes. The engine's `InsetLayer` union also
 * has a raw `'svg'` (path-d) variant; the editor supports the two common inset
 * forms in v1 (an `'svg'` icon round-trips as `'glyph'`).
 */
type CompositeIconKind = 'glyph' | 'svg-url';
/**
 * Body + root scalar controls the editor renders under the `composite`
 * `ObjectField`. Colours are `#rrggbb` strings (the swatch encoding); the root
 * discriminated union is flattened to `rootKind` + per-kind geometry numbers,
 * mirroring the simple editor's `shapeKind` handling. `mapping.ts` round-trips
 * this against the `CompositeShapeOption` body + `root`.
 */
interface CompositeScalarFields {
    width?: number;
    height?: number;
    cornerRadius?: number;
    /** Body fill (`#rrggbb`). Also painted onto a chosen root silhouette. */
    fill?: string;
    fillAlpha?: number;
    /** Body stroke colour (`#rrggbb`). */
    strokeColor?: string;
    strokeWidth?: number;
    strokeAlpha?: number;
    /** Clip parts to the root silhouette (edge-touching parts follow the corners). */
    clip?: boolean;
    rootKind?: CompositeRootKind;
    rootRadius?: number;
    rootWidth?: number;
    rootHeight?: number;
    rootCornerRadius?: number;
    rootSides?: number;
    rootPoints?: number;
    rootInnerRadius?: number;
    rootOuterRadius?: number;
}
/**
 * One flat parts-list row (a `parts.${i}` `ObjectField`). Carries every
 * possible part field; the editor shows only the subset for the row's `part`
 * kind (see `partRowFields`). Nested `stroke {}` / `icon` `InsetLayer` and the
 * label/icon colours are flattened to scalars here and rebuilt in `mapping.ts`.
 */
interface CompositePartRow {
    part: CompositePartKind;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    cornerRadius?: number;
    radius?: number;
    x2?: number;
    y2?: number;
    fill?: string;
    fillAlpha?: number;
    strokeColor?: string;
    strokeWidth?: number;
    strokeAlpha?: number;
    /** Addressable sub-part id for hit-testing (rect / circle / icon). */
    hitId?: string;
    text?: string;
    anchor?: 'left' | 'center' | 'right';
    fontSize?: number;
    fontWeight?: number;
    fontStyle?: 'normal' | 'italic';
    /** Label text colour (`#rrggbb`); maps to the label part's `fill`. */
    labelFill?: string;
    lineHeight?: number;
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
    maxLines?: number;
    overflow?: 'clip' | 'ellipsis';
    size?: number;
    iconKind?: CompositeIconKind;
    iconChar?: string;
    iconUrl?: string;
    /** Icon glyph / stroke colour (`#rrggbb`). */
    iconColor?: string;
    /** Chip traced behind the glyph (`#rrggbb`). */
    iconBackgroundFill?: string;
}
/**
 * react-hook-form state shape. Body/root scalars nest under `composite` (an
 * `ObjectField`); `parts` is the top-level `useFieldArray`. `compositeToForm` /
 * `formToComposite` round-trip between this and a `CompositeShapeOption`.
 */
interface CompositeFormState {
    composite: CompositeScalarFields;
    parts: CompositePartRow[];
}

interface CompositeNodeStyleEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Same shape the
     * form produces ({@link CompositeFormState}); seed it from a
     * `CompositeShapeOption` with the exported `compositeToForm`. Remount (via
     * `key`) to reload. Mirrors the simple editor's `defaults` contract.
     */
    defaults?: CompositeFormState;
    /**
     * Optional **body + root** scalar schema **override**. A static `FieldConfig[]`
     * or a function of the current scalar values. When supplied, it replaces the
     * built-in layout with a single flat scalar `ObjectField`. When **omitted**
     * (the default), the editor renders its two-tier layout: a Basics tier (the
     * body fill colour) plus a collapsed "Advanced settings" disclosure holding the
     * rest of the body/root fields and the parts list. (The per-part controls are
     * always the built-in dynamic {@link partRowFields}.)
     */
    fields?: FieldConfig[] | ((values: CompositeScalarFields) => FieldConfig[]);
    /**
     * Called with the current values when the user submits. Map back to a
     * `CompositeShapeOption` with `formToComposite` and apply it wherever — e.g.
     * `store.updateNode(id, { style: { shape: formToComposite(values) } })`. The
     * component itself does no commit.
     */
    onSubmit: (values: CompositeFormState) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic editor for a **composite / card** node — the
 * full `CompositeShapeOption` spec: the body (size / fill / stroke / clip), an
 * optional root silhouette, and the ordered `parts[]` list (rect / circle /
 * line / label / icon) as `useFieldArray` rows whose controls switch on each
 * row's `part` kind. Produces pure form values; no `Canvas`, no engine, no
 * commit. Rendered by `NodeStyleEditorPanel` when `kind === 'composite'`; usable
 * standalone.
 *
 * The `CompositeShapeOption` ⇄ form mapping (`compositeToForm` / `formToComposite`)
 * is the consumer's plug-in, used in `defaults` and inside `onSubmit` — the same
 * contract as the simple editor's `styleToForm` / `formToStyle`.
 */
declare function CompositeNodeStyleEditorPanel({ defaults, fields, onSubmit, submitLabel, }: CompositeNodeStyleEditorPanelProps): react.JSX.Element;

/** Root-tab fields for the current `rootKind` (kind select + its geometry). */
declare function rootFields(kind: CompositeRootKind | undefined): FieldConfig[];
/**
 * The **Basics** scalar field set — the single card body fill colour, shown
 * up-front and ungrouped. Everything else (body size / stroke / clip, the root
 * silhouette) lives in {@link advancedCompositeScalarFields}. A function of the
 * values for symmetry with the advanced set.
 */
declare function basicCompositeFields(_values?: CompositeScalarFields): FieldConfig[];
/**
 * The **Advanced** scalar field set — everything beyond the body fill, grouped
 * into **Body** (size + paint) and **Root** (silhouette) accordion sections; the
 * Root numerics vary with `rootKind`. Rendered inside the editor's collapsed
 * "Advanced settings" disclosure, above the parts list.
 */
declare function advancedCompositeScalarFields(values?: CompositeScalarFields): FieldConfig[];
/**
 * The composite body + root field set as one grouped `FieldConfig[]` — basics
 * (fill) folded back into the Body group. Retained as the `fields`-override /
 * back-compat export; the default editor render is the two-tier basics +
 * collapsed-advanced layout.
 */
declare function compositeScalarFields(values?: CompositeScalarFields): FieldConfig[];
/**
 * Controls for one parts row, chosen by its `part` kind — the discriminated
 * union the parts `useFieldArray` renders per row. Undefined kind → just the
 * kind select (until a value settles).
 */
declare function partRowFields(kind: CompositePartKind | undefined): FieldConfig[];

/**
 * Map a `CompositeShapeOption` to the flat {@link CompositeFormState} the
 * generator renders — body scalars, the `root` union flattened to
 * `rootKind` + geometry, and each part to a flat row. Colours become hex; a
 * missing option seeds an empty card.
 */
declare function compositeToForm(option?: CompositeShapeOption): CompositeFormState;
/**
 * Inverse of {@link compositeToForm}: the form state → a `CompositeShapeOption`.
 * `width`/`height` default (160×96) so the result is always a valid card;
 * optional body fields are included only when set. Safe to hand to
 * `store.updateNode(id, { style: { shape: formToComposite(values) } })`.
 */
declare function formToComposite(state: CompositeFormState): CompositeShapeOption;

/** Shape kinds the v1 geometry tab exposes. */
type ShapeKind = NonNullable<NodeStyle['shape']>['kind'];
type StrokeAlignment = NonNullable<NodeStyle['bgStrokeAlignment']>;
type StrokeCap = NonNullable<NodeStyle['bgStrokeCap']>;
type StrokeJoin = NonNullable<NodeStyle['bgStrokeJoin']>;
type LabelPlacement = NonNullable<NodeStyle['labelPlacement']>;
/** Strip `readonly` (NodeStyle's fields are readonly) so the form holds a
 * plain mutable value object. Homomorphic — preserves optionality. */
type Mutable<T> = {
    -readonly [K in keyof T]: T[K];
};
/**
 * NodeStyle fields the form takes **verbatim** — same name, same type. Derived
 * from {@link NodeStyle} via `Pick`, so their types track the engine and a
 * renamed/removed field surfaces here as a compile error (no silent drift).
 * Add a scalar passthrough control = add its key here.
 */
type NodeStylePassthroughFields = Mutable<Pick<NodeStyle, 'size' | 'bgAlpha' | 'bgStrokeAlpha' | 'bgStrokeWidth' | 'bgStrokeAlignment' | 'bgStrokeCap' | 'bgStrokeJoin' | 'labelText' | 'labelFontSize' | 'labelPlacement' | 'labelOffsetX' | 'labelOffsetY'>>;
/**
 * Fields whose form encoding deliberately **differs** from {@link NodeStyle},
 * so they can't be `Pick`ed — `mapping.ts` converts them:
 *  - `shape` discriminated union → `shapeKind` select + per-kind geometry numbers,
 *  - colours → hex strings (the design-kit swatch's encoding) not `0xRRGGBB`,
 *  - the `[dash, gap]` tuple → two number fields,
 *  - `labelFontWeight` narrowed to `number` (NodeStyle allows `number | string`).
 *
 * Drift on the *source* fields is still caught: `styleToForm` reads
 * `style.shape` / `style.bgFill` / `style.bgStrokeDashArray` / … directly, so a
 * rename in `NodeStyle` breaks `mapping.ts` at compile time.
 */
interface NodeStyleEncodedFields {
    shapeKind?: ShapeKind;
    radius?: number;
    width?: number;
    height?: number;
    cornerRadius?: number;
    sides?: number;
    points?: number;
    innerRadius?: number;
    outerRadius?: number;
    bgFill?: string;
    bgStrokeColor?: string;
    labelColor?: string;
    bgStrokeDashLength?: number;
    bgStrokeDashGap?: number;
    labelFontWeight?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The passthrough
 * half is **derived from {@link NodeStyle}**; the rest is re-encoded for scalar
 * inputs (see {@link NodeStyleEncodedFields}). `styleToForm` / `formToStyle`
 * (`mapping.ts`) round-trip between this and `Partial<NodeStyle>`.
 */
type NodeStyleFields = NodeStylePassthroughFields & NodeStyleEncodedFields;
/**
 * react-hook-form state shape. `<ObjectField name="style" …>` registers each
 * leaf under `style.<field>`, so the form's values nest under a `style` key.
 * This is the type the consumer parameterises its `useForm` with.
 */
interface NodeStyleFormState {
    style: NodeStyleFields;
}

interface SimpleNodeStyleEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Same shape the
     * form produces (see {@link NodeStyleFields}); seed it from an engine style
     * with the exported `styleToForm`. Remount (via `key`) to reload.
     */
    defaults?: NodeStyleFields;
    /**
     * Optional schema **override**. Either a static `FieldConfig[]` or a function
     * of the current values (the function form lets fields react to other fields).
     * When supplied, it replaces the built-in layout with a single flat
     * `ObjectField`. When **omitted** (the default), the editor renders its
     * two-tier layout: a Basics tier (shape / fill / size) plus a collapsed
     * "Advanced settings" disclosure holding the rest.
     */
    fields?: FieldConfig[] | ((values: NodeStyleFields) => FieldConfig[]);
    /**
     * Called with the current values when the user submits. This is where the
     * consumer puts its logic — map back to a style with `formToStyle` and apply
     * it wherever (a node, many nodes, an undo stack, …). The component itself
     * does none of that.
     */
    onSubmit: (values: NodeStyleFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic style form for a **simple** node — the flat
 * `NodeStyle` surface (Geometry / Background / Stroke / Label). Rendered by
 * `NodeStyleEditorPanel` when `kind === 'simple'`; usable standalone too.
 *
 * Takes `defaults` + `fields`, owns a react-hook-form instance, renders the
 * schema with `@invana/forms` (each field `group` becomes an accordion
 * section), and on submit hands the current values to `onSubmit`. It knows
 * nothing about `Canvas`, layers, or how a style is stored — it just loads the
 * defaults and tracks the user's edits in the shape the `fields` define.
 *
 * The NodeStyle ⇄ form-fields mapping (`styleToForm` / `formToStyle`) is the
 * consumer's plug-in, used in `defaults` and inside `onSubmit`.
 */
declare function SimpleNodeStyleEditorPanel({ defaults, fields, onSubmit, submitLabel, }: SimpleNodeStyleEditorPanelProps): react.JSX.Element;

/**
 * Geometry-tab fields for the current shape kind. Dynamic: the per-kind
 * numerics (radius / width-height / sides / points…) change with the watched
 * `shapeKind`, which is how the form-generator handles the discriminated
 * union. Falls back to no geometry numerics until a kind is chosen.
 */
declare function geometryFields(kind: ShapeKind | undefined): FieldConfig[];
declare const BACKGROUND_FIELDS: FieldConfig[];
declare const STROKE_FIELDS: FieldConfig[];
declare const LABEL_FIELDS: FieldConfig[];
/**
 * The **Basics** field set — the 80% controls shown up-front, ungrouped (no
 * accordion): the shape kind, the fill colour, and the unified `size`. Detailed
 * per-kind geometry, alpha, stroke and label live in
 * {@link advancedNodeStyleFields}. Kept a function of the live values for
 * symmetry with the advanced set (and future value-dependent basics).
 */
declare function basicNodeStyleFields(_values?: NodeStyleFields): FieldConfig[];
/**
 * The **Advanced** field set — everything beyond the basics, grouped so
 * `@invana/forms` renders each `group` as an accordion section: per-kind
 * Geometry numerics (varying with `shapeKind`), Background alpha, the full
 * Stroke controls, and the full Label controls. Rendered inside the editor's
 * collapsed "Advanced settings" disclosure.
 */
declare function advancedNodeStyleFields(values?: NodeStyleFields): FieldConfig[];
/**
 * The full NodeStyle field set as one grouped `FieldConfig[]` — basics followed
 * by the advanced groups. Retained as the `fields`-override / back-compat
 * export; the default editor render is the two-tier basics + collapsed-advanced
 * layout (see {@link basicNodeStyleFields} / {@link advancedNodeStyleFields}).
 */
declare function nodeStyleFields(values?: NodeStyleFields): FieldConfig[];

/**
 * Construct a fresh shape spec with sane defaults for a given kind. Used when
 * the user switches `shapeKind` and there's no seeded geometry to preserve.
 */
declare function defaultShapeFor(kind: ShapeKind): NonNullable<NodeStyle['shape']>;
/**
 * Map an engine `Partial<NodeStyle>` (e.g. the result of
 * `layer.resolveNodeStyle(node)`) to the flat, string-colour
 * {@link NodeStyleFields} the `@invana/forms` generator renders.
 *
 * Extracts only the literal fields the editor handles, guarding non-scalar
 * values (image / glyph fills, string font weights) so they round-trip as
 * `undefined` rather than corrupting a field. The `shape` discriminated union
 * is flattened to `shapeKind` + the geometry numbers of that kind; the dash
 * tuple is split; colours become hex strings.
 */
declare function styleToForm(style: Partial<NodeStyle>): NodeStyleFields;
/**
 * Map the flat {@link NodeStyleFields} the form holds back to an engine
 * `Partial<NodeStyle>` — inverse of {@link styleToForm}. Only fields the form
 * actually set are included (no `undefined` keys), so the result is safe to
 * spread over an existing style on commit:
 * `store.updateNode(id, { style: { ...resolveNodeStyle(node), ...formToStyle(fields) } })`.
 */
declare function formToStyle(f: NodeStyleFields): Partial<NodeStyle>;

/**
 * Props for {@link NodeStyleEditorPanel} — a discriminated union on the node `kind`.
 * The consumer passes the selected node's kind (from its `shape.kind`:
 * `'composite'` vs a built-in simple kind) plus that variant's own props. The
 * component is engine-agnostic — it can't inspect a live pixi node, so the kind
 * is explicit, per `packages/canvas-ui/CLAUDE.md`.
 */
type NodeStyleEditorPanelProps = ({
    kind?: 'simple';
} & SimpleNodeStyleEditorPanelProps) | ({
    kind: 'composite';
} & CompositeNodeStyleEditorPanelProps);
/**
 * Dispatcher over the two full-spec node style editors: renders
 * {@link CompositeNodeStyleEditorPanel} for a composite / card node (editing a
 * `CompositeShapeOption`) and {@link SimpleNodeStyleEditorPanel} otherwise (editing
 * the flat `NodeStyle`). Each variant owns its own form, mapping, and
 * `onSubmit` payload; this only picks which to mount.
 */
declare function NodeStyleEditorPanel(props: NodeStyleEditorPanelProps): react.JSX.Element;

/**
 * The one field the {@link NodeStyleOverviewEditorPanel} renders — a single colour
 * (`#rrggbb`, the swatch encoding). Deliberately minimal: the "overview" editor
 * only recolours a node, working for both simple shapes and composite cards.
 * `colorToForm` / `formToColor` (`mapping.ts`) round-trip it against the engine's
 * `0xRRGGBB`.
 */
interface NodeStyleOverviewFields {
    /** Node colour (`#rrggbb`). */
    color?: string;
}
/**
 * react-hook-form state shape. `<ObjectField name="overview" …>` registers the
 * colour leaf at `overview.color`.
 */
interface NodeStyleOverviewFormState {
    overview: NodeStyleOverviewFields;
}

interface NodeStyleOverviewEditorPanelProps {
    /**
     * Initial field values, loaded once on mount. Seed from an engine colour with
     * the exported `colorToForm`. Remount (via `key`) to reload.
     */
    defaults?: NodeStyleOverviewFields;
    /**
     * The form schema. Defaults to the single-colour {@link nodeStyleOverviewFields}.
     */
    fields?: FieldConfig[];
    /**
     * Optional Apply handler. When provided, an Apply button is rendered that
     * calls this with the current values; map back with `formToColor` and turn it
     * into a style patch with `recolorNodeStyle`. **Omit it for pure live editing**
     * — with only {@link onChange} set, no button renders and every pick applies
     * immediately. The component does no commit either way.
     */
    onSubmit?: (values: NodeStyleOverviewFields) => void;
    /**
     * **Live** callback — fired on every change with the current values. This is
     * the primary path for the overview editor (recolour on each pick). Memoise it
     * to avoid re-subscribing each render.
     */
    onChange?: (values: NodeStyleOverviewFields) => void;
    /** Submit button label (only shown when {@link onSubmit} is set). Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic **overview** editor — a single colour control
 * that recolours a node. Deliberately minimal: it only edits a colour, and the
 * paired `recolorNodeStyle` mapper turns that colour into the right patch for a
 * simple shape (`bgFill`) or a composite card (body + accent parts). No `Canvas`,
 * no engine, no commit — just produces the colour value.
 */
declare function NodeStyleOverviewEditorPanel({ defaults, fields, onSubmit, onChange, submitLabel, }: NodeStyleOverviewEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` schema for {@link NodeStyleOverviewEditorPanel} — a single colour
 * control. The field `name` matches {@link NodeStyleOverviewFields} 1:1, so the
 * generator's `overview.color` path lines up with `mapping.ts`.
 */
declare const nodeStyleOverviewFields: FieldConfig[];

/** Seed the form from an engine colour (`0xRRGGBB` → `#rrggbb`). Non-numeric
 * (unset) colours seed an empty field. */
declare function colorToForm(color?: number): NodeStyleOverviewFields;
/** Read the chosen colour back as an engine `0xRRGGBB`, or `undefined` if the
 * field was left blank. */
declare function formToColor(f: NodeStyleOverviewFields): number | undefined;
/**
 * Build the `Partial<NodeStyle>` patch that recolours a node — the "works for
 * both kinds" bridge:
 *
 * - **composite / card** (`style.shape.kind === 'composite'`) → recolour the
 *   card **body** `fill` **and** every solid **accent part** (a `rect` / `circle`
 *   part that already carries a `fill`). Label parts keep their text colour so
 *   copy stays readable.
 * - **simple shape** → set `bgFill`.
 *
 * Spread over the node's resolved style on apply (since `updateNode` replaces
 * `style` wholesale):
 * `store.updateNode(id, { style: { ...resolveNodeStyle(node), ...recolorNodeStyle(style, color) } })`.
 */
declare function recolorNodeStyle(style: Partial<NodeStyle>, color: number): Partial<NodeStyle>;

interface HoverPreviewCardEditorPanelProps {
    /**
     * Initial card spec, loaded once on mount. Remount (via `key`) to reload.
     * Seed it from a per-type entry of `HoverElementPreviewBehaviour`'s `cards`
     * (e.g. `cards.nodes.person`).
     */
    defaults?: HoverElementPreviewCardSpec;
    /**
     * Called with the produced spec when the user applies. The consumer stores it
     * back into `cards.nodes[type]` / `cards.edges[type]` (display settings) and
     * feeds it to the behaviour. The editor itself holds no engine reference.
     */
    onSubmit: (spec: HoverElementPreviewCardSpec) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic editor for **one** `HoverElementPreviewCardSpec`
 * — the per-type card definition (which field is the avatar / title / subtitle,
 * and a list of property rows). Produces pure JSON, so a host builds a per-type
 * `cards` config by composing one editor per node/edge type.
 *
 * Mirrors `NodeStyleEditorPanel`: owns a react-hook-form, renders the scalar controls
 * via the `@invana/forms` generator (`ObjectField`), the rows via a
 * `useFieldArray`, and hands `formToSpec(values)` to `onSubmit`. No `Canvas`,
 * no engine, no commit.
 */
declare function HoverPreviewCardEditorPanel({ defaults, onSubmit, submitLabel, }: HoverPreviewCardEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` schemas for the hover-preview-card editor. The scalar fields
 * map 1:1 to {@link CardScalarFields}; the row fields to {@link CardRowField}.
 * Adding a control = one `FieldConfig` here + the matching key in the form type
 * + a line in `mapping.ts` — no bespoke JSX.
 */
/** Image / title / subtitle controls (rendered under the `card` ObjectField). */
declare const CARD_SCALAR_FIELDS: FieldConfig[];
/** Per-row controls (rendered under each `rows.<i>` ObjectField). */
declare const CARD_ROW_FIELDS: FieldConfig[];

/** Avatar shape options for the preview card. */
type CardImageShape = 'rounded' | 'circle';
/** Scalar (non-array) fields of the card editor — image / title / subtitle. */
interface CardScalarFields {
    /** Dotted field path for the avatar image (blank → no image). */
    imageField: string;
    imageShape: CardImageShape;
    /** Dotted field path for the title. */
    titleField: string;
    /** Dotted field path for the subtitle. */
    subtitleField: string;
    subtitleMaxLines: number;
}
/** One property-row entry. */
interface CardRowField {
    label: string;
    field: string;
    format: PreviewRowFormat;
}
/**
 * The editor's react-hook-form state — scalars under `card` (rendered by an
 * `ObjectField`) and `rows` as a `useFieldArray`. `specToForm` / `formToSpec`
 * bridge this and the serializable `HoverElementPreviewCardSpec`.
 */
interface CardSpecFields {
    card: CardScalarFields;
    rows: CardRowField[];
}

/** Seed the form from a serializable card spec (use as `defaults`). */
declare function specToForm(spec?: HoverElementPreviewCardSpec): CardSpecFields;
/** Read the form back into a pruned, serializable card spec (omits empty fields). */
declare function formToSpec(values: CardSpecFields): HoverElementPreviewCardSpec;

interface NodeStructureEditorPanelProps {
    /**
     * Initial binding, loaded once on mount. Remount (via `key`) to reload. Seed
     * from a `GraphLayerOptions.nodeTypes` entry.
     */
    defaults?: NodeTypeBinding;
    /** Registered structure-template names to offer in the Structure picker. */
    structures: string[];
    /** Registered styling-template names to offer in the Styling picker. */
    stylings: string[];
    /**
     * Called with the produced binding on Apply. The consumer stores it back into
     * `nodeTypes[type]` and pushes it via
     * `canvas.update({ layers: { graph: { nodeTypes } } })`.
     */
    onSubmit: (binding: NodeTypeBinding) => void;
    /**
     * Optional **live** callback — fired on every form change with the mapped
     * binding, for instant-preview hosts. Independent of {@link onSubmit}.
     * Memoise it to avoid re-subscribing each render.
     */
    onChange?: (binding: NodeTypeBinding) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic editor for **one** `NodeTypeBinding` — the
 * per-type wiring: which structure + styling template, plus the slot → data
 * field map (the {@link SLOT_BINDING_FIELDS} `SlotBindingField` rows). Produces
 * pure JSON; no `Canvas`, no engine, no commit. The structure/styling pickers
 * are populated from the host's registered template names.
 */
declare function NodeStructureEditorPanel({ defaults, structures, stylings, onSubmit, onChange, submitLabel, }: NodeStructureEditorPanelProps): react.JSX.Element;

/**
 * Field schema for {@link NodeStructureEditorPanel}. The structure / styling selects
 * depend on which templates the host has registered, so they're built from the
 * editor's `structures` / `stylings` props via {@link bindingScalarFields}.
 */
/** Build the scalar (structure + styling select) fields from available names. */
declare function bindingScalarFields(structures: string[], stylings: string[]): FieldConfig[];

/**
 * react-hook-form state for {@link NodeStructureEditorPanel} — a per-type binding:
 * which structure + styling template, and the slot → data-field map.
 */
/** Scalar controls: the chosen structure + styling template names. */
interface NodeStructureScalarFields {
    structure: string;
    styling: string;
}
/** One slot → data-field row (the shared `SlotBindingField`). */
interface BindingRow {
    slot: string;
    path: string;
}
/** The editor's full form state. */
interface NodeStructureFormState {
    binding: NodeStructureScalarFields;
    bindings: BindingRow[];
}

/** Seed the form from a `NodeTypeBinding` (use as `defaults`). */
declare function bindingToForm(binding?: NodeTypeBinding): NodeStructureFormState;
/** Read the form back into a `NodeTypeBinding` (drops empty rows). */
declare function formToBinding(values: NodeStructureFormState): NodeTypeBinding;

/**
 * Form shapes for the control-panel editor ({@link ControlPanelsEditorPanel}).
 *
 * The engine shape is `ControlPanelSpec` (`@invana/canvas`, types only): a
 * position, a few presentation flags and an `items` list whose entries are a
 * discriminated union. The form flattens both — a panel's position becomes an
 * anchor-or-insets pair of fields, and every item becomes one flat row whose
 * visible fields depend on its `type`. A command's `args` get one field per key
 * its `CanvasCommand.args` descriptor names (`args.<key>`); keys it doesn't name
 * — and every key of an undescribed command — stay JSON text (`argsJson`). A
 * widget's `options` work the same way over the widget's `optionsSpec`
 * (`widgetOptions.<key>` + `widgetOptionsJson`), and a choice's static `options`
 * are rows (`choiceOptions`). `mapping.ts` is the bridge both ways.
 */

/** Each command's argument descriptor, by command name (`CanvasCommand.args`). */
type CommandArgDescriptors = Readonly<Record<string, Readonly<Record<string, CommandArgSpec>>>>;
/** Each widget's options descriptor, by widget name (`ControlWidget.optionsSpec`). */
type WidgetOptionDescriptors = Readonly<Record<string, Readonly<Record<string, CommandArgSpec>>>>;
/** One static option of a choice item, as a form row (`ControlChoiceOption`). */
interface ChoiceOptionFields {
    value: string;
    label: string;
    /** Icon name, or {@link NO_ICON}. */
    icon: string;
}
/**
 * A described argument's form value: text for text-like kinds (a `strings` list
 * is comma-separated, `json` is JSON text), a number for `number`, and a select
 * value — {@link ARG_DEFAULT} for "not set" — for `enum` / `boolean` / the
 * registry-id kinds.
 */
type ArgFieldValue = string | number | undefined;
/** How a panel is positioned: a 9-point anchor, or explicit CSS insets. */
type PanelPositionMode = 'anchor' | 'insets';
/** Flat form fields for one panel's own settings (everything but `items`). */
interface ControlPanelFields {
    /** Which surface draws the panel — `ControlPanelPlacement`. */
    placement: ControlPanelPlacement;
    positionMode: PanelPositionMode;
    /** One of the nine `ControlPanelAnchor`s (used when `positionMode` is `'anchor'`). */
    anchor: string;
    /** CSS insets (numbers as px, or any CSS length) — used when `positionMode` is `'insets'`. Empty = unset. */
    insetTop: string;
    insetRight: string;
    insetBottom: string;
    insetLeft: string;
    /** Gap from the anchored edge(s), px. */
    offsetX?: number;
    offsetY?: number;
    /** `'auto'` = the renderer's default for the anchor. */
    orientation: 'auto' | 'horizontal' | 'vertical';
    stretch: boolean;
    surface: boolean;
    visible: boolean;
}
/**
 * One item as a flat form row. Only the fields for its `type` are shown; the
 * rest stay empty and are dropped on the way back. Icon selects use
 * {@link NO_ICON} for "none" (the select chrome forbids an empty value).
 */
interface ControlItemFields {
    type: ControlItemSpec['type'];
    key: string;
    command: string;
    /** Described args, one form value per key (see {@link ArgFieldValue}). */
    args: Record<string, ArgFieldValue>;
    /** The args the command's descriptor doesn't name — or all of them when it has none — as JSON text (empty = none). */
    argsJson: string;
    label: string;
    activeLabel: string;
    text: string;
    activeText: string;
    icon: string;
    activeIcon: string;
    /** Choice display — `'dropdown'` or `'segmented'`. */
    display: string;
    /** A choice's static `options`, one row each (none = the command's own). */
    choiceOptions: ChoiceOptionFields[];
    widget: string;
    /** Described widget options, one form value per key (see {@link ArgFieldValue}). */
    widgetOptions: Record<string, ArgFieldValue>;
    /** The options the widget's descriptor doesn't name — or all of them when it has none — as JSON text (empty = none). */
    widgetOptionsJson: string;
    /** A slot's name — read-only (its content is runtime React, owned by `<ControlPanel>`). */
    slot: string;
}
/** react-hook-form state for one panel. */
interface ControlPanelFormState {
    panel: ControlPanelFields;
    items: ControlItemFields[];
}
/** A JSON field that failed to parse, reported instead of submitting. */
interface ControlPanelFormError {
    /** Item index, or `null` for a panel-level field. */
    item: number | null;
    field: string;
    message: string;
}

/** What the item-row pickers can offer — the live registries. */
interface ControlItemChoices {
    /** Registered command names. */
    commands: readonly string[];
    /** Icon registry names. */
    icons: readonly string[];
    /** Widget registry names. */
    widgets: readonly string[];
    /** Each widget's options descriptor (`ControlWidget.optionsSpec`), by name — a field per described key. */
    widgetOptions?: WidgetOptionDescriptors;
    /** Each command's argument descriptor (`CanvasCommand.args`), by name — a field per described key. */
    commandArgs?: CommandArgDescriptors;
    /** Registered layer ids, for `layer` arguments. */
    layers?: readonly string[];
    /** Registered behaviour ids, for `behaviour` arguments. */
    behaviours?: readonly string[];
    /** Registered layout ids, for `layout` arguments. */
    layouts?: readonly string[];
}

interface ControlPanelsEditorPanelProps extends ControlItemChoices {
    /** The panels to edit, keyed by id (`definition.controlPanels`). */
    panels: Readonly<Record<string, ControlPanelSpec>>;
    /**
     * Named item lists the "Insert preset" picker appends from — typically the
     * `*_CONTROL_ITEMS` presets. Omit to hide the picker.
     */
    presets?: Readonly<Record<string, readonly ControlItemSpec[]>>;
    /**
     * Called with a `controlPanels` patch: a spec replaces that panel whole,
     * `null` removes it. Fired by Apply (the edited panel), New panel and Remove.
     */
    onSubmit: (patch: Record<string, ControlPanelSpec | null>) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
    className?: string;
}
/**
 * Controlled editor for a canvas's **control panels** (`definition.controlPanels`):
 * pick a panel, edit its position / flow / chrome and its items, then Apply.
 * New panel and Remove act immediately. Pure form — no engine: the pickers are
 * fed the registered names by props, and every change comes back through
 * `onSubmit` as a `controlPanels` patch for the host to apply
 * (`canvas.update({ controlPanels: patch })`). `ControlPanelsEditor` is the
 * connected wrapper that does exactly that.
 *
 * A command's args get a field per key its descriptor (`commandArgs`) names —
 * layer / behaviour / layout ids as pickers over `layers` / `behaviours` /
 * `layouts` — and the rest as JSON. A widget's options work the same way over
 * its descriptor (`widgetOptions`), and a picker's static options are rows. A bad value is marked
 * on its field and listed, and nothing is submitted. Slot items (runtime React content) are shown but
 * not editable, and survive every round-trip; so do command / icon / widget
 * names this canvas doesn't register.
 */
declare function ControlPanelsEditorPanel({ panels, commands, icons, widgets, widgetOptions, commandArgs, layers, behaviours, layouts, presets, onSubmit, submitLabel, className, }: ControlPanelsEditorPanelProps): react.JSX.Element;

/**
 * Icon component accepted by the UI controls. These components are
 * **icon-agnostic** — the consumer passes the icon (e.g. a `lucide-react`
 * glyph), so the package takes on no icon dependency. Any component that renders
 * from `size` / `className` satisfies this (lucide icons do).
 */
type ToolbarIcon = ComponentType<{
    size?: number | string;
    className?: string;
}>;
/**
 * Side a tooltip is placed on relative to its trigger. Mirrors the Radix /
 * `@invana/ui` `TooltipContent` `side` prop. A vertical Nav typically wants
 * `'right'`; a horizontal Nav `'bottom'`.
 */
type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
/**
 * Anchor position for a {@link Panel} within its positioned ancestor. The
 * corner / edge-centre values pin a content-sized overlay; `'left'` / `'right'`
 * make a **full-height side dock** flush to that edge.
 */
type PanelPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'left' | 'right';

interface PanelProps {
    /** Corner / edge of the nearest positioned ancestor to pin to. Default `'top-left'`. */
    position?: PanelPosition;
    /** Stack direction for children. Default `'vertical'`. */
    orientation?: 'horizontal' | 'vertical';
    /** Distance from the pinned edges, in px. Default `8`. */
    offset?: number;
    /** Gap between children, in px. Default `4`. */
    gap?: number;
    /** Stacking order, so the overlay sits above canvas content. Default `5`. */
    zIndex?: number;
    className?: string;
    /** Extra inline styles. See the positioning notes on {@link Panel}. */
    style?: CSSProperties;
    children?: ReactNode;
}
/**
 * A positioned overlay container — the canvas equivalent of React Flow's
 * `<Panel>`. Pins itself to a corner / edge-centre of its **nearest positioned
 * ancestor** (e.g. the `<Canvas>` host, which is `position: relative`), and
 * stacks its children horizontally or vertically. It is a **pure positioner** —
 * it draws no surface and owns no header / close; wrap content in a
 * {@link PanelContent} for that chrome.
 *
 * Engine-agnostic and reference-free: it needs no `Canvas` instance — with
 * multiple canvases on one page you simply render one `<Panel>` inside each
 * `<Canvas>` and each pins to its own host.
 *
 * **Pointer events:** the absolutely-positioned root is `pointerEvents: 'none'`
 * so it never creates a dead zone over the canvas (a wide `top-center` panel
 * would otherwise block pan/zoom along that strip). Only the inner content
 * wrapper re-enables `pointerEvents: 'auto'`, so drags that miss the actual
 * controls still reach the canvas underneath.
 *
 * **Side docks (`position: 'left' | 'right'`):** the panel spans the full height
 * and the content wrapper fills it (a {@link PanelContent fill} child then owns
 * its own scroll). Here `style` is applied to the **positioner** (so
 * `style={{ top: 40, bottom: 25 }}` insets the dock below floating chrome); for
 * the other positions `style` lands on the content wrapper.
 */
declare function Panel({ position, orientation, offset, gap, zIndex, className, style, children, }: PanelProps): react.JSX.Element;

interface PanelContentProps {
    /**
     * Header content shown in the header bar (left), beside the close ✕. When this
     * and {@link onClose} are both omitted, no header bar is rendered.
     */
    header?: ReactNode;
    /** When provided, the header bar renders a close ✕ wired to this callback. */
    onClose?: () => void;
    /**
     * Stretch to the full height of the parent (e.g. a side-dock `<Panel>`), with
     * the body scrolling. Default `false` (height fits the content). When `true`
     * the surface is squared off (`rounded-none`) for a flush dock edge.
     */
    fill?: boolean;
    /**
     * Surface width, in px (number) or any CSS length (string). Applied as an
     * inline style so it's reliable regardless of the Tailwind utility sheet
     * (arbitrary `w-[…]` classes may be purged). Defaults to `320` when {@link fill}
     * is set (a side dock needs an explicit width — it can't size to content).
     */
    width?: number | string;
    /** Classes merged onto the surface. */
    className?: string;
    /** Inline styles on the surface. */
    style?: CSSProperties;
    /** Body content — typically a bare `<NodeDetailView>` / `<EdgeDetailView>`. */
    children?: ReactNode;
}
/**
 * The **styled surface** for panel content: a bordered, elevated card with an
 * optional header bar (title + close ✕) above a scrollable body. Drop it inside
 * a {@link Panel} (which positions it) and put bare content — e.g. a
 * `<NodeDetailView>` — in the body:
 *
 * ```tsx
 * <Panel position="right">
 *   <PanelContent header="Node" onClose={ctx.close} fill>
 *     <NodeDetailView ctx={ctx} />
 *   </PanelContent>
 * </Panel>
 * ```
 *
 * Surface + chrome live here; the view stays pure content. Engine-agnostic; uses
 * `@invana/ui` chrome (`Button`) + design-kit tokens.
 */
declare function PanelContent({ header, onClose, fill, width, className, style, children, }: PanelContentProps): react.JSX.Element;

/**
 * The three config sections a {@link CanvasSettingsBrowser} browses — mirroring
 * the id-keyed compartments of `CanvasConfig` (`layers` / `behaviours` /
 * `layouts`). A patch for an instance is applied under its section:
 * `canvas.update({ [section]: { [id]: patch } })`.
 */
type SettingsSection = 'layers' | 'behaviours' | 'layouts';
/**
 * What a {@link SettingsEditorDescriptor.render} receives for one live instance:
 * its id + section, the current options seeded off the instance, and an
 * {@link SettingsEditorContext.apply | apply} callback that pushes a serialisable
 * options patch to the running canvas.
 */
interface SettingsEditorContext {
    /** The live engine instance (a `Layer` / `Behaviour` / `Layout`). */
    instance: unknown;
    /** The instance's registry id — the key its config lives under. */
    id: string;
    /** Which `CanvasConfig` section a patch applies under. */
    section: SettingsSection;
    /**
     * Current options read off the instance (via {@link SettingsEditorDescriptor.read}
     * when given, else the instance's `getOptions()`, else `{}`). Seed the editor's
     * form from this.
     */
    options: Record<string, unknown>;
    /**
     * Push a serialisable options patch to the live canvas —
     * `canvas.update({ [section]: { [id]: patch } })` → the matching instance's
     * `setOptions`. The editor's `onSubmit` maps its form back to options and calls
     * this.
     */
    apply: (patch: Record<string, unknown>) => void;
}
/**
 * Binds a class of engine instance to the UI that edits it. The browser matches
 * each live instance against every descriptor for its section and renders the
 * first {@link SettingsEditorDescriptor.match | match}'s editor; unmatched
 * instances get a "no editor" placeholder.
 *
 * Descriptors are **injected by the consumer** — the browser lives in
 * `@invana/canvas-react` (which can't depend on the editor package
 * `@invana/canvas-ui`), so the host supplies `render` closing over whichever
 * editor + options↔form mapping it wants. Match by class reference
 * (`(i) => i instanceof BackgroundLayer`) so it survives minified builds.
 */
interface SettingsEditorDescriptor {
    /** Which section's instances this descriptor can edit. */
    section: SettingsSection;
    /** `true` if this descriptor handles the given live instance. */
    match: (instance: unknown) => boolean;
    /**
     * Human label for the instance's kind (e.g. `'Background Layer'`). Falls back
     * to the instance's constructor name.
     */
    typeLabel?: string;
    /**
     * Read the instance's current options to seed the editor. Defaults to the
     * instance's `getOptions()` when present, else `{}`.
     */
    read?: (instance: unknown) => Record<string, unknown>;
    /** Render the editor UI for one instance. */
    render: (ctx: SettingsEditorContext) => ReactNode;
}
interface CanvasSettingsBrowserProps {
    /**
     * Editor descriptors, matched against the live instances. An instance with no
     * matching descriptor renders a muted "no editor" placeholder row (so the
     * browser still lists the full bundle honestly). Default `[]`.
     */
    registry?: SettingsEditorDescriptor[];
    /**
     * Which sections to show, in order. Default
     * `['layers', 'behaviours', 'layouts']`.
     */
    sections?: SettingsSection[];
    /**
     * Id of the active layout (badged in the Layouts group). Optional — pass the
     * `activeLayout` from your `CanvasConfig` if you want the marker.
     */
    activeLayoutId?: string;
    className?: string;
}
/**
 * `CanvasSettingsBrowser` — a **file-browser-style settings panel** for a live
 * canvas. Introspects the engine's three registries (`canvas.layers` /
 * `behaviours` / `layouts`), lists every registered instance grouped by kind in
 * a nested accordion, and expands each row **in place** to its settings editor.
 * Editing applies live through `canvas.update` → the instance's `setOptions`.
 *
 * The editors themselves are **injected** via {@link CanvasSettingsBrowserProps.registry}
 * (this package can't import `@invana/canvas-ui`), so the same shell drives the
 * building studio and Storybook alike. Instances with no matching descriptor are
 * still listed, with a "no editor" placeholder — the browser reflects the whole
 * bundle, not just the editable slice.
 *
 * Must be rendered inside a `<Canvas>` (it reads the engine from context).
 */
declare function CanvasSettingsBrowser({ registry, sections, activeLayoutId, className, }: CanvasSettingsBrowserProps): react.JSX.Element;

/**
 * Fields shared by every {@link ToolbarItem} variant.
 *
 * The descriptor model is the data contract between the producers — control
 * specs resolved by `useControlItems` (the `*Toolbar`s and control panels), or
 * any hand-built array off the raw hooks — and the {@link ToolbarItems}
 * renderer that compiles them into a toolbar.
 * Everything here is engine-agnostic — icons, strings, callbacks, `ReactNode` —
 * so the type stays a dumb building block (no `@invana/canvas` import).
 */
interface ToolbarItemBase {
    /**
     * Stable React key for the rendered control. Builder hooks set semantic keys
     * (e.g. `'undo'`, `'lock'`) so reorders/conditionals stay stable; the renderer
     * falls back to `` `${type}-${index}` `` when omitted.
     */
    key?: string;
}
/** A plain action button. Rendered as a design-kit ghost `Button`. */
interface ToolbarButtonItem extends ToolbarItemBase {
    type: 'button';
    /** Icon component (icon-agnostic — e.g. a `lucide-react` glyph). */
    icon: ToolbarIcon;
    /** Optional className applied to the rendered icon (sizing / colour / state tint). */
    iconClass?: string;
    /** Tooltip content + accessible label. */
    label: string;
    /**
     * Optional visible text shown next to the icon. When set, the button renders
     * as a labelled `'sm'` button (not icon-only) — e.g. the selection-aware
     * clear's "Selection" affordance.
     */
    text?: string;
    onClick: () => void;
    /** Greys the button and blocks the click. Default `false`. */
    disabled?: boolean;
    /** Tooltip-side override; otherwise the renderer's `tooltipSide` applies. */
    tooltipSide?: TooltipSide;
}
/**
 * A two-state toggle (lock view, grid, theme, modeller tool, …). Rendered as a
 * ghost `Button` with the design-kit nav-item active treatment; the icon and
 * label flip with {@link ToolbarToggleItem.active}.
 */
interface ToolbarToggleItem extends ToolbarItemBase {
    type: 'toggle';
    /** Icon shown while inactive (and while active, unless `activeIcon` is set). */
    icon: ToolbarIcon;
    /** Icon shown while active. Defaults to `icon` — active styling alone signals state. */
    activeIcon?: ToolbarIcon;
    /** Optional className applied to the rendered icon (sizing / colour / state tint). */
    iconClass?: string;
    /** Tooltip + label in the inactive state. */
    label: string;
    /** Tooltip + label in the active state. Defaults to `label`. */
    activeLabel?: string;
    active: boolean;
    onToggle: () => void;
    /** Greys the button and blocks the toggle. Default `false`. */
    disabled?: boolean;
    tooltipSide?: TooltipSide;
}
/** A single-select dropdown (layout / select-mode / edge-type / shape / zoom). Rendered as a design-kit `RichSelect`. */
interface ToolbarSelectItem extends ToolbarItemBase {
    type: 'select';
    /** Trigger label + menu heading (e.g. `'Layout'`). */
    label: string;
    /** Currently-selected option key. */
    value: string;
    /** Option key → human label. */
    options: Record<string, string>;
    /** Optional option key → icon, surfaced on the trigger + beside each option. */
    icons?: Record<string, ToolbarIcon>;
    /** Optional className applied to the trigger icon. */
    iconClass?: string;
    onChange: (value: string) => void;
    /** Grey out the picker and ignore input. Default `false`. */
    disabled?: boolean;
    /**
     * How to render the picker. `'dropdown'` (default) is the collapsed
     * `RichSelect` trigger + menu. `'segmented'` lays every option out inline as a
     * single-select `ToggleGroup` (the B / I / U style) — good for a small, always
     * in-view option set. Segmented items show their per-option icon when present
     * (icon-only, full label on hover) and fall back to the option label text
     * otherwise; {@link triggerLabelOnly} / {@link renderTrigger} don't apply.
     */
    display?: 'dropdown' | 'segmented';
    /**
     * Extra classes for the `'segmented'` group container. Segments are
     * borderless by default (the ghost toggle variant); pass border utilities here
     * to opt back into a bordered/outlined segmented control.
     */
    className?: string;
    /** Menu alignment relative to the trigger. Default `'start'`. */
    align?: 'start' | 'center' | 'end';
    /** Trigger tooltip; defaults to {@link ToolbarSelectItem.label}. */
    tooltip?: string;
    tooltipSide?: TooltipSide;
    /**
     * Show only the section {@link label} (+ active icon) on the collapsed trigger,
     * not the selected option's label — so the trigger reads `Select` instead of
     * `Select: Click select`. Use when the per-option icon already conveys the
     * choice (e.g. the select-mode picker) and repeating the option name on the
     * trigger is noise. The open dropdown still lists full option labels. Ignored
     * when {@link renderTrigger} is provided.
     */
    triggerLabelOnly?: boolean;
    /**
     * Override the trigger content (instead of the default `{label}: {value}`).
     * Used by the zoom picker to show a live `NN%` even when the current value
     * isn't one of the preset options.
     */
    renderTrigger?: () => ReactNode;
}
/** A visual group separator. Compiles to a design-kit `Separator` on the cross axis. */
interface ToolbarDividerItem extends ToolbarItemBase {
    type: 'divider';
}
/**
 * An escape hatch for arbitrary content that doesn't fit the
 * button/toggle/select mould — e.g. a live zoom readout, a brand element, or a
 * consumer's own widget. The renderer calls {@link ToolbarCustomItem.render}
 * and drops the result inline.
 */
interface ToolbarCustomItem extends ToolbarItemBase {
    type: 'custom';
    render: () => ReactNode;
}
/**
 * A single declarative toolbar control. Build arrays of these with the builder
 * hooks (or by hand) and render them with {@link ToolbarItems}; concatenate
 * arrays with `divider` items between groups to assemble a full toolbar.
 */
type ToolbarItem = ToolbarButtonItem | ToolbarToggleItem | ToolbarSelectItem | ToolbarDividerItem | ToolbarCustomItem;
/**
 * Swap the `icon` of `button` / `toggle` items whose {@link ToolbarItemBase.key}
 * matches a key in `icons`. Partial — unlisted items keep their baked icon. This
 * is how the turnkey `*Toolbar` components honour their optional `icons` prop
 * without the item producers ever taking icons: build items (with baked defaults),
 * then `applyIconOverrides(items, props.icons)` before rendering.
 *
 * Note: only the primary `icon` is overridden (not a toggle's `activeIcon`, nor a
 * `select`'s per-option `icons`).
 */
declare function applyIconOverrides(items: ToolbarItem[], icons?: Partial<Record<string, ToolbarIcon>>): ToolbarItem[];

interface ToolbarItemsProps {
    /** The declarative item list to compile into controls. */
    items: ToolbarItem[];
    /** Layout direction of the underlying design-kit Nav shell. Default `'horizontal'`. */
    orientation?: 'horizontal' | 'vertical';
    /**
     * Default tooltip side for button/toggle/select items that don't set their
     * own. Defaults to `'bottom'` (horizontal) / `'right'` (vertical), matching
     * the design-kit Nav tooltip conventions.
     */
    tooltipSide?: TooltipSide;
    /** Forwarded to the Nav shell container. */
    className?: string;
}
/**
 * Data-driven toolbar renderer — the single building block every `*Toolbar`
 * preset is assembled from. Compiles a {@link ToolbarItem}[] into design-kit
 * chrome (`@invana/ui` `Button` / `RichSelect` / `Separator`, with a shared
 * {@link Tooltipped}) inside a `NavHorizontal` / `NavVertical` shell:
 *
 * - `button` → a ghost `Button` (icon-only, or icon + `text`), with `disabled`.
 * - `toggle` → a ghost `Button` with the nav-item `active` treatment; icon/label flip.
 * - `select` → a `RichSelect` dropdown, or a segmented `ToggleGroup` when
 *   `display: 'segmented'` (optionally with a custom `renderTrigger`).
 * - `divider` → a cross-axis `Separator`.
 * - `custom` → the item's own `render()` output.
 *
 * It's a dumb component (no engine import): feed it control specs resolved by
 * `useControlItems` (or draw those directly with `<ControlItems>`), or a
 * hand-built item array off the raw hooks.
 */
declare function ToolbarItems({ items, orientation, tooltipSide, className, }: ToolbarItemsProps): react.JSX.Element;

interface TooltippedProps {
    /**
     * Tooltip content (typically the host control's `title` / `label`). When
     * `null` / `undefined` / `''` the child renders **unwrapped** — no tooltip,
     * no extra DOM — so callers can pass an optional label without branching.
     */
    label?: ReactNode;
    /** Side the tooltip is placed on relative to the trigger. Default `'top'`. */
    side?: TooltipSide;
    /** Hover-open delay in ms. Default `0` (instant — matches a toolbar feel). */
    delayDuration?: number;
    /** The single trigger element (a `Button`, a dropdown trigger, …). */
    children: ReactElement;
}
/**
 * Wraps a single interactive element with an `@invana/ui` (Radix) tooltip
 * driven by `label`. The building-block that lets the dumb control components
 * surface their `title` / `label` as a real hover tooltip — readable when the
 * controls are dropped into a compact `NavHorizontal` / `NavVertical` slot,
 * where the native `title` attribute is easy to miss.
 *
 * Self-contained: bundles its own `TooltipProvider` (like `@invana/ui`'s
 * `ButtonWithTooltip`), so a control works standalone without the host wiring a
 * provider. `asChild` forwards the trigger props onto the child, preserving its
 * variant / size / active styling.
 */
declare function Tooltipped({ label, side, delayDuration, children }: TooltippedProps): react.JSX.Element;

/** Image export formats the panel can offer. */
type ExportImageFormatKey = 'png' | 'jpeg' | 'webp' | 'svg';
/** Capture-area choices. */
type ExportImageAreaKey = 'viewport' | 'content';
/** A single labelled choice in one of the panel's segmented rows. */
interface ExportImagePanelOption<T> {
    /** The value handed back through {@link ExportImagePanelProps.onChange}. */
    value: T;
    /** Human label shown on the segment. */
    label: string;
}
/**
 * The full set of export settings the panel edits. A plain, serialisable value
 * object — the toolbar (or any consumer) maps it onto the engine's
 * `ExportImageOptions` when it actually exports. Kept engine-free so the panel
 * stays a dumb building block.
 */
interface ExportImagePanelValue {
    /** Output format. `'svg'` is a true vector export; the rest are raster. */
    format: ExportImageFormatKey;
    /** `'viewport'` (WYSIWYG) or `'content'` (the whole graph, off-screen included). */
    area: ExportImageAreaKey;
    /**
     * Background fill. Matches the engine's `ExportBackground`: `'canvas'`,
     * `'transparent'`, or a CSS colour string (e.g. `'#0b1220'`).
     */
    background: string;
    /** Resolution multiplier for raster formats (ignored for `'svg'`). */
    scale: number;
    /** Forced output aspect ratio (width ÷ height). `0` = free / natural. */
    aspectRatio: number;
}
/** Default format choices, in display order. */
declare const EXPORT_IMAGE_FORMAT_OPTIONS: ExportImagePanelOption<ExportImageFormatKey>[];
/** Default capture-area choices. */
declare const EXPORT_IMAGE_AREA_OPTIONS: ExportImagePanelOption<ExportImageAreaKey>[];
/** Default background choices (values are valid engine `ExportBackground`s). */
declare const EXPORT_IMAGE_BACKGROUND_OPTIONS: ExportImagePanelOption<string>[];
/** Default raster resolution multipliers. */
declare const EXPORT_IMAGE_SCALE_OPTIONS: number[];
/** Default aspect-ratio choices (`0` = free / natural). */
declare const EXPORT_IMAGE_RATIO_OPTIONS: ExportImagePanelOption<number>[];
interface ExportImagePanelProps {
    /** The current settings shown in the panel (controlled). */
    value: ExportImagePanelValue;
    /** Fired with a partial patch whenever a setting changes. Merge into `value`. */
    onChange: (patch: Partial<ExportImagePanelValue>) => void;
    /** Fired when the primary "save" button is pressed. */
    onSave: () => void;
    /** Heading above the rows. Pass `null` to hide it. Default `'Export'`. */
    title?: string | null;
    /** Label on the primary button. Default `'Save as Image'`. */
    saveLabel?: string;
    /** Optional icon (icon-agnostic — a `ToolbarIcon`) rendered inside the button. */
    saveIcon?: ToolbarIcon;
    /** Override the offered formats (subset / reorder). Default all four. */
    formats?: ExportImagePanelOption<ExportImageFormatKey>[];
    /** Override the offered capture areas. */
    areas?: ExportImagePanelOption<ExportImageAreaKey>[];
    /** Override the offered backgrounds. */
    backgrounds?: ExportImagePanelOption<string>[];
    /** Override the offered raster scales. */
    scales?: number[];
    /** Override the offered aspect ratios. */
    ratios?: ExportImagePanelOption<number>[];
    className?: string;
}
/**
 * Reusable, engine-agnostic **image-export options panel**. Presents the format
 * as a horizontal segmented row, followed by area / background / scale / aspect
 * ratio, and a primary "Save as Image" button. Fully controlled: it edits a
 * plain {@link ExportImagePanelValue} and reports every change through `onChange` /
 * the save press through `onSave` — it never touches the engine itself.
 *
 * Surface-less by design (no border / shadow): drop it inside a
 * `HoverCardContent`, `PopoverContent`, `PanelContent`, or any container that
 * provides the chrome. The self-wiring {@link ExportImageToolbar} pairs it with a
 * hover-card trigger and {@link useCanvasImageExport}; use this component directly
 * when you need the options elsewhere (a settings sheet, a share dialog, …).
 *
 * The **Scale** row is disabled for `'svg'` (vector output ignores raster scale).
 */
declare function ExportImagePanel({ value, onChange, onSave, title, saveLabel, saveIcon: SaveIcon, formats, areas, backgrounds, scales, ratios, className, }: ExportImagePanelProps): react.JSX.Element;

interface ExportStatePanelProps {
    /** Fired when the "export" button is pressed — serialise + download the state JSON. */
    onExport: () => void;
    /** Fired with the file the user picked in the "import" file dialog. */
    onImport: (file: File) => void;
    /**
     * Controlled state of the "restore view" toggle (camera / selection / hover).
     * When the toggle is present ({@link onRestoreViewChange} provided), this drives
     * it. `true` = the live view is restored on import; `false` = only definition +
     * data load (maps to the engine's `skipInteraction`).
     */
    restoreView?: boolean;
    /** Fired when the "restore view" toggle flips. Omit to hide the toggle entirely. */
    onRestoreViewChange?: (restore: boolean) => void;
    /** Heading above the actions. Pass `null` to hide it. Default `'Canvas State'`. */
    title?: string | null;
    /** Label on the export button. Default `'Download JSON'`. */
    exportLabel?: string;
    /** Label on the import button. Default `'Load JSON…'`. */
    importLabel?: string;
    /** Optional icon (icon-agnostic) rendered inside the export button. */
    exportIcon?: ToolbarIcon;
    /** Optional icon (icon-agnostic) rendered inside the import button. */
    importIcon?: ToolbarIcon;
    className?: string;
}
/**
 * Reusable, engine-agnostic **canvas-state save/load panel** — the JSON
 * counterpart to {@link ExportStatePanel}'s image sibling. Presents a primary
 * "Download JSON" action, a "Load JSON…" action that opens a native file
 * picker, and an optional "Restore view" toggle. Fully controlled and dumb: it
 * reports the export press through `onExport`, the picked file through
 * `onImport`, and the toggle through `onRestoreViewChange` — it never touches
 * the engine itself.
 *
 * Surface-less by design (no border / shadow): drop it inside a
 * `HoverCardContent`, `PopoverContent`, `PanelContent`, or any container that
 * provides the chrome. The self-wiring {@link ExportStateToolbar} pairs it with a
 * hover-card trigger and `useCanvasStateJson`; use this component directly when
 * you need the actions elsewhere (a settings sheet, a share dialog, …).
 */
declare function ExportStatePanel({ onExport, onImport, restoreView, onRestoreViewChange, title, exportLabel, importLabel, exportIcon: ExportIcon, importIcon: ImportIcon, className, }: ExportStatePanelProps): react.JSX.Element;

/** The values a {@link PropertiesEditor} edits: a label + a flat string→string data map. */
interface PropertiesEditorValues {
    /** The element's label text. */
    label: string;
    /** The element's free-form type tag (maps to `node.type` / `edge.type`). Only edited when `showType`. */
    type?: string;
    /** Arbitrary key/value metadata (maps to `node.data` / `edge.data`). */
    data: Record<string, string>;
}
interface PropertiesEditorProps {
    /** Heading shown above the form, e.g. `'Node'` / `'Edge'`. */
    title?: string;
    /**
     * Initial values, loaded into local state **once** on mount (same as
     * `NodeStyleEditorPanel`). To reload for a different element, remount via `key`.
     */
    defaults?: Partial<PropertiesEditorValues>;
    /** Called with the edited values when the user clicks Apply. */
    onSubmit: (values: PropertiesEditorValues) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
    /** Show the label field. Default `true`. */
    showLabel?: boolean;
    /** Show an editable `type` field above the properties list. Default `false`. */
    showType?: boolean;
    /**
     * When provided, render a "Reverse direction" button in the footer that
     * invokes this callback immediately (i.e. not on Apply). Used for edges to
     * swap source/target. Omit for elements that have no direction.
     */
    onReverse?: () => void;
    /** Class on the card — merged over the base card classes via `cn`. */
    className?: string;
}
/**
 * Dumb, engine-agnostic editor for an element's **label + key/value
 * properties** — the canvas counterpart of `@invana/canvas-ui`'s
 * `NodeStyleEditorPanel`, but for arbitrary `data` rather than visual style (which
 * `@invana/forms`' fixed field types can't express as a dynamic list).
 *
 * Props in / `onSubmit` out: it owns the row state, lets the user add / remove /
 * rename fields, and on Apply emits `{ label, data }`. It holds **no** engine /
 * layer / commit logic — the consumer (see {@link InspectorPanel}) wires
 * `onSubmit` to the store. Blank-keyed rows are dropped on submit; on duplicate
 * keys the last row wins.
 *
 * The text fields are styled native `<input>`s: the `@invana/ui` build this
 * package resolves doesn't export a plain `Input`, and the dynamic key/value
 * list isn't expressible via the `@invana/forms` schema generator. `Button`
 * still comes from `@invana/ui` (no raw `<button>`).
 */
declare function PropertiesEditor({ title, defaults, onSubmit, submitLabel, showLabel, showType, onReverse, className, }: PropertiesEditorProps): react.JSX.Element;

/** One fixed identity row in a {@link DetailCard} header, e.g. `Type`, `Label`, `Source`. */
interface DetailRow {
    /** Caption shown on the left. */
    label: string;
    /** Value shown on the right. */
    value: string;
    /** Render the value in a monospace face (ids, etc.). Default `false`. */
    mono?: boolean;
}
interface DetailCardProps {
    /** Heading, e.g. `'Node'` / `'Edge'`. */
    title?: string;
    /**
     * CSS color for the title text — typically the element's styling colour (a
     * node's fill / an edge's stroke), so the heading reads as "this element".
     */
    titleColor?: string;
    /** Muted sub-heading under the title — typically the element id. */
    subtitle?: string;
    /** Small chip beside the title — typically the element `type`. */
    badge?: string;
    /** Fixed identity rows shown under the header (e.g. Type, Label, Source, Target). */
    rows?: DetailRow[];
    /** When provided, renders a close (✕) button in the header. */
    onClose?: () => void;
    /**
     * Class on the card — the positioning / sizing / appearance surface. Merged
     * over the base card classes via `cn` (e.g. `dockCardClassName` turns it into
     * a full-height dock).
     */
    className?: string;
    /** Inline style on the card — the runtime-valued companion to {@link className}. */
    style?: CSSProperties;
    /** Body of the card — typically a `<PropertyDetailView>` (and, for edges, `<EdgeEndpoints>`). */
    children?: ReactNode;
}
/**
 * Dumb, engine-agnostic **content layout** for an element detail panel: title ·
 * type badge, id subtitle, fixed identity rows, then a body slot. It is **bare**
 * — no surface of its own (border / bg / shadow); wrap it in a
 * {@link PanelContent} (or any container) that provides the surface. The chrome
 * counterpart of the body component (`PropertyDetailView`). Chrome (`Badge`,
 * optional `Button`) comes from `@invana/ui`; everything else is design-kit tokens.
 */
declare function DetailCard({ title, titleColor, subtitle, badge, rows, onClose, className, style, children, }: DetailCardProps): react.JSX.Element;

/**
 * The built-in property kinds. The registry is open — a custom
 * {@link PropertyRenderer} may use any `kind` string; these are just the ones
 * {@link defaultPropertyRenderers} ships. `kind` doubles as the **hint** string
 * that force-selects a renderer (see {@link resolvePropertyRenderer}).
 */
type PropertyKind = 'number' | 'image' | 'url' | 'longtext' | 'tags' | 'list' | 'json' | 'text';
/**
 * Everything a {@link PropertyRenderer} needs to draw one property value.
 * `renderValue` recurses back through the registry — `list` items and `json`
 * values use it so nested links / numbers / objects render correctly.
 */
interface PropertyRenderContext {
    /** Property key. Enables name-based matching (e.g. `name === 'avatar'` → image). */
    name: string;
    /** Raw value — never pre-stringified, so arrays/objects/numbers keep their type. */
    value: unknown;
    /** Explicit kind hint for this key, if the consumer supplied one. */
    hint?: string;
    /** Recursion depth. `0` at the top level; `list`/`json` increment it. */
    depth: number;
    /** Render a nested value back through the registry (depth is auto-incremented). */
    renderValue: (value: unknown, opts?: {
        name?: string;
        hint?: string;
    }) => ReactNode;
}
/**
 * A self-contained ability to render one data type. Detection (`match`) and
 * rendering (`render`) live together, so **adding a new data type is a single
 * object** passed via the `renderers` prop of {@link PropertyDetailView} /
 * `NodeDetailView` / `EdgeDetailView` — no core edit.
 */
interface PropertyRenderer {
    /** Unique kind id. Also the hint string that force-selects this renderer. */
    kind: string;
    /**
     * Claim this value? The first matching renderer wins, with consumer-supplied
     * renderers tried **before** the defaults (so a built-in kind can be
     * overridden). The built-in `text` renderer matches everything and is last.
     */
    match: (value: unknown, ctx: {
        name: string;
        hint?: string;
    }) => boolean;
    /**
     * `'inline'` — a label-left / value-right row (scalars). `'block'` — a muted
     * label caption above a full-width value (images, json, …). Default `'inline'`.
     */
    layout?: 'inline' | 'block';
    /** Draw the value. Return a component instance when you need hooks (expand state, `onError`). */
    render: (ctx: PropertyRenderContext) => ReactNode;
}
/**
 * Is `s` a link we're willing to make clickable? Scheme allow-list only —
 * `http(s)` / `file` / `mailto` / protocol-relative `//`. Everything else
 * (notably `javascript:`) is rejected so it falls through to plain text.
 */
declare function isSafeHref(s: string): boolean;
/**
 * Is `s` something we can drop into an `<img src>`? A `data:image/…` URI, or a
 * safe URL ending in a known image extension. A bare `"photo.png"` (no scheme)
 * is **not** treated as an image — it would 404 — and renders as text instead.
 */
declare function isImageUrl(s: string): boolean;
/**
 * The built-in renderers, in resolution order. Consumer-supplied renderers are
 * tried before these (so any kind can be overridden). The final `text` renderer
 * matches everything, so resolution never fails.
 */
declare const defaultPropertyRenderers: readonly PropertyRenderer[];
/**
 * Pick the renderer for a value: consumer `custom` renderers first, then the
 * {@link defaultPropertyRenderers}. A `hint` matching some renderer's `kind`
 * force-selects it (beating heuristics); otherwise the first `match` wins.
 * Always resolves — falls back to the `text` renderer.
 */
declare function resolvePropertyRenderer(value: unknown, ctx: {
    name: string;
    hint?: string;
}, custom?: readonly PropertyRenderer[]): PropertyRenderer;
/**
 * Resolve and render one value through the registry, wiring up the recursive
 * `renderValue` closure (used internally by {@link PropertyDetailView} and by
 * `list` / `json` renderers). Returns the rendered node only — layout wrapping
 * is the caller's (it reads {@link resolvePropertyRenderer}'s `layout`).
 */
declare function renderPropertyValue(value: unknown, opts: {
    name: string;
    hint?: string;
    depth?: number;
    renderers?: readonly PropertyRenderer[];
}): ReactNode;

interface PropertyDetailViewProps {
    /**
     * The element's properties — the raw `data` map (values keep their original
     * type: number, string, array, object, …). Each entry is rendered by kind
     * through the renderer registry.
     */
    data?: Record<string, unknown>;
    /**
     * Extra renderers, tried **before** the built-ins, so a consumer can add a new
     * data type — or override one — with a single {@link PropertyRenderer} object.
     */
    renderers?: PropertyRenderer[];
    /**
     * Per-key kind hint. `hints[key] === renderer.kind` force-selects that
     * renderer for the key, beating the heuristics (e.g. force a numeric-looking
     * id to `'text'`, or an extension-less URL to `'image'`).
     */
    hints?: Record<string, string>;
    /** Section caption. Default `'Properties'`. Pass `''` to hide it. */
    title?: string;
    /** Shown when there are no entries. Default `'No properties.'`. */
    emptyText?: string;
    /** Class on the section wrapper. */
    className?: string;
}
/**
 * Dumb, engine-agnostic **properties block**: renders an element's `data` as a
 * list of rows where **each value is rendered by its kind** (number, image,
 * link, long text, tags, list, json, …) via the {@link PropertyRenderer}
 * registry. Scalar kinds render as inline label/value rows; block kinds (image,
 * json, …) stack a muted caption above a full-width value.
 *
 * Extensible by construction — pass `renderers` to add or override a data type;
 * see {@link resolvePropertyRenderer}. Holds no engine logic; the engine-aware
 * `NodeDetailView` / `EdgeDetailView` feed it `ctx.data`.
 */
declare function PropertyDetailView({ data, renderers, hints, title, emptyText, className, }: PropertyDetailViewProps): react.JSX.Element;

/** One resolved edge endpoint — the source or target node's display fields. */
interface EdgeEndpoint {
    /** Node id. Always present (falls back to the raw id when the node is missing). */
    id: string;
    /** The node's free-form `type` tag, when set. */
    type?: string;
    /** The node's drawn label text, when set. */
    label?: string;
    /** CSS color from the node's styling (its fill) — tints the endpoint title. */
    color?: string;
}
interface EdgeEndpointsProps {
    /** The edge's source node. */
    source: EdgeEndpoint;
    /** The edge's target node. */
    target: EdgeEndpoint;
    /** Directed edge → show a direction arrow between endpoints. Default `true`. */
    directed?: boolean;
}
/**
 * Dumb, engine-agnostic **connection block** for an edge: its source and target
 * nodes (each id · type · label) with a direction indicator between them. The
 * engine-aware `EdgeDetailView` resolves the endpoint nodes (`store.getNode` +
 * `layer.resolveNodeStyle`) and hands this component plain strings, so it stays
 * presentational.
 */
declare function EdgeEndpoints({ source, target, directed }: EdgeEndpointsProps): react.JSX.Element;

interface CanvasMessageBarProps {
    /** Optional leading glyph (consumer-supplied, e.g. a `lucide-react` `Info`). */
    icon?: ToolbarIcon;
    /** Explicit canvas instance; defaults to the context canvas (works from footer chrome). */
    canvas?: Canvas | null;
    className?: string;
    style?: CSSProperties;
}
/**
 * The shared message line — drop it into a footer / status strip. Reads the
 * canvas message channel ({@link useCanvasMessage}) and renders the current
 * message, or nothing when idle. Anything emits via `Canvas.showMessage` (a
 * layout's start/end, a behaviour, app code); this just displays the latest.
 * Self-wiring: resolves the engine from the (lifted) `CanvasContext` or an
 * explicit `canvas` prop.
 */
declare function CanvasMessageBar({ icon: Icon, canvas, className, style }: CanvasMessageBarProps): react.JSX.Element | null;

/** What the browser can render with — the banner's only input. */
interface RendererCapabilities {
    /** WebGPU is usable ({@link canUseWebGPU}). */
    webgpu: boolean;
    /** A WebGL context can be created ({@link hasWebGL}). */
    webgl: boolean;
    /** The WebGPU API is present even though it is not usable (a gated browser). */
    webgpuApi: boolean;
}
interface RendererCapabilityBannerProps {
    /** Override the probe — for stories and tests. Defaults to this browser's. */
    capabilities?: RendererCapabilities;
    className?: string;
}
/**
 * Says when the canvas cannot use its best renderer. Pinned top-centre of the
 * nearest positioned ancestor (the canvas host), click-through except for the
 * alert itself.
 *
 * - **WebGPU usable** → renders nothing.
 * - **WebGL only** → a dismissible note: the canvas falls back to WebGL and
 *   renders normally.
 * - **Neither** → a non-dismissible destructive alert: the canvas cannot draw.
 */
declare function RendererCapabilityBanner({ capabilities, className, }: RendererCapabilityBannerProps): react.JSX.Element | null;

interface GraphStatusBarProps {
    /** Graph layer id read for counts + hover. Default `'graph'`. */
    layerId?: string;
    /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
    clickSelectId?: string;
    /** Explicit canvas instance; defaults to the context canvas (works from footer chrome). */
    canvas?: Canvas | null;
    className?: string;
    style?: CSSProperties;
}
/**
 * A live, read-only **status bar** — drop it into a footer / status strip to
 * surface engine telemetry: rendered node/edge totals, camera zoom + pan, the
 * pointer's world position, the hovered node/edge, and the current selection
 * counts. Self-wiring: it reads the engine from the (lifted) `CanvasContext` or
 * an explicit `canvas` prop, so it works **outside** `<Canvas>` (e.g. in an
 * app-shell footer). Sections appear only when they have data (pointer / hover /
 * selection hide when empty).
 */
declare function GraphStatusBar({ layerId, clickSelectId, canvas, className, style, }: GraphStatusBarProps): react.JSX.Element;

interface ContextMenuOverlayProps {
    /** Left offset in px, relative to the positioned ancestor (the `<Canvas>` host). */
    x: number;
    /** Top offset in px, relative to the positioned ancestor. */
    y: number;
    /** Menu tree to render (per-target; leaves carry their own `onClick`). */
    items: MenuItem[];
    /** Stacking order; default `1000` so the menu floats over canvas chrome. */
    zIndex?: number;
    /** Extra inline style merged onto the positioned wrapper. */
    style?: CSSProperties;
}
/**
 * Dumb overlay for a right-click context menu: an absolutely-positioned
 * {@link MenuItemList} anchored at `(x, y)` within its positioned
 * ancestor. Engine-agnostic, props-in only — the open/close state and the
 * action wiring live in the consumer (`useContextMenu` + the menu items).
 *
 * Render it as a `<Canvas>` descendant: the host `<div>` is `position: relative`,
 * so `(x, y)` taken from `ContextMenuEvent.screen` lands the menu at the cursor.
 *
 * It **stops `pointerdown` propagation** so a click *inside* the menu doesn't
 * reach the window-level dismiss listener `useContextMenu` attaches, and
 * **prevents the native context menu** on a right-click over itself. Leaf items
 * close the menu via their own `onClick`.
 */
declare function ContextMenuOverlay({ x, y, items, zIndex, style }: ContextMenuOverlayProps): react.JSX.Element;

interface MenuItemListProps {
    /** Menu tree to render (leaves carry their own `onClick`). */
    items: readonly MenuItem[];
    /** Extra classes on the `<nav>`. */
    className?: string;
}
/**
 * A menu tree of `@invana/ui` `MenuItem`s — `NestedMenu`'s markup, except each
 * top-level item's own `className` is **kept**. `NestedMenu` replaces it with its
 * padding, which drops the dimmed class `commandMenuItems` puts on a disabled
 * command, so a disabled item there looks clickable. Nested items already keep
 * theirs.
 */
declare function MenuItemList({ items, className }: MenuItemListProps): react.JSX.Element;

interface HoverElementPreviewCardProps {
    /** The resolved, render-ready card (from `preview:show` / {@link useHoverElementPreviewBehaviour}). */
    card: ResolvedPreviewCard;
    /** Extra classes merged onto the card surface. */
    className?: string;
    /** Extra inline style merged onto the card surface. */
    style?: CSSProperties;
}
/**
 * Dumb, data-driven preview card — the **default content** for
 * `HoverElementPreviewBehaviour`. Identity-card layout: image (left) / title +
 * subtitle (right) → property rows (`id` / `type` first, auto) below a divider.
 * The image column collapses when absent; the subtitle clamps to
 * `card.subtitleMaxLines`.
 *
 * **Purely presentational** — it does no positioning and no hover/hold wiring.
 * The turnkey {@link HoverElementPreviewBehaviour} owns the anchoring (measure → flip → clamp)
 * and the interactive hold-open behaviour, rendering this card inside its
 * positioned shell. So the card is "simply UI": props-in, engine-agnostic (only
 * the resolved-card *type* is imported).
 */
declare function HoverElementPreviewCard({ card, className, style }: HoverElementPreviewCardProps): react.JSX.Element;

/** Props every control-panel widget receives. */
interface ControlWidgetProps {
    /** The canvas the panel sits on. */
    canvas: Canvas;
    /** The spec's `options` bag (JSON). */
    options?: Record<string, unknown>;
}
/**
 * A control-panel **widget**: live UI that a `{ type: 'widget', widget: name }`
 * item names. Register app widgets via `<ControlPanels widgets={…}>`.
 *
 * A widget may describe its `options` bag with a static {@link ControlWidgetOptionsSpec}
 * — the same `CommandArgSpec` vocabulary a command's `args` use — so the Studio's
 * control-panel editor shows a field per described key instead of raw JSON.
 * Keys it doesn't describe (and every key of an undescribed widget) stay JSON.
 */
type ControlWidget = ComponentType<ControlWidgetProps> & {
    /** Describes the widget's `options`, one entry per key. */
    optionsSpec?: ControlWidgetOptionsSpec;
};
/** A widget's option descriptor: `CommandArgSpec` per `options` key. */
type ControlWidgetOptionsSpec = Readonly<Record<string, CommandArgSpec>>;
/**
 * Each widget's {@link ControlWidget.optionsSpec}, by name — what the control-panel
 * editor needs to turn widget options into fields. Undescribed widgets are left out.
 */
declare function controlWidgetOptionsSpecs(widgets: Readonly<Record<string, ControlWidget>>): Readonly<Record<string, ControlWidgetOptionsSpec>>;
/** The default **widget registry** for control panels. */
declare const DEFAULT_CONTROL_WIDGETS: Readonly<Record<string, ControlWidget>>;

/** The canvas-ui presets, by display name — the default "Insert preset" list. */
declare const DEFAULT_CONTROL_PRESETS: Readonly<Record<string, readonly ControlItemSpec[]>>;
interface ControlPanelsEditorProps {
    /** Extra icons the host's `<ControlPanels icons>` registers, so the pickers offer them. */
    icons?: Record<string, ToolbarIcon>;
    /** Extra widgets the host's `<ControlPanels widgets>` registers. */
    widgets?: Record<string, ControlWidget>;
    /** "Insert preset" choices. Default {@link DEFAULT_CONTROL_PRESETS}; `{}` hides the picker. */
    presets?: Readonly<Record<string, readonly ControlItemSpec[]>>;
    /** Explicit canvas; defaults to the context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * The **connected** control-panel editor: reads `definition.controlPanels` and
 * the live command registry from the canvas, and applies every edit with
 * `canvas.update({ controlPanels }, 'edit:control-panels')` — so `canvas.history`
 * (and the `history.undo` command) can undo it, and it exports like any other
 * definition change, and `<ControlPanels>` redraws at once. Drop it in
 * anywhere under a canvas root (or pass `canvas`).
 *
 * A panel declared by a mounted `<ControlPanel>` is re-declared when that
 * component's `items` change; edit such panels in code, or remove the
 * component.
 */
declare function ControlPanelsEditor({ icons, widgets, presets, canvas, className }: ControlPanelsEditorProps): react.JSX.Element;

/** Map a panel spec to form state (see {@link itemToForm} for the descriptors). */
declare function panelToForm(spec: ControlPanelSpec, descriptors?: CommandArgDescriptors, widgetDescriptors?: WidgetOptionDescriptors): ControlPanelFormState;
/**
 * Map form state back to a panel spec, collecting JSON errors instead of
 * throwing. The caller submits only when `errors` stays empty.
 */
declare function formToPanel(state: ControlPanelFormState, descriptors?: CommandArgDescriptors, widgetDescriptors?: WidgetOptionDescriptors): {
    spec: ControlPanelSpec;
    errors: ControlPanelFormError[];
};

/**
 * State shapes for {@link SchemaEditorPanel} — a small, engine-agnostic editor for a
 * node **schema** (a titled list of typed fields, the ER / table-card shape).
 * The editor edits a {@link NodeSchema} and hands the patch back via `onSubmit`;
 * how it's applied (mutating a graph node's `data`, a redraw, etc.) is the
 * consumer's concern.
 */
/**
 * One field of a schema: a display name + a data-type token. Extra keys are
 * allowed and preserved verbatim, so consumers who add their own row controls
 * (via {@link SchemaEditorPanelProps.fieldRowFields} — e.g. `nullable`, `description`)
 * get those values back on the emitted schema.
 */
interface SchemaFieldDef {
    name: string;
    /** Data-type token — one of {@link SCHEMA_TYPES} (`string` / `integer` / …). */
    type: string;
    /** Extra per-field attributes from custom row controls, preserved as-is. */
    [key: string]: unknown;
}
/** A node's schema: a title, an optional header colour, and the field list. */
interface NodeSchema {
    label: string;
    /** Header band colour (engine `0xRRGGBB`). */
    headerColor?: number;
    fields: SchemaFieldDef[];
}
/** Scalar controls: the table title + header colour. */
interface SchemaMetaFields {
    label: string;
    headerColor?: string;
}
/** The editor's full react-hook-form state. */
interface SchemaEditorFormState {
    meta: SchemaMetaFields;
    fields: SchemaFieldDef[];
}

interface SchemaEditorPanelProps {
    /** Initial schema, loaded once on mount. Remount (via `key`) to reload. */
    defaults?: NodeSchema;
    /**
     * Called with the edited schema on Apply. The consumer applies it however it
     * likes — e.g. write it back to a graph node's `data` and redraw.
     */
    onSubmit: (schema: NodeSchema) => void;
    /**
     * Optional **live** callback — fired on every change with the mapped schema,
     * for instant-preview hosts. Memoise it to avoid re-subscribing each render.
     */
    onChange?: (schema: NodeSchema) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
    /**
     * Override the **meta** controls (title + header colour). Defaults to the
     * exported {@link SCHEMA_META_FIELDS} — pass your own `FieldConfig[]` to
     * relabel / reorder / restyle, or add controls. Extra values you introduce
     * won't round-trip unless they map onto `NodeSchema` (`label` / `headerColor`).
     */
    metaFields?: FieldConfig[];
    /**
     * Override the **per-field row** controls (name + type). Defaults to the
     * exported {@link SCHEMA_FIELD_ROW}. Add controls (e.g. `nullable`,
     * `description`, a restricted `type` select) and they round-trip verbatim —
     * unknown keys on each field are preserved through {@link NodeSchema}.
     */
    fieldRowFields?: FieldConfig[];
}
/**
 * Self-contained, engine-agnostic editor for one {@link NodeSchema} — a titled
 * list of typed fields (the ER / table-card shape). Edit the title + header
 * colour, add / remove / reorder fields, and set each field's data type; on
 * Apply it emits a pure-JSON `NodeSchema`. No `Canvas`, no engine, no commit —
 * the consumer wires `onSubmit` to its own apply path.
 *
 * The form schema is data-driven: {@link SchemaEditorPanelProps.metaFields} /
 * {@link SchemaEditorPanelProps.fieldRowFields} default to the exported
 * `SCHEMA_META_FIELDS` / `SCHEMA_FIELD_ROW` and can be overridden for full
 * control over which controls each section renders.
 */
declare function SchemaEditorPanel({ defaults, onSubmit, onChange, submitLabel, metaFields, fieldRowFields, }: SchemaEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schemas for {@link SchemaEditorPanel}. `meta` (title + header
 * colour) plus the per-field row (name + type select), used by a
 * `useFieldArray`. Field `name`s match {@link SchemaEditorFormState} 1:1.
 */
/** The built-in data-type vocabulary (matches the type-chip palette). */
declare const SCHEMA_TYPES: readonly ["string", "integer", "number", "boolean", "date"];
/** `select` options for a field's data type. */
declare const SCHEMA_TYPE_OPTIONS: {
    value: "string" | "number" | "boolean" | "date" | "integer";
    label: "string" | "number" | "boolean" | "date" | "integer";
}[];
/** Table title + header colour. */
declare const SCHEMA_META_FIELDS: FieldConfig[];
/** One field row: name + data-type select. */
declare const SCHEMA_FIELD_ROW: FieldConfig[];

/** Seed the form from a {@link NodeSchema} (use as `defaults`). */
declare function schemaToForm(schema?: NodeSchema): SchemaEditorFormState;
/** Read the form back into a {@link NodeSchema} (drops nameless rows). */
declare function formToSchema(values: SchemaEditorFormState): NodeSchema;

interface NodeStylingEditorPanelProps {
    /**
     * Initial styling template, loaded once on mount. Remount (via `key`) to
     * reload. Seed it from a `GraphLayerOptions.nodeStylingTemplates` entry.
     */
    defaults?: NodeStylingTemplate;
    /**
     * Called with the produced template on Apply. The consumer stores it back
     * into `nodeStylingTemplates[name]` and pushes it via
     * `canvas.update({ layers: { graph: { nodeStylingTemplates } } })`.
     */
    onSubmit: (styling: NodeStylingTemplate) => void;
    /**
     * Optional **live** callback — fired on every form change with the mapped
     * template, for instant-preview hosts. Independent of {@link onSubmit} (which
     * still fires on Apply). Memoise it to avoid re-subscribing each render.
     */
    onChange?: (styling: NodeStylingTemplate) => void;
    /**
     * Which structure kind this styling targets — picks the relevant control
     * subset so every field affects the canvas. `'card'` shows bg / accent +
     * per-slot styling; `'simple'` shows fill / stroke / label (no slots). Omit to
     * show the full set (standalone use).
     */
    variant?: 'simple' | 'card';
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic editor for **one** `NodeStylingTemplate` —
 * the per-type styling layer (which {@link ColorRole} each slot/label uses +
 * typography). Produces pure JSON; no `Canvas`, no engine, no commit. Mirrors
 * `NodeStyleEditorPanel` / `HoverPreviewCardEditorPanel`: a react-hook-form, the scalar
 * controls via `ObjectField`, the per-slot stylings via a `useFieldArray`.
 */
declare function NodeStylingEditorPanel({ defaults, onSubmit, onChange, variant, submitLabel, }: NodeStylingEditorPanelProps): react.JSX.Element;

/** Controls for a **simple** shape (the compiler's `compileSimple` inputs). */
declare const SIMPLE_STYLING_FIELDS: FieldConfig[];
/** Controls for a **card** structure (the compiler's `compileCard` inputs). */
declare const CARD_STYLING_FIELDS: FieldConfig[];
/** All scalar controls — the default when no `variant` is given (standalone). */
declare const STYLING_SCALAR_FIELDS: FieldConfig[];
/** Per-slot styling controls (rendered under each `slots.<i>` ObjectField). */
declare const SLOT_STYLING_FIELDS: FieldConfig[];

/**
 * react-hook-form state for {@link NodeStylingEditorPanel}. Roles are carried as
 * plain strings (`''` = none) so the `select` chrome round-trips cleanly;
 * `mapping.ts` narrows them back to `ColorRole | undefined`.
 */
/** Scalar (non-array) styling controls, rendered under the `styling` ObjectField. */
interface NodeStylingScalarFields {
    name: string;
    fillRole: string;
    strokeRole: string;
    strokeWidth: number;
    /** Fill opacity, 0–1. Compiles onto the fill layer, not the shape's `bgAlpha`. */
    fillAlpha: number;
    /** Border opacity, 0–1. Independent of {@link fillAlpha}. */
    strokeAlpha: number;
    bgRole: string;
    accentRole: string;
    labelColorRole: string;
    labelFontSize: number;
    labelPlacement: string;
}
/** One per-slot styling row (a `useFieldArray` entry). */
interface SlotStylingRow {
    slot: string;
    colorRole: string;
    fontSize: number;
    fontWeight: number;
    uppercase: boolean;
}
/** The editor's full form state. */
interface NodeStylingFormState {
    styling: NodeStylingScalarFields;
    slots: SlotStylingRow[];
}

/** Seed the form from a `NodeStylingTemplate` (use as `defaults`). */
declare function stylingToForm(styling?: NodeStylingTemplate): NodeStylingFormState;
/**
 * Read the form back into a pruned `NodeStylingTemplate` (drops empty roles).
 *
 * `base` is the template the form was seeded from, and passing it matters:
 * this function **rebuilds** the template from the fields the form models, so
 * anything it doesn't model would otherwise be dropped on every save. The form
 * is a role-and-typography editor, so what it doesn't model is the literal
 * colour pairs (`fill` / `stroke` / `bg` / `accent`), the rest of `label`'s
 * typography, and — since these are structural rather than cosmetic —
 * {@link NodeStylingTemplate.group} and {@link NodeStylingTemplate.badges}.
 *
 * Losing `group` is the sharp edge: a styling template carries whether nodes of
 * its type render as a **container**, so a silent drop would un-frame every
 * group in the graph on an unrelated colour edit. `badges` is the same hazard
 * one step smaller — a data-bound badge list is a picture the form cannot show
 * and must not delete. Carrying `base` through is what stops an editor from
 * deleting what it can't show.
 *
 * Per-slot extras (`color`, `fontFamily`, `fontStyle`) are still dropped — the
 * slot rows are rebuilt by name and reconciling them is a separate job.
 */
declare function formToStyling(values: NodeStylingFormState, base?: NodeStylingTemplate): NodeStylingTemplate;

/**
 * Shared field-schema helpers for the node template editors — the colour-role
 * select and the `SlotBindingField` (slot name → dotted data path). Kept at
 * package level because both `NodeStructureEditorPanel` and `NodeStylingEditorPanel`
 * compose them.
 */
/** The theme colour-role vocabulary, in palette order. */
declare const COLOR_ROLES: readonly ColorRole[];
/**
 * Sentinel for the "no role" option. The form chrome (Radix `Select`) forbids an
 * empty-string item value, so the `(none)` choice carries this token instead;
 * {@link asRole} maps it back to `undefined`.
 */
declare const NO_ROLE = "__none__";
/** `select` options for a colour role, with an explicit `(none)` entry. */
declare const COLOR_ROLE_OPTIONS: {
    value: string;
    label: string;
}[];
/** A `select` field bound to the colour-role vocabulary. */
declare function roleField(name: string, label: string): FieldConfig;
/** Narrow a form select value back to a `ColorRole` (the `(none)` sentinel → `undefined`). */
declare function asRole(value: string | undefined): ColorRole | undefined;
/**
 * **SlotBindingField** — the shared primitive for one `slot → data field`
 * mapping row: a slot name and a dotted data path. Rendered under a
 * `rows.<i>` / `bindings.<i>` `ObjectField`, one row per slot.
 */
declare const SLOT_BINDING_FIELDS: FieldConfig[];

/**
 * Types for the WheelZoomBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where `WheelZoomBehaviour` and
 * its options live) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (see package CLAUDE.md). So the editable option shape is mirrored here
 * as {@link WheelZoomOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. The mirror is structural, not derived, so it can't `Pick`
 * from the engine — keep it in sync with `WheelZoomBehaviourOptions` by hand.
 */
/**
 * The subset of `WheelZoomBehaviourOptions` this editor produces — a
 * serialisable patch. Function/`shortcuts` options are out of scope; only the
 * user-tunable scalars round-trip. `smooth` keeps the engine's `false | number`
 * encoding (`false` = instant snap, a number = ease-out frame count).
 */
interface WheelZoomOptions {
    requireCtrl?: boolean;
    percent?: number;
    smooth?: false | number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `smooth: false | number` union is split into a `smooth` boolean toggle plus a
 * `smoothFrames` number (see `mapping.ts`), because a single field can't be both.
 */
interface WheelZoomFields {
    requireCtrl?: boolean;
    percent?: number;
    /** Whether smooth-scroll easing is on. Maps to `smooth !== false`. */
    smooth?: boolean;
    /** Ease-out frame count, used only when {@link smooth} is `true`. */
    smoothFrames?: number;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface WheelZoomFormState {
    options: WheelZoomFields;
}

interface WheelZoomEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: WheelZoomFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values (the default form varies the `smoothFrames` input with the
     * `smooth` toggle). Defaults to {@link wheelZoomFields}.
     */
    fields?: FieldConfig[] | ((values: WheelZoomFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: WheelZoomFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `WheelZoomBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `WheelZoomBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function WheelZoomEditorPanel({ defaults, fields, onSubmit, submitLabel, }: WheelZoomEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the WheelZoomBehaviour editor. Field `name`s
 * match the keys of {@link WheelZoomFields} 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 *
 * A function of the live values (like `nodeStyleFields`): the `smoothFrames`
 * input only appears while `smooth` is on — the form-generator's way of handling
 * the engine's `smooth: false | number` union.
 */
declare function wheelZoomFields(values?: WheelZoomFields): FieldConfig[];

/**
 * Map a `WheelZoomBehaviourOptions`-shaped patch to the flat
 * {@link WheelZoomFields} the `@invana/forms` generator renders. The engine's
 * `smooth: false | number` is split: `smooth` becomes a boolean toggle and the
 * frame count (when present) becomes `smoothFrames`.
 */
declare function optionsToForm$J(o?: WheelZoomOptions): WheelZoomFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link WheelZoomOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`. `smooth` is re-fused from the
 * toggle + frame count (`false` when off, the frame count — default 8 — when on).
 */
declare function formToOptions$J(f: WheelZoomFields): WheelZoomOptions;

/**
 * Types for the BackgroundLayer editor.
 *
 * Engine-agnostic: `@invana/canvas` (home of `BackgroundLayer` and its options)
 * is **not** imported — canvas-ui may only use `@invana/graph` types (package
 * CLAUDE.md). The editable option shape is mirrored here as
 * {@link BackgroundLayerOptions}, a serialisable patch the consumer applies via
 * `setOptions`. Keep the enums / fields in sync with the engine by hand.
 */
/** `'solid'` paints a flat fill; `'pattern'` overlays a tiled texture. */
type BackgroundType = 'solid' | 'pattern';
/** Tile texture kind when `type === 'pattern'`. */
type BackgroundPatternType = 'dots' | 'grid' | 'lines';
/** How `{ light, dark }` colour variants resolve. */
type BackgroundMode = 'auto' | 'light' | 'dark';
/**
 * Where one colour comes from — the form-only half of the engine's `'inherit'`
 * sentinel. `'theme'` emits the literal string `'inherit'` (the layer then reads
 * its configured palette role); `'custom'` emits the swatch's colour, which the
 * theme will never override.
 *
 * Form-only: the engine has no `*Source` option, and `optionsToForm` /
 * `formToOptions` are what bridge the two representations.
 */
type BackgroundColorSource = 'theme' | 'custom';
/**
 * The subset of `BackgroundLayerOptions` this editor produces. Colours are
 * emitted as scalar strings (hex / CSS) — the engine's `BackgroundColor` also
 * accepts a `{ light, dark }` pair, which is out of scope for the scalar form
 * (such values round-trip untouched; see `mapping.ts`).
 */
interface BackgroundLayerOptions {
    type?: BackgroundType;
    patternType?: BackgroundPatternType;
    /** Pattern foreground colour, or `'inherit'` to follow the theme's pattern role. */
    color?: string;
    /** Solid backdrop colour, or `'inherit'` to follow the theme's surface role. */
    backgroundColor?: string;
    size?: number;
    spacing?: number;
    alpha?: number;
    followCamera?: boolean;
    /** Camera scale below which the pattern is hidden. `0` disables the cutoff. */
    hidePatternBelowZoom?: number;
    mode?: BackgroundMode;
    surfaceRole?: string;
    patternRole?: string;
}
/**
 * Flat form-field shape: {@link BackgroundLayerOptions} plus the two
 * form-only `*Source` selects that stand in for the `'inherit'` sentinel, which
 * a colour swatch cannot represent. `mapping.ts` folds them back.
 */
interface BackgroundLayerFields extends BackgroundLayerOptions {
    /** Whether {@link BackgroundLayerOptions.backgroundColor} is themed or pinned. */
    backgroundColorSource?: BackgroundColorSource;
    /** Whether {@link BackgroundLayerOptions.color} is themed or pinned. */
    colorSource?: BackgroundColorSource;
}
/** react-hook-form state — leaves register under `options.<field>`. */
interface BackgroundLayerFormState {
    options: BackgroundLayerFields;
}

interface BackgroundLayerEditorPanelProps {
    /**
     * Initial field values, loaded once on mount. Seed from a layer's options
     * with the exported `optionsToForm`. Remount (via `key`) to reload.
     */
    defaults?: BackgroundLayerFields;
    /**
     * The form schema — a static `FieldConfig[]` or a function of the current
     * values (the default hides the Pattern section for a solid fill). Defaults to
     * {@link backgroundLayerFields}.
     */
    fields?: FieldConfig[] | ((values: BackgroundLayerFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back with `formToOptions` and
     * apply via `layer.setOptions` (or wherever). The component does none of that.
     */
    onSubmit: (values: BackgroundLayerFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `BackgroundLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the grouped
 * schema (each `group` an accordion section) with `@invana/forms`, and hands
 * the current values to `onSubmit`. Holds no engine reference and does no
 * commit — `optionsToForm` / `formToOptions` are the consumer's plug-in.
 */
declare function BackgroundLayerEditorPanel({ defaults, fields, onSubmit, submitLabel, }: BackgroundLayerEditorPanelProps): react.JSX.Element;

/**
 * The full BackgroundLayer field set as one grouped `FieldConfig[]` — the
 * default `fields` for `<BackgroundLayerEditorPanel>`. The Pattern section is elided
 * for a solid fill.
 */
declare function backgroundLayerFields(values?: BackgroundLayerFields): FieldConfig[];

/**
 * Map a `BackgroundLayerOptions`-shaped patch to the flat
 * {@link BackgroundLayerFields}. Colours are normalised to strings; everything
 * else passes through.
 */
declare function optionsToForm$I(o?: BackgroundLayerOptions): BackgroundLayerFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link BackgroundLayerOptions} patch. Only fields the form set are included
 * (no `undefined` / empty-string keys), so the result is safe to spread over
 * the layer's current options on `setOptions`. Colour strings pass straight
 * through — `BackgroundColor` accepts hex/CSS strings verbatim — and each
 * `*Source` select collapses back into its colour as `'inherit'` or a pin.
 */
declare function formToOptions$I(f: BackgroundLayerFields): BackgroundLayerOptions;

/**
 * Types for the GeometricLayout editor.
 *
 * Engine-agnostic: `@invana/graph-layout-geometric` (home of `GeometricLayout`
 * and its options) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link GeometricLayoutOptions}, a serialisable patch the consumer applies (a
 * layout re-run / `setOptions`). Keep the enum / fields in sync by hand.
 */
/**
 * Layout mode.
 * - `'grid'` — regular grid, row-major.
 * - `'snake'` — grid with alternating row direction (serpentine).
 * - `'circular'` — evenly spaced around one circle.
 */
type GeometricLayoutMode = 'grid' | 'snake' | 'circular';
/**
 * The subset of `GeometricLayoutOptions` this editor produces — a serialisable
 * patch. `id` / `targetLayerId` (registry wiring) and function options are out
 * of scope; the tunable scalars round-trip. `transition` / `transitionEase`
 * come from the shared one-shot layout base.
 */
interface GeometricLayoutOptions {
    mode?: GeometricLayoutMode;
    columns?: number;
    columnGap?: number;
    rowGap?: number;
    radius?: number;
    nodeSpacing?: number;
    startAngle?: number;
    clockwise?: boolean;
    center?: {
        x?: number;
        y?: number;
    };
    includeGroups?: boolean;
    transition?: boolean;
    transitionEase?: string;
}
/**
 * Flat form-field shape. The `center: { x, y }` object is split into `centerX`
 * / `centerY` number fields (see `mapping.ts`); everything else matches
 * {@link GeometricLayoutOptions} 1:1.
 */
interface GeometricLayoutFields {
    mode?: GeometricLayoutMode;
    columns?: number;
    columnGap?: number;
    rowGap?: number;
    radius?: number;
    nodeSpacing?: number;
    startAngle?: number;
    clockwise?: boolean;
    centerX?: number;
    centerY?: number;
    includeGroups?: boolean;
    transition?: boolean;
    transitionEase?: string;
}
/** react-hook-form state — leaves register under `options.<field>`. */
interface GeometricLayoutFormState {
    options: GeometricLayoutFields;
}

interface GeometricLayoutEditorPanelProps {
    /**
     * Initial field values, loaded once on mount. Seed from a layout's options
     * with the exported `optionsToForm`. Remount (via `key`) to reload.
     */
    defaults?: GeometricLayoutFields;
    /**
     * The form schema — a static `FieldConfig[]` or a function of the current
     * values (the default swaps the per-mode numerics with `mode`). Defaults to
     * {@link geometricLayoutFields}.
     */
    fields?: FieldConfig[] | ((values: GeometricLayoutFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back with `formToOptions` and
     * apply it (re-run the layout / `setOptions`). The component does none of that.
     */
    onSubmit: (values: GeometricLayoutFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `GeometricLayout`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the grouped
 * schema (each `group` an accordion section) with `@invana/forms`, and hands
 * the current values to `onSubmit`. Holds no engine reference and does no
 * commit — `optionsToForm` / `formToOptions` are the consumer's plug-in.
 */
declare function GeometricLayoutEditorPanel({ defaults, fields, onSubmit, submitLabel, }: GeometricLayoutEditorPanelProps): react.JSX.Element;

/**
 * Per-mode geometry fields for the current mode. Dynamic: grid/snake show the
 * column + gap numerics, circular shows radius/spacing/angle.
 */
declare function modeFields(mode: GeometricLayoutFields['mode']): FieldConfig[];
/**
 * The full GeometricLayout field set as one grouped `FieldConfig[]` — the
 * default `fields` for `<GeometricLayoutEditorPanel>`. Layout numerics vary with the
 * current `mode`.
 */
declare function geometricLayoutFields(values?: GeometricLayoutFields): FieldConfig[];

/**
 * Map a `GeometricLayoutOptions`-shaped patch to the flat
 * {@link GeometricLayoutFields}. The `center: { x, y }` object is split into
 * `centerX` / `centerY`; everything else passes through.
 */
declare function optionsToForm$H(o?: GeometricLayoutOptions): GeometricLayoutFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link GeometricLayoutOptions} patch. Only fields the form set are included
 * (no `undefined` keys), so the result is safe to spread over the layout's
 * current options. `centerX` / `centerY` are re-fused into a `center` object
 * only if at least one was set.
 */
declare function formToOptions$H(f: GeometricLayoutFields): GeometricLayoutOptions;

/**
 * Types for the DragPanBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where `DragPanBehaviour` and its
 * options live) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (see package CLAUDE.md). So the editable option shape is mirrored here
 * as {@link DragPanOptions}, a plain serialisable patch the consumer applies via
 * `setOptions`. The mirror is structural, not derived, so it can't `Pick` from
 * the engine — keep it in sync with `DragPanBehaviourOptions` by hand.
 */
/**
 * The subset of `DragPanBehaviourOptions` this editor produces — a serialisable
 * patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts` fields are
 * out of scope; only the user-tunable scalars round-trip.
 */
interface DragPanOptions {
    /** Which modifier key must be held during drag. */
    modifier?: 'none' | 'space' | 'shift' | 'alt';
    /** Allowed mouse buttons. */
    mouseButtons?: 'all' | 'left' | 'right' | 'middle';
    /** Add momentum deceleration after pointer lift. */
    decelerate?: boolean;
    /** Cursor applied to the canvas while the pan pointer is held. */
    dragCursor?: string;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. `DragPanOptions`
 * has no nesting or unions, so this mirrors it 1:1.
 */
interface DragPanFields {
    modifier?: 'none' | 'space' | 'shift' | 'alt';
    mouseButtons?: 'all' | 'left' | 'right' | 'middle';
    decelerate?: boolean;
    dragCursor?: string;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface DragPanFormState {
    options: DragPanFields;
}

interface DragPanEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: DragPanFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link dragPanFields}.
     */
    fields?: FieldConfig[] | ((values: DragPanFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: DragPanFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `DragPanBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `DragPanBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function DragPanEditorPanel({ defaults, fields, onSubmit, submitLabel, }: DragPanEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the DragPanBehaviour editor. Field `name`s
 * match the keys of `DragPanFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`.
 */
declare const dragPanFields: FieldConfig[];

/**
 * Map a `DragPanBehaviourOptions`-shaped patch to the flat {@link DragPanFields}
 * the `@invana/forms` generator renders. A 1:1 copy — no unions or nesting.
 */
declare function optionsToForm$G(o?: DragPanOptions): DragPanFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DragPanOptions} patch. Only fields the form actually set are included
 * (no `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
declare function formToOptions$G(f: DragPanFields): DragPanOptions;

/**
 * Types for the PinchZoomBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where `PinchZoomBehaviour` and
 * its options live) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (see package CLAUDE.md). So the editable option shape is mirrored here
 * as {@link PinchZoomOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. The mirror is structural, not derived, so it can't `Pick`
 * from the engine — keep it in sync with `PinchZoomBehaviourOptions` by hand.
 */
/**
 * The subset of `PinchZoomBehaviourOptions` this editor produces — a
 * serialisable patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts`
 * fields are out of scope; only the user-tunable scalars round-trip.
 */
interface PinchZoomOptions {
    /** If `true`, suppress the implicit pan that accompanies a pinch gesture. */
    noDrag?: boolean;
    /** Zoom speed multiplier. */
    percent?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. `PinchZoomOptions`
 * has no nesting or unions, so this mirrors it 1:1.
 */
interface PinchZoomFields {
    noDrag?: boolean;
    percent?: number;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface PinchZoomFormState {
    options: PinchZoomFields;
}

interface PinchZoomEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: PinchZoomFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link pinchZoomFields}.
     */
    fields?: FieldConfig[] | ((values: PinchZoomFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: PinchZoomFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `PinchZoomBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `PinchZoomBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function PinchZoomEditorPanel({ defaults, fields, onSubmit, submitLabel, }: PinchZoomEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the PinchZoomBehaviour editor. Field `name`s
 * match the keys of `PinchZoomFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`.
 */
declare const pinchZoomFields: FieldConfig[];

/**
 * Map a `PinchZoomBehaviourOptions`-shaped patch to the flat
 * {@link PinchZoomFields} the `@invana/forms` generator renders. A 1:1 copy —
 * no unions or nesting.
 */
declare function optionsToForm$F(o?: PinchZoomOptions): PinchZoomFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link PinchZoomOptions} patch. Only fields the form actually set are included
 * (no `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
declare function formToOptions$F(f: PinchZoomFields): PinchZoomOptions;

/**
 * Types for the KeyboardCameraInputBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where
 * `KeyboardCameraInputBehaviour` and its options live) is **not** imported —
 * canvas-ui may only use `@invana/graph` types (see package CLAUDE.md). So the
 * editable option shape is mirrored here as {@link KeyboardCameraOptions}, a
 * plain serialisable patch the consumer applies via `setOptions`. The mirror is
 * structural, not derived, so it can't `Pick` from the engine — keep it in sync
 * with `KeyboardCameraInputBehaviourOptions` by hand.
 */
/**
 * The subset of `KeyboardCameraInputBehaviourOptions` this editor produces — a
 * serialisable patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts`
 * fields are out of scope, and the structural `keymap` object is omitted (too
 * nested for a form); only the tunable scalars round-trip.
 */
interface KeyboardCameraOptions {
    /** Pan distance per key press in screen pixels. */
    panStep?: number;
    /** Zoom multiplier per key press. `1.1` = 10% in/out per press. */
    zoomFactor?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders.
 * `KeyboardCameraOptions` has no nesting or unions, so this mirrors it 1:1.
 */
interface KeyboardCameraFields {
    panStep?: number;
    zoomFactor?: number;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface KeyboardCameraFormState {
    options: KeyboardCameraFields;
}

interface KeyboardCameraEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: KeyboardCameraFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link keyboardCameraFields}.
     */
    fields?: FieldConfig[] | ((values: KeyboardCameraFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: KeyboardCameraFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `KeyboardCameraInputBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `KeyboardCameraInputBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function KeyboardCameraEditorPanel({ defaults, fields, onSubmit, submitLabel, }: KeyboardCameraEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the KeyboardCameraInputBehaviour editor.
 * Field `name`s match the keys of `KeyboardCameraFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`. The `keymap` object is not
 * surfaced here (too structural for a flat form).
 */
declare const keyboardCameraFields: FieldConfig[];

/**
 * Map a `KeyboardCameraInputBehaviourOptions`-shaped patch to the flat
 * {@link KeyboardCameraFields} the `@invana/forms` generator renders. A 1:1 copy
 * — `keymap` is intentionally dropped (not editable here).
 */
declare function optionsToForm$E(o?: KeyboardCameraOptions): KeyboardCameraFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link KeyboardCameraOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`.
 */
declare function formToOptions$E(f: KeyboardCameraFields): KeyboardCameraOptions;

/**
 * Types for the KeyboardShortcutsBehaviour editor.
 *
 * `KeyboardShortcutsBehaviourOptions` lives in `@invana/canvas`, which canvas-ui
 * imports for types only; the editable shape is mirrored here as
 * {@link KeyboardShortcutsOptions} — keep it in sync by hand.
 */
/** One binding — mirrors `KeyboardShortcutBinding`. */
interface KeyboardShortcutBindingOption {
    keys: string;
    command: string;
    args?: unknown;
}
/** The subset of `KeyboardShortcutsBehaviourOptions` this editor produces. */
interface KeyboardShortcutsOptions {
    bindings?: KeyboardShortcutBindingOption[];
    scope?: 'canvas' | 'document';
}
/**
 * Flat form fields. The bindings are one text field, a binding per line —
 * `keys → command` with optional JSON args after the command (see `mapping.ts`).
 */
interface KeyboardShortcutsFields {
    scope?: 'canvas' | 'document';
    bindingsText?: string;
}
/** react-hook-form state: leaves register under `options.<field>`. */
interface KeyboardShortcutsFormState {
    options: KeyboardShortcutsFields;
}

interface KeyboardShortcutsEditorPanelProps {
    /** Initial field values, loaded once on mount — seed with `optionsToForm`. Remount (via `key`) to reload. */
    defaults?: KeyboardShortcutsFields;
    /** The form schema, static or a function of the values. Default {@link keyboardShortcutsFields}. */
    fields?: FieldConfig[] | ((values: KeyboardShortcutsFields) => FieldConfig[]);
    /** Called with the values on submit; map back with `formToOptions`. */
    onSubmit: (values: KeyboardShortcutsFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `KeyboardShortcutsBehaviour`:
 * the scope and the bindings, one per line (`keys → command {args}`). A line that
 * doesn't parse is reported and nothing is submitted. Holds no engine reference
 * — `optionsToForm` / `formToOptions` are the consumer's bridge.
 */
declare function KeyboardShortcutsEditorPanel({ defaults, fields, onSubmit, submitLabel, }: KeyboardShortcutsEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the KeyboardShortcutsBehaviour editor. Field
 * `name`s match `KeyboardShortcutsFields` 1:1.
 */
declare const keyboardShortcutsFields: FieldConfig[];

/** One binding as a line: `keys → command`, plus its args as JSON when it has any. */
declare function bindingToLine(b: KeyboardShortcutBindingOption): string;
/**
 * Parse one line back to a binding, or `null` for a blank / `#` comment line or
 * one that doesn't parse (no arrow, no command, args that aren't JSON).
 */
declare function lineToBinding(line: string): KeyboardShortcutBindingOption | null;
/** Options → flat fields: the bindings become one line each. */
declare function optionsToForm$D(o?: KeyboardShortcutsOptions): KeyboardShortcutsFields;
/**
 * Flat fields → an options patch. Lines that don't parse are dropped — check
 * them with {@link lineToBinding} to report them first (the editor panel does).
 */
declare function formToOptions$D(f: KeyboardShortcutsFields): KeyboardShortcutsOptions;

/**
 * Types for the DragShapeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where `DragShapeBehaviour` and
 * its options live) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (see package CLAUDE.md). So the editable option shape is mirrored here
 * as {@link DragShapeOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. The mirror is structural, not derived, so it can't `Pick`
 * from the engine — keep it in sync with `DragShapeBehaviourOptions` by hand.
 */
/**
 * The subset of `DragShapeBehaviourOptions` this editor produces — a
 * serialisable patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts`
 * fields are out of scope, and the non-serialisable `renderer` handle + `filter`
 * predicate are omitted; only the tunable scalars round-trip.
 */
interface DragShapeOptions {
    /** Re-route every connector after each move (obstacle-aware routers). */
    reRouteConnectors?: boolean;
    /** Cursor applied while a shape is being dragged. */
    dragCursor?: string;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders.
 * `DragShapeOptions` has no nesting or unions, so this mirrors it 1:1.
 */
interface DragShapeFields {
    reRouteConnectors?: boolean;
    dragCursor?: string;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface DragShapeFormState {
    options: DragShapeFields;
}

interface DragShapeEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: DragShapeFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link dragShapeFields}.
     */
    fields?: FieldConfig[] | ((values: DragShapeFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: DragShapeFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `DragShapeBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `DragShapeBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function DragShapeEditorPanel({ defaults, fields, onSubmit, submitLabel, }: DragShapeEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the DragShapeBehaviour editor. Field `name`s
 * match the keys of `DragShapeFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`. The `renderer` handle and `filter` predicate
 * are not surfaced here (non-serialisable).
 */
declare const dragShapeFields: FieldConfig[];

/**
 * Map a `DragShapeBehaviourOptions`-shaped patch to the flat
 * {@link DragShapeFields} the `@invana/forms` generator renders. A 1:1 copy —
 * the `renderer` / `filter` options are not editable here.
 */
declare function optionsToForm$C(o?: DragShapeOptions): DragShapeFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DragShapeOptions} patch. Only fields the form actually set are included
 * (no `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
declare function formToOptions$C(f: DragShapeFields): DragShapeOptions;

/**
 * Types for the DevInfoLayer editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where `DevInfoLayer` and its
 * options live) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (see package CLAUDE.md). So the editable option shape is mirrored here
 * as {@link DevInfoLayerOptions}, a plain serialisable patch the consumer
 * applies via `setOptions`. The mirror is structural, not derived, so it can't
 * `Pick` from the engine — keep it in sync with `DevInfoLayerOptions` by hand.
 */
/** Which corner the overlay anchors to. Mirrors the engine's `DevInfoCorner`. */
type DevInfoCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/**
 * The subset of `DevInfoLayerOptions` this editor produces — a serialisable
 * patch. The base `id` / `enabled` (and `zIndex`, init-only) fields are out of
 * scope; only the display knobs round-trip. `margin` keeps the engine's
 * `number | { x?, y? }` encoding (per-axis inset), re-fused in `mapping.ts`.
 */
interface DevInfoLayerOptions {
    /** Which corner to anchor the overlay. */
    corner?: DevInfoCorner;
    /** Inset from the chosen corner in screen pixels — uniform or per-axis. */
    margin?: number | {
        x?: number;
        y?: number;
    };
    /** Font size in px. */
    fontSize?: number;
    /** Panel opacity 0–1. */
    opacity?: number;
    /** Overlay background CSS colour (may be `rgba(...)`, hence a free string). */
    backgroundColor?: string;
    /** Text colour (`#rrggbb`). */
    textColor?: string;
    /** Accent / header colour (`#rrggbb`). */
    accentColor?: string;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `margin: number | { x?, y? }` union is flattened into two scalar fields —
 * `marginX` / `marginY` (see `mapping.ts`), since a single field can't be both.
 */
interface DevInfoLayerFields {
    corner?: DevInfoCorner;
    /** Horizontal inset in px. Maps into `margin`. */
    marginX?: number;
    /** Vertical inset in px. Maps into `margin`. */
    marginY?: number;
    fontSize?: number;
    opacity?: number;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface DevInfoLayerFormState {
    options: DevInfoLayerFields;
}

interface DevInfoLayerEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * layer's options with the exported `optionsToForm`. Remount (via `key`) to
     * reload.
     */
    defaults?: DevInfoLayerFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link devInfoLayerFields}.
     */
    fields?: FieldConfig[] | ((values: DevInfoLayerFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`layer.setOptions`, an undo
     * stack, …). The component does none of that.
     */
    onSubmit: (values: DevInfoLayerFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `DevInfoLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `DevInfoLayerOptions ⇄ form-fields`
 * mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function DevInfoLayerEditorPanel({ defaults, fields, onSubmit, submitLabel, }: DevInfoLayerEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the DevInfoLayer editor. Field `name`s match
 * the keys of `DevInfoLayerFields` 1:1 so the generator's `options.<name>` paths
 * line up with `mapping.ts`. The engine's `margin` union is surfaced as the
 * `marginX` / `marginY` pair.
 */
declare const devInfoLayerFields: FieldConfig[];

/**
 * Map a `DevInfoLayerOptions`-shaped patch to the flat {@link DevInfoLayerFields}
 * the `@invana/forms` generator renders. The engine's `margin: number | { x, y }`
 * union is split into `marginX` / `marginY`. Colours are CSS strings on the
 * engine (`textColor` / `accentColor` are `#rrggbb`, `backgroundColor` may be
 * `rgba(...)`), so they pass through unchanged — no number conversion.
 */
declare function optionsToForm$B(o?: DevInfoLayerOptions): DevInfoLayerFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DevInfoLayerOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys). `margin` is re-fused from `marginX` / `marginY`
 * — a plain number when both are equal, otherwise a `{ x, y }` object; omitted
 * entirely when neither is set.
 */
declare function formToOptions$B(f: DevInfoLayerFields): DevInfoLayerOptions;

/**
 * Types for the ClickSelectBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ClickSelectBehaviour` and
 * its options live) is **not** imported for values — canvas-ui may only use
 * `@invana/graph` types (see package CLAUDE.md), and here even the option shape
 * is mirrored structurally rather than derived, so it can't `Pick` from the
 * engine. Keep {@link ClickSelectOptions} in sync with
 * `ClickSelectBehaviourOptions` by hand.
 */
/** Modifier-key names accepted by the behaviour's `trigger` gate. */
type ClickSelectModifierKey = 'shift' | 'control' | 'alt' | 'meta';
/** Neighbour-traversal direction. Mirror of the engine's `SelectDirection`. */
type ClickSelectDirection = 'in' | 'out' | 'both';
/**
 * Which group frames a click can never select (mirrors the engine enum).
 * `'expanded'` is the engine default: an open frame is scenery, a collapsed
 * one selects like an ordinary node.
 */
type ClickSelectGroupExclusion = 'expanded' | 'always' | 'never';
/**
 * The subset of `ClickSelectBehaviourOptions` this editor produces — a
 * serialisable patch. Callback options (`onSelect` / `onDeselect` /
 * `onSelectionChange`), the `enable` predicate, and base fields
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`) are out of scope; only the
 * user-tunable scalars/enums round-trip. `trigger` keeps the engine's
 * `SelectModifierKey[]` encoding.
 */
interface ClickSelectOptions {
    excludeNodeTypes?: string[];
    excludeGroups?: ClickSelectGroupExclusion;
    excludeEdgeTypes?: string[];
    multiple?: boolean;
    trigger?: ClickSelectModifierKey[];
    degree?: number;
    direction?: ClickSelectDirection;
    state?: string;
    unselectedState?: string;
    raiseActive?: boolean;
    clearOnBackground?: boolean;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `trigger: SelectModifierKey[]` array is collapsed to a single `trigger`
 * select (`'none'` = no modifier gate); a UI can't express arbitrary modifier
 * combos and they're rarely used (see `mapping.ts`).
 */
interface ClickSelectFields {
    /** Comma-separated `GraphNode.type` list — encoded, see `mapping.ts`. */
    excludeNodeTypes?: string;
    /** Structural group veto — a plain enum, no encoding. */
    excludeGroups?: ClickSelectGroupExclusion;
    /** Comma-separated `GraphEdge.type` list — encoded, see `mapping.ts`. */
    excludeEdgeTypes?: string;
    multiple?: boolean;
    /** Single modifier gate. `'none'` maps to the engine's empty `trigger` array. */
    trigger?: 'none' | ClickSelectModifierKey;
    degree?: number;
    direction?: ClickSelectDirection;
    state?: string;
    unselectedState?: string;
    raiseActive?: boolean;
    clearOnBackground?: boolean;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface ClickSelectFormState {
    options: ClickSelectFields;
}

interface ClickSelectEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: ClickSelectFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link clickSelectFields}.
     */
    fields?: FieldConfig[] | ((values: ClickSelectFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: ClickSelectFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `ClickSelectBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `ClickSelectBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function ClickSelectEditorPanel({ defaults, fields, onSubmit, submitLabel, }: ClickSelectEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the ClickSelectBehaviour editor. Field
 * `name`s match the keys of `ClickSelectFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 */
declare const clickSelectFields: FieldConfig[];

/**
 * Map a `ClickSelectBehaviourOptions`-shaped patch to the flat
 * {@link ClickSelectFields} the `@invana/forms` generator renders. The engine's
 * `trigger: SelectModifierKey[]` array collapses to a single select — the first
 * modifier, or `'none'` for an empty gate. The two exclusion lists encode
 * `string[]` as comma-separated text, the form generator having no list field.
 */
declare function optionsToForm$A(o?: ClickSelectOptions): ClickSelectFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ClickSelectOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`. `trigger` re-expands to an array (`'none'` →
 * `[]`).
 */
declare function formToOptions$A(f: ClickSelectFields): ClickSelectOptions;

/**
 * Types for the ClickInspectBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ClickInspectBehaviour`
 * lives) is **not** imported. {@link ClickInspectOptions} mirrors the editable
 * subset of `ClickInspectBehaviourOptions` structurally — keep it in sync by
 * hand.
 */
/**
 * The subset of `ClickInspectBehaviourOptions` this editor produces — a
 * serialisable patch. Base fields (`id` / `targetLayerId` / `enabled` /
 * `shortcuts`) are out of scope; only the user-tunable `clearOnBackground`
 * round-trips.
 */
interface ClickInspectOptions {
    clearOnBackground?: boolean;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. 1:1 with
 * {@link ClickInspectOptions} — no unions to split.
 */
interface ClickInspectFields {
    clearOnBackground?: boolean;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface ClickInspectFormState {
    options: ClickInspectFields;
}

interface ClickInspectEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: ClickInspectFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link clickInspectFields}.
     */
    fields?: FieldConfig[] | ((values: ClickInspectFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: ClickInspectFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `ClickInspectBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `ClickInspectBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function ClickInspectEditorPanel({ defaults, fields, onSubmit, submitLabel, }: ClickInspectEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the ClickInspectBehaviour editor. Field
 * `name`s match the keys of `ClickInspectFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 */
declare const clickInspectFields: FieldConfig[];

/**
 * Map a `ClickInspectBehaviourOptions`-shaped patch to the flat
 * {@link ClickInspectFields} the `@invana/forms` generator renders.
 */
declare function optionsToForm$z(o?: ClickInspectOptions): ClickInspectFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ClickInspectOptions} patch. Only fields the form set are included, so
 * the result is safe to spread over the behaviour's current options on
 * `setOptions`.
 */
declare function formToOptions$z(f: ClickInspectFields): ClickInspectOptions;

/**
 * Types for the ClickViewBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ClickViewBehaviour` lives)
 * is **not** imported. {@link ClickViewOptions} mirrors the editable subset of
 * `ClickViewBehaviourOptions` structurally — keep it in sync by hand.
 */
/**
 * The subset of `ClickViewBehaviourOptions` this editor produces — a
 * serialisable patch. Base fields (`id` / `targetLayerId` / `enabled` /
 * `shortcuts`) are out of scope; only the user-tunable `clearOnBackground`
 * round-trips.
 */
interface ClickViewOptions {
    clearOnBackground?: boolean;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. 1:1 with
 * {@link ClickViewOptions} — no unions to split.
 */
interface ClickViewFields {
    clearOnBackground?: boolean;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface ClickViewFormState {
    options: ClickViewFields;
}

interface ClickViewEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: ClickViewFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link clickViewFields}.
     */
    fields?: FieldConfig[] | ((values: ClickViewFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: ClickViewFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `ClickViewBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `ClickViewBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function ClickViewEditorPanel({ defaults, fields, onSubmit, submitLabel, }: ClickViewEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the ClickViewBehaviour editor. Field `name`s
 * match the keys of `ClickViewFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`.
 */
declare const clickViewFields: FieldConfig[];

/**
 * Map a `ClickViewBehaviourOptions`-shaped patch to the flat
 * {@link ClickViewFields} the `@invana/forms` generator renders.
 */
declare function optionsToForm$y(o?: ClickViewOptions): ClickViewFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ClickViewOptions} patch. Only fields the form set are included, so the
 * result is safe to spread over the behaviour's current options on `setOptions`.
 */
declare function formToOptions$y(f: ClickViewFields): ClickViewOptions;

/**
 * Types for the FocusBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `FocusBehaviour` lives) is
 * **not** imported. {@link FocusOptions} mirrors the editable subset of
 * `FocusBehaviourOptions` structurally — keep it in sync by hand.
 */
/**
 * The subset of `FocusBehaviourOptions` this editor produces — a serialisable
 * patch. Base fields (`id` / `targetLayerId` / `enabled` / `shortcuts`) are out
 * of scope.
 */
interface FocusOptions {
    focusState?: string;
    dimState?: string;
    includeEdges?: boolean;
    frame?: boolean;
    framePadding?: number;
    frameDurationMs?: number;
    frameMaxZoom?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. 1:1 with
 * {@link FocusOptions} — no unions to split.
 */
type FocusFields = FocusOptions;
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface FocusFormState {
    options: FocusFields;
}

interface FocusEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: FocusFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link focusFields}.
     */
    fields?: FieldConfig[] | ((values: FocusFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: FocusFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `FocusBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `FocusBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function FocusEditorPanel({ defaults, fields, onSubmit, submitLabel, }: FocusEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the FocusBehaviour editor. Field `name`s
 * match the keys of `FocusFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`. Static — no input depends on another's value.
 */
declare const focusFields: FieldConfig[];

/**
 * Map a `FocusBehaviourOptions`-shaped patch to the flat {@link FocusFields}
 * the `@invana/forms` generator renders.
 */
declare function optionsToForm$x(o?: FocusOptions): FocusFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link FocusOptions} patch. Only fields the form set are included, so the
 * result is safe to spread over the behaviour's current options on `setOptions`.
 * A blank `dimState` is kept (it means "never dim"); a blank `focusState` is
 * dropped (a focus always needs a state).
 */
declare function formToOptions$x(f: FocusFields): FocusOptions;

/**
 * Types for the BrushSelectBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `BrushSelectBehaviour` and
 * its options live) is **not** imported. {@link BrushSelectOptions} mirrors the
 * editable subset of `BrushSelectBehaviourOptions` structurally — keep it in
 * sync by hand. The rubber-band rectangle's colours are stored as `0xRRGGBB`
 * numbers by the engine (see `mapping.ts`).
 */
/** Modifier-key names accepted by the behaviour's `trigger` gate. */
type BrushSelectModifierKey = 'shift' | 'control' | 'alt' | 'meta';
/**
 * Structural mirror of the engine's `BrushSelectStyle` — the rubber-band
 * rectangle visual. Colours are `0xRRGGBB` numbers; `strokeDash` (a number
 * tuple) is out of scope for the flat form and left untouched.
 */
interface BrushSelectStyleOptions {
    fill?: number;
    fillAlpha?: number;
    stroke?: number;
    strokeAlpha?: number;
    strokeWidth?: number;
    strokeDash?: number[];
}
/**
 * The subset of `BrushSelectBehaviourOptions` this editor produces — a
 * serialisable patch. Callback (`onSelect`), the `enable` predicate, the
 * `clickSelectId` cross-behaviour reference, `strokeDash`, and base fields
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`) are out of scope; only the
 * user-tunable scalars/enums/colours round-trip. `enableElements` keeps the
 * engine's array encoding; `trigger` keeps its `BrushModifierKey[]` encoding.
 */
interface BrushSelectOptions {
    enableElements?: ('shape' | 'connector')[];
    trigger?: BrushSelectModifierKey[];
    immediately?: boolean;
    state?: string;
    clearOnBackground?: boolean;
    style?: BrushSelectStyleOptions;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `enableElements: ('shape'|'connector')[]` array is split into two booleans;
 * `trigger: BrushModifierKey[]` collapses to a single select (`'none'` = no
 * gate); the nested `style` group is flattened to `style`-prefixed scalars
 * (see `mapping.ts`).
 */
interface BrushSelectFields {
    /** Whether nodes are eligible for brush selection. Maps to `enableElements` including `'shape'`. */
    enableShapes?: boolean;
    /** Whether edges are eligible for brush selection. Maps to `enableElements` including `'connector'`. */
    enableConnectors?: boolean;
    /** Single modifier gate. `'none'` maps to the engine's empty `trigger` array. */
    trigger?: 'none' | BrushSelectModifierKey;
    immediately?: boolean;
    state?: string;
    clearOnBackground?: boolean;
    styleFill?: string;
    styleFillAlpha?: number;
    styleStroke?: string;
    styleStrokeAlpha?: number;
    styleStrokeWidth?: number;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface BrushSelectFormState {
    options: BrushSelectFields;
}

interface BrushSelectEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: BrushSelectFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link brushSelectFields}.
     */
    fields?: FieldConfig[] | ((values: BrushSelectFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: BrushSelectFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `BrushSelectBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `BrushSelectBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function BrushSelectEditorPanel({ defaults, fields, onSubmit, submitLabel, }: BrushSelectEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the BrushSelectBehaviour editor, grouped into
 * accordion sections. Field `name`s match the keys of `BrushSelectFields` 1:1 so
 * the generator's `options.<name>` paths line up with `mapping.ts`.
 */
declare const brushSelectFields: FieldConfig[];

/**
 * Map a `BrushSelectBehaviourOptions`-shaped patch to the flat
 * {@link BrushSelectFields} the `@invana/forms` generator renders. The
 * `enableElements` array becomes two booleans; the `trigger` array collapses to
 * a single select; the nested `style` group is flattened; colours are
 * normalised to hex strings.
 */
declare function optionsToForm$w(o?: BrushSelectOptions): BrushSelectFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link BrushSelectOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`. `enableElements` and the `style` group are
 * reassembled only when a member is set; colour strings become `0xRRGGBB`
 * numbers.
 */
declare function formToOptions$w(f: BrushSelectFields): BrushSelectOptions;

/**
 * Types for the EntranceBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `EntranceBehaviour` and its
 * options live) is **not** imported. {@link EntranceOptions} mirrors the
 * editable subset of `EntranceBehaviourOptions` structurally — keep it in sync
 * by hand.
 */
/** Which axis the sweep runs along. `'none'` fades everything together. */
type EntranceOrderOption = 'x' | 'y' | 'none';
/** Named easing curves the engine accepts — mirrors `EasingName`. */
type EntranceEasingOption = 'linear' | 'easeInOutSine' | 'easeOutCubic' | 'easeInOutCubic' | 'easeOutQuad';
/**
 * The subset of `EntranceBehaviourOptions` this editor produces — a
 * serialisable patch. Base fields (`id` / `targetLayerId` / `enabled` /
 * `shortcuts`) are out of scope; only the user-tunable scalars and enums
 * round-trip.
 */
interface EntranceOptions {
    durationMs?: number;
    staggerMs?: number;
    maxStaggerMs?: number;
    order?: EntranceOrderOption;
    includeEdges?: boolean;
    easing?: EntranceEasingOption;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * options are already flat scalars/enums, so this is a 1:1 mirror — the mapping
 * exists to keep the editor's contract independent of the engine's, the way
 * every other editor in this folder does.
 */
interface EntranceFields {
    durationMs?: number;
    staggerMs?: number;
    maxStaggerMs?: number;
    order?: EntranceOrderOption;
    includeEdges?: boolean;
    easing?: EntranceEasingOption;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface EntranceFormState {
    options: EntranceFields;
}

interface EntranceEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: EntranceFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link entranceFields}.
     */
    fields?: FieldConfig[] | ((values: EntranceFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: EntranceFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `EntranceBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `EntranceBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 *
 * Note that applying a change does not replay the entrance: the behaviour plays
 * once per enable, so the new timing shows on the next replay (disable and
 * re-enable, or call `replay()`).
 */
declare function EntranceEditorPanel({ defaults, fields, onSubmit, submitLabel, }: EntranceEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the EntranceBehaviour editor, grouped into
 * accordion sections. Field `name`s match the keys of `EntranceFields` 1:1 so
 * the generator's `options.<name>` paths line up with `mapping.ts`.
 */
declare const entranceFields: FieldConfig[];

/**
 * Map an `EntranceBehaviourOptions`-shaped patch to the flat
 * {@link EntranceFields} the `@invana/forms` generator renders. The engine's
 * options are already flat, so this is a straight projection of the editable
 * subset — the base fields (`id` / `targetLayerId` / `enabled`) are dropped.
 */
declare function optionsToForm$v(o?: EntranceOptions): EntranceFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link EntranceOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
declare function formToOptions$v(f: EntranceFields): EntranceOptions;

/**
 * Types for the LassoSelectBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `LassoSelectBehaviour` and
 * its options live) is **not** imported. {@link LassoSelectOptions} mirrors the
 * editable subset of `LassoSelectBehaviourOptions` structurally — keep it in
 * sync by hand. The polygon overlay's colours are stored as `0xRRGGBB` numbers
 * by the engine (see `mapping.ts`).
 */
/** Modifier-key names accepted by the behaviour's `trigger` gate. */
type LassoSelectModifierKey = 'shift' | 'control' | 'alt' | 'meta';
/**
 * Structural mirror of the engine's `LassoSelectStyle` — the freeform polygon
 * overlay visual. Colours are `0xRRGGBB` numbers; `strokeDash` (a number tuple)
 * is out of scope for the flat form and left untouched.
 */
interface LassoSelectStyleOptions {
    fill?: number;
    fillAlpha?: number;
    stroke?: number;
    strokeAlpha?: number;
    strokeWidth?: number;
    strokeDash?: number[];
}
/**
 * The subset of `LassoSelectBehaviourOptions` this editor produces — a
 * serialisable patch. Callback (`onSelect`), the `enable` predicate, the
 * `clickSelectId` cross-behaviour reference, `strokeDash`, and base fields
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`) are out of scope; only the
 * user-tunable scalars/enums/colours round-trip. `enableElements` keeps the
 * engine's array encoding; `trigger` keeps its `LassoModifierKey[]` encoding.
 */
interface LassoSelectOptions {
    enableElements?: ('shape' | 'connector')[];
    trigger?: LassoSelectModifierKey[];
    immediately?: boolean;
    state?: string;
    clearOnBackground?: boolean;
    style?: LassoSelectStyleOptions;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `enableElements: ('shape'|'connector')[]` array is split into two booleans;
 * `trigger: LassoModifierKey[]` collapses to a single select (`'none'` = no
 * gate); the nested `style` group is flattened to `style`-prefixed scalars
 * (see `mapping.ts`).
 */
interface LassoSelectFields {
    /** Whether nodes are eligible for lasso selection. Maps to `enableElements` including `'shape'`. */
    enableShapes?: boolean;
    /** Whether edges are eligible for lasso selection. Maps to `enableElements` including `'connector'`. */
    enableConnectors?: boolean;
    /** Single modifier gate. `'none'` maps to the engine's empty `trigger` array. */
    trigger?: 'none' | LassoSelectModifierKey;
    immediately?: boolean;
    state?: string;
    clearOnBackground?: boolean;
    styleFill?: string;
    styleFillAlpha?: number;
    styleStroke?: string;
    styleStrokeAlpha?: number;
    styleStrokeWidth?: number;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface LassoSelectFormState {
    options: LassoSelectFields;
}

interface LassoSelectEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: LassoSelectFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link lassoSelectFields}.
     */
    fields?: FieldConfig[] | ((values: LassoSelectFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: LassoSelectFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `LassoSelectBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `LassoSelectBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function LassoSelectEditorPanel({ defaults, fields, onSubmit, submitLabel, }: LassoSelectEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the LassoSelectBehaviour editor, grouped into
 * accordion sections. Field `name`s match the keys of `LassoSelectFields` 1:1 so
 * the generator's `options.<name>` paths line up with `mapping.ts`.
 */
declare const lassoSelectFields: FieldConfig[];

/**
 * Map a `LassoSelectBehaviourOptions`-shaped patch to the flat
 * {@link LassoSelectFields} the `@invana/forms` generator renders. The
 * `enableElements` array becomes two booleans; the `trigger` array collapses to
 * a single select; the nested `style` group is flattened; colours are
 * normalised to hex strings.
 */
declare function optionsToForm$u(o?: LassoSelectOptions): LassoSelectFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link LassoSelectOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`. `enableElements` and the `style` group are
 * reassembled only when a member is set; colour strings become `0xRRGGBB`
 * numbers.
 */
declare function formToOptions$u(f: LassoSelectFields): LassoSelectOptions;

/**
 * Types for the HoverActivateBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `HoverActivateBehaviour`
 * and its options live) is imported for **types only** — actually not even that
 * here; the editable option shape is mirrored **structurally** as
 * {@link HoverActivateOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. Keep it in sync with `HoverActivateBehaviourOptions` by hand.
 */
/** Edge-traversal direction filter for neighbour expansion (mirrors the engine enum). */
type HoverDirection = 'in' | 'out' | 'both';
/**
 * Which group frames never become the focal hover (mirrors the engine enum).
 * `'expanded'` is the engine default: an expanded frame is scenery, a
 * collapsed one behaves like an ordinary node.
 */
type GroupExclusion = 'expanded' | 'always' | 'never';
/**
 * The serialisable subset of `HoverActivateBehaviourOptions` this editor
 * produces. Function options (`enable`, `onHover`, `onHoverEnd`) and the base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope —
 * only the user-tunable scalars / enums round-trip.
 */
interface HoverActivateOptions {
    hoverEdges?: boolean;
    excludeNodeTypes?: string[];
    excludeGroups?: GroupExclusion;
    excludeEdgeTypes?: string[];
    state?: string;
    inactiveState?: string;
    raiseActive?: boolean;
    degree?: number;
    direction?: HoverDirection;
    zoomThreshold?: number;
    zoomedOutState?: string;
    zoomedOutEdgeState?: string;
    zoomedOutScale?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. There are no
 * nested groups or unions in `HoverActivateBehaviourOptions`, so the fields map
 * 1:1 to {@link HoverActivateOptions}.
 */
interface HoverActivateFields {
    hoverEdges?: boolean;
    /** Comma-separated `GraphNode.type` list — encoded, see `mapping.ts`. */
    excludeNodeTypes?: string;
    /** Structural group veto — a plain enum, no encoding. */
    excludeGroups?: GroupExclusion;
    /** Comma-separated `GraphEdge.type` list — encoded, see `mapping.ts`. */
    excludeEdgeTypes?: string;
    state?: string;
    inactiveState?: string;
    raiseActive?: boolean;
    degree?: number;
    direction?: HoverDirection;
    zoomThreshold?: number;
    zoomedOutState?: string;
    zoomedOutEdgeState?: string;
    zoomedOutScale?: number;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface HoverActivateFormState {
    options: HoverActivateFields;
}

interface HoverActivateEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: HoverActivateFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link hoverActivateFields}.
     */
    fields?: FieldConfig[] | ((values: HoverActivateFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: HoverActivateFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `HoverActivateBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `HoverActivateBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function HoverActivateEditorPanel({ defaults, fields, onSubmit, submitLabel, }: HoverActivateEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the HoverActivateBehaviour editor. Field
 * `name`s match the keys of `HoverActivateFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 */
declare const hoverActivateFields: FieldConfig[];

/**
 * Map a `HoverActivateBehaviourOptions`-shaped patch to the flat
 * {@link HoverActivateFields} the `@invana/forms` generator renders.
 *
 * The two exclusion lists are the one encoding that happens here: `string[]`
 * in, comma-separated text out, because the form generator has no list field.
 * Everything else is a straight passthrough.
 */
declare function optionsToForm$t(o?: HoverActivateOptions): HoverActivateFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link HoverActivateOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`.
 */
declare function formToOptions$t(f: HoverActivateFields): HoverActivateOptions;

/**
 * Types for the HoverElementPreviewBehaviour editor.
 *
 * Engine-agnostic: the editable option shape is mirrored **structurally** here
 * as {@link HoverElementPreviewOptions}, a plain serialisable patch the consumer
 * applies via `setOptions`. Only the scalar timing / placement / interactivity
 * knobs round-trip — the `card` / `cards` field-maps and the `onShow` / `onHide`
 * render callbacks are deliberately out of scope (they're authored elsewhere).
 */
/** Anchor-placement hint passed through to the consumer (mirrors the engine enum). */
type PreviewPlacement = 'auto' | 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/**
 * The serialisable subset of `HoverElementPreviewBehaviourOptions` this editor
 * produces — the scalar dwell/grace timing, the placement hint, and the
 * interactive toggle. `targets`, `enable`, `card`, `cards`, `onShow`, `onHide`
 * and the base fields are out of scope.
 */
interface HoverElementPreviewOptions {
    openDelay?: number;
    closeDelay?: number;
    placement?: PreviewPlacement;
    interactive?: boolean;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Maps 1:1 to
 * {@link HoverElementPreviewOptions} — no nested groups or unions.
 */
interface HoverElementPreviewFields {
    openDelay?: number;
    closeDelay?: number;
    placement?: PreviewPlacement;
    interactive?: boolean;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface HoverElementPreviewFormState {
    options: HoverElementPreviewFields;
}

interface HoverElementPreviewEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: HoverElementPreviewFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link hoverElementPreviewFields}.
     */
    fields?: FieldConfig[] | ((values: HoverElementPreviewFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: HoverElementPreviewFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `HoverElementPreviewBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `HoverElementPreviewBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function HoverElementPreviewEditorPanel({ defaults, fields, onSubmit, submitLabel, }: HoverElementPreviewEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the HoverElementPreviewBehaviour editor.
 * Field `name`s match the keys of `HoverElementPreviewFields` 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`. Only the scalar
 * timing / placement / interactivity knobs are exposed; the `card` / `cards`
 * templates are authored separately.
 */
declare const hoverElementPreviewFields: FieldConfig[];

/**
 * Map a `HoverElementPreviewBehaviourOptions`-shaped patch to the flat
 * {@link HoverElementPreviewFields} the `@invana/forms` generator renders. No
 * colours, nested groups, or unions — a straight passthrough of the scalar
 * timing / placement / interactivity knobs.
 */
declare function optionsToForm$s(o?: HoverElementPreviewOptions): HoverElementPreviewFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link HoverElementPreviewOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`.
 */
declare function formToOptions$s(f: HoverElementPreviewFields): HoverElementPreviewOptions;

/**
 * Types for the DragNodeBehaviour editor.
 *
 * Engine-agnostic: the editable option shape is mirrored **structurally** here
 * as {@link DragNodeOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. The `filter` predicate and the base `id` / `targetLayerId` /
 * `enabled` / `shortcuts` fields are out of scope — only the tunable scalars /
 * booleans round-trip.
 */
/**
 * The serialisable subset of `DragNodeBehaviourOptions` this editor produces.
 * `filter` (a function) is omitted.
 */
interface DragNodeOptions {
    dragCursor?: string;
    groupAware?: boolean;
    pinOnRelease?: boolean;
    dragSelection?: boolean;
    selectionState?: string;
    selectionBodyDrag?: boolean;
    selectionBodyPadding?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Maps 1:1 to
 * {@link DragNodeOptions} — no nested groups or unions.
 */
interface DragNodeFields {
    dragCursor?: string;
    groupAware?: boolean;
    pinOnRelease?: boolean;
    dragSelection?: boolean;
    selectionState?: string;
    selectionBodyDrag?: boolean;
    selectionBodyPadding?: number;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface DragNodeFormState {
    options: DragNodeFields;
}

interface DragNodeEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: DragNodeFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link dragNodeFields}.
     */
    fields?: FieldConfig[] | ((values: DragNodeFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: DragNodeFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `DragNodeBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `DragNodeBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function DragNodeEditorPanel({ defaults, fields, onSubmit, submitLabel, }: DragNodeEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the DragNodeBehaviour editor. Field `name`s
 * match the keys of `DragNodeFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`.
 */
declare const dragNodeFields: FieldConfig[];

/**
 * Map a `DragNodeBehaviourOptions`-shaped patch to the flat {@link DragNodeFields}
 * the `@invana/forms` generator renders. No colours, nested groups, or unions —
 * a straight passthrough.
 */
declare function optionsToForm$r(o?: DragNodeOptions): DragNodeFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DragNodeOptions} patch. Only fields the form actually set are included
 * (no `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
declare function formToOptions$r(f: DragNodeFields): DragNodeOptions;

/**
 * Types for the NodeResizeBehaviour editor.
 *
 * Engine-agnostic: the editable option shape is mirrored **structurally** here
 * as {@link NodeResizeOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. Colours are **numbers** (`0xRRGGBB`) in the engine and are
 * bridged to `#rrggbb` swatch strings by `mapping.ts`; the `dashArray` tuple is
 * split into two number fields.
 */
/**
 * The serialisable subset of `NodeResizeBehaviourOptions` this editor produces.
 * Colours stay as engine numbers (`handleFill`, `frameColor`); `dashArray` keeps
 * its `[dash, gap]` tuple shape.
 */
interface NodeResizeOptions {
    handleRadius?: number;
    /** Handle fill colour as an engine `0xRRGGBB` number. */
    handleFill?: number;
    /** Frame border + handle outline colour as an engine `0xRRGGBB` number. */
    frameColor?: number;
    /** Dash pattern `[dashLength, gapLength]` in px. */
    dashArray?: readonly [number, number];
    framePadding?: number;
    minSize?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Colours become
 * `#rrggbb` strings; the `dashArray` tuple is flattened into `dashLength` +
 * `dashGap` number fields (see `mapping.ts`).
 */
interface NodeResizeFields {
    handleRadius?: number;
    /** Handle fill as a `#rrggbb` swatch string. */
    handleFill?: string;
    /** Frame colour as a `#rrggbb` swatch string. */
    frameColor?: string;
    /** First tuple member of `dashArray` — the dash length in px. */
    dashLength?: number;
    /** Second tuple member of `dashArray` — the gap length in px. */
    dashGap?: number;
    framePadding?: number;
    minSize?: number;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface NodeResizeFormState {
    options: NodeResizeFields;
}

interface NodeResizeEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: NodeResizeFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link nodeResizeFields}.
     */
    fields?: FieldConfig[] | ((values: NodeResizeFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: NodeResizeFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `NodeResizeBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `NodeResizeBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function NodeResizeEditorPanel({ defaults, fields, onSubmit, submitLabel, }: NodeResizeEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the NodeResizeBehaviour editor. Field `name`s
 * match the keys of `NodeResizeFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`. The engine's `dashArray` tuple is exposed as
 * two number fields; colours are `color` swatches.
 */
declare const nodeResizeFields: FieldConfig[];

/**
 * Map a `NodeResizeBehaviourOptions`-shaped patch to the flat
 * {@link NodeResizeFields} the `@invana/forms` generator renders. Engine number
 * colours (`0xRRGGBB`) become `#rrggbb` swatch strings; the `dashArray` tuple is
 * split into `dashLength` / `dashGap` number fields.
 */
declare function optionsToForm$q(o?: NodeResizeOptions): NodeResizeFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link NodeResizeOptions} patch. Swatch strings become engine numbers; the two
 * dash fields are re-fused into the `dashArray` tuple (only when at least one is
 * set). Only fields the form actually set are included (no `undefined` keys), so
 * the result is safe to spread over the behaviour's current options on
 * `setOptions`.
 */
declare function formToOptions$q(f: NodeResizeFields): NodeResizeOptions;

/**
 * Types for the CollapseExpandBehaviour editor.
 *
 * Engine-agnostic: the editable option shape is mirrored **structurally** here.
 * Of `CollapseExpandBehaviourOptions`, `doubleClickToToggle`,
 * `centerOnToggle`, `centerDurationMs`, `relayoutOnToggle`, `countBadge` and
 * `countBadgePlacement` are the tunable visualisation state — the base fields
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`) are out of scope for the
 * state editor.
 */
/**
 * The named `BadgePlacement`s the editor offers for the count badge. The
 * engine also accepts an `{ x, y }` point, which this form does not edit.
 */
type CountBadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top' | 'bottom' | 'left' | 'right';
/**
 * The serialisable subset of `CollapseExpandBehaviourOptions` this editor
 * produces.
 */
interface CollapseExpandOptions {
    /**
     * Double-clicking a group frame toggles it, as well as its `+` / `−` button.
     * Engine default `true`.
     */
    readonly doubleClickToToggle?: boolean;
    /**
     * Pan the camera to centre a frame after it opens or closes. Engine default
     * `false`.
     */
    readonly centerOnToggle?: boolean;
    /**
     * Length of the re-centre glide, in milliseconds; `0` jumps. Engine default
     * `300`.
     */
    readonly centerDurationMs?: number;
    /**
     * Re-run the active layout after a frame opens or closes, anchored on the
     * toggled frame, leaving the camera alone. Engine default `false`.
     */
    readonly relayoutOnToggle?: boolean;
    /**
     * Mark each collapsed frame with a pill showing how many nodes it hides.
     * Engine default `false`.
     */
    readonly countBadge?: boolean;
    /** Where the count badge sits on the frame. Engine default `'top-right'`. */
    readonly countBadgePlacement?: CountBadgePlacement;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Mirrors
 * {@link CollapseExpandOptions} 1:1 — there's no encoding difference to bridge.
 */
interface CollapseExpandFields {
    doubleClickToToggle?: boolean;
    centerOnToggle?: boolean;
    centerDurationMs?: number;
    relayoutOnToggle?: boolean;
    countBadge?: boolean;
    countBadgePlacement?: CountBadgePlacement;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface CollapseExpandFormState {
    options: CollapseExpandFields;
}

interface CollapseExpandEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: CollapseExpandFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link collapseExpandFields}.
     */
    fields?: FieldConfig[] | ((values: CollapseExpandFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: CollapseExpandFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `CollapseExpandBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — map the values back with
 * `formToOptions` and apply them yourself.
 */
declare function CollapseExpandEditorPanel({ defaults, fields, onSubmit, submitLabel, }: CollapseExpandEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the CollapseExpandBehaviour editor.
 *
 * `doubleClickToToggle`, `relayoutOnToggle`, `centerOnToggle`,
 * `centerDurationMs`, `countBadge` and `countBadgePlacement` are the editable
 * visualisation state — the rest of `CollapseExpandBehaviourOptions` is base wiring
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`), which the settings editor
 * doesn't own.
 */
declare const collapseExpandFields: FieldConfig[];

/**
 * Map a `CollapseExpandBehaviourOptions`-shaped patch to the flat
 * {@link CollapseExpandFields}. The options are plain values, so this is a
 * straight copy — each falls back to the engine's default so an unset option
 * still renders in its effective state.
 */
declare function optionsToForm$p(o?: CollapseExpandOptions): CollapseExpandFields;
/** Inverse of {@link optionsToForm}. */
declare function formToOptions$p(f: CollapseExpandFields): CollapseExpandOptions;

/**
 * Types for the CreateNodeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `CreateNodeBehaviour` and
 * its options live) is **not** imported for values — canvas-ui mirrors the
 * editable option shape here as {@link CreateNodeOptions}, a plain serialisable
 * patch the consumer applies via `setOptions`. The mirror is structural, not
 * derived; keep it in sync with `CreateNodeBehaviourOptions` by hand.
 */
/**
 * The serialisable subset of `CreateNodeBehaviourOptions` this editor produces.
 *
 * `CreateNodeBehaviour` exposes no user-tunable scalars: its only options are
 * the `createNode` / `onNodeCreate` **callbacks** (out of scope — not
 * serialisable) plus the base `targetLayerId` / `enabled` / `shortcuts` (owned
 * by the host) — and the base `modes` gate, which is what ties it to the
 * modeller's Add tool. The editor exists for parity (root
 * `CLAUDE.md` rule 12 — every behaviour ships an editor) and as the seam where a
 * future scalar option (e.g. a default node `type`) would land.
 */
interface CreateNodeOptions {
    /** Interaction modes the behaviour is live in (`BehaviourOptions.modes`); `undefined` = every mode. */
    modes?: string[];
}
/** Flat form-field shape, mirroring {@link CreateNodeOptions}. */
interface CreateNodeFields {
    /** Ticked modes; empty = every mode. */
    modes?: string[];
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface CreateNodeFormState {
    options: CreateNodeFields;
}

interface CreateNodeEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: CreateNodeFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link createNodeFields}.
     */
    fields?: FieldConfig[] | ((values: CreateNodeFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: CreateNodeFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `CreateNodeBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `CreateNodeBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function CreateNodeEditorPanel({ defaults, fields, onSubmit, submitLabel, }: CreateNodeEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the CreateNodeBehaviour editor. Only the base
 * `modes` gate — `CreateNodeBehaviour`'s own options are the `createNode` /
 * `onNodeCreate` callbacks, which aren't serialisable.
 */
declare const createNodeFields: FieldConfig[];

/**
 * Map a `CreateNodeBehaviourOptions`-shaped patch to the flat
 * {@link CreateNodeFields}. Only the base `modes` gate is serialisable.
 */
declare function optionsToForm$o(o?: CreateNodeOptions): CreateNodeFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link CreateNodeOptions} patch. An empty `modes` group clears the gate.
 */
declare function formToOptions$o(f: CreateNodeFields): CreateNodeOptions;

/**
 * Types for the DrawEdgeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `DrawEdgeBehaviour` and its
 * options live) is **not** imported for values — canvas-ui mirrors the editable
 * option shape here as {@link DrawEdgeOptions}, a plain serialisable patch the
 * consumer applies via `setOptions`. The mirror is structural, not derived; keep
 * it in sync with `DrawEdgeBehaviourOptions` by hand.
 */
/**
 * The serialisable subset of `DrawEdgeBehaviourOptions` this editor produces.
 * The `createEdge` / `onEdgeCreate` **callbacks** and the base
 * `targetLayerId` / `enabled` / `shortcuts` are out of scope. `draftStyle` (the
 * rubber-band preview stroke) keeps its nested structure here; the flat form
 * splits it into prefixed scalars — see {@link DrawEdgeFields}. `draftStyle.color`
 * is an engine `0xRRGGBB` **number** (default `0x60a5fa`).
 */
interface DrawEdgeOptions {
    allowSelfLoop?: boolean;
    draftStyle?: {
        /** Preview stroke colour as an engine `0xRRGGBB` number. */
        color?: number;
        width?: number;
        alpha?: number;
        /** `[dash, gap]` dash pattern. */
        dash?: [number, number];
    };
    /** Interaction modes the behaviour is live in (`BehaviourOptions.modes`); `undefined` = every mode. */
    modes?: string[];
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The nested
 * `draftStyle` group is flattened to `draft`-prefixed scalars, and its
 * `dash: [number, number]` tuple is split into two number fields
 * (`draftDashLength` + `draftDashGap`) — `FieldType` has no tuple/array kind.
 */
interface DrawEdgeFields {
    allowSelfLoop?: boolean;
    /** Preview stroke colour as a `#rrggbb` hex string (the swatch's format). */
    draftColor?: string;
    draftWidth?: number;
    draftAlpha?: number;
    /** Dash length (`draftStyle.dash[0]`). */
    draftDashLength?: number;
    /** Dash gap (`draftStyle.dash[1]`). */
    draftDashGap?: number;
    /** Ticked modes; empty = every mode. */
    modes?: string[];
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface DrawEdgeFormState {
    options: DrawEdgeFields;
}

interface DrawEdgeEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: DrawEdgeFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link drawEdgeFields}.
     */
    fields?: FieldConfig[] | ((values: DrawEdgeFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: DrawEdgeFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `DrawEdgeBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `DrawEdgeBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function DrawEdgeEditorPanel({ defaults, fields, onSubmit, submitLabel, }: DrawEdgeEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the DrawEdgeBehaviour editor. Field `name`s
 * match the keys of {@link import('./types').DrawEdgeFields} 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`. The nested
 * `draftStyle` group is rendered as flat `draft`-prefixed scalars; its dash
 * tuple is two number inputs.
 */
declare const drawEdgeFields: FieldConfig[];

/**
 * Map a `DrawEdgeBehaviourOptions`-shaped patch to the flat {@link DrawEdgeFields}
 * the `@invana/forms` generator renders. The nested `draftStyle` group is
 * flattened to `draft`-prefixed scalars; the `0xRRGGBB` number colour becomes a
 * `#rrggbb` hex string, and the `[dash, gap]` tuple splits into two numbers.
 */
declare function optionsToForm$n(o?: DrawEdgeOptions): DrawEdgeFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DrawEdgeOptions} patch. Only fields the form actually set are included,
 * so the result is safe to spread on `setOptions`. The `draftStyle` group is
 * reassembled only when at least one of its members was set; the hex colour is
 * re-encoded to a `0xRRGGBB` number and the dash pair re-fused into a tuple
 * (falling back to the engine defaults `[6, 4]` for a missing half).
 */
declare function formToOptions$n(f: DrawEdgeFields): DrawEdgeOptions;

/**
 * Types for the EraseBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `EraseBehaviour` and its
 * options live) is **not** imported for values — canvas-ui mirrors the editable
 * option shape here as {@link EraseOptions}, a plain serialisable patch the
 * consumer applies via `setOptions`. The mirror is structural, not derived; keep
 * it in sync with `EraseBehaviourOptions` by hand.
 */
/** Which element kinds the eraser removes. Mirrors the engine's `EraseTargetKind`. */
type EraseTargetKind = 'node' | 'edge' | 'both';
/**
 * The serialisable subset of `EraseBehaviourOptions` this editor produces. The
 * `onErase` **callback** and the base `targetLayerId` / `enabled` / `shortcuts`
 * are out of scope; the `target` enum and the `modes` gate round-trip.
 */
interface EraseOptions {
    target?: EraseTargetKind;
    /** Interaction modes the eraser is live in (`BehaviourOptions.modes`); `undefined` = every mode. */
    modes?: string[];
}
/**
 * Flat form-field shape the `@invana/forms` generator renders — a `target`
 * select and a `modes` checkbox group. 1:1 with {@link EraseOptions}.
 */
interface EraseFields {
    target?: EraseTargetKind;
    /** Ticked modes; empty = every mode. */
    modes?: string[];
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface EraseFormState {
    options: EraseFields;
}

interface EraseEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: EraseFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link eraseFields}.
     */
    fields?: FieldConfig[] | ((values: EraseFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: EraseFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `EraseBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `EraseBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function EraseEditorPanel({ defaults, fields, onSubmit, submitLabel, }: EraseEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the EraseBehaviour editor. The `target` enum
 * (`'node' | 'edge' | 'both'`) renders as a select; the name matches
 * {@link import('./types').EraseFields} 1:1 so `options.target` lines up with
 * `mapping.ts`.
 */
declare const eraseFields: FieldConfig[];

/**
 * Map an `EraseBehaviourOptions`-shaped patch to the flat {@link EraseFields}
 * the `@invana/forms` generator renders. A direct pass-through of the `target`
 * enum, plus the `modes` gate as a checkbox group.
 */
declare function optionsToForm$m(o?: EraseOptions): EraseFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link EraseOptions} patch. Only fields the form actually set are included, so
 * the result is safe to spread on `setOptions`.
 */
declare function formToOptions$m(f: EraseFields): EraseOptions;

/**
 * Types for the ContextMenuBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ContextMenuBehaviour` and
 * its options live) is **not** imported for values — canvas-ui mirrors the
 * editable option shape here as {@link ContextMenuOptions}, a plain serialisable
 * patch the consumer applies via `setOptions`. The mirror is structural, not
 * derived; keep it in sync with `ContextMenuBehaviourOptions` by hand.
 */
/** Which kind of target a context-menu gesture landed on. */
type ContextMenuTargetType = 'node' | 'edge' | 'canvas';
/**
 * The serialisable subset of `ContextMenuBehaviourOptions` this editor produces.
 * The `onContextMenu` **callback** and the base
 * `targetLayerId` / `enabled` / `shortcuts` are out of scope. `targets` (the
 * allowed target kinds) and `state` (a transient state name) round-trip;
 * `targets` is stored structurally as its array here but flattened to three
 * booleans in the form — see {@link ContextMenuFields}.
 */
interface ContextMenuOptions {
    targets?: ContextMenuTargetType[];
    /** Transient state name applied to the right-clicked node/edge, or `null` to disable. */
    state?: string | null;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The `targets`
 * array is flattened into one boolean per kind (`FieldType` has no array), and
 * `state` renders as a text input.
 */
interface ContextMenuFields {
    /** Fire on right-clicking a node (`targets` includes `'node'`). */
    targetNode?: boolean;
    /** Fire on right-clicking an edge (`targets` includes `'edge'`). */
    targetEdge?: boolean;
    /** Fire on right-clicking empty canvas (`targets` includes `'canvas'`). */
    targetCanvas?: boolean;
    /** Transient state name applied to the right-clicked element. Empty = none. */
    state?: string;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface ContextMenuFormState {
    options: ContextMenuFields;
}

interface ContextMenuEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: ContextMenuFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link contextMenuFields}.
     */
    fields?: FieldConfig[] | ((values: ContextMenuFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: ContextMenuFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `ContextMenuBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `ContextMenuBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function ContextMenuEditorPanel({ defaults, fields, onSubmit, submitLabel, }: ContextMenuEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the ContextMenuBehaviour editor. The engine's
 * `targets` array is exposed as three boolean toggles (one per target kind); the
 * `state` name renders as a text input. Field `name`s match
 * {@link import('./types').ContextMenuFields} 1:1 so the `options.<name>` paths
 * line up with `mapping.ts`.
 */
declare const contextMenuFields: FieldConfig[];

/**
 * Map a `ContextMenuBehaviourOptions`-shaped patch to the flat
 * {@link ContextMenuFields} the `@invana/forms` generator renders. The `targets`
 * array is exploded into one boolean per kind; `state` (`string | null`) becomes
 * a text field (`null` → empty string).
 */
declare function optionsToForm$l(o?: ContextMenuOptions): ContextMenuFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ContextMenuOptions} patch. Only fields the form actually set are
 * included, so the result is safe to spread on `setOptions`. The `targets` array
 * is reassembled only when at least one target toggle was set; a blank `state`
 * maps back to `null` (disabled).
 */
declare function formToOptions$l(f: ContextMenuFields): ContextMenuOptions;

/**
 * Types for the `ColorByBehaviour` editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ColorByBehaviour` and its
 * options live) is **not** imported for values — canvas-ui mirrors the editable
 * option shape here as {@link ColorByOptions}, a plain serialisable patch the
 * consumer applies via `setOptions`. The mirror is structural, not derived; keep
 * it in sync with `ColorByBehaviourOptions` by hand.
 */
/** Which colouring job — mirrors the engine's `ColorByMode`. */
type ColorByModeValue = 'categorical' | 'range';
/** Curve / binning — mirrors the engine's `ColorByScale`. */
type ColorByScaleValue = 'linear' | 'sqrt' | 'log' | 'quantile' | 'threshold';
/**
 * The serialisable subset of `ColorByBehaviourOptions` this editor produces.
 *
 * Out of scope: the `nodeValueBy` / `edgeValueBy` **accessor callbacks** (they're
 * functions — not editable, not persistable) and the base `targetLayerId` /
 * `enabled` / `shortcuts`. Also omitted: `palette` (`number[]`) and
 * `valueColors` (`Record<string, number>`) — `FieldType` has no array or map
 * kind, so a swatch-array / value-swatch-pair editor is future work.
 *
 * Colours are engine `0xRRGGBB` **numbers** here; the form carries `#rrggbb`
 * strings (see {@link ColorByFields}).
 */
interface ColorByOptions {
    mode?: ColorByModeValue;
    /** Root-relative dot path driving node colour — `'type'`, `'data.riskScore'`. */
    nodeValueKey?: string;
    /** Root-relative dot path driving edge colour. */
    edgeValueKey?: string;
    colorNodes?: boolean;
    colorEdges?: boolean;
    /** Colour for missing / non-numeric values, as an engine `0xRRGGBB` number. */
    fallbackColor?: number;
    /** Cardinality cap for `'categorical'`. */
    maxCategories?: number;
    scale?: ColorByScaleValue;
    /** Explicit `[min, max]` for node values; omit for auto-scan. */
    nodeDomain?: readonly [number, number];
    /** Explicit `[min, max]` for edge values; omit for auto-scan. */
    edgeDomain?: readonly [number, number];
    /** Bucket count for `scale: 'quantile'`. */
    bins?: number;
    /** Explicit bucket edges for `scale: 'threshold'`, node units. */
    nodeThresholds?: readonly number[];
    /** Explicit bucket edges for `scale: 'threshold'`, edge units. */
    edgeThresholds?: readonly number[];
}
/**
 * Flat form-field shape the `@invana/forms` generator renders.
 *
 * Three encodings `FieldType` can't express directly:
 * - `fallbackColor` — the `0xRRGGBB` number as a `#rrggbb` hex string.
 * - `*Domain` — the `[min, max]` tuple split into two number fields, so either
 *   bound can be cleared independently (both blank = auto-scan).
 * - `*Thresholds` — the `number[]` as a comma-separated text field.
 */
interface ColorByFields {
    mode?: ColorByModeValue;
    nodeValueKey?: string;
    edgeValueKey?: string;
    colorNodes?: boolean;
    colorEdges?: boolean;
    /** Fallback colour as a `#rrggbb` hex string. */
    fallbackColor?: string;
    maxCategories?: number;
    scale?: ColorByScaleValue;
    nodeDomainMin?: number;
    nodeDomainMax?: number;
    edgeDomainMin?: number;
    edgeDomainMax?: number;
    bins?: number;
    /** Comma-separated bucket edges, e.g. `"10, 50, 200"`. */
    nodeThresholds?: string;
    /** Comma-separated bucket edges, e.g. `"10, 50, 200"`. */
    edgeThresholds?: string;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface ColorByFormState {
    options: ColorByFields;
}

interface ColorByEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: ColorByFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link colorByFields}, which **is** a function
     * of the values — the mode / scale selection drives which fields render.
     */
    fields?: FieldConfig[] | ((values: ColorByFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: ColorByFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `ColorByBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `ColorByBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's
 * plug-in.
 *
 * The default schema is **mode-driven**: switching Mode between Categorical and
 * Range, or changing Scale, swaps the field set live off a `useWatch`. Values
 * for the mode you aren't on are kept in form state rather than cleared, which
 * mirrors the behaviour's own "options outside their mode are ignored, not
 * errors" rule — so toggling back and forth doesn't destroy your settings.
 */
declare function ColorByEditorPanel({ defaults, fields, onSubmit, submitLabel, }: ColorByEditorPanelProps): react.JSX.Element;

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
declare function colorByFields(values?: ColorByFields): FieldConfig[];

/**
 * Map a `ColorByBehaviourOptions`-shaped patch to the flat {@link ColorByFields}
 * the `@invana/forms` generator renders.
 *
 * Three encodings happen here (see {@link ColorByFields}): the `0xRRGGBB`
 * `fallbackColor` becomes `#rrggbb`, each `[min, max]` domain splits into two
 * number fields, and each threshold array becomes comma-separated text.
 */
declare function optionsToForm$k(o?: ColorByOptions): ColorByFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ColorByOptions} patch. Only fields the form actually set are included,
 * so the result is safe to spread on `setOptions`.
 *
 * A domain is emitted **only when both bounds are present** — a half-filled
 * domain is a mid-edit state, not an instruction, and emitting it would pin one
 * end of the scale to `undefined`. Both blank therefore means auto-scan, which
 * is what the field description promises.
 */
declare function formToOptions$k(f: ColorByFields): ColorByOptions;

/**
 * Types for the ThemeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ThemeBehaviour` and its
 * options live) is **not** imported for values — canvas-ui mirrors the editable
 * option shape here as {@link ThemeOptions}, a plain serialisable patch the
 * consumer applies via `setOptions`. The mirror is structural, not derived; keep
 * it in sync with `ThemeBehaviourOptions` by hand.
 */
/**
 * How the theme is chosen. Mirrors the engine's `ThemeMode`: `'system'` follows
 * the OS, `'document'` follows the host page's `data-theme` on `<html>` (family
 * and kind), `'light'`/`'dark'` pin the kind.
 */
type ThemeMode = 'system' | 'document' | 'light' | 'dark';
/**
 * The serialisable subset of `ThemeBehaviourOptions` this editor produces.
 *
 * Out of scope: the `themes` **registry** (`ThemeRegistry` — a record of palette
 * objects), the `light` / `dark` single-layer **shorthand patch records**
 * (`Record<string, unknown>`), and the `accent` union (`'css-var' | number` —
 * whose source is really a mode, not a scalar); plus the base
 * `targetLayerId` / `enabled` / `shortcuts`. Only the scalar knobs round-trip:
 * `mode`, `active`, `fallback`, and the `accentVar` CSS-custom-property name.
 */
interface ThemeOptions {
    mode?: ThemeMode;
    /** Active theme name. Matched to the host theme family. */
    active?: string;
    /** Theme used when `active` isn't found. */
    fallback?: string;
    /** CSS custom property read when the accent is sourced from a variable. */
    accentVar?: string;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders — 1:1 with
 * {@link ThemeOptions} (all scalars, nothing to flatten). `mode` renders as a
 * select; the rest as text inputs.
 */
interface ThemeFields {
    mode?: ThemeMode;
    active?: string;
    fallback?: string;
    accentVar?: string;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface ThemeFormState {
    options: ThemeFields;
}

interface ThemeEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: ThemeFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link themeFields}.
     */
    fields?: FieldConfig[] | ((values: ThemeFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: ThemeFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `ThemeBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `ThemeBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function ThemeEditorPanel({ defaults, fields, onSubmit, submitLabel, }: ThemeEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the ThemeBehaviour editor. The `mode` enum
 * (`'system' | 'document' | 'light' | 'dark'`) renders as a select; `active`, `fallback`, and
 * `accentVar` as text inputs. Field `name`s match
 * {@link import('./types').ThemeFields} 1:1 so `options.<name>` lines up with
 * `mapping.ts`. The `themes` registry and `light` / `dark` shorthand records have
 * no fields here — they aren't flat scalars.
 */
declare const themeFields: FieldConfig[];

/**
 * Map a `ThemeBehaviourOptions`-shaped patch to the flat {@link ThemeFields} the
 * `@invana/forms` generator renders. A direct pass-through — every field is a
 * scalar with no encoding to bridge (no colours: `accentVar` is a CSS-variable
 * name, not a colour value).
 */
declare function optionsToForm$j(o?: ThemeOptions): ThemeFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ThemeOptions} patch. Only fields the form actually set are included, so
 * the result is safe to spread on `setOptions`.
 */
declare function formToOptions$j(f: ThemeFields): ThemeOptions;

/**
 * Types for the FisheyeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `FisheyeBehaviour` and its
 * options live) is **not** imported for its runtime — canvas-ui mirrors the
 * editable option shape here as {@link FisheyeOptions}, a plain serialisable
 * patch the consumer applies via `setOptions`. The mirror is structural, not
 * derived, so keep it in sync with `FisheyeBehaviourOptions` by hand.
 */
/** How the lens moves. */
type FisheyeTrigger = 'pointermove' | 'click' | 'drag';
/** Keyboard modifier that turns the wheel into a lens adjustment. */
type FisheyeWheelModifier = 'alt' | 'shift' | 'ctrl' | 'meta';
/**
 * The subset of `FisheyeBehaviourOptions` this editor produces — a serialisable
 * patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts` fields are
 * out of scope.
 */
interface FisheyeOptions {
    trigger?: FisheyeTrigger;
    /** Lens radius in screen pixels. Default `120`. */
    radius?: number;
    minRadius?: number;
    /** `null` = half the canvas's shorter side. */
    maxRadius?: number | null;
    /** Distortion factor; `0` = none. Default `1.5`. */
    distortion?: number;
    minDistortion?: number;
    maxDistortion?: number;
    /** Size multiplier at the lens centre. Default `1.5`. */
    nodeScale?: number;
    /** Force labels visible inside the lens. Default `true`. */
    showLabels?: boolean;
    /** `null` disables wheel-adjusting the radius. Default `'alt'`. */
    radiusWheelModifier?: FisheyeWheelModifier | null;
    /** `null` disables wheel-adjusting the distortion. Default `'shift'`. */
    distortionWheelModifier?: FisheyeWheelModifier | null;
    lensStrokeColor?: number;
    lensStrokeWidth?: number;
    lensFillColor?: number;
    lensFillAlpha?: number;
}
/** A wheel modifier as the form shows it — `'none'` stands for `null`. */
type FisheyeWheelModifierField = FisheyeWheelModifier | 'none';
/**
 * Flat form-field shape the `@invana/forms` generator renders. Differs from
 * {@link FisheyeOptions} where a form can't hold the value directly: modifiers
 * use `'none'` for `null`, `maxRadius` uses `0` for `null` (auto), and colours
 * are hex strings.
 */
interface FisheyeFields {
    trigger?: FisheyeTrigger;
    radius?: number;
    minRadius?: number;
    maxRadius?: number;
    distortion?: number;
    minDistortion?: number;
    maxDistortion?: number;
    nodeScale?: number;
    showLabels?: boolean;
    radiusWheelModifier?: FisheyeWheelModifierField;
    distortionWheelModifier?: FisheyeWheelModifierField;
    lensStrokeColor?: string;
    lensStrokeWidth?: number;
    lensFillColor?: string;
    lensFillAlpha?: number;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface FisheyeFormState {
    options: FisheyeFields;
}

interface FisheyeEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: FisheyeFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link fisheyeFields}.
     */
    fields?: FieldConfig[] | ((values: FisheyeFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: FisheyeFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `FisheyeBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `FisheyeBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function FisheyeEditorPanel({ defaults, fields, onSubmit, submitLabel, }: FisheyeEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the FisheyeBehaviour editor, grouped into
 * accordion sections. Field `name`s match the keys of `FisheyeFields` 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`.
 */
declare const fisheyeFields: FieldConfig[];

/**
 * Map a `FisheyeBehaviourOptions`-shaped patch to the flat {@link FisheyeFields}
 * the `@invana/forms` generator renders: modifiers `null` → `'none'`,
 * `maxRadius: null` (auto) → `0`, colours → hex strings.
 */
declare function optionsToForm$i(o?: FisheyeOptions): FisheyeFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link FisheyeOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
declare function formToOptions$i(f: FisheyeFields): FisheyeOptions;

/**
 * Types for the NodeCentralityBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `NodeCentralityBehaviour` and
 * its options live) is **not** imported for its runtime — canvas-ui mirrors the
 * editable option shape here as {@link NodeCentralityOptions}, a plain serialisable
 * patch the consumer applies via `setOptions`. The mirror is structural, not
 * derived, so keep it in sync with `NodeCentralityBehaviourOptions` by hand.
 */
/** Which incident edges are counted toward a node's degree. */
type NodeCentralityDirection = 'in' | 'out' | 'both';
/** Curve mapping normalized degree (0..1) → a size between min and max. */
type NodeCentralityScale = 'linear' | 'sqrt' | 'log';
/**
 * The subset of `NodeCentralityBehaviourOptions` this editor produces — a
 * serialisable patch. The `sizeFn` callback override and the base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope;
 * only the user-tunable scalars round-trip.
 */
interface NodeCentralityOptions {
    /** Edges counted per node: `'in'`, `'out'`, or `'both'` (default). */
    direction?: NodeCentralityDirection;
    /** Output `style.size` for a degree-0 node. Default `8`. */
    minSize?: number;
    /** Output `style.size` for the max-degree node. Default `32`. */
    maxSize?: number;
    /** Curve applied to normalized degree. Default `'sqrt'`. */
    scale?: NodeCentralityScale;
    /** Numeric edge-`data` field to sum for weighted degree (e.g. `'weight'`). Blank = raw count. */
    weightKey?: string;
    /** Scale the label with the node: labelFontSize = clamp(size × this, …). 0/blank = off. */
    labelScale?: number;
    /** Lower clamp for the scaled label font. Default `8`. */
    labelMinSize?: number;
    /** Upper clamp for the scaled label font. Default `40`. */
    labelMaxSize?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link NodeCentralityOptions} 1:1 — all scalar / enum, no re-encoding needed.
 */
type NodeCentralityFields = NodeCentralityOptions;
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface NodeCentralityFormState {
    options: NodeCentralityFields;
}

interface NodeCentralityEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: NodeCentralityFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link nodeCentralityFields}.
     */
    fields?: FieldConfig[] | ((values: NodeCentralityFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: NodeCentralityFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `NodeCentralityBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `NodeCentralityBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function NodeCentralityEditorPanel({ defaults, fields, onSubmit, submitLabel, }: NodeCentralityEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the NodeCentralityBehaviour editor. Field
 * `name`s match the keys of `NodeCentralityFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`. Static — none of the
 * inputs depend on another field's value.
 */
declare const nodeCentralityFields: FieldConfig[];

/**
 * Map a `NodeCentralityBehaviourOptions`-shaped patch to the flat
 * {@link NodeCentralityFields} the `@invana/forms` generator renders. All fields
 * are scalar / enum, so this is a straight pass-through.
 */
declare function optionsToForm$h(o?: NodeCentralityOptions): NodeCentralityFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link NodeCentralityOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`.
 */
declare function formToOptions$h(f: NodeCentralityFields): NodeCentralityOptions;

/**
 * Types for the content-LOD editors (`NodeLabelLODBehaviour` /
 * `EdgeLabelLODBehaviour` / `IconLODBehaviour` / `ImageLODBehaviour`). They
 * share one option shape — a `{ minZoom, maxZoom }` zoom band, plus the label
 * behaviours' size knobs — so one editor serves all four; each passes its own
 * field schema.
 *
 * Engine-agnostic: `@invana/graph` is not imported; the shape is mirrored here
 * as {@link ContentLODOptions}, a serialisable patch applied via `setOptions`.
 */
/**
 * The serialisable options a content-LOD behaviour takes — a zoom band. The base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope.
 */
interface ContentLODOptions {
    /** Show content at/above this camera scale. Blank = no lower bound. */
    minZoom?: number;
    /** Show content at/below this camera scale. Blank / `null` = no upper bound. */
    maxZoom?: number | null;
    /**
     * Node labels only — keep labels shown for the top fraction of nodes by degree
     * centrality even below the band (e.g. `0.05` = top 5%).
     */
    alwaysShowTop?: number;
    /**
     * Labels only — how on-screen size follows zoom (`1` = with the world,
     * `0.5` = √zoom, `0` = fixed). `null` = leave label size alone.
     */
    zoomGrowth?: number | null;
    /** Labels only — smallest on-screen font size (CSS px). `null` = no floor. */
    minFontPx?: number | null;
    /** Labels only — largest on-screen font size (CSS px). `null` = no cap. */
    maxFontPx?: number | null;
}
/**
 * Flat form-field shape. The `@invana/forms` number field shows an unset value
 * as `0` and emits `0` when cleared, so the form can't say "blank": every field
 * is a plain number here, and the mapping turns a meaningless `0` back into
 * `null` (unset). `zoomGrowth` is the exception — `0` there means "fixed size" —
 * so the label editors carry the form-only {@link ContentLODFields.sizeLabels}
 * switch instead.
 */
interface ContentLODFields {
    minZoom?: number;
    maxZoom?: number;
    alwaysShowTop?: number;
    zoomGrowth?: number;
    minFontPx?: number;
    maxFontPx?: number;
    /**
     * Label editors only, form-only — whether label sizing is on. Off sends
     * `zoomGrowth` / `minFontPx` / `maxFontPx` as `null` (no policy: labels keep
     * the size their host gives them); on sends them as edited.
     */
    sizeLabels?: boolean;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface ContentLODFormState {
    options: ContentLODFields;
}

interface ContentLODEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: ContentLODFields;
    /** Optional heading (e.g. `'Node labels'`, `'Icon'`, `'Image'`) shown above the band. */
    title?: string;
    /** The form schema. Defaults to {@link contentLODFields}. */
    fields?: FieldConfig[];
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, …).
     */
    onSubmit: (values: ContentLODFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for a content-LOD behaviour —
 * a `{ minZoom, maxZoom }` zoom band, plus whatever extra knobs the passed
 * `fields` schema carries. One editor serves `NodeLabelLODBehaviour`
 * (`nodeLabelLODFields`), `EdgeLabelLODBehaviour` (`edgeLabelLODFields`),
 * `IconLODBehaviour` and `ImageLODBehaviour` (`contentLODFields`); the optional
 * `title` distinguishes them in the UI.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. No engine
 * reference, no commit — the `options ⇄ form-fields` mapping (`optionsToForm` /
 * `formToOptions`) is the consumer's plug-in.
 */
declare function ContentLODEditorPanel({ defaults, title, fields, onSubmit, submitLabel, }: ContentLODEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema shared by the content-LOD editors — a single
 * `minZoom` / `maxZoom` band. Field `name`s match `ContentLODFields` 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`.
 */
declare const contentLODFields: FieldConfig[];
/**
 * Schema for the **node-label** LOD editor — the shared band, `alwaysShowTop`
 * (the top-centrality exemption) and the label-size knobs. Pass this as
 * `fields` to {@link ContentLODEditorPanel} when editing a `NodeLabelLODBehaviour`.
 */
declare const nodeLabelLODFields: FieldConfig[];
/**
 * Schema for the **edge-label** LOD editor — the shared band and the
 * label-size knobs. Pass this as `fields` to {@link ContentLODEditorPanel} when
 * editing an `EdgeLabelLODBehaviour`.
 */
declare const edgeLabelLODFields: FieldConfig[];

/**
 * Map a content-LOD options patch to the flat {@link ContentLODFields} the
 * `@invana/forms` generator renders. `null` (unset) shows as blank.
 */
declare function optionsToForm$g(o?: ContentLODOptions): ContentLODFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ContentLODOptions} patch. Fields the form never set are omitted, so the
 * result is safe to spread over the behaviour's current options on `setOptions`.
 * A cleared `maxZoom` arrives as `0` and is sent as `null` (no upper bound) —
 * `0` would hide the content at every zoom.
 */
declare function formToOptions$g(f: ContentLODFields): ContentLODOptions;
/**
 * {@link optionsToForm} for the **label** LOD editors (`NodeLabelLODBehaviour` /
 * `EdgeLabelLODBehaviour`): adds the size fields and derives the form-only
 * `sizeLabels` switch — on when any size option is set.
 */
declare function labelLodOptionsToForm(o?: ContentLODOptions): ContentLODFields;
/**
 * Inverse of {@link labelLodOptionsToForm}. With `sizeLabels` off the three size
 * options go out as `null` — the behaviour pushes no policy and labels keep their
 * natural size. With it on they pass through, `zoomGrowth: 0` meaning a fixed
 * on-screen size, and a cleared (`0`) font bound becoming `null` (no floor / cap).
 */
declare function labelLodFormToOptions(f: ContentLODFields): ContentLODOptions;

/**
 * Types for the EdgeLODBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `EdgeLODBehaviour`) is not imported
 * for its runtime — the editable option shape is mirrored here as
 * {@link EdgeLODOptions}, a serialisable patch applied via `setOptions`. Keep it
 * in sync with `EdgeLODBehaviourOptions` by hand.
 */
/** How the kept (never-thinned) edges are chosen (mirrors the engine enum). */
type EdgeLODKeepBy = 'sample' | 'weight' | 'degree';
/**
 * The subset of `EdgeLODBehaviourOptions` this editor produces. The base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope.
 */
interface EdgeLODOptions {
    /** Thin edges when `camera.scale` is below this. Default `0.5`. */
    minZoom?: number;
    /** Fraction of edges kept visible when thinned, in `(0, 1]`. Default `0.1`. */
    keepFraction?: number;
    /** Which edges survive: stable `'sample'`, highest `'weight'`, or `'degree'` backbone. */
    keepBy?: EdgeLODKeepBy;
    /** Numeric edge-`data` field used when `keepBy: 'weight'`. */
    weightKey?: string;
}
/** Flat form-field shape — matches {@link EdgeLODOptions} 1:1. */
type EdgeLODFields = EdgeLODOptions;
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface EdgeLODFormState {
    options: EdgeLODFields;
}

interface EdgeLODEditorPanelProps {
    /** Initial field values (seed with `optionsToForm`). Remount via `key` to reload. */
    defaults?: EdgeLODFields;
    /** The form schema. Defaults to {@link edgeLODFields}. */
    fields?: FieldConfig[];
    /** Called with the current values on submit; map back with `formToOptions`. */
    onSubmit: (values: EdgeLODFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `EdgeLODBehaviour` (thin
 * edges below a zoom threshold). Owns a react-hook-form instance seeded by
 * `defaults`, renders the schema, and hands values to `onSubmit`. No engine
 * reference, no commit — the `options ⇄ form-fields` mapping is the consumer's.
 */
declare function EdgeLODEditorPanel({ defaults, fields, onSubmit, submitLabel, }: EdgeLODEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the EdgeLODBehaviour editor. Field `name`s
 * match `EdgeLODFields` 1:1 so the generator's `options.<name>` paths line up
 * with `mapping.ts`.
 */
declare const edgeLODFields: FieldConfig[];

/**
 * Map an `EdgeLODBehaviourOptions`-shaped patch to the flat {@link EdgeLODFields}
 * the `@invana/forms` generator renders — a straight pass-through.
 */
declare function optionsToForm$f(o?: EdgeLODOptions): EdgeLODFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link EdgeLODOptions} patch, omitting unset keys so it's safe to spread over
 * the behaviour's current options on `setOptions`.
 */
declare function formToOptions$f(f: EdgeLODFields): EdgeLODOptions;

/**
 * Types for the ParallelEdgeBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `ParallelEdgeBehaviour` and its
 * options) is **not** imported for its runtime — the editable option shape is
 * mirrored here as {@link ParallelEdgeOptions}, a serialisable patch the
 * consumer applies via `setOptions`. Keep it in sync with
 * `ParallelEdgeBehaviourOptions` by hand.
 */
/**
 * Axis along which a group of parallel edges spreads.
 *
 * - `'auto'` — derive per edge from its `pathType`.
 * - `'perpendicular'` — offset perpendicular to the source→target chord.
 * - `'axis-aligned'` — offset along the non-dominant axis.
 */
type ParallelEdgeBasis = 'auto' | 'perpendicular' | 'axis-aligned';
/**
 * The subset of `ParallelEdgeBehaviourOptions` this editor produces — a
 * serialisable patch. The `groupBy` / `distribute` callbacks and the base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope;
 * only the user-tunable scalars round-trip.
 */
interface ParallelEdgeOptions {
    /** Spacing between adjacent ranks in world units. Default `12`. */
    spacing?: number;
    /** Basis used to translate a rank into a fan direction. Default `'auto'`. */
    basis?: ParallelEdgeBasis;
    /**
     * When `true`, port-anchored edges also fan their endpoints along the host
     * face; when `false`, only waypoints are written. Default `true`.
     */
    anchorOffset?: boolean;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link ParallelEdgeOptions} 1:1 — all scalar / enum / boolean.
 */
type ParallelEdgeFields = ParallelEdgeOptions;
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface ParallelEdgeFormState {
    options: ParallelEdgeFields;
}

interface ParallelEdgeEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: ParallelEdgeFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link parallelEdgeFields}.
     */
    fields?: FieldConfig[] | ((values: ParallelEdgeFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: ParallelEdgeFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `ParallelEdgeBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `ParallelEdgeBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function ParallelEdgeEditorPanel({ defaults, fields, onSubmit, submitLabel, }: ParallelEdgeEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the ParallelEdgeBehaviour editor. Field
 * `name`s match the keys of `ParallelEdgeFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`. Static — no field depends
 * on another's value.
 */
declare const parallelEdgeFields: FieldConfig[];

/**
 * Map a `ParallelEdgeBehaviourOptions`-shaped patch to the flat
 * {@link ParallelEdgeFields} the `@invana/forms` generator renders. All fields
 * are scalar / enum / boolean, so this is a straight pass-through.
 */
declare function optionsToForm$e(o?: ParallelEdgeOptions): ParallelEdgeFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ParallelEdgeOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`.
 */
declare function formToOptions$e(f: ParallelEdgeFields): ParallelEdgeOptions;

/**
 * Types for the TextResolutionLODBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `TextResolutionLODBehaviour` and
 * its options) is **not** imported for its runtime — the editable option shape
 * is mirrored here as {@link TextResolutionLODOptions}, a serialisable patch
 * the consumer applies via `setOptions`. Keep it in sync with
 * `TextResolutionLODBehaviourOptions` by hand.
 */
/**
 * The subset of `TextResolutionLODBehaviourOptions` this editor produces — a
 * serialisable patch. Only the scalar knobs round-trip.
 *
 * **`levels[]` is omitted on purpose.** The discrete `{ minZoom, multiplier }`
 * tier array is structural (an array of objects) and has no `FieldType` in the
 * form generator — it stays out of the form and is left untouched on
 * `setOptions`. The base `id` / `targetLayerId` / `enabled` / `shortcuts` are
 * likewise out of scope.
 */
interface TextResolutionLODOptions {
    /**
     * Base resolution multiplied by the active tier's multiplier. Default
     * `window.devicePixelRatio`.
     */
    baseResolution?: number;
    /**
     * Hysteresis applied to downward tier changes — prevents flicker at a tier
     * boundary. Default `0.1`.
     */
    hysteresis?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link TextResolutionLODOptions} 1:1 — both fields are numbers.
 */
type TextResolutionLODFields = TextResolutionLODOptions;
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface TextResolutionLODFormState {
    options: TextResolutionLODFields;
}

interface TextResolutionLODEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: TextResolutionLODFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link textResolutionLodFields}.
     */
    fields?: FieldConfig[] | ((values: TextResolutionLODFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: TextResolutionLODFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `TextResolutionLODBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `TextResolutionLODBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function TextResolutionLODEditorPanel({ defaults, fields, onSubmit, submitLabel, }: TextResolutionLODEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the TextResolutionLODBehaviour editor.
 * Field `name`s match the keys of `TextResolutionLODFields` 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`.
 *
 * The discrete `levels[]` tier array is intentionally not represented here —
 * it's a structural array with no `FieldType`, so it's edited elsewhere and
 * left untouched by this form.
 */
declare const textResolutionLodFields: FieldConfig[];

/**
 * Map a `TextResolutionLODBehaviourOptions`-shaped patch to the flat
 * {@link TextResolutionLODFields} the `@invana/forms` generator renders. Both
 * fields are numbers, so this is a straight pass-through. `levels[]` is dropped
 * (not modelled in the form).
 */
declare function optionsToForm$d(o?: TextResolutionLODOptions): TextResolutionLODFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link TextResolutionLODOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions` — leaving `levels[]` untouched.
 */
declare function formToOptions$d(f: TextResolutionLODFields): TextResolutionLODOptions;

/**
 * Types for the NodeScaleLODBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `NodeScaleLODBehaviour` and its
 * options) is **not** imported for its runtime — the editable option shape is
 * mirrored here as {@link NodeScaleLODOptions}, a serialisable patch the
 * consumer applies via `setOptions`. Keep it in sync with
 * `NodeScaleLODBehaviourOptions` (and its `ElementScaleLODBehaviourOptions` base)
 * by hand.
 */
/**
 * The subset of `NodeScaleLODBehaviourOptions` this editor produces — a
 * serialisable patch. Only the base `ElementScaleLODBehaviourOptions` scalars
 * (`scaleEpsilon`, `settleMs`) round-trip.
 *
 * **`layers[]` is omitted on purpose.** The per-`GraphLayer` config array
 * (`{ targetLayerId, sizePx, strokeWidthPx }[]`, each entry potentially a
 * getter) is structural and identity-bearing, with no `FieldType` in the form
 * generator — it stays out of the form and is left untouched on `setOptions`.
 */
interface NodeScaleLODOptions {
    /**
     * Skip the per-frame apply when the relative scale change is below this
     * threshold. Default `0.005` (0.5%).
     */
    scaleEpsilon?: number;
    /**
     * When `> 0`, debounce the apply to a trailing edge `settleMs` after zoom
     * silence instead of running per RAF frame. Default `0`.
     */
    settleMs?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link NodeScaleLODOptions} 1:1 — both fields are numbers.
 */
type NodeScaleLODFields = NodeScaleLODOptions;
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface NodeScaleLODFormState {
    options: NodeScaleLODFields;
}

interface NodeScaleLODEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: NodeScaleLODFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link nodeScaleLodFields}.
     */
    fields?: FieldConfig[] | ((values: NodeScaleLODFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: NodeScaleLODFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `NodeScaleLODBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `NodeScaleLODBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function NodeScaleLODEditorPanel({ defaults, fields, onSubmit, submitLabel, }: NodeScaleLODEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the NodeScaleLODBehaviour editor. Field
 * `name`s match the keys of `NodeScaleLODFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 *
 * The per-layer `layers[]` config array (target layer + `sizePx` /
 * `strokeWidthPx`) is intentionally not represented — it's a structural,
 * identity-bearing array with no `FieldType`, edited elsewhere and left
 * untouched by this form.
 */
declare const nodeScaleLodFields: FieldConfig[];

/**
 * Map a `NodeScaleLODBehaviourOptions`-shaped patch to the flat
 * {@link NodeScaleLODFields} the `@invana/forms` generator renders. Both fields
 * are numbers, so this is a straight pass-through. `layers[]` is dropped (not
 * modelled in the form).
 */
declare function optionsToForm$c(o?: NodeScaleLODOptions): NodeScaleLODFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link NodeScaleLODOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions` — leaving `layers[]` untouched.
 */
declare function formToOptions$c(f: NodeScaleLODFields): NodeScaleLODOptions;

/**
 * Types for the EdgeScaleLODBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `EdgeScaleLODBehaviour` and its
 * options) is **not** imported for its runtime — the editable option shape is
 * mirrored here as {@link EdgeScaleLODOptions}, a serialisable patch the
 * consumer applies via `setOptions`. Keep it in sync with
 * `EdgeScaleLODBehaviourOptions` (and its `ElementScaleLODBehaviourOptions` base)
 * by hand.
 */
/**
 * The subset of `EdgeScaleLODBehaviourOptions` this editor produces — a
 * serialisable patch. Only the base `ElementScaleLODBehaviourOptions` scalars
 * (`scaleEpsilon`, `settleMs`) round-trip.
 *
 * **`layers[]` is omitted on purpose.** The per-`GraphLayer` config array
 * (`{ targetLayerId, strokeWidthPx }[]`, each entry potentially a getter) is
 * structural and identity-bearing, with no `FieldType` in the form generator —
 * it stays out of the form and is left untouched on `setOptions`.
 */
interface EdgeScaleLODOptions {
    /**
     * Skip the per-frame apply when the relative scale change is below this
     * threshold. Default `0.005` (0.5%).
     */
    scaleEpsilon?: number;
    /**
     * When `> 0`, debounce the apply to a trailing edge `settleMs` after zoom
     * silence instead of running per RAF frame. Default `80` for this behaviour.
     */
    settleMs?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link EdgeScaleLODOptions} 1:1 — both fields are numbers.
 */
type EdgeScaleLODFields = EdgeScaleLODOptions;
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface EdgeScaleLODFormState {
    options: EdgeScaleLODFields;
}

interface EdgeScaleLODEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: EdgeScaleLODFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link edgeScaleLodFields}.
     */
    fields?: FieldConfig[] | ((values: EdgeScaleLODFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: EdgeScaleLODFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `EdgeScaleLODBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `EdgeScaleLODBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function EdgeScaleLODEditorPanel({ defaults, fields, onSubmit, submitLabel, }: EdgeScaleLODEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the EdgeScaleLODBehaviour editor. Field
 * `name`s match the keys of `EdgeScaleLODFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 *
 * The per-layer `layers[]` config array (target layer + `strokeWidthPx`) is
 * intentionally not represented — it's a structural, identity-bearing array
 * with no `FieldType`, edited elsewhere and left untouched by this form.
 */
declare const edgeScaleLodFields: FieldConfig[];

/**
 * Map an `EdgeScaleLODBehaviourOptions`-shaped patch to the flat
 * {@link EdgeScaleLODFields} the `@invana/forms` generator renders. Both fields
 * are numbers, so this is a straight pass-through. `layers[]` is dropped (not
 * modelled in the form).
 */
declare function optionsToForm$b(o?: EdgeScaleLODOptions): EdgeScaleLODFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link EdgeScaleLODOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions` — leaving `layers[]` untouched.
 */
declare function formToOptions$b(f: EdgeScaleLODFields): EdgeScaleLODOptions;

/**
 * Types for the LabelCollisionBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `LabelCollisionBehaviour` and its
 * options) is **not** imported for its runtime — the editable option shape is
 * mirrored here as {@link LabelCollisionOptions}, a serialisable patch the
 * consumer applies via `setOptions`. Keep it in sync with
 * `LabelCollisionBehaviourOptions` by hand.
 */
/** What the behaviour does with an overlap. `'hide'` is the only strategy in v0. */
type LabelCollisionStrategy = 'hide';
/**
 * How label priority is resolved when sorting. The engine also accepts a
 * `(kind, id) => number` callback, which is out of scope for the form — only
 * the two string modes round-trip.
 */
type LabelPriorityMode = 'priority-field' | 'node-degree';
/**
 * The subset of `LabelCollisionBehaviourOptions` this editor produces — a
 * serialisable patch. The `prioritise` callback form and the base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope. The
 * engine's nested `groups: { nodes?, edges? }` is flattened to
 * `groupNodes` / `groupEdges` for the form and re-nested on the way out
 * (see `mapping.ts`).
 */
interface LabelCollisionOptions {
    /** Overlap resolution strategy. Default `'hide'`. */
    strategy?: LabelCollisionStrategy;
    /** How priority is resolved when sorting. Default `'priority-field'`. */
    prioritise?: LabelPriorityMode;
    /** Minimum ms a just-flipped label holds before it can flip back. Default `100`. */
    flickerGuardMs?: number;
    /** Collision group name assigned to node labels. Default `'nodes'`. */
    groups?: {
        nodes?: string;
        edges?: string;
    };
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * nested `groups` object is split into two flat text fields (`groupNodes` /
 * `groupEdges`) — a single field can't edit a nested object (see `mapping.ts`).
 */
interface LabelCollisionFields {
    strategy?: LabelCollisionStrategy;
    prioritise?: LabelPriorityMode;
    flickerGuardMs?: number;
    /** Flattened `groups.nodes`. */
    groupNodes?: string;
    /** Flattened `groups.edges`. */
    groupEdges?: string;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface LabelCollisionFormState {
    options: LabelCollisionFields;
}

interface LabelCollisionEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: LabelCollisionFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link labelCollisionFields}.
     */
    fields?: FieldConfig[] | ((values: LabelCollisionFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
     * undo stack, …). The component does none of that.
     */
    onSubmit: (values: LabelCollisionFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `LabelCollisionBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `LabelCollisionBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function LabelCollisionEditorPanel({ defaults, fields, onSubmit, submitLabel, }: LabelCollisionEditorPanelProps): react.JSX.Element;

/**
 * `@invana/forms` field schema for the LabelCollisionBehaviour editor. Field
 * `name`s match the keys of `LabelCollisionFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`. The nested engine `groups`
 * object is edited as two flat text fields here.
 */
declare const labelCollisionFields: FieldConfig[];

/**
 * Map a `LabelCollisionBehaviourOptions`-shaped patch to the flat
 * {@link LabelCollisionFields} the `@invana/forms` generator renders. The
 * nested `groups: { nodes, edges }` object is flattened to `groupNodes` /
 * `groupEdges`; everything else passes through.
 */
declare function optionsToForm$a(o?: LabelCollisionOptions): LabelCollisionFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link LabelCollisionOptions} patch. Only fields the form actually set are
 * included (no `undefined` / empty-string keys), so the result is safe to spread
 * over the behaviour's current options on `setOptions`. The nested `groups`
 * object is reassembled only when at least one side is set.
 */
declare function formToOptions$a(f: LabelCollisionFields): LabelCollisionOptions;

/**
 * Types for the MiniMapLayer editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `MiniMapLayer` and its options) is
 * **not** imported for its runtime — the editable option shape is mirrored here
 * as {@link MiniMapLayerOptions}, a serialisable patch the consumer applies via
 * `setOptions`. Keep it in sync with the engine `MiniMapLayerOptions` by hand.
 *
 * The engine encodes each chrome colour as `MiniMapColor = number (0xRRGGBB) |
 * { light, dark }`. This editor edits the scalar form only: `number` seeds
 * round-trip through `#rrggbb`; a `{ light, dark }` pair is out of scope and is
 * left untouched (see `mapping.ts`).
 */
/** Anchor corner inside the canvas viewport. */
type MiniMapPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/** How `{ light, dark }` colour variants resolve. */
type MiniMapMode = 'auto' | 'light' | 'dark';
/**
 * The subset of `MiniMapLayerOptions` this editor produces — a serialisable
 * patch. The identity field `graphLayerId` and the cross-layer reference
 * `backgroundLayerId` are out of scope (not user-tunable state). Colours are
 * emitted as hex strings; `margin` is emitted as a scalar number (the engine's
 * `{ x, y }` object form is out of scope and round-trips untouched).
 */
interface MiniMapLayerOptions {
    /** Minimap width in screen px. Default `200`. */
    width?: number;
    /** Minimap height in screen px. Default `150`. */
    height?: number;
    /** Background fill as `0xRRGGBB`. Default `0x1a1a2e`. */
    backgroundColor?: number;
    /** Border colour as `0xRRGGBB`. Default `0x444444`. */
    borderColor?: number;
    /** Border stroke width. Default `1`. */
    borderWidth?: number;
    /** Viewport indicator fill as `0xRRGGBB`. Default `0x4a90d9`. */
    viewportFill?: number;
    /** Viewport indicator stroke as `0xRRGGBB`. Default `0x2a70b9`. */
    viewportStroke?: number;
    /** Viewport indicator fill alpha 0–1. Default `0.3`. */
    viewportFillAlpha?: number;
    /** Viewport indicator stroke width. Default `2`. */
    viewportStrokeWidth?: number;
    /** Dim everything *outside* the viewport rectangle with a translucent overlay,
     *  spotlighting the visible region. Default `true`. */
    maskEnabled?: boolean;
    /** Out-of-viewport mask overlay colour as `0xRRGGBB`. Default `0x000000`. */
    maskColor?: number;
    /** Out-of-viewport mask alpha 0–1. Default `0.5`. */
    maskAlpha?: number;
    /** World-space padding around node bounds. Default `20`. */
    padding?: number;
    /** Whether dragging the minimap pans the main camera. Default `true`. */
    enableDrag?: boolean;
    /** Anchor corner. Default `'bottom-right'`. */
    position?: MiniMapPosition;
    /** How `{ light, dark }` colour variants resolve. Default `'auto'`. */
    mode?: MiniMapMode;
    /** Symmetric inset from the chosen corner, in screen px. Default `10`. */
    margin?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Identical to
 * {@link MiniMapLayerOptions} except the chrome / mask colours are `#rrggbb`
 * strings (what the colour swatch emits); `mapping.ts` bridges them to/from the
 * engine's `0xRRGGBB` numbers.
 */
interface MiniMapLayerFields extends Omit<MiniMapLayerOptions, 'backgroundColor' | 'borderColor' | 'viewportFill' | 'viewportStroke' | 'maskColor'> {
    /** Background fill as `#rrggbb`. */
    backgroundColor?: string;
    /** Border colour as `#rrggbb`. */
    borderColor?: string;
    /** Viewport indicator fill as `#rrggbb`. */
    viewportFill?: string;
    /** Viewport indicator stroke as `#rrggbb`. */
    viewportStroke?: string;
    /** Out-of-viewport mask overlay colour as `#rrggbb`. */
    maskColor?: string;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface MiniMapLayerFormState {
    options: MiniMapLayerFields;
}

interface MiniMapLayerEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * layer's options with the exported `optionsToForm`. Remount (via `key`) to
     * reload.
     */
    defaults?: MiniMapLayerFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link miniMapLayerFields}.
     */
    fields?: FieldConfig[] | ((values: MiniMapLayerFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`layer.setOptions`, an undo
     * stack, …). The component does none of that.
     */
    onSubmit: (values: MiniMapLayerFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `MiniMapLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `MiniMapLayerOptions ⇄ form-fields`
 * mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function MiniMapLayerEditorPanel({ defaults, fields, onSubmit, submitLabel, }: MiniMapLayerEditorPanelProps): react.JSX.Element;

/**
 * The full MiniMapLayer field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<MiniMapLayerEditorPanel>`. Static — no field depends on another's
 * value.
 */
declare const miniMapLayerFields: FieldConfig[];

/**
 * Map a `MiniMapLayerOptions`-shaped patch to the flat {@link MiniMapLayerFields}
 * the `@invana/forms` generator renders. Colours are normalised to hex strings;
 * `margin` to a scalar number; everything else passes through.
 */
declare function optionsToForm$9(o?: MiniMapLayerOptions): MiniMapLayerFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link MiniMapLayerOptions} patch. Only fields the form actually set are
 * included (no `undefined` / empty-string keys), so the result is safe to spread
 * over the layer's current options on `setOptions`. Colour hex strings are
 * converted back to the engine's `0xRRGGBB` numbers.
 */
declare function formToOptions$9(f: MiniMapLayerFields): MiniMapLayerOptions;

/**
 * Types for the GraphLegendLayer editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `GraphLegendLayer` and its options) is
 * **not** imported for its runtime — the editable option shape is mirrored here
 * as {@link GraphLegendLayerOptions}, a serialisable patch the consumer applies via
 * `setOptions`. Keep it in sync with the engine `GraphLegendLayerOptions` by hand.
 *
 * Two engine encodings are deliberately narrowed:
 *
 * - Each chrome colour is `GraphLegendColor = string (CSS) | { light, dark }`. This
 *   editor edits the **scalar CSS string** only; a `{ light, dark }` pair is out
 *   of scope and round-trips untouched (see `mapping.ts`). Colours stay strings
 *   end-to-end — the overlay is DOM, so there is no `0xRRGGBB` conversion.
 * - `margin: number | { x?, y? }` is surfaced as the `marginX` / `marginY` pair,
 *   re-fused on the way out.
 *
 * Out of scope entirely (wiring, not tunable state): `graphLayerId`, the
 * `nodeTypeOf` / `edgeTypeOf` accessors (functions), the `nodeTypes` /
 * `edgeTypes` allow-lists, and the `colors` per-type override map.
 */
/** Anchor corner inside the canvas viewport. */
type GraphLegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/** How `{ light, dark }` colour variants resolve. */
type GraphLegendMode = 'auto' | 'light' | 'dark';
/** How the per-type count is rendered. */
type GraphLegendCountMode = 'both' | 'visible' | 'total';
/** Row ordering within each section. */
type GraphLegendSort = 'count-desc' | 'name-asc' | 'insertion';
/**
 * The subset of `GraphLegendLayerOptions` this editor produces — a serialisable patch.
 */
interface GraphLegendLayerOptions {
    /** Panel heading. `false` (or an empty string) hides it. Default `'Legend'`. */
    title?: string | false;
    /** Include the node-type section. Default `true`. */
    showNodes?: boolean;
    /** Include the edge-type section. Default `true`. */
    showEdges?: boolean;
    /** Node-section heading. `false` / empty hides it. Default `'Nodes'`. */
    nodesTitle?: string | false;
    /** Edge-section heading. `false` / empty hides it. Default `'Edges'`. */
    edgesTitle?: string | false;
    /** Show the per-type counts. Default `true`. */
    showCounts?: boolean;
    /** How the count is rendered. Default `'both'` (`visible / total`). */
    countMode?: GraphLegendCountMode;
    /** Row ordering within each section. Default `'count-desc'`. */
    sort?: GraphLegendSort;
    /** Cap on rows per section; the remainder collapses to `+N more`. `0` = no cap. Default `12`. */
    maxRows?: number;
    /** Drop rows whose visible count is `0`. Default `false`. */
    hideEmpty?: boolean;
    /** Swatch colour for a type with no resolvable colour, as `0xRRGGBB`. Default `0x9ca3af`. */
    fallbackColor?: number;
    /**
     * Make rows clickable, toggling that type's visibility in the graph (a
     * toggled-off row renders struck through and muted). Default `false`.
     */
    toggleOnClick?: boolean;
    /** Row opacity when its type is toggled off. Default `0.45`. */
    hiddenTypeOpacity?: number;
    /** Anchor corner. Default `'top-left'`. */
    position?: GraphLegendPosition;
    /** Inset from the chosen corner in screen px — uniform or per-axis. Default `10`. */
    margin?: number | {
        x?: number;
        y?: number;
    };
    /** Text size in px. Default `11`. */
    fontSize?: number;
    /** Panel opacity 0–1. Default `0.95`. */
    opacity?: number;
    /** Node swatch diameter in px (the edge swatch derives its length from it). Default `10`. */
    swatchSize?: number;
    /** Panel background as a CSS colour (may be `rgba(...)`). */
    backgroundColor?: string;
    /** Row text colour as a CSS colour. */
    textColor?: string;
    /** Section-heading + count colour as a CSS colour. */
    mutedColor?: string;
    /** Panel border colour as a CSS colour (may be `rgba(...)`). */
    borderColor?: string;
    /** Panel corner radius in px. Default `6`. */
    borderRadius?: number;
    /** How `{ light, dark }` colours resolve. Default `'auto'`. */
    mode?: GraphLegendMode;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Identical to
 * {@link GraphLegendLayerOptions} except: the engine's `margin: number | { x?, y? }`
 * union is split into two scalar fields (a single field can't be both),
 * `fallbackColor` becomes a `#rrggbb` string (what the colour swatch emits), and
 * the three headings are plain strings — a text input expresses "no heading" as
 * `''`, never `false`.
 */
interface GraphLegendLayerFields extends Omit<GraphLegendLayerOptions, 'margin' | 'fallbackColor' | 'title' | 'nodesTitle' | 'edgesTitle'> {
    /** Panel heading; `''` for none. */
    title?: string;
    /** Node-section heading; `''` for none. */
    nodesTitle?: string;
    /** Edge-section heading; `''` for none. */
    edgesTitle?: string;
    /** Horizontal inset in px. Maps into `margin`. */
    marginX?: number;
    /** Vertical inset in px. Maps into `margin`. */
    marginY?: number;
    /** Fallback swatch colour as `#rrggbb`. */
    fallbackColor?: string;
}
/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
interface GraphLegendLayerFormState {
    options: GraphLegendLayerFields;
}

interface GraphLegendLayerEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * layer's options with the exported `optionsToForm`. Remount (via `key`) to
     * reload.
     */
    defaults?: GraphLegendLayerFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link graphLegendLayerFields}.
     */
    fields?: FieldConfig[] | ((values: GraphLegendLayerFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`layer.setOptions`, an undo
     * stack, …). The component does none of that.
     */
    onSubmit: (values: GraphLegendLayerFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `GraphLegendLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `GraphLegendLayerOptions ⇄ form-fields`
 * mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function GraphLegendLayerEditorPanel({ defaults, fields, onSubmit, submitLabel, }: GraphLegendLayerEditorPanelProps): react.JSX.Element;

/**
 * The full GraphLegendLayer field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<GraphLegendLayerEditorPanel>`. Static — no field depends on
 * another's value.
 */
declare const graphLegendLayerFields: FieldConfig[];

/**
 * Map a `GraphLegendLayerOptions`-shaped patch to the flat {@link GraphLegendLayerFields}
 * the `@invana/forms` generator renders. The engine's `margin: number | { x, y }`
 * union is split into `marginX` / `marginY`; chrome colours are CSS strings on
 * the engine (the overlay is DOM) so they pass through unchanged; only
 * `fallbackColor` — a graph-swatch colour, `0xRRGGBB` on the engine — converts
 * to `#rrggbb`.
 */
declare function optionsToForm$8(o?: GraphLegendLayerOptions): GraphLegendLayerFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link GraphLegendLayerOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * layer's current options on `setOptions`. `margin` is re-fused from `marginX` /
 * `marginY` — a plain number when both agree, otherwise a `{ x, y }` object.
 *
 * The three title fields are the one place an **empty string is meaningful**
 * (it's how the form says "no heading", which the engine reads as falsy), so
 * they are emitted even when blank.
 */
declare function formToOptions$8(f: GraphLegendLayerFields): GraphLegendLayerOptions;

/**
 * Types for the D3ForceLayout editor.
 *
 * Engine-agnostic: `@invana/graph-layout-d3-force` (home of `D3ForceLayout` and
 * its options) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link D3ForceLayoutOptions}, a serialisable patch the consumer applies (a
 * layout re-run / `setOptions`). Keep it in sync with `D3ForceLayoutOptions` by
 * hand.
 */
/**
 * The subset of `D3ForceLayoutOptions` this editor produces — a serialisable
 * patch. The forces d3-force nests under `link` / `charge` / `center` /
 * `collide` are kept nested here (the editor flattens them into prefixed scalar
 * fields, see {@link D3ForceLayoutFields}). Function options (`collide.radius`
 * as a function, `workerFactory`), the `x` / `y` / `radial` positioning forces,
 * and registry wiring (`id` / `targetLayerId`) are out of scope; the tunable
 * scalars round-trip.
 */
interface D3ForceLayoutOptions {
    /** Write positions every tick (live animation) vs. flush once on settle. */
    animate?: boolean;
    /** Reheat alpha for incremental streaming adds (only with `animate: false`). */
    reheatAlpha?: number;
    /** `simulation.alpha(alpha)`. */
    alpha?: number;
    /** `simulation.alphaMin(min)`. */
    alphaMin?: number;
    /** `simulation.alphaDecay(decay)`. */
    alphaDecay?: number;
    /** `simulation.alphaTarget(target)`. */
    alphaTarget?: number;
    /** `simulation.velocityDecay(decay)`. */
    velocityDecay?: number;
    /** `forceLink` — pulls connected nodes toward a target distance. */
    link?: {
        distance?: number;
        strength?: number;
        iterations?: number;
    };
    /** `forceManyBody` — n-body charge (negative = repulsion). */
    charge?: {
        strength?: number;
        theta?: number;
        distanceMin?: number;
        distanceMax?: number;
    };
    /** `forceCenter` — translates the cluster's centroid to `(x, y)`. */
    center?: {
        x?: number;
        y?: number;
        strength?: number;
    };
    /** `forceCollide` — prevents overlap. Only the constant `radius` is editable. */
    collide?: {
        radius?: number;
        strength?: number;
        iterations?: number;
    };
    /** Group-clustering pull — keeps `parentId` group members together. */
    cluster?: {
        strength?: number;
    };
    /** Group-frame separation — pushes overlapping group frames apart. */
    separateGroups?: {
        strength?: number;
        padding?: number;
    };
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Each nested
 * force group is flattened into prefixed scalar fields (`linkDistance`,
 * `chargeStrength`, `centerX`, `collideRadius`, …); `mapping.ts` reassembles
 * the nested groups.
 */
interface D3ForceLayoutFields {
    animate?: boolean;
    reheatAlpha?: number;
    alpha?: number;
    alphaMin?: number;
    alphaDecay?: number;
    alphaTarget?: number;
    velocityDecay?: number;
    linkDistance?: number;
    linkStrength?: number;
    linkIterations?: number;
    chargeStrength?: number;
    chargeTheta?: number;
    chargeDistanceMin?: number;
    chargeDistanceMax?: number;
    centerX?: number;
    centerY?: number;
    centerStrength?: number;
    collideRadius?: number;
    collideStrength?: number;
    collideIterations?: number;
    clusterStrength?: number;
    separateGroups?: boolean;
    separateGroupsStrength?: number;
    separateGroupsPadding?: number;
}
/** react-hook-form state — leaves register under `options.<field>`. */
interface D3ForceLayoutFormState {
    options: D3ForceLayoutFields;
}

interface D3ForceLayoutEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * layout's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: D3ForceLayoutFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link d3ForceLayoutFields}.
     */
    fields?: FieldConfig[] | ((values: D3ForceLayoutFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`layout.setOptions`, a layout
     * re-run, an undo stack, …). The component does none of that.
     */
    onSubmit: (values: D3ForceLayoutFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `D3ForceLayout`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `D3ForceLayoutOptions ⇄ form-fields`
 * mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function D3ForceLayoutEditorPanel({ defaults, fields, onSubmit, submitLabel, }: D3ForceLayoutEditorPanelProps): react.JSX.Element;

/**
 * The full D3ForceLayout field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<D3ForceLayoutEditorPanel>`.
 */
declare const d3ForceLayoutFields: FieldConfig[];

/**
 * Map a `D3ForceLayoutOptions`-shaped patch to the flat
 * {@link D3ForceLayoutFields}. The nested force groups (`link` / `charge` /
 * `center` / `collide`) are read out into prefixed scalar fields;
 * `collide.radius` is only surfaced when it's a constant (function radii are
 * out of scope).
 */
declare function optionsToForm$7(o?: D3ForceLayoutOptions): D3ForceLayoutFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link D3ForceLayoutOptions} patch. Only fields the form set are included, and
 * each nested force group is reassembled only when at least one of its members
 * is set — so the result is safe to spread over the layout's current options.
 */
declare function formToOptions$7(f: D3ForceLayoutFields): D3ForceLayoutOptions;

/**
 * Types for the ElkLayout editor.
 *
 * Engine-agnostic: `@invana/graph-layout-elkjs` (home of `ElkLayout` and its
 * options) is **not** imported — canvas-ui may only use `@invana/graph` types
 * (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link ElkLayoutOptions}, a serialisable patch the consumer applies (a layout
 * re-run / `setOptions`). Keep the enums / fields in sync by hand.
 */
/**
 * Built-in ELK algorithm names. Mirrors the layout's `ElkAlgorithmName` (minus
 * the open `string` fallback — the select only offers the shipped algorithms).
 */
type ElkAlgorithm = 'layered' | 'mrtree' | 'radial' | 'force' | 'stress' | 'disco' | 'box' | 'rectpacking' | 'random' | 'fixed';
/** Direction of the primary layout axis. Mapped to `elk.direction`. */
type ElkDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
/** Edge-routing strategy. Mapped to `elk.edgeRouting`. */
type ElkEdgeRouting = 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES';
/**
 * The subset of `ElkLayoutOptions` this editor produces — a serialisable patch.
 * `padding` is modelled as a single symmetric number (the per-side object form
 * is out of scope); `defaultNodeSize` is flattened into `defaultNodeWidth` /
 * `defaultNodeHeight`. Function options (`nodeSize`, `workerFactory`), the
 * free-form `layoutOptions` bag, and registry wiring (`id` / `targetLayerId`)
 * are out of scope; the tunable scalars round-trip. `transition` /
 * `transitionEase` come from the shared one-shot layout base.
 */
interface ElkLayoutOptions {
    algorithm?: ElkAlgorithm;
    direction?: ElkDirection;
    nodeSpacing?: number;
    layerSpacing?: number;
    edgeNodeSpacing?: number;
    edgeSpacing?: number;
    edgeRouting?: ElkEdgeRouting;
    /** `elk.padding` — symmetric graph padding (per-side object form omitted). */
    padding?: number;
    defaultNodeSize?: {
        width?: number;
        height?: number;
    };
    /** Lay out `parentId` groups as nested containers (compound layout). */
    includeGroups?: boolean;
    transition?: boolean;
    transitionEase?: string;
}
/**
 * Flat form-field shape. `defaultNodeSize: { width, height }` is split into
 * `defaultNodeWidth` / `defaultNodeHeight` (see `mapping.ts`); everything else
 * matches {@link ElkLayoutOptions} 1:1.
 */
interface ElkLayoutFields {
    algorithm?: ElkAlgorithm;
    direction?: ElkDirection;
    nodeSpacing?: number;
    layerSpacing?: number;
    edgeNodeSpacing?: number;
    edgeSpacing?: number;
    edgeRouting?: ElkEdgeRouting;
    padding?: number;
    defaultNodeWidth?: number;
    defaultNodeHeight?: number;
    includeGroups?: boolean;
    transition?: boolean;
    transitionEase?: string;
}
/** react-hook-form state — leaves register under `options.<field>`. */
interface ElkLayoutFormState {
    options: ElkLayoutFields;
}

interface ElkLayoutEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * layout's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: ElkLayoutFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values (the default form varies `layerSpacing` with the selected
     * `algorithm`). Defaults to {@link elkLayoutFields}.
     */
    fields?: FieldConfig[] | ((values: ElkLayoutFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`layout.setOptions`, a layout
     * re-run, an undo stack, …). The component does none of that.
     */
    onSubmit: (values: ElkLayoutFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `ElkLayout`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `ElkLayoutOptions ⇄ form-fields`
 * mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function ElkLayoutEditorPanel({ defaults, fields, onSubmit, submitLabel, }: ElkLayoutEditorPanelProps): react.JSX.Element;

/**
 * The full ElkLayout field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<ElkLayoutEditorPanel>`. The `layered`-only `layerSpacing` input
 * appears only when the `layered` algorithm is selected.
 */
declare function elkLayoutFields(values?: ElkLayoutFields): FieldConfig[];

/**
 * Map an `ElkLayoutOptions`-shaped patch to the flat {@link ElkLayoutFields}.
 * `padding` is only surfaced when it's a symmetric number (the per-side object
 * form is out of scope); `defaultNodeSize: { width, height }` is split into
 * `defaultNodeWidth` / `defaultNodeHeight`.
 */
declare function optionsToForm$6(o?: ElkLayoutOptions): ElkLayoutFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ElkLayoutOptions} patch. Only fields the form set are included, and
 * `defaultNodeSize` is reassembled only when a member is set — so the result is
 * safe to spread over the layout's current options.
 */
declare function formToOptions$6(f: ElkLayoutFields): ElkLayoutOptions;

/**
 * Types for the D3HierarchyLayout editor.
 *
 * Engine-agnostic: `@invana/graph-layout-d3-hierarchy` (home of
 * `D3HierarchyLayout` and its options) is **not** imported — canvas-ui may only
 * use `@invana/graph` types (package CLAUDE.md). The editable option shape is
 * mirrored here as {@link D3HierarchyLayoutOptions}, a serialisable patch the
 * consumer applies (a layout re-run / `setOptions`). Keep the enums / fields in
 * sync by hand.
 */
/**
 * Layout mode.
 * - `'tree'` / `'cluster'` — Cartesian tidy-tree / dendrogram.
 * - `'radial-tree'` / `'radial-cluster'` — polar projections of the above.
 * - `'pack'` — circle-packing enclosure.
 * - `'sunburst'` — polar partition (annular sectors).
 */
type D3HierarchyLayoutMode = 'tree' | 'cluster' | 'radial-tree' | 'radial-cluster' | 'pack' | 'sunburst';
/** Cartesian-mode orientation. Ignored in `radial-*` / `pack` / `sunburst`. */
type CartesianOrientation = 'vertical' | 'horizontal';
/**
 * The subset of `D3HierarchyLayoutOptions` this editor produces — a
 * serialisable patch. `size` / `nodeSize` are flattened into their two scalar
 * components (`sizeWidth`/`sizeHeight`, `nodeSizeX`/`nodeSizeY`); `center` is
 * kept nested. Function options (`separation`, `value`, `sort`) and registry
 * wiring (`id` / `targetLayerId`) are out of scope; the tunable scalars
 * round-trip. `transition` / `transitionEase` come from the shared one-shot
 * layout base (vetoed at runtime for `pack` / `sunburst`).
 */
interface D3HierarchyLayoutOptions {
    mode?: D3HierarchyLayoutMode;
    rootId?: string;
    /** `tree.size([w, h])` / `cluster.size([w, h])`. Cartesian modes. */
    size?: [number, number];
    /** `tree.nodeSize([dx, dy])`. Mutually exclusive with `size`. */
    nodeSize?: [number, number];
    /** Polar radius for `radial-*` modes. Default `400`. */
    radius?: number;
    /** Cartesian orientation. Default `'vertical'`. */
    orientation?: CartesianOrientation;
    /** Translate the projected coordinates by `(x, y)` after layout. */
    center?: {
        x?: number;
        y?: number;
    };
    /** Pack-only: padding between sibling circles. */
    padding?: number;
    includeGroups?: boolean;
    transition?: boolean;
    transitionEase?: string;
}
/**
 * Flat form-field shape. The `size` / `nodeSize` tuples are split into scalar
 * pairs and `center: { x, y }` into `centerX` / `centerY` (see `mapping.ts`);
 * everything else matches {@link D3HierarchyLayoutOptions} 1:1.
 */
interface D3HierarchyLayoutFields {
    mode?: D3HierarchyLayoutMode;
    rootId?: string;
    sizeWidth?: number;
    sizeHeight?: number;
    nodeSizeX?: number;
    nodeSizeY?: number;
    radius?: number;
    orientation?: CartesianOrientation;
    centerX?: number;
    centerY?: number;
    padding?: number;
    includeGroups?: boolean;
    transition?: boolean;
    transitionEase?: string;
}
/** react-hook-form state — leaves register under `options.<field>`. */
interface D3HierarchyLayoutFormState {
    options: D3HierarchyLayoutFields;
}

interface D3HierarchyLayoutEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * layout's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: D3HierarchyLayoutFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values (the default form varies the per-mode numerics with the
     * `mode` select). Defaults to {@link d3HierarchyLayoutFields}.
     */
    fields?: FieldConfig[] | ((values: D3HierarchyLayoutFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`layout.setOptions`, a layout
     * re-run, an undo stack, …). The component does none of that.
     */
    onSubmit: (values: D3HierarchyLayoutFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `D3HierarchyLayout`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `D3HierarchyLayoutOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function D3HierarchyLayoutEditorPanel({ defaults, fields, onSubmit, submitLabel, }: D3HierarchyLayoutEditorPanelProps): react.JSX.Element;

/**
 * The full D3HierarchyLayout field set as one grouped `FieldConfig[]` — the
 * default `fields` for `<D3HierarchyLayoutEditorPanel>`. Layout numerics vary with
 * the current `mode`.
 */
declare function d3HierarchyLayoutFields(values?: D3HierarchyLayoutFields): FieldConfig[];

/**
 * Map a `D3HierarchyLayoutOptions`-shaped patch to the flat
 * {@link D3HierarchyLayoutFields}. The `size` / `nodeSize` tuples are split into
 * their scalar components and `center: { x, y }` into `centerX` / `centerY`.
 */
declare function optionsToForm$5(o?: D3HierarchyLayoutOptions): D3HierarchyLayoutFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link D3HierarchyLayoutOptions} patch. Only fields the form set are included.
 * `size` / `nodeSize` are re-fused into tuples only when **both** components are
 * set (a tuple needs both), and `center` when at least one of x/y is set — so
 * the result is safe to spread over the layout's current options.
 */
declare function formToOptions$5(f: D3HierarchyLayoutFields): D3HierarchyLayoutOptions;

/**
 * Types for the D3SankeyLayout editor.
 *
 * Engine-agnostic: `@invana/graph-layout-d3-sankey` (home of `D3SankeyLayout`
 * and its options) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link D3SankeyLayoutOptions}, a serialisable patch the consumer applies (a
 * layout re-run / `setOptions`). Keep the enum / fields in sync by hand.
 */
/**
 * Column-alignment strategy. Mirrors d3-sankey's `nodeAlign` setters.
 * `'justify'` (default) puts sources left, sinks right.
 */
type D3SankeyNodeAlign = 'left' | 'right' | 'center' | 'justify';
/**
 * The subset of `D3SankeyLayoutOptions` this editor produces — a serialisable
 * patch. `size` is flattened into `sizeWidth` / `sizeHeight`; `center` is kept
 * nested. Function options (`nodeSort`, `linkSort`) and registry wiring (`id` /
 * `targetLayerId`) are out of scope. Sankey snaps — there is no `transition`.
 */
interface D3SankeyLayoutOptions {
    /** Viewport size `[width, height]` the layout fills. Default `[1000, 600]`. */
    size?: [number, number];
    /** Column rectangle width. Default `24`. */
    nodeWidth?: number;
    /** Vertical padding between nodes within a column. Default `8`. */
    nodePadding?: number;
    /** Relaxation iterations. Default `6`. */
    iterations?: number;
    /** Column-alignment strategy. Default `'justify'`. */
    nodeAlign?: D3SankeyNodeAlign;
    /** Translate the projected coordinates by `(x, y)` after layout. */
    center?: {
        x?: number;
        y?: number;
    };
}
/**
 * Flat form-field shape. The `size` tuple is split into `sizeWidth` /
 * `sizeHeight` and `center: { x, y }` into `centerX` / `centerY` (see
 * `mapping.ts`); everything else matches {@link D3SankeyLayoutOptions} 1:1.
 */
interface D3SankeyLayoutFields {
    sizeWidth?: number;
    sizeHeight?: number;
    nodeWidth?: number;
    nodePadding?: number;
    iterations?: number;
    nodeAlign?: D3SankeyNodeAlign;
    centerX?: number;
    centerY?: number;
}
/** react-hook-form state — leaves register under `options.<field>`. */
interface D3SankeyLayoutFormState {
    options: D3SankeyLayoutFields;
}

interface D3SankeyLayoutEditorPanelProps {
    /**
     * Initial field values, loaded into the form once on mount. Seed it from a
     * layout's options with the exported `optionsToForm`. Remount (via `key`)
     * to reload.
     */
    defaults?: D3SankeyLayoutFields;
    /**
     * The form schema. Either a static `FieldConfig[]` or a function of the
     * current values. Defaults to {@link d3SankeyLayoutFields}.
     */
    fields?: FieldConfig[] | ((values: D3SankeyLayoutFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back to an options patch with
     * `formToOptions` and apply it however you like (`layout.setOptions`, a layout
     * re-run, an undo stack, …). The component does none of that.
     */
    onSubmit: (values: D3SankeyLayoutFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `D3SankeyLayout`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `D3SankeyLayoutOptions ⇄ form-fields`
 * mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
declare function D3SankeyLayoutEditorPanel({ defaults, fields, onSubmit, submitLabel, }: D3SankeyLayoutEditorPanelProps): react.JSX.Element;

/**
 * The full D3SankeyLayout field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<D3SankeyLayoutEditorPanel>`.
 */
declare const d3SankeyLayoutFields: FieldConfig[];

/**
 * Map a `D3SankeyLayoutOptions`-shaped patch to the flat
 * {@link D3SankeyLayoutFields}. The `size` tuple is split into `sizeWidth` /
 * `sizeHeight` and `center: { x, y }` into `centerX` / `centerY`.
 */
declare function optionsToForm$4(o?: D3SankeyLayoutOptions): D3SankeyLayoutFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link D3SankeyLayoutOptions} patch. Only fields the form set are included.
 * `size` is re-fused into a tuple only when **both** components are set (a tuple
 * needs both), and `center` when at least one of x/y is set — so the result is
 * safe to spread over the layout's current options.
 */
declare function formToOptions$4(f: D3SankeyLayoutFields): D3SankeyLayoutOptions;

/**
 * Types for the DensityContourFillLayer editor.
 *
 * Engine-agnostic: `@invana/graph-layer-d3-contour` (home of
 * `DensityContourFillLayer` and its options) is **not** imported — canvas-ui
 * may only use `@invana/graph` types (package CLAUDE.md). The editable option
 * shape is mirrored here as {@link DensityContourFillLayerOptions}, a
 * serialisable patch the consumer applies via `setOptions`. Keep the enums /
 * fields in sync with the engine by hand.
 */
/**
 * Named colour ramp for the density bands. Mirrors the engine's
 * `DensityContourPaletteName`. The engine also accepts a raw stop array; that
 * non-scalar form is out of scope for this select and round-trips untouched.
 */
type DensityContourPaletteName$1 = 'blues' | 'greens' | 'oranges' | 'purples' | 'reds' | 'viridis' | 'plasma' | 'magma' | 'inferno' | 'warm' | 'cool';
/** Recompute trigger — `'auto'` debounces on source changes; `'manual'` is caller-driven. */
type DensityContourRecompute$1 = 'auto' | 'manual';
/**
 * The subset of `DensityContourFillLayerOptions` this editor produces — a
 * serialisable patch. The `graphLayerId` cross-layer identity, the `fillColor`
 * per-band callback, and the `paletteFn` callback are out of scope (identity /
 * function options). `thresholds` keeps only the scalar band-count form; the
 * explicit iso-value array is out of scope.
 */
interface DensityContourFillLayerOptions {
    /** Kernel bandwidth in world units. Larger = smoother / broader blobs. */
    bandwidth?: number;
    /** Band count (scalar `thresholds` form). */
    thresholds?: number;
    /** Grid cell size in world units (d3 requires a power of two). */
    cellSize?: number;
    /** Padding around the node bounding box before building the grid. */
    padding?: number;
    /** Named colour ramp for the bands. */
    palette?: DensityContourPaletteName$1;
    /** Palette start fraction 0..1 (used only when both start + end set). */
    paletteRangeStart?: number;
    /** Palette end fraction 0..1 (used only when both start + end set). */
    paletteRangeEnd?: number;
    /** Fill alpha 0..1. Default `0.4`. */
    fillOpacity?: number;
    /** Recompute trigger. */
    recompute?: DensityContourRecompute$1;
    /** Debounce window for `auto` recomputes, in ms. */
    recomputeDebounceMs?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link DensityContourFillLayerOptions} 1:1 — every option is already a scalar
 * (no nested groups, no colour numbers), so no re-encoding is needed.
 */
type DensityContourFillLayerFields = DensityContourFillLayerOptions;
/** react-hook-form state — leaves register under `options.<field>`. */
interface DensityContourFillLayerFormState {
    options: DensityContourFillLayerFields;
}

interface DensityContourFillLayerEditorPanelProps {
    /**
     * Initial field values, loaded once on mount. Seed from a layer's options
     * with the exported `optionsToForm`. Remount (via `key`) to reload.
     */
    defaults?: DensityContourFillLayerFields;
    /**
     * The form schema — a static `FieldConfig[]` or a function of the current
     * values. Defaults to {@link densityContourFillLayerFields}.
     */
    fields?: FieldConfig[] | ((values: DensityContourFillLayerFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back with `formToOptions` and
     * apply via `layer.setOptions` (or wherever). The component does none of that.
     */
    onSubmit: (values: DensityContourFillLayerFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `DensityContourFillLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the grouped
 * schema (each `group` an accordion section) with `@invana/forms`, and hands
 * the current values to `onSubmit`. Holds no engine reference and does no
 * commit — `optionsToForm` / `formToOptions` are the consumer's plug-in.
 */
declare function DensityContourFillLayerEditorPanel({ defaults, fields, onSubmit, submitLabel, }: DensityContourFillLayerEditorPanelProps): react.JSX.Element;

/** The full DensityContourFillLayer field set as one grouped `FieldConfig[]`. */
declare const densityContourFillLayerFields: FieldConfig[];

/**
 * Map a `DensityContourFillLayerOptions`-shaped patch to the flat
 * {@link DensityContourFillLayerFields}. All fields are scalars (no colour
 * numbers, no nested groups), so this is a direct pass-through — `thresholds`
 * keeps only its scalar band-count form (an explicit iso-value array is out of
 * scope and round-trips as `undefined`).
 */
declare function optionsToForm$3(o?: DensityContourFillLayerOptions): DensityContourFillLayerFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DensityContourFillLayerOptions} patch. Only fields the form set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * layer's current options on `setOptions`.
 */
declare function formToOptions$3(f: DensityContourFillLayerFields): DensityContourFillLayerOptions;

/**
 * Types for the DensityContourStrokeLayer editor.
 *
 * Engine-agnostic: `@invana/graph-layer-d3-contour` (home of
 * `DensityContourStrokeLayer` and its options) is **not** imported — canvas-ui
 * may only use `@invana/graph` types (package CLAUDE.md). The editable option
 * shape is mirrored here as {@link DensityContourStrokeLayerOptions}, a
 * serialisable patch the consumer applies via `setOptions`. Keep the enums /
 * fields in sync with the engine by hand.
 */
/**
 * Named colour ramp for the iso-lines. Mirrors the engine's
 * `DensityContourPaletteName`. The engine also accepts a raw stop array; that
 * non-scalar form is out of scope for this select and round-trips untouched.
 */
type DensityContourPaletteName = 'blues' | 'greens' | 'oranges' | 'purples' | 'reds' | 'viridis' | 'plasma' | 'magma' | 'inferno' | 'warm' | 'cool';
/** Recompute trigger — `'auto'` debounces on source changes; `'manual'` is caller-driven. */
type DensityContourRecompute = 'auto' | 'manual';
/**
 * The subset of `DensityContourStrokeLayerOptions` this editor produces — a
 * serialisable patch. The `graphLayerId` cross-layer identity and the
 * `paletteFn` callback are out of scope. `strokeColor` keeps the engine's
 * `number (0xRRGGBB) | 'palette'` encoding (a constant colour or per-band
 * palette resolution); `strokeWidth` keeps only its scalar constant form (the
 * per-band width callback is out of scope). `thresholds` keeps only the scalar
 * band-count form.
 */
interface DensityContourStrokeLayerOptions {
    /** Kernel bandwidth in world units. Larger = smoother / broader blobs. */
    bandwidth?: number;
    /** Band count (scalar `thresholds` form). */
    thresholds?: number;
    /** Grid cell size in world units (d3 requires a power of two). */
    cellSize?: number;
    /** Padding around the node bounding box before building the grid. */
    padding?: number;
    /** Named colour ramp — consulted when `strokeColor === 'palette'`. */
    palette?: DensityContourPaletteName;
    /** Palette start fraction 0..1 (used only when both start + end set). */
    paletteRangeStart?: number;
    /** Palette end fraction 0..1 (used only when both start + end set). */
    paletteRangeEnd?: number;
    /**
     * Iso-line colour: a constant `0xRRGGBB` integer, or `'palette'` to resolve
     * per band through the palette chain.
     */
    strokeColor?: number | 'palette';
    /** Constant iso-line width in world units. */
    strokeWidth?: number;
    /** Index-contour sugar — every Nth band is stroked with the major width. */
    indexEvery?: number;
    /** Width of the "major" (index) contours. */
    indexMajorWidth?: number;
    /** Width of the "minor" (in-between) contours. */
    indexMinorWidth?: number;
    /** Recompute trigger. */
    recompute?: DensityContourRecompute;
    /** Debounce window for `auto` recomputes, in ms. */
    recomputeDebounceMs?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `strokeColor: number | 'palette'` union is split into a `strokePalette`
 * boolean toggle plus a `strokeColor` colour string (see `mapping.ts`), because
 * a single field can't be both a swatch and a mode.
 */
interface DensityContourStrokeLayerFields {
    bandwidth?: number;
    thresholds?: number;
    cellSize?: number;
    padding?: number;
    palette?: DensityContourPaletteName;
    paletteRangeStart?: number;
    paletteRangeEnd?: number;
    /** Whether the iso-lines are coloured from the palette (vs a constant swatch). */
    strokePalette?: boolean;
    /** Constant iso-line colour `#rrggbb`, used only when {@link strokePalette} is off. */
    strokeColor?: string;
    strokeWidth?: number;
    indexEvery?: number;
    indexMajorWidth?: number;
    indexMinorWidth?: number;
    recompute?: DensityContourRecompute;
    recomputeDebounceMs?: number;
}
/** react-hook-form state — leaves register under `options.<field>`. */
interface DensityContourStrokeLayerFormState {
    options: DensityContourStrokeLayerFields;
}

interface DensityContourStrokeLayerEditorPanelProps {
    /**
     * Initial field values, loaded once on mount. Seed from a layer's options
     * with the exported `optionsToForm`. Remount (via `key`) to reload.
     */
    defaults?: DensityContourStrokeLayerFields;
    /**
     * The form schema — a static `FieldConfig[]` or a function of the current
     * values (the default swaps the palette / swatch inputs on the
     * `strokePalette` toggle). Defaults to {@link densityContourStrokeLayerFields}.
     */
    fields?: FieldConfig[] | ((values: DensityContourStrokeLayerFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back with `formToOptions` and
     * apply via `layer.setOptions` (or wherever). The component does none of that.
     */
    onSubmit: (values: DensityContourStrokeLayerFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `DensityContourStrokeLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the grouped
 * schema (each `group` an accordion section) with `@invana/forms`, and hands
 * the current values to `onSubmit`. Holds no engine reference and does no
 * commit — `optionsToForm` / `formToOptions` are the consumer's plug-in.
 */
declare function DensityContourStrokeLayerEditorPanel({ defaults, fields, onSubmit, submitLabel, }: DensityContourStrokeLayerEditorPanelProps): react.JSX.Element;

/**
 * The full DensityContourStrokeLayer field set as one grouped `FieldConfig[]` —
 * the default `fields` for `<DensityContourStrokeLayerEditorPanel>`. The palette /
 * swatch inputs swap on the `strokePalette` toggle.
 */
declare function densityContourStrokeLayerFields(values?: DensityContourStrokeLayerFields): FieldConfig[];

/**
 * Map a `DensityContourStrokeLayerOptions`-shaped patch to the flat
 * {@link DensityContourStrokeLayerFields}. The engine's `strokeColor: number |
 * 'palette'` is split: `strokePalette` becomes a boolean toggle and the
 * constant colour (when present) is normalised from `0xRRGGBB` to `#rrggbb`.
 * `thresholds` / `strokeWidth` keep only their scalar forms.
 */
declare function optionsToForm$2(o?: DensityContourStrokeLayerOptions): DensityContourStrokeLayerFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DensityContourStrokeLayerOptions} patch. Only fields the form set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * layer's current options on `setOptions`. `strokeColor` is re-fused from the
 * `strokePalette` toggle (`'palette'` when on, the `#rrggbb → 0xRRGGBB` colour
 * when off).
 */
declare function formToOptions$2(f: DensityContourStrokeLayerFields): DensityContourStrokeLayerOptions;

/**
 * Types for the BubbleSetsLayer editor.
 *
 * Engine-agnostic: `@invana/graph-layer-bubble-sets` (home of `BubbleSetsLayer`
 * and its options) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link BubbleSetsLayerOptions}, a serialisable patch the consumer applies via
 * `setOptions`. Keep the enums / fields in sync with the engine by hand.
 */
/** Contour smoothing algorithm. Mirrors the engine's `smoothness` union. */
type BubbleSetsSmoothness = 'none' | 'bspline' | 'chaikin';
/** Recompute trigger — `'auto'` debounces on source changes; `'manual'` is caller-driven. */
type BubbleSetsRecompute = 'auto' | 'manual';
/**
 * A default `BubbleSetStyle` mirror — the per-set visual style. Colours are
 * `0xRRGGBB` integers in the engine; see `mapping.ts` for the `#rrggbb` bridge.
 * The layer's `sets` carry their own style; this group edits a representative /
 * default style the consumer can apply to sets however it likes.
 */
interface BubbleSetStyle {
    /** Solid fill colour `0xRRGGBB`. */
    fill?: number;
    /** Fill alpha 0..1. */
    fillOpacity?: number;
    /** Stroke colour `0xRRGGBB`. */
    stroke?: number;
    /** Stroke alpha 0..1. */
    strokeOpacity?: number;
    /** Stroke width in world units. */
    strokeWidth?: number;
}
/**
 * The subset of `BubbleSetsLayerOptions` this editor produces — a serialisable
 * patch. The `graphLayerId` cross-layer identity and the `sets` group
 * membership (node/edge id lists + per-set labels) are out of scope; the
 * remaining algorithm knobs plus a default {@link BubbleSetStyle} round-trip.
 */
interface BubbleSetsLayerOptions {
    /** Grid resolution in square world units. Smaller = sharper, costlier. */
    pixelGroup?: number;
    /** Node-influence inner radius (full influence), world units. */
    nodeR0?: number;
    /** Node-influence outer radius (zero influence), world units. */
    nodeR1?: number;
    /** Edge-influence inner radius, world units. */
    edgeR0?: number;
    /** Edge-influence outer radius, world units. */
    edgeR1?: number;
    /** Padding around the energy grid before sampling, world units. */
    morphBuffer?: number;
    /** Max routing iterations to wrap obstacles. */
    maxRoutingIterations?: number;
    /** Max marching-squares refinement iterations. */
    maxMarchingIterations?: number;
    /** Contour smoothing algorithm. */
    smoothness?: BubbleSetsSmoothness;
    /** Chaikin corner-cutting iterations (used only when `smoothness === 'chaikin'`). */
    chaikinIterations?: number;
    /** Default per-set visual style. */
    style?: BubbleSetStyle;
    /** Recompute trigger. */
    recompute?: BubbleSetsRecompute;
    /** Debounce window for `auto` recomputes, in ms. */
    recomputeDebounceMs?: number;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The nested
 * {@link BubbleSetStyle} group is flattened to `style`-prefixed scalars
 * (`styleFill`, `styleFillOpacity`, …) with colours as `#rrggbb` strings; see
 * `mapping.ts` for the round-trip.
 */
interface BubbleSetsLayerFields {
    pixelGroup?: number;
    nodeR0?: number;
    nodeR1?: number;
    edgeR0?: number;
    edgeR1?: number;
    morphBuffer?: number;
    maxRoutingIterations?: number;
    maxMarchingIterations?: number;
    smoothness?: BubbleSetsSmoothness;
    chaikinIterations?: number;
    /** Default fill colour `#rrggbb`. */
    styleFill?: string;
    styleFillOpacity?: number;
    /** Default stroke colour `#rrggbb`. */
    styleStroke?: string;
    styleStrokeOpacity?: number;
    styleStrokeWidth?: number;
    recompute?: BubbleSetsRecompute;
    recomputeDebounceMs?: number;
}
/** react-hook-form state — leaves register under `options.<field>`. */
interface BubbleSetsLayerFormState {
    options: BubbleSetsLayerFields;
}

interface BubbleSetsLayerEditorPanelProps {
    /**
     * Initial field values, loaded once on mount. Seed from a layer's options
     * with the exported `optionsToForm`. Remount (via `key`) to reload.
     */
    defaults?: BubbleSetsLayerFields;
    /**
     * The form schema — a static `FieldConfig[]` or a function of the current
     * values (the default hides `chaikinIterations` unless Chaikin smoothing is
     * selected). Defaults to {@link bubbleSetsLayerFields}.
     */
    fields?: FieldConfig[] | ((values: BubbleSetsLayerFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back with `formToOptions` and
     * apply via `layer.setOptions` (or wherever). The component does none of that.
     */
    onSubmit: (values: BubbleSetsLayerFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `BubbleSetsLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the grouped
 * schema (each `group` an accordion section) with `@invana/forms`, and hands
 * the current values to `onSubmit`. Holds no engine reference and does no
 * commit — `optionsToForm` / `formToOptions` are the consumer's plug-in.
 */
declare function BubbleSetsLayerEditorPanel({ defaults, fields, onSubmit, submitLabel, }: BubbleSetsLayerEditorPanelProps): react.JSX.Element;

/**
 * The full BubbleSetsLayer field set as one grouped `FieldConfig[]` — the
 * default `fields` for `<BubbleSetsLayerEditorPanel>`. The `chaikinIterations` input
 * appears only for the Chaikin smoothing algorithm.
 */
declare function bubbleSetsLayerFields(values?: BubbleSetsLayerFields): FieldConfig[];

/**
 * Map a `BubbleSetsLayerOptions`-shaped patch to the flat
 * {@link BubbleSetsLayerFields}. The nested {@link BubbleSetStyle} group is
 * flattened to `style`-prefixed scalars, with colour `0xRRGGBB` numbers
 * normalised to `#rrggbb` strings.
 */
declare function optionsToForm$1(o?: BubbleSetsLayerOptions): BubbleSetsLayerFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link BubbleSetsLayerOptions} patch. Only fields the form set are included
 * (no `undefined` keys), so the result is safe to spread over the layer's
 * current options. The `style` group is reassembled (with `#rrggbb → 0xRRGGBB`
 * colours) only when at least one style field is set.
 */
declare function formToOptions$1(f: BubbleSetsLayerFields): BubbleSetsLayerOptions;

/**
 * Types for the MapLayer editor.
 *
 * Engine-agnostic: `@invana/graph-layer-maplibre` (home of `MapLayer` and its
 * options) is **not** imported — canvas-ui may only use `@invana/graph` types
 * (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link MapLayerOptions}, a serialisable patch the consumer applies via
 * `setOptions`. Keep the fields in sync with the engine by hand.
 */
/**
 * The subset of `MapLayerOptions` this editor produces — a serialisable patch.
 * The `mountTarget` HTMLElement handle is out of scope (non-serialisable DOM
 * ref). `styleUrl` keeps only its scalar string form (a full StyleSpecification
 * object is out of scope and round-trips untouched). `center` keeps the
 * engine's `[lng, lat]` tuple encoding — the form flattens it (see `types` /
 * `mapping.ts`).
 */
interface MapLayerOptions {
    /** MapLibre style URL (string form only). */
    styleUrl?: string;
    /** Initial map centre as `[lng, lat]` in degrees. */
    center?: [number, number];
    /** Initial MapLibre zoom level (0..22). */
    zoom?: number;
    /** Minimum allowed MapLibre zoom. */
    minZoom?: number;
    /** Maximum allowed MapLibre zoom. */
    maxZoom?: number;
    /**
     * Make the Pixi canvas pointer-transparent so MapLibre receives all input
     * (pan / zoom / click). Default `true`.
     */
    passInputToMap?: boolean;
}
/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `center: [lng, lat]` tuple is flattened to `centerLng` / `centerLat` scalars
 * (see `mapping.ts`), because a single field can't hold a tuple.
 */
interface MapLayerFields {
    styleUrl?: string;
    /** Centre longitude in degrees. */
    centerLng?: number;
    /** Centre latitude in degrees. */
    centerLat?: number;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    passInputToMap?: boolean;
}
/** react-hook-form state — leaves register under `options.<field>`. */
interface MapLayerFormState {
    options: MapLayerFields;
}

interface MapLayerEditorPanelProps {
    /**
     * Initial field values, loaded once on mount. Seed from a layer's options
     * with the exported `optionsToForm`. Remount (via `key`) to reload.
     */
    defaults?: MapLayerFields;
    /**
     * The form schema — a static `FieldConfig[]` or a function of the current
     * values. Defaults to {@link mapLayerFields}.
     */
    fields?: FieldConfig[] | ((values: MapLayerFields) => FieldConfig[]);
    /**
     * Called with the current values on submit. Map back with `formToOptions` and
     * apply via `layer.setOptions` (or wherever). The component does none of that.
     */
    onSubmit: (values: MapLayerFields) => void;
    /** Submit button label. Default `'Apply'`. */
    submitLabel?: string;
}
/**
 * Self-contained, engine-agnostic settings form for `MapLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the grouped
 * schema (each `group` an accordion section) with `@invana/forms`, and hands
 * the current values to `onSubmit`. Holds no engine reference and does no
 * commit — `optionsToForm` / `formToOptions` are the consumer's plug-in.
 */
declare function MapLayerEditorPanel({ defaults, fields, onSubmit, submitLabel, }: MapLayerEditorPanelProps): react.JSX.Element;

/** The full MapLayer field set as one grouped `FieldConfig[]`. */
declare const mapLayerFields: FieldConfig[];

/**
 * Map a `MapLayerOptions`-shaped patch to the flat {@link MapLayerFields}. The
 * engine's `center: [lng, lat]` tuple is split into `centerLng` / `centerLat`
 * scalars; `styleUrl` passes through (a non-string StyleSpecification object is
 * out of scope — mirror it in the options type as `string` only).
 */
declare function optionsToForm(o?: MapLayerOptions): MapLayerFields;
/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link MapLayerOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the layer's current
 * options on `setOptions`. `center` is reassembled into a `[lng, lat]` tuple
 * only when both `centerLng` and `centerLat` are set.
 */
declare function formToOptions(f: MapLayerFields): MapLayerOptions;

/**
 * Engine-agnostic, **presentational** preview cards — the visual content for a
 * hover preview. They take plain props (no engine types, no positioning, no
 * interactivity): a turnkey like `@invana/canvas-react`'s `<HoverElementPreviewBehaviour>`
 * owns the anchoring + hold-open wiring and renders one of these inside its
 * positioned shell, so the card itself is "simply UI".
 */
/** A labelled property row. */
interface PreviewCardRow {
    label: string;
    value: string;
    /** Render the value monospaced (ids, hashes). */
    mono?: boolean;
}
interface NodePreviewCardProps {
    /** Avatar / thumbnail URL. The image column is omitted when absent. */
    image?: string;
    /** Avatar size in px (inline, purge-proof). Default `40`. */
    imageSize?: number;
    /** Primary line (e.g. a display name). */
    title: string;
    /** Secondary line under the title — clamped to two lines. */
    subtitle?: string;
    /** Chips shown below the image + title block (e.g. labels / role). */
    tags?: readonly string[];
    /** Property rows below a divider. */
    rows?: readonly PreviewCardRow[];
    className?: string;
}
/**
 * Identity-style node card: image left, title + subtitle stacked on the right,
 * tags below, then property rows under a divider.
 */
declare function NodePreviewCard({ image, imageSize, title, subtitle, tags, rows, className, }: NodePreviewCardProps): react.JSX.Element;
interface EdgePreviewCardProps {
    /** Relationship label chip (e.g. the edge `type`). */
    badge?: string;
    /** Title — e.g. a `from → to` element. */
    title: ReactNode;
    /** Secondary description line. */
    subtitle?: string;
    /** Property rows below a divider. */
    rows?: readonly PreviewCardRow[];
    className?: string;
}
/** Relationship card: a type badge, a title, an optional description, then rows. */
declare function EdgePreviewCard({ badge, title, subtitle, rows, className }: EdgePreviewCardProps): react.JSX.Element;

interface LayersViewPanelProps {
    /**
     * The live canvas engine. **Optional** — omit it inside a `<GraphCanvas>` /
     * `GraphCanvasApp` tree and the panel binds to the nearest one via
     * `GraphCanvasContext` (rendering empty until the engine is ready). Pass it
     * explicitly to target a specific instance from outside that subtree.
     */
    canvas?: GraphCanvas | null;
}
declare function LayersViewPanel({ canvas: explicit }: LayersViewPanelProps): react.JSX.Element;

interface CanvasFiltersViewPanelProps {
    /** The live canvas engine (null until `<Canvas>` publishes it). */
    canvas: GraphCanvas | null;
    /** GraphLayer id whose hidden elements this view lists. Default `'graph'`. */
    layerId?: string;
    /** Minimum zoom the node **Focus** action zooms in to. Default `2`. */
    focusZoom?: number;
    /**
     * `ClickSelectBehaviour` id that **Focus** also selects the element on — same
     * mechanism as the context-menu "Select". Default `'click-select'`; focus still
     * frames the element (a no-op selection) if no such behaviour is registered.
     */
    selectBehaviourId?: string;
}
/**
 * Lists the nodes and edges you've parked on a `GraphLayer` and lets you manage
 * each: **focus** (⊹) frames it in view and selects it, the **eye** toggles its
 * visibility (keeping it listed), and **remove** (✕)
 * restores it and drops it from the list; "Show all" makes every parked item
 * visible but keeps the list. An element hidden elsewhere (right-click → Hide) joins the
 * list automatically. Renders a compact empty state when nothing is parked. Drop
 * it into a panel / tab and hand it the live `canvas`.
 */
declare function CanvasFiltersViewPanel({ canvas, layerId, focusZoom, selectBehaviourId, }: CanvasFiltersViewPanelProps): react.JSX.Element;

interface FindInCanvasViewPanelProps {
    /** The live canvas engine (null until `<Canvas>` publishes it). */
    canvas: GraphCanvas | null;
    /** GraphLayer id whose nodes/edges this view searches. Default `'graph'`. */
    layerId?: string;
    /** Minimum zoom a node **result** click zooms in to. Default `2`. */
    focusZoom?: number;
    /**
     * `ClickSelectBehaviour` id a result click also selects the element on — same
     * mechanism as the context-menu "Select". Default `'click-select'`; the click
     * still frames the element (a no-op selection) if no such behaviour is
     * registered.
     */
    selectBehaviourId?: string;
    /** Result rows per page. Default `25`. */
    pageSize?: number;
}
/**
 * A structured find-in-canvas panel for a `GraphCanvas`: compose field filters
 * (**any** field / **id** / **label** / any **property**, `contains` or `equals`),
 * AND-combined, and preview the matches inline — each result shows the element's
 * display name and the matched field(s) with the search term highlighted. Click a
 * match to **focus + select** it on the canvas (non-destructive — it never hides or
 * filters elements). The kind toggle scopes matching to nodes, edges, or both; the
 * property field options are discovered live from the loaded data. Drop it into a
 * panel / tab and hand it the live `canvas`.
 */
declare function FindInCanvasViewPanel({ canvas, layerId, focusZoom, selectBehaviourId, pageSize, }: FindInCanvasViewPanelProps): react.JSX.Element;

interface SelectionViewPanelProps {
    /** The live canvas engine (null until `<Canvas>` publishes it). */
    canvas: GraphCanvas | null;
    /** GraphLayer id the selected ids are resolved against. Default `'graph'`. */
    layerId?: string;
    /**
     * `ClickSelectBehaviour` id the **deselect** / **clear** actions write through —
     * the same behaviour that mirrors the selection into the store. Default
     * `'click-select'`. When no such behaviour is registered the panel is read-only:
     * the list still renders, the mutating controls are hidden.
     */
    selectBehaviourId?: string;
    /** Minimum zoom a **node** row click zooms in to. Default `2`. */
    focusZoom?: number;
    /** Extra classes for the panel root. */
    className?: string;
}
/**
 * Lists the current selection of a `GraphCanvas` — **Nodes** then **Edges** —
 * reading `view.interaction.selection` from the kernel store. Click a row to
 * **focus** it (frames the camera on it), ✕ to **deselect** just that element;
 * the header clears the whole selection or **hides** it (parking every selected
 * element into `CanvasFiltersViewPanel`'s list). Drop it into a panel / tab and
 * hand it the live `canvas`.
 *
 * A thin **validation guard**: the real work runs in
 * {@link SelectionViewPanelContent} with a guaranteed-live canvas, which lets the
 * body read the store with the plain reactive `useStore` and no null plumbing.
 */
declare function SelectionViewPanel({ canvas, className, ...rest }: SelectionViewPanelProps): react.JSX.Element;

interface PlaybookViewPanelProps {
    /**
     * The live canvas engine. Optional: inside a `<Canvas>` / `<GraphCanvas>` tree
     * the nearest one is used. `null` (not ready yet) renders a placeholder.
     */
    canvas?: Canvas | null;
    /** Show **Save as step** (turn the work since the last step into a step). Default `true`. */
    showSaveStep?: boolean;
    /** Show **Copy JSON** (the script, as `playbook.toJSON()`). Default `true`. */
    showCopyJson?: boolean;
    /** Extra classes for the panel root. */
    className?: string;
}
/**
 * The playbook of a canvas — steps, position, narration and the moves between
 * steps — as a panel. Drop it inside a canvas tree with no props, or pass
 * `canvas` to target a specific instance.
 *
 * - **◀ Previous / Next ▶** revert / play one step; a row click moves to that
 *   step, playing or reverting every step in between.
 * - A step that fails validation writes nothing; its message shows under the
 *   controls.
 * - **Save as step** takes `history.sinceLastStep(title)` and adds it: the work
 *   is already on the canvas, so the playbook adopts its entries instead of
 *   playing them again. Only offered at the last step, where adoption applies.
 */
declare function PlaybookViewPanel({ canvas, className, ...rest }: PlaybookViewPanelProps): react.JSX.Element;

interface PlaybookPresenterBarProps {
    /**
     * The live canvas engine. Optional: inside a `<Canvas>` / `<GraphCanvas>` tree
     * the nearest one is used. `null` (not ready yet) renders a placeholder.
     */
    canvas?: Canvas | null;
    /** Show one dot per step (a click moves there). Default `true`. */
    showDots?: boolean;
    /** Extra classes for the bar root — typically the host's positioning. */
    className?: string;
}
/**
 * The playbook of a canvas as a presenter bar — the current step's title and
 * narration, the position, and the moves between steps. Drop it inside a canvas
 * tree with no props, or pass `canvas` to target a specific instance. Position
 * it yourself (e.g. `className="absolute inset-x-4 bottom-4"` over the canvas
 * host).
 *
 * - **◀ Previous / Next ▶** revert / play one step; a dot click moves to that
 *   step, playing or reverting every step in between.
 * - **← / →** (and PageUp / PageDown) do the same while focus is inside the
 *   bar — click it or tab into it. Keys pressed during a move are ignored.
 * - A step that fails validation writes nothing; its message shows in the bar.
 */
declare function PlaybookPresenterBar({ canvas, className, ...rest }: PlaybookPresenterBarProps): react.JSX.Element;

interface HistoryViewPanelProps {
    /**
     * The live canvas engine. Optional: inside a `<Canvas>` / `<GraphCanvas>` tree
     * the nearest one is used. `null` (not ready yet) renders a placeholder.
     */
    canvas?: Canvas | null;
    /** Show the Undo / Redo bar. Default `true`. */
    showUndoRedo?: boolean;
    /** Extra classes for the panel root. */
    className?: string;
}
/**
 * The canvas's history as a panel: applied entries newest first, each with its
 * label, actor, step and streamed badges and age; an actor filter; Undo / Redo.
 * Drop it inside a canvas tree with no props, or pass `canvas` to target a
 * specific instance.
 */
declare function HistoryViewPanel({ canvas, className, ...rest }: HistoryViewPanelProps): react.JSX.Element;

interface ElementInspectorViewPanelProps {
    /** The live canvas engine (null until `<Canvas>` publishes it). */
    canvas: GraphCanvas | null;
    /** GraphLayer id the inspected id is resolved against. Default `'graph'`. */
    layerId?: string;
    /**
     * `ClickInspectBehaviour` id the inspected element is read from. Default
     * `'click-inspect'`. That behaviour is **not** registered by default (rule 7):
     * with none present the panel renders an explanatory empty state instead of
     * pretending nothing has been clicked.
     */
    inspectBehaviourId?: string;
    /**
     * Inspect this element instead of the clicked one (controlled mode) — lets a
     * host drive the panel from its own list (a search result, a table row) with no
     * behaviour at all. `undefined` leaves the panel following the click.
     */
    elementId?: string | null;
    /** Minimum zoom the **Focus** action zooms a node in to. Default `2`. */
    focusZoom?: number;
    /**
     * Extra content for the inspected element, rendered between its identity and
     * its properties — where an app-specific block belongs (provenance, a dataset
     * link, permissions). The escape hatch that keeps domain concerns *out* of the
     * kit: canvas-ui never learns what a dataset is, the host renders it.
     */
    renderExtra?: (element: GraphNode | GraphEdge, kind: 'node' | 'edge') => ReactNode;
    /** Extra classes for the panel root. */
    className?: string;
}
/**
 * Read-only inspector for the element the user **clicked** on a `GraphCanvas` —
 * identity, endpoints (edges), `data` properties, and element state, with a
 * **Focus** action that frames it. Needs a `ClickInspectBehaviour` (register and
 * enable one; it is not in any default bundle), or an explicit `elementId`. Drop it
 * into a panel / tab and hand it the live `canvas`; pair it with
 * `SelectionViewPanel`, which answers the *other* question — what is selected.
 *
 * A thin **validation guard**: the real work runs in
 * {@link ElementInspectorViewPanelContent} with a guaranteed-live canvas, which lets
 * the body subscribe to the behaviour directly, with no null plumbing.
 */
declare function ElementInspectorViewPanel({ canvas, className, ...rest }: ElementInspectorViewPanelProps): react.JSX.Element;

/** Styling a host may set on one **node type**. */
interface NodeTypeStyling {
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
interface EdgeTypeStyling {
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
interface TypeStylingPatch {
    nodeTypes?: Record<string, NodeTypeStyling>;
    edgeTypes?: Record<string, EdgeTypeStyling>;
}
interface StylingViewPanelProps {
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

/**
 * Per-type styling for the types a live `GraphCanvas` is painting — one row per
 * node type (colour · label property · size) and one per edge type (colour ·
 * width), read reactively from the canvas's derived schema.
 *
 * Controlled: `value` in, a whole `TypeStylingPatch` out of `onChange` on every
 * edit, which the host persists. It also paints the patch on the target layer
 * unless {@link StylingViewPanelProps.apply} is false. A per-row reset (↺)
 * appears once a type carries an override, so "styled" and "default" stay
 * distinguishable.
 *
 * Bare content, like every `view-panels/` surface — wrap it in a `<Panel>` +
 * `<PanelContent>` for the floating-card chrome.
 */
declare function StylingViewPanel({ canvas: explicit, layerId, value, onChange, presetColors, sizeRange, widthRange, apply, emptyText, className, }: StylingViewPanelProps): react.JSX.Element;

/**
 * One saved snapshot of a canvas — the row **and** the document it restores.
 *
 * The panel mints these itself on capture and hands them to
 * {@link CanvasSnapshotEvents.onCreateSnapshot} for a host that persists. A host
 * loading its own history back passes the same shape in, `state` included.
 */
interface CanvasSnapshot {
    /** Stable id. The panel mints `snap-<epoch>`; a host that persists may replace it. */
    id: string;
    /** When it was captured. A `Date`, an epoch in ms, or anything `new Date(…)` parses. */
    capturedAt: Date | string | number;
    /** Row title. Falls back to {@link CanvasSnapshotsViewPanelProps.untitledLabel}. */
    label?: string;
    /** What changed in this snapshot — one line under the title. */
    summary?: string;
    /** Who captured it, when the host tracks that. */
    by?: string;
    /** Thumbnail src, when the host already holds one. Ignored if `renderThumbnail` returns a node. */
    thumbnail?: string;
    /**
     * True when a thumbnail exists but is not loaded yet — the panel reserves the
     * frame and shows a skeleton, so rows do not jump as banners arrive.
     */
    hasThumbnail?: boolean;
    /**
     * **The snapshot itself** — what `canvas.exportState()` returned: definition,
     * interaction (selection · hover · focus · camera · view mode) and every data
     * layer's records with their positions.
     *
     * The panel captures it and restores from it. A row without one is a label for
     * a document that isn't here (a seeded demo row, or a server row whose body
     * hasn't loaded) and says so rather than half-restoring.
     */
    state?: CanvasStateSnapshot;
}
/**
 * What the panel did, for a host that wants to persist it. Every one is a
 * **notification, not the mechanism** — the panel has already applied the change
 * on screen. Return a promise and a rejection rolls the change back, so a failed
 * save never leaves a row that exists only in the browser.
 */
interface CanvasSnapshotEvents {
    /** A snapshot was captured. The row carries its `state` — persist it whole. */
    onCreateSnapshot?: (snapshot: CanvasSnapshot) => void | Promise<void>;
    /** A snapshot changed. `change` is the delta; `snapshot` is the row after it. */
    onUpdateSnapshot?: (snapshot: CanvasSnapshot, change: {
        label?: string;
    }) => void | Promise<void>;
    /** A snapshot was deleted. */
    onDeleteSnapshot?: (id: string) => void | Promise<void>;
    /** A snapshot was loaded onto the canvas. Nothing changed server-side — for logging. */
    onRestoreSnapshot?: (snapshot: CanvasSnapshot) => void;
}
/** Every user-facing string the panel says, so wording stays consistent and localisable. */
interface CanvasSnapshotMessages {
    captured: string;
    captureFailed: string;
    restored: (label: string) => string;
    restoreMissingState: (label: string) => string;
    restoreIncompatible: (label: string) => string;
    saveFailed: string;
    deleteFailed: string;
}
interface CanvasSnapshotsViewPanelProps extends CanvasSnapshotEvents {
    /**
     * The live canvas. The panel captures from it and restores onto it, so with a
     * `null` canvas (before `<Canvas>` publishes one) capture and restore are
     * inert and the timeline is read-only.
     */
    canvas: Canvas | null;
    /**
     * History the panel starts with, in **uncontrolled** mode — seed rows, or a
     * server history loaded once. The panel owns the list from then on.
     *
     * Ignored when {@link snapshots} is passed.
     */
    initialSnapshots?: CanvasSnapshot[];
    /**
     * Switches the panel to **controlled** mode: it renders exactly these rows and
     * never mutates its own list. It still captures, restores and fires the events
     * — the host applies them and passes the new array back.
     *
     * Use this when the server is the source of truth. Omit it and the panel keeps
     * the list itself, which is what makes the zero-config case work.
     */
    snapshots?: CanvasSnapshot[];
    /** Tooltip + accessible name on the thumbnail. Default `'Click to load this snapshot onto the canvas'`. */
    restoreHint?: string;
    /**
     * The snapshot currently loaded onto the canvas — **the only row that gets a
     * highlight**. The panel tracks this itself (the last row captured or
     * restored), so the zero-config case marks the right row; pass it to drive the
     * highlight yourself, which is what a host with one list per board does.
     */
    activeSnapshotId?: string | null;
    /** Draw the capture button. Default `true`. */
    showCapture?: boolean;
    /** Text on the capture button. Default `'Take snapshot'`. */
    captureLabel?: string;
    /**
     * One line under the capture button saying what a snapshot contains. Default
     * names the three things people are surprised by — selection/highlight, element
     * positions, viewport. Pass `''` to draw no hint.
     */
    captureHint?: string;
    /** Label a captured snapshot lands with. Default `'Manual capture'`. */
    captureDefaultLabel?: string;
    /**
     * Thumbnail flavour. `'png'` (default) rasters the viewport; `'svg'` serialises
     * the live specs and stays crisp at any size, at a document size that tracks
     * the **graph** rather than the thumbnail — so it suits small and medium scenes.
     */
    thumbnailFormat?: 'png' | 'svg';
    /** Longest edge of a PNG thumbnail. Default `800` — the frame is ~800 device px at DPR 2. */
    thumbnailMaxSize?: number;
    /** What a thumbnail shows. Default `'viewport'` — what you were looking at, pan and zoom included. */
    captureArea?: 'viewport' | 'content';
    /** Allow deleting a snapshot (hover action + inline confirm). Default `true`. */
    allowDelete?: boolean;
    /** Allow renaming a snapshot's title in place. Default `true`. */
    allowRename?: boolean;
    /** True while the host is loading the list. */
    isLoading?: boolean;
    /** Shown when there are no snapshots. */
    emptyText?: string;
    /** Title for a snapshot with no label. Default `'Canvas snapshot'`. */
    untitledLabel?: string;
    /** Override any of the panel's user-facing strings. */
    messages?: Partial<CanvasSnapshotMessages>;
    /**
     * Thumbnail slot — the host's own (usually lazily-loading) image for a row.
     * Return `null`/`undefined` to fall back to {@link CanvasSnapshot.thumbnail}.
     *
     * **Presentational only.** The panel wraps the frame in the restore control, so
     * anything interactive returned here nests inside a button.
     */
    renderThumbnail?: (snapshot: CanvasSnapshot) => ReactNode;
    /** Locale for day headings and timestamps. Default: the browser's. */
    locale?: string;
    /** Class on the panel's root. */
    className?: string;
}
/**
 * The saved snapshots of a canvas as a timeline — grouped by day, newest first.
 * Each row is its thumbnail, its (renameable) title and what changed, and the
 * **thumbnail is the restore control**: click the picture to load that snapshot
 * onto the canvas.
 *
 * **It does the work.** Given the live `canvas`, the panel captures
 * (`exportState` + a thumbnail + a summary), restores (`importState`), renames,
 * deletes, and says what it did through `canvas.showMessage`. A host that wants
 * none of that passes only `canvas` and has a working snapshot timeline; a host
 * that persists listens to {@link CanvasSnapshotEvents} and writes to its server.
 * Nobody re-implements the mechanics.
 *
 * **Controlled or not.** By default the panel owns the list (seed it with
 * `initialSnapshots`). Pass `snapshots` and it renders exactly that instead,
 * never mutating its own copy — for hosts where the server is the truth.
 *
 * **`renderThumbnail` is an optional override.** Captured rows carry their own
 * picture and the panel draws it, including a skeleton for one still loading and
 * a placeholder for one that never had a picture. Pass the slot only when the
 * host loads banners itself (one query per visible row), and return
 * presentational content — the panel wraps the frame in the restore control, so
 * anything interactive would nest inside a button.
 *
 * Bare content, like every `view-panels/` surface — wrap it in a `<Panel>` +
 * `<PanelContent>` for the floating-card chrome.
 */
declare function CanvasSnapshotsViewPanel({ canvas, initialSnapshots, snapshots: controlledSnapshots, onCreateSnapshot, onUpdateSnapshot, onDeleteSnapshot, onRestoreSnapshot, restoreHint, activeSnapshotId, showCapture, captureLabel, captureHint, captureDefaultLabel, thumbnailFormat, thumbnailMaxSize, captureArea, allowDelete, allowRename, isLoading, emptyText, untitledLabel, messages, renderThumbnail, locale, className, }: CanvasSnapshotsViewPanelProps): react.JSX.Element;

interface UseDerivedSchemaOptions extends DeriveSchemaOptions {
    /** GraphLayer id to read. Default `'graph'`. */
    layerId?: string;
}
/**
 * The reactive schema of `canvas`'s `layerId` layer — the authoritative schema if
 * one was set on the store, else the schema derived from the loaded data.
 * Recomputes (coalesced per frame) on topology/data/`schema` changes; empty while
 * the canvas/layer is null.
 *
 * `nodeTypeOf` / `edgeTypeOf` feed the effect's dependency list — pass **stable**
 * (memoized or module-level) functions, or the subscription re-establishes each
 * render.
 */
declare function useDerivedSchema(canvas: GraphCanvas | null | undefined, { layerId, nodeTypeOf, edgeTypeOf }?: UseDerivedSchemaOptions): GraphSchema;

/** How each node-type renders in the metagraph. */
type SchemaNodeMode = 'simple' | 'table';
/** Connector routing for the metagraph edges (a subset of {@link EdgePathType}). */
type SchemaEdgeRouting = Extract<EdgePathType, 'straight' | 'orth' | 'bezier'>;
/** Deterministic colour for a type name — same name → same colour across renders. */
declare function typeColor(name: string): number;
/** The `GraphData` shape (structural — avoids a value import for the type). */
interface SchemaMetaGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
/** Options for {@link schemaToMetaGraph}. */
interface SchemaMetaGraphOptions {
    /** Render each node-type as a simple disc or a composite ER table. Default `'simple'`. */
    nodeMode?: SchemaNodeMode;
    /** Connector routing for the edges. Default `'straight'`. */
    edgeRouting?: SchemaEdgeRouting;
}
/**
 * Compile a {@link GraphSchema} into the `GraphData` the `SchemaViewPanel`'s canvas
 * renders: one node per node-type (a simple disc or a composite ER table, per
 * `nodeMode`) and one edge per connection pair (routed per `edgeRouting`, labelled
 * by edge type). Connections whose endpoints aren't present as node-types are
 * dropped. Node positions are seeded on a ring so a force layout never starts
 * fully coincident (a deterministic layout overwrites them).
 */
declare function schemaToMetaGraph(schema: GraphSchema, { nodeMode, edgeRouting }?: SchemaMetaGraphOptions): SchemaMetaGraph;

/**
 * The id of the metagraph layer inside `SchemaViewPanel`. Target it from extra
 * behaviours/layers passed as `children` — e.g.
 * `<HoverActivateBehaviour targetLayerId={SCHEMA_METAGRAPH_LAYER_ID} />`.
 */
declare const SCHEMA_METAGRAPH_LAYER_ID = "schema";
/** Shared `SchemaViewPanel` props — everything except the mutually-exclusive source. */
interface SchemaViewPanelBaseProps extends UseDerivedSchemaOptions {
    /**
     * Injected layout factories (`{ key: () => new SomeLayout() }`) — the consumer
     * owns the layout packages. Supplying this shows the layout picker. Omit to show
     * the metagraph at its seeded positions.
     */
    layouts?: Record<string, LayoutFactory>;
    /** Labels for the injected layouts (`{ key: label }`). Defaults to the keys. */
    layoutLabels?: Record<string, string>;
    /** Optional per-layout icons for the picker. */
    layoutIcons?: Record<string, ToolbarIcon>;
    /** Initial layout key. Default: the first injected layout. */
    defaultLayout?: string;
    /** Initial node-render mode. Default `'simple'`. */
    defaultNodeMode?: SchemaNodeMode;
    /** Initial edge routing. Default `'straight'`. */
    defaultEdgeRouting?: SchemaEdgeRouting;
    /** Show the top-left `SchemaToolbar`. Default `true`. */
    showToolbar?: boolean;
    /** Auto-fit padding (screen px) after an injected layout. Default `60`. */
    fitPadding?: number;
    /**
     * Extra canvas-react children mounted inside the metagraph's `<GraphCanvas>` —
     * behaviours, layers, overlays. Target the metagraph layer via
     * {@link SCHEMA_METAGRAPH_LAYER_ID} (e.g.
     * `<HoverActivateBehaviour targetLayerId={SCHEMA_METAGRAPH_LAYER_ID} />`).
     */
    children?: ReactNode;
    /** Extra classes on the root. */
    className?: string;
}
/**
 * `SchemaViewPanel` props — provide **exactly one** schema source (they're mutually
 * exclusive; the type enforces it and a dev warning fires at runtime if both are
 * passed):
 * - **`canvas`** — derive/read the schema from a live source canvas (its
 *   authoritative `store.schema` if set, else the schema of the loaded data), or
 * - **`schema`** — render an explicit, externally-sourced schema (e.g. a fetched
 *   Neo4j / GraphQL / ontology schema); no canvas needed.
 */
type SchemaViewPanelProps = SchemaViewPanelBaseProps & ({
    /** The source canvas whose schema is shown (null until `<Canvas>` publishes it). */
    canvas: GraphCanvas | null;
    schema?: never;
} | {
    /** An explicit, externally-sourced schema to render. */
    schema: GraphSchema;
    canvas?: never;
});
/**
 * Renders the derived schema of `canvas` as an interactive metagraph — node types
 * as simple discs or composite ER cards, edge types as their connections — with a
 * `SchemaToolbar` for node mode / layout (when injected) / edge routing / fit, and
 * standard zoom controls. Shows a compact empty state until the source graph has
 * data. Drop it into a panel / tab and hand it the live source `canvas`.
 */
declare function SchemaViewPanel({ canvas, schema: explicitSchema, layerId, nodeTypeOf, edgeTypeOf, layouts, layoutLabels, layoutIcons, defaultLayout, defaultNodeMode, defaultEdgeRouting, showToolbar, fitPadding, children, className, }: SchemaViewPanelProps): react.JSX.Element;

/**
 * Shared colour palette offered as swatch presets on every colour field across
 * the editors (node fill / stroke / label, and the upcoming edge / canvas
 * surfaces). Hex strings so a seeded `#rrggbb` value highlights its matching
 * preset. A specific editor can pass its own palette instead where it matters.
 */
declare const COLOR_PRESETS: readonly [{
    readonly label: "Slate";
    readonly value: "#9ca3af";
}, {
    readonly label: "Red";
    readonly value: "#ef4444";
}, {
    readonly label: "Amber";
    readonly value: "#f59e0b";
}, {
    readonly label: "Emerald";
    readonly value: "#10b981";
}, {
    readonly label: "Blue";
    readonly value: "#3b82f6";
}, {
    readonly label: "Violet";
    readonly value: "#8b5cf6";
}];

/**
 * Colour conversion helpers. `NodeStyle` (and the rest of the engine) stores
 * colours as 24-bit RGB numbers (`0xRRGGBB`); HTML `<input type="color">` and
 * the design-kit colour swatch use `#rrggbb` strings. These bridge the two.
 */
declare function numberToHex(n: number | undefined): string;
declare function hexToNumber(hex: string): number;

interface ControlPanelsProps {
    /** Extra / overriding icons by name, merged over {@link DEFAULT_CONTROL_ICONS}. */
    icons?: Record<string, ToolbarIcon>;
    /** Extra / overriding widgets by name, merged over {@link DEFAULT_CONTROL_WIDGETS}. */
    widgets?: Record<string, ControlWidget>;
    /** Stacking order over the canvas. Default `5`. */
    zIndex?: number;
    /** Explicit canvas; defaults to the context canvas. */
    canvas?: Canvas | null;
}
/**
 * Draws every **canvas-placed control panel** in the canvas's
 * `definition.controlPanels` — the UI projection of the panel specs, however
 * they got there (`<ControlPanel>` children, `canvas.update({ controlPanels })`,
 * an imported state, the Studio). Panels with a `header-*` placement are left to
 * {@link HeaderControlPanels}; a custom shell that doesn't mount it won't show
 * them.
 *
 * Mount it once **inside** the `<Canvas>` / `<GraphCanvas>` (whose host is the
 * positioned ancestor the panels pin to). `GraphCanvasApp` mounts it for you.
 * Item names resolve against the canvas's `commands` registry and the
 * {@link ControlPanelsProps.icons icon} / {@link ControlPanelsProps.widgets widget}
 * registries; an unknown widget renders nothing and an unknown icon falls back
 * to the item's text.
 */
declare function ControlPanels({ icons, widgets, zIndex, canvas }: ControlPanelsProps): ReactNode;

/** A rail region a panel can be placed in — left, centre or right. */
type HeaderRegion = 'left' | 'center' | 'right';
/** An app-shell rail that draws placed panels. */
type ControlPanelRail = 'header' | 'footer';
interface RegionControlPanelsProps {
    /** The rail to draw for. */
    rail: ControlPanelRail;
    /** The region to draw — panels whose `placement` is `<rail>-<region>`. */
    region: HeaderRegion;
    /** Extra / overriding icons by name, merged over `DEFAULT_CONTROL_ICONS`. */
    icons?: Record<string, ToolbarIcon>;
    /** Extra / overriding widgets by name, merged over `DEFAULT_CONTROL_WIDGETS`. */
    widgets?: Record<string, ControlWidget>;
    /** Explicit canvas; defaults to the context canvas. */
    canvas?: Canvas | null;
}
type HeaderControlPanelsProps = Omit<RegionControlPanelsProps, 'rail'>;
/**
 * Whether any **visible** panel in `panels` is placed in `rail` — what a shell
 * reads to show an otherwise empty rail (`GraphCanvasApp`'s footer).
 */
declare function hasRailControlPanels(panels: Readonly<Record<string, ControlPanelSpec>>, rail: ControlPanelRail): boolean;
/**
 * Draws the **rail-placed control panels** of one region of the header or
 * footer — every visible panel in `definition.controlPanels` whose `placement`
 * is `<rail>-<region>`, in insertion order, as inline rows. So controls the
 * Studio puts in the header or footer save and restore with the canvas like any
 * other panel.
 *
 * `GraphCanvasApp` renders it in each header and footer region (after the
 * region's own content). A custom shell renders one per region where its rails
 * live; it must sit under the canvas root's context, or be given `canvas`.
 */
declare function RegionControlPanels({ rail, region, icons, widgets, canvas }: RegionControlPanelsProps): ReactNode;
/**
 * The header-placed control panels of one header region —
 * `<RegionControlPanels rail="header">`.
 */
declare function HeaderControlPanels(props: HeaderControlPanelsProps): ReactNode;

interface UseControlItemsOptions {
    /** Extra / overriding icons by name, merged over {@link DEFAULT_CONTROL_ICONS}. */
    icons?: Record<string, ToolbarIcon>;
    /** Extra / overriding widgets by name, merged over {@link DEFAULT_CONTROL_WIDGETS}. */
    widgets?: Record<string, ControlWidget>;
    /** Explicit canvas; defaults to the context canvas. */
    canvas?: Canvas | null;
}
/**
 * Resolve control-item **specs** into live {@link ToolbarItem}s — the one
 * spec → pixels mapping behind both `<ControlPanels>` (floating, saved) and the
 * `*Toolbar`s (header content). Commands resolve against the canvas's
 * `commands` registry (enabled / active / value / options stay live), icons
 * and widgets against the registries, and slots against `<ControlPanel>`
 * children.
 *
 * A `command` / `toggle` item whose command isn't registered draws disabled
 * with " (unavailable)" on its label (tooltip + `aria-label`); dev builds also
 * warn once, naming the provider that usually registers it. A `choice` over an
 * unregistered command has no options, so it draws nothing (and warns too).
 *
 * Returns plain `ToolbarItem`s, so a caller can still apply icon overrides,
 * append its own items, or filter before handing them to `<ToolbarItems>`.
 * `items` may be rebuilt every render.
 */
declare function useControlItems(items: readonly ControlItemSpec[], { icons, widgets, canvas }?: UseControlItemsOptions): ToolbarItem[];
interface ControlItemsProps extends UseControlItemsOptions {
    /** The control specs to draw — a `*_CONTROL_ITEMS` preset or your own. */
    items: readonly ControlItemSpec[];
    /** Flow. Default `'horizontal'`. */
    orientation?: 'horizontal' | 'vertical';
    /** Side tooltips open on. */
    tooltipSide?: TooltipSide;
    /** Plain `ToolbarItem`s appended after the specs (closures, custom renders). */
    extra?: readonly ToolbarItem[];
    /** Class on the `<ToolbarItems>` root. */
    className?: string;
}
/**
 * Draw control-item specs as a toolbar row, **in place** — no floating panel,
 * nothing written to the canvas definition. Use it wherever a `ReactNode` goes
 * (a `GraphCanvasApp` header slot, a side rail, your own chrome):
 *
 * ```tsx
 * <GraphCanvasApp header={{ right: <ControlItems items={GRAPH_CONTROL_ITEMS} /> }} … />
 * ```
 *
 * To float the same items over the canvas *and* save them with it, use
 * `<ControlPanel items={…}>` instead.
 */
declare function ControlItems({ items, orientation, tooltipSide, extra, className, ...opts }: ControlItemsProps): ReactNode;

/**
 * The default **icon registry** for control panels: the names a serialised
 * `ControlItemSpec.icon` may use, mapped to lucide glyphs. Kebab-case, named for
 * the glyph (not the command), so one icon can serve several commands. Extend or
 * override per app via `<ControlPanels icons={…}>`.
 */
declare const DEFAULT_CONTROL_ICONS: Readonly<Record<string, ToolbarIcon>>;

/**
 * A command name a control spec may name: every engine and graph command
 * (offered for completion), or any other string — an app's own commands, or a
 * name registered by a provider. Persisted specs keep plain `string`.
 */
type ControlCommandName = CommandName<GraphCanvasCommandMap>;
/** `T` with its `command` field (when it has one) typed as {@link ControlCommandName}. */
type WithCommandName<T> = T extends {
    command: string;
} ? Omit<T, 'command'> & {
    command: ControlCommandName;
} : T;
/**
 * A {@link ControlItemSpec} as an author writes it: the same JSON, with the
 * `command` field completing the known command names.
 */
type AuthoredControlItemSpec = WithCommandName<ControlItemSpec>;
/**
 * Identity helper for authoring control specs in code — `defineControlItems([…])`
 * gives the `command` fields name completion (engine + graph commands) without
 * narrowing what's accepted. Returns the items unchanged, typed as the
 * persisted `ControlItemSpec[]`.
 */
declare function defineControlItems(items: readonly AuthoredControlItemSpec[]): readonly ControlItemSpec[];

/** Zoom in · live zoom % · zoom out. */
declare const ZOOM_CONTROL_ITEMS: readonly ControlItemSpec[];
/**
 * The view bar — zoom in / out, fit to content, lock view. The serialisable
 * counterpart of `ViewToolbar`; lock disables `pan` + `drag-node` (the
 * `view.lock` default) and leaves wheel zoom live.
 */
declare const VIEW_CONTROL_ITEMS: readonly ControlItemSpec[];
/**
 * Undo · redo — graph edits and Studio edits on a `GraphCanvas` (Studio edits
 * alone on a plain `Canvas`). The counterpart of `HistoryToolbar`.
 */
declare const HISTORY_CONTROL_ITEMS: readonly ControlItemSpec[];
/**
 * Cut · copy · paste · delete the selection, undoably — built into every
 * `GraphCanvas` (a plain `Canvas` needs a `<GraphClipboardProvider>`). The
 * counterpart of `EditToolbar`.
 */
declare const EDIT_CONTROL_ITEMS: readonly ControlItemSpec[];
/** Click / brush / lasso selection mode. Options come from the `select.mode` command. */
declare const SELECT_MODE_CONTROL_ITEMS: readonly ControlItemSpec[];
/** Edge routing for the `graph` layer. Options come from the `graph.edgeType` command. */
declare const EDGE_TYPE_CONTROL_ITEMS: readonly ControlItemSpec[];
/**
 * Pick a **registered** layout (`canvas.layouts`) · Run, which reads Stop while
 * a layout runs (`layout.toggle`). Factory layouts passed to
 * `GraphControlsToolbar` aren't serialisable and stay a toolbar feature.
 */
declare const LAYOUT_CONTROL_ITEMS: readonly ControlItemSpec[];
/** Background grid on/off (the `'background'` layer). The counterpart of `GridToolbar`. */
declare const GRID_CONTROL_ITEMS: readonly ControlItemSpec[];
/**
 * The full graph bar — the serialisable counterpart of `GraphControlsToolbar`:
 * layout · undo / redo · select mode · edge routing · delete · fit / lock · grid.
 */
declare const GRAPH_CONTROL_ITEMS: readonly ControlItemSpec[];
/**
 * Pan ← ↑ ↓ → one step (80 px) · reset. Each arrow reveals what lies that way,
 * so the content moves the other way (`camera.pan` moves the content by `dx`/`dy`).
 */
declare const PAN_CONTROL_ITEMS: readonly ControlItemSpec[];
/** The arrows + reset as one 3×3 pad (the `pan-pad` widget). Set `options.step` to change the step. */
declare const PAN_PAD_CONTROL_ITEMS: readonly ControlItemSpec[];
/** Zoom out · a zoom-level picker (25–400 %) · zoom in · 100 %. */
declare const ZOOM_LEVEL_CONTROL_ITEMS: readonly ControlItemSpec[];
/**
 * Turn each camera gesture on / off through `behaviour.toggle`: drag-pan
 * (`pan`), wheel zoom (`zoom`) and keyboard camera (`keyboard-camera`) — the
 * canvas-react wrappers' default ids. A behaviour that isn't registered renders
 * disabled; for other ids, copy the items and change `args.id`.
 */
declare const INPUT_CONTROL_ITEMS: readonly ControlItemSpec[];
/** Pan pad · zoom in / readout / out · fit — every way to move the camera, in one panel. */
declare const NAVIGATION_CONTROL_ITEMS: readonly ControlItemSpec[];
/** Theme light / dark. Needs `<CanvasThemeSync>` under a `<ThemeProvider>` (`GraphCanvasApp` mounts both). */
declare const THEME_CONTROL_ITEMS: readonly ControlItemSpec[];
/** A plain canvas: zoom in / out · fit · reset · lock · grid. Engine commands only. */
declare const CANVAS_CONTROL_ITEMS: readonly ControlItemSpec[];
/**
 * Read-only graph exploring: layout · select mode · edge routing · fit · lock.
 * No history or delete — nothing here edits the graph. Needs a `GraphCanvas`.
 */
declare const EXPLORER_CONTROL_ITEMS: readonly ControlItemSpec[];
/**
 * Graph modelling: tool (select / add / connect / delete) · node shape (while
 * adding) · undo / redo · delete selection · clear · fit. The serialisable
 * counterpart of `ModellerToolbar`. The tool works on any `GraphCanvas`; draw
 * behaviours follow it through their `modes`. Undo and delete
 * are built into `GraphCanvas`. Give the shape picker its kinds by copying the item
 * with `args: { kinds: { circle: 'Circle', … } }`.
 */
declare const MODELLER_CONTROL_ITEMS: readonly ControlItemSpec[];

/** Light / dark colour scheme for the shell + engine theme patches. */
type ThemeKind = 'light' | 'dark';
/**
 * The live state the orchestrator owns and threads to header controls — a custom
 * `toolbar` / `themeToggle` slot is handed this so it can drive the genuinely
 * cross-region wiring (theme: shell class + engine patch) without prop-drill.
 * Everything else (backend, hover-magnet, dev overlay, …) is a plain `config`
 * setting or a composed layer — none is special-cased here.
 */
interface GraphCanvasAppControlContext {
    /** Live engine, or `null` until every layer / behaviour has registered. */
    canvas: GraphCanvas | null;
    /** Active colour scheme. */
    themeKind: ThemeKind;
    /** Flip {@link themeKind} (shell class + engine patch follow). */
    toggleTheme: () => void;
}
/**
 * The bundle's default config — **every** per-instance setting lives here, keyed
 * by the id the bundle registers each class under, and is deep-merged under any
 * consumer `config`. So a consumer tunes the graph **entirely** through `config`
 * (styles, resolver functions, force params, behaviour options, which are
 * enabled, the active layout, …) — there are no bespoke app props for any of it.
 * Theme colours are pushed separately by the in-app light/dark toggle.
 *
 * **Exported as `graphCanvasAppBaseConfig`** so you can define shared defaults
 * once and reuse them across canvases — `deepMerge(graphCanvasAppBaseConfig, {…})`
 * → pass as `config` to any `<GraphCanvasApp>`. Note it's keyed by the bundle's
 * ids (`graph` · `hover` · `graph-force` · …), so it only applies to a canvas that
 * registers those same ids (i.e. the app bundle) — a differently-composed
 * `<GraphCanvas>` needs config keyed by *its* ids. Treat as read-only (merge,
 * don't mutate).
 */
declare const BASE_CONFIG: CanvasConfig;
/** Props of {@link GraphCanvasAppRoot}: the engine, and the box it scopes. */
interface GraphCanvasAppRootProps {
    /** The graph to render. Reactive — a new reference re-seeds + re-lays-out. */
    data: GraphData;
    /**
     * **The single settings surface.** Serialisable canvas config keyed by id,
     * deep-merged over {@link BASE_CONFIG} (or used as-is when `bundle` is
     * `false`). Keep the reference stable.
     */
    config?: CanvasConfig;
    /**
     * Mount the default graph bundle (background · graph · colour · d3-force · the
     * camera / selection behaviours). Default `true`. `false` = compose your own
     * graph from the surface's `children`.
     */
    bundle?: boolean;
    /** Re-key token (e.g. a streaming reset) — remounts the engine on change. */
    instanceKey?: string | number;
    /** Receives the live engine once every layer / behaviour has registered (or `null`). */
    onReady?: (canvas: GraphCanvas | null) => void;
    /** Per-frame performance metrics sink — see `GraphCanvasAppProps.telemetry`. */
    telemetry?: CanvasTelemetryConfig;
    /** Pin the render backend. Read once at init — re-key with {@link instanceKey}. */
    preference?: RenderPreference;
    /** `true` = console performance metrics, unless {@link telemetry} is given. */
    debug?: boolean;
    /** Extra icons / widgets the control panels may name (merged over the defaults). */
    controlPanels?: Pick<ControlPanelsProps, 'icons' | 'widgets'>;
    /** Convenience width (number → px). Default: fill the parent. */
    width?: number | string;
    /** Convenience height (number → px). Default: fill the parent. */
    height?: number | string;
    /** Inline style on the scoped root (merged over the size defaults). */
    style?: CSSProperties;
    /** Class on the scoped root. */
    className?: string;
    /**
     * Wrap the whole tree (above the lifted context) — hoist providers here. The
     * required `<ThemeProvider>` must sit *above* the root itself.
     */
    wrap?: (node: ReactNode) => ReactNode;
    /**
     * The layout. Place one {@link GraphCanvasAppSurface} somewhere inside it;
     * everything else here resolves the engine via context or {@link useGraphCanvasApp}.
     */
    children?: ReactNode;
}
/**
 * Owns one graph engine and scopes it: the live `canvas` state, the config
 * merge, telemetry, the lifted `CanvasContext` / `GraphCanvasContext` (so every
 * sibling of the surface resolves the same instance), and a theme- and
 * keyboard-scoped root box. It draws nothing itself; a
 * {@link GraphCanvasAppSurface} placed inside draws the engine.
 *
 * Reads light/dark from the host `@invana/themes` `<ThemeProvider>`, a required
 * ancestor.
 */
declare function GraphCanvasAppRoot({ data, config, bundle, instanceKey, onReady, telemetry: telemetryProp, preference, debug, controlPanels, width, height, style, className, wrap, children, }: GraphCanvasAppRootProps): react.JSX.Element;
/** Props of {@link GraphCanvasAppSurface}. */
interface GraphCanvasAppSurfaceProps {
    /**
     * Extra in-canvas children. With the default bundle they're **appended**; with
     * `bundle={false}` on the root they're the replacement graph.
     */
    children?: ReactNode;
}
/**
 * Draws the engine owned by the nearest {@link GraphCanvasAppRoot}: the `<Canvas>`
 * host, the default bundle, the control panels, and the ready-bridge that lifts
 * the live engine to the root. Place exactly one per root; it fills its parent.
 */
declare function GraphCanvasAppSurface({ children }: GraphCanvasAppSurfaceProps): react.JSX.Element;
/**
 * The nearest {@link GraphCanvasAppRoot}'s control context — the live `canvas`
 * (`null` until ready), the theme kind and its toggle. The same object
 * `GraphCanvasApp` hands its header / footer / region slots.
 */
declare function useGraphCanvasApp(): GraphCanvasAppControlContext;

/**
 * Header rail builder for {@link GraphCanvasApp}. Produces the `NavHorizontalProps`
 * handed to `AppLayoutV2.header` — a `@invana/ui` `NavHorizontal` carrying three
 * regions (`left` · `center` · `right`) composed into **one balanced bar** so the
 * centre sits at the bar's true geometric centre regardless of the side widths.
 *
 * `AppLayoutV2` renders the `NavHorizontal` itself, so this is a *builder* (props
 * in → `NavHorizontalProps` out), not a component — that's why the shell can't
 * double-wrap a `NavHorizontal` inside another.
 *
 * There's **no** baked "toolbar" / "theme toggle" concept — compose whatever you
 * want into the slots (a toolbar in `center`, a theme toggle in `right`, …). A
 * slot may be a node or a render-fn handed the live
 * {@link GraphCanvasAppControlContext}, so a control built in a slot can drive the
 * app. `title` is a convenience default for `left`. After each region's slot come
 * the control panels saved into that region (`ControlPanelSpec.placement`
 * `'header-left' | 'header-center' | 'header-right'`), drawn by
 * {@link HeaderControlPanels} — so header controls authored in the Studio save
 * and restore with the canvas. Shared types are imported
 * **type-only** from `./GraphCanvasApp` (erased at runtime → no import cycle).
 */

/** Public header option bag (the orchestrator's `header` prop). */
interface GraphCanvasAppHeaderOptions {
    /** Brand content — the default `left`. Default `'Graph'`. */
    title?: ReactNode;
    /** Header-left. Default: the {@link title}. */
    left?: RegionSlot;
    /** Header-center — compose a toolbar here. */
    center?: RegionSlot;
    /** Header-right — compose a theme toggle, actions, … here. */
    right?: RegionSlot;
    /** Class on the `NavHorizontal` bar. */
    className?: string;
}

/**
 * Footer rail builder for {@link GraphCanvasApp}. Produces the `NavHorizontalProps`
 * handed to `AppLayoutV2.footer` — a `@invana/ui` `NavHorizontal` with three slots
 * (`left` · `center` · `right`).
 *
 * `AppLayoutV2` renders the `NavHorizontal` itself, so this is a *builder* (props
 * in → `NavHorizontalProps` out), not a component.
 *
 * Like the header, there's no baked content — compose whatever you want into the
 * slots: drop `<GraphStatusBar/>` on the left, `<CanvasMessageBar/>` on the right,
 * live stats wherever. A slot may be a node or a render-fn handed the live
 * {@link GraphCanvasAppControlContext}. After each slot come the control panels
 * saved into that region (`placement: 'footer-<region>'`), as in the header.
 * Shared types are imported **type-only**
 * from `./GraphCanvasApp` (erased at runtime → no cycle).
 */

/** Public footer option bag (the orchestrator's `footer` prop). */
interface GraphCanvasAppFooterOptions {
    /** Footer-left — e.g. `<GraphStatusBar/>`. */
    left?: RegionSlot;
    /** Footer-center. */
    center?: RegionSlot;
    /** Footer-right — e.g. `<CanvasMessageBar/>`. */
    right?: RegionSlot;
    /** Class on the `NavHorizontal` bar. */
    className?: string;
}

/**
 * Content for a slot in one of the app's regions (header / footer): a static
 * node, or a render fn handed the live {@link GraphCanvasAppControlContext}.
 * Providing the slot **replaces** that region's default content (no append).
 */
type RegionSlot = ReactNode | ((ctx: GraphCanvasAppControlContext) => ReactNode);
/**
 * Config for one of the app's **resizable side regions** (`right` / `bottom`) —
 * an `AppLayoutV2` section. `content` is the panel body (a node or a render-fn
 * handed the live {@link GraphCanvasAppControlContext}); the size fields drive the
 * initial / min / max split (percent numbers or CSS sizes) and `collapsible` lets
 * the drag handle collapse it. Providing the bag mounts the region; omitting it
 * (the default) hides it and the canvas takes the space.
 */
interface GraphCanvasAppSectionOptions {
    /** Panel body — a node, or `(ctx) => node` (note `ctx.canvas` may be `null` before ready). */
    content?: RegionSlot;
    /** Initial size of the panel (percent number, or a CSS size string). */
    defaultSize?: number | string;
    /**
     * Minimum size the drag handle allows (percent number, or a CSS size string).
     * Defaults to `'0px'` — the panel can shrink all the way — instead of the
     * layout's built-in per-region minimum. Set it to impose a floor.
     */
    minSize?: number | string;
    /** Maximum size the drag handle allows. */
    maxSize?: number | string;
    /** Allow the drag handle to fully collapse the panel. Default `true`. */
    collapsible?: boolean;
    /** Class on the panel body wrapper. */
    className?: string;
}
interface GraphCanvasAppProps {
    /** The graph to render. Reactive — a new reference re-seeds + re-lays-out. */
    data: GraphData;
    /**
     * **The single settings surface.** Serialisable canvas config keyed by id —
     * styles, behaviour options, resolver functions, force params, the active
     * layout, which behaviours are `enabled`, … — deep-merged over the baked bundle
     * defaults (or used as-is when `bundle` is `false`). Keep the reference stable.
     *
     * Includes the engine's `fitOnLoad` (default `true` here via the bundle) —
     * centre the graph once on load. Set `config={{ fitOnLoad: false }}` to opt out.
     */
    config?: CanvasConfig;
    /**
     * Mount the default graph bundle (background · graph · colour · d3-force · the
     * camera / selection behaviours, all configured via {@link config}). Default
     * `true`. Set `false` to compose your own graph entirely from `children` — the
     * one structural decision `config` can't express (it can't register classes).
     */
    bundle?: boolean;
    /** Re-key token (e.g. a streaming reset) — remounts the `<Canvas>` on change. */
    instanceKey?: string | number;
    /** Receives the live engine once every layer / behaviour has registered (or `null`). */
    onReady?: (canvas: GraphCanvas | null) => void;
    /**
     * Push per-frame performance metrics — FPS / frame-time / the CPU **phase
     * breakdown** (`camera` / `dataFlush` / `layers`) + dropped frames — to a
     * telemetry sink. Wires the kernel's `createFrameMetrics` speed-trace through
     * `new Canvas({ telemetry })`. `{ metrics: { meter } }` ships to a real backend
     * (OTLP → HyperDX via `@invana/canvas-telemetry-otel`, or `createHttpMeter`
     * for a local collector); `{ metrics: true }` prints to the console. See
     * {@link debug} for the shortcut.
     */
    telemetry?: CanvasTelemetryConfig;
    /**
     * Pin the render backend (`'webgl'` where WebGPU is known to crash, e.g.
     * WebKit). Read once at init — re-key with {@link instanceKey} to change it.
     * Default: auto-resolved (WebGPU, falling back to WebGL).
     */
    preference?: RenderPreference;
    /**
     * Debug shortcut: `true` turns on **console** performance metrics — equivalent
     * to `telemetry={{ metrics: true }}`. An explicit {@link telemetry} always wins,
     * so pass that (e.g. an OTLP meter) to ship the same metrics to a backend.
     */
    debug?: boolean;
    /** Show the header rail (a brand shows even with no other slots). Default `true`. */
    showHeader?: boolean;
    /**
     * Force the footer rail on/off. The footer has no default content, so it shows
     * automatically when you pass a `footer` bag or the canvas saves a visible
     * control panel with a `footer-*` placement; set `true` to render an empty
     * rail, or `false` to suppress it even then. Default: auto.
     */
    showFooter?: boolean;
    /** Convenience width (number → px). Default: fill the parent. */
    width?: number | string;
    /** Convenience height (number → px). Default: fill the parent. */
    height?: number | string;
    /** Inline style on the layout root (merged over the size defaults). */
    style?: CSSProperties;
    /** Class on the layout root. */
    className?: string;
    /** Header region — `title` + `left` / `center` / `right` slots. */
    header?: GraphCanvasAppHeaderOptions;
    /** Footer region — `left` / `center` / `right` slots. Auto-shown when given. */
    footer?: GraphCanvasAppFooterOptions;
    /**
     * The **right** region — a resizable/collapsible panel beside the canvas, the
     * natural home for settings / node-edge detail / editors. Omit to hide it (the
     * canvas takes the width). There is no left region by design.
     */
    right?: GraphCanvasAppSectionOptions;
    /**
     * The **bottom** region — a resizable/collapsible panel under the canvas, e.g. a
     * data table projecting the graph's `DataStore`. Omit to hide it. Spans per
     * {@link bottomSpan}.
     */
    bottom?: GraphCanvasAppSectionOptions;
    /**
     * Which columns the {@link bottom} panel spans: `'main-right'` (default — under
     * the canvas **and** the right panel), `'main'` (canvas only; right panel full
     * height beside it), or `'full'` (entire width). `'left-main'` is also accepted
     * but equals `'main'` here since there's no left region.
     */
    bottomSpan?: BottomSpan;
    /**
     * Wrap the whole app (above the lifted context) — hoist providers here. Note
     * the required `<ThemeProvider>` must sit *above* `<GraphCanvasApp>` itself
     * (the component reads `useTheme` before `wrap` runs), so it can't be supplied
     * through `wrap` — use `wrap` for any *other* providers the chrome consumes.
     */
    wrap?: (node: ReactNode) => ReactNode;
    /**
     * Extra in-canvas children. With the default bundle they're **appended**; with
     * `bundle={false}` they're the replacement graph.
     */
    children?: ReactNode;
    /**
     * Extra icons / widgets the control panels may name (merged over the
     * defaults). Declare panels as `<ControlPanel>` children or via
     * `config.controlPanels`; the app draws them over the canvas.
     */
    controlPanels?: Pick<ControlPanelsProps, 'icons' | 'widgets'>;
}
declare function GraphCanvasApp({ data, config, bundle, instanceKey, onReady, telemetry, preference, debug, showHeader, showFooter, width, height, style, className, header, footer, right, bottom, bottomSpan, wrap, controlPanels, children, }: GraphCanvasAppProps): react.JSX.Element;

interface CanvasControlsToolbarProps {
    /** Override the baked icons, by item key. */
    icons?: Partial<Record<'zoom-in' | 'zoom-out' | 'fit' | 'lock', ToolbarIcon>>;
    /** Stack direction. Default `'vertical'`. */
    orientation?: 'horizontal' | 'vertical';
    /** Layer id the fit-to-content button targets. Default `'graph'`. */
    fitLayerId?: string;
    /** Show zoom +/- buttons. Default `true`. */
    showZoom?: boolean;
    /** Show the fit-to-content button. Default `true`. */
    showFit?: boolean;
    /**
     * Controlled lock state. Lock is **not** auto-wired (what "locked" disables —
     * pan, node-drag, … — is app policy). Provide both `locked` and `onToggleLock`
     * to render the toggle.
     */
    locked?: boolean;
    onToggleLock?: () => void;
    /** Explicit canvas instance; forwarded to each smart control. Defaults to context canvas. */
    canvas?: Canvas | null;
    /** Extra controls appended after the presets — any React node. */
    children?: ReactNode;
    className?: string;
}
/**
 * Turnkey view controls — the canvas equivalent of React Flow's `<Controls>`.
 * Zoom +/- and fit are control specs (`camera.zoomIn` / `camera.zoomOut` /
 * `camera.fit`); lock stays **controlled** (pass `locked` + `onToggleLock`). Append extra
 * controls as `children`.
 *
 * @example
 * // in a header slot
 * header={{ right: <CanvasControlsToolbar orientation="horizontal" /> }}
 * // floating over the canvas
 * <ControlPanel id="controls" position="bottom-left"><CanvasControlsToolbar /></ControlPanel>
 */
declare function CanvasControlsToolbar({ icons, orientation, fitLayerId, showZoom, showFit, locked, onToggleLock, canvas, children, className, }: CanvasControlsToolbarProps): react.JSX.Element;

/** Per-section visibility. Omitted keys default on. */
interface SchemaToolbarSections {
    /** Simple ⇄ Table node mode. */
    nodes?: boolean;
    /** Layout picker (also requires `layoutOptions` to be supplied). */
    layout?: boolean;
    /** Edge routing picker. */
    edges?: boolean;
    /** Fit-to-content. */
    fit?: boolean;
}
interface SchemaToolbarProps {
    /** Current node-render mode. */
    nodeMode: SchemaNodeMode;
    onNodeModeChange: (mode: SchemaNodeMode) => void;
    /**
     * Layout picker: the selected key, the change handler, and the option labels
     * (`{ key: label }`). The layout section renders **only** when `layoutOptions`
     * is non-empty — so a viewer with no injected layouts shows no picker.
     */
    layout?: string;
    onLayoutChange?: (layout: string) => void;
    layoutOptions?: Record<string, string>;
    /** Optional per-layout icons for the segmented picker. */
    layoutIcons?: Record<string, ToolbarIcon>;
    /** Current edge routing. */
    edgeRouting: SchemaEdgeRouting;
    onEdgeRoutingChange: (routing: SchemaEdgeRouting) => void;
    /** Graph layer id the Fit button targets. Default `'graph'`. */
    layerId?: string;
    /** Subtract sections from the default set. */
    sections?: SchemaToolbarSections;
    /** Override the Fit icon. */
    icons?: Partial<Record<'fit', ToolbarIcon>>;
    /** Bar orientation. Default `'horizontal'`. */
    orientation?: 'horizontal' | 'vertical';
    /** Explicit canvas for Fit; defaults to the context (schema) canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * The schema metagraph's control bar — node mode · layout · edge routing · fit.
 * Controlled for the first three (the `SchemaViewPanel` owns them); Fit is a control spec.
 * Render inside the schema `<GraphCanvas>` so Fit resolves the right instance.
 */
declare function SchemaToolbar({ nodeMode, onNodeModeChange, layout, onLayoutChange, layoutOptions, layoutIcons, edgeRouting, onEdgeRoutingChange, layerId, sections, icons, orientation, canvas, className, }: SchemaToolbarProps): react.JSX.Element;

interface GraphToolbarProps {
    /** Layout switcher. */
    layout: string;
    layoutOptions: Record<string, string>;
    onLayoutChange: (value: string) => void;
    /** Selection-mode switcher (e.g. click / brush / lasso). */
    selectMode: string;
    selectModeOptions: Record<string, string>;
    onSelectModeChange: (value: string) => void;
    /**
     * Self-wiring edge-routing picker (straight / orthogonal / curved …) targeting
     * this `GraphLayer` id. Default `'graph'`; pass `null` to hide the picker.
     */
    edgeTypeLayerId?: string | null;
    /** Path types the edge picker exposes, in order. Default: straight / orth / bezier / rounded / smooth. */
    edgeTypes?: readonly EdgePathType[];
    /** Optional key → label map for the edge picker. */
    edgeTypeLabels?: Record<string, string>;
    /** Per-option icons for the edge picker (key → icon component). */
    edgeTypeIcons?: Record<string, ToolbarIcon>;
    /** Erase button — layer to clear. Default `'graph'`. */
    clearLayerId?: string;
    /** Eraser icon for the selection-aware erase button. */
    clearIcon: ToolbarIcon;
    /** Explicit canvas instance; forwarded to the self-wiring erase action. Defaults to context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * Turnkey **horizontal** graph toolbar: a callback-driven layout picker +
 * selection-mode picker + the self-wiring **Style Editor** edge-routing section
 * ({@link useStyleEditorSection}) + a selection-aware erase action. Compiled by
 * {@link ToolbarItems}. To float it over the canvas, put it in a `<ControlPanel>`.
 *
 * @deprecated Callback-driven, with no command behind its controls, so it can't
 * share the control-spec renderer. Use `GraphControlsToolbar`, or
 * `<ControlItems items={…}>` with the `*_CONTROL_ITEMS` presets. Kept for
 * compatibility; see `docs/rfcs/feat/2026-09-28-toolbars-and-control-panels-draw-controls-twice.md` D3.
 * Removal deferred to the next breaking release (rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic G1).
 */
declare function GraphToolbar({ layout, layoutOptions, onLayoutChange, selectMode, selectModeOptions, onSelectModeChange, edgeTypeLayerId, edgeTypes, edgeTypeLabels, edgeTypeIcons, clearLayerId, clearIcon, canvas, className, }: GraphToolbarProps): react.JSX.Element;

/**
 * `<GraphControlsToolbar>` / `<GraphControlsToolbarLite>` — turnkey **header
 * control bars** for a graph canvas, drawn as a single data-driven
 * `<ToolbarItems>`.
 *
 * Two presets cover ~80% of cases out of the box:
 *
 *   - **`GraphControlsToolbarLite`** — read-only-explorer controls: layout picker
 *     + run, zoom / fit / lock, select-mode, grid. No history / clipboard, so no
 *     providers are mounted.
 *   - **`GraphControlsToolbar`** (full) — the lite set plus undo/redo, the
 *     edge-routing style editor, and erase/clear. It self-wraps
 *     `GraphClipboardProvider` — a bridge to the `GraphCanvas`'s own clipboard
 *     for `layerId`, or the clipboard source itself on a plain `Canvas`. Undo
 *     is `canvas.history` on any canvas.
 *
 * Both share one core, so they never drift. The controls are **control specs**
 * drawn by `useControlItems` — the same commands a saved control panel runs
 * (`select.mode`, `graph.edgeType`, `history.*`, `graph.erase`, `camera.fit`,
 * `view.lock`, `background.grid`). The one exception is the factory-based
 * layout picker + Run/Stop: layout factories are closures (no serialisable
 * command can carry them) and a toolbar isn't saved, so those two items are
 * built straight from `useLayout` — with the same fields `useControlItems`
 * would produce. Extend for the other 20% by
 * toggling sections off (`sections={{ grid: false }}`) or injecting your own
 * items (`extraItems`), where you supply whatever icon you like per item. Need
 * something fully bespoke? Use `<ControlItems>` with your own specs.
 *
 * **Contract:** render where a live engine is resolvable — inside `<Canvas>`, or
 * under a lifted `GraphCanvasContext` whose value is non-null (gate on it). The
 * header apps render the toolbar only once `canvas` exists.
 *
 * Like every toolbar it renders its `<ToolbarItems>` content only, for a header
 * slot; float it with a `<ControlPanel>`. (Supersedes the callback-driven
 * {@link GraphToolbar} for header use.)
 */

/** Per-section visibility. Omitted keys default on (for that variant). */
interface GraphControlsSections {
    /** Undo / redo (full only). */
    history?: boolean;
    /** Layout picker + run. */
    layout?: boolean;
    /** Click / brush / lasso select-mode picker. */
    selectMode?: boolean;
    /** Edge-routing style editor (full only). */
    style?: boolean;
    /** Erase / clear (full only). */
    edit?: boolean;
    /** Zoom in / out · fit · lock. */
    view?: boolean;
    /** Grid toggle. */
    grid?: boolean;
}
interface GraphControlsToolbarProps {
    /** Graph layer id the controls target. Default `'graph'`. */
    layerId?: string;
    /** Layout-picker factories. Default a single `d3-force`. */
    layouts?: Record<string, LayoutFactory>;
    /** Labels for the layout picker. */
    layoutLabel?: Record<string, string>;
    /**
     * Apply the initial picked layout on mount. Default `false` — the host app's
     * active layout usually owns the first render; set `true` when using the
     * toolbar standalone so the graph lays out without a manual "Run" click.
     */
    applyInitialLayout?: boolean;
    /**
     * Override the baked icons, by item key. (Selects — layout / select-mode /
     * edge — carry their own per-option icons and aren't overridden here.)
     */
    icons?: Partial<Record<'undo' | 'redo' | 'run-layout' | 'erase' | 'fit' | 'lock' | 'grid', ToolbarIcon>>;
    /** Subtract sections from the variant's default set. */
    sections?: GraphControlsSections;
    /**
     * Extra items appended after the preset sections (divider-separated). Each item
     * carries its own `icon`, so this is also how you bring custom-iconed controls.
     */
    extraItems?: ToolbarItem[] | ((canvas: GraphCanvas | null) => ToolbarItem[]);
    /** Bar orientation. Default `'horizontal'` (header use). */
    orientation?: 'horizontal' | 'vertical';
    /** Class on the `<ToolbarItems>` root. */
    className?: string;
}
declare function GraphControlsToolbarLite(props: GraphControlsToolbarProps): ReactNode;
declare function GraphControlsToolbar(props: GraphControlsToolbarProps): ReactNode;

interface HistoryToolbarProps {
    /** Override the baked icons, by item key. */
    icons?: Partial<Record<'undo' | 'redo' | 'redraw', ToolbarIcon>>;
    /** Stack direction. Default `'horizontal'`. */
    orientation?: 'horizontal' | 'vertical';
    /** Append a redraw button after undo/redo. Default `true`. */
    showRedraw?: boolean;
    /** Layer the history / redraw target. Default `'graph'`. */
    layerId?: string;
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * History bar — undo / redo (`history.*`) plus an optional redraw button
 * (`graph.redraw`), drawn from control specs like a saved panel. Undo / redo
 * are `canvas.history` on any canvas — graph and definition edits alike.
 */
declare function HistoryToolbar({ icons, orientation, showRedraw, layerId, canvas, className, }: HistoryToolbarProps): react.JSX.Element;

interface EditToolbarProps {
    /** Override the baked icons, by item key. */
    icons?: Partial<Record<'cut' | 'copy' | 'paste' | 'erase', ToolbarIcon>>;
    /** Stack direction. Default `'horizontal'`. */
    orientation?: 'horizontal' | 'vertical';
    /** Show the erase button. Default `true`. */
    showClear?: boolean;
    /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
    clickSelectId?: string;
    /** Layer that erase / clipboard target. Default `'graph'`. */
    layerId?: string;
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * Editor bar — cut / copy / paste / erase (`clipboard.*` + `graph.erase`),
 * drawn from control specs like a saved panel. Erase is selection-aware (deletes the selection when something is
 * selected, otherwise clears the layer). Needs a `ClickSelectBehaviour`;
 * the clipboard is built into `GraphCanvas` (on a plain `Canvas`, mount
 * `<GraphClipboardProvider>`); undo is `canvas.history` everywhere.
 */
declare function EditToolbar({ icons, orientation, showClear, clickSelectId, layerId, canvas, className, }: EditToolbarProps): react.JSX.Element;

interface ViewToolbarProps {
    /** Override the baked icons, by item key. */
    icons?: Partial<Record<'zoom-in' | 'zoom-out' | 'fit' | 'lock', ToolbarIcon>>;
    /** Stack direction. Default `'vertical'`. */
    orientation?: 'horizontal' | 'vertical';
    /** Show the lock toggle. Default `true`. */
    showLock?: boolean;
    /** Layer the fit-to-content button targets. Default `'graph'`. */
    layerId?: string;
    /** Behaviour ids disabled while locked. Default `['pan', 'drag-node']`. */
    lockBehaviourIds?: string[];
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * View bar — zoom in / zoom out / fit-to-content / lock view, drawn from
 * control specs (`camera.zoomIn` / `camera.zoomOut` / `camera.fit` /
 * `view.lock`) — the same commands a saved control panel runs. Lock disables
 * pan + node drag by default while leaving zoom available.
 */
declare function ViewToolbar({ icons, orientation, showLock, layerId, lockBehaviourIds, canvas, className, }: ViewToolbarProps): react.JSX.Element;

type PatternType = NonNullable<BackgroundLayerOptions$1['patternType']>;
interface GridToolbarProps {
    /** Override the baked icon, by item key. */
    icons?: Partial<Record<'grid', ToolbarIcon>>;
    /** Stack direction. Default `'horizontal'`. */
    orientation?: 'horizontal' | 'vertical';
    /** Id of the `BackgroundLayer` to toggle. Default `'background'`. */
    backgroundLayerId?: string;
    /** Pattern to switch to when shown (e.g. `'grid'`); preserves existing if omitted. */
    patternType?: PatternType;
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * Grid toggle bar — shows/hides a `BackgroundLayer`'s pattern through the
 * `background.grid` command, like a saved panel's grid toggle.
 */
declare function GridToolbar({ icons, orientation, backgroundLayerId, patternType, canvas, className, }: GridToolbarProps): react.JSX.Element;

interface GraphLayoutToolbarProps {
    /** Map of layout key → factory producing a fresh layout instance. Memoize it. */
    layouts: Record<string, LayoutFactory>;
    /** Map of select-mode key → behaviour id (e.g. `{ click: 'click-select', ... }`). Memoize it. */
    selectModeBehaviourIds: Record<string, string>;
    /** Optional layout key → label map. Default: identity. */
    layoutLabels?: Record<string, string>;
    /** Optional select-mode key → label map. Default: identity. */
    selectModeLabels?: Record<string, string>;
    /** Optional select-mode key → icon map. Shown on the trigger and beside each option. */
    selectModeIcons?: Record<string, ToolbarIcon>;
    /** Initially-selected layout key. */
    initialLayout?: string;
    /** Initially-active select mode key. */
    initialSelectMode?: string;
    /**
     * Notified with the active select-mode key — on the initial mode and on every
     * switch. Lift it (e.g. to drive a footer hint bar). Memoize it.
     */
    onSelectModeChange?: (mode: string) => void;
    /** Target `GraphLayer` id. Default `'graph'`. */
    layerId?: string;
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * Graph controls — the **Layouts** section ({@link useLayoutsSection}) plus a
 * selection-mode picker (built inline off {@link useSelectMode}), separated by a
 * divider. The consumer supplies the layout factory map and the
 * mode→behaviour-id map (both live in consumer space, so this can't be turnkey).
 *
 * @deprecated Callback-driven, with no command behind its controls, so it can't
 * share the control-spec renderer. Use `GraphControlsToolbar`, or
 * `<ControlItems items={…}>` with the `*_CONTROL_ITEMS` presets. Kept for
 * compatibility; see `docs/rfcs/feat/2026-09-28-toolbars-and-control-panels-draw-controls-twice.md` D3.
 * Removal deferred to the next breaking release (rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic G1).
 */
declare function GraphLayoutToolbar({ layouts, selectModeBehaviourIds, layoutLabels, selectModeLabels, selectModeIcons, initialLayout, initialSelectMode, onSelectModeChange, layerId, canvas, className, }: GraphLayoutToolbarProps): react.JSX.Element;

interface ModellerToolbarProps {
    /** Override the baked tool / undo / redo / erase icons, by item key. */
    icons?: Partial<Record<'select' | 'add' | 'connect' | 'delete' | 'undo' | 'redo' | 'erase', ToolbarIcon>>;
    /** Which tool toggles to show, in order. Default `['select','add','connect','delete']`. */
    tools?: readonly GraphTool[];
    /** Override the tool tooltips / accessible labels. */
    labels?: Partial<Record<GraphTool, string>>;
    /**
     * Node-kind options for the **Add** tool's shape picker (key → label). The
     * picker shows only while the Add tool is active.
     */
    nodeKinds?: Record<string, string>;
    /** Per-kind icons for the shape picker — domain-specific, so supplied by the consumer. */
    nodeKindIcons?: Record<string, ToolbarIcon>;
    /** Show undo / redo. Default `true`. */
    showHistory?: boolean;
    /** Show the erase button. Default `true`. */
    showClear?: boolean;
    /** Layer the erase / history actions target. Default `'graph'`. */
    layerId?: string;
    /** Stack direction. Default `'horizontal'`. */
    orientation?: 'horizontal' | 'vertical';
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * Turnkey **drawing / modeller** toolbar — tool toggles (Select / Add / Connect
 * / Delete) plus an optional Add-tool shape picker, undo/redo, and erase, with
 * dividers between groups. Tool state self-wires through {@link useTool} — the
 * canvas store's `interaction.viewMode`, reached through a `<GraphToolProvider>`
 * or the enclosing canvas root. Every control is a control spec (`tool.active`
 * per tool, `tool.nodeKind`, `history.*`, `graph.erase`) drawn like a saved
 * panel's (undo / redo are `canvas.history`, live on any canvas). The consumer still
 * declares the drawing behaviours — give each `modes` (e.g. `modes: ['connect']`)
 * and they follow the tool on their own. Only the per-kind shape-picker icons
 * (`nodeKindIcons`) are consumer-supplied, since those are domain-specific.
 */
declare function ModellerToolbar({ icons, tools, labels, nodeKinds, nodeKindIcons, showHistory, showClear, layerId, orientation, canvas, className, }: ModellerToolbarProps): react.JSX.Element;

interface ExportImageToolbarProps {
    /** Restrict / reorder the offered formats. Default: all four (PNG/JPG/WebP/SVG). */
    formats?: ExportImageFormatKey[];
    /** Seed the menu's initial settings. Merged over the built-in defaults. */
    defaultValue?: Partial<ExportImagePanelValue>;
    /** Download filename stem. The area + format extension are appended. Default `'canvas'`. */
    filename?: string;
    /** Trigger tooltip / aria-label + the menu heading. Default `'Export'`. */
    label?: string;
    /** Optional visible text beside the trigger icon (renders a labelled button). */
    triggerText?: string;
    /** Override the trigger icon (lucide by default). */
    triggerIcon?: ToolbarIcon;
    /** Hover-card alignment relative to the trigger. Default `'end'`. */
    align?: 'start' | 'center' | 'end';
    /** ms before the card opens on hover. Default `120`. */
    openDelay?: number;
    /** ms before it closes after the pointer leaves. Default `200`. */
    closeDelay?: number;
    /** Explicit canvas instance; defaults to the `<Canvas>` context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * Export menu — a single toolbar **nav item** that reveals the full export
 * options on hover. The trigger is a ghost icon button; hovering it opens a
 * hover-card holding an {@link ExportImagePanel} (format as a horizontal segmented
 * row, plus area / background / scale / aspect ratio) and a **Save as Image**
 * button that exports the current view via {@link useCanvasImageExport}.
 *
 * Self-wiring: pulls the engine from the `<Canvas>` context (or an explicit
 * `canvas` prop). Raster formats capture through the renderer; `'svg'` emits a
 * true vector document. Drop the trigger into any toolbar
 * chrome; to float it over the canvas, put it in a `<ControlPanel>`.
 */
declare function ExportImageToolbar({ formats, defaultValue, filename, label, triggerText, triggerIcon: TriggerIcon, align, openDelay, closeDelay, canvas, className, }: ExportImageToolbarProps): react.JSX.Element;

interface ExportStateToolbarProps {
    /** Download filename stem. `.json` is appended. Default `'canvas-state'`. */
    filename?: string;
    /** Trigger tooltip / aria-label + the menu heading. Default `'Canvas State'`. */
    label?: string;
    /**
     * Initial state of the "restore view" toggle — whether importing also
     * restores the live view (camera / selection / hover). Default `true`. Set
     * `false` to load only definition + data by default. Pass `showRestoreToggle
     * = false` to hide the toggle and lock this behaviour.
     */
    restoreView?: boolean;
    /** Show the "restore view" toggle in the menu. Default `true`. */
    showRestoreToggle?: boolean;
    /** Optional visible text beside the trigger icon (renders a labelled button). */
    triggerText?: string;
    /** Override the trigger icon (lucide `FileJson` by default). */
    triggerIcon?: ToolbarIcon;
    /** Hover-card alignment relative to the trigger. Default `'end'`. */
    align?: 'start' | 'center' | 'end';
    /** ms before the card opens on hover. Default `120`. */
    openDelay?: number;
    /** ms before it closes after the pointer leaves. Default `200`. */
    closeDelay?: number;
    /** Explicit canvas instance; defaults to the `<Canvas>` context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * Save / load menu for the **full canvas state as JSON** — a single toolbar
 * **nav item** that reveals the state actions on hover. The trigger is a ghost
 * icon button; hovering it opens a hover-card holding an {@link ExportStatePanel}
 * with **Download JSON** (serialise the whole scene — view definition +
 * interaction + per-layer node/edge data — and save it) and **Load JSON…**
 * (pick a file and restore it), plus a **Restore view** toggle.
 *
 * The JSON counterpart to the `ExportImageToolbar` (which produces an *image*).
 * Self-wiring: pulls the engine from the `<Canvas>` context (or an explicit
 * `canvas` prop) via {@link useCanvasStateJson}. Restore applies onto the
 * canvas's already-registered layers/behaviours/layouts (import addresses
 * instances by id — it doesn't create them). Drop the trigger into
 * any toolbar chrome; to float it over the canvas, put it in a `<ControlPanel>`.
 */
declare function ExportStateToolbar({ filename, label, restoreView, showRestoreToggle, triggerText, triggerIcon: TriggerIcon, align, openDelay, closeDelay, canvas, className, }: ExportStateToolbarProps): react.JSX.Element;

interface ClearCanvasToolbarProps {
    /** GraphLayer id to clear. Default `'graph'`. */
    targetLayerId?: string;
    /** Tooltip / aria-label. Default `'Clear canvas'`. */
    label?: string;
    /** Optional visible text beside the trigger icon (renders a labelled button). */
    triggerText?: string;
    /** Override the trigger icon (lucide `Trash2` by default). */
    triggerIcon?: ToolbarIcon;
    /** Side the tooltip is placed on. Default `'bottom'`. */
    tooltipSide?: TooltipSide;
    /** Explicit canvas instance; defaults to the `<Canvas>` context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * Clear-canvas action — a single toolbar **nav item** that wipes every node and
 * edge from the target `GraphLayer`. A ghost icon button with a tooltip;
 * clicking it calls {@link useClearGraph} (an undoable `history.transaction`
 * when there is a graph history — every `GraphCanvas` has one — else the
 * layer's fast `clear()`).
 *
 * Self-wiring: pulls the engine from the `<Canvas>` context (or an explicit
 * `canvas` prop). Pairs naturally with `ExportStateToolbar` — clear the scene,
 * then **Load JSON…** to restore a saved document. Drop the button into
 * any toolbar chrome; to float it over the canvas, put it in a `<ControlPanel>`.
 */
declare function ClearCanvasToolbar({ targetLayerId, label, triggerText, triggerIcon: TriggerIcon, tooltipSide, canvas, className, }: ClearCanvasToolbarProps): react.JSX.Element;

interface InspectorPanelProps {
    /** GraphLayer to read/write. Default `'graph'`. */
    layerId?: string;
    /** Id of the `ClickInspectBehaviour` the edit target is read from. Default `'click-inspect'`. */
    inspectId?: string;
    /** Where the panel pins. Default `'top-right'`. */
    position?: PanelPosition;
    /** Show the label field (nodes, non-`typeAsLabel` mode only). Default `true`. */
    showLabel?: boolean;
    /**
     * Modeller mode — edit a single `type` field on both nodes and edges that also
     * drives the drawn label. Hides the label field for both. Default `false`.
     */
    typeAsLabel?: boolean;
    /** Heading when a node is selected. Default `'Node'`. */
    nodeTitle?: string;
    /** Heading when an edge is selected. Default `'Edge'`. */
    edgeTitle?: string;
    /** Render the bare editor without the `<Panel>` wrapper. Default `false`. */
    bare?: boolean;
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas | null;
    className?: string;
}
/**
 * Self-wiring **inspector** — shows a {@link PropertiesEditor} for the single
 * node/edge the user clicked to edit and commits edits (label + `data`, plus
 * `type` + reverse for edges) back to the store undoably. The property-editing
 * analogue of `CanvasControlsToolbar`: drop it inside `<Canvas>` and it appears
 * whenever an element is clicked for editing, and renders nothing otherwise.
 *
 * Needs a `ClickInspectBehaviour` (for the click-to-edit target) and, for
 * undoable commits, a graph history (every `GraphCanvas` has one). Remounts the editor
 * (via `key`) when the targeted element changes, so the form reloads from it.
 */
declare function InspectorPanel({ layerId, inspectId, position, showLabel, typeAsLabel, nodeTitle, edgeTitle, bare, canvas, className, }: InspectorPanelProps): react.JSX.Element | null;

/**
 * Shared props for the engine-aware detail panels (`NodeDetailView` /
 * `EdgeDetailView`). Each maps a {@link ViewContext} to a `DetailCard` +
 * `PropertyDetailView`; these are the knobs they have in common.
 */
interface BaseDetailViewProps {
    /**
     * The clicked element's full context — passed in by the `panel` render-prop of
     * `<ClickViewBehaviour>`.
     */
    ctx: ViewContext;
    /** Show the element id as the card subtitle. Default `true`. */
    showId?: boolean;
    /**
     * Extra property renderers, tried before the built-ins — add or override a
     * data type with a single {@link PropertyRenderer} object. Forwarded to
     * `PropertyDetailView`.
     */
    renderers?: PropertyRenderer[];
    /** Per-key kind hint, forwarded to `PropertyDetailView`. */
    hints?: Record<string, string>;
    /**
     * Class on the card — the placement + sizing + appearance surface (the panels
     * are layout-agnostic). Spread {@link dockCardClassName} for a full-height dock.
     */
    className?: string;
    /** Inline style on the card — the runtime-valued companion to {@link className}. */
    style?: CSSProperties;
}
/**
 * Class recipe for a full-height side **dock** — pass as `className` of a
 * `NodeDetailView` / `EdgeDetailView`. Absolutely pins to `side` and spans
 * top → bottom (`inset-y-0`), translucent + scrollable + square.
 *
 * To inset it **below floating chrome**, pass explicit `top` / `bottom` via the
 * `style` prop (inline style overrides the baked `inset-y-0`).
 *
 * ```tsx
 * <NodeDetailView ctx={ctx} className={dockCardClassName('right')} />
 * <NodeDetailView ctx={ctx} className={dockCardClassName('right')}
 *   style={{ top: 40, bottom: 25 }} />   // clear a 40px header + 25px footer
 * ```
 */
declare function dockCardClassName(side?: 'left' | 'right'): string;

interface NodeDetailViewProps extends BaseDetailViewProps {
    /** Fallback heading when the node has no label. Default `'Node'`. */
    title?: string;
}
/**
 * The default read-only detail **card** for a **node** — a pure, reusable view.
 * The engine-aware adapter: it maps a {@link ViewContext} to a {@link DetailCard}
 * (Type / Label identity rows + id subtitle) wrapping a {@link PropertyDetailView}
 * that renders the node's `data` by kind. The card title is tinted with the
 * node's resolved fill colour.
 *
 * It is **bare content** — no surface, placement, or close of its own. Drop it
 * into a `<PanelContent>` (inside a `<Panel>`) which provides the surface,
 * header, and close. Add or override a data-type rendering via `renderers`.
 *
 * ```tsx
 * <ClickViewBehaviour panel={(ctx) =>
 *   ctx.kind === 'edge' ? <EdgeDetailView ctx={ctx} /> : <NodeDetailView ctx={ctx} />
 * } />
 * ```
 */
declare function NodeDetailView({ ctx, title, showId, renderers, hints, className, style, }: NodeDetailViewProps): react.JSX.Element;

interface EdgeDetailViewProps extends BaseDetailViewProps {
    /** Fallback heading when the edge has no label. Default `'Edge'`. */
    title?: string;
    /**
     * Treat the edge as directed → the endpoints block shows a direction arrow.
     * Default `true`.
     */
    directed?: boolean;
}
/**
 * The default read-only detail **card** for an **edge** — the edge counterpart
 * of {@link NodeDetailView}. Beyond the Type / Label identity rows it resolves
 * the edge's **source and target nodes** (id · type · label, each title tinted
 * with the node's fill colour) and renders them as a directed
 * {@link EdgeEndpoints} block, then the edge's `data` via
 * {@link PropertyDetailView}. The card title is tinted with the edge's resolved
 * stroke colour.
 *
 * Like {@link NodeDetailView} it is bare content — wrap it in a `<PanelContent>`
 * (inside a `<Panel>`) for the surface, header, and close.
 */
declare function EdgeDetailView({ ctx, title, showId, directed, renderers, hints, className, style, }: EdgeDetailViewProps): react.JSX.Element;

interface ThemeToggleProps {
    /** The app control context — supplies `themeKind` + `toggleTheme`. */
    ctx: GraphCanvasAppControlContext;
}
/**
 * Light/dark toggle for `<GraphCanvasApp>`, built from its control context — a
 * sun/moon `<ToolbarItems>` button. Drop it in a `header.right` slot:
 *
 * ```tsx
 * header={{ right: (ctx) => <ThemeToggle ctx={ctx} /> }}
 * ```
 */
declare function ThemeToggle({ ctx }: ThemeToggleProps): react.JSX.Element;

interface MiniMapToggleButtonProps extends MiniMapLayerProps {
    /** Start with the minimap shown. Default `true`. */
    defaultOn?: boolean;
    /**
     * Target a specific engine from outside its provider subtree. Omit inside a
     * `<Canvas>` / `GraphCanvasApp` tree — the button binds to the nearest root.
     */
    canvas?: Canvas | null;
}
/**
 * Turnkey minimap toggle — a **single** self-wiring button that renders both the
 * map toggle *and* (while on) the `<MiniMapLayer>`. Drop it anywhere under a
 * canvas root (typically a `header.right` slot); there is no separate layer node
 * to place. The minimap is **screen-fixed** and positions itself from `position`,
 * so its React-tree location is irrelevant — it only needs to render under the
 * canvas context. Forward any `<MiniMapLayer>` option (`graphLayerId`,
 * `backgroundLayerId`, `position`, …).
 *
 * ```tsx
 * header={{ right: () => <MiniMapToggleButton backgroundLayerId="background" position="bottom-left" /> }}
 * ```
 */
declare function MiniMapToggleButton({ defaultOn, canvas, ...layerOptions }: MiniMapToggleButtonProps): react.JSX.Element;

interface DevInfoToggleButtonProps extends Omit<DevInfoLayerProps, 'enabled'> {
    /** Start with the overlay shown. Default `false`. */
    defaultOn?: boolean;
    /**
     * Target a specific engine from outside its provider subtree. Omit inside a
     * `<Canvas>` / `GraphCanvasApp` tree — the button binds to the nearest root.
     */
    canvas?: Canvas | null;
}
/**
 * Turnkey dev-overlay toggle — a **single** self-wiring button that renders both
 * the gauge toggle *and* (while on) the `<DevInfoLayer>` (FPS, pointer coords,
 * zoom). Drop it anywhere under a canvas root (typically a `header.right` slot);
 * there is no separate layer node to place. The overlay is **screen-fixed** and
 * positions itself from `corner` / `margin`, so its React-tree location is
 * irrelevant — it only needs to render under the canvas context. Forward any
 * `<DevInfoLayer>` option (`corner`, `margin`, colours, …).
 *
 * ```tsx
 * header={{ right: () => <DevInfoToggleButton corner="top-left" margin={{ y: 48 }} /> }}
 * ```
 */
declare function DevInfoToggleButton({ defaultOn, canvas, ...layerOptions }: DevInfoToggleButtonProps): react.JSX.Element;

/**
 * A dockable side panel, described declaratively. The hook turns each of these
 * into a header **toggle item** and (while open) the **`right` region** body — so
 * you never hand-wire the toggle, the open-state, or the region render-fn per app.
 */
interface SidePanelDef {
    /** Stable id — the toggle key + the "which panel is open" discriminator. */
    id: string;
    /** Toggle icon shown in the shared toolbar (inactive, and active unless {@link activeIcon}). */
    icon: ToolbarIcon;
    /** Icon while the panel is open — an open/close flip (e.g. `PanelRightOpen` ⇄ `PanelRightClose`). */
    activeIcon?: ToolbarIcon;
    /**
     * Toggle label. The item flips `"<label>: hidden"` ⇄ `"<label>: shown"` with the
     * open-state (a `ToolbarItems` toggle convention); pass `activeLabel` to override.
     */
    label: string;
    /** Label while the panel is open. Default `"<label>: shown"`. */
    activeLabel?: string;
    /** Panel body — handed the live engine (`null` until every layer registers). */
    render: (canvas: GraphCanvas | null) => ReactNode;
    /** Per-panel initial region size — percent number, or a CSS size string (overrides {@link UseSidePanelsOptions.section}). */
    defaultSize?: number | string;
    /** Per-panel minimum region size — percent number, or a CSS size string. */
    minSize?: number | string;
    /** Per-panel maximum region size — percent number, or a CSS size string. */
    maxSize?: number | string;
    /** Per-panel: allow the drag handle to fully collapse the region. */
    collapsible?: boolean;
}
interface UseSidePanelsOptions {
    /** Which panel starts open. Default `null` (none). */
    defaultOpenId?: string | null;
    /** Region-size defaults applied to every panel unless its def overrides them. */
    section?: Pick<GraphCanvasAppSectionOptions, 'defaultSize' | 'minSize' | 'maxSize' | 'collapsible'>;
}
interface UseSidePanelsResult {
    /** The currently-open panel id, or `null`. */
    openId: string | null;
    /** Open a specific panel, or `null` to close whatever's open. */
    open: (id: string | null) => void;
    /** Toggle a panel — opens it, or closes it if it's already the open one. */
    toggle: (id: string) => void;
    /** Toolbar toggle items — spread into a **single** shared `<ToolbarItems>`. */
    items: ToolbarToggleItem[];
    /** The open panel's region config for `GraphCanvasApp`'s `right` (or `bottom`); `undefined` when none is open. */
    region: GraphCanvasAppSectionOptions | undefined;
}
/**
 * Turnkey **activity-bar** for `GraphCanvasApp` side panels: from a list of
 * {@link SidePanelDef}s it manages a single open-panel state and returns the
 * `items` (one shared toolbar of toggles) plus the active panel's `region` — so a
 * consumer wires it in two lines and the shell stays panel-agnostic:
 *
 * ```tsx
 * const dock = useSidePanels([
 *   { id: 'filters', icon: Filter, label: 'Filters', render: (c) => <CanvasFiltersViewPanel canvas={c} /> },
 *   { id: 'find',    icon: Search, label: 'Find',    render: (c) => <FindInCanvasViewPanel  canvas={c} /> },
 * ]);
 * <GraphCanvasApp
 *   header={{ right: <ToolbarItems items={dock.items} /> }}
 *   right={dock.region}
 * />
 * ```
 *
 * At most one panel occupies the region at a time (toggling one on swaps the dock;
 * toggling it off drops the region so the canvas reclaims the space). It owns only
 * the open-state — the panels' own state lives in the panels.
 */
declare function useSidePanels(panels: SidePanelDef[], options?: UseSidePanelsOptions): UseSidePanelsResult;

/**
 * Context handed to a context-menu `items` builder for an empty-canvas
 * (background) right-click. Carries the pointer position, the live `Canvas`,
 * and a `close` callback for items that need to dismiss the menu explicitly
 * (auto-close already fires `close` after every leaf `onClick`).
 */
interface GraphContextMenuContext {
    /** Pointer position in world (scene) coordinates — e.g. to place a new node. */
    readonly world: {
        readonly x: number;
        readonly y: number;
    };
    /** Pointer position in canvas-relative screen px (where the overlay sits). */
    readonly screen: {
        readonly x: number;
        readonly y: number;
    };
    /** The live engine instance, for reaching layers / behaviours / camera. */
    readonly canvas: Canvas;
    /** Dismiss the menu. Available for manual control; auto-close uses it too. */
    readonly close: () => void;
}
/**
 * Context handed to a node/edge context-menu `items` builder. Extends
 * {@link GraphContextMenuContext} with the right-clicked element's `id` and its
 * arbitrary `data` payload (`node.data` / `edge.data`).
 */
interface GraphTargetMenuContext extends GraphContextMenuContext {
    /** Id of the right-clicked node / edge. */
    readonly id: string;
    /** Arbitrary user payload from `node.data` / `edge.data` (`undefined` if none). */
    readonly data: unknown;
}
/** Options shared by all three `Graph*ContextMenu` components. */
interface GraphContextMenuCommonProps {
    /** GraphLayer id whose nodes/edges this menu watches; default `'graph'`. */
    layerId?: string;
    /** Whether the menu is active; reactive. Default `true`. */
    enabled?: boolean;
    /** Stacking order of the overlay; default `1000`. */
    zIndex?: number;
    /** Extra inline style merged onto the overlay wrapper. */
    style?: CSSProperties;
    /**
     * Auto-close the menu after any leaf item's `onClick`. Default `true`.
     * Set `false` to manage dismissal yourself via `ctx.close`.
     */
    autoClose?: boolean;
    /**
     * Node / edge menus: the `ClickSelectBehaviour` id to **select the
     * right-clicked element** with as the menu opens, unless it's already part of
     * the selection — so selection commands in the menu (`clipboard.*`,
     * `graph.erase`, via `commandMenuItems`) act on what was right-clicked. Off by
     * default (the selection is left alone).
     */
    selectTarget?: string;
}

/** Context handed to {@link GraphNodeContextMenuProps.items}. */
type GraphNodeMenuContext = GraphTargetMenuContext;
interface GraphNodeContextMenuProps extends GraphContextMenuCommonProps {
    /**
     * Build the menu shown when a **node** is right-clicked. Receives the node's
     * `id`, its `data`, the pointer position, the live `canvas`, and `close`.
     * Return the `@invana/ui` `MenuItem[]` to render.
     */
    items: (ctx: GraphNodeMenuContext) => MenuItem[];
    /** Behaviour id; default `'node-context-menu'`. */
    id?: string;
    /**
     * Transient state name applied to the right-clicked node while the menu is
     * open (e.g. `'context-open'`), cleared on the next open / dismiss. Default
     * `null` (no marker).
     */
    state?: string | null;
}
/**
 * Node-scoped right-click menu for a `GraphLayer`. Drop it inside `<Canvas>`
 * (alongside the layer) and pass an `items` builder — the behaviour wiring,
 * positioning, dismissal (outside-click / Escape), and auto-close are handled
 * internally.
 *
 * Pairs with {@link GraphEdgeContextMenu} and {@link GraphBackgroundContextMenu};
 * each owns a distinct behaviour scoped to its own target, so the three compose
 * without conflict.
 *
 * @example
 * ```tsx
 * <GraphNodeContextMenu
 *   items={({ id, canvas, close }) => [
 *     { id: 'edit', label: 'Edit', onClick: () => editNode(id) },
 *     { id: 'delete', label: 'Delete', onClick: () => deleteNode(id) },
 *   ]}
 * />
 * ```
 */
declare function GraphNodeContextMenu({ items, id, ...common }: GraphNodeContextMenuProps): react.JSX.Element;

/** Context handed to {@link GraphEdgeContextMenuProps.items}. */
type GraphEdgeMenuContext = GraphTargetMenuContext;
interface GraphEdgeContextMenuProps extends GraphContextMenuCommonProps {
    /**
     * Build the menu shown when an **edge** is right-clicked. Receives the edge's
     * `id`, its `data`, the pointer position, the live `canvas`, and `close`.
     * Return the `@invana/ui` `MenuItem[]` to render.
     */
    items: (ctx: GraphEdgeMenuContext) => MenuItem[];
    /** Behaviour id; default `'edge-context-menu'`. */
    id?: string;
    /**
     * Transient state name applied to the right-clicked edge while the menu is
     * open (e.g. `'context-open'`), cleared on the next open / dismiss. Default
     * `null` (no marker).
     */
    state?: string | null;
}
/**
 * Edge-scoped right-click menu for a `GraphLayer`. Drop it inside `<Canvas>`
 * (alongside the layer) and pass an `items` builder — the behaviour wiring,
 * positioning, dismissal (outside-click / Escape), and auto-close are handled
 * internally.
 *
 * Pairs with {@link GraphNodeContextMenu} and {@link GraphBackgroundContextMenu};
 * each owns a distinct behaviour scoped to its own target, so the three compose
 * without conflict.
 *
 * @example
 * ```tsx
 * <GraphEdgeContextMenu
 *   items={({ id, close }) => [
 *     { id: 'reverse', label: 'Reverse direction', onClick: () => reverseEdge(id) },
 *     { id: 'delete', label: 'Delete', onClick: () => deleteEdge(id) },
 *   ]}
 * />
 * ```
 */
declare function GraphEdgeContextMenu({ items, id, ...common }: GraphEdgeContextMenuProps): react.JSX.Element;

interface GraphContextMenuProps extends GraphContextMenuCommonProps {
    /** Mount the node menu. Default `true`. */
    nodes?: boolean;
    /** Mount the edge menu. Default `true`. */
    edges?: boolean;
    /**
     * `ClickSelectBehaviour` id backing the **Select** action. Default
     * `'click-select'` (what `GraphCanvasApp` registers). Set `null` to drop the
     * Select item (e.g. no selection behaviour on the canvas).
     */
    selectBehaviourId?: string | null;
    /** Zoom the node **Focus** action zooms in to. Default `2`. */
    focusZoom?: number;
    /**
     * Transform the default **node** items before render — append, prepend, or
     * replace. Receives the menu context and the built-in items
     * (Focus · Select · Hide/Show). Return the final `MenuItem[]`.
     */
    nodeItems?: (ctx: GraphNodeMenuContext, defaults: MenuItem[]) => MenuItem[];
    /** Transform the default **edge** items — as {@link nodeItems}, for edges. */
    edgeItems?: (ctx: GraphEdgeMenuContext, defaults: MenuItem[]) => MenuItem[];
}
/**
 * The **standard, batteries-included** graph context menu — the right-click
 * equivalent of the default settings panel. Drop it inside `<Canvas>` (or under a
 * non-null lifted `GraphCanvasContext`) with **zero config** and every node/edge
 * gets a sensible menu: **Focus** (fit the element in view), **Select** (add it to
 * the selection), and **Hide/Show** (first-class visibility — restore it from
 * {@link CanvasFiltersViewPanel}).
 *
 * ```tsx
 * <GraphCanvas data={graph}>
 *   <GraphContextMenu />          // node + edge menus, standard items
 * </GraphCanvas>
 * ```
 *
 * It composes the two target-scoped primitives ({@link GraphNodeContextMenu} +
 * {@link GraphEdgeContextMenu}) — reach for those directly (with a bespoke `items`
 * builder) only when the standard set doesn't fit. To *extend* the standard set,
 * pass {@link GraphContextMenuProps.nodeItems} / `edgeItems` and spread the
 * `defaults` you're handed. Add the empty-canvas menu with a separate
 * {@link GraphBackgroundContextMenu}.
 */
declare function GraphContextMenu({ nodes, edges, selectBehaviourId, focusZoom, nodeItems, edgeItems, layerId, ...common }: GraphContextMenuProps): react.JSX.Element;

/** Context handed to {@link GraphBackgroundContextMenuProps.items}. */
type GraphBackgroundMenuContext = GraphContextMenuContext;
interface GraphBackgroundContextMenuProps extends GraphContextMenuCommonProps {
    /**
     * Build the menu shown when the **empty canvas** is right-clicked. Receives
     * the pointer position (`world` is handy for "add node here"), the live
     * `canvas`, and `close`. Return the `@invana/ui` `MenuItem[]` to render.
     */
    items: (ctx: GraphBackgroundMenuContext) => MenuItem[];
    /** Behaviour id; default `'background-context-menu'`. */
    id?: string;
}
/**
 * Background-scoped right-click menu for a `GraphLayer` — fires on a right-click
 * over the empty canvas (not on any node or edge). Drop it inside `<Canvas>`
 * (alongside the layer) and pass an `items` builder — the behaviour wiring,
 * positioning, dismissal (outside-click / Escape), and auto-close are handled
 * internally.
 *
 * Pairs with {@link GraphNodeContextMenu} and {@link GraphEdgeContextMenu}; each
 * owns a distinct behaviour scoped to its own target, so the three compose
 * without conflict.
 *
 * @example
 * ```tsx
 * <GraphBackgroundContextMenu
 *   items={({ world, canvas }) => [
 *     { id: 'add', label: 'Add node here', onClick: () => addNodeAt(world) },
 *     { id: 'fit', label: 'Fit to content', onClick: () => fit(canvas) },
 *   ]}
 * />
 * ```
 */
declare function GraphBackgroundContextMenu({ items, id, ...common }: GraphBackgroundContextMenuProps): react.JSX.Element;

/** One menu entry bound to a command. */
interface CommandMenuRef {
    /** The command, by name (`canvas.commands`). */
    command: string;
    /** Args passed to the command. */
    args?: unknown;
    /** Menu label. Default: the command's own `label`, else its name. */
    label?: string;
    /** Icon name from the control-panel icon registry (e.g. `'scissors'`). */
    icon?: string;
    /** Shortcut hint shown on the right (e.g. `'⌘C'`). Display only. */
    shortcut?: string;
    /** Stable item id. Default: the command name (+ `#<n>` when repeated). */
    id?: string;
}
/** Options for {@link commandMenuItems} / {@link useCommandMenuItems}. */
interface CommandMenuItemsOptions {
    /** Extra / overriding icons by name, merged over `DEFAULT_CONTROL_ICONS`. */
    icons?: Record<string, ToolbarIcon>;
    /** Keep items whose command isn't registered (shown disabled). Default `false`: left out. */
    showUnavailable?: boolean;
}
/**
 * `MenuItem`s for `refs`, read from `canvas`'s commands **now** — for menus
 * built when they open (the `Graph*ContextMenu` `items` builders). Mix them with
 * closure items freely. For a menu that stays mounted, use {@link useCommandMenuItems}.
 *
 * @example
 * ```tsx
 * <GraphNodeContextMenu items={({ canvas }) => [
 *   ...commandMenuItems(canvas, [{ command: 'clipboard.cut', icon: 'scissors' }, { command: 'clipboard.copy', icon: 'copy' }]),
 *   { id: 'inspect', label: 'Inspect', onClick: … },
 * ]} />
 * ```
 */
declare function commandMenuItems(canvas: Canvas, refs: readonly CommandMenuRef[], opts?: CommandMenuItemsOptions): MenuItem[];
/**
 * {@link commandMenuItems} kept **live**: labels, disabled and checked states
 * follow the commands (`useCommandStates`), so a mounted dropdown re-renders
 * when, say, the selection empties or the clipboard fills.
 */
declare function useCommandMenuItems(refs: readonly CommandMenuRef[], canvas?: Canvas | null, opts?: CommandMenuItemsOptions): MenuItem[];

/** A key binding to show as a hint — the shape of `KeyboardShortcutBinding`. */
interface CommandPaletteShortcut {
    keys: string;
    command: string;
    args?: unknown;
}
interface CommandPaletteProps {
    /**
     * `'dialog'` (default) — a modal the host opens and closes. `'inline'` — the
     * list renders in place and stays, for a docked region (`GraphCanvasApp`'s
     * `right`); `open` / `onOpenChange` are ignored.
     */
    variant?: 'dialog' | 'inline';
    /** Whether the dialog is open (controlled). Required for `variant: 'dialog'`. */
    open?: boolean;
    /** Called to open / close the dialog — Escape, a pick, a click outside. */
    onOpenChange?: (open: boolean) => void;
    /** Only these command names (default: every registered one that can run bare). */
    commands?: readonly string[];
    /** Bindings to show as key hints — pass the ones your `KeyboardShortcutsBehaviour` uses. */
    shortcuts?: readonly CommandPaletteShortcut[];
    /** Search box placeholder. Default `'Type a command…'`. */
    placeholder?: string;
    /** Explicit canvas; defaults to the context canvas. */
    canvas?: Canvas | null;
}
/**
 * A searchable **command palette** over the canvas's commands (`list()` +
 * `get()`), grouped by each command's `category` and matched on its label,
 * name and `keywords`. A command that runs bare is one row; a pick-one command
 * (`select.mode`, `layout.activate`, …) is one row per option. Commands that
 * need an id with no default (`behaviour.toggle`, `layer.visible`) and private
 * `name#…` commands are left out. Rows show live disabled state; picking one
 * runs it and closes the palette.
 *
 * Typing ranks rows by label (exact, prefix, word, anywhere), then name /
 * keywords, then a fuzzy match, and selects the best enabled one — Enter runs it.
 *
 * As a dialog it's controlled: the host decides when it opens (a button, or a
 * key via its own listener). `variant="inline"` renders the list in place.
 */
declare function CommandPalette({ variant, open, onOpenChange, commands, shortcuts, placeholder, canvas, }: CommandPaletteProps): react.JSX.Element;

export { type AuthoredControlItemSpec, BACKGROUND_FIELDS, type BackgroundColorSource, BackgroundLayerEditorPanel, type BackgroundLayerEditorPanelProps, type BackgroundLayerFields, type BackgroundLayerFormState, type BackgroundLayerOptions, type BackgroundMode, type BackgroundPatternType, type BackgroundType, type BaseDetailViewProps, type BindingRow, BrushSelectEditorPanel, type BrushSelectEditorPanelProps, type BrushSelectFields, type BrushSelectFormState, type BrushSelectOptions, BubbleSetsLayerEditorPanel, type BubbleSetsLayerEditorPanelProps, type BubbleSetsLayerFields, type BubbleSetsLayerFormState, type BubbleSetsLayerOptions, CANVAS_CONTROL_ITEMS, CARD_ROW_FIELDS, CARD_SCALAR_FIELDS, CARD_STYLING_FIELDS, COLOR_PRESETS, COLOR_ROLES, COLOR_ROLE_OPTIONS, CanvasControlsToolbar, type CanvasControlsToolbarProps, CanvasFiltersViewPanel, type CanvasFiltersViewPanelProps, CanvasMessageBar, type CanvasMessageBarProps, CanvasSettingsBrowser, type CanvasSettingsBrowserProps, type SettingsSection as CanvasSettingsBrowserSection, type CanvasSettingsDefinition, CanvasSettingsEditorPanel, type CanvasSettingsEditorPanelProps, type CanvasSettingsInstance, type CanvasSnapshot, type CanvasSnapshotEvents, type CanvasSnapshotMessages, CanvasSnapshotsViewPanel, type CanvasSnapshotsViewPanelProps, type CardImageShape, type CardRowField, type CardScalarFields, type CardSpecFields, ClearCanvasToolbar, type ClearCanvasToolbarProps, ClickInspectEditorPanel, type ClickInspectEditorPanelProps, type ClickInspectFields, type ClickInspectFormState, type ClickInspectOptions, ClickSelectEditorPanel, type ClickSelectEditorPanelProps, type ClickSelectFields, type ClickSelectFormState, type ClickSelectOptions, ClickViewEditorPanel, type ClickViewEditorPanelProps, type ClickViewFields, type ClickViewFormState, type ClickViewOptions, CollapseExpandEditorPanel, type CollapseExpandEditorPanelProps, type CollapseExpandFields, type CollapseExpandFormState, type CollapseExpandOptions, ColorByEditorPanel, type ColorByEditorPanelProps, type ColorByFields, type ColorByFormState, type ColorByModeValue, type ColorByOptions, type ColorByScaleValue, type CommandArgDescriptors, type CommandMenuItemsOptions, type CommandMenuRef, CommandPalette, type CommandPaletteProps, type CommandPaletteShortcut, type CompositeFormState, type CompositeIconKind, CompositeNodeStyleEditorPanel, type CompositeNodeStyleEditorPanelProps, type CompositePartKind, type CompositePartRow, type CompositeRootKind, type CompositeScalarFields, ContentLODEditorPanel, type ContentLODEditorPanelProps, type ContentLODFields, type ContentLODFormState, type ContentLODOptions, ContextMenuEditorPanel, type ContextMenuEditorPanelProps, type ContextMenuFields, type ContextMenuFormState, type ContextMenuOptions, ContextMenuOverlay, type ContextMenuOverlayProps, type ControlCommandName, ControlItems, type ControlItemsProps, type ControlPanelFormError, type ControlPanelFormState, type ControlPanelRail, ControlPanels, ControlPanelsEditor, ControlPanelsEditorPanel, type ControlPanelsEditorPanelProps, type ControlPanelsEditorProps, type ControlPanelsProps, type ControlWidget, type ControlWidgetOptionsSpec, type ControlWidgetProps, CreateNodeEditorPanel, type CreateNodeEditorPanelProps, type CreateNodeFields, type CreateNodeFormState, type CreateNodeOptions, D3ForceLayoutEditorPanel, type D3ForceLayoutEditorPanelProps, type D3ForceLayoutFields, type D3ForceLayoutFormState, type D3ForceLayoutOptions, D3HierarchyLayoutEditorPanel, type D3HierarchyLayoutEditorPanelProps, type D3HierarchyLayoutFields, type D3HierarchyLayoutFormState, type D3HierarchyLayoutOptions, D3SankeyLayoutEditorPanel, type D3SankeyLayoutEditorPanelProps, type D3SankeyLayoutFields, type D3SankeyLayoutFormState, type D3SankeyLayoutOptions, DEFAULT_CANVAS_SETTINGS_SCHEMAS, DEFAULT_CONTROL_ICONS, DEFAULT_CONTROL_PRESETS, DEFAULT_CONTROL_WIDGETS, DensityContourFillLayerEditorPanel, type DensityContourFillLayerEditorPanelProps, type DensityContourFillLayerFields, type DensityContourFillLayerFormState, type DensityContourFillLayerOptions, DensityContourStrokeLayerEditorPanel, type DensityContourStrokeLayerEditorPanelProps, type DensityContourStrokeLayerFields, type DensityContourStrokeLayerFormState, type DensityContourStrokeLayerOptions, DetailCard, type DetailCardProps, type DetailRow, DevInfoLayerEditorPanel, type DevInfoLayerEditorPanelProps, type DevInfoLayerFields, type DevInfoLayerFormState, type DevInfoLayerOptions, DevInfoToggleButton, type DevInfoToggleButtonProps, DragNodeEditorPanel, type DragNodeEditorPanelProps, type DragNodeFields, type DragNodeFormState, type DragNodeOptions, DragPanEditorPanel, type DragPanEditorPanelProps, type DragPanFields, type DragPanFormState, type DragPanOptions, DragShapeEditorPanel, type DragShapeEditorPanelProps, type DragShapeFields, type DragShapeFormState, type DragShapeOptions, DrawEdgeEditorPanel, type DrawEdgeEditorPanelProps, type DrawEdgeFields, type DrawEdgeFormState, type DrawEdgeOptions, EDGE_TYPE_CONTROL_ITEMS, EDIT_CONTROL_ITEMS, EXPLORER_CONTROL_ITEMS, EXPORT_IMAGE_AREA_OPTIONS, EXPORT_IMAGE_BACKGROUND_OPTIONS, EXPORT_IMAGE_FORMAT_OPTIONS, EXPORT_IMAGE_RATIO_OPTIONS, EXPORT_IMAGE_SCALE_OPTIONS, EdgeDetailView, type EdgeDetailViewProps, type EdgeEndpoint, EdgeEndpoints, type EdgeEndpointsProps, EdgeLODEditorPanel, type EdgeLODEditorPanelProps, type EdgeLODFields, type EdgeLODFormState, type EdgeLODKeepBy, type EdgeLODOptions, ContentLODEditorPanel as EdgeLabelLODEditorPanel, type ContentLODEditorPanelProps as EdgeLabelLODEditorPanelProps, EdgePreviewCard, type EdgePreviewCardProps, EdgeScaleLODEditorPanel, type EdgeScaleLODEditorPanelProps, type EdgeScaleLODFields, type EdgeScaleLODFormState, type EdgeScaleLODOptions, type EdgeTypeStyling, EditToolbar, type EditToolbarProps, ElementInspectorViewPanel, type ElementInspectorViewPanelProps, ElkLayoutEditorPanel, type ElkLayoutEditorPanelProps, type ElkLayoutFields, type ElkLayoutFormState, type ElkLayoutOptions, type EntranceEasingOption, EntranceEditorPanel, type EntranceEditorPanelProps, type EntranceFields, type EntranceFormState, type EntranceOptions, type EntranceOrderOption, EraseEditorPanel, type EraseEditorPanelProps, type EraseFields, type EraseFormState, type EraseOptions, type ExportImageAreaKey, type ExportImageFormatKey, ExportImagePanel, type ExportImagePanelOption, type ExportImagePanelProps, type ExportImagePanelValue, ExportImageToolbar, type ExportImageToolbarProps, ExportStatePanel, type ExportStatePanelProps, ExportStateToolbar, type ExportStateToolbarProps, FindInCanvasViewPanel, type FindInCanvasViewPanelProps, FisheyeEditorPanel, type FisheyeEditorPanelProps, type FisheyeFields, type FisheyeFormState, type FisheyeOptions, FocusEditorPanel, type FocusEditorPanelProps, type FocusFields, type FocusFormState, type FocusOptions, GRAPH_CONTROL_ITEMS, GRID_CONTROL_ITEMS, GeometricLayoutEditorPanel, type GeometricLayoutEditorPanelProps, type GeometricLayoutFields, type GeometricLayoutFormState, type GeometricLayoutMode, type GeometricLayoutOptions, GraphBackgroundContextMenu, type GraphBackgroundContextMenuProps, type GraphBackgroundMenuContext, GraphCanvasApp, type GraphCanvasAppControlContext, type GraphCanvasAppFooterOptions, type GraphCanvasAppHeaderOptions, type GraphCanvasAppProps, GraphCanvasAppRoot, type GraphCanvasAppRootProps, type GraphCanvasAppSectionOptions, GraphCanvasAppSurface, type GraphCanvasAppSurfaceProps, GraphContextMenu, type GraphContextMenuCommonProps, type GraphContextMenuContext, type GraphContextMenuProps, type GraphControlsSections, GraphControlsToolbar, GraphControlsToolbarLite, type GraphControlsToolbarProps, GraphEdgeContextMenu, type GraphEdgeContextMenuProps, type GraphEdgeMenuContext, GraphLayoutToolbar, type GraphLayoutToolbarProps, GraphLegendLayerEditorPanel, type GraphLegendLayerEditorPanelProps, type GraphLegendLayerFields, type GraphLegendLayerFormState, type GraphLegendLayerOptions, GraphNodeContextMenu, type GraphNodeContextMenuProps, type GraphNodeMenuContext, GraphStatusBar, type GraphStatusBarProps, type GraphTargetMenuContext, GraphToolbar, type GraphToolbarProps, GridToolbar, type GridToolbarProps, HISTORY_CONTROL_ITEMS, HeaderControlPanels, type HeaderControlPanelsProps, type HeaderRegion, HistoryToolbar, type HistoryToolbarProps, HistoryViewPanel, type HistoryViewPanelProps, HoverActivateEditorPanel, type HoverActivateEditorPanelProps, type HoverActivateFields, type HoverActivateFormState, type HoverActivateOptions, HoverElementPreviewCard, type HoverElementPreviewCardProps, HoverElementPreviewEditorPanel, type HoverElementPreviewEditorPanelProps, type HoverElementPreviewFields, type HoverElementPreviewFormState, type HoverElementPreviewOptions, HoverPreviewCardEditorPanel, type HoverPreviewCardEditorPanelProps, INPUT_CONTROL_ITEMS, ContentLODEditorPanel as IconLODEditorPanel, type ContentLODEditorPanelProps as IconLODEditorPanelProps, ContentLODEditorPanel as ImageLODEditorPanel, type ContentLODEditorPanelProps as ImageLODEditorPanelProps, InspectorPanel, type InspectorPanelProps, KeyboardCameraEditorPanel, type KeyboardCameraEditorPanelProps, type KeyboardCameraFields, type KeyboardCameraFormState, type KeyboardCameraOptions, type KeyboardShortcutBindingOption, KeyboardShortcutsEditorPanel, type KeyboardShortcutsEditorPanelProps, type KeyboardShortcutsFields, type KeyboardShortcutsFormState, type KeyboardShortcutsOptions, LABEL_FIELDS, LAYOUT_CONTROL_ITEMS, LabelCollisionEditorPanel, type LabelCollisionEditorPanelProps, type LabelCollisionFields, type LabelCollisionFormState, type LabelCollisionOptions, type LabelPlacement, LassoSelectEditorPanel, type LassoSelectEditorPanelProps, type LassoSelectFields, type LassoSelectFormState, type LassoSelectOptions, LayersViewPanel, type LayersViewPanelProps, MODELLER_CONTROL_ITEMS, MapLayerEditorPanel, type MapLayerEditorPanelProps, type MapLayerFields, type MapLayerFormState, type MapLayerOptions, MenuItemList, type MenuItemListProps, MiniMapLayerEditorPanel, type MiniMapLayerEditorPanelProps, type MiniMapLayerFields, type MiniMapLayerFormState, type MiniMapLayerOptions, MiniMapToggleButton, type MiniMapToggleButtonProps, ModellerToolbar, type ModellerToolbarProps, NAVIGATION_CONTROL_ITEMS, NO_ROLE, NodeCentralityEditorPanel, type NodeCentralityEditorPanelProps, type NodeCentralityFields, type NodeCentralityFormState, type NodeCentralityOptions, NodeDetailView, type NodeDetailViewProps, ContentLODEditorPanel as NodeLabelLODEditorPanel, type ContentLODEditorPanelProps as NodeLabelLODEditorPanelProps, NodePreviewCard, type NodePreviewCardProps, NodeResizeEditorPanel, type NodeResizeEditorPanelProps, type NodeResizeFields, type NodeResizeFormState, type NodeResizeOptions, NodeScaleLODEditorPanel, type NodeScaleLODEditorPanelProps, type NodeScaleLODFields, type NodeScaleLODFormState, type NodeScaleLODOptions, type NodeSchema, NodeStructureEditorPanel, type NodeStructureEditorPanelProps, type NodeStructureFormState, type NodeStructureScalarFields, NodeStyleEditorPanel, type NodeStyleEditorPanelProps, type NodeStyleFields, type NodeStyleFormState, NodeStyleOverviewEditorPanel, type NodeStyleOverviewEditorPanelProps, type NodeStyleOverviewFields, type NodeStyleOverviewFormState, NodeStylingEditorPanel, type NodeStylingEditorPanelProps, type NodeStylingFormState, type NodeStylingScalarFields, type NodeTypeStyling, PAN_CONTROL_ITEMS, PAN_PAD_CONTROL_ITEMS, Panel, PanelContent, type PanelContentProps, type PanelPosition, type PanelProps, ParallelEdgeEditorPanel, type ParallelEdgeEditorPanelProps, type ParallelEdgeFields, type ParallelEdgeFormState, type ParallelEdgeOptions, PinchZoomEditorPanel, type PinchZoomEditorPanelProps, type PinchZoomFields, type PinchZoomFormState, type PinchZoomOptions, PlaybookPresenterBar, type PlaybookPresenterBarProps, PlaybookViewPanel, type PlaybookViewPanelProps, type PreviewCardRow, PropertiesEditor, type PropertiesEditorProps, type PropertiesEditorValues, PropertyDetailView, type PropertyDetailViewProps, type PropertyKind, type PropertyRenderContext, type PropertyRenderer, RegionControlPanels, type RegionControlPanelsProps, type RegionSlot, type RendererCapabilities, RendererCapabilityBanner, type RendererCapabilityBannerProps, SCHEMA_FIELD_ROW, SCHEMA_METAGRAPH_LAYER_ID, SCHEMA_META_FIELDS, SCHEMA_TYPES, SCHEMA_TYPE_OPTIONS, SELECT_MODE_CONTROL_ITEMS, SIMPLE_STYLING_FIELDS, SLOT_BINDING_FIELDS, SLOT_STYLING_FIELDS, STROKE_FIELDS, STYLING_SCALAR_FIELDS, type SchemaEdgeRouting, type SchemaEditorFormState, SchemaEditorPanel, type SchemaEditorPanelProps, type SchemaFieldDef, type SchemaMetaFields, type SchemaMetaGraphOptions, type SchemaNodeMode, SchemaToolbar, type SchemaToolbarProps, type SchemaToolbarSections, SchemaViewPanel, type SchemaViewPanelBaseProps, type SchemaViewPanelProps, SelectionViewPanel, type SelectionViewPanelProps, type SettingsEditorContext, type SettingsEditorDescriptor, type SettingsSchemaEntry, type SettingsSection$1 as SettingsSection, type ShapeKind, type SidePanelDef, SimpleNodeStyleEditorPanel, type SimpleNodeStyleEditorPanelProps, type SlotStylingRow, type StrokeAlignment, type StrokeCap, type StrokeJoin, StylingViewPanel, type StylingViewPanelProps, THEME_CONTROL_ITEMS, TextResolutionLODEditorPanel, type TextResolutionLODEditorPanelProps, type TextResolutionLODFields, type TextResolutionLODFormState, type TextResolutionLODOptions, ThemeEditorPanel, type ThemeEditorPanelProps, type ThemeFields, type ThemeFormState, type ThemeKind, type ThemeOptions, ThemeToggle, type ThemeToggleProps, type ToolbarButtonItem, type ToolbarCustomItem, type ToolbarDividerItem, type ToolbarIcon, type ToolbarItem, ToolbarItems, type ToolbarItemsProps, type ToolbarSelectItem, type ToolbarToggleItem, type TooltipSide, Tooltipped, type TooltippedProps, type TypeStylingPatch, type UseControlItemsOptions, type UseDerivedSchemaOptions, type UseSidePanelsOptions, type UseSidePanelsResult, VIEW_CONTROL_ITEMS, ViewToolbar, type ViewToolbarProps, WheelZoomEditorPanel, type WheelZoomEditorPanelProps, type WheelZoomFields, type WheelZoomFormState, type WheelZoomOptions, type WidgetOptionDescriptors, ZOOM_CONTROL_ITEMS, ZOOM_LEVEL_CONTROL_ITEMS, advancedCompositeScalarFields, advancedNodeStyleFields, applyIconOverrides, asRole, backgroundLayerFields, formToOptions$I as backgroundLayerFormToOptions, optionsToForm$I as backgroundLayerOptionsToForm, basicCompositeFields, basicNodeStyleFields, bindingScalarFields, bindingToForm, bindingToLine, brushSelectFields, formToOptions$w as brushSelectFormToOptions, optionsToForm$w as brushSelectOptionsToForm, bubbleSetsLayerFields, formToOptions$1 as bubbleSetsLayerFormToOptions, optionsToForm$1 as bubbleSetsLayerOptionsToForm, clickInspectFields, formToOptions$z as clickInspectFormToOptions, optionsToForm$z as clickInspectOptionsToForm, clickSelectFields, formToOptions$A as clickSelectFormToOptions, optionsToForm$A as clickSelectOptionsToForm, clickViewFields, formToOptions$y as clickViewFormToOptions, optionsToForm$y as clickViewOptionsToForm, collapseExpandFields, formToOptions$p as collapseExpandFormToOptions, optionsToForm$p as collapseExpandOptionsToForm, colorByFields, formToOptions$k as colorByFormToOptions, optionsToForm$k as colorByOptionsToForm, colorToForm, commandMenuItems, compositeScalarFields, compositeToForm, contentLODFields, formToOptions$g as contentLODFormToOptions, optionsToForm$g as contentLODOptionsToForm, contextMenuFields, formToOptions$l as contextMenuFormToOptions, optionsToForm$l as contextMenuOptionsToForm, controlWidgetOptionsSpecs, createNodeFields, formToOptions$o as createNodeFormToOptions, optionsToForm$o as createNodeOptionsToForm, d3ForceLayoutFields, formToOptions$7 as d3ForceLayoutFormToOptions, optionsToForm$7 as d3ForceLayoutOptionsToForm, d3HierarchyLayoutFields, formToOptions$5 as d3HierarchyLayoutFormToOptions, optionsToForm$5 as d3HierarchyLayoutOptionsToForm, d3SankeyLayoutFields, formToOptions$4 as d3SankeyLayoutFormToOptions, optionsToForm$4 as d3SankeyLayoutOptionsToForm, defaultPropertyRenderers, defaultShapeFor, defineControlItems, densityContourFillLayerFields, formToOptions$3 as densityContourFillLayerFormToOptions, optionsToForm$3 as densityContourFillLayerOptionsToForm, densityContourStrokeLayerFields, formToOptions$2 as densityContourStrokeLayerFormToOptions, optionsToForm$2 as densityContourStrokeLayerOptionsToForm, devInfoLayerFields, formToOptions$B as devInfoLayerFormToOptions, optionsToForm$B as devInfoLayerOptionsToForm, dockCardClassName, dragNodeFields, formToOptions$r as dragNodeFormToOptions, optionsToForm$r as dragNodeOptionsToForm, dragPanFields, formToOptions$G as dragPanFormToOptions, optionsToForm$G as dragPanOptionsToForm, dragShapeFields, formToOptions$C as dragShapeFormToOptions, optionsToForm$C as dragShapeOptionsToForm, drawEdgeFields, formToOptions$n as drawEdgeFormToOptions, optionsToForm$n as drawEdgeOptionsToForm, edgeLODFields, formToOptions$f as edgeLODFormToOptions, optionsToForm$f as edgeLODOptionsToForm, edgeLabelLODFields, edgeScaleLodFields, formToOptions$b as edgeScaleLodFormToOptions, optionsToForm$b as edgeScaleLodOptionsToForm, elkLayoutFields, formToOptions$6 as elkLayoutFormToOptions, optionsToForm$6 as elkLayoutOptionsToForm, entranceFields, formToOptions$v as entranceFormToOptions, optionsToForm$v as entranceOptionsToForm, eraseFields, formToOptions$m as eraseFormToOptions, optionsToForm$m as eraseOptionsToForm, fisheyeFields, formToOptions$i as fisheyeFormToOptions, optionsToForm$i as fisheyeOptionsToForm, focusFields, formToOptions$x as focusFormToOptions, optionsToForm$x as focusOptionsToForm, formToBinding, formToColor, formToComposite, formToPanel, formToSchema, formToSpec, formToStyle, formToStyling, geometricLayoutFields, formToOptions$H as geometricLayoutFormToOptions, optionsToForm$H as geometricLayoutOptionsToForm, geometryFields, BASE_CONFIG as graphCanvasAppBaseConfig, graphLegendLayerFields, formToOptions$8 as graphLegendLayerFormToOptions, optionsToForm$8 as graphLegendLayerOptionsToForm, hasRailControlPanels, hexToNumber, hoverActivateFields, formToOptions$t as hoverActivateFormToOptions, optionsToForm$t as hoverActivateOptionsToForm, hoverElementPreviewFields, formToOptions$s as hoverElementPreviewFormToOptions, optionsToForm$s as hoverElementPreviewOptionsToForm, isImageUrl, isSafeHref, keyboardCameraFields, formToOptions$E as keyboardCameraFormToOptions, optionsToForm$E as keyboardCameraOptionsToForm, keyboardShortcutsFields, formToOptions$D as keyboardShortcutsFormToOptions, optionsToForm$D as keyboardShortcutsOptionsToForm, labelCollisionFields, formToOptions$a as labelCollisionFormToOptions, optionsToForm$a as labelCollisionOptionsToForm, labelLodFormToOptions as labelLODFormToOptions, labelLodOptionsToForm as labelLODOptionsToForm, lassoSelectFields, formToOptions$u as lassoSelectFormToOptions, optionsToForm$u as lassoSelectOptionsToForm, lineToBinding, mapLayerFields, formToOptions as mapLayerFormToOptions, optionsToForm as mapLayerOptionsToForm, miniMapLayerFields, formToOptions$9 as miniMapLayerFormToOptions, optionsToForm$9 as miniMapLayerOptionsToForm, modeFields, nodeCentralityFields, formToOptions$h as nodeCentralityFormToOptions, optionsToForm$h as nodeCentralityOptionsToForm, nodeLabelLODFields, nodeResizeFields, formToOptions$q as nodeResizeFormToOptions, optionsToForm$q as nodeResizeOptionsToForm, nodeScaleLodFields, formToOptions$c as nodeScaleLodFormToOptions, optionsToForm$c as nodeScaleLodOptionsToForm, nodeStyleFields, nodeStyleOverviewFields, numberToHex, panelToForm, parallelEdgeFields, formToOptions$e as parallelEdgeFormToOptions, optionsToForm$e as parallelEdgeOptionsToForm, partRowFields, pinchZoomFields, formToOptions$F as pinchZoomFormToOptions, optionsToForm$F as pinchZoomOptionsToForm, recolorNodeStyle, renderPropertyValue, resolvePropertyRenderer, roleField, rootFields, schemaToForm, schemaToMetaGraph, specToForm, styleToForm, stylingToForm, textResolutionLodFields, formToOptions$d as textResolutionLodFormToOptions, optionsToForm$d as textResolutionLodOptionsToForm, themeFields, formToOptions$j as themeFormToOptions, optionsToForm$j as themeOptionsToForm, typeColor, useCommandMenuItems, useControlItems, useDerivedSchema, useGraphCanvasApp, useSidePanels, wheelZoomFields, formToOptions$J as wheelZoomFormToOptions, optionsToForm$J as wheelZoomOptionsToForm };
