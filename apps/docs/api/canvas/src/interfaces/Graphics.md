# Interface: Graphics

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:57

The Graphics class is primarily used to render primitive shapes such as lines, circles and
rectangles to the display, and to color and fill them. It can also be used to create complex
masks and hit areas for interaction.

## Example

```ts
// Create a new graphics object
const graphics = new Graphics();

// Draw a filled rectangle with a stroke
graphics
    .rect(0, 0, 100, 100)
    .fill({ color: 0xff0000 }) // Fill with red
    .stroke({ width: 2, color: 0x000000 }); // Stroke with black

// Draw a complex shape
graphics
    .moveTo(50, 50)
    .lineTo(100, 100)
    .arc(100, 100, 50, 0, Math.PI)
    .closePath()
    .fill({ color: 0x00ff00, alpha: 0.5 }); // Fill the shape

// Use as a mask
sprite.mask = graphics;
```

## See

 - GraphicsContext For the underlying drawing API
 - GraphicsPath For path creation

## Standard

## Extends

- `Graphics`.`ViewContainer`\<`GraphicsGpuData`\>

## Implements

- `Instruction`

## Properties

### \_bounds

> `protected` **\_bounds**: `Bounds`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:59

#### Inherited from

`ViewContainer._bounds`

***

### \_boundsDirty

> `protected` **\_boundsDirty**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:60

#### Inherited from

`ViewContainer._boundsDirty`

***

### \_cx

> **\_cx**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:751

**`Internal`**

The X-coordinate value of the normalized local X axis,
the first column of the local transformation matrix without a scale.

#### Inherited from

`ViewContainer._cx`

***

### \_cy

> **\_cy**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:763

**`Internal`**

The X-coordinate value of the normalized local Y axis,
the second column of the local transformation matrix without a scale.

#### Inherited from

`ViewContainer._cy`

***

### \_gcData?

> `optional` **\_gcData?**: `GCData`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:54

**`Internal`**

#### Inherited from

`ViewContainer._gcData`

***

### \_gcLastUsed

> **\_gcLastUsed**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:58

**`Internal`**

#### Inherited from

`ViewContainer._gcLastUsed`

***

### \_gpuData

> **\_gpuData**: `Record`\<`number`, `GPU_DATA`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:52

**`Internal`**

#### Inherited from

`ViewContainer._gpuData`

***

### \_lastUsed

> **\_lastUsed**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:50

**`Internal`**

#### Inherited from

`ViewContainer._lastUsed`

***

### \_pivot

> **\_pivot**: `ObservablePoint`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:734

**`Internal`**

The pivot point of the container that it rotates around.

#### Inherited from

`ViewContainer._pivot`

***

### \_position

> **\_position**: `ObservablePoint`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:724

**`Internal`**

The coordinate of the object relative to the local coordinates of the parent.

#### Inherited from

`ViewContainer._position`

***

### \_roundPixels

> **\_roundPixels**: `0` \| `1`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:48

**`Internal`**

#### Inherited from

`ViewContainer._roundPixels`

***

### \_scale

> **\_scale**: `ObservablePoint`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:729

**`Internal`**

The scale factor of the object.

#### Inherited from

`ViewContainer._scale`

***

### \_skew

> **\_skew**: `ObservablePoint`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:745

**`Internal`**

The skew amount, on the x and y axis.

#### Inherited from

`ViewContainer._skew`

***

### \_sx

> **\_sx**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:757

**`Internal`**

The Y-coordinate value of the normalized local X axis,
the first column of the local transformation matrix without a scale.

#### Inherited from

`ViewContainer._sx`

***

### \_sy

> **\_sy**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:769

**`Internal`**

The Y-coordinate value of the normalized local Y axis,
the second column of the local transformation matrix without a scale.

#### Inherited from

`ViewContainer._sy`

***

### \_zIndex

> **\_zIndex**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/sortMixin.d.ts:60

**`Internal`**

#### Inherited from

`ViewContainer._zIndex`

***

### accessible?

> `optional` **accessible?**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/accessibility/accessibilityTarget.d.ts:31

Flag for if the object is accessible. If true AccessibilityManager will overlay a
shadow div with attributes set

#### Default

```ts
false
```

#### Example

```js
const container = new Container();
container.accessible = true;
```

#### Inherited from

`ViewContainer.accessible`

***

### accessibleChildren?

> `optional` **accessibleChildren?**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/accessibility/accessibilityTarget.d.ts:126

Setting to false will prevent any children inside this container to
be accessible. Defaults to true.

#### Default

```ts
true
```

#### Example

```js
const container = new Container();
container.accessible = true;
container.accessibleChildren = false; // This will prevent any children from being accessible

const sprite = new Sprite(texture);
sprite.accessible = true; // This will not work since accessibleChildren is false
```

#### Inherited from

`ViewContainer.accessibleChildren`

***

### accessibleHint?

> `optional` **accessibleHint?**: `string`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/accessibility/accessibilityTarget.d.ts:56

Sets the aria-label attribute of the shadow div

#### Default

```ts
null
```

#### Advanced

#### Example

```js
const container = new Container();
container.accessible = true;
container.accessibleHint = 'This is a container';
```

#### Inherited from

`ViewContainer.accessibleHint`

***

### accessiblePointerEvents?

> `optional` **accessiblePointerEvents?**: `PointerEvents`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/accessibility/accessibilityTarget.d.ts:100

Specify the pointer-events the accessible div will use
Defaults to auto.

#### Default

```ts
'auto'
```

#### Advanced

#### Example

```js
const container = new Container();
container.accessible = true;
container.accessiblePointerEvents = 'none'; // or 'auto', 'visiblePainted', etc.
```

#### Inherited from

`ViewContainer.accessiblePointerEvents`

***

### accessibleText?

> `optional` **accessibleText?**: `string`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/accessibility/accessibilityTarget.d.ts:111

Sets the text content of the shadow

#### Default

```ts
null
```

#### Example

```js
const container = new Container();
container.accessible = true;
container.accessibleText = 'This is a container';
```

#### Inherited from

`ViewContainer.accessibleText`

***

### accessibleTitle?

> `optional` **accessibleTitle?**: `string`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/accessibility/accessibilityTarget.d.ts:44

Sets the title attribute of the shadow div
If accessibleTitle AND accessibleHint has not been this will default to 'container [tabIndex]'

#### Default

```ts
null
```

#### Example

```js
const container = new Container();
container.accessible = true;
container.accessibleTitle = 'My Container';
```

#### Inherited from

`ViewContainer.accessibleTitle`

***

### accessibleType?

> `optional` **accessibleType?**: keyof `HTMLElementTagNameMap`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/accessibility/accessibilityTarget.d.ts:86

Specify the type of div the accessible layer is. Screen readers treat the element differently
depending on this type. Defaults to button.

#### Default

```ts
'button'
```

#### Advanced

#### Example

```js
const container = new Container();
container.accessible = true;
container.accessibleType = 'button'; // or 'link', 'checkbox', etc.
```

#### Inherited from

`ViewContainer.accessibleType`

***

### allowChildren

> **allowChildren**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:46

**`Internal`**

#### Inherited from

`ViewContainer.allowChildren`

***

### autoGarbageCollect

> **autoGarbageCollect**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:56

If set to true, the resource will be garbage collected automatically when it is not used.

#### Inherited from

`ViewContainer.autoGarbageCollect`

***

### batched

> **batched**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:94

**`Internal`**

#### Inherited from

`ViewContainer.batched`

***

### boundsArea

> **boundsArea**: `Rectangle`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:815

An optional bounds area for this container. Setting this rectangle will stop the renderer
from recursively measuring the bounds of each children and instead use this single boundArea.

> [!IMPORTANT] This is great for optimisation! If for example you have a
> 1000 spinning particles and you know they all sit within a specific bounds,
> then setting it will mean the renderer will not need to measure the
> 1000 children to find the bounds. Instead it will just use the bounds you set.

#### Example

```ts
const container = new Container();
container.boundsArea = new Rectangle(0, 0, 500, 500);
```

#### Inherited from

`ViewContainer.boundsArea`

***

### ~~cacheAsBitmap~~

> **cacheAsBitmap**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/cacheAsTextureMixin.d.ts:61

Legacy property for backwards compatibility with PixiJS v7 and below.
Use `cacheAsTexture` instead.

#### Deprecated

since 8.0.0

#### Inherited from

`ViewContainer.cacheAsBitmap`

***

### cacheAsTexture

> **cacheAsTexture**: (`val`) => `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/cacheAsTextureMixin.d.ts:45

Caches this container as a texture. This allows the container to be rendered as a single texture,
which can improve performance for complex static containers.

#### Parameters

##### val

`boolean` \| `CacheAsTextureOptions`

If true, enables caching with default options.
            If false, disables caching.
            Can also pass options object to configure caching behavior.

#### Returns

`void`

#### Example

```ts
// Basic caching
container.cacheAsTexture(true);

// With custom options
container.cacheAsTexture({
    resolution: 2,
    antialias: true,
});

// Disable caching
container.cacheAsTexture(false);

// Cache a complex UI
const ui = new Container();
// Add multiple children...
ui.cacheAsTexture(true);
ui.updateCacheTexture(); // Update if contents change
```

#### See

 - Container#updateCacheTexture For updating cached content
 - [Container#isCachedAsTexture](#iscachedastexture) For checking cache state

#### Inherited from

`ViewContainer.cacheAsTexture`

***

### canBundle

> `readonly` **canBundle**: `true` = `true`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:44

**`Internal`**

#### Inherited from

`ViewContainer.canBundle`

***

### children

> `readonly` **children**: `ContainerChild`[]

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:639

The array of children of this container. Each child must be a Container or extend from it.

The array is read-only, but its contents can be modified using Container methods.

#### Example

```ts
// Access children
const firstChild = container.children[0];
const lastChild = container.children[container.children.length - 1];
```

#### See

 - Container#addChild For adding children
 - Container#removeChild For removing children

#### Inherited from

`ViewContainer.children`

***

### cullable?

> `optional` **cullable?**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/culling/cullingMixin.d.ts:69

Controls whether this object should be culled when out of view.
When true, the object will not be rendered if its bounds are outside the visible area.

#### Example

```ts
const sprite = new Sprite(texture);

// Enable culling
sprite.cullable = true;

// Force object to always render
sprite.cullable = false;
```

#### Remarks

- Does not affect transform updates
- Applies to this object only
- Children follow their own cullable setting

#### Default

```ts
false
```

#### Inherited from

`ViewContainer.cullable`

***

### cullableChildren?

> `optional` **cullableChildren?**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/culling/cullingMixin.d.ts:92

Controls whether children of this container can be culled.
When false, skips recursive culling checks for better performance.

#### Example

```ts
const container = new Container();

// Enable container culling
container.cullable = true;

// Disable child culling for performance
container.cullableChildren = false;

// Children will always render if container is visible
container.addChild(sprite1, sprite2, sprite3);
```

#### Remarks

- Improves performance for static scenes
- Useful when children are always within container bounds
- Parent culling still applies

#### Default

```ts
true
```

#### Inherited from

`ViewContainer.cullableChildren`

***

### cullArea?

> `optional` **cullArea?**: `Rectangle`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/culling/cullingMixin.d.ts:49

Custom shape used for culling calculations instead of object bounds.
Defined in local space coordinates relative to the object.
> [!NOTE]
> Setting this to a custom Rectangle allows you to define a specific area for culling,
> which can improve performance by avoiding expensive bounds calculations.

#### Example

```ts
const container = new Container();

// Define custom culling boundary
container.cullArea = new Rectangle(0, 0, 800, 600);

// Reset to use object bounds
container.cullArea = null;
```

#### Remarks

- Improves performance by avoiding bounds calculations
- Useful for containers with many children
- Set to null to use object bounds

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.cullArea`

***

### cursor?

> `optional` **cursor?**: `Cursor` \| `string` & `object`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:187

The cursor style to display when the mouse pointer is hovering over the object.
Accepts any valid CSS cursor value or custom cursor URL.

#### Example

```ts
// Common cursor types
sprite.cursor = 'pointer';     // Hand cursor for clickable elements
sprite.cursor = 'grab';        // Grab cursor for draggable elements
sprite.cursor = 'crosshair';   // Precise cursor for selection
sprite.cursor = 'not-allowed'; // Indicate disabled state

// Direction cursors
sprite.cursor = 'n-resize';    // North resize
sprite.cursor = 'ew-resize';   // East-west resize
sprite.cursor = 'nesw-resize'; // Northeast-southwest resize

// Custom cursor with fallback
sprite.cursor = 'url("custom.png"), auto';
sprite.cursor = 'url("cursor.cur") 2 2, pointer'; // With hotspot offset
```

#### Default

```ts
undefined
```

