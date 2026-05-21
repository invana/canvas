import type { CSSProperties, ReactElement } from 'react';

declare global {
  interface Window {
    __storyCleanups?: Array<() => void>;
  }
}

/**
 * Register a teardown callback for the current story. Storybook's `beforeEach`
 * (configured in `.storybook/preview.ts`) drains and invokes the queue before
 * the next story mounts, so each story can destroy its Canvas / GUI / etc.
 * without bleeding state across story switches.
 */
export const onStoryTeardown = (fn: () => void): void => {
  (window.__storyCleanups ??= []).push(fn);
};

interface CreateContainerOptions {
  id?: string;
  height?: string;
  width?: string;
  title?: string;
}

/**
 * Story container — returned as a React element so it works under the
 * react-vite Storybook framework. The semantics are unchanged from the
 * previous DOM-element factory:
 *
 *   - the returned element renders a `<div>` with the given `id`, fixed
 *     `height` (default `100vh`), optional `width` and `title`
 *   - story `play()` functions still query the container via
 *     `canvasElement.querySelector('#<id>')`
 *   - the DOM shape (a sized `<div>` with the id) is identical to the
 *     previous imperative implementation
 */
export function createContainer({
  id = 'canvas-example',
  height = '100vh',
  width,
  title,
}: CreateContainerOptions = {}): ReactElement {
  const style: CSSProperties = {
    height,
    overflow: 'hidden',
    ...(width ? { width } : {}),
  };

  const titleStyle: CSSProperties = {
    textAlign: 'center',
    borderBottom: '1px solid #e8e8e8',
    margin: 0,
    padding: '8px 0',
    display: 'block',
  };

  return (
    <div id={id} style={style}>
      {title ? <h3 style={titleStyle}>{title}</h3> : null}
    </div>
  );
}
