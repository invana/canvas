# Canvas Templates & Theming — implementation design

> Branch: `feat/canvas-templates`. Status: **implemented** (runtime) — design-of-record kept in sync with the code.

## Implementation status

**Phase A — theming: ✅ shipped.**
- Engine theme signal: `ResolvedTheme` + `ThemeState` on `CanvasContext`, `'theme:change'` on the bus, `CanvasThemeState` owned by `Canvas` (`packages/canvas/src/theme/`).
- `BackgroundLayer` + `MiniMapLayer` subscribe to `theme:change` and resolve their kind from `ctx.theme`; their private `matchMedia` is gone.
- `@invana/graph` `src/theme/`: `ColorRole` / `Theme` / `ThemePalette` types, six built-in themes (`default/forest/ocean/gold/rose/minimal`, light+dark), `accent.ts` (`--color-primary`), `family.ts` (`themeFamily`), `roles.ts` (palette → node/edge/group defaults).
- `ThemeBehaviour` — the sole publisher + sole `prefers-color-scheme` reader; named-palette path **and** single-layer `{light,dark}` shorthand. `GraphLayer` subscribes and recolours node/edge/group base look from the palette.
- `GraphCanvasApp` rewired to `ThemeBehaviour` + `ThemeTemplateSync` (drives mode + family from `useTheme()`); `THEME_LIGHT/DARK` + `ShellThemeSync` removed.
- Collapsed away: `ResponsiveThemeBehaviour`, `SystemThemeBehaviour` (story helper), `useSystemTheme`, `ThemedBackgroundLayer`. 29 imperative stories + the two themed-background stories migrated.

**Phase B — structure/styling templates: ✅ runtime shipped.**
- `composite` is now a first-class `CompositeShapeOption` in `NodeShapeOptions`.
- `@invana/graph` `src/template/`: `NodeStructureTemplate` (`simple` | `card`), `NodeStylingTemplate`, `NodeTypeBinding`, dotted-path bindings, a `card → composite` auto-layout compiler (`compileCard`/`compileSimple`), and built-in structures (`circle/rect/arc/regular-polygon/star/polygon` + `idCard`) with role-based stylings.
- `GraphLayer` resolves `nodeTypes` (structure + styling + bindings) through the active palette inside `resolveNodeStyle` — roles → numbers before the renderer — and re-compiles on theme switch. `setOptions` routes the three new option fields. Unit-tested (`tests/template/compile.test.ts`).

**Phase B — editors: ✅ shipped.** `@invana/canvas-ui` gains schema-driven, engine-agnostic editors mirroring `HoverPreviewCardEditor`:
- `NodeStructureEditor` — one `NodeTypeBinding`: structure + styling picker (names from the host) + the **slot → data-field** map (`useFieldArray` of the shared `SLOT_BINDING_FIELDS`). `bindingToForm` / `formToBinding`.
- `NodeStylingEditor` — one `NodeStylingTemplate`: role selects + typography + per-slot styling array. `stylingToForm` / `formToStyling`.
- Shared `editors/field-helpers.ts` — the colour-role select (`roleField` / `COLOR_ROLE_OPTIONS`) and the `SlotBindingField` (`SLOT_BINDING_FIELDS`).

Both produce pure JSON; the host applies via `canvas.update({ layers: { graph: { nodeTypes | nodeStylingTemplates } } })`.

Verification: `pnpm check-types` (14 pkgs), `pnpm build` (15 tasks), canvas tests (165) + graph tests (53, incl. 10 compiler) all green; storybook builds.

## Context

Today the canvas has **four overlapping, half-complete theme mechanisms** and **no separation between a node's structure and its styling**:

1. `THEME_LIGHT`/`THEME_DARK` + `ShellThemeSync` (`canvas-react/src/apps/GraphCanvasApp.tsx:160-218`) — the path the header ThemeToggle drives. Hardcoded, 6 properties, light/dark only.
2. `SystemThemeBehaviour` (`apps/storybook/stories/system-theme.tsx`) — story-only, one layer, OS-driven. 31 stories use it.
3. `ResponsiveThemeBehaviour` (`packages/graph`) — node/edge/group light-dark variants, **dead code**.
4. `useSystemTheme` (`canvas-react`) — React OS-follow hook.

Plus node *content* is ad-hoc: composite "cards" are hand-authored coordinate-by-coordinate (`usecases/code-kg/code-kg-elkjs.stories.ts`, forced through `as unknown as NodeShapeOptions`), with no reusable template, no field-mapping, no theming.

