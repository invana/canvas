# Interface: BubbleSetsLayerState

Reserved. Set geometry is held as a private field, not in `Layer.state`,
because it's bulk geometry that's rebuilt wholesale on each recompute
rather than diffed.

## Properties

### \_placeholder?

> `readonly` `optional` **\_placeholder?**: `never`
