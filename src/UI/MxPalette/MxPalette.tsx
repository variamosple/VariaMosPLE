import React, { Component } from "react";
import mx from "../MxGEditor/mxgraph";
// import { mxGraph, mxGraphModel } from "mxgraph";
import ProjectService from "../../Application/Project/ProjectService";

import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { mxStencil } from "mxgraph";
import * as alertify from "alertifyjs";
import { stringify } from "querystring";
import { join } from "path";
import MxgraphUtils from "../../Infraestructure/Mxgraph/MxgraphUtils";
import "./MxPalette.css"

interface Props {
  projectService: ProjectService;
}
interface State { }

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
    this.createPalette(e.model.type);
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

  createPalette(modelType: string) {
    this.props.projectService.getStyleDefinition(
      modelType,
      this.callbackGetStyle
    );
  }

  createVertex(type: any, element: any) {
    let doc = mx.mxUtils.createXmlDocument();
    let node = doc.createElement(type);
    node.setAttribute("type", type);
    let style = "shape=" + type;
    if (element.design) {
      if (element.design.includes("shape=")) {
        style = element.design;
      }
    }
    let vertex = new mx.mxCell(
      node,
      new mx.mxGeometry(0, 0, element.width, element.height),
      style
    );
    vertex.setConnectable(true);
    vertex.setVertex(true);
    vertex.setAttribute("type", type);
    vertex.setAttribute("label", type);
    return vertex;
  }

  addingVertex(graph: any, vertex: any, parentCell: any) {
    let me = this;
    if (!this.currentModel) {
      return;
    }

    let languageDefinition: any =
      me.props.projectService.getLanguageDefinition(
        "" + me.currentModel.type
      );

    let type = vertex.getAttribute("type");
    let instanceOfId = vertex.getAttribute("instanceOfId");
    let name = me.props.projectService.generateName(me.currentModel, type);

    let parentsAllowed = [null];
    if (languageDefinition.abstractSyntax.restrictions) {
      if (languageDefinition.abstractSyntax.restrictions.parent_child) {
        let pc = languageDefinition.abstractSyntax.restrictions.parent_child;
        for (let i = 0; i < pc.length; i++) {
          const rest = pc[i];
          if (rest.childElement == type) {
            parentsAllowed = rest.parentElement;
          }
        }
      }
    }

    let parentId = null;
    let parentType = null;
    if (parentCell) {
      if (parentCell.value) {
        parentId = parentCell.value.getAttribute("uid");
        parentType = parentCell.value.getAttribute("type");
      }
    }

    if (!parentsAllowed.includes(parentType)) {
      throw ("Child not allowed by the parent element.");
    } else {
      //todo: min max
    }

    let element: any;

    if (instanceOfId) {
      name = vertex.getAttribute("label") + " 1";
      let instanceOf = me.props.projectService.findModelElementByIdInProject(instanceOfId);
      element = me.props.projectService.duplicateObject(instanceOf);
      element.id = me.props.projectService.generateId();
      element.parentId = null;
      element.instanceOfId = instanceOfId;
    } else {
      let properties = [];
      element = new Element(name, type, properties, parentId);
    }

    //aqui se llamaría a la api de restricciones y  mostrar mensajes de error
    // o sino continuar

    const previuosModel = JSON.stringify(this.currentModel);
    element.x = vertex.geometry.x;
    element.y = vertex.geometry.y;
    element.width = vertex.geometry.width;
    element.height = vertex.geometry.height;
    const def = languageDefinition.abstractSyntax.elements[type];
    if (def.properties) {
      for (let i = 0; i < def.properties.length; i++) {
        const p = def.properties[i];
        const property = new Property(p.name, p.value, p.type, p.options, p.linked_property, p.linked_value, false, true, p.comment, p.possibleValues, p.possibleValuesLinks, p.minCardinality, p.maxCardinality, p.constraint);
        if (p.linked_property) {
          property.display = false;
        }
        if (p.possibleValues) {
          if (property.possibleValues.includes(",")) {
            let options = property.possibleValues.split(",");
            if (options.length > 0) {
              property.value = options[0];
            }
          }
        }
        element.properties.push(property);
      }
    }
 
    this.currentModel?.elements?.push(element);

    let callback = function (data: any) {
      if (data.data.state !== "DENIED") {
        vertex.setAttribute("uid", element.id);
        graph.getModel().beginUpdate();
        let newCells = graph.importCells([vertex], 0, 0, parentCell);
        newCells[0].setAttribute("uid", element.id);
        newCells[0].setAttribute("label", element.name);
        newCells[0].setAttribute("title", element.name);
        newCells[0].setAttribute("Name", element.name);
        for (let i = 0; i < element.properties.length; i++) {
          const p = element.properties[i];
          newCells[0].setAttribute(p.name, p.value);
        }


        graph.setSelectionCells(newCells);
        // let g = vertex.geometry;

        // var v2 = graph.insertVertex(newCells[0], null, "World!", 0, 0, 20, 20);
        // newCells[0].collapsed = false;
        graph.getModel().endUpdate();


        me.props.projectService.raiseEventCreatedElement(
          me.currentModel,
          element
        );


        me.props.projectService.raiseEventUpdatedElement(
          me.currentModel,
          element
        );

        me.props.projectService.raiseEventSelectedElement(
          me.currentModel,
          element
        );

        if (data.data.message !== ""){
          alertify.error("Validate: " + data.data.message);
        }
      }
      else {
        alertify.error("Validate: " + data.data.message);
        me.currentModel = Object.assign(
          me.currentModel,
          JSON.parse(previuosModel)
        );
        // me.currentModel = validateModelRestriction;
        // validateModelRestriction = me.currentModel;
        // graph.getModel().endUpdate();
      }
      me.props.projectService.saveProject();
    };

    this.props.projectService.applyRestrictions(callback, this.currentModel);
  }

  callbackGetStyle(languageDefinition: any): any {
    const me = this;
    let graph = this.props.projectService.getGraph();
    graph.multiplicities = [];

    let divToolbar: any = document.getElementById("graph_palette");
    //divToolbar.classList.add("list-inline");
    if (!divToolbar) {
      throw new Error("The element #portal wasn't found");
    }
    divToolbar.innerHTML = "";
    const toolbar = new mx.mxToolbar(divToolbar);

    let elementName: any = "";

    for (elementName in languageDefinition.abstractSyntax.elements) {
      const elementAbstract = languageDefinition.abstractSyntax.elements[elementName];
      if (elementAbstract.instance) {
        me.createElementInstanceInPalette(graph, languageDefinition, elementName, divToolbar, toolbar);
      } else {
        let elementConcrete = languageDefinition.concreteSyntax.elements[elementName];
        let vertexToClone = this.createVertex(elementName, elementConcrete);
        me.createElementInPalette(graph, languageDefinition, elementName, elementConcrete, vertexToClone, divToolbar, toolbar);
      }
    }

    let dic = [];
    if (languageDefinition.abstractSyntax.relationships) {
      for (elementName in languageDefinition.abstractSyntax.relationships) {
        const relationship = languageDefinition.abstractSyntax.relationships[elementName];
        if (!dic[relationship.source]) {
          dic[relationship.source] = [];
        }
        dic[relationship.source] = dic[relationship.source].concat(relationship.target);
      }
    }
    for (var key in dic) {
      let mul = new mx.mxMultiplicity(
        true,
        key,
        null,
        null,
        0,
        10000000,
        dic[key],
        "Only 1 target is allowed",
        "Only " + dic[key].join(', ') + " targets allowed",
        true
      );
      graph.multiplicities.push(mul);
    }

    // if (languageDefinition.abstractSyntax.relationships) {
    //   for (elementName in languageDefinition.abstractSyntax.relationships) {
    //     const relationship =
    //       languageDefinition.abstractSyntax.relationships[elementName];
    //     let mul = new mx.mxMultiplicity(
    //       true,
    //       relationship.source,
    //       null,
    //       null,
    //       relationship.min,
    //       relationship.max,
    //       relationship.target,
    //       "Only 1 target is allowed",
    //       "Only " + relationship.target.join(', ') + " targets allowed",
    //       true
    //     );
    //     graph.multiplicities.push(mul);
    //   }
    // }

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

  createElementInstanceInPalette(graph: any, languageDefinition: any, elementType: any, divToolbar: any, toolbar: any) {
    let me = this;
    const elementAbstract = languageDefinition.abstractSyntax.elements[elementType];
    let typeFolder = elementAbstract.instance.model.split(".")[0];
    let modelName = elementAbstract.instance.model.split(".")[1];
    let model = me.props.projectService.findModelByName(typeFolder, modelName, me.currentModel);
    if (model) {
      for (let i = 0; i < model.elements.length; i++) {
        const element = model.elements[i];
        if (element.type == elementType) {
          let elementConcrete = languageDefinition.concreteSyntax.elements[elementType];
          let vertexToClone = this.createVertex(elementType, elementConcrete);
          vertexToClone.setAttribute("label", element.name);
          vertexToClone.setAttribute("instanceOfId", element.id);
          elementConcrete.label = element.name;
          me.createElementInPalette(graph, languageDefinition, element.type, elementConcrete, vertexToClone, divToolbar, toolbar);
        }
      }
    }
  }

  createElementInPalette(graph: any, languageDefinition: any, type: any, element: any, vertexToClone: any, divToolbar: any, toolbar: any) {
    let me = this;
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
      "assets/images/models/" + languageDefinition.name + "/" + type + ".png";
    if (element.icon) {
      let contentType = "image/png";
      let blob = this.b64toBlob(element.icon, contentType);
      iconUrl = URL.createObjectURL(blob);
    }
    if (element.draw) {
      let shape = atob(element.draw);
      let ne: any = mx.mxUtils.parseXml(shape).documentElement;
      ne.setAttribute("name", type);
      MxgraphUtils.modifyShape(ne);
      let s: any = mx.mxStencil;
      s.allowEval = true;
      let stencil = new mx.mxStencil(ne);
      mx.mxStencilRegistry.addStencil(type, stencil);
    }
    divToolbar.appendChild(mdiv);
    let img = toolbar.addMode(element.label, iconUrl, drapAndDropCreation);
    // mspan.innerText = key;

    mx.mxUtils.makeDraggable(img, graph, drapAndDropCreation);

    let enter = document.createElement("br");
    enter.innerText = element.label;

    let label = document.createElement("label");
    label.innerText = element.label;


    mdiv.classList.add("pallete-div");
    mdiv.classList.add("csstooltip");
    mdiv.appendChild(img);
    mdiv.appendChild(mspan);
    mdiv.appendChild(enter);
    mdiv.appendChild(label);

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
          style={{ fontSize: 10 }}
          ref={this.containerRef}
          className="MxPaletteContainter"
          id="graph_palette"
        ></div>
      </div>
    );
  }
}