**Outcome:** collapse the four into **one** signal-based `ThemeBehaviour`, and introduce a clean **three-layer model** so every node type has a reusable **structure** + **styling**, recolored by a global **theme** for light/dark + named palettes.

---

## The model — three layers

| Layer | Name | Scope | Decides |
|---|---|---|---|
| **Structure** | `NodeStructureTemplate` (`simple` \| `card`) | per node **type** | shape / slots / layout / field bindings — the skeleton (**no colours**) |
| **Styling** | `NodeStylingTemplate` | per node **type** | which **role** each slot/label uses + typography (fonts, sizes, label options) — **no hex** |
| **Theme** | `Theme` | whole canvas | forest/ocean × light/dark → resolves roles to hex; also colours background / edges / selection |

**Role = a semantic colour variable (like a CSS var).** Styling writes `title → heading`; the active `Theme` defines `heading = #e2f0e6` (forest-dark). One theme switch recolours everything; structure & styling never change. Change a type's styling → only that type restyles; change its structure → only its layout changes.

**Delivered as a signal:** `ThemeBehaviour` is the **sole publisher** — it resolves the active `Theme` + mode (the only `prefers-color-scheme` read in the codebase) and publishes `theme:change` (+ readable `ctx.theme`). Theme-aware layers (`BackgroundLayer`, `MiniMapLayer`, `GraphLayer`) **subscribe and recolour themselves**. New layers opt in by subscribing.

> ### Roles resolve to numbers — the renderer is role-unaware
> **Pixi never sees a role.** Roles are an *authoring-layer* concept; they're substituted for concrete `0xRRGGBB` numbers during graph's style-resolution step (the existing `resolveNodeStyle`/`resolveEdgeStyle`), *before* any `NodeSpec`/`CompositeSpec` reaches the renderer. By the time the GPU paints, every colour is a literal number — exactly like a browser resolving `var(--heading)` before paint. The rendering engine stays pure-numeric, as today.
>
> **Why roles instead of direct hex:** direct colours can't be re-themed — supporting `default/forest/ocean/gold/rose/minimal × light/dark` would need 12 copies of every styling template. Roles collapse that to **one styling template, 12 themes resolve it.** That indirection *is* the theming.
>
> **Direct colours are still allowed (escape hatch):** colour fields come in pairs — a `*Role` field (themed, resolved from the active palette) **or** a direct colour field (fixed literal, passes straight through). They're *separate fields*, so there's never ambiguity between a role name and a CSS string. Use roles for anything that should follow the theme (most slots); use a direct colour for things that must stay fixed (a brand colour, a hardcoded status green). Either way the renderer receives a number.

---

## Locked decisions

| Topic | Decision |
|---|---|
| Scope | Both phases, this branch, sequentially (A: theming, then B: structure/styling templates) |
| Built-in themes | `default, forest, ocean, gold, rose, minimal` — full **light + dark** (12 palettes) |
| Accent | live `--color-primary` drives **primary node fill** + **card accent bar** (rings keep their own roles) |
| Groups | compound-group frames themed in v1; **BubbleSets deferred** to follow-up |
| ThemedBackgroundLayer | **removed** now (redundant once layers subscribe); its story migrated |
| Card sizing | **fixed** size (width×height); overflow text ellipsizes |
| Field schema | host-provides per-type `fields[]` (from the backend KG schema); optional introspection augment for stray props |
| Editors | **separate** `NodeStructureEditor` + `NodeStylingEditor`, sharing a `SlotBindingField` primitive |
| Built-in structures | simple: `circle, rect, arc, regular-polygon, star, polygon` (each a full label surface) · card: `idCard` |
| Names | `NodeStructureTemplate`, `NodeStylingTemplate`, `Theme`, `ThemeBehaviour`, `ColorRole`, `ResolvedTheme` |
| Theme placement | forest/ocean × light/dark live on the **global `Theme`** (per-type styling is role-based) |
| Collapse | one `ThemeBehaviour` replaces `ResponsiveThemeBehaviour` + `SystemThemeBehaviour` + `useSystemTheme` + `THEME_*`/`ShellThemeSync` |

---

## Blast radius (verified)

