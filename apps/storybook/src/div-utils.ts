

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
    container.style.border = "2px solid #CCC";
    container.style.display = "flex";
    if (title) {
        const titleElement = document.createElement('h3');
        titleElement.innerText = title;
        titleElement.style.textAlign = 'center';
        titleElement.style.borderBottom = '1px solid #CCC';
        titleElement.style.margin = '0';
        titleElement.style.padding = '8px 0';
        titleElement.style.display = 'block';
        container.appendChild(titleElement);
    }
    return container;
};