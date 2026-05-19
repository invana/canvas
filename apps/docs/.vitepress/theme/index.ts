import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import CollapsibleOutline from './CollapsibleOutline.vue';
import './custom.css';

/**
 * Extend VitePress's default theme with a collapsible right-side outline.
 *
 * VitePress's built-in outline is a flat list with no expand/collapse on
 * top-level sections. For long TypeDoc class pages (Methods / Properties /
 * Accessors all under one route), a collapsible outline lets the reader
 * focus on one section at a time.
 *
 * Strategy:
 *   1. Inject `<CollapsibleOutline />` into the `aside-outline-before` slot.
 *   2. Hide the built-in outline via `custom.css` so the two don't stack.
 *
 * The custom outline reads h2 / h3 headings from `.vp-doc` after mount,
 * tracks scroll position with `IntersectionObserver` for scroll-spy, and
 * persists expand state per page within the session.
 */
export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'aside-outline-before': () => h(CollapsibleOutline),
    }),
};
