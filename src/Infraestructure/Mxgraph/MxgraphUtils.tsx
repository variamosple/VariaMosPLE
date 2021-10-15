import { mxGraph } from "mxgraph";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

export default class MxgraphUtils {

    static deleteSelection(graph: mxGraph, model: Model) {
        if (graph.isEnabled()) {
            let cells = graph.getSelectionCells();
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                if (cell.value) {
                    let uid = cell.value.getAttribute("uid");
                    if (uid) {
                        
                    }
                }
            }
            graph.removeCells(cells, true);
        }
    }

    static findVerticeById(graph, uid) {
        let vertices = graph.getChildVertices(graph.getDefaultParent());
        for (let i = 0; i < vertices.length; i++) {
            const vertice = vertices[i];
            let vuid = vertice.value.getAttribute("uid");
            if (vuid === uid) {
                return vertice;
            }
        }
        return null;
    }

    static findEdgeById(graph, uid) {
        let items = graph.getChildEdges(graph.getDefaultParent());
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let vuid = item.value.getAttribute("uid");
            if (vuid === uid) {
                return item;
            }
        }
        return null;
    }

}