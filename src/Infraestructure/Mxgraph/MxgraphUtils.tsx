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

    static getSVG(graph: mxGraph) {
        const imageExport = new mx.mxImageExport();
        const svgCanvas = new mx.mxSvgCanvas2D(mx.mxUtils.createXmlDocument().createElement('svg'));
        imageExport.drawState(graph.getView().getState(graph.model.root), svgCanvas);
        imageExport.getLinkForCellState(graph.getView().getState(graph.model.root), svgCanvas);
        imageExport.drawCellState(graph.getView().getState(graph.model.root), svgCanvas);
        imageExport.drawShape(graph.getView().getState(graph.model.root), svgCanvas);
        imageExport.drawText(graph.getView().getState(graph.model.root), svgCanvas);
        imageExport.drawOverlays(graph.getView().getState(graph.model.root), svgCanvas);
        //imageExport.visitStatesRecursive(graph.getView().getState(graph.model.root), svgCanvas);
        let svgString = mx.mxUtils.getXml(svgCanvas.root as any);

        // Asegurarse de que el SVG tenga las dimensiones correctas
        const graphBounds = graph.getGraphBounds();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        svgElement.setAttribute('width', String(graphBounds.width));
        svgElement.setAttribute('height', String(graphBounds.height));
        svgElement.setAttribute('viewBox', `${graphBounds.x} ${graphBounds.y} ${graphBounds.width} ${graphBounds.height}`);
        svgElement.setAttribute('xmlns', "http://www.w3.org/2000/svg");
        svgElement.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");

        // Convertir el documento SVG de vuelta a string
        svgString = new XMLSerializer().serializeToString(svgDoc);
        return svgString;
    }

    static downloadSvgAsJpeg(svgText, filename) {
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        const url64 = 'data:image/svg+xml;base64,' + btoa(svgText);

        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const jpeg = canvas.toDataURL('image/jpeg');
            const a = document.createElement('a');
            a.href = jpeg;
            a.download = filename + '.jpeg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
        img.onerror = function (e) {
            let m = e;
        };
        img.src = url64;
    }

    static exportFile(graph: mxGraph, format: string) {
        try {
            let svg = this.getSVG(graph);
            let svgText = `<?xml version="1.0" encoding="utf-8"?>
            <!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
            <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
            ` + svg;
            this.downloadSvgAsJpeg(svgText, 'circle');
        } catch (error) {
            console.error('Error al descargar el SVG:', error);
        }
    }

    static exportFile5(graph: mxGraph, format: string) {
        try {
            const svgText = `<?xml version="1.0" encoding="utf-8"?>
            <!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
            <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
            <svg x="0px" y="0px" width="211px" height="94px" viewBox="29.5 19.5 211 94" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <defs xmlns="http://www.w3.org/2000/svg"/>
            <g xmlns="http://www.w3.org/2000/svg" fill="#774400" font-family="Arial,Helvetica" pointer-events="none" text-anchor="middle" font-size="11px">
            <text x="80" y="41">RootFeature 1</text>
            </g>
            <g xmlns="http://www.w3.org/2000/svg" fill="#774400" font-family="Arial,Helvetica" pointer-events="none" text-anchor="middle" font-size="11px">
            <text x="190" y="101">ConcreteFeature 1</text>
            </g>
            </svg>`;
            this.downloadSvgAsJpeg(svgText, 'circle');
        } catch (error) {
            console.error('Error al descargar el SVG:', error);
        }
    }

    static exportFile4(graph: mxGraph, format: string) {
        try {
            // Crear el SVG
            const imageExport = new mx.mxImageExport();
            const svgCanvas = new mx.mxSvgCanvas2D(mx.mxUtils.createXmlDocument().createElement('svg'));
            imageExport.drawState(graph.getView().getState(graph.model.root), svgCanvas);
            let svgString = mx.mxUtils.getXml(svgCanvas.root as any);

            // Asegurarse de que el SVG tenga las dimensiones correctas
            const graphBounds = graph.getGraphBounds();
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;
            svgElement.setAttribute('width', String(graphBounds.width));
            svgElement.setAttribute('height', String(graphBounds.height));
            svgElement.setAttribute('viewBox', `${graphBounds.x} ${graphBounds.y} ${graphBounds.width} ${graphBounds.height}`);

            // Convertir el documento SVG de vuelta a string
            svgString = new XMLSerializer().serializeToString(svgDoc);

            // Crear un Blob con el contenido SVG
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

            // Crear una URL para el Blob
            const svgUrl = URL.createObjectURL(svgBlob);

            // Crear un elemento <a> para descargar el archivo
            const downloadLink = document.createElement('a');
            downloadLink.href = svgUrl;
            downloadLink.download = "imagen.svg";

            // Añadir el enlace al documento y hacer clic en él
            document.body.appendChild(downloadLink);
            downloadLink.click();

            // Limpiar
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(svgUrl);

            console.log('SVG descargado con éxito');
        } catch (error) {
            console.error('Error al descargar el SVG:', error);
        }
    }

    static exportFile3(graph: mxGraph, format) {
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

        // Create a canvas to draw the image
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');

        // Set background color
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Convert the XML to a base64 image

        const xml2 = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + xml;


        var svg = new Blob([xml2], { type: 'image/svg+xml;charset=utf-8' });
        var url = URL.createObjectURL(svg);

        var img = new Image();
        img.onload = function () {
            ctx.drawImage(img, 0, 0);

            // Trigger the download
            var base64Image = canvas.toDataURL('image/' + format);
            var link = document.createElement('a');
            link.href = base64Image;
            link.download = 'export.' + format;
            link.click();

            // Clean up
            URL.revokeObjectURL(url);
        };

        img.onerror = function (e) {
            console.error("Image load error: ", e);
        };

        let svg2 = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1px" height="1px" version="1.1"><foreignObject pointer-events="all" width="1" height="1"><div xmlns="http://www.w3.org/1999/xhtml"></div></foreignObject></svg>';
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg2)));

        //img.src = url;
    }

    static exportFile2(graph: mxGraph, format) {
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

        var data = {
            filename: 'export.' + format,
            format: format,
            bg: bg,
            w: w,
            h: h,
            xml: encodeURIComponent(xml)
        };

        var form = document.createElement("form");
        form.setAttribute("method", "POST");
        form.setAttribute("action", "/Export");
        form.setAttribute("target", "_blank");

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var hiddenField = document.createElement("input");
                hiddenField.setAttribute("type", "hidden");
                hiddenField.setAttribute("name", key);
                hiddenField.setAttribute("value", data[key]);
                form.appendChild(hiddenField);
            }
        }

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
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
                    let propertyNames: any = this.splitToArray(child.attributes['propertyname'].value);
                    let format: any = "{0}";
                    if (child.attributes['format']) {
                        format = child.attributes['format'].value;
                    }
                    let linkedproperty: any = null;
                    if (child.attributes['linkedproperty']) {
                        linkedproperty = child.attributes['linkedproperty'].value;
                    }
                    let linkedvalue: any = null;
                    if (child.attributes['linkedvalue']) {
                        linkedvalue = child.attributes['linkedvalue'].value;
                    }
                    if (propertyNames.length == 1) {
                        child.innerHTML = `<![CDATA[ 
                            function(shape)
                            {
                                if(!shape){
                                    return;
                                }
                                if(!shape.state){
                                    return;
                                }
                                if(!shape.state.cell){
                                    return;
                                }
                                if(!shape.state.cell.value){
                                    return;
                                }
                                if(!shape.state.cell.value.attributes){
                                    return;
                                }
                                console.log(JSON.stringify(shape.state.cell.value.attributes));
                                if(shape.state.cell.value.attributes['` + propertyNames[0] + `']){
                                    return shape.state.cell.value.attributes['` + propertyNames[0] + `'].value;
                                } 
                            }
                            ]]>`;
                    } else if (propertyNames.length > 1) {
                        let label = `'` + format + `'`;
                        for (let i = 0; i < propertyNames.length; i++) {
                            label = this.replaceAll(label, '{' + i + '}', `' + shape.state.cell.value.attributes['` + propertyNames[i] + `'].value + '`);
                        }
                        let script = [];
                        script.push('');
                        if (linkedproperty) {
                            script.push(`if (shape.state.cell.value.attributes['` + linkedproperty + `'].value == '` + linkedvalue + `'){`);
                            script.push(`  return ` + label);
                            script.push('}');
                        } else {
                            script.push(`  return ` + label);
                        }
                        let str = script.join("\n");
                        child.innerHTML = `<![CDATA[ 
                            function(shape)
                            {
                               ` + str + `;
                            }
                            ]]>`;
                    }
                } else {
                    // child.innerHTML = ``;
                }
            }
        }
        return;
    }

    static splitToArray(value: String) {
        let array = value.split(",");
        for (let i = 0; i < array.length; i++) {
            array[i] = array[i].trim();
        }
        return array;
    }

    static replaceAll(string, search, replace) {
        return string.split(search).join(replace);
    }


    static GetSelectedElementsIds(graph: mxGraph, model: Model) {
        let ids = [];
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
        let ids = [];
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