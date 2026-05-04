interface CreateContainerOptions {
  id?: string;
  height?: string;
  width?: string;
  title?: string;
}

export const createContainer = ({
  id = 'canvas-example',
  height = '100vh',
  width,
  title,
}: CreateContainerOptions = {}): HTMLDivElement => {
  const container = document.createElement('div');
  container.id = id;
  if (width) {
    container.style.width = width;
  }
  container.style.height = height;
  container.style.overflow = 'hidden';
  // container.style.border = "1px solid #e8e8e8";

  if (title) {
    const titleElement = document.createElement('h3');
    titleElement.innerText = title;
    titleElement.style.textAlign = 'center';
    titleElement.style.borderBottom = '1px solid #e8e8e8';
    titleElement.style.margin = '0';
    titleElement.style.padding = '8px 0';
    titleElement.style.display = 'block';
    container.appendChild(titleElement);
  }

  return container;
};