- **`@invana/canvas` (engine): additive only.** (a) theme signal — `ResolvedTheme` + `ctx.theme` + `theme:change` on the existing `ctx.events`; (b) `BackgroundLayer` learns to subscribe + recolor, dropping its private `matchMedia`. Shape system is already a registry (`PrimitivesRenderer.ts:365` `registerShape('composite', …)`); `CompositeShape`/`CompositeSpec` already exist; `card` compiles to `composite` inside graph. No breaking changes.
- **`@invana/graph`: most of the work, mostly additive** + one dead-code deletion (`ResponsiveThemeBehaviour`).
- **`@invana/canvas-react`: contained rewire** + one dead-export removal (`useSystemTheme`).
- **`@invana/canvas-ui`: additive** (the two editors).
- **`apps/storybook`: mechanical churn** (31 `SystemThemeBehaviour` migrations + `ThemedBackground`/`WithThemedBackground` story).
- **True breaking surface: two unused exports** (`ResponsiveThemeBehaviour`, `useSystemTheme`) — unreferenced in-repo, `0.0.x`.

---

## Core types

### Colour vocabulary + Theme (`@invana/graph`)
```ts
export type ColorRole =
  | 'surface' | 'cardBg' | 'foreground' | 'heading' | 'muted'
  | 'accent' | 'divider' | 'stroke' | 'selectionRing' | 'hoverRing';

export interface ThemePalette extends Record<ColorRole, number> {
  categorical: number[];           // fill-by-type ramp (ColorByLabelBehaviour reads it)
}
export interface Theme {
  name: string;                    // 'default' | 'forest' | 'ocean' | 'gold' | 'rose' | 'minimal'
  label?: string;
  light: ThemePalette;
  dark:  ThemePalette;
}
export type ThemeRegistry = Record<string, Theme>;
```

### Theme signal (`@invana/canvas`, additive, graph-agnostic)
```ts
export interface ResolvedTheme {
  kind: 'light' | 'dark';
  name: string;
  palette: Record<string, number>; // role → hex (string keys; canvas stays graph-agnostic)
  categorical?: number[];
}
export interface ThemeState {
  current(): ResolvedTheme | null;
  set(t: ResolvedTheme): void;      // stores + emits 'theme:change'  (publisher-only)
}
export interface CanvasContext { /* … */ readonly theme: ThemeState }
// new event on ctx.events:  'theme:change' → ResolvedTheme
```

### Structure templates (`@invana/graph`)
```ts
export type NodeStructureTemplate = SimpleStructure | CardStructure;

export interface SimpleStructure {
  name: string; kind: 'simple';
  shape: NodeShapeOptions;          // circle | rect | arc | regular-polygon | star | polygon
  slots: { label: true; icon?: boolean; badge?: boolean };
}
export interface CardStructure {
  name: string; kind: 'card';
  width: number; height: number;    // FIXED size
  rows: CardRow[];
}
export interface CardRow { slots?: CardSlot[]; divider?: boolean }
export type CardSlot =
  | { slot: string; kind: 'tag' | 'text' }
  | { slot: string; kind: 'image'; shape?: 'circle' | 'rounded'; size?: number }
  | { stack: CardSlot[] };          // vertical stack within a row cell
```

### Styling templates (`@invana/graph`)
```ts
// Every colour comes as a PAIR: `*Role` (themed) OR a direct field (fixed literal).
// `*Role` wins if both are set. Resolved to a number in graph before the renderer.
export interface NodeStylingTemplate {
  name: string;
  // simple:
  fillRole?: ColorRole;     fill?: number;        // themed | fixed
  strokeRole?: ColorRole;   stroke?: number;
  label?: LabelStyling;     // FULL NodeStyle label surface; colours as roles or direct
  // card:
  bgRole?: ColorRole;       bg?: number;
  accentRole?: ColorRole;   accent?: number;
  slots?: Record<string, SlotStyling>;   // per slot name
}
export interface SlotStyling {
  colorRole?: ColorRole;    color?: number;       // themed | fixed
  fontSize?: number; fontWeight?: number; fontFamily?: string; fontStyle?: string;
  uppercase?: boolean;
}
// LabelStyling = the ~30 NodeStyle label* fields, with `colorRole` replacing concrete `labelColor`
export interface LabelStyling {
  colorRole?: ColorRole;    color?: number;        // themed | fixed
  fontSize?: number; fontFamily?: string; fontWeight?: number; fontStyle?: string;
  placement?: 'bottom' | 'center' | 'right' | 'top' | 'left';
  offsetX?: number; offsetY?: number; rotation?: number; align?: string;
  background?: boolean; backgroundColorRole?: ColorRole; backgroundColor?: number;
  /* …remaining NodeStyle label* fields… */
}
```