#### See

 - EventSystem.cursorStyles For setting global cursor styles
 - [https://developer.mozilla.org/en-US/docs/Web/CSS/cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) MDN Cursor Documentation

#### Inherited from

`ViewContainer.cursor`

***

### depthOfChildModified

> **depthOfChildModified**: () => `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/sortMixin.d.ts:74

**`Internal`**

#### Returns

`void`

#### Inherited from

`ViewContainer.depthOfChildModified`

***

### destroyed

> **destroyed**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:719

Whether this object has been destroyed. If true, the object should no longer be used.
After an object is destroyed, all of its functionality is disabled and references are removed.

#### Example

```ts
// Cleanup with destroy
sprite.destroy();
console.log(sprite.destroyed); // true
```

#### Default

```ts
false
```

#### See

Container#destroy For destroying objects

#### Inherited from

`ViewContainer.destroyed`

***

### effects?

> `optional` **effects?**: `Effect`[]

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/effectsMixin.d.ts:183

todo Needs docs

#### Advanced

#### Inherited from

`ViewContainer.effects`

***

### eventMode?

> `optional` **eventMode?**: `EventMode`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:225

Enable interaction events for the Container. Touch, pointer and mouse events are supported.

#### Example

```ts
const sprite = new Sprite(texture);

// Enable standard interaction (like buttons)
sprite.eventMode = 'static';
sprite.on('pointerdown', () => console.log('clicked!'));

// Enable for moving objects
sprite.eventMode = 'dynamic';
sprite.on('pointermove', () => updatePosition());

// Disable all interaction
sprite.eventMode = 'none';

// Only allow child interactions
sprite.eventMode = 'passive';
```

Available modes:

- `'none'`: Ignores all interaction events, even on its children. Best for pure visuals.
- `'passive'`: **(default)** Does not emit events and ignores hit testing on itself and non-interactive
children. Interactive children will still emit events.
- `'auto'`: Does not emit events but is hit tested if parent is interactive. Same as `interactive = false` in v7.
- `'static'`: Emit events and is hit tested. Same as `interactive = true` in v7. Best for buttons/UI.
- `'dynamic'`: Like static but also receives synthetic events when pointer is idle. Best for moving objects.

Performance tips:
- Use `'none'` for pure visual elements
- Use `'passive'` for containers with some interactive children
- Use `'static'` for standard UI elements
- Use `'dynamic'` only when needed for moving/animated elements

#### Since

7.2.0

#### Inherited from

`ViewContainer.eventMode`

***

### filterArea?

> `optional` **filterArea?**: `Rectangle`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/effectsMixin.d.ts:178

The area the filter is applied to. This is used as an optimization to define a specific region
for filter effects instead of calculating the display object bounds each frame.

> [!NOTE]
> Setting this to a custom Rectangle allows you to define a specific area for filter effects,
> which can improve performance by avoiding expensive bounds calculations.

#### Example

```ts
// Set specific filter area
container.filterArea = new Rectangle(0, 0, 100, 100);

// Optimize filter region
const screen = app.screen;
container.filterArea = new Rectangle(
    screen.x,
    screen.y,
    screen.width,
    screen.height
);
```

#### See

 - Container#filters For applying filters
 - Rectangle For area definition

#### Inherited from

`ViewContainer.filterArea`

***

### globalDisplayStatus

> **globalDisplayStatus**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:798

**`Internal`**

#### Inherited from

`ViewContainer.globalDisplayStatus`

***

### groupAlpha

> **groupAlpha**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:780

**`Internal`**

#### Inherited from

`ViewContainer.groupAlpha`

***

### groupBlendMode

> **groupBlendMode**: `BLEND_MODES`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:788

**`Internal`**

#### Inherited from

`ViewContainer.groupBlendMode`

***

### groupColor

> **groupColor**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:782

**`Internal`**

#### Inherited from

`ViewContainer.groupColor`

***

### groupColorAlpha

> **groupColorAlpha**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:784

**`Internal`**

#### Inherited from

`ViewContainer.groupColorAlpha`

***

### groupTransform

> `readonly` **groupTransform**: `Matrix`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:705

The group transform is a transform relative to the render group it belongs too.
If this container is render group then this will be an identity matrix. other wise it
will be the same as the relativeGroupTransform.
Use this value when actually rendering things to the screen

#### Advanced

#### Inherited from

`ViewContainer.groupTransform`

***

### hitArea?

> `optional` **hitArea?**: `IHitArea`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:297

Defines a custom hit area for pointer interaction testing. When set, this shape will be used
for hit testing instead of the container's standard bounds.

#### Example

```ts
import { Rectangle, Circle, Sprite } from 'pixi.js';

// Rectangular hit area
const button = new Sprite(texture);
button.eventMode = 'static';
button.hitArea = new Rectangle(0, 0, 100, 50);

// Circular hit area
const icon = new Sprite(texture);
icon.eventMode = 'static';
icon.hitArea = new Circle(32, 32, 32);

// Custom hit area with polygon
const custom = new Sprite(texture);
custom.eventMode = 'static';
custom.hitArea = new Polygon([0,0, 100,0, 100,100, 0,100]);

// Custom hit testing logic
sprite.hitArea = {
    contains(x: number, y: number) {
        // Custom collision detection
        return x >= 0 && x <= width && y >= 0 && y <= height;
    }
};
```

#### Remarks

- Takes precedence over the container's bounds for hit testing
- Can improve performance by simplifying collision checks
- Useful for irregular shapes or precise click areas

#### Inherited from

`ViewContainer.hitArea`

***

### interactive?

> `optional` **interactive?**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:238

Whether this object should fire UI events. This is an alias for `eventMode` set to `'static'` or `'passive'`.
Setting this to true will enable interaction events like `pointerdown`, `click`, etc.
Setting it to false will disable all interaction events on this object.

#### See

[Container.eventMode](#eventmode)

#### Example

```ts
// Enable interaction events
sprite.interactive = true;  // Sets eventMode = 'static'
sprite.interactive = false; // Sets eventMode = 'passive'
```

#### Inherited from

`ViewContainer.interactive`

***

### interactiveChildren?

> `optional` **interactiveChildren?**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:261

Controls whether children of this container can receive pointer events.

Setting this to false allows PixiJS to skip hit testing on all children,
improving performance for containers with many non-interactive children.

#### Default

```ts
true
```

#### Example

```ts
// Container with many visual-only children
const container = new Container();
container.interactiveChildren = false; // Skip hit testing children

// Menu with interactive buttons
const menu = new Container();
menu.interactiveChildren = true; // Test all children
menu.addChild(button1, button2, button3);

// Performance optimization
background.interactiveChildren = false;
foreground.interactiveChildren = true;
```

#### Inherited from

`ViewContainer.interactiveChildren`

***

### isCachedAsTexture

> `readonly` **isCachedAsTexture**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/cacheAsTextureMixin.d.ts:75

Whether this container is currently cached as a texture.

#### Example

```ts
// Check cache state
if (container.isCachedAsTexture) {
    console.log('Container is cached');
}
```

#### See

 - Container#cacheAsTexture For enabling caching
 - Container#updateCacheTexture For updating cache

#### Inherited from

`ViewContainer.isCachedAsTexture`

***

### isInteractive

> **isInteractive**: () => `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:1040

Determines if the container is interactive or not

#### Returns

`boolean`

Whether the container is interactive or not

#### Since

7.2.0

#### Example

```ts
import { Sprite } from 'pixi.js';

const sprite = new Sprite(texture);
sprite.eventMode = 'static';
sprite.isInteractive(); // true

sprite.eventMode = 'dynamic';
sprite.isInteractive(); // true

sprite.eventMode = 'none';
sprite.isInteractive(); // false

sprite.eventMode = 'passive';
sprite.isInteractive(); // false

sprite.eventMode = 'auto';
sprite.isInteractive(); // false
```

#### Inherited from

`ViewContainer.isInteractive`

***

### label

> **label**: `string`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/findMixin.d.ts:8

The instance label of the object.

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.label`

***

### layerParentId

> **layerParentId**: `string`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:829

**`Internal`**

#### Inherited from

`ViewContainer.layerParentId`

***

### localAlpha

> **localAlpha**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:778

**`Internal`**

#### Inherited from

`ViewContainer.localAlpha`

***

### localBlendMode

> **localBlendMode**: `BLEND_MODES`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:786

**`Internal`**

#### Inherited from

`ViewContainer.localBlendMode`

***

### localColor

> **localColor**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:776

**`Internal`**

#### Inherited from

`ViewContainer.localColor`

***

### localDisplayStatus

> **localDisplayStatus**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:796

**`Internal`**

This property holds three bits: culled, visible, renderable
the third bit represents culling (0 = culled, 1 = not culled) 0b100
the second bit represents visibility (0 = not visible, 1 = visible) 0b010
the first bit represents renderable (0 = not renderable, 1 = renderable) 0b001

#### Inherited from

`ViewContainer.localDisplayStatus`

***

### localTransform

> `readonly` **localTransform**: `Matrix`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:688

Current transform of the object based on local factors: position, scale, other stuff.
This matrix represents the local transformation without any parent influence.

#### Example

```ts
// Basic transform access
const localMatrix = sprite.localTransform;
console.log(localMatrix.toString());
```

#### See

 - Container#worldTransform For global transform
 - Container#groupTransform For render group transform

#### Inherited from

`ViewContainer.localTransform`

***

### mask

> **mask**: `Mask`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/effectsMixin.d.ts:254

Sets a mask for the displayObject. A mask is an object that limits the visibility of an
object to the shape of the mask applied to it.

> [!IMPORTANT] In PixiJS a regular mask must be a Graphics or a Sprite object.
> This allows for much faster masking in canvas as it uses shape clipping.
> A mask of an object must be in the subtree of its parent.
> Otherwise, `getLocalBounds` may calculate incorrect bounds, which makes the container's width and height wrong.

Sprite masks read the red channel by default. Use [Container#setMask](#setmask) with `channel: 'alpha'`
to read the alpha channel instead. See MaskOptions#channel for details.

#### Example

```ts
// Apply mask to sprite
const sprite = new Sprite(texture);
sprite.mask = graphics;

// Remove mask
sprite.mask = null;
```

#### See

 - Graphics For creating mask shapes
 - Sprite For texture-based masks
 - [Container#setMask](#setmask) For advanced mask options including channel selection

#### Inherited from

`ViewContainer.mask`

***

### ~~name~~

> **name**: `string`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/findMixin.d.ts:24

The instance name of the object.

#### Deprecated

since 8.0.0

#### See

Container#label

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.name`

***

### onclick?

> `optional` **onclick?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:317

Property-based event handler for the `click` event.
Fired when a pointer device (mouse, touch, etc.) completes a click action.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('click', (event) => {
   console.log('Sprite clicked at:', event.global.x, event.global.y);
});
// Using property-based handler
sprite.onclick = (event) => {
    console.log('Clicked at:', event.global.x, event.global.y);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onclick`

***

### onglobalmousemove?

> `optional` **onglobalmousemove?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:430

Property-based event handler for the `globalmousemove` event.

Fired when the mouse moves anywhere, regardless of whether the pointer is over this object.
The object must have `eventMode` set to 'static' or 'dynamic' to receive this event.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('globalmousemove', (event) => {
    // Move sprite to mouse position
    sprite.position.copyFrom(event.global);
});
// Using property-based handler
sprite.onglobalmousemove = (event) => {
    // Move sprite to mouse position
    sprite.position.copyFrom(event.global);
};
```

#### Default

```ts
null
```

#### Remarks

- Fires even when the mouse is outside the object's bounds
- Useful for drag operations or global mouse tracking
- Must have `eventMode` set appropriately to receive events
- Part of the global move events family along with `globalpointermove` and `globaltouchmove`

#### Inherited from

`ViewContainer.onglobalmousemove`

***

### onglobalpointermove?

> `optional` **onglobalpointermove?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:637

Property-based event handler for the `globalpointermove` event.

Fired when the pointer moves anywhere, regardless of whether the pointer is over this object.
The object must have `eventMode` set to 'static' or 'dynamic' to receive this event.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('globalpointermove', (event) => {
    sprite.position.set(event.global.x, event.global.y);
});
// Using property-based handler
sprite.onglobalpointermove = (event) => {
    sprite.position.set(event.global.x, event.global.y);
};
```

#### Default

```ts
null
```

#### Remarks

- Fires even when the mouse is outside the object's bounds
- Useful for drag operations or global mouse tracking
- Must have `eventMode` set appropriately to receive events
- Part of the global move events family along with `globalpointermove` and `globaltouchmove`

#### Inherited from

`ViewContainer.onglobalpointermove`

***

### onglobaltouchmove?

> `optional` **onglobaltouchmove?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:947

Property-based event handler for the `globaltouchmove` event.

Fired when a touch interaction moves anywhere, regardless of whether the pointer is over this object.
The object must have `eventMode` set to 'static' or 'dynamic' to receive this event.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('globaltouchmove', (event) => {
    sprite.position.set(event.global.x, event.global.y);
});
// Using property-based handler
sprite.onglobaltouchmove = (event) => {
    sprite.position.set(event.global.x, event.global.y);
};
```

#### Default

```ts
null
```

#### Remarks

- Fires even when the touch is outside the object's bounds
- Useful for drag operations or global touch tracking
- Must have `eventMode` set appropriately to receive events
- Part of the global move events family along with `globalpointermove` and `globalmousemove`

#### Inherited from

`ViewContainer.onglobaltouchmove`

***

### onmousedown?

> `optional` **onmousedown?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:339

Property-based event handler for the `mousedown` event.
Fired when a mouse button is pressed while the pointer is over the object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mousedown', (event) => {
   sprite.alpha = 0.5; // Visual feedback
   console.log('Mouse button:', event.button);
});
// Using property-based handler
sprite.onmousedown = (event) => {
    sprite.alpha = 0.5; // Visual feedback
    console.log('Mouse button:', event.button);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onmousedown`

***

### onmouseenter?

> `optional` **onmouseenter?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:359

Property-based event handler for the `mouseenter` event.
Fired when the mouse pointer enters the bounds of the object. Does not bubble.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseenter', (event) => {
    sprite.scale.set(1.1);
});
// Using property-based handler
sprite.onmouseenter = (event) => {
    sprite.scale.set(1.1);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onmouseenter`

***

### onmouseleave?

> `optional` **onmouseleave?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:379

Property-based event handler for the `mouseleave` event.
Fired when the pointer leaves the bounds of the display object. Does not bubble.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseleave', (event) => {
   sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onmouseleave = (event) => {
    sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onmouseleave`

***

### onmousemove?

> `optional` **onmousemove?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:401

Property-based event handler for the `mousemove` event.
Fired when the pointer moves while over the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mousemove', (event) => {
   // Get coordinates relative to the sprite
  console.log('Local:', event.getLocalPosition(sprite));
});
// Using property-based handler
sprite.onmousemove = (event) => {
    // Get coordinates relative to the sprite
    console.log('Local:', event.getLocalPosition(sprite));
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onmousemove`

***

### onmouseout?

> `optional` **onmouseout?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:450

Property-based event handler for the `mouseout` event.
Fired when the pointer moves out of the bounds of the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseout', (event) => {
   sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onmouseout = (event) => {
    sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onmouseout`

***

### onmouseover?

> `optional` **onmouseover?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:470

Property-based event handler for the `mouseover` event.
Fired when the pointer moves onto the bounds of the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseover', (event) => {
     sprite.scale.set(1.1);
});
// Using property-based handler
sprite.onmouseover = (event) => {
    sprite.scale.set(1.1);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onmouseover`

***

### onmouseup?

> `optional` **onmouseup?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:490

Property-based event handler for the `mouseup` event.
Fired when a mouse button is released over the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseup', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onmouseup = (event) => {
     sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onmouseup`

***

### onmouseupoutside?

> `optional` **onmouseupoutside?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:511

Property-based event handler for the `mouseupoutside` event.
Fired when a mouse button is released outside the display object that initially
registered a mousedown.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('mouseupoutside', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onmouseupoutside = (event) => {
    sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onmouseupoutside`

***

### onpointercancel?

> `optional` **onpointercancel?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:531

Property-based event handler for the `pointercancel` event.
Fired when a pointer device interaction is canceled or lost.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointercancel', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onpointercancel = (event) => {
    sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onpointercancel`

***

### onpointerdown?

> `optional` **onpointerdown?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:551

Property-based event handler for the `pointerdown` event.
Fired when a pointer device button (mouse, touch, pen, etc.) is pressed.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerdown', (event) => {
    sprite.position.set(event.global.x, event.global.y);
});
// Using property-based handler
sprite.onpointerdown = (event) => {
    sprite.position.set(event.global.x, event.global.y);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onpointerdown`

***

### onpointerenter?

> `optional` **onpointerenter?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:571

Property-based event handler for the `pointerenter` event.
Fired when a pointer device enters the bounds of the display object. Does not bubble.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerenter', (event) => {
    sprite.scale.set(1.2);
});
// Using property-based handler
sprite.onpointerenter = (event) => {
    sprite.scale.set(1.2);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onpointerenter`

***

### onpointerleave?

> `optional` **onpointerleave?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:590

Property-based event handler for the `pointerleave` event.
Fired when a pointer device leaves the bounds of the display object. Does not bubble.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';
// Using emitter handler
sprite.on('pointerleave', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onpointerleave = (event) => {
    sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onpointerleave`

***

### onpointermove?

> `optional` **onpointermove?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:610

Property-based event handler for the `pointermove` event.
Fired when a pointer device moves while over the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointermove', (event) => {
    sprite.position.set(event.global.x, event.global.y);
});
// Using property-based handler
sprite.onpointermove = (event) => {
    sprite.position.set(event.global.x, event.global.y);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onpointermove`

***

### onpointerout?

> `optional` **onpointerout?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:657

Property-based event handler for the `pointerout` event.
Fired when the pointer moves out of the bounds of the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerout', (event) => {
   sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onpointerout = (event) => {
   sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onpointerout`

***

### onpointerover?

> `optional` **onpointerover?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:677

Property-based event handler for the `pointerover` event.
Fired when the pointer moves over the bounds of the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerover', (event) => {
    sprite.scale.set(1.2);
});
// Using property-based handler
sprite.onpointerover = (event) => {
    sprite.scale.set(1.2);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onpointerover`

***

### onpointertap?

> `optional` **onpointertap?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:697

Property-based event handler for the `pointertap` event.
Fired when a pointer device completes a tap action (e.g., touch or mouse click).

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointertap', (event) => {
    console.log('Sprite tapped at:', event.global.x, event.global.y);
});
// Using property-based handler
sprite.onpointertap = (event) => {
    console.log('Sprite tapped at:', event.global.x, event.global.y);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onpointertap`

***

### onpointerup?

> `optional` **onpointerup?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:717

Property-based event handler for the `pointerup` event.
Fired when a pointer device button (mouse, touch, pen, etc.) is released.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerup', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onpointerup = (event) => {
    sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onpointerup`

***

### onpointerupoutside?

> `optional` **onpointerupoutside?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:738

Property-based event handler for the `pointerupoutside` event.
Fired when a pointer device button is released outside the bounds of the display object
that initially registered a pointerdown.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('pointerupoutside', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onpointerupoutside = (event) => {
    sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onpointerupoutside`

***

### onRender

> **onRender**: (`renderer`) => `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/onRenderMixin.d.ts:25

This callback is used when the container is rendered. It runs every frame during the render process,
making it ideal for per-frame updates and animations.

> [!NOTE] In v7 many users used `updateTransform` for this, however the way v8 renders objects is different
> and "updateTransform" is no longer called every frame

#### Parameters

##### renderer

`Renderer`

The renderer instance

#### Returns

`void`

#### Example

```ts
// Basic rotation animation
const container = new Container();
container.onRender = () => {
    container.rotation += 0.01;
};

// Cleanup when done
container.onRender = null; // Removes callback
```

#### See

Renderer For renderer capabilities

#### Inherited from

`ViewContainer.onRender`

***

### onrightclick?

> `optional` **onrightclick?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:758

Property-based event handler for the `rightclick` event.
Fired when a right-click (context menu) action is performed on the object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('rightclick', (event) => {
    console.log('Right-clicked at:', event.global.x, event.global.y);
});
// Using property-based handler
sprite.onrightclick = (event) => {
    console.log('Right-clicked at:', event.global.x, event.global.y);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onrightclick`

***

### onrightdown?

> `optional` **onrightdown?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:778

Property-based event handler for the `rightdown` event.
Fired when a right mouse button is pressed down over the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('rightdown', (event) => {
    sprite.scale.set(0.9);
});
// Using property-based handler
sprite.onrightdown = (event) => {
    sprite.scale.set(0.9);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onrightdown`

***

### onrightup?

> `optional` **onrightup?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:798

Property-based event handler for the `rightup` event.
Fired when a right mouse button is released over the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('rightup', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onrightup = (event) => {
    sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onrightup`

***

### onrightupoutside?

> `optional` **onrightupoutside?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:819

Property-based event handler for the `rightupoutside` event.
Fired when a right mouse button is released outside the bounds of the display object
that initially registered a rightdown.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('rightupoutside', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.onrightupoutside = (event) => {
    sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onrightupoutside`

***

### ontap?

> `optional` **ontap?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:839

Property-based event handler for the `tap` event.
Fired when a tap action (touch) is completed on the object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('tap', (event) => {
    console.log('Sprite tapped at:', event.global.x, event.global.y);
});
// Using property-based handler
sprite.ontap = (event) => {
    console.log('Sprite tapped at:', event.global.x, event.global.y);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.ontap`

***

### ontouchcancel?

> `optional` **ontouchcancel?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:859

Property-based event handler for the `touchcancel` event.
Fired when a touch interaction is canceled, such as when the touch is interrupted.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('touchcancel', (event) => {
    console.log('Touch canceled at:', event.global.x, event.global.y);
});
// Using property-based handler
sprite.ontouchcancel = (event) => {
    console.log('Touch canceled at:', event.global.x, event.global.y);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.ontouchcancel`

***

### ontouchend?

> `optional` **ontouchend?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:879

Property-based event handler for the `touchend` event.
Fired when a touch interaction ends, such as when the finger is lifted from the screen.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('touchend', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.ontouchend = (event) => {
   sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.ontouchend`

***

### ontouchendoutside?

> `optional` **ontouchendoutside?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:900

Property-based event handler for the `touchendoutside` event.
Fired when a touch interaction ends outside the bounds of the display object
that initially registered a touchstart.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('touchendoutside', (event) => {
    sprite.scale.set(1.0);
});
// Using property-based handler
sprite.ontouchendoutside = (event) => {
    sprite.scale.set(1.0);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.ontouchendoutside`

***

### ontouchmove?

> `optional` **ontouchmove?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:920

Property-based event handler for the `touchmove` event.
Fired when a touch interaction moves while over the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('touchmove', (event) => {
    sprite.position.set(event.global.x, event.global.y);
});
// Using property-based handler
sprite.ontouchmove = (event) => {
    sprite.position.set(event.global.x, event.global.y);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.ontouchmove`

***

### ontouchstart?

> `optional` **ontouchstart?**: `FederatedEventHandler`\<`FederatedPointerEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:967

Property-based event handler for the `touchstart` event.
Fired when a touch interaction starts, such as when a finger touches the screen.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('touchstart', (event) => {
    sprite.scale.set(0.9);
});
// Using property-based handler
sprite.ontouchstart = (event) => {
    sprite.scale.set(0.9);
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.ontouchstart`

***

### onwheel?

> `optional` **onwheel?**: `FederatedEventHandler`\<`FederatedWheelEvent`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:989

Property-based event handler for the `wheel` event.
Fired when the mouse wheel is scrolled while over the display object.

#### Example

```ts
const sprite = new Sprite(texture);
sprite.eventMode = 'static';

// Using emitter handler
sprite.on('wheel', (event) => {
    sprite.scale.x += event.deltaY * 0.01; // Zoom in/out
    sprite.scale.y += event.deltaY * 0.01; // Zoom in/out
});
// Using property-based handler
sprite.onwheel = (event) => {
    sprite.scale.x += event.deltaY * 0.01; // Zoom in/out
    sprite.scale.y += event.deltaY * 0.01; // Zoom in/out
};
```

#### Default

```ts
null
```

#### Inherited from

`ViewContainer.onwheel`

***

### parent

> `readonly` **parent**: `Container`\<`ContainerChild`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:659

The display object container that contains this display object.
This represents the parent-child relationship in the display tree.

#### Example

```ts
// Basic parent access
const parent = sprite.parent;

// Walk up the tree
let current = sprite;
while (current.parent) {
    console.log('Level up:', current.parent.constructor.name);
    current = current.parent;
}
```

#### See

 - Container#addChild For adding to a parent
 - Container#removeChild For removing from parent

#### Inherited from

`ViewContainer.parent`

***

### parentRenderLayer

> `readonly` **parentRenderLayer**: `RenderLayer`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:672

The RenderLayer this container belongs to, if any.
If it belongs to a RenderLayer, it will be rendered from the RenderLayer's position in the scene.

#### Advanced

#### Inherited from

`ViewContainer.parentRenderLayer`

***

### relativeGroupTransform

> `readonly` **relativeGroupTransform**: `Matrix`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:696

The relative group transform is a transform relative to the render group it belongs too. It will include all parent
transforms and up to the render group (think of it as kind of like a stage - but the stage can be nested).
If this container is is self a render group matrix will be relative to its parent render group

#### Advanced

#### Inherited from

`ViewContainer.relativeGroupTransform`

***

### renderPipeId

> `readonly` **renderPipeId**: `string`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:92

**`Internal`**

#### Inherited from

`ViewContainer.renderPipeId`

***

### sortableChildren

> **sortableChildren**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/sortMixin.d.ts:48

If set to true, the container will sort its children by `zIndex` value
when the next render is called, or manually if `sortChildren()` is called.

This actually changes the order of elements in the array of children,
so it will affect the rendering order.

> [!NOTE] Also be aware of that this may not work nicely with the `addChildAt()` function,
> as the `zIndex` sorting may cause the child to automatically sorted to another position.

#### Example

```ts
container.sortableChildren = true;
```

#### Default

```ts
false
```

#### Inherited from

`ViewContainer.sortableChildren`

***

### sortChildren

> **sortChildren**: () => `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/sortMixin.d.ts:72

Sorts children by zIndex value. Only sorts if container is marked as dirty.

#### Returns

`void`

#### Example

```ts
// Basic sorting
particles.zIndex = 2;     // Will mark as dirty
container.sortChildren();
```

#### See

 - [Container#sortableChildren](#sortablechildren) For enabling automatic sorting
 - [Container#zIndex](#zindex) For setting child order

#### Inherited from

`ViewContainer.sortChildren`

***

### sortDirty

> **sortDirty**: `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/sortMixin.d.ts:32

**`Internal`**

Should children be sorted by zIndex at the next render call.

Will get automatically set to true if a new child is added, or if a child's zIndex changes.

#### Default

```ts
false
@internal
```

#### Inherited from

`ViewContainer.sortDirty`

***

### tabIndex?

> `optional` **tabIndex?**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/accessibility/accessibilityTarget.d.ts:72

Sets the tabIndex of the shadow div. You can use this to set the order of the
elements when using the tab key to navigate.

#### Default

```ts
0
```

#### Example

```js
const container = new Container();
container.accessible = true;
container.tabIndex = 0;

const sprite = new Sprite(texture);
sprite.accessible = true;
sprite.tabIndex = 1;
```

#### Inherited from

`ViewContainer.tabIndex`

***

### uid

> `readonly` **uid**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:610

**`Internal`**

unique id for this container

#### Inherited from

`ViewContainer.uid`

***

### updateCacheTexture

> **updateCacheTexture**: () => `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/cacheAsTextureMixin.d.ts:55

Updates the cached texture of this container. This will flag the container's cached texture
to be redrawn on the next render.

#### Returns

`void`

#### Example

```ts
// Basic update after changes
container.updateCacheTexture();
```

#### Inherited from

`ViewContainer.updateCacheTexture`

***

### updateTick

> **updateTick**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:674

**`Internal`**

#### Inherited from

`ViewContainer.updateTick`

***

### zIndex

> **zIndex**: `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/sortMixin.d.ts:24

The zIndex of the container.

Controls the rendering order of children within their parent container.

A higher value will mean it will be moved towards the front of the rendering order.

#### Example

```ts
// Add in any order
container.addChild(character, background, foreground);

// Adjust rendering order
background.zIndex = 0;
character.zIndex = 1;
foreground.zIndex = 2;
```

#### See

 - [Container#sortableChildren](#sortablechildren) For enabling sorting
 - Container#sortChildren For manual sorting

#### Default

```ts
0
```

#### Inherited from

`ViewContainer.zIndex`

## Accessors

### alpha

#### Get Signature

> **get** **alpha**(): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1246

The opacity of the object relative to its parent's opacity.
Value ranges from 0 (fully transparent) to 1 (fully opaque).

##### Example

```ts
// Basic transparency
sprite.alpha = 0.5; // 50% opacity

// Inherited opacity
container.alpha = 0.5;
const child = new Sprite(texture);
child.alpha = 0.5;
container.addChild(child);
// child's effective opacity is 0.25 (0.5 * 0.5)
```

##### Default

```ts
1
```

##### See

 - Container#visible For toggling visibility
 - Container#renderable For render control

##### Returns

`number`

#### Set Signature

> **set** **alpha**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1226

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

`ViewContainer.alpha`

***

### angle

#### Get Signature

> **get** **angle**(): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1008

The angle of the object in degrees.

> [!NOTE] 'rotation' and 'angle' have the same effect on a display object;
> rotation is in radians, angle is in degrees.

##### Example

```ts
// Basic angle rotation
sprite.angle = 45; // 45 degrees

// Rotate around center
sprite.pivot.set(sprite.width / 2, sprite.height / 2);
sprite.angle = 180; // Half rotation

// Rotate around center with origin
sprite.origin.set(sprite.width / 2, sprite.height / 2);
sprite.angle = 180; // Half rotation

// Reset rotation
sprite.angle = 0;
```

##### Returns

`number`

#### Set Signature

> **set** **angle**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1009

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

`ViewContainer.angle`

***

### blendMode

#### Get Signature

> **get** **blendMode**(): `BLEND_MODES`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1289

The blend mode to be applied to the sprite. Controls how pixels are blended when rendering.

Setting to 'normal' will reset to default blending.
> [!NOTE] More blend modes are available after importing the `pixi.js/advanced-blend-modes` sub-export.

##### Example

```ts
// Basic blend modes
sprite.blendMode = 'add';        // Additive blending
sprite.blendMode = 'multiply';   // Multiply colors
sprite.blendMode = 'screen';     // Screen blend

// Reset blend mode
sprite.blendMode = 'normal';     // Normal blending
```

##### Default

```ts
'normal'
```

##### See

 - Container#alpha For transparency
 - Container#tint For color adjustments

##### Returns

`BLEND_MODES`

#### Set Signature

> **set** **blendMode**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1269

##### Parameters

###### value

`BLEND_MODES`

##### Returns

`void`

#### Inherited from

`ViewContainer.blendMode`

***

### bounds

#### Get Signature

> **get** **bounds**(): `Bounds`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:149

The local bounds of the graphics object.
Returns the boundaries after all graphical operations but before any transforms.

##### Example

```ts
const graphics = new Graphics();

// Draw a shape
graphics
    .rect(0, 0, 100, 100)
    .fill({ color: 0xff0000 });

// Get bounds information
const bounds = graphics.bounds;
console.log(bounds.width);  // 100
console.log(bounds.height); // 100
```

##### See

 - Bounds For bounds operations
 - Container#getBounds For transformed bounds

##### Returns

`Bounds`

#### Inherited from

`ViewContainer.bounds`

***

### context

#### Get Signature

> **get** **context**(): `GraphicsContext`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:127

The underlying graphics context used for drawing operations.
Controls how shapes and paths are rendered.

##### Example

```ts
// Create a shared context
const sharedContext = new GraphicsContext();

// Create graphics objects sharing the same context
const graphics1 = new Graphics();
const graphics2 = new Graphics();

// Assign shared context
graphics1.context = sharedContext;
graphics2.context = sharedContext;

// Both graphics will show the same shapes
sharedContext
    .rect(0, 0, 100, 100)
    .fill({ color: 0xff0000 });
```

##### See

 - GraphicsContext For drawing operations
 - GraphicsOptions For context configuration

##### Returns

`GraphicsContext`

#### Set Signature

> **set** **context**(`context`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:102

##### Parameters

###### context

`GraphicsContext`

##### Returns

`void`

***

### fillStyle

#### Get Signature

> **get** **fillStyle**(): `ConvertedFillStyle`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1543

Gets or sets the current fill style for the graphics context. The fill style determines
how shapes are filled when using the fill() method.

##### Example

```ts
const graphics = new Graphics();

// Basic color fill
graphics.fillStyle = {
    color: 0xff0000,  // Red
    alpha: 1
};

// Using gradients
const gradient = new FillGradient({
    end: { x: 0, y: 1 }, // Vertical gradient
    stops: [
        { offset: 0, color: 0xff0000, alpha: 1 }, // Start color
        { offset: 1, color: 0x0000ff, alpha: 1 }  // End color
    ]
});

graphics.fillStyle = {
    fill: gradient,
    alpha: 0.8
};

// Using patterns
graphics.fillStyle = {
    texture: myTexture,
    alpha: 1,
    matrix: new Matrix()
        .scale(0.5, 0.5)
        .rotate(Math.PI / 4)
};
```

##### See

 - FillStyle For all available fill style options
 - FillGradient For creating gradient fills
 - [Graphics#fill](#fill) For applying the fill to paths

##### Returns

`ConvertedFillStyle`

#### Set Signature

> **set** **fillStyle**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1544

##### Parameters

###### value

`FillInput`

##### Returns

`void`

***

### filters

#### Get Signature

> **get** **filters**(): readonly `Filter`[]

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/effectsMixin.d.ts:277

Sets the filters for the displayObject.
Filters are visual effects that can be applied to any display object and its children.

> [!IMPORTANT] This is a WebGL/WebGPU only feature and will be ignored by the canvas renderer.

##### Example

```ts
new Container({
    filters: [new BlurFilter(2), new ColorMatrixFilter()],
});
```

##### See

Filter For filter base class

##### Returns

readonly `Filter`[]

#### Set Signature

> **set** **filters**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/effectsMixin.d.ts:276

Sets the filters for the displayObject.
Filters are visual effects that can be applied to any display object and its children.

> [!IMPORTANT] This is a WebGL/WebGPU only feature and will be ignored by the canvas renderer.

##### Example

```ts
// Add a single filter
sprite.filters = new BlurFilter(2);

// Apply multiple filters
container.filters = [
    new BlurFilter(2),
    new ColorMatrixFilter(),
];

// Remove filters
sprite.filters = null;
```

##### See

Filter For filter base class

##### Parameters

###### value

`Filter` \| `Filter`[]

##### Returns

`void`

#### Inherited from

`ViewContainer.filters`

***

### height

#### Get Signature

> **get** **height**(): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1117

The height of the Container,
> [!NOTE] Changing the height will adjust the scale.y property of the container while maintaining its aspect ratio.
> [!NOTE] If you want to set both width and height at the same time, use Container#setSize
as it is more optimized by not recalculating the local bounds twice.

##### Example

```ts
// Basic height setting
container.height = 200;
// Optimized height setting
container.setSize(100, 200);
```

##### Returns

`number`

#### Set Signature

> **set** **height**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1118

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

`ViewContainer.height`

***

### isRenderable

#### Get Signature

> **get** **isRenderable**(): `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1329

Whether or not the object should be rendered.

##### Advanced

##### Returns

`boolean`

#### Inherited from

`ViewContainer.isRenderable`

***

### isRenderGroup

#### Get Signature

> **get** **isRenderGroup**(): `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:894

Returns true if this container is a render group.
This means that it will be rendered as a separate pass, with its own set of instructions

##### Advanced

##### Returns

`boolean`

#### Set Signature

> **set** **isRenderGroup**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:888

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

`ViewContainer.isRenderGroup`

***

### origin

#### Get Signature

> **get** **origin**(): `ObservablePoint`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1087

**`Experimental`**

The origin point around which the container rotates and scales without affecting its position.
Unlike pivot, changing the origin will not move the container's position.

##### Example

```ts
// Rotate around center point
container.origin.set(container.width / 2, container.height / 2);
container.rotation = Math.PI; // Rotates around center

// Reset origin
container.origin.set(0, 0);
```

##### Returns

`ObservablePoint`

#### Set Signature

> **set** **origin**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1088

##### Parameters

###### value

`number` \| `PointData`

##### Returns

`void`

#### Inherited from

`ViewContainer.origin`

***

### pivot

#### Get Signature

> **get** **pivot**(): `ObservablePoint`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1023

The center of rotation, scaling, and skewing for this display object in its local space.
The `position` is the projection of `pivot` in the parent's local space.

By default, the pivot is the origin (0, 0).

##### Example

```ts
// Rotate around center
container.pivot.set(container.width / 2, container.height / 2);
container.rotation = Math.PI; // Rotates around center
```

##### Since

4.0.0

##### Returns

`ObservablePoint`

#### Set Signature

> **set** **pivot**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1024

##### Parameters

###### value

`number` \| `PointData`

##### Returns

`void`

#### Inherited from

`ViewContainer.pivot`

***

### position

#### Get Signature

> **get** **position**(): `ObservablePoint`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:959

The coordinate of the object relative to the local coordinates of the parent.

##### Example

```ts
// Basic position setting
container.position.set(100, 200);
container.position.set(100); // Sets both x and y to 100
// Using point data
container.position = { x: 50, y: 75 };
```

##### Since

4.0.0

##### Returns

`ObservablePoint`

#### Set Signature

> **set** **position**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:960

##### Parameters

###### value

`PointData`

##### Returns

`void`

#### Inherited from

`ViewContainer.position`

***

### renderable

#### Get Signature

> **get** **renderable**(): `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1323

Controls whether this object can be rendered. If false the object will not be drawn,
but the transform will still be updated. This is different from visible, which skips
transform updates.

##### Example

```ts
// Basic render control
sprite.renderable = false; // Skip rendering
sprite.renderable = true;  // Enable rendering
```

##### Default

```ts
true
```

##### See

 - Container#visible For skipping transform updates
 - Container#alpha For transparency

##### Returns

`boolean`

#### Set Signature

> **set** **renderable**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1324

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

`ViewContainer.renderable`

***

### rotation

#### Get Signature

> **get** **rotation**(): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:984

The rotation of the object in radians.

> [!NOTE] 'rotation' and 'angle' have the same effect on a display object;
> rotation is in radians, angle is in degrees.

##### Example

```ts
// Basic rotation
container.rotation = Math.PI / 4; // 45 degrees

// Convert from degrees
const degrees = 45;
container.rotation = degrees * Math.PI / 180;

// Rotate around center
container.pivot.set(container.width / 2, container.height / 2);
container.rotation = Math.PI; // 180 degrees

// Rotate around center with origin
container.origin.set(container.width / 2, container.height / 2);
container.rotation = Math.PI; // 180 degrees
```

##### Returns

`number`

#### Set Signature

> **set** **rotation**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:985

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

`ViewContainer.rotation`

***

### roundPixels

#### Get Signature

> **get** **roundPixels**(): `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:86

Whether or not to round the x/y position of the sprite.

##### Example

```ts
// Enable pixel rounding for crisp rendering
view.roundPixels = true;
```

##### Default

```ts
false
```

##### Returns

`boolean`

#### Set Signature

> **set** **roundPixels**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:87

Whether or not to round the x/y position of the object.

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

`ViewContainer.roundPixels`

***

### scale

#### Get Signature

> **get** **scale**(): `ObservablePoint`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1071

The scale factors of this object along the local coordinate axes.

The default scale is (1, 1).

##### Example

```ts
// Basic scaling
container.scale.set(2, 2); // Scales to double size
container.scale.set(2); // Scales uniformly to double size
container.scale = 2; // Scales uniformly to double size
// Scale to a specific width and height
container.setSize(200, 100); // Sets width to 200 and height to 100
```

##### Since

4.0.0

##### Returns

`ObservablePoint`

#### Set Signature

> **set** **scale**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1072

##### Parameters

###### value

`string` \| `number` \| `PointData`

##### Returns

`void`

#### Inherited from

`ViewContainer.scale`

***

### skew

#### Get Signature

> **get** **skew**(): `ObservablePoint`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1054

The skew factor for the object in radians. Skewing is a transformation that distorts
the object by rotating it differently at each point, creating a non-uniform shape.

##### Example

```ts
// Basic skewing
container.skew.set(0.5, 0); // Skew horizontally
container.skew.set(0, 0.5); // Skew vertically

// Skew with point data
container.skew = { x: 0.3, y: 0.3 }; // Diagonal skew

// Reset skew
container.skew.set(0, 0);

// Animate skew
app.ticker.add(() => {
    // Create wave effect
    container.skew.x = Math.sin(Date.now() / 1000) * 0.3;
});

// Combine with rotation
container.rotation = Math.PI / 4; // 45 degrees
container.skew.set(0.2, 0.2); // Skew the rotated object
```

##### Since

4.0.0

##### Default

```ts
{x: 0, y: 0}
```

##### Returns

`ObservablePoint`

#### Set Signature

> **set** **skew**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1055

##### Parameters

###### value

`PointData`

##### Returns

`void`

#### Inherited from

`ViewContainer.skew`

***

### strokeStyle

#### Get Signature

> **get** **strokeStyle**(): `ConvertedStrokeStyle`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1588

Gets or sets the current stroke style for the graphics context. The stroke style determines
how paths are outlined when using the stroke() method.

##### Example

```ts
const graphics = new Graphics();

// Basic stroke style
graphics.strokeStyle = {
    width: 2,
    color: 0xff0000,
    alpha: 1
};

// Using with gradients
const gradient = new FillGradient({
  end: { x: 0, y: 1 },
  stops: [
      { offset: 0, color: 0xff0000, alpha: 1 },
      { offset: 1, color: 0x0000ff, alpha: 1 }
  ]
});

graphics.strokeStyle = {
    width: 4,
    fill: gradient,
    alignment: 0.5,
    join: 'round',
    cap: 'round'
};

// Complex stroke settings
graphics.strokeStyle = {
    width: 6,
    color: 0x00ff00,
    alpha: 0.5,
    join: 'miter',
    miterLimit: 10,
};
```

##### See

 - StrokeStyle For all available stroke style options
 - [Graphics#stroke](#stroke) For applying the stroke to paths

##### Returns

`ConvertedStrokeStyle`

#### Set Signature

> **set** **strokeStyle**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1589

##### Parameters

###### value

`StrokeStyle`

##### Returns

`void`

***

### tint

#### Get Signature

> **get** **tint**(): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1268

The tint applied to the sprite.

This can be any valid ColorSource.

##### Example

```ts
// Basic color tinting
container.tint = 0xff0000; // Red tint
container.tint = 'red';    // Same as above
container.tint = '#00ff00'; // Green
container.tint = 'rgb(0,0,255)'; // Blue

// Remove tint
container.tint = 0xffffff; // White = no tint
container.tint = null;     // Also removes tint
```

##### Default

```ts
0xFFFFFF
```

##### See

 - Container#alpha For transparency
 - Container#visible For visibility control

##### Returns

`number`

#### Set Signature

> **set** **tint**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1247

##### Parameters

###### value

`ColorSource`

##### Returns

`void`

#### Inherited from

`ViewContainer.tint`

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1303

The visibility of the object. If false the object will not be drawn,
and the transform will not be updated.

##### Example

```ts
// Basic visibility toggle
sprite.visible = false; // Hide sprite
sprite.visible = true;  // Show sprite
```

##### Default

```ts
true
```

##### See

 - Container#renderable For render-only control
 - Container#alpha For transparency

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1304

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

`ViewContainer.visible`

***

### width

#### Get Signature

> **get** **width**(): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1102

The width of the Container, setting this will actually modify the scale to achieve the value set.
> [!NOTE] Changing the width will adjust the scale.x property of the container while maintaining its aspect ratio.
> [!NOTE] If you want to set both width and height at the same time, use Container#setSize
as it is more optimized by not recalculating the local bounds twice.

##### Example

```ts
// Basic width setting
container.width = 100;
// Optimized width setting
container.setSize(100, 100);
```

##### Returns

`number`

#### Set Signature

> **set** **width**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1103

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

`ViewContainer.width`

***

### worldTransform

#### Get Signature

> **get** **worldTransform**(): `Matrix`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:922

Current transform of the object based on world (parent) factors.

This matrix represents the absolute transformation in the scene graph.

##### Example

```ts
// Get world position
const worldPos = container.worldTransform;
console.log(`World position: (${worldPos.tx}, ${worldPos.ty})`);
```

##### See

Container#localTransform For local space transform

##### Returns

`Matrix`

#### Inherited from

`ViewContainer.worldTransform`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:933

The position of the container on the x axis relative to the local coordinates of the parent.

An alias to position.x

##### Example

```ts
// Basic position
container.x = 100;
```

##### Returns

`number`

#### Set Signature

> **set** **x**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:934

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

`ViewContainer.x`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:945

The position of the container on the y axis relative to the local coordinates of the parent.

An alias to position.y

##### Example

```ts
// Basic position
container.y = 200;
```

##### Returns

`number`

#### Set Signature

> **set** **y**(`value`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:946

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

`ViewContainer.y`

## Methods

### \_getGlobalBoundsRecursive()

> **\_getGlobalBoundsRecursive**(`factorRenderLayers`, `bounds`, `currentLayer`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/getFastGlobalBoundsMixin.d.ts:32

**`Internal`**

Recursively calculates the global bounds for the container and its children.
This method is used internally by getFastGlobalBounds to traverse the scene graph.

#### Parameters

##### factorRenderLayers

`boolean`

A flag indicating whether to consider render layers in the calculation.

##### bounds

`Bounds`

The bounds object to update with the calculated values.

##### currentLayer

`RenderLayer`

The current render layer being processed.

#### Returns

`void`

#### Inherited from

`ViewContainer._getGlobalBoundsRecursive`

***

### \_onTouch()

> **\_onTouch**(`now`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:202

**`Internal`**

#### Parameters

##### now

`number`

The current time in milliseconds.

#### Returns

`void`

#### Inherited from

`ViewContainer._onTouch`

***

### addChild()

> **addChild**\<`U`\>(...`children`): `U`\[`0`\]

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:864

Adds one or more children to the container.
The children will be rendered as part of this container's display list.

#### Type Parameters

##### U

`U` *extends* `ContainerChild`[]

#### Parameters

##### children

...`U`

The Container(s) to add to the container

#### Returns

`U`\[`0`\]

The first child that was added

#### Example

```ts
// Add a single child
container.addChild(sprite);

// Add multiple children
container.addChild(background, player, foreground);

// Add with type checking
const sprite = container.addChild<Sprite>(new Sprite(texture));
sprite.tint = 'red';
```

#### See

 - Container#removeChild For removing children
 - Container#addChildAt For adding at specific index

#### Inherited from

`ViewContainer.addChild`

***

### addChildAt()

> **addChildAt**\<`U`\>(`child`, `index`): `U`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:161

Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown.
If the child is already in this container, it will be moved to the specified index.

When moving a child within the **same** container, `childAdded` and `added` events are
**not** emitted because the parent-child relationship hasn't changed. Events only fire when
a child is added from a different parent (or from no parent).

#### Type Parameters

##### U

`U` *extends* `ContainerChild`

#### Parameters

##### child

`U`

The child to add

##### index

`number`

The index where the child will be placed

#### Returns

`U`

The child that was added

#### Example

```ts
// Add at specific index
container.addChildAt(sprite, 0); // Add to front

// Move existing child (no events emitted)
const index = container.children.length - 1;
container.addChildAt(existingChild, index); // Move to back

// With error handling
try {
    container.addChildAt(sprite, 1000);
} catch (e) {
    console.warn('Index out of bounds');
}
```

#### Throws

If index is out of bounds

#### See

 - Container#addChild For adding to the end
 - Container#setChildIndex For moving existing children

#### Inherited from

`ViewContainer.addChildAt`

***

### addEventListener()

#### Call Signature

> **addEventListener**\<`K`\>(`type`, `listener`, `options?`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:1072

Unlike `on` or `addListener` which are methods from EventEmitter, `addEventListener`
seeks to be compatible with the DOM's `addEventListener` with support for options.

##### Type Parameters

###### K

`K` *extends* keyof FederatedEventMap \| keyof GlobalFederatedEventMap

##### Parameters

###### type

`K`

The type of event to listen to.

###### listener

(`e`) => `any`

The listener callback or object.

###### options?

`AddListenerOptions`

Listener options, used for capture phase.

##### Returns

`void`

##### Example

```ts
// Tell the user whether they did a single, double, triple, or nth click.
button.addEventListener('click', {
    handleEvent(e): {
        let prefix;

        switch (e.detail) {
            case 1: prefix = 'single'; break;
            case 2: prefix = 'double'; break;
            case 3: prefix = 'triple'; break;
            default: prefix = e.detail + 'th'; break;
        }

        console.log('That was a ' + prefix + 'click');
    }
});

// But skip the first click!
button.parent.addEventListener('click', function blockClickOnce(e) {
    e.stopImmediatePropagation();
    button.parent.removeEventListener('click', blockClickOnce, true);
}, {
    capture: true,
});
```

##### Inherited from

`ViewContainer.addEventListener`

#### Call Signature

> **addEventListener**(`type`, `listener`, `options?`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:1073

##### Parameters

###### type

`string`

###### listener

`EventListenerOrEventListenerObject`

###### options?

`AddListenerOptions`

##### Returns

`void`

##### Inherited from

`ViewContainer.addEventListener`

***

### addListener()

> **addListener**\<`T`\>(`event`, `fn`, `context?`): `this`

Defined in: node\_modules/.pnpm/eventemitter3@5.0.1/node\_modules/eventemitter3/index.d.ts:45

#### Type Parameters

##### T

`T` *extends* keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent

#### Parameters

##### event

`T`

##### fn

(...`args`) => `void`

##### context?

`any`

#### Returns

`this`

#### Inherited from

`ViewContainer.addListener`

***

### arc()

> **arc**(`x`, `y`, `radius`, `startAngle`, `endAngle`, `counterclockwise?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:515

Adds an arc to the current path, which is centered at (x, y) with the specified radius,
starting and ending angles, and direction.

#### Parameters

##### x

`number`

The x-coordinate of the arc's center

##### y

`number`

The y-coordinate of the arc's center

##### radius

`number`

The arc's radius (must be positive)

##### startAngle

`number`

The starting point of the arc, in radians

##### endAngle

`number`

The end point of the arc, in radians

##### counterclockwise?

`boolean`

Optional. If true, draws the arc counterclockwise.
                         If false (default), draws clockwise.

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
// Draw a simple arc (quarter circle)
const graphics = new Graphics();
graphics
    .arc(100, 100, 50, 0, Math.PI/2)
    .stroke({ width: 2, color: 0xff0000 });

// Draw a full circle using an arc
graphics
    .arc(200, 200, 30, 0, Math.PI * 2)
    .stroke({ color: 0x00ff00 });

// Draw a counterclockwise arc
graphics
    .arc(150, 150, 40, Math.PI, 0, true)
    .stroke({ width: 2, color: 0x0000ff });
```

#### See

 - [Graphics#circle](#circle) For drawing complete circles
 - [Graphics#arcTo](#arcto) For drawing arcs between points
 - [Graphics#arcToSvg](#arctosvg) For SVG-style arc drawing

***

### arcTo()

> **arcTo**(`x1`, `y1`, `x2`, `y2`, `radius`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:548

Adds an arc to the current path that connects two points using a radius.
The arc is drawn between the current point and the specified end point,
using the given control point to determine the curve of the arc.

#### Parameters

##### x1

`number`

The x-coordinate of the control point

##### y1

`number`

The y-coordinate of the control point

##### x2

`number`

The x-coordinate of the end point

##### y2

`number`

The y-coordinate of the end point

##### radius

`number`

The radius of the arc in pixels (must be positive)

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
// Draw a simple curved corner
const graphics = new Graphics();
graphics
    .moveTo(50, 50)
    .arcTo(100, 50, 100, 100, 20) // Rounded corner with 20px radius
    .stroke({ width: 2, color: 0xff0000 });

// Create a rounded rectangle using arcTo
graphics
    .moveTo(150, 150)
    .arcTo(250, 150, 250, 250, 30) // Top right corner
    .arcTo(250, 250, 150, 250, 30) // Bottom right corner
    .arcTo(150, 250, 150, 150, 30) // Bottom left corner
    .arcTo(150, 150, 250, 150, 30) // Top left corner
    .fill({ color: 0x00ff00 });
```

#### See

 - [Graphics#arc](#arc) For drawing arcs using center point and angles
 - [Graphics#arcToSvg](#arctosvg) For SVG-style arc drawing
 - [Graphics#roundRect](#roundrect) For drawing rectangles with rounded corners

***

### arcToSvg()

> **arcToSvg**(`rx`, `ry`, `xAxisRotation`, `largeArcFlag`, `sweepFlag`, `x`, `y`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:595

Adds an SVG-style arc to the path, allowing for elliptical arcs based on the SVG spec.
This is particularly useful when converting SVG paths to Graphics or creating complex curved shapes.

#### Parameters

##### rx

`number`

The x-radius of the ellipse (must be non-negative)

##### ry

`number`

The y-radius of the ellipse (must be non-negative)

##### xAxisRotation

`number`

The rotation of the ellipse's x-axis relative to the x-axis, in degrees

##### largeArcFlag

`number`

Either 0 or 1, determines if the larger of the two possible arcs is chosen (1) or not (0)

##### sweepFlag

`number`

Either 0 or 1, determines if the arc should be swept in
                   a positive angle direction (1) or negative (0)

##### x

`number`

The x-coordinate of the arc's end point

##### y

`number`

The y-coordinate of the arc's end point

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
// Draw a simple elliptical arc
const graphics = new Graphics();
graphics
    .moveTo(100, 100)
    .arcToSvg(50, 30, 0, 0, 1, 200, 100)
    .stroke({ width: 2, color: 0xff0000 });

// Create a complex path with rotated elliptical arc
graphics
    .moveTo(150, 150)
    .arcToSvg(
        60,    // rx
        30,    // ry
        45,    // x-axis rotation (45 degrees)
        1,     // large arc flag
        0,     // sweep flag
        250,   // end x
        200    // end y
    )
    .stroke({ width: 4, color: 0x00ff00 });

// Chain multiple arcs for complex shapes
graphics
    .moveTo(300, 100)
    .arcToSvg(40, 20, 0, 0, 1, 350, 150)
    .arcToSvg(40, 20, 0, 0, 1, 300, 200)
    .fill({ color: 0x0000ff, alpha: 0.5 });
```

#### See

 - [Graphics#arc](#arc) For simple circular arcs
 - [Graphics#arcTo](#arcto) For connecting points with circular arcs
 - [Graphics#svg](#svg) For parsing complete SVG paths

***

### ~~beginFill()~~

> **beginFill**(`color`, `alpha?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1640

#### Parameters

##### color

`ColorSource`

##### alpha?

`number`

#### Returns

`this`

#### Deprecated

since 8.0.0 Use [Graphics#fill](#fill) instead

***

### beginPath()

> **beginPath**(): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:463

Resets the current path. Any previous path and its commands are discarded and a new path is
started. This is typically called before beginning a new shape or series of drawing commands.

#### Returns

`this`

The Graphics instance for chaining

#### Example

```ts
const graphics = new Graphics();
graphics
    .circle(150, 150, 50)
    .fill({ color: 0x00ff00 })
    .beginPath() // Starts a new path
    .circle(250, 150, 50)
    .fill({ color: 0x0000ff });
```

#### See

 - [Graphics#moveTo](#moveto) For starting a new subpath
 - [Graphics#closePath](#closepath) For closing the current path

***

### bezierCurveTo()

> **bezierCurveTo**(`cp1x`, `cp1y`, `cp2x`, `cp2y`, `x`, `y`, `smoothness?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:635

Adds a cubic Bézier curve to the path, from the current point to the specified end point.
The curve is influenced by two control points that define its shape and curvature.

#### Parameters

##### cp1x

`number`

The x-coordinate of the first control point

##### cp1y

`number`

The y-coordinate of the first control point

##### cp2x

`number`

The x-coordinate of the second control point

##### cp2y

`number`

The y-coordinate of the second control point

##### x

`number`

The x-coordinate of the end point

##### y

`number`

The y-coordinate of the end point

##### smoothness?

`number`

Optional parameter to adjust the curve's smoothness (0-1)

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
// Draw a simple curved line
const graphics = new Graphics();
graphics
    .moveTo(50, 50)
    .bezierCurveTo(
        100, 25,   // First control point
        150, 75,   // Second control point
        200, 50    // End point
    )
    .stroke({ width: 2, color: 0xff0000 });

// Adjust curve smoothness
graphics
    .moveTo(50, 200)
    .bezierCurveTo(
        100, 150,
        200, 250,
        250, 200,
        0.5         // Smoothness factor
    )
    .stroke({ width: 4, color: 0x0000ff });
```

#### See

 - [Graphics#quadraticCurveTo](#quadraticcurveto) For simpler curves with one control point
 - [Graphics#arc](#arc) For circular arcs
 - [Graphics#arcTo](#arcto) For connecting points with circular arcs

***

### chamferRect()

> **chamferRect**(`x`, `y`, `width`, `height`, `chamfer`, `transform?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1137

Draws a rectangle with chamfered (angled) corners. Each corner is cut off at
a 45-degree angle based on the chamfer size.

#### Parameters

##### x

`number`

The x-coordinate of the top-left corner of the rectangle

##### y

`number`

The y-coordinate of the top-left corner of the rectangle

##### width

`number`

The width of the rectangle

##### height

`number`

The height of the rectangle

##### chamfer

`number`

The size of the corner chamfers (must be non-zero)

##### transform?

`Matrix`

Optional Matrix to transform the rectangle

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a basic chamfered rectangle
graphics
    .chamferRect(50, 50, 100, 80, 15)
    .fill({ color: 0xff0000 });

// Add transform and stroke
const transform = new Matrix()
    .rotate(Math.PI / 4); // 45 degrees

graphics
    .chamferRect(200, 50, 100, 80, 20, transform)
    .fill({ color: 0x00ff00 })
    .stroke({ width: 2, color: 0x000000 });
```

#### See

 - [Graphics#roundRect](#roundrect) For rounded corners
 - [Graphics#filletRect](#filletrect) For rounded corners with negative radius support

***

### circle()

> **circle**(`x`, `y`, `radius`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:714

Draws a circle shape at the specified location with the given radius.

#### Parameters

##### x

`number`

The x-coordinate of the center of the circle

##### y

`number`

The y-coordinate of the center of the circle

##### radius

`number`

The radius of the circle

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a simple filled circle
graphics
    .circle(100, 100, 50)
    .fill({ color: 0xff0000 });

// Draw a circle with gradient fill
const gradient = new FillGradient({
    end: { x: 1, y: 0 },
    colorStops: [
          { offset: 0, color: 0xff0000 }, // Red at start
          { offset: 0.5, color: 0x00ff00 }, // Green at middle
          { offset: 1, color: 0x0000ff }, // Blue at end
    ],
});

graphics
    .circle(250, 100, 40)
    .fill({ fill: gradient });
```

#### See

 - [Graphics#ellipse](#ellipse) For drawing ellipses
 - [Graphics#arc](#arc) For drawing partial circles

***

### clear()

> **clear**(): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1501

Clears all drawing commands from the graphics context, effectively resetting it.
This includes clearing the current path, fill style, stroke style, and transformations.

> [!NOTE] Graphics objects are not designed to be continuously cleared and redrawn.
> Instead, they are intended to be used for static or semi-static graphics that
> can be redrawn as needed. Frequent clearing and redrawing may lead to performance issues.

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw some shapes
graphics
    .circle(100, 100, 50)
    .fill({ color: 0xff0000 })
    .rect(200, 100, 100, 50)
    .fill({ color: 0x00ff00 });

// Clear all graphics
graphics.clear();

// Start fresh with new shapes
graphics
    .circle(150, 150, 30)
    .fill({ color: 0x0000ff });
```

#### See

 - [Graphics#beginPath](#beginpath) For starting a new path without clearing styles
 - [Graphics#save](#save) For saving the current state
 - [Graphics#restore](#restore) For restoring a previous state

***

### clone()

> **clone**(`deep?`): `Graphics`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1627

Creates a new Graphics object that copies the current graphics content.
The clone can either share the same context (shallow clone) or have its own independent
context (deep clone).

#### Parameters

##### deep?

`boolean`

Whether to create a deep clone of the graphics object.
             If false (default), the context will be shared between objects.
             If true, creates an independent copy of the context.

#### Returns

`Graphics`

A new Graphics instance with either shared or copied context

#### Example

```ts
const graphics = new Graphics();

// Create original graphics content
graphics
    .circle(100, 100, 50)
    .fill({ color: 0xff0000 });

// Create a shallow clone (shared context)
const shallowClone = graphics.clone();

// Changes to original affect the clone
graphics
    .circle(200, 100, 30)
    .fill({ color: 0x00ff00 });

// Create a deep clone (independent context)
const deepClone = graphics.clone(true);

// Modify deep clone independently
deepClone
    .translateTransform(100, 100)
    .circle(0, 0, 40)
    .fill({ color: 0x0000ff });
```

#### See

 - [Graphics#context](#context) For accessing the underlying graphics context
 - GraphicsContext For understanding the shared context behavior

***

### closePath()

> **closePath**(): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:655

Closes the current path by drawing a straight line back to the start point.

This is useful for completing shapes and ensuring they are properly closed for fills.

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
// Create a triangle with closed path
const graphics = new Graphics();
graphics
    .moveTo(50, 50)
    .lineTo(100, 100)
    .lineTo(0, 100)
    .closePath()
```

#### See

 - [Graphics#beginPath](#beginpath) For starting a new path
 - [Graphics#fill](#fill) For filling closed paths
 - [Graphics#stroke](#stroke) For stroking paths

***

### collectRenderables()

> **collectRenderables**(`instructionSet`, `renderer`, `currentLayer`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/collectRenderablesMixin.d.ts:21

**`Internal`**

Collects all renderables from the container and its children, adding them to the instruction set.
This method decides whether to use a simple or advanced collection method based on the container's properties.

#### Parameters

##### instructionSet

`InstructionSet`

The set of instructions to which the renderables will be added.

##### renderer

`Renderer`

The renderer responsible for rendering the scene.

##### currentLayer

`RenderLayer`

The current render layer being processed.

#### Returns

`void`

#### Inherited from

`ViewContainer.collectRenderables`

***

### collectRenderablesSimple()

> **collectRenderablesSimple**(`instructionSet`, `renderer`, `currentLayer`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:119

**`Internal`**

Collects renderables for the view container.

#### Parameters

##### instructionSet

`InstructionSet`

The instruction set to collect renderables for.

##### renderer

`Renderer`

The renderer to collect renderables for.

##### currentLayer

`RenderLayer`

The current render layer.

#### Returns

`void`

#### Inherited from

`ViewContainer.collectRenderablesSimple`

***

### collectRenderablesWithEffects()

> **collectRenderablesWithEffects**(`instructionSet`, `renderer`, `currentLayer`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/collectRenderablesMixin.d.ts:39

**`Internal`**

Collects renderables using an advanced method, suitable for containers with complex processing needs.
This method handles additional effects and transformations that may be applied to the renderables.

#### Parameters

##### instructionSet

`InstructionSet`

The set of instructions to which the renderables will be added.

##### renderer

`Renderer`

The renderer responsible for rendering the scene.

##### currentLayer

`RenderLayer`

The current render layer being processed.

#### Returns

`void`

#### Inherited from

`ViewContainer.collectRenderablesWithEffects`

***

### containsPoint()

> **containsPoint**(`point`): `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:177

Checks if the object contains the given point.
Returns true if the point lies within the Graphics object's rendered area.

#### Parameters

##### point

`PointData`

The point to check in local coordinates

#### Returns

`boolean`

True if the point is inside the Graphics object

#### Example

```ts
const graphics = new Graphics();

// Draw a shape
graphics
    .rect(0, 0, 100, 100)
    .fill({ color: 0xff0000 });

// Check point intersection
if (graphics.containsPoint({ x: 50, y: 50 })) {
    console.log('Point is inside rectangle!');
}
```

#### See

 - [Graphics#bounds](#bounds) For bounding box checks
 - PointData For point data structure

#### Inherited from

`ViewContainer.containsPoint`

***

### cut()

> **cut**(): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:481

Applies a cutout to the last drawn shape. This is used to create holes or complex shapes by
subtracting a path from the previously drawn path.

If a hole is not completely in a shape, it will fail to cut correctly.

#### Returns

`this`

#### Example

```ts
const graphics = new Graphics();

// Draw outer circle
graphics
    .circle(100, 100, 50)
    .fill({ color: 0xff0000 });
    .circle(100, 100, 25) // Inner circle
    .cut() // Cuts out the inner circle from the outer circle
```

***

### destroy()

> **destroy**(`options?`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:197

Destroys this graphics renderable and optionally its context.

#### Parameters

##### options?

`DestroyOptions`

Options parameter. A boolean will act as if all options

If the context was created by this graphics and `destroy(false)` or `destroy()` is called
then the context will still be destroyed.

If you want to explicitly not destroy this context that this graphics created,
then you should pass destroy({ context: false })

If the context was passed in as an argument to the constructor then it will not be destroyed

#### Returns

`void`

#### Example

```ts
// Destroy the graphics and its context
graphics.destroy();
graphics.destroy(true);
graphics.destroy({ context: true, texture: true, textureSource: true });
```

#### Inherited from

`ViewContainer.destroy`

***

### disableRenderGroup()

> **disableRenderGroup**(): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:906

This will disable the render group for this container.

#### Returns

`void`

#### Advanced

#### Inherited from

`ViewContainer.disableRenderGroup`

***

### dispatchEvent()

> **dispatchEvent**(`e`): `boolean`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:1094

Dispatch the event on this Container using the event's EventBoundary.

The target of the event is set to `this` and the `defaultPrevented` flag is cleared before dispatch.

#### Parameters

##### e

`FederatedEvent`

The event to dispatch.

#### Returns

`boolean`

Whether the FederatedEvent.preventDefault preventDefault() method was not invoked.

#### Example

```ts
// Reuse a click event!
button.dispatchEvent(clickEvent);
```

#### Inherited from

`ViewContainer.dispatchEvent`

***

### ~~drawCircle()~~

> **drawCircle**(...`args`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1649

#### Parameters

##### args

...\[`number`, `number`, `number`\]

#### Returns

`this`

#### Deprecated

since 8.0.0 Use [Graphics#circle](#circle) instead

***

### ~~drawEllipse()~~

> **drawEllipse**(...`args`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1654

#### Parameters

##### args

...\[`number`, `number`, `number`, `number`\]

#### Returns

`this`

#### Deprecated

since 8.0.0 Use [Graphics#ellipse](#ellipse) instead

***

### ~~drawPolygon()~~

> **drawPolygon**(...`args`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1659

#### Parameters

##### args

...\[`number`[] \| `PointData`[], `boolean`\]

#### Returns

`this`

#### Deprecated

since 8.0.0 Use [Graphics#poly](#poly) instead

***

### ~~drawRect()~~

> **drawRect**(...`args`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1664

#### Parameters

##### args

...\[`number`, `number`, `number`, `number`\]

#### Returns

`this`

#### Deprecated

since 8.0.0 Use [Graphics#rect](#rect) instead

***

### ~~drawRoundedRect()~~

> **drawRoundedRect**(...`args`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1669

#### Parameters

##### args

...\[`number`, `number`, `number`, `number`, `number`\]

#### Returns

`this`

#### Deprecated

since 8.0.0 Use [Graphics#roundRect](#roundrect) instead

***

### ~~drawStar()~~

> **drawStar**(...`args`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1674

#### Parameters

##### args

...\[`number`, `number`, `number`, `number`, `number`, `number`\]

#### Returns

`this`

#### Deprecated

since 8.0.0 Use [Graphics#star](#star) instead

***

### ellipse()

> **ellipse**(`x`, `y`, `radiusX`, `radiusY`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:681

Draws an ellipse at the specified location and with the given x and y radii.
An optional transformation can be applied, allowing for rotation, scaling, and translation.

#### Parameters

##### x

`number`

The x-coordinate of the center of the ellipse

##### y

`number`

The y-coordinate of the center of the ellipse

##### radiusX

`number`

The horizontal radius of the ellipse

##### radiusY

`number`

The vertical radius of the ellipse

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a basic ellipse
graphics
    .ellipse(100, 100, 50, 30)
    .fill({ color: 0xff0000 });

// Draw an ellipse with stroke
graphics
    .ellipse(200, 100, 70, 40)
    .stroke({ width: 2, color: 0x00ff00 });
```

#### See

 - [Graphics#circle](#circle) For drawing perfect circles
 - [Graphics#arc](#arc) For drawing partial circular arcs

***

### emit()

> **emit**\<`T`\>(`event`, ...`args`): `boolean`

Defined in: node\_modules/.pnpm/eventemitter3@5.0.1/node\_modules/eventemitter3/index.d.ts:32

Calls each of the listeners registered for a given event.

#### Type Parameters

##### T

`T` *extends* keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent

#### Parameters

##### event

`T`

##### args

...`ArgumentMap`\<`ContainerEvents`\<`ContainerChild`\> & `AnyEvent`\>\[`Extract`\<`T`, keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent\>\]

#### Returns

`boolean`

#### Inherited from

`ViewContainer.emit`

***

### enableRenderGroup()

> **enableRenderGroup**(): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:901

Calling this enables a render group for this container.
This means it will be rendered as a separate set of instructions.
The transform of the container will also be handled on the GPU rather than the CPU.

#### Returns

`void`

#### Advanced

#### Inherited from

`ViewContainer.enableRenderGroup`

***

### ~~endFill()~~

> **endFill**(): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1644

#### Returns

`this`

#### Deprecated

since 8.0.0 Use [Graphics#fill](#fill) instead

***

### eventNames()

> **eventNames**(): (keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent)[]

Defined in: node\_modules/.pnpm/eventemitter3@5.0.1/node\_modules/eventemitter3/index.d.ts:15

Return an array listing the events for which the emitter has registered
listeners.

#### Returns

(keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent)[]

#### Inherited from

`ViewContainer.eventNames`

***

### fill()

#### Call Signature

> **fill**(`style?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:354

Fills the current or given path with the current fill style or specified style.

##### Parameters

###### style?

`FillInput`

The style to fill the path with. Can be:
- A ColorSource
- A gradient
- A pattern
- A complex style object
If omitted, uses current fill style.

##### Returns

`this`

The Graphics instance for chaining

##### Example

```ts
const graphics = new Graphics();

// Fill with direct color
graphics
    .circle(50, 50, 25)
    .fill('red'); // Red fill

// Fill with texture
graphics
   .rect(0, 0, 100, 100)
   .fill(myTexture); // Fill with texture

// Fill with complex style
graphics
    .rect(0, 0, 100, 100)
    .fill({
        color: 0x00ff00,
        alpha: 0.5,
        texture: myTexture,
        matrix: new Matrix()
    });

// Fill with gradient
const gradient = new FillGradient({
    end: { x: 1, y: 0 },
    colorStops: [
        { offset: 0, color: 0xff0000 },
        { offset: 0.5, color: 0x00ff00 },
        { offset: 1, color: 0x0000ff },
    ],
});

graphics
    .circle(100, 100, 50)
    .fill(gradient);
```

##### See

 - FillStyle For fill style options
 - FillGradient For gradient fills
 - FillPattern For pattern fills

#### Call Signature

> **fill**(`color`, `alpha?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:356

##### Parameters

###### color

`ColorSource`

###### alpha?

`number`

##### Returns

`this`

##### Deprecated

8.0.0

***

### filletRect()

> **filletRect**(`x`, `y`, `width`, `height`, `fillet`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1105

Draws a rectangle with fillet corners. Unlike rounded rectangles, this supports negative corner
radii which create external rounded corners rather than internal ones.

#### Parameters

##### x

`number`

The x-coordinate of the top-left corner of the rectangle

##### y

`number`

The y-coordinate of the top-left corner of the rectangle

##### width

`number`

The width of the rectangle

##### height

`number`

The height of the rectangle

##### fillet

`number`

The radius of the corner fillets (can be positive or negative)

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a rectangle with internal fillets
graphics
    .filletRect(50, 50, 100, 80, 15)
    .fill({ color: 0xff0000 });

// Draw a rectangle with external fillets
graphics
    .filletRect(200, 50, 100, 80, -20)
    .fill({ color: 0x00ff00 })
    .stroke({ width: 2, color: 0x000000 });
```

#### See

 - [Graphics#roundRect](#roundrect) For standard rounded corners
 - [Graphics#chamferRect](#chamferrect) For angled corners

***

### getBounds()

> **getBounds**(`skipUpdate?`, `bounds?`): `Bounds`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/measureMixin.d.ts:88

Calculates and returns the (world) bounds of the display object as a Rectangle.
Takes into account transforms and child bounds.

#### Parameters

##### skipUpdate?

`boolean`

Setting to `true` will stop the transforms of the scene graph from
 being updated. This means the calculation returned MAY be out of date BUT will give you a
 nice performance boost.

##### bounds?

`Bounds`

Optional bounds to store the result of the bounds calculation

#### Returns

`Bounds`

The minimum axis-aligned rectangle in world space that fits around this object

#### Example

```ts
// Basic bounds calculation
const bounds = sprite.getBounds();
console.log(`World bounds: ${bounds.x}, ${bounds.y}, ${bounds.width}, ${bounds.height}`);

// Reuse bounds object for performance
const recycleBounds = new Bounds();
sprite.getBounds(false, recycleBounds);

// Skip update for performance
const fastBounds = sprite.getBounds(true);
```

#### Remarks

- Includes transform calculations
- Updates scene graph by default
- Can reuse bounds objects
- Common in hit testing

#### See

 - [Container#getLocalBounds](#getlocalbounds) For untransformed bounds
 - Bounds For bounds properties

#### Inherited from

`ViewContainer.getBounds`

***

### getChildAt()

> **getChildAt**\<`U`\>(`index`): `U`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:85

Returns the child at the specified index.

#### Type Parameters

##### U

`U` *extends* `ContainerChild`

#### Parameters

##### index

`number`

The index to get the child from

#### Returns

`U`

The child at the given index

#### Example

```ts
// Get first child
const first = container.getChildAt(0);

// Type-safe access
const sprite = container.getChildAt<Sprite>(1);

// With error handling
try {
    const child = container.getChildAt(10);
} catch (e) {
    console.warn('Index out of bounds');
}
```

#### Throws

If index is out of bounds

#### See

 - Container#children For direct array access
 - Container#getChildByLabel For name-based lookup

#### Inherited from

`ViewContainer.getChildAt`

***

### getChildByLabel()

> **getChildByLabel**(`label`, `deep?`): `Container`\<`ContainerChild`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/findMixin.d.ts:53

Returns the first child in the container with the specified label.
Recursive searches are done in a pre-order traversal.

#### Parameters

##### label

`string` \| `RegExp`

Instance label to search for

##### deep?

`boolean`

Whether to search recursively through children

#### Returns

`Container`\<`ContainerChild`\>

The first child with the specified label, or null if none found

#### Example

```ts
// Basic label search
const child = container.getChildByLabel('player');

// Search with regular expression
const enemy = container.getChildByLabel(/enemy-\d+/);

// Deep search through children
const deepChild = container.getChildByLabel('powerup', true);
```

#### See

 - Container#getChildrenByLabel For finding all matches
 - [Container#label](#label) For setting labels

#### Inherited from

`ViewContainer.getChildByLabel`

***

### ~~getChildByName()~~

> **getChildByName**(`label`, `deep?`): `Container`\<`ContainerChild`\>

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/findMixin.d.ts:32

#### Parameters

##### label

`string` \| `RegExp`

Instance name.

##### deep?

`boolean`

Whether to search recursively

#### Returns

`Container`\<`ContainerChild`\>

The child with the specified name.

#### Deprecated

since 8.0.0

#### See

Container#getChildByLabel

#### Inherited from

`ViewContainer.getChildByName`

***

### getChildIndex()

> **getChildIndex**(`child`): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:130

Returns the index position of a child Container instance.

#### Parameters

##### child

`ContainerChild`

The Container instance to identify

#### Returns

`number`

The index position of the child container

#### Example

```ts
// Basic index lookup
const index = container.getChildIndex(sprite);
console.log(`Sprite is at index ${index}`);

// With error handling
try {
    const index = container.getChildIndex(sprite);
} catch (e) {
    console.warn('Child not found in container');
}
```

#### Throws

If child is not in this container

#### See

 - Container#setChildIndex For changing index
 - Container#children For direct array access

#### Inherited from

`ViewContainer.getChildIndex`

***

### getChildrenByLabel()

> **getChildrenByLabel**(`label`, `deep?`, `out?`): `Container`\<`ContainerChild`\>[]

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/findMixin.d.ts:74

Returns all children in the container with the specified label.
Recursive searches are done in a pre-order traversal.

#### Parameters

##### label

`string` \| `RegExp`

Instance label to search for

##### deep?

`boolean`

Whether to search recursively through children

##### out?

`Container`\<`ContainerChild`\>[]

Optional array to store matching children in

#### Returns

`Container`\<`ContainerChild`\>[]

An array of children with the specified label

#### Example

```ts
// Basic label search
const enemies = container.getChildrenByLabel('enemy');
// Search with regular expression
const powerups = container.getChildrenByLabel(/powerup-\d+/);
// Deep search with collection
const buttons = [];
container.getChildrenByLabel('button', true, buttons);
```

#### See

 - Container#getChildByLabel For finding first match
 - [Container#label](#label) For setting labels

#### Inherited from

`ViewContainer.getChildrenByLabel`

***

### getFastGlobalBounds()

> **getFastGlobalBounds**(`factorRenderLayers?`, `bounds?`): `Bounds`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/getFastGlobalBoundsMixin.d.ts:23

Computes an approximate global bounding box for the container and its children.
This method is optimized for speed by using axis-aligned bounding boxes (AABBs),
and uses the last render results from when it updated the transforms. This function does not update them.
which may result in slightly larger bounds but never smaller than the actual bounds.

for accurate (but less performant) results use `container.getGlobalBounds`

#### Parameters

##### factorRenderLayers?

`boolean`

A flag indicating whether to consider render layers in the calculation.

##### bounds?

`Bounds`

The output bounds object to store the result. If not provided, a new one is created.

#### Returns

`Bounds`

The computed bounds.

#### Advanced

#### Inherited from

`ViewContainer.getFastGlobalBounds`

***

### getGlobalAlpha()

> **getGlobalAlpha**(`skipUpdate?`): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/getGlobalMixin.d.ts:35

Returns the global (compound) alpha of the container within the scene.

#### Parameters

##### skipUpdate?

`boolean`

Performance optimization flag:
  - If false (default): Recalculates the entire alpha chain through parents for accuracy
  - If true: Uses cached worldAlpha from the last render pass for better performance

#### Returns

`number`

The resulting alpha value (between 0 and 1)

#### Example

```ts
// Accurate but slower - recalculates entire alpha chain
const preciseAlpha = container.getGlobalAlpha();

// Faster but may be outdated - uses cached alpha
const cachedAlpha = container.getGlobalAlpha(true);
```

#### Inherited from

`ViewContainer.getGlobalAlpha`

***

### getGlobalPosition()

> **getGlobalPosition**(`point?`, `skipUpdate?`): `Point`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/toLocalGlobalMixin.d.ts:36

Returns the global position of the container, taking into account the container hierarchy.

#### Parameters

##### point?

`Point`

The optional point to write the global value to

##### skipUpdate?

`boolean`

Should we skip the update transform

#### Returns

`Point`

The updated point

#### Example

```ts
// Basic position check
const globalPos = sprite.getGlobalPosition();
console.log(`Global: (${globalPos.x}, ${globalPos.y})`);

// Reuse point object
const point = new Point();
sprite.getGlobalPosition(point);

// Skip transform update for performance
const fastPos = container.getGlobalPosition(undefined, true);
```

#### See

 - [Container#toGlobal](#toglobal) For converting specific points
 - [Container#toLocal](#tolocal) For converting to local space

#### Inherited from

`ViewContainer.getGlobalPosition`

***

### getGlobalTint()

> **getGlobalTint**(`skipUpdate?`): `number`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/getGlobalMixin.d.ts:72

Returns the global (compound) tint color of the container within the scene.

#### Parameters

##### skipUpdate?

`boolean`

Performance optimization flag:
  - If false (default): Recalculates the entire tint chain through parents for accuracy
  - If true: Uses cached worldColor from the last render pass for better performance

#### Returns

`number`

The resulting tint color as a 24-bit RGB number (0xRRGGBB)

#### Example

```ts
// Accurate but slower - recalculates entire tint chain
const preciseTint = container.getGlobalTint();

// Faster but may be outdated - uses cached tint
const cachedTint = container.getGlobalTint(true);
```

#### Inherited from

`ViewContainer.getGlobalTint`

***

### getGlobalTransform()

> **getGlobalTransform**(`matrix?`, `skipUpdate?`): `Matrix`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/getGlobalMixin.d.ts:56

Returns the global transform matrix of the container within the scene.

#### Parameters

##### matrix?

`Matrix`

Optional matrix to store the result. If not provided, a new Matrix will be created.

##### skipUpdate?

`boolean`

Performance optimization flag:
  - If false (default): Recalculates the entire transform chain for accuracy
  - If true: Uses cached worldTransform from the last render pass for better performance

#### Returns

`Matrix`

The resulting transformation matrix (either the input matrix or a new one)

#### Example

```ts
// Accurate but slower - recalculates entire transform chain
const preciseTransform = container.getGlobalTransform();

// Faster but may be outdated - uses cached transform
const cachedTransform = container.getGlobalTransform(undefined, true);

// Reuse existing matrix
const existingMatrix = new Matrix();
container.getGlobalTransform(existingMatrix);
```

#### Inherited from

`ViewContainer.getGlobalTransform`

***

### getLocalBounds()

> **getLocalBounds**(): `Bounds`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/measureMixin.d.ts:58

Retrieves the local bounds of the container as a Bounds object.
Uses cached values when possible for better performance.

#### Returns

`Bounds`

The bounding area

#### Example

```ts
// Basic bounds check
const bounds = container.getLocalBounds();
console.log(`Width: ${bounds.width}, Height: ${bounds.height}`);
// subsequent calls will reuse the cached bounds
const cachedBounds = container.getLocalBounds();
console.log(bounds === cachedBounds); // true
```

#### See

 - [Container#getBounds](#getbounds) For world space bounds
 - Bounds For bounds properties

#### Inherited from

`ViewContainer.getLocalBounds`

***

### getSize()

> **getSize**(`out?`): `Size`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1136

Retrieves the size of the container as a [Size]Size object.

This is faster than get the width and height separately.

#### Parameters

##### out?

`Size`

Optional object to store the size in.

#### Returns

`Size`

The size of the container.

#### Example

```ts
// Basic size retrieval
const size = container.getSize();
console.log(`Size: ${size.width}x${size.height}`);

// Reuse existing size object
const reuseSize = { width: 0, height: 0 };
container.getSize(reuseSize);
```

#### Inherited from

`ViewContainer.getSize`

***

### getTransform()

> **getTransform**(): `Matrix`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1286

Returns the current transformation matrix of the graphics context.
This matrix represents all accumulated transformations including translate, scale, and rotate.

#### Returns

`Matrix`

The current transformation matrix.

#### Example

```ts
const graphics = new Graphics();

// Apply some transformations
graphics
    .translateTransform(100, 100)
    .rotateTransform(Math.PI / 4);

// Get the current transform matrix
const matrix = graphics.getTransform();
console.log(matrix.tx, matrix.ty); // 100, 100

// Use the matrix for other operations
graphics
    .setTransform(matrix)
    .circle(0, 0, 50)
    .fill({ color: 0xff0000 });
```

#### See

 - [Graphics#setTransform](#settransform) For setting the transform matrix
 - Matrix For matrix operations

***

### ~~lineStyle()~~

> **lineStyle**(`width?`, `color?`, `alpha?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1634

#### Parameters

##### width?

`number`

##### color?

`ColorSource`

##### alpha?

`number`

#### Returns

`this`

#### Deprecated

since 8.0.0 Use [Graphics#setStrokeStyle](#setstrokestyle) instead

***

### lineTo()

> **lineTo**(`x`, `y`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:769

Connects the current point to a new point with a straight line.
Any subsequent drawing commands will start from this new point.

#### Parameters

##### x

`number`

The x-coordinate of the line's end point

##### y

`number`

The y-coordinate of the line's end point

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a triangle
graphics
    .moveTo(50, 50)
    .lineTo(100, 100)
    .lineTo(0, 100)
    .fill({ color: 0xff0000 });

// Create a complex shape with multiple lines
graphics
    .moveTo(200, 50)
    .lineTo(250, 50)
    .lineTo(250, 100)
    .lineTo(200, 100)
    .stroke({ width: 2, color: 0x00ff00 });
```

#### See

[Graphics#moveTo](#moveto) For starting a new sub-path

***

### listenerCount()

> **listenerCount**(`event`): `number`

Defined in: node\_modules/.pnpm/eventemitter3@5.0.1/node\_modules/eventemitter3/index.d.ts:27

Return the number of listeners listening to a given event.

#### Parameters

##### event

keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent

#### Returns

`number`

#### Inherited from

`ViewContainer.listenerCount`

***

### listeners()

> **listeners**\<`T`\>(`event`): (...`args`) => `void`[]

Defined in: node\_modules/.pnpm/eventemitter3@5.0.1/node\_modules/eventemitter3/index.d.ts:20

Return the listeners registered for a given event.

#### Type Parameters

##### T

`T` *extends* keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent

#### Parameters

##### event

`T`

#### Returns

(...`args`) => `void`[]

#### Inherited from

`ViewContainer.listeners`

***

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:812

Sets the starting point for a new sub-path.

Moves the "pen" to a new location without drawing a line.
Any subsequent drawing commands will start from this point.

#### Parameters

##### x

`number`

The x-coordinate to move to

##### y

`number`

The y-coordinate to move to

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Create multiple separate lines
graphics
    .moveTo(50, 50)
    .lineTo(100, 50)
    .moveTo(50, 100)    // Start a new line
    .lineTo(100, 100)
    .stroke({ width: 2, color: 0xff0000 });

// Create disconnected shapes
graphics
    .moveTo(150, 50)
    .rect(150, 50, 50, 50)
    .fill({ color: 0x00ff00 })
    .moveTo(250, 50)    // Start a new shape
    .circle(250, 75, 25)
    .fill({ color: 0x0000ff });

// Position before curved paths
graphics
    .moveTo(300, 50)
    .bezierCurveTo(
        350, 25,   // Control point 1
        400, 75,   // Control point 2
        450, 50    // End point
    )
    .stroke({ width: 3, color: 0xff00ff });
```

#### See

 - [Graphics#lineTo](#lineto) For drawing lines
 - [Graphics#beginPath](#beginpath) For starting a completely new path

***

### off()

> **off**\<`T`\>(`event`, `fn?`, `context?`, `once?`): `this`

Defined in: node\_modules/.pnpm/eventemitter3@5.0.1/node\_modules/eventemitter3/index.d.ts:69

#### Type Parameters

##### T

`T` *extends* keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent

#### Parameters

##### event

`T`

##### fn?

(...`args`) => `void`

##### context?

`any`

##### once?

`boolean`

#### Returns

`this`

#### Inherited from

`ViewContainer.off`

***

### on()

> **on**\<`T`\>(`event`, `fn`, `context?`): `this`

Defined in: node\_modules/.pnpm/eventemitter3@5.0.1/node\_modules/eventemitter3/index.d.ts:40

Add a listener for a given event.

#### Type Parameters

##### T

`T` *extends* keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent

#### Parameters

##### event

`T`

##### fn

(...`args`) => `void`

##### context?

`any`

#### Returns

`this`

#### Inherited from

`ViewContainer.on`

***

### once()

> **once**\<`T`\>(`event`, `fn`, `context?`): `this`

Defined in: node\_modules/.pnpm/eventemitter3@5.0.1/node\_modules/eventemitter3/index.d.ts:54

Add a one-time listener for a given event.

#### Type Parameters

##### T

`T` *extends* keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent

#### Parameters

##### event

`T`

##### fn

(...`args`) => `void`

##### context?

`any`

#### Returns

`this`

#### Inherited from

`ViewContainer.once`

***

### path()

> **path**(`path`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:741

Adds another `GraphicsPath` to this path, optionally applying a transformation.
This allows for reuse of complex paths and shapes across different graphics instances.

#### Parameters

##### path

`GraphicsPath`

The `GraphicsPath` to add to the current path

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();
// Create a reusable path
const heartPath = new GraphicsPath()
    .moveTo(0, 0)
    .bezierCurveTo(-50, -25, -50, -75, 0, -100)
    .bezierCurveTo(50, -75, 50, -25, 0, 0);

// Use the path multiple times
graphics
    .path(heartPath)
    .fill({ color: 0xff0000 })
    .translateTransform(200, 200)
    .path(heartPath)
    .fill({ color: 0xff0000, alpha: 0.5 });
```

#### See

 - GraphicsPath For creating reusable paths
 - Matrix For creating transformations
 - [Graphics#transform](#transform) For applying transformations

***

### poly()

> **poly**(`points`, `close?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:945

Draws a polygon shape by specifying a sequence of points. This method allows for the creation of complex polygons,
which can be both open and closed.

An optional transformation can be applied, enabling the polygon to be scaled,
rotated, or translated as needed.

#### Parameters

##### points

`number`[] \| `PointData`[]

An array of numbers [x1,y1, x2,y2, ...] or an array of point objects [{x,y}, ...]
               representing the vertices of the polygon in sequence

##### close?

`boolean`

Whether to close the polygon path by connecting the last point to the first.
              Default is true.

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a triangle using array of numbers [x1,y1, x2,y2, x3,y3]
graphics
    .poly([50,50, 100,100, 0,100], true)
    .fill({ color: 0xff0000 });

// Draw a polygon using point objects
graphics
    .poly([
        { x: 200, y: 50 },
        { x: 250, y: 100 },
        { x: 200, y: 150 },
        { x: 150, y: 100 }
    ])
    .fill({ color: 0x00ff00 });

// Draw an open polygon with stroke
graphics
    .poly([300,50, 350,50, 350,100, 300,100], false)
    .stroke({
        width: 2,
        color: 0x0000ff,
        join: 'round'
    });
```

#### See

 - [Graphics#regularPoly](#regularpoly) For drawing regular polygons
 - [Graphics#roundPoly](#roundpoly) For drawing polygons with rounded corners
 - [Graphics#star](#star) For drawing star shapes

***

### quadraticCurveTo()

> **quadraticCurveTo**(`cpx`, `cpy`, `x`, `y`, `smoothness?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:850

Adds a quadratic curve to the path. It requires two points: the control point and the end point.
The starting point is the last point in the current path.

#### Parameters

##### cpx

`number`

The x-coordinate of the control point

##### cpy

`number`

The y-coordinate of the control point

##### x

`number`

The x-coordinate of the end point

##### y

`number`

The y-coordinate of the end point

##### smoothness?

`number`

Optional parameter to adjust the curve's smoothness (0-1)

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a simple curve
graphics
    .moveTo(50, 50)
    .quadraticCurveTo(100, 25, 150, 50)
    .stroke({ width: 2, color: 0xff0000 });

// Adjust curve smoothness
graphics
    .moveTo(50, 200)
    .quadraticCurveTo(
        150, 150,   // Control point
        250, 200,   // End point
        0.5         // Smoothness factor
    )
    .stroke({
        width: 4,
        color: 0x0000ff,
        alpha: 0.7
    });
```

#### See

 - [Graphics#bezierCurveTo](#beziercurveto) For curves with two control points
 - [Graphics#arc](#arc) For circular arcs
 - [Graphics#arcTo](#arcto) For connecting points with circular arcs

***

### rect()

> **rect**(`x`, `y`, `w`, `h`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:878

Draws a rectangle shape.

This method adds a new rectangle path to the current drawing.

#### Parameters

##### x

`number`

The x-coordinate of the top-left corner of the rectangle

##### y

`number`

The y-coordinate of the top-left corner of the rectangle

##### w

`number`

The width of the rectangle

##### h

`number`

The height of the rectangle

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a simple filled rectangle
graphics
    .rect(50, 50, 100, 75)
    .fill({ color: 0xff0000 });

// Rectangle with stroke
graphics
    .rect(200, 50, 100, 75)
    .stroke({ width: 2, color: 0x00ff00 });
```

#### See

 - [Graphics#roundRect](#roundrect) For drawing rectangles with rounded corners
 - [Graphics#filletRect](#filletrect) For drawing rectangles with filleted corners
 - [Graphics#chamferRect](#chamferrect) For drawing rectangles with chamfered corners

***

### regularPoly()

> **regularPoly**(`x`, `y`, `radius`, `sides`, `rotation?`, `transform?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:989

Draws a regular polygon with a specified number of sides. All sides and angles are equal,
making shapes like triangles, squares, pentagons, etc.

#### Parameters

##### x

`number`

The x-coordinate of the center of the polygon

##### y

`number`

The y-coordinate of the center of the polygon

##### radius

`number`

The radius of the circumscribed circle of the polygon

##### sides

`number`

The number of sides of the polygon (must be 3 or more)

##### rotation?

`number`

The rotation angle of the polygon in radians (default: 0)

##### transform?

`Matrix`

Optional Matrix to transform the polygon's shape

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a simple triangle (3 sides)
graphics
    .regularPoly(100, 100, 50, 3)
    .fill({ color: 0xff0000 });

// Draw a hexagon (6 sides) with rotation
graphics
    .regularPoly(
        250, 100,    // center position
        40,          // radius
        6,           // sides
        Math.PI / 6  // rotation (30 degrees)
    )
    .fill({ color: 0x00ff00 })
    .stroke({ width: 2, color: 0x000000 });

// Draw an octagon (8 sides) with transform
const transform = new Matrix()
    .scale(1.5, 1)      // stretch horizontally
    .rotate(Math.PI/4); // rotate 45 degrees

graphics
    .regularPoly(400, 100, 30, 8, 0, transform)
    .fill({ color: 0x0000ff, alpha: 0.5 });
```

#### See

 - [Graphics#poly](#poly) For drawing custom polygons
 - [Graphics#roundPoly](#roundpoly) For drawing polygons with rounded corners
 - [Graphics#star](#star) For drawing star shapes

***

### removeAllListeners()

> **removeAllListeners**(`event?`): `this`

Defined in: node\_modules/.pnpm/eventemitter3@5.0.1/node\_modules/eventemitter3/index.d.ts:79

Remove all listeners, or those of the specified event.

#### Parameters

##### event?

keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent

#### Returns

`this`

#### Inherited from

`ViewContainer.removeAllListeners`

***

### removeChild()

> **removeChild**\<`U`\>(...`children`): `U`\[`0`\]

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:885

Removes one or more children from the container.
When removing multiple children, events will be triggered for each child in sequence.

#### Type Parameters

##### U

`U` *extends* `ContainerChild`[]

#### Parameters

##### children

...`U`

The Container(s) to remove

#### Returns

`U`\[`0`\]

The first child that was removed

#### Example

```ts
// Remove a single child
const removed = container.removeChild(sprite);

// Remove multiple children
const bg = container.removeChild(background, player, userInterface);

// Remove with type checking
const sprite = container.removeChild<Sprite>(childSprite);
sprite.texture = newTexture;
```

#### See

 - Container#addChild For adding children
 - Container#removeChildren For removing multiple children

#### Inherited from

`ViewContainer.removeChild`

***

### removeChildAt()

> **removeChildAt**\<`U`\>(`index`): `U`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:61

Removes a child from the specified index position.

#### Type Parameters

##### U

`U` *extends* `ContainerChild`

#### Parameters

##### index

`number`

The index to remove the child from

#### Returns

`U`

The child that was removed

#### Example

```ts
// Remove first child
const removed = container.removeChildAt(0);

// type safe access
const sprite = container.removeChildAt<Sprite>(1);

// With error handling
try {
    const child = container.removeChildAt(10);
} catch (e) {
    console.warn('Index out of bounds');
}
```

#### Throws

If index is out of bounds

#### See

 - Container#removeChild For removing specific children
 - Container#removeChildren For removing multiple children

#### Inherited from

`ViewContainer.removeChildAt`

***

### removeChildren()

> **removeChildren**(`beginIndex?`, `endIndex?`): `ContainerChild`[]

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:37

Removes all children from this container that are within the begin and end indexes.

#### Parameters

##### beginIndex?

`number`

The beginning position

##### endIndex?

`number`

The ending position. Default is container size

#### Returns

`ContainerChild`[]

List of removed children

#### Example

```ts
// Remove all children
container.removeChildren();

// Remove first 3 children
const removed = container.removeChildren(0, 3);
console.log('Removed:', removed.length); // 3

// Remove children from index 2 onwards
container.removeChildren(2);

// Remove specific range
const middle = container.removeChildren(1, 4);
```

#### Throws

If begin/end indexes are invalid

#### See

 - Container#addChild For adding children
 - Container#removeChild For removing specific children

#### Inherited from

`ViewContainer.removeChildren`

***

### removeEventListener()

#### Call Signature

> **removeEventListener**\<`K`\>(`type`, `listener`, `options?`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:1082

Unlike `off` or `removeListener` which are methods from EventEmitter, `removeEventListener`
seeks to be compatible with the DOM's `removeEventListener` with support for options.

##### Type Parameters

###### K

`K` *extends* keyof FederatedEventMap \| keyof GlobalFederatedEventMap

##### Parameters

###### type

`K`

The type of event the listener is bound to.

###### listener

(`e`) => `any`

The listener callback or object.

###### options?

`RemoveListenerOptions`

The original listener options.
This is required to deregister a capture phase listener.

##### Returns

`void`

##### Inherited from

`ViewContainer.removeEventListener`

#### Call Signature

> **removeEventListener**(`type`, `listener`, `options?`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/events/FederatedEventTarget.d.ts:1083

##### Parameters

###### type

`string`

###### listener

`EventListenerOrEventListenerObject`

###### options?

`RemoveListenerOptions`

##### Returns

`void`

##### Inherited from

`ViewContainer.removeEventListener`

***

### removeFromParent()

> **removeFromParent**(): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:203

Remove the Container from its parent Container. If the Container has no parent, do nothing.

#### Returns

`void`

#### Example

```ts
// Basic removal
sprite.removeFromParent();

// With validation
if (sprite.parent) {
    sprite.removeFromParent();
}
```

#### See

 - Container#addChild For adding to a new parent
 - Container#removeChild For parent removing children

#### Inherited from

`ViewContainer.removeFromParent`

***

### removeListener()

> **removeListener**\<`T`\>(`event`, `fn?`, `context?`, `once?`): `this`

Defined in: node\_modules/.pnpm/eventemitter3@5.0.1/node\_modules/eventemitter3/index.d.ts:63

Remove the listeners of a given event.

#### Type Parameters

##### T

`T` *extends* keyof ContainerEvents\<ContainerChild\> \| keyof AnyEvent

#### Parameters

##### event

`T`

##### fn?

(...`args`) => `void`

##### context?

`any`

##### once?

`boolean`

#### Returns

`this`

#### Inherited from

`ViewContainer.removeListener`

***

### reparentChild()

> **reparentChild**\<`U`\>(...`child`): `U`\[`0`\]

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:224

Reparent a child or multiple children to this container while preserving their world transform.
This ensures that the visual position and rotation of the children remain the same even when changing parents.

#### Type Parameters

##### U

`U` *extends* `ContainerChild`[]

#### Parameters

##### child

...`U`

The child or children to reparent

#### Returns

`U`\[`0`\]

The first child that was reparented

#### Example

```ts
// Basic reparenting
const sprite = new Sprite(texture);
oldContainer.addChild(sprite);
// Move to new parent, keeping visual position
newContainer.reparentChild(sprite);

// Reparent multiple children
const batch = [sprite1, sprite2, sprite3];
newContainer.reparentChild(...batch);
```

#### See

 - Container#reparentChildAt For index-specific reparenting
 - Container#addChild For simple parenting

#### Inherited from

`ViewContainer.reparentChild`

***

### reparentChildAt()

> **reparentChildAt**\<`U`\>(`child`, `index`): `U`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:243

Reparent the child to this container at the specified index while preserving its world transform.
This ensures that the visual position and rotation of the child remain the same even when changing parents.

#### Type Parameters

##### U

`U` *extends* `ContainerChild`

#### Parameters

##### child

`U`

The child to reparent

##### index

`number`

The index to reparent the child to

#### Returns

`U`

The reparented child

#### Example

```ts
// Basic index-specific reparenting
const sprite = new Sprite(texture);
oldContainer.addChild(sprite);
// Move to new parent at index 0 (front)
newContainer.reparentChildAt(sprite, 0);
```

#### Throws

If index is out of bounds

#### See

 - Container#reparentChild For appending reparented children
 - Container#addChildAt For simple indexed parenting

#### Inherited from

`ViewContainer.reparentChildAt`

***

### replaceChild()

> **replaceChild**\<`U`, `T`\>(`oldChild`, `newChild`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:249

Replace a child in the container with a new child. Copying the local transform from the old child to the new one.

#### Type Parameters

##### U

`U` *extends* `ContainerChild`

##### T

`T` *extends* `ContainerChild`

#### Parameters

##### oldChild

`U`

The child to replace.

##### newChild

`T`

The new child to add.

#### Returns

`void`

#### Inherited from

`ViewContainer.replaceChild`

***

### resetTransform()

> **resetTransform**(): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1312

Resets the current transformation matrix to the identity matrix, effectively removing
any transformations (rotation, scaling, translation) previously applied.

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Apply transformations
graphics
    .translateTransform(100, 100)
    .scaleTransform(2, 2)
    .circle(0, 0, 25)
    .fill({ color: 0xff0000 });
// Reset transform to default state
graphics
    .resetTransform()
    .circle(50, 50, 25) // Will draw at actual coordinates
    .fill({ color: 0x00ff00 });
```

#### See

 - [Graphics#getTransform](#gettransform) For getting the current transform
 - [Graphics#setTransform](#settransform) For setting a specific transform
 - [Graphics#save](#save) For saving the current transform state
 - [Graphics#restore](#restore) For restoring a previous transform state

***

### restore()

> **restore**(): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1223

Restores the most recently saved graphics state by popping the top of the graphics state stack.
This includes transformations, fill styles, and stroke styles.

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Save current state
graphics.save();

// Make temporary changes
graphics
    .translateTransform(100, 100)
    .setFillStyle({ color: 0xff0000 })
    .circle(0, 0, 50)
    .fill();

// Restore to previous state
graphics.restore();

// Draw with original transform and styles
graphics
    .circle(50, 50, 30)
    .fill();
```

#### See

[Graphics#save](#save) For saving the current state

***

### rotateTransform()

> **rotateTransform**(`angle`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1331

Applies a rotation transformation to the graphics context around the current origin.
Positive angles rotate clockwise, while negative angles rotate counterclockwise.

#### Parameters

##### angle

`number`

The angle of rotation in radians

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Rotate 45 degrees clockwise
graphics
    .rotateTransform(Math.PI / 4)
    .rect(-25, -25, 50, 50)
    .fill({ color: 0xff0000 });
```

#### See

 - [Graphics#scaleTransform](#scaletransform) For scaling transformations
 - [Graphics#translateTransform](#translatetransform) For position transformations

***

### roundPoly()

> **roundPoly**(`x`, `y`, `radius`, `sides`, `corner`, `rotation?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1026

Draws a polygon with rounded corners.

Similar to `regularPoly` but with the ability to round the corners of the polygon.

#### Parameters

##### x

`number`

The x-coordinate of the center of the polygon

##### y

`number`

The y-coordinate of the center of the polygon

##### radius

`number`

The radius of the circumscribed circle of the polygon

##### sides

`number`

The number of sides of the polygon (must be 3 or more)

##### corner

`number`

The radius of the corner rounding (must be non-negative)

##### rotation?

`number`

The rotation angle of the polygon in radians (default: 0)

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a basic rounded triangle
graphics
    .roundPoly(100, 100, 50, 3, 10)
    .fill({ color: 0xff0000 });

// Draw a rounded hexagon with rotation
graphics
    .roundPoly(
        250, 150,     // center position
        40,           // radius
        6,            // sides
        8,            // corner radius
        Math.PI / 6   // rotation (30 degrees)
    )
    .fill({ color: 0x00ff00 })
    .stroke({ width: 2, color: 0x000000 });
```

#### See

 - [Graphics#regularPoly](#regularpoly) For drawing polygons without rounded corners
 - [Graphics#poly](#poly) For drawing custom polygons
 - [Graphics#roundRect](#roundrect) For drawing rectangles with rounded corners

***

### roundRect()

> **roundRect**(`x`, `y`, `w`, `h`, `radius?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:901

Draws a rectangle with rounded corners. The corner radius can be specified to
determine how rounded the corners should be.

#### Parameters

##### x

`number`

The x-coordinate of the top-left corner of the rectangle

##### y

`number`

The y-coordinate of the top-left corner of the rectangle

##### w

`number`

The width of the rectangle

##### h

`number`

The height of the rectangle

##### radius?

`number`

The radius of the rectangle's corners (must be non-negative)

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Basic rounded rectangle
graphics
    .roundRect(50, 50, 100, 75, 15)
    .fill({ color: 0xff0000 });
```

#### See

 - [Graphics#rect](#rect) For drawing rectangles with sharp corners
 - [Graphics#filletRect](#filletrect) For drawing rectangles with filleted corners
 - [Graphics#chamferRect](#chamferrect) For drawing rectangles with chamfered corners

***

### roundShape()

> **roundShape**(`points`, `radius`, `useQuadratic?`, `smoothness?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1077

Draws a shape with rounded corners. This function supports custom radius for each corner of the shape.
Optionally, corners can be rounded using a quadratic curve instead of an arc, providing a different aesthetic.

#### Parameters

##### points

`RoundedPoint`[]

An array of `RoundedPoint` representing the corners of the shape.
               Each point can have its own radius or use the default.
               A minimum of 3 points is required.

##### radius

`number`

The default radius for corners without a specific radius defined.
               Applied to any point that doesn't specify its own radius.

##### useQuadratic?

`boolean`

When true, corners are drawn using quadratic curves instead
                     of arcs, creating a different visual style. Defaults to false.

##### smoothness?

`number`

Controls the smoothness of quadratic corners when useQuadratic
                   is true. Values range from 0-1, higher values create smoother curves.

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a custom shape with rounded corners
graphics
    .roundShape([
        { x: 100, y: 100, radius: 20 },
        { x: 200, y: 100, radius: 10 },
        { x: 200, y: 200, radius: 15 },
        { x: 100, y: 200, radius: 5 }
    ], 10)
    .fill({ color: 0xff0000 });

// Using quadratic curves for corners
graphics
    .roundShape([
        { x: 250, y: 100 },
        { x: 350, y: 100 },
        { x: 350, y: 200 },
        { x: 250, y: 200 }
    ], 15, true, 0.5)
    .fill({ color: 0x00ff00 })
    .stroke({ width: 2, color: 0x000000 });

// Shape with varying corner radii
graphics
    .roundShape([
        { x: 400, y: 100, radius: 30 },
        { x: 500, y: 100, radius: 5 },
        { x: 450, y: 200, radius: 15 }
    ], 10)
    .fill({ color: 0x0000ff, alpha: 0.5 });
```

#### See

 - [Graphics#roundRect](#roundrect) For drawing rectangles with rounded corners
 - [Graphics#roundPoly](#roundpoly) For drawing regular polygons with rounded corners

***

### save()

> **save**(): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1259

Saves the current graphics state onto a stack. The state includes:
- Current transformation matrix
- Current fill style
- Current stroke style

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Save state before complex operations
graphics.save();

// Create transformed and styled shape
graphics
    .translateTransform(100, 100)
    .rotateTransform(Math.PI / 4)
    .setFillStyle({
        color: 0xff0000,
        alpha: 0.5
    })
    .rect(-25, -25, 50, 50)
    .fill();

// Restore to original state
graphics.restore();

// Continue drawing with previous state
graphics
    .circle(50, 50, 25)
    .fill();
```

#### See

 - [Graphics#restore](#restore) For restoring the saved state
 - [Graphics#setTransform](#settransform) For setting transformations

***

### scaleTransform()

> **scaleTransform**(`x`, `y?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1357

Applies a scaling transformation to the graphics context, scaling drawings by x horizontally
and by y vertically relative to the current origin.

#### Parameters

##### x

`number`

The scale factor in the horizontal direction

##### y?

`number`

The scale factor in the vertical direction. If omitted, equals x

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Uniform scaling
graphics
    .scaleTransform(2)  // Scale both dimensions by 2
    .circle(0, 0, 25)
    .fill({ color: 0xff0000 });

// Non-uniform scaling
graphics
    .scaleTransform(0.5, 2)  // Half width, double height
    .rect(100, 100, 50, 50)
    .fill({ color: 0x00ff00 });
```

#### See

 - [Graphics#rotateTransform](#rotatetransform) For rotation transformations
 - [Graphics#translateTransform](#translatetransform) For position transformations

***

### setChildIndex()

> **setChildIndex**(`child`, `index`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:108

Changes the position of an existing child in the container.

#### Parameters

##### child

`ContainerChild`

The child Container instance to reposition

##### index

`number`

The resulting index number for the child

#### Returns

`void`

#### Example

```ts
// Basic index change
container.setChildIndex(sprite, 0); // Move to front
container.setChildIndex(sprite, container.children.length - 1); // Move to back

// With error handling
try {
    container.setChildIndex(sprite, 5);
} catch (e) {
    console.warn('Invalid index or child not found');
}
```

#### Throws

If index is out of bounds

#### Throws

If child is not in container

#### See

 - Container#getChildIndex For getting current index
 - Container#swapChildren For swapping positions

#### Inherited from

`ViewContainer.setChildIndex`

***

### setFillStyle()

> **setFillStyle**(...`args`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:248

Sets the current fill style of the graphics context.
The fill style can be a color, gradient, pattern, or a complex style object.

#### Parameters

##### args

...\[`FillInput`\]

The fill style to apply

#### Returns

`this`

The Graphics instance for chaining

#### Example

```ts
const graphics = new Graphics();

// Basic color fill
graphics
    .setFillStyle({ color: 0xff0000 }) // Red fill
    .rect(0, 0, 100, 100)
    .fill();

// Gradient fill
const gradient = new FillGradient({
   end: { x: 1, y: 0 },
   colorStops: [
        { offset: 0, color: 0xff0000 }, // Red at start
        { offset: 0.5, color: 0x00ff00 }, // Green at middle
        { offset: 1, color: 0x0000ff }, // Blue at end
   ],
});

graphics
    .setFillStyle(gradient)
    .circle(100, 100, 50)
    .fill();

// Pattern fill
const pattern = new FillPattern(texture);
graphics
    .setFillStyle({
        fill: pattern,
        alpha: 0.5
    })
    .rect(0, 0, 200, 200)
    .fill();
```

#### See

 - FillStyle For fill style options
 - FillGradient For gradient fills
 - FillPattern For pattern fills

***

### setFromMatrix()

> **setFromMatrix**(`matrix`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1223

Updates the local transform properties by decomposing the given matrix.
Extracts position, scale, rotation, and skew from a transformation matrix.

#### Parameters

##### matrix

`Matrix`

The matrix to use for updating the transform

#### Returns

`void`

#### Example

```ts
// Basic matrix transform
const matrix = new Matrix()
    .translate(100, 100)
    .rotate(Math.PI / 4)
    .scale(2, 2);

container.setFromMatrix(matrix);

// Copy transform from another container
const source = new Container();
source.position.set(100, 100);
source.rotation = Math.PI / 2;

target.setFromMatrix(source.localTransform);

// Reset transform
container.setFromMatrix(Matrix.IDENTITY);
```

#### See

 - Container#updateTransform For property-based updates
 - Matrix#decompose For matrix decomposition details

#### Inherited from

`ViewContainer.setFromMatrix`

***

### setMask()

> **setMask**(`options`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/effectsMixin.d.ts:229

Used to set mask and control mask options on a display object.
Allows for more detailed control over masking behavior compared to the mask property.

#### Parameters

##### options

`Partial`\<`MaskOptionsAndMask`\>

Configuration options for the mask

#### Returns

`void`

#### Example

```ts
import { Graphics, Sprite } from 'pixi.js';

// Create a circular mask
const graphics = new Graphics()
    .beginFill(0xFF3300)
    .drawCircle(100, 100, 50)
    .endFill();

// Apply mask with options
sprite.setMask({
    mask: graphics,
    inverse: true, // Create a hole effect
});

// Use the alpha channel for masking (useful for sprites with transparency)
sprite.setMask({
    mask: maskSprite,
    channel: 'alpha',
});

// Clear existing mask
sprite.setMask({ mask: null });
```

#### See

 - [Container#mask](#mask) For simple masking
 - MaskOptionsAndMask For full options API
 - MaskOptions#channel For channel selection

#### Inherited from

`ViewContainer.setMask`

***

### setSize()

> **setSize**(`value`, `height?`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1151

Sets the size of the container to the specified width and height.
This is more efficient than setting width and height separately as it only recalculates bounds once.

#### Parameters

##### value

`number` \| `Optional`\<`Size`, `"height"`\>

This can be either a number or a [Size]Size object.

##### height?

`number`

The height to set. Defaults to the value of `width` if not provided.

#### Returns

`void`

#### Example

```ts
// Basic size setting
container.setSize(100, 200);

// Set uniform size
container.setSize(100); // Sets both width and height to 100
```

#### Inherited from

`ViewContainer.setSize`

***

### setStrokeStyle()

> **setStrokeStyle**(...`args`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:302

Sets the current stroke style of the graphics context.
Similar to fill styles, stroke styles can encompass colors, gradients, patterns, or more detailed configurations.

#### Parameters

##### args

...\[`StrokeInput`\]

The stroke style to apply

#### Returns

`this`

The Graphics instance for chaining

#### Example

```ts
const graphics = new Graphics();

// Basic color stroke
graphics
    .setStrokeStyle({
        width: 2,
        color: 0x000000
    })
    .rect(0, 0, 100, 100)
    .stroke();

// Complex stroke style
graphics
    .setStrokeStyle({
        width: 4,
        color: 0xff0000,
        alpha: 0.5,
        join: 'round',
        cap: 'round',
        alignment: 0.5
    })
    .circle(100, 100, 50)
    .stroke();

// Gradient stroke
const gradient = new FillGradient({
   end: { x: 1, y: 0 },
   colorStops: [
        { offset: 0, color: 0xff0000 }, // Red at start
        { offset: 0.5, color: 0x00ff00 }, // Green at middle
        { offset: 1, color: 0x0000ff }, // Blue at end
   ],
});

graphics
    .setStrokeStyle({
        width: 10,
        fill: gradient
    })
    .poly([0,0, 100,50, 0,100])
    .stroke();
```

#### See

 - StrokeStyle For stroke style options
 - FillGradient For gradient strokes
 - FillPattern For pattern strokes

***

### setTransform()

#### Call Signature

> **setTransform**(`transform`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1390

Sets the current transformation matrix of the graphics context.

This method can either
take a Matrix object or individual transform values to create a new transformation matrix.

##### Parameters

###### transform

`Matrix`

The matrix to set as the current transformation matrix.

##### Returns

`this`

The instance of the current GraphicsContext for method chaining.

##### Example

```ts
const graphics = new Graphics();

// Using a Matrix object
const matrix = new Matrix()
    .translate(100, 100)
    .rotate(Math.PI / 4);

graphics
    .setTransform(matrix)
    .rect(0, 0, 50, 50)
    .fill({ color: 0xff0000 });

// Using individual transform values
graphics
    .setTransform(
        2, 0,     // scale x by 2
        0, 1,     // no skew
        100, 100  // translate x,y by 100
    )
    .circle(0, 0, 25)
    .fill({ color: 0x00ff00 });
```

#### Call Signature

> **setTransform**(`a`, `b`, `c`, `d`, `dx`, `dy`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1402

Sets the current transformation matrix of the graphics context to the specified matrix or values.
This replaces the current transformation matrix.

##### Parameters

###### a

`number`

The value for the a property of the matrix, or a Matrix object to use directly.

###### b

`number`

The value for the b property of the matrix.

###### c

`number`

The value for the c property of the matrix.

###### d

`number`

The value for the d property of the matrix.

###### dx

`number`

The value for the tx (translate x) property of the matrix.

###### dy

`number`

The value for the ty (translate y) property of the matrix.

##### Returns

`this`

The instance of the current GraphicsContext for method chaining.

#### Call Signature

> **setTransform**(`a`, `b?`, `c?`, `d?`, `dx?`, `dy?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1403

Sets the current transformation matrix of the graphics context.

This method can either
take a Matrix object or individual transform values to create a new transformation matrix.

##### Parameters

###### a

`number` \| `Matrix`

###### b?

`number`

###### c?

`number`

###### d?

`number`

###### dx?

`number`

###### dy?

`number`

##### Returns

`this`

The instance of the current GraphicsContext for method chaining.

##### Example

```ts
const graphics = new Graphics();

// Using a Matrix object
const matrix = new Matrix()
    .translate(100, 100)
    .rotate(Math.PI / 4);

graphics
    .setTransform(matrix)
    .rect(0, 0, 50, 50)
    .fill({ color: 0xff0000 });

// Using individual transform values
graphics
    .setTransform(
        2, 0,     // scale x by 2
        0, 1,     // no skew
        100, 100  // translate x,y by 100
    )
    .circle(0, 0, 25)
    .fill({ color: 0x00ff00 });
```

***

### star()

> **star**(`x`, `y`, `points`, `radius`, `innerRadius?`, `rotation?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1172

Draws a star shape centered at a specified location. This method allows for the creation
of stars with a variable number of points, outer radius, optional inner radius, and rotation.

The star is drawn as a closed polygon with alternating outer and inner vertices to create the star's points.
An optional transformation can be applied to scale, rotate, or translate the star as needed.

#### Parameters

##### x

`number`

The x-coordinate of the center of the star

##### y

`number`

The y-coordinate of the center of the star

##### points

`number`

The number of points on the star (must be >= 3)

##### radius

`number`

The outer radius of the star (distance from center to point tips)

##### innerRadius?

`number`

Optional. The inner radius of the star (distance from center to inner vertices).
                    If not specified, defaults to half of the outer radius

##### rotation?

`number`

Optional. The rotation of the star in radians. Default is 0,
                 which aligns one point straight up

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Draw a basic 5-pointed star
graphics
    .star(100, 100, 5, 50)
    .fill({ color: 0xff0000 });

// Star with custom inner radius
graphics
    .star(250, 100, 6, 50, 20)
    .fill({ color: 0x00ff00 })
    .stroke({ width: 2, color: 0x000000 });
```

#### See

 - [Graphics#regularPoly](#regularpoly) For drawing regular polygons
 - [Graphics#poly](#poly) For drawing custom polygons
 - [Graphics#path](#path) For creating custom shapes

***

### stroke()

> **stroke**(...`args`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:406

Strokes the current path with the current stroke style or specified style.
Outlines the shape using the stroke settings.

#### Parameters

##### args

...\[`StrokeInput`\]

Optional stroke style to apply. Can be:
- A stroke style object with width, color, etc.
- A gradient
- A pattern
If omitted, uses current stroke style.

#### Returns

`this`

The Graphics instance for chaining

#### Example

```ts
const graphics = new Graphics();

// Stroke with direct color
graphics
    .circle(50, 50, 25)
    .stroke({
        width: 2,
        color: 0xff0000
    }); // 2px red stroke

// Fill with texture
graphics
   .rect(0, 0, 100, 100)
   .stroke(myTexture); // Fill with texture

// Stroke with gradient
const gradient = new FillGradient({
    end: { x: 1, y: 0 },
    colorStops: [
        { offset: 0, color: 0xff0000 },
        { offset: 0.5, color: 0x00ff00 },
        { offset: 1, color: 0x0000ff },
    ],
});

graphics
    .rect(0, 0, 100, 100)
    .stroke({
        width: 4,
        fill: gradient,
        alignment: 0.5,
        join: 'round'
    });
```

#### See

 - StrokeStyle For stroke style options
 - FillGradient For gradient strokes
 - [setStrokeStyle](#setstrokestyle) For setting default stroke style

***

### svg()

> **svg**(`svg`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1194

Parses and renders an SVG string into the graphics context. This allows for complex shapes
and paths defined in SVG format to be drawn within the graphics context.

#### Parameters

##### svg

`string`

The SVG string to be parsed and rendered

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();
graphics
    .svg(`
        <path d="M 50,50 L 100,50 L 100,100 L 50,100 Z"
              fill="blue" />
        <circle cx="150" cy="75" r="25"
              fill="green" />
    `)
    .stroke({ width: 2, color: 0x000000 });
```

#### See

 - [Graphics#path](#path) For adding custom paths
 - [Graphics#fill](#fill) For filling shapes after SVG parsing
 - [Graphics#stroke](#stroke) For stroking shapes after SVG parsing

***

### swapChildren()

> **swapChildren**\<`U`\>(`child`, `child2`): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.d.ts:187

Swaps the position of 2 Containers within this container.

#### Type Parameters

##### U

`U` *extends* `ContainerChild`

#### Parameters

##### child

`U`

First container to swap

##### child2

`U`

Second container to swap

#### Returns

`void`

#### Example

```ts
// Basic swap
container.swapChildren(sprite1, sprite2);

// With error handling
try {
    container.swapChildren(sprite1, sprite2);
} catch (e) {
    console.warn('One or both children not found in container');
}
```

#### Remarks

- Updates render groups
- No effect if same child
- Triggers container changes
- Common in z-ordering

#### Throws

If either child is not in container

#### See

 - Container#setChildIndex For direct index placement
 - Container#getChildIndex For getting current positions

#### Inherited from

`ViewContainer.swapChildren`

***

### texture()

#### Call Signature

> **texture**(`texture`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:444

Adds a texture to the graphics context. This method supports multiple ways to draw textures
including basic textures, tinted textures, and textures with custom dimensions.

##### Parameters

###### texture

`Texture`

The Texture object to use.

##### Returns

`this`

The instance of the current Graphics for chaining.

Extended texture drawing:

##### Example

```ts
const graphics = new Graphics();

// Basic texture drawing
graphics.texture(myTexture);

// Tinted texture with position
graphics.texture(myTexture, 0xff0000); // Red tint

// Texture with custom position and dimensions
graphics
    .texture(
        myTexture,    // texture
        0xffffff,     // white tint
        100, 100,     // position
        200, 150      // dimensions
    );
```
Basic texture drawing:

##### See

 - Texture For texture creation
 - FillPattern For pattern fills

#### Call Signature

> **texture**(`texture`, `tint?`, `dx?`, `dy?`, `dw?`, `dh?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:445

Adds a texture to the graphics context. This method supports multiple ways to draw textures
including basic textures, tinted textures, and textures with custom dimensions.

##### Parameters

###### texture

`Texture`

The Texture object to use.

###### tint?

`ColorSource`

###### dx?

`number`

###### dy?

`number`

###### dw?

`number`

###### dh?

`number`

##### Returns

`this`

The instance of the current Graphics for chaining.

Extended texture drawing:

##### Example

```ts
const graphics = new Graphics();

// Basic texture drawing
graphics.texture(myTexture);

// Tinted texture with position
graphics.texture(myTexture, 0xff0000); // Red tint

// Texture with custom position and dimensions
graphics
    .texture(
        myTexture,    // texture
        0xffffff,     // white tint
        100, 100,     // position
        200, 150      // dimensions
    );
```
Basic texture drawing:

##### See

 - Texture For texture creation
 - FillPattern For pattern fills

***

### toGlobal()

> **toGlobal**\<`P`\>(`position`, `point?`, `skipUpdate?`): `P`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/toLocalGlobalMixin.d.ts:64

Calculates the global position of a point relative to this container.
Takes into account the container hierarchy and transforms.

#### Type Parameters

##### P

`P` *extends* `PointData` = `Point`

#### Parameters

##### position

`PointData`

The local point to convert

##### point?

`P`

Optional point to store the result

##### skipUpdate?

`boolean`

Whether to skip transform updates

#### Returns

`P`

The global position

#### Example

```ts
// Basic point conversion
const localPoint = { x: 10, y: 20 };
const globalPoint = container.toGlobal(localPoint);

// With point reuse
const reusePoint = new Point();
container.toGlobal(localPoint, reusePoint);

// Performance optimization
const fastPoint = container.toGlobal(
    { x: 50, y: 50 },
    undefined,
    true // Skip transform update
);
```

#### See

 - [Container#toLocal](#tolocal) For reverse conversion
 - [Container#getGlobalPosition](#getglobalposition) For container position

#### Inherited from

`ViewContainer.toGlobal`

***

### toLocal()

> **toLocal**\<`P`\>(`position`, `from?`, `point?`, `skipUpdate?`): `P`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/container-mixins/toLocalGlobalMixin.d.ts:100

Calculates the local position of the container relative to another point.
Converts coordinates from any coordinate space to this container's local coordinate space.

#### Type Parameters

##### P

`P` *extends* `PointData` = `Point`

#### Parameters

##### position

`PointData`

The world origin to calculate from

##### from?

`Container`

The Container to calculate the global position from

##### point?

`P`

A Point object in which to store the value

##### skipUpdate?

`boolean`

Should we skip the update transform

#### Returns

`P`

A point object representing the position in local space

#### Example

```ts
// Basic coordinate conversion
const worldPoint = { x: 100, y: 100 };
const localPos = container.toLocal(worldPoint);

// Convert from another container
const fromSprite = new Sprite(texture);
fromSprite.position.set(50, 50);
const pointInSprite = { x: 10, y: 10 };
const localPoint = container.toLocal(pointInSprite, fromSprite);

// With point reuse for performance
const reusePoint = new Point();
container.toLocal(worldPoint, undefined, reusePoint);

// Skip transform update for static objects
const fastLocal = container.toLocal(
    worldPoint,
    undefined,
    undefined,
    true
);
```

#### See

 - [Container#toGlobal](#toglobal) For reverse conversion
 - [Container#getGlobalPosition](#getglobalposition) For container position

#### Inherited from

`ViewContainer.toLocal`

***

### transform()

#### Call Signature

> **transform**(`transform`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1435

Applies a transformation matrix to the current graphics context by multiplying
the current matrix with the specified matrix. This allows for complex transformations
combining multiple operations.

##### Parameters

###### transform

`Matrix`

The matrix to apply to the current transformation.

##### Returns

`this`

The instance of the current GraphicsContext for method chaining.

##### Example

```ts
const graphics = new Graphics();

// Using a Matrix object
const matrix = new Matrix()
    .scale(2, 1)      // Scale horizontally
    .rotate(Math.PI/6); // Rotate 30 degrees

graphics
    .transform(matrix)
    .rect(0, 0, 50, 50)
    .fill({ color: 0xff0000 });

// Using individual transform values
graphics
    .transform(
        1, 0.5,    // Skew horizontally
        0, 1,      // No vertical skew
        100, 100   // Translate
    )
    .circle(0, 0, 25)
    .fill({ color: 0x00ff00 });
```

#### Call Signature

> **transform**(`a`, `b`, `c`, `d`, `dx`, `dy`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1447

Applies the specified transformation matrix to the current graphics context by multiplying
the current matrix with the specified matrix.

##### Parameters

###### a

`number`

The value for the a property of the matrix, or a Matrix object to use directly.

###### b

`number`

The value for the b property of the matrix.

###### c

`number`

The value for the c property of the matrix.

###### d

`number`

The value for the d property of the matrix.

###### dx

`number`

The value for the tx (translate x) property of the matrix.

###### dy

`number`

The value for the ty (translate y) property of the matrix.

##### Returns

`this`

The instance of the current GraphicsContext for method chaining.

#### Call Signature

> **transform**(`a`, `b?`, `c?`, `d?`, `dx?`, `dy?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1448

Applies a transformation matrix to the current graphics context by multiplying
the current matrix with the specified matrix. This allows for complex transformations
combining multiple operations.

##### Parameters

###### a

`number` \| `Matrix`

###### b?

`number`

###### c?

`number`

###### d?

`number`

###### dx?

`number`

###### dy?

`number`

##### Returns

`this`

The instance of the current GraphicsContext for method chaining.

##### Example

```ts
const graphics = new Graphics();

// Using a Matrix object
const matrix = new Matrix()
    .scale(2, 1)      // Scale horizontally
    .rotate(Math.PI/6); // Rotate 30 degrees

graphics
    .transform(matrix)
    .rect(0, 0, 50, 50)
    .fill({ color: 0xff0000 });

// Using individual transform values
graphics
    .transform(
        1, 0.5,    // Skew horizontally
        0, 1,      // No vertical skew
        100, 100   // Translate
    )
    .circle(0, 0, 25)
    .fill({ color: 0x00ff00 });
```

***

### translateTransform()

> **translateTransform**(`x`, `y?`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/graphics/shared/Graphics.d.ts:1469

Applies a translation transformation to the graphics context, moving the origin by the specified amounts.
This affects all subsequent drawing operations.

#### Parameters

##### x

`number`

The amount to translate in the horizontal direction

##### y?

`number`

The amount to translate in the vertical direction. If omitted, equals x

#### Returns

`this`

The Graphics instance for method chaining

#### Example

```ts
const graphics = new Graphics();

// Basic translation
graphics
    .translateTransform(100, 100)
    .circle(0, 0, 25)
    .fill({ color: 0xff0000 });
```

#### See

 - [Graphics#setTransform](#settransform) For setting absolute transformations
 - [Graphics#transform](#transform) For applying complex transformations
 - [Graphics#save](#save) For saving the current transform state

***

### unload()

> **unload**(): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/view/ViewContainer.d.ts:110

Unloads the GPU data from the view.

#### Returns

`void`

#### Inherited from

`ViewContainer.unload`

***

### updateLocalTransform()

> **updateLocalTransform**(): `void`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1225

Updates the local transform.

#### Returns

`void`

#### Inherited from

`ViewContainer.updateLocalTransform`

***

### updateTransform()

> **updateTransform**(`opts`): `this`

Defined in: node\_modules/.pnpm/pixi.js@8.18.1/node\_modules/pixi.js/lib/scene/container/Container.d.ts:1195

Updates the transform properties of the container.
Allows partial updates of transform properties for optimized manipulation.

#### Parameters

##### opts

`Partial`\<`UpdateTransformOptions`\>

Transform options to update

#### Returns

`this`

This container, for chaining

#### Example

```ts
// Basic transform update
container.updateTransform({
    x: 100,
    y: 200,
    rotation: Math.PI / 4
});

// Scale and rotate around center
sprite.updateTransform({
    pivotX: sprite.width / 2,
    pivotY: sprite.height / 2,
    scaleX: 2,
    scaleY: 2,
    rotation: Math.PI
});

// Update position only
button.updateTransform({
    x: button.x + 10, // Move right
    y: button.y      // Keep same y
});
```

#### See

 - Container#setFromMatrix For matrix-based transforms
 - Container#position For direct position access

#### Inherited from

`ViewContainer.updateTransform`
