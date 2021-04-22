import React, { Component } from "react";

import mx from "../MxGEditor/mxgraph";
import { mxGraph, mxGraphModel } from "mxgraph";
import ProjectService from "../../Infraestructure/project/ProjectService";

interface Props {
    projectService: ProjectService
 }
interface State { }

export default class MxPalette extends Component<Props, State> {
    state = {};
    containerRef:any;

    constructor(props: Props) {
        super(props);
        this.containerRef=React.createRef();
    }

    componentDidMount() {
        this.createPalette("statesLanguage");
    }

    createPalette(modelName: String) {
        const me = this;
        let graph=this.props.projectService.getGraph();
        let divToolbar: any = document.getElementById("graph_palette");
        if (divToolbar) {
            divToolbar.innerHTML = "";
        }
        const toolbar = new mx.mxToolbar(divToolbar);

        const style = this.props.projectService.getStyleDefinition("FeaturesLanguage") ;
        let key: any = "";

        for (key in style.elements) {
            const element = style.elements[key];
            let vertexToClone = this.createVertex(key, element);
            let drapAndDropCreation = function (graph: any, evt: any, cell: any) {
                try { 
                    graph.stopEditing(false);
                    let pt = graph.getPointForEvent(evt);
                    let vertex = graph.getModel().cloneCell(vertexToClone);
                    vertex.geometry.x = pt.x;
                    vertex.geometry.y = pt.y;
                    me.addingVertex(graph, vertex, cell);
                } catch (error) {
                    alert(error);
                }
            };

            let mdiv = document.createElement("div");
            let mspan: HTMLElement = document.createElement("span"); //tooltip
            mspan.classList.add("csstooltiptext2"); 
            let url="assets/images/models/" + modelName + "/" + key +  ".png"; 
            let img = toolbar.addMode("Label", url, drapAndDropCreation); 
            mspan.innerText = key; 

            mx.mxUtils.makeDraggable(img, graph, drapAndDropCreation);

            mdiv.classList.add("pallete-div");
            mdiv.classList.add("csstooltip");
            mdiv.appendChild(img);
            mdiv.appendChild(mspan);
            if (!divToolbar) {
                throw new Error("The element #portal wasn't found");
            }
            divToolbar.appendChild(mdiv);
        }
        // for (const key in language.relationships) {
        //     const relationship = language.relationships[key];
        //     this.graph.multiplicities.push(
        //         new mxMultiplicity(
        //             true,
        //             relationship.parent,
        //             null,
        //             null,
        //             0,
        //             1,
        //             [relationship.child],
        //             "Only 1 target is allowed",
        //             "Only " + relationship.child + " targets allowed"
        //         )
        //     );
        // }
    }

    createVertex(type: any, element: any) {
        let doc = mx.mxUtils.createXmlDocument();
        let node = doc.createElement(type);
        let vertex = new mx.mxCell(
            node,
            new mx.mxGeometry(0, 0, element.width, element.height),
            element.design
        );
        vertex.setConnectable(true);
        vertex.setVertex(true);
        vertex.setAttribute("type", type);
        vertex.setAttribute("label", "hola");
        return vertex;
    }

    addingVertex(graph: any, vertex: any, cell: any) {
        graph.getModel().beginUpdate();
        let newCells = graph.importCells([vertex], 0, 0, cell);
        newCells.children = null;
        graph.setSelectionCells(newCells);
        let type = vertex.getAttribute("type");
        let name = type + "1";
        let g = vertex.geometry;
        //   this.currentModel.addChild(
        //     new Element(type, name, g.x, g.y, g.width, g.height)
        //   );

        // var v2 = graph.insertVertex(newCells[0], null, "World!", 0, 0, 20, 20);
        // newCells[0].collapsed = false;
        graph.getModel().endUpdate();
    }

    render() {
        return (
            <div className="MxPalette">
                <div ref={this.containerRef} className="MxPalette" id="graph_palette">
                    MxPalette
                </div>
            </div>
        );
    }
}