### Per-type assignment (new fields on `GraphLayerOptions`, `@invana/graph`)
```ts
export interface NodeTypeBinding {
  structure: string;                       // NodeStructureTemplate name
  styling: string;                         // NodeStylingTemplate name
  bindings: Record<string, string>;        // slot → dotted data path ('data.name')
  fields?: { key: string; label: string }[];   // host-provided schema → editor picker
}
interface GraphLayerOptions {
  // … existing
  nodeStructureTemplates?: Record<string, NodeStructureTemplate>;
  nodeStylingTemplates?:   Record<string, NodeStylingTemplate>;
  nodeTypes?:              Record<string, NodeTypeBinding>;
}
```

### `ThemeBehaviour` (`@invana/graph`) — the sole publisher
```ts
export interface ThemeBehaviourOptions extends BehaviourOptions {
  themes?: ThemeRegistry;           // ∪ built-ins (default/forest/ocean/gold/rose/minimal)
  active?: string;                  // active theme name (matched to host theme family)
  fallback?: string;                // default 'default'
  mode?: 'system' | 'light' | 'dark';
  accent?: 'css-var' | number;      // accent for ACCENT slots
  accentVar?: string;               // default '--color-primary'
  // single-layer shorthand (eases 31-story migration; mode 'system' = OS follow)
  targetLayerId?: string; light?: Record<string, unknown>; dark?: Record<string, unknown>;
}

export class ThemeBehaviour extends Behaviour {
  setOptions(patch: Partial<Pick<ThemeBehaviourOptions,
    'themes'|'active'|'fallback'|'mode'|'accent'>>): void;   // canvas.update({behaviours:{theme:…}}) → here
  setMode(mode: 'system'|'light'|'dark'): void;
  setTheme(name: string): void;
  getMode(): 'system'|'light'|'dark';
  getActiveName(): string;
  getResolvedKind(): 'light'|'dark';
  // internals: apply() → ctx.theme.set({kind,name,palette}) (publish) + applyGroups() (per-group updateNode)
}
```

---

## How it composes (resolution pipeline)

For a node of type `person` under active theme `forest`, mode `dark`:

```
nodeTypes.person        → structure 'idCard', styling 'idCardStyling', bindings
NodeStructureTemplate   → card, row 3 has a 'title' slot; bindings.title = 'data.name' → "Ada Lovelace"
NodeStylingTemplate     → title uses role 'heading', 15px bold
ctx.theme (forest.dark) → heading = 0xe2f0e6
        ⇓ GraphLayer compiles:
  card → CompositeSpec.parts[] with computed positions (fixed 220×96), title part fill 0xe2f0e6
  simple → NodeStyle (shape + label) on the lean path
```

- **`ThemeBehaviour.apply()`** resolves `themes[active][kind]` → `palette`, injects the live accent into `ACCENT`/accent-role slots, then `ctx.theme.set({kind, name, palette})` → emits `theme:change`.
- **`GraphLayer`** subscribes; on `theme:change` it re-resolves every node's styling roles → hex and re-renders (`setNodeDefaults`/`setEdgeDefaults`/`setStateConfigs` under the hood) + the harvested per-group `updateNode` pass.
- **`BackgroundLayer` / `MiniMapLayer`** subscribe; recolor backdrop/grid from the palette (or their own `{light,dark}`).
- **Switch theme** → only the palette changes → all layers recolor, structure & styling untouched.

---

## Usage example — one story, simple + card nodes

`person` → IdCard (composite); `Concept` → circle + label (simple, lean path). One theme recolors both. Canonical imperative pattern (add everything → `init()` last).

