# Variable: twitterActivityCardSettings

> `const` **twitterActivityCardSettings**: [`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

The same graph as [settings](twitterActivitySettings.md), drawn as **composite cards** — a tweet
card, a user id-card and a slimmer comment card, with hashtags and retweets
left as compact marks.

Everything here is still pure JSON: structures are slot skeletons, stylings
are theme roles, and each slot binds to a dotted data path. That's the whole
template stack, so this doubles as the fixture for the node-template editors.

Three things differ from the plain look, and all three follow from card size:

1. **The force layout is opened right up** — a 260×156 card needs an order of
   magnitude more room than a 7px dot, so charge, link distance and the
   collision radius all grow. Without that the cards stack into a pile.
2. **Colour-by-type is off.** The styling templates own colour now; leaving
   the behaviour on would repaint every card body with its type colour.
3. **Edges thin out** — at card scale the links are connective tissue, not the
   subject, so they lose their arrowheads' visual weight.
