


export const generateRandomTree = (numNodes: number) => {
    const nodes = Array.from({ length: numNodes }, (_, i) => ({index: i}));
    const edges = Array.from({ length: numNodes - 1}, (_, i) => ({source: Math.floor(Math.sqrt(i)), target: i + 1}));    
    return { nodes, edges };
}