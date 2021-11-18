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

    static findVerticeById(graph, uid, parentVertice) {
        if (!parentVertice) {
            parentVertice=graph.getDefaultParent();
        }
        let items = graph.getChildVertices(parentVertice);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let vuid = item.value.getAttribute("uid");
            if (vuid === uid) {
                return item;
            }
            let finded=this.findVerticeById(graph, uid, item)
            if (finded) {
                return finded;
            }
        }
        return null;
    }

    static findEdgeById(graph, uid, parentVertice) {
        if (!parentVertice) {
            parentVertice=graph.getDefaultParent();
        }
        let items = graph.getChildEdges(parentVertice);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let vuid = item.value.getAttribute("uid");
            if (vuid === uid) {
                return item;
            }
            let finded=this.findEdgeById(graph, uid, item)
            if (finded) {
                return finded;
            }
        }
        return null;
    }

}