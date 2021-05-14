import React, { Component } from "react";

import mx from "../MxGEditor/mxgraph";
import { mxGraph, mxGraphModel } from "mxgraph";
import ProjectService from "../../Infraestructure/project/ProjectService";
import { cMyProject, cModel,cElement, cProperty } from "../../Domain/ProjectManagement/Entities/ProjectModel";
import { setTimeout } from "node:timers";

interface Props {
  projectService: ProjectService;
}
interface State {
  loquesea:string
}

export default class MxPalette extends Component<Props, State> {
  state = {
    loquesea:"asdf",
    var2:2
  };
  containerRef: any;
  currentModel? : cModel ;

  constructor(props: Props) {
    super(props);
    this.containerRef = React.createRef();
    this.callbackGetStyle = this.callbackGetStyle.bind(this);

    this.button_onClick=this.button_onClick.bind(this);
  }

  button_onClick(e:any){  
     let msg= this.props.projectService.test();
     this.setState(
       {
        loquesea:msg
       }
     )
  }

  componentDidMount() {
    let me=this;
    window.setTimeout(function(){
      me.createPalette("FeaturesLanguage");
    }, 3000);
  }

  createPalette(modelName: string) {
    this.props.projectService.getStyleDefinition(
      modelName,
      this.callbackGetStyle
    );
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
    const me = this;
    let type = vertex.getAttribute("type");
    let name = type + " 1";
  
    let element=new cElement(name, type);
    this.currentModel?.elements?.push(element);
 
    graph.getModel().beginUpdate();
    let newCells = graph.importCells([vertex], 0, 0, cell);
    newCells[0].setAttribute("uid", element.id);
    newCells[0].setAttribute("label", element.name);
    newCells[0].setAttribute("title", element.name);
    newCells[0].setAttribute("name", element.name);
    graph.setSelectionCells(newCells);
    let g = vertex.geometry;
  
    // var v2 = graph.insertVertex(newCells[0], null, "World!", 0, 0, 20, 20);
    // newCells[0].collapsed = false;
    graph.getModel().endUpdate();
  }

  callbackGetStyle(languageDefinition: any): any {
    const me = this; 
    let graph = this.props.projectService.getGraph(); 
    if( me.props.projectService.project?.productLines){
      if( me.props.projectService.project?.productLines[0].domainEngineering?.models){
        me.currentModel=me.props.projectService.project?.productLines[0].domainEngineering?.models[0];
      }
    }

    let divToolbar: any = document.getElementById("graph_palette");
    if (divToolbar) {
      divToolbar.innerHTML = "";
    }
    const toolbar = new mx.mxToolbar(divToolbar);

    let key: any = "";

    for (key in languageDefinition.concreteSyntax.elements) {
      const element = languageDefinition.concreteSyntax.elements[key];
      if (!element.label) {
        element.label=key;
      }
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
      let url = "assets/images/models/" + languageDefinition.name + "/" + key + ".png";
      let img = toolbar.addMode(element.label, url, drapAndDropCreation);
      // mspan.innerText = key;

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
