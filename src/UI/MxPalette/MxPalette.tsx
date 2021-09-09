import React, { Component } from "react";
import mx from "../MxGEditor/mxgraph";
// import { mxGraph, mxGraphModel } from "mxgraph";
import ProjectService from "../../Application/Project/ProjectService";

import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
import { mxStencil } from "mxgraph";

interface Props {
  projectService: ProjectService;
}
interface State {}

export default class MxPalette extends Component<Props, State> {
  containerRef: any;
  currentModel?: Model;

  constructor(props: Props) {
    super(props);
    this.containerRef = React.createRef();
    this.callbackGetStyle = this.callbackGetStyle.bind(this);
    this.projectService_addNewProductLineListener =
      this.projectService_addNewProductLineListener.bind(this);
    this.projectService_addSelectedModelListener =
      this.projectService_addSelectedModelListener.bind(this);
  }

  projectService_addNewProductLineListener(e: any) {
    this.forceUpdate();
  }

  projectService_addSelectedModelListener(e: any) {
    this.currentModel = e.model;
    this.createPalette(e.model.name);
    this.forceUpdate();
  }

  componentDidMount() {
    let me = this;
    me.props.projectService.addNewProductLineListener(
      this.projectService_addNewProductLineListener
    );
    me.props.projectService.addSelectedModelListener(
      this.projectService_addSelectedModelListener
    );
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
    node.setAttribute("type", type);
    let vertex = new mx.mxCell(
      node,
      new mx.mxGeometry(0, 0, element.width, element.height),
      "shape=" + element.type + ";" + element.design
    );
    vertex.setConnectable(true);
    vertex.setVertex(true);
    vertex.setAttribute("type", type);
    vertex.setAttribute("label", "hola");
    return vertex;
  }

  addingVertex(graph: any, vertex: any, cell: any) {
    if (!this.currentModel) {
      return;
    }
    // const me = this;
    let type = vertex.getAttribute("type");
    let name = type + " 1";

    //aqui se llamaría a la api de restricciones y  mostrar mensajes de error
    // o sino continuar

    let element: any = new Element(name, type);
    element.x = vertex.geometry.x;
    element.y = vertex.geometry.y;
    element.width = vertex.geometry.width;
    element.height = vertex.geometry.height;
    element.properties.push(new Property("Name", name)) ;
    this.currentModel?.elements?.push(element);

    graph.getModel().beginUpdate();
    let newCells = graph.importCells([vertex], 0, 0, cell);
    newCells[0].setAttribute("uid", element.id);
    newCells[0].setAttribute("label", element.name);
    newCells[0].setAttribute("title", element.name);
    newCells[0].setAttribute("name", element.name);
    graph.setSelectionCells(newCells);
    // let g = vertex.geometry;

    // var v2 = graph.insertVertex(newCells[0], null, "World!", 0, 0, 20, 20);
    // newCells[0].collapsed = false;
    graph.getModel().endUpdate();

    this.props.projectService.raiseEventSelectedElement(
      this.currentModel,
      element
    );
    this.props.projectService.saveProject();
  }

  callbackGetStyle(languageDefinition: any): any {
    const me = this;
    let graph = this.props.projectService.getGraph();
    graph.multiplicities = [];
    let divToolbar: any = document.getElementById("graph_palette");
    divToolbar.classList.add("list-inline");
    if (divToolbar) {
      divToolbar.innerHTML = "";
    }
    const toolbar = new mx.mxToolbar(divToolbar);

    let key: any = "";

    for (key in languageDefinition.concreteSyntax.elements) {
      const element = languageDefinition.concreteSyntax.elements[key];
      if (!element.label) {
        element.label = key;
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
      mdiv.classList.add("list-inline-item");
      let mspan: HTMLElement = document.createElement("span"); //tooltip
      mspan.classList.add("csstooltiptext2");
      let iconUrl =
        "assets/images/models/" + languageDefinition.name + "/" + key + ".png";
      if (element.icon) {
        let contentType = "image/png";
        let blob = this.b64toBlob(element.icon, contentType);
        iconUrl = URL.createObjectURL(blob);
      }
      if (element.draw) {
        let shape = atob(element.draw);
        let ne: any = mx.mxUtils.parseXml(shape).documentElement;
        ne.setAttribute("name", key);
        let stencil = new mx.mxStencil(ne);
        mx.mxStencilRegistry.addStencil(key, stencil);
      }
      let img = toolbar.addMode(element.label, iconUrl, drapAndDropCreation);
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

    if (languageDefinition.abstractSyntax.relationships) {
      for (key in languageDefinition.abstractSyntax.relationships) {
        const relationship =
          languageDefinition.abstractSyntax.relationships[key];
        let mul = new mx.mxMultiplicity(
          true,
          relationship.source,
          null,
          null,
          0,
          0,
          [relationship.target],
          "Only 1 target is allowed",
          "Only " + relationship.target + " targets allowed",
          true
        );
        graph.multiplicities.push(mul);
      }
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

  b64toBlob(b64Data, contentType = "", sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  render() {
    return (
      <div className="MxPalette">
        <div
          ref={this.containerRef}
          className="MxPalette"
          id="graph_palette"
        ></div>
      </div>
    );
  }
}
