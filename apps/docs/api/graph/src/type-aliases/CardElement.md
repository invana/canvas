# Type Alias: CardElement

> **CardElement** = [`CardElementCommon`](../interfaces/CardElementCommon.md) & `object` \| [`CardElementCommon`](../interfaces/CardElementCommon.md) & `object` \| [`CardElementCommon`](../interfaces/CardElementCommon.md) & `object` \| [`CardElementCommon`](../interfaces/CardElementCommon.md) & `object` \| [`CardElementCommon`](../interfaces/CardElementCommon.md) & `object`

One absolutely-positioned element of a [FreeformStructure](../interfaces/FreeformStructure.md). Colours are
a **pair** — a `*Role` (themed) or a direct numeric field (fixed). `text`
elements bind their content to a dotted data path via `bind` (falling back to
the literal `text`). Order in `elements[]` is the **z-order** (later = on top).
