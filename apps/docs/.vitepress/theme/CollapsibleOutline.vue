<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';

interface OutlineEntry {
  readonly id: string;
  readonly title: string;
  readonly level: number;
  readonly children: OutlineEntry[];
}

const route = useRoute();
const sections = ref<OutlineEntry[]>([]);
const expanded = ref<Set<string>>(new Set());
const activeId = ref<string>('');

let observer: IntersectionObserver | null = null;
let visibleHeadings = new Set<string>();

function rebuild(): void {
  // Read every h2 / h3 in the rendered doc content. The TypeDoc-generated
  // class pages have `## Methods`, `## Properties`, `## Accessors` at h2
  // and each member as h3 — exactly the depth we want collapsible.
  const main = document.querySelector('.vp-doc');
  if (!main) {
    sections.value = [];
    return;
  }
  const headings = Array.from(main.querySelectorAll<HTMLHeadingElement>('h2, h3'));
  const tree: OutlineEntry[] = [];
  let current: OutlineEntry | null = null;

  for (const h of headings) {
    const id = h.id;
    if (!id) continue;
    // Strip the trailing "#" anchor that the markdown renderer appends.
    const rawText = (h.textContent ?? '').trim();
    const title = rawText.replace(/​?#$/, '').trim();
    const level = h.tagName === 'H2' ? 2 : 3;

    if (level === 2) {
      current = { id, title, level, children: [] };
      tree.push(current);
    } else if (current) {
      current.children.push({ id, title, level, children: [] });
    }
  }

  sections.value = tree;
  // Default-expand every section the first time we build the tree for a
  // page. Subsequent toggles persist within the page.
  expanded.value = new Set(tree.map((s) => s.id));
  installScrollSpy();
}

function installScrollSpy(): void {
  // Tear down any previous observer (route change rebinds it).
  observer?.disconnect();
  visibleHeadings.clear();

  const main = document.querySelector('.vp-doc');
  if (!main) return;
  const headings = main.querySelectorAll<HTMLHeadingElement>('h2, h3');
  if (headings.length === 0) return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.id;
        if (!id) continue;
        if (entry.isIntersecting) {
          visibleHeadings.add(id);
        } else {
          visibleHeadings.delete(id);
        }
      }
      // Pick the topmost visible heading as the active one. Fall back to
      // the last heading scrolled past if none are currently in view.
      const ordered = Array.from(headings).map((h) => h.id);
      const firstVisible = ordered.find((id) => visibleHeadings.has(id));
      if (firstVisible) {
        activeId.value = firstVisible;
        // Auto-expand the parent section so the active method is visible
        // in the outline even if its section was collapsed.
        const parent = sections.value.find((s) =>
          s.id === firstVisible || s.children.some((c) => c.id === firstVisible),
        );
        if (parent && !expanded.value.has(parent.id)) {
          expanded.value = new Set([...expanded.value, parent.id]);
        }
      }
    },
    { rootMargin: '0px 0px -70% 0px', threshold: 0 },
  );

  for (const h of headings) observer.observe(h);
}

function toggle(id: string): void {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}

function isExpanded(id: string): boolean {
  return expanded.value.has(id);
}

function isActive(id: string): boolean {
  return activeId.value === id;
}

onMounted(() => {
  // Wait a tick so VitePress finishes rendering the markdown content.
  nextTick(() => rebuild());
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});

watch(
  () => route.path,
  () => {
    // Route change → wait for content swap, then rebuild from new headings.
    nextTick(() => setTimeout(rebuild, 30));
  },
);
</script>

<template>
  <nav
    v-if="sections.length"
    class="collapsible-outline"
    aria-labelledby="collapsible-outline-title"
  >
    <div id="collapsible-outline-title" class="outline-title">On this page</div>
    <ul class="outline-root">
      <li v-for="section in sections" :key="section.id" class="outline-section">
        <div class="outline-section-row">
          <button
            v-if="section.children.length"
            class="outline-toggle"
            :aria-expanded="isExpanded(section.id)"
            :aria-controls="`outline-children-${section.id}`"
            @click="toggle(section.id)"
          >
            <span class="caret" :class="{ open: isExpanded(section.id) }">▸</span>
          </button>
          <span v-else class="outline-toggle-spacer" />
          <a
            class="outline-link section-link"
            :class="{ active: isActive(section.id) }"
            :href="`#${section.id}`"
          >
            {{ section.title }}
          </a>
        </div>
        <ul
          v-if="section.children.length && isExpanded(section.id)"
          :id="`outline-children-${section.id}`"
          class="outline-children"
        >
          <li v-for="child in section.children" :key="child.id">
            <a
              class="outline-link child-link"
              :class="{ active: isActive(child.id) }"
              :href="`#${child.id}`"
            >
              {{ child.title }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.collapsible-outline {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
}

.outline-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.outline-root,
.outline-children {
  list-style: none;
  padding: 0;
  margin: 0;
}

.outline-section + .outline-section {
  margin-top: 2px;
}

.outline-section-row {
  display: flex;
  align-items: center;
  gap: 0;
}

.outline-toggle {
  width: 18px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: var(--vp-c-text-3);
  border-radius: 4px;
  flex-shrink: 0;
}

.outline-toggle:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}

.outline-toggle-spacer {
  width: 18px;
  height: 22px;
  display: inline-block;
  flex-shrink: 0;
}

.caret {
  display: inline-block;
  font-size: 10px;
  line-height: 1;
  transition: transform 120ms ease;
}

.caret.open {
  transform: rotate(90deg);
}

.outline-link {
  display: block;
  padding: 2px 6px;
  text-decoration: none;
  color: var(--vp-c-text-2);
  border-radius: 4px;
  transition: color 120ms ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.outline-link:hover {
  color: var(--vp-c-brand-1);
}

.outline-link.active {
  color: var(--vp-c-brand-1);
}

.section-link {
  font-weight: 600;
}

.child-link {
  font-weight: 400;
  font-size: 12.5px;
}

.outline-children {
  margin-left: 18px;
  padding-left: 8px;
  border-left: 1px solid var(--vp-c-divider);
  margin-top: 1px;
}

.outline-children > li {
  padding: 0;
}
</style>
