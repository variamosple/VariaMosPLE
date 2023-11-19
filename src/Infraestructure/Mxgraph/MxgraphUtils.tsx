import mx from "./mxgraph";
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

    //This does a recursive descent to find the vertice with the given uid
    static findVerticeById(graph, uid, parentVertice) {
        if (!parentVertice) {
            parentVertice = graph.getDefaultParent();
        }
        let items = graph.getChildVertices(parentVertice);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let vuid = item.value.getAttribute("uid");
            if (vuid === uid) {
                return item;
            }
            let finded = this.findVerticeById(graph, uid, item)
            if (finded) {
                return finded;
            }
        }
        return null;
    }

    static findEdgeById(graph, uid, parentVertice) {
        if (!parentVertice) {
            parentVertice = graph.getDefaultParent();
        }
        let items = graph.getChildEdges(parentVertice);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let vuid = item.value.getAttribute("uid");
            if (vuid === uid) {
                return item;
            }
            let finded = this.findEdgeById(graph, uid, item)
            if (finded) {
                return finded;
            }
        }
        return null;
    }

    static exportFile(graph: mxGraph, format) {
        var bg = '#ffffff';
        var scale = 1;
        var b = 1;

        var imgExport = new mx.mxImageExport();
        var bounds = graph.getGraphBounds();
        var vs = graph.view.scale;

        // New image export
        var xmlDoc = mx.mxUtils.createXmlDocument();
        var root = xmlDoc.createElement('output');
        xmlDoc.appendChild(root);

        // Renders graph. Offset will be multiplied with state's scale when painting state.
        var xmlCanvas = new mx.mxXmlCanvas2D(root);
        xmlCanvas.translate(Math.floor((b / scale - bounds.x) / vs), Math.floor((b / scale - bounds.y) / vs));
        xmlCanvas.scale(scale / vs);

        imgExport.drawState(graph.getView().getState(graph.model.root), xmlCanvas);

        // Puts request data together
        var w = Math.ceil(bounds.width * scale / vs + 2 * b);
        var h = Math.ceil(bounds.height * scale / vs + 2 * b);

        var xml = mx.mxUtils.getXml(xmlDoc);

        if (bg != null) {
            bg = '&bg=' + bg;
        }

        var req = new mx.mxXmlRequest('/Export', 'filename=export.' + format + '&format=' + format + bg + '&w=' + w + '&h=' + h + '&xml=' + encodeURIComponent(xml), "POST", false, null, null).simulate(document, '_blank');
    }

    static modifyShape(ne: any) {
        let foreground = ne.children[1];
        for (let i = 0; i < foreground.children.length; i++) {
            const child = foreground.children[i];
            if (child.tagName == 'text') {
                if (child.attributes['dynamicproperties']) {
                    child.innerHTML = `<![CDATA[
                        function(shape)
                        {
                            try{
                                if(!shape.state.cell){
                                    return;
                                }
                                if(!shape.state.cell.value){
                                    return;
                                }
                                if(!shape.state.cell.value.attributes){
                                    return;
                                }
                                
                                let attributes=shape.state.cell.value.attributes; 
                                var keys = Object.keys(attributes);
                                console.log(keys); 
                                keys = Object.getOwnPropertyNames(attributes);
                                console.log(keys); 
                                
                                let strs=[];
                                for (let i=0; i<keys.length; i++) {
                                    let key=keys[i]; 
                                    if (!attributes.hasOwnProperty(key)) continue; 
                                    if (!isNaN(key)) continue; 
                                    if (['uid', 'label', 'Name', 'Selected', 'type', 'title'].includes(key)) continue; 
                                    let name=key; 
                                    let value=attributes[key].value;
                                    strs.push(name + ": " + value); 
                                }  
                                return strs.join('\\r\\n');
                            }
                            catch(e){
                                alert(JSON.stringify(e));
                            }
                        }
                    ]]>`; 
                } else if (child.attributes['propertyname']) {
                    let propertyName = child.attributes['propertyname'].value;
                    child.innerHTML = `<![CDATA[ 
                        function(shape)
                        {
                            return shape.state.cell.value.attributes['` + propertyName + `'].value;
                        }
                        ]]>`; 
                }else{
                   // child.innerHTML = ``;
                }
            }
        }
        return;
    }

    
    static GetSelectedElementsIds(graph: mxGraph, model: Model) {
        let ids=[];
        if (graph.isEnabled()) {
            let cells = graph.getSelectionCells();
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                if (cell.value) {
                    let uid = cell.value.getAttribute("uid");
                    if (uid) {
                        ids.push(uid);
                    }
                }
            } 
        }
        return ids;
    }

    static GetSelectedRelationshipsIds(graph: mxGraph, model: Model) {
        let ids=[];
        if (graph.isEnabled()) {
            let cells = graph.getSelectionCells();
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                if (cell.value) {
                    let uid = cell.value.getAttribute("uid");
                    if (uid) {
                        ids.push(uid);
                    }
                }
            } 
        }
        return ids;
    }

}