

export const getFullHeightContainer = () => {
    const container = document.createElement('div');
    container.style.width = '100vw';
    container.style.height = '100vh';
    return container;
}

export type CreateContainerOptions = {
    id?: string;
    height?: string;
    width?: string;
    title?: string;
};

export const createContainer = ({
    id = "canvas-example",
    height = "100vh",
    width,
    title
}: CreateContainerOptions = {}) => {
    const container = document.createElement('div');
    container.id = id;
    if (width){
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

/**
 * Create a canvas section with header and container
 * Useful for creating side-by-side canvas comparisons
 */
export const createCanvasSection = (
    parentContainer: HTMLElement,
    id: string,
    title: string,
    description: string
) => {
    const section = document.createElement('div');
    section.style.backgroundColor = "white";
    section.style.borderRadius = "8px";
    section.style.overflow = "hidden";
    section.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
    section.style.display = "flex";
    section.style.flexDirection = "column";

    const header = document.createElement('div');
    header.style.padding = "12px 16px";
    header.style.borderBottom = "1px solid #e8e8e8";
    header.style.backgroundColor = "#fafafa";

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.margin = "0 0 4px 0";
    titleEl.style.fontSize = "16px";
    titleEl.style.fontWeight = "600";

    const descEl = document.createElement('p');
    descEl.textContent = description;
    descEl.style.margin = "0";
    descEl.style.fontSize = "12px";
    descEl.style.color = "#666";

    header.appendChild(titleEl);
    header.appendChild(descEl);

    const canvasContainer = createContainer({ height: "100%", id, title: "" });
    canvasContainer.style.flex = "1";

    section.appendChild(header);
    section.appendChild(canvasContainer);
    parentContainer.appendChild(section);
    return canvasContainer
};

export type DescriptionPanelOptions = {
    text: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    fontSize?: string;
    borderRadius?: string;
    border?: string;
    maxWidth?: string;
    maxHeight?: string;
    zIndex?: number;
    opacity?: number;
};

/**
 * Creates a styled description panel overlay for stories.
 * Avoids bloating story code with inline HTML styling.
 * 
 * @example
 * const desc = createDescriptionPanel({
 *   text: 'Click on nodes to select them',
 *   position: 'top-right',
 *   backgroundColor: 'rgba(0, 0, 0, 0.8)',
 *   textColor: '#fff'
 * });
 * container.appendChild(desc);
 */
export const createDescriptionPanel = ({
    text,
    position = 'top-right',
    top,
    right,
    bottom,
    left,
    backgroundColor = 'rgba(0, 0, 0, 0.85)',
    textColor = '#ffffff',
    padding = '12px 16px',
    fontSize = '13px',
    borderRadius = '6px',
    border = 'none',
    maxWidth = '320px',
    maxHeight,
    zIndex = 1000,
    opacity = 0.95,
}: DescriptionPanelOptions): HTMLElement => {
    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.backgroundColor = backgroundColor;
    panel.style.color = textColor;
    panel.style.padding = padding;
    panel.style.fontSize = fontSize;
    panel.style.borderRadius = borderRadius;
    panel.style.border = border;
    panel.style.maxWidth = maxWidth;
    panel.style.zIndex = String(zIndex);
    panel.style.opacity = String(opacity);
    panel.style.lineHeight = '1.4';
    panel.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    panel.innerHTML = text;

    if (maxHeight) {
        panel.style.maxHeight = maxHeight;
        panel.style.overflowY = 'auto';
    }

    // Apply explicit position values if provided
    if (top !== undefined) panel.style.top = top;
    if (right !== undefined) panel.style.right = right;
    if (bottom !== undefined) panel.style.bottom = bottom;
    if (left !== undefined) panel.style.left = left;

    // Apply preset positions if no explicit values given
    if (!top && !right && !bottom && !left) {
        const positions: Record<string, { top: string; right: string; bottom: string; left: string }> = {
            'top-left': { top: '10px', right: 'auto', bottom: 'auto', left: '10px' },
            'top-right': { top: '10px', right: '10px', bottom: 'auto', left: 'auto' },
            'bottom-left': { top: 'auto', right: 'auto', bottom: '10px', left: '10px' },
            'bottom-right': { top: 'auto', right: '10px', bottom: '10px', left: 'auto' },
            'top-center': { top: '10px', right: 'auto', bottom: 'auto', left: '50%', transform: 'translateX(-50%)' },
            'bottom-center': { top: 'auto', right: 'auto', bottom: '10px', left: '50%', transform: 'translateX(-50%)' },
        };

        const pos = positions[position];
        if (pos) {
            panel.style.top = pos.top;
            panel.style.right = pos.right;
            panel.style.bottom = pos.bottom;
            panel.style.left = pos.left;
            if ((pos as any).transform) {
                panel.style.transform = (pos as any).transform;
            }
        }
    }

    return panel;
};