

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