```ts
import { GraphCanvas, GraphLayer, BackgroundLayer, DragPanBehaviour,
         ThemeBehaviour, type GraphData } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { createContainer, onStoryTeardown } from '../../div-util';

export const PeopleAndConcepts = {
  render: () => createContainer({ id: 'cvs-people-concepts' }),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('#cvs-people-concepts')!;

    const data: GraphData = {
      nodes: [
        { id: 'ada',  type: 'person',  data: { name: 'Ada Lovelace', role: 'Mathematician',      avatar: 'https://i.pravatar.cc/80?u=ada' } },
        { id: 'alan', type: 'person',  data: { name: 'Alan Turing',  role: 'Computer Scientist', avatar: 'https://i.pravatar.cc/80?u=alan' } },
        { id: 'ae',   type: 'Concept', data: { name: 'Analytical Engine' } },
        { id: 'tm',   type: 'Concept', data: { name: 'Turing Machine' } },
      ],
      edges: [
        { id: 'e1', source: 'ada',  target: 'ae', type: 'DESIGNED' },
        { id: 'e2', source: 'alan', target: 'tm', type: 'DESCRIBED' },
        { id: 'e3', source: 'ada',  target: 'alan', type: 'INFLUENCED' },
      ],
    };

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: data } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));   // sole theme publisher
    const force = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(force);

    const config = {
      layers: {
        graph: {
          // 1) STRUCTURE — skeletons (shape/slots/layout), NO colours
          nodeStructureTemplates: {
            circle: { kind: 'simple', shape: { kind: 'circle', radius: 10 }, slots: { label: true } },
            idCard: { kind: 'card', width: 220, height: 96, rows: [
              { slots: [{ slot: 'type', kind: 'tag' }] },
              { divider: true },
              { slots: [
                  { slot: 'avatar', kind: 'image', shape: 'circle', size: 40 },
                  { stack: [{ slot: 'title', kind: 'text' }, { slot: 'subtitle', kind: 'text' }] },
              ] },
            ] },
          },
          // 2) STYLING — roles + typography, NO hex
          nodeStylingTemplates: {
            circleStyling: { fillRole: 'accent', strokeRole: 'stroke',
                             label: { colorRole: 'foreground', fontSize: 12, placement: 'bottom' } },
            idCardStyling: { bgRole: 'cardBg', accentRole: 'accent', slots: {
              type:     { colorRole: 'muted',   fontSize: 10, fontWeight: 600, uppercase: true },
              title:    { colorRole: 'heading', fontSize: 15, fontWeight: 700 },
              subtitle: { colorRole: 'muted',   fontSize: 12 },
              divider:  { colorRole: 'divider' },
            } },
          },
          // per-type: structure + styling + field bindings
          nodeTypes: {
            person:  { structure: 'idCard', styling: 'idCardStyling',
                       bindings: { type: 'type', avatar: 'data.avatar', title: 'data.name', subtitle: 'data.role' } },
            Concept: { structure: 'circle', styling: 'circleStyling',
                       bindings: { label: 'data.name' } },
          },
        },
      },
      behaviours: {
        pan:   { enabled: true },
        // 3) THEME — global palette (role→hex), forest/ocean × light/dark
        theme: { enabled: true, mode: 'system', active: 'default', accent: 'css-var' },  // themes built-in
      },
      layouts: { force: { link: { distance: 90 }, charge: { strength: -300 }, collide: { radius: 60 } } },
      activeLayout: 'force',
    };

    await canvas.init({ container, autoResize: true, config });
  },
};
```

Switch the whole graph to forest-dark: `canvas.update({ behaviours: { theme: { active: 'forest', mode: 'dark' } } })` — both card and simple nodes recolour, no structural change.

---

## Current API → after (the collapse)

**`THEME_LIGHT`/`THEME_DARK` + `ShellThemeSync`** (GraphCanvasApp) → deleted. Replaced by `ThemeTemplateSync`:
```tsx
function ThemeTemplateSync() {
  const { theme, isDark } = useTheme();                    // reads the NAME now, not just isDark
  const update = useGraphCanvasUpdate();
  useEffect(() => update({ behaviours: { theme: {
    mode: isDark ? 'dark' : 'light', active: themeFamily(theme) } } }), [update, theme, isDark]);
  return null;
}
```
**`SystemThemeBehaviour`** (31 stories) → `ThemeBehaviour` single-layer shorthand (`{ id:'theme', targetLayerId:'bg' }`, config `{ enabled, mode:'system', light, dark }`) — mechanical rename.
**`ResponsiveThemeBehaviour`** → deleted; per-group `updateNode` logic harvested into `ThemeBehaviour.applyGroups`.
**`useSystemTheme`** → deleted.
**Composite cards** (hand-authored `parts[]`, `as unknown` cast) → `card` structure template + auto-layout compiler; `composite` first-class in `NodeShapeOptions`.

---

## File-level change list

