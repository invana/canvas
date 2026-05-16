# Class: TextureRegistry

Defined in: [canvas/src/textures/TextureRegistry.ts:21](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/textures/TextureRegistry.ts#L21)

## Constructors

### Constructor

> **new TextureRegistry**(): `TextureRegistry`

#### Returns

`TextureRegistry`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/textures/TextureRegistry.ts:93](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/textures/TextureRegistry.ts#L93)

Unload and destroy all textures owned by this registry. External textures
(registered via `register`) are not touched. Call when the host Layer
unmounts.

#### Returns

`void`

***

### get()

> **get**(`url`): `Texture`\<`TextureSource`\<`any`\>\>

Defined in: [canvas/src/textures/TextureRegistry.ts:28](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/textures/TextureRegistry.ts#L28)

Look up a cached texture by URL or atlas frame name.

#### Parameters

##### url

`string`

#### Returns

`Texture`\<`TextureSource`\<`any`\>\>

***

### has()

> **has**(`url`): `boolean`

Defined in: [canvas/src/textures/TextureRegistry.ts:32](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/textures/TextureRegistry.ts#L32)

#### Parameters

##### url

`string`

#### Returns

`boolean`

***

### load()

> **load**(`url`): `Promise`\<`Texture`\<`TextureSource`\<`any`\>\>\>

Defined in: [canvas/src/textures/TextureRegistry.ts:54](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/textures/TextureRegistry.ts#L54)

Load a single URL and cache it. Returns the cached texture on subsequent
calls (synchronous fast path). Uses pixi's `Assets` pipeline so the
result integrates with the global asset manager.

For URLs without a recognised image extension (e.g. picsum.photos,
signed CDN URLs, API endpoints) the `loadTextures` parser is explicitly
requested so PixiJS doesn't skip loading due to an unknown file type.

#### Parameters

##### url

`string`

#### Returns

`Promise`\<`Texture`\<`TextureSource`\<`any`\>\>\>

***

### loadAtlas()

> **loadAtlas**(`jsonUrl`): `Promise`\<`void`\>

Defined in: [canvas/src/textures/TextureRegistry.ts:79](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/textures/TextureRegistry.ts#L79)

Load a PixiJS spritesheet atlas JSON. After this resolves, individual
frame textures are accessible via `get(frameName)` where `frameName`
matches the keys declared in the atlas JSON.

All 1k-icon atlases packed into a single PNG → one GPU upload, one
draw call for every sprite sharing that atlas page.

#### Parameters

##### jsonUrl

`string`

#### Returns

`Promise`\<`void`\>

***

### preload()

> **preload**(`urls`): `Promise`\<`void`\>

Defined in: [canvas/src/textures/TextureRegistry.ts:67](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/textures/TextureRegistry.ts#L67)

Batch-preload a list of URLs in parallel. Await before first render to avoid mid-frame async loads.

#### Parameters

##### urls

`string`[]

#### Returns

`Promise`\<`void`\>

***

### register()

> **register**(`url`, `texture`): `void`

Defined in: [canvas/src/textures/TextureRegistry.ts:41](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/textures/TextureRegistry.ts#L41)

Register a pre-built texture. Useful for programmatically generated or
SVG-constructed textures. The caller retains ownership — `destroy()` will
not unload this texture.

#### Parameters

##### url

`string`

##### texture

`Texture`

#### Returns

`void`
