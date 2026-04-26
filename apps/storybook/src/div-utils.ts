export type CreateContainerOptions = {
  id?: string;
  height?: string;
  width?: string;
  title?: string;
};

export const createContainer = ({
  id = 'canvas-example',
  height = '100vh',
  width,
  title,
}: CreateContainerOptions = {}): HTMLElement => {
  const container = document.createElement('div');
  container.id = id;
  if (width) container.style.width = width;
  container.style.height = height;
  container.style.overflow = 'hidden';
  if (title) {
    const label = document.createElement('div');
    label.textContent = title;
    label.style.cssText =
      'position:absolute;top:8px;left:12px;z-index:10;font-size:12px;color:#aaa;pointer-events:none;';
    container.style.position = 'relative';
    container.appendChild(label);
  }
  return container;
};
