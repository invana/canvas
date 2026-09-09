# Variable: twitterActivitySettings

> `const` **twitterActivitySettings**: [`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

Recommended look for the **Twitter activity** graph.

Five node types (`User` · `Tweet` · `Comment` · `Hashtag` · `Retweet`) and eight
edge types, so this is one of the few datasets where colour-by-type earns its
keep — it's left **on**, and the palette does the categorising with no per-node
wiring. Edges get arrowheads because direction is meaningful here (who posted
what, who replied to whom).
