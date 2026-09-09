# Function: bubbleSetsLayerOptionsToForm()

> **bubbleSetsLayerOptionsToForm**(`o?`): [`BubbleSetsLayerFields`](../interfaces/BubbleSetsLayerFields.md)

Map a `BubbleSetsLayerOptions`-shaped patch to the flat
[BubbleSetsLayerFields](../interfaces/BubbleSetsLayerFields.md). The nested BubbleSetStyle group is
flattened to `style`-prefixed scalars, with colour `0xRRGGBB` numbers
normalised to `#rrggbb` strings.

## Parameters

### o?

[`BubbleSetsLayerOptions`](../interfaces/BubbleSetsLayerOptions.md) = `{}`

## Returns

[`BubbleSetsLayerFields`](../interfaces/BubbleSetsLayerFields.md)
