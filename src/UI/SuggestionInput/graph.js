export default class Graph {
    constructor() {
        this.adjList = new Map();
    }

    addVertex(v) {
        this.adjList.set(v, []);
    }

    addEdge(v, w) {
        this.adjList.get(v).push(w);
    }

    findAllPaths(startNode) {
        const visited = new Set();
        const paths = [];
        
        const dfs = (currentNode, path) => {
            visited.add(currentNode);
            path.push(currentNode);
            
            const neighbors = this.adjList.get(currentNode);
            if (neighbors.length === 0) {
                paths.push([...path]); // Si no hay vecinos, esta es una ruta completa
            } else {
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        dfs(neighbor, [...path]);
                    }
                }
            }
            
            path.pop(); // Retroceder para explorar otras posibilidades
            visited.delete(currentNode);
        };

        dfs(startNode, []);

        return paths;
    }

    findInitialNodes() {
        const initialNodes = [];
        for (const [vertex, edges] of this.adjList.entries()) {
            let isInitial = true;
            for (const [, toVertex] of this.adjList) {
                if (toVertex.includes(vertex)) {
                    isInitial = false;
                    break;
                }
            }
            if (isInitial) {
                initialNodes.push(vertex);
            }
        }
        return initialNodes;
    }

    findFinalNodes() {
        const finalNodes = [];
        const vertices = Array.from(this.adjList.keys());
        for (const vertex of vertices) {
            let isFinal = true;
            for (const [, edges] of this.adjList) {
                if (edges.includes(vertex)) {
                    isFinal = false;
                    break;
                }
            }
            if (isFinal) {
                finalNodes.push(vertex);
            }
        }
        return finalNodes;
    }

    findNextNodes(v) {
        let ret=this.adjList.get(v);
        return ret;
    }
} 