**`@invana/canvas`** (additive)
- NEW theme signal: `ResolvedTheme` + `ThemeState` on `CanvasContext` + `'theme:change'` on `ctx.events`.
- MOD `src/layers/BackgroundLayer.ts` — subscribe to `ctx.theme`/`theme:change` in `onMount`; remove private `matchMedia`.
- DEL `src/layers/ThemedBackgroundLayer.ts`.
- Additive `CompositePart` variants only if a card needs one (`composite` itself already exists).

**`@invana/graph`**
- NEW `src/theme/` — `Theme`/`ColorRole`/`ThemePalette` types, `accent.ts` (`resolveAccent`/`injectAccent`/`hexToNumber`), `family.ts` (`themeFamily`), `themes.ts` (the 6 built-ins, light+dark), `index.ts`.
- NEW `src/behaviours/ThemeBehaviour.ts` — sole publisher (`ctx.theme.set`) + harvested `applyGroups`.
- NEW `src/template/` — `NodeStructureTemplate`/`NodeStylingTemplate` types, `card` compiler (`cardToComposite`), built-in structures (`circle/rect/arc/regular-polygon/star/polygon`, `idCard`).
- MOD `src/layer/types.ts` — `composite` first-class in `NodeShapeOptions`; `nodeStructureTemplates`/`nodeStylingTemplates`/`nodeTypes` on `GraphLayerOptions`.
- MOD `src/layer/GraphLayer.ts` — subscribe to `theme:change` (`onMount`); resolve `nodeTypes` (structure+styling+bindings) → NodeStyle / CompositeSpec via role resolver; `nodeSpec` `card` branch.
- MOD `src/layer/MiniMapLayer.ts` — subscribe; remove private `matchMedia`.
- MOD `src/behaviours/index.ts`, `src/index.ts` — add new exports; **remove** `ResponsiveThemeBehaviour`.
- DEL `src/behaviours/ResponsiveThemeBehaviour.ts`; fix `ColorByLabelBehaviour.ts:18,26,29` TSDoc.

**`@invana/canvas-react`**
- MOD `src/apps/GraphCanvasApp.tsx` — delete `THEME_LIGHT`/`THEME_DARK`/`ShellThemeSync`; add `ThemeTemplateSync` + register `theme` in the bundle.
- DEL `src/hooks/useSystemTheme.ts`; remove exports (`hooks/index.ts:56`, `index.ts:187`); fix `ColorByLabelBehaviour.tsx:23`.

**`@invana/canvas-ui`** — NEW `editors/node-structure/` + `editors/node-styling/`, sharing a `SlotBindingField` (evolved from `editors/hover-preview-card/` scaffold + `specToForm`/`formToSpec`).

**`apps/storybook`** — DEL `stories/system-theme.tsx`; migrate 31 `SystemThemeBehaviour` stories; migrate the `WithThemedBackground` story off `ThemedBackgroundLayer`.

---

## Sequencing
**Phase A — theming.** Theme signal in canvas → `ThemeBehaviour` + `src/theme/` (6 built-ins) → subscribers (`BackgroundLayer`/`MiniMapLayer`/`GraphLayer`) → `GraphCanvasApp` rewire → remove `ResponsiveTheme`/`SystemTheme`/`useSystemTheme`/`ThemedBackgroundLayer` → migrate 31 stories.
**Phase B — structure/styling templates.** `composite` first-class + `card` compiler → `NodeStructureTemplate`/`NodeStylingTemplate` + `nodeTypes` resolution → built-in structures → `NodeStructureEditor` + `NodeStylingEditor` (+ `SlotBindingField`).

## Verification
- `pnpm check-types` clean after each phase (esp. graph + export removals).
- `pnpm --filter @canvas/storybook dev`:
  - `graph-canvas-app/FullFeatured` → ThemeToggle flips bg **+ node fills/labels + edge stroke/labels + selection ring**; host `dark-forest`/`dark-ocean` recolor the graph; unknown theme → `default`.
  - The new `PeopleAndConcepts` story → IdCards + circles render together, recolor on theme switch.
  - A migrated imperative story still OS-themes the background (`mode:'system'` parity).
- `pnpm build` — no references to deleted symbols (`ResponsiveThemeBehaviour`, `useSystemTheme`, `ThemedBackgroundLayer`).

## Open items (minor)
- **`themeFamily` grammar** — match host theme `id`/`variantId`, strip `light-`/`dark-` + accent suffix → `forest`. Confirm against the real `@invana/styling` id format during impl.
- **Phase B editors** — exact field set per editor; can land runtime (config-authored templates) first, editors second.
