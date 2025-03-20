import React, { Component } from "react";
import "./MxGEditor.css";

import { VariaMosGraph } from "../VariaMosGraph/VariaMosGraph";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
import { Point } from "../../Domain/ProductLineEngineering/Entities/Point";
import VxgraphUtils from "../../Infraestructure/Vxgraph/VxgraphUtils";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Dropdown from 'react-bootstrap/Dropdown';
// import {Element}   from "../../Domain/ProductLineEngineering/Entities/Element";
import MxProperties from "../MxProperties/MxProperties";
import * as alertify from "alertifyjs";
import { RiSave3Fill } from "react-icons/ri";
import { FaRegFolderOpen } from "react-icons/fa6";
import { ImZoomIn } from "react-icons/im";
import { ImZoomOut } from "react-icons/im";
import { BsFillPencilFill } from "react-icons/bs";
import { FaBolt } from "react-icons/fa";
import { IoMdAlert } from "react-icons/io";
import { BsFillClipboardFill } from "react-icons/bs";
import GeometryPoint from "../VariaMosGraph/logic/entities/geometryPoint";
import vxImage from "../VariaMosGraph/vxImage";
import vxCellOverlay from "../VariaMosGraph/vxCellOverlay";
import vxStencil from "../VariaMosGraph/vxStencil";

interface Props {
  projectService: ProjectService;
}
interface State {
  showConstraintModal: boolean;
  currentModelConstraints: string;
  showContextMenuElement: boolean;
  contextMenuX: number;
  contextMenuY: number;
  showPropertiesModal: boolean;
  showMessageModal: boolean;
  selectedObject: any;
  messageModalContent: string;
  messageModalTitle: string;
}

export default class VxGEditor extends Component<Props, State> {
  //state = {};
  containerRef: any;
  graphContainerRef: any;
  graph?: VariaMosGraph;
  currentModel?: Model;
  variaMosGraphRef: any;

  constructor(props: Props) {
    super(props);
    this.containerRef = React.createRef();
    this.graphContainerRef = React.createRef();
    this.state = {
      showPropertiesModal: false,
      showMessageModal: false,
      showConstraintModal: false,
      currentModelConstraints: "",
      showContextMenuElement: false,
      contextMenuX: 0,
      contextMenuY: 0,
      selectedObject: null,
      messageModalContent: null,
      messageModalTitle: null
    }
    this.projectService_addNewProductLineListener = this.projectService_addNewProductLineListener.bind(this);
    this.projectService_addSelectedModelListener = this.projectService_addSelectedModelListener.bind(this);
    this.projectService_addCreatedElementListener = this.projectService_addCreatedElementListener.bind(this);
    this.projectService_addUpdatedElementListener = this.projectService_addUpdatedElementListener.bind(this);
    this.projectService_addUpdateProjectListener = this.projectService_addUpdateProjectListener.bind(this);
    //handle constraints modal
    this.showConstraintModal = this.showConstraintModal.bind(this);
    this.hideConstraintModal = this.hideConstraintModal.bind(this);
    this.saveConstraints = this.saveConstraints.bind(this);
    //handle properties modal
    this.showPropertiesModal = this.showPropertiesModal.bind(this);
    this.hidePropertiesModal = this.hidePropertiesModal.bind(this);
    this.savePropertiesModal = this.savePropertiesModal.bind(this);
    this.hideMessageModal = this.hideMessageModal.bind(this);

    this.variaMosGraphRef = React.createRef();
  }

  projectService_addNewProductLineListener(e: any) {
    this.forceUpdate();
  }

  projectService_addSelectedModelListener(e: any) {
    this.loadModel(e.model);
    this.forceUpdate();
  }

  projectService_addCreatedElementListener(e: any) {
    let me = this;
    let vertice = VxgraphUtils.findVerticeById(this.graph, e.element.id, null);
    if (vertice) {
      me.setState({
        selectedObject: e.element
      })
      let fun = function () {
        me.setState({
          selectedObject: e.element,
          showPropertiesModal: true
        })
      }
      setTimeout(fun, 500);
    } else {
      let edge = VxgraphUtils.findEdgeById(this.graph, e.element.id, null);
      if (edge) {
        // this.refreshEdgeLabel(edge);
        // this.refreshEdgeStyle(edge);
      }
    }
  }

  projectService_addUpdatedElementListener(e: any) {
    try {
      let vertice = VxgraphUtils.findVerticeById(this.graph, e.element.id, null);
      if (vertice) {
        this.refreshVertexLabel(vertice);
        this.createOverlays(e.element, vertice);
      } else {
        let edge = VxgraphUtils.findEdgeById(this.graph, e.element.id, null);
        if (edge) {
          this.refreshEdgeLabel(edge);
          this.refreshEdgeStyle(edge);
          let relationship = this.props.projectService.findModelRelationshipById(this.currentModel, edge.value["uid"]);
          if (relationship) {
            this.createRelationshipOverlays(relationship, edge);
          }
        }
      }
      this.graph.refresh();
    } catch (error) {
      let m = error;
    }
  }

  projectService_addUpdateProjectListener(e: any) {
    let me = this;
    let model = me.props.projectService.findModelById(e.project, e.modelSelectedId);
    me.loadModel(model);
    me.forceUpdate();
  }

  componentDidMount() {
    let me = this;
    this.graph = this.variaMosGraphRef.current;
    this.props.projectService.setGraph(this.graph);
    this.LoadGraph(this.graph);
    me.props.projectService.addNewProductLineListener(
      this.projectService_addNewProductLineListener
    );
    me.props.projectService.addSelectedModelListener(
      this.projectService_addSelectedModelListener
    );
    me.props.projectService.addCreatedElementListener(
      this.projectService_addCreatedElementListener
    );
    me.props.projectService.addUpdatedElementListener(
      this.projectService_addUpdatedElementListener
    );
    me.props.projectService.addUpdateProjectListener(
      this.projectService_addUpdateProjectListener
    );
  }

  LoadGraph(graph: VariaMosGraph) {
    let me = this; 

    graph.disableContextMenu(); 
    graph.setGridSize(5);
    graph.setPanning(true);
    graph.setTooltips(true);
    graph.setConnectable(true);
    graph.setEnabled(true);
    graph.setEdgeLabelsMovable(false);
    graph.setVertexLabelsMovable(false);
    graph.setGridEnabled(true);
    graph.setAllowDanglingEdges(false);
    graph.setAllowLoops(true);

    // Allows dropping cells into new lanes and
    // lanes into new pools, but disallows dropping
    // cells on edges to split edges
    graph.setDropEnabled(true);
    graph.setSplitEnabled(false);

    graph.setHtmlLabels(true); 

    graph.convertValueToString = function (cell) {
      try {
        if (cell.value) {
          if (cell.value.attributes) {
            return cell.value["label"] || "";
          } else {
            return cell.value;
          }
        }
        else if (cell.attributes) {
          return cell.value["label"] || "";
        } else {
          return "";
        }
      } catch (error) {
        return "";
      }
    };
    graph.addListener(vxEvent.CELLS_MOVED, function (sender, evt) {
      if (evt.properties.cells) {
        for (const c of evt.properties.cells) {
          console.log(c)
          if (c.getGeometry().x < 0 || c.getGeometry().y < 0) {
            c.getGeometry().x -= evt.properties.dx;
            c.getGeometry().y -= evt.properties.dy;
            alert("Out of bounds, position reset");
          }
        }
      }
      evt.consume();
      if (evt.properties.cells) {
        let cell = evt.properties.cells[0];
        if (!cell.value.attributes) {
          return;
        }
        let uid = cell.value["uid"];
        if (me.currentModel) {
          for (let i = 0; i < me.currentModel.elements.length; i++) {
            const element: any = me.currentModel.elements[i];
            if (element.id === uid) {
              element.x = cell.geometry.x;
              element.y = cell.geometry.y;
              element.width = cell.geometry.width;
              element.height = cell.geometry.height;
            }
          }
        }
      }
    });

    graph.addListener(vxEvent.CELLS_ADDED, function (sender, evt) {
      try {
        //evt.consume(); 
        if (evt.properties.cells) {
          let parentId = null;
          if (evt.properties.parent) {
            if (evt.properties.parent.value) {
              parentId = evt.properties.parent.value["uid"];
            }
          }
          for (let i = 0; i < evt.properties.cells.length; i++) {
            const cell = evt.properties.cells[i];
            if (!cell.value.attributes) {
              return;
            }
            let uid = cell.value["uid"];
            if (uid) {
              let element = me.props.projectService.findModelElementById(me.currentModel, uid);
              if (element) {
                element.parentId = parentId;
                element.x = cell.geometry.x;
                element.y = cell.geometry.y;
                element.width = cell.geometry.width;
                element.height = cell.geometry.height;
              }
            }
          }
        }
      } catch (error) {
        me.processException(error);
      }
    });


    graph.addListener(vxEvent.CELLS_RESIZED, function (sender, evt) {
      evt.consume();
      if (evt.properties.cells) {
        let cell = evt.properties.cells[0];
        if (!cell.value.attributes) {
          return;
        }
        let uid = cell.value["uid"];
        if (me.currentModel) {
          for (let i = 0; i < me.currentModel.elements.length; i++) {
            const element: any = me.currentModel.elements[i];
            if (element.id === uid) {
              element.x = cell.geometry.x;
              element.y = cell.geometry.y;
              element.width = cell.geometry.width;
              element.height = cell.geometry.height;
            }
          }
        }
      }
    });

    graph.addListener(vxEvent.SELECT, function (sender, evt) {
      evt.consume();
    });

    graph.addListener(vxEvent.DOUBLE_CLICK, function (sender, evt) {
      evt.consume();
      if (me.state.selectedObject) {
        me.showPropertiesModal();
      }
    });

    graph.addListener(vxEvent.CLICK, function (sender, evt) {
      try {
        evt.consume();
        if (!me.currentModel) {
          return;
        }
        if (evt.properties.cell) {
          let cell = evt.properties.cell;
          if (cell.value.attributes) {
            let uid = cell.value["uid"];
            for (let i = 0; i < me.currentModel.elements.length; i++) {
              const element: any = me.currentModel.elements[i];
              if (element.id === uid) {
                me.props.projectService.raiseEventSelectedElement(
                  me.currentModel,
                  element
                );
                me.setState({
                  selectedObject: element
                });
              }
            }
            for (let i = 0; i < me.currentModel.relationships.length; i++) {
              const relationship: any = me.currentModel.relationships[i];
              if (relationship.id === uid) {
                me.props.projectService.raiseEventSelectedElement(
                  me.currentModel,
                  relationship
                );
                me.setState({
                  selectedObject: relationship
                });
              }
            }
          }
        }
        else {
          if (evt.properties.event.button != 2) {
            me.graph.clearSelection();
          }
        }
        if (evt.properties.event.button == 2) {
          me.showContexMenu(evt.properties.event);
        } else {
          me.hideContexMenu();
        }
      } catch (error) { }
    });



    graph.addListener(vxEvent.CELL_CONNECTED, function (sender, evt) {
      try {
        evt.consume();
        let edge = evt.getProperty("edge");
        let source = edge.source;
        let target = edge.target;
        let name = source.value["label"] + "_" + target.value["label"];
        let relationshipType = null; //  source.value.tagName + "_" + target.value.tagName;

        let languageDefinition: any =
          me.props.projectService.getLanguageDefinition(
            "" + me.currentModel.type
          );

        if (languageDefinition.abstractSyntax.relationships) {
          for (let key in languageDefinition.abstractSyntax.relationships) {
            const rel = languageDefinition.abstractSyntax.relationships[key];
            if (rel.source == source.value.tagName) {
              for (let t = 0; t < rel.target.length; t++) {
                if (rel.target[t] == target.value.tagName) {
                  relationshipType = key;
                  break;
                }
              }
            }
            if (relationshipType) {
              break;
            }
          }
        }

        if (!edge.value) {
          const rel = languageDefinition.abstractSyntax.relationships[relationshipType];

          let value = {
            nodeType: "relationship",
            label: name
          }

          edge.value = value;
          let points = [];
          let properties = [];
          if (rel.properties) {
            for (let i = 0; i < rel.properties.length; i++) {
              const p = rel.properties[i];
              const property = new Property(p.name, p.value, p.type, p.options, p.linked_property, p.linked_value, false, true, p.comment, p.possibleValues, p.possibleValuesLinks, p.minCardinality, p.maxCardinality, p.constraint, p.defaultValue);
              if (p.defaultValue == "") {
                property.value = p.defaultValue;
              } else if (p.defaultValue) {
                property.value = p.defaultValue;
              }
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
              properties.push(property);
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          let relationship = me.props.projectService.createRelationship(
            me.currentModel,
            name,
            relationshipType,
            source.value["uid"],
            target.value["uid"],
            points,
            rel.min,
            rel.max,
            properties
          );

          value["uid"] = relationship.id;

          edge.style = "strokeColor=#446E79;strokeWidth=2;"; //este es el estilo como se pinta la flecha
        }
        me.refreshEdgeLabel(edge);
        me.refreshEdgeStyle(edge);
        let relationship = me.props.projectService.findModelRelationshipById(me.currentModel, edge.value["uid"]);
        if (relationship) {
          me.createRelationshipOverlays(relationship, edge);
        }
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let m = error;
        console.error("something went wrong: ", error)
      }
    });

    // graph.connectionHandler.addListener(vxEvent.CONNECT, function(sender, evt)
    // {
    //   var edge = evt.getProperty('cell');
    //   var source = graph.getModel().getTerminal(edge, true);
    //   var target = graph.getModel().getTerminal(edge, false);
    // });

    graph.addListener(vxEvent.REMOVE_CELLS, function (sender, evt) {
      try {
        evt.consume();
      } catch (error) {
        alert(error);
      }
    });

    graph.addListener(vxEvent.LABEL_CHANGED, function (sender, evt) {
      let t = 0;
      let name = evt.properties.value;
      evt.properties.value = evt.properties.old;
      evt.properties.cell.value = evt.properties.old;
      evt.consume();

      let cell = evt.properties.cell;
      let uid = cell.value["uid"];
      if (me.currentModel) {
        const element: any = me.props.projectService.findModelElementById(me.currentModel, uid);
        if (element) {
          element.name = name;
          me.props.projectService.raiseEventUpdatedElement(
            me.currentModel,
            element
          );
        } else {
          const relationship: any = me.props.projectService.findModelRelationshipById(me.currentModel, uid);
          if (relationship) {
            relationship.name = name;
            me.props.projectService.raiseEventUpdatedElement(
              me.currentModel,
              relationship
            );
          }
        }
      }
    });

    graph.addListener(vxEvent.CHANGE, function (sender, evt) {
      try {
        evt.consume();
        var changes = evt.getProperty('edit').changes;
        for (var i = 0; i < changes.length; i++) {
          if (changes[i].constructor.name == "mxTerminalChange") {
            // DO SOMETHING
          }
        }
      } catch (error) {
        alert(error);
      }
    });

    graph.addKeyListener(function (sender, evt) {
      switch (evt.keyCode) {
        case 46:
          me.deleteSelection();
          break;
        case 8:
          me.deleteSelection();
          break;
      }
    });

    let gmodel = graph.model;
    gmodel.addListener(vxEvent.CHANGE, function (sender, evt) {
      me.graphModel_onChange(sender, evt);
    });


    graph.getView().setAllowEval(true);
  }

  deleteSelection() {
    let me = this;
    if (!window.confirm("do you really want to delete the items?")) {
      return;
    }
    let graph = this.graph;
    if (graph.isEnabled()) {
      let cells = graph.getSelectionCells();
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cell) {
          let uid = cell.value["uid"];
          if (uid) {
            if (cell.edge) {
              me.props.projectService.removeModelRelationshipById(me.currentModel, uid);
            } else {
              me.props.projectService.removeModelElementById(me.currentModel, uid);
            }
          }
        }
      }
      graph.removeCells(cells, true);
    }
    //VxgraphUtils.deleteSelection(this.graph, this.currentModel);
  }

  refreshEdgeStyle(edge: any) {
    let me = this;
    let languageDefinition: any =
      me.props.projectService.getLanguageDefinition(
        "" + me.currentModel.type
      );
    let relationship = me.props.projectService.findModelRelationshipById(me.currentModel, edge.value["uid"]);
    if (languageDefinition.concreteSyntax.relationships) {
      if (languageDefinition.concreteSyntax.relationships[relationship.type]) {
        //styles
        if (languageDefinition.concreteSyntax.relationships[relationship.type].styles) {
          for (let i = 0; i < languageDefinition.concreteSyntax.relationships[relationship.type].styles.length; i++) {
            const styleDef = languageDefinition.concreteSyntax.relationships[relationship.type].styles[i];
            if (!styleDef.linked_property) {
              edge.style = styleDef.style;
            } else {
              for (let p = 0; p < relationship.properties.length; p++) {
                const property = relationship.properties[p];
                if (property.name == styleDef.linked_property && property.value == styleDef.linked_value) {
                  edge.style = styleDef.style;
                  i = languageDefinition.concreteSyntax.relationships[relationship.type].styles.length;
                  break;
                }
              }
            }
          }
        }

        //labels  
        if (edge.children) {
          for (let index = edge.children.length - 1; index >= 0; index--) {
            let child = edge.getChildAt(index);
            child.setVisible(false);
            //child.removeFromParent(); //no funciona, sigue mostrandolo en pantalla
          }
        }
        if (languageDefinition.concreteSyntax.relationships[relationship.type].labels) {
          for (let i = 0; i < languageDefinition.concreteSyntax.relationships[relationship.type].labels.length; i++) {
            const def = languageDefinition.concreteSyntax.relationships[relationship.type].labels[i];
            let style = ''; // 'fontSize=16;fontColor=#000000;fillColor=#ffffff;strokeColor=#69b630;rounded=1;arcSize=25;strokeWidth=3;';
            if (def.style) {
              style = def.style;
            }
            let labels = [];
            if (def.label_fixed) {
              labels.push("" + def.label_fixed);
            } else if (def.label_property) {
              let ls = [];
              if (Array.isArray(def.label_property)) {
                ls = def.label_property;
              } else {
                ls = [def.label_property];
              }
              for (let p = 0; p < relationship.properties.length; p++) {
                const property = relationship.properties[p];
                if (ls.includes(property.name)) {
                  if (property.value) {
                    labels.push("" + property.value);
                  } else {
                    labels.push("");
                  }
                }
              }
            }
            if (labels.length > 0) {
              let separator = ", "
              if (def.label_separator) {
                separator = def.label_separator;
              }
              let label = labels.join(separator);
              let x = 0;
              let y = 0;
              let offx = 0;
              if (def.offset_x) {
                offx = (def.offset_x / 100);
              }
              let offy = 0;
              if (def.offset_y) {
                offy = def.offset_y
              }
              switch (def.align) {
                case "left":
                  x = -1 + offx;
                  break;
                case "right":
                  x = +1 + offx;
                  break;
              }
              if (def.offset_x) {
                offx = def.offset_x
              }
              if (def.offset_y) {
                offy = def.offset_y
              }
              var e21 = this.graph.insertVertex(edge, null, label, x, y, 1, 1, style, true);
              e21.setConnectable(false);
              this.graph.updateCellSize(e21);
              // Adds padding (labelPadding not working...)
              e21.geometry.width += 2;
              e21.geometry.height += 2;

              offx = 0;
              e21.geometry.offset = new GeometryPoint(offx, offy); //offsetx aqui no funciona correctamente cuando la dirección se invierte
            }
          }
        }
      }
    }
  }

  refreshEdgeLabel(edge: any) {
    let me = this;
    let languageDefinition: any =
      me.props.projectService.getLanguageDefinition(
        "" + me.currentModel.type
      );
    let label_property = null;
    let relationship = me.props.projectService.findModelRelationshipById(me.currentModel, edge.value["uid"]);
    if (languageDefinition.concreteSyntax.relationships) {
      if (languageDefinition.concreteSyntax.relationships[relationship.type]) {
        if (languageDefinition.concreteSyntax.relationships[relationship.type].label_fixed) {
          edge.value.setAttribute("label", languageDefinition.concreteSyntax.relationships[relationship.type].label_fixed);
          return;
        }
        else if (languageDefinition.concreteSyntax.relationships[relationship.type].label_property) {
          label_property = languageDefinition.concreteSyntax.relationships[relationship.type].label_property;
          for (let p = 0; p < relationship.properties.length; p++) {
            const property = relationship.properties[p];
            if (property.name == label_property) {
              edge.value.setAttribute("label", property.value);
              return;
            }
          }
        }
      }
    }
    if (!label_property) {
      edge.value.setAttribute("label", relationship.name);
    } else {
      edge.value.setAttribute("label", "");
    }
  }

  refreshVertexLabel(vertice: any) {
    let me = this;
    let languageDefinition: any =
      me.props.projectService.getLanguageDefinition(
        "" + me.currentModel.type
      );
    let label_property = null;
    let uid = vertice.value["uid"];
    let element = me.props.projectService.findModelElementById(me.currentModel, uid);
    if (!element) {
      return;
    }

    vertice.value.setAttribute("Name", element.name);
    for (let i = 0; i < element.properties.length; i++) {
      const p = element.properties[i];
      vertice.value.setAttribute(p.name, p.value);
    }

    if (languageDefinition.concreteSyntax.elements) {
      if (languageDefinition.concreteSyntax.elements[element.type]) {
        if (languageDefinition.concreteSyntax.elements[element.type].label_fixed) {
          vertice.value.setAttribute("label", languageDefinition.concreteSyntax.elements[element.type].label_fixed);
          return;
        }
        else if (languageDefinition.concreteSyntax.elements[element.type].label_property) {
          label_property = languageDefinition.concreteSyntax.elements[element.type].label_property;
          for (let p = 0; p < element.properties.length; p++) {
            const property = element.properties[p];
            if (property.name == languageDefinition.concreteSyntax.elements[element.type].label_property) {
              vertice.value.setAttribute("label", property.value);
              return;
            }
          }
        }
      }
    }
    if (!label_property) {
      vertice.value.setAttribute("label", element.name);
    } else {
      vertice.value.setAttribute("label", "");
    }


  }

  pushIfNotExist(array: any, value: any) {
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (item == value) {
        return;
      }
    }
    array.push(value);
  }

  graphModel_onChange(sender, evt) {
    let me = this;
    try {
      evt.consume();
      var changes = evt.getProperty('edit').changes;
      for (var i = 0; i < changes.length; i++) {
        let change = changes[i];
        if (change.constructor.name == "mxGeometryChange") {
          if (change.cell) {
            let cell = change.cell;
            if (!cell.value.attributes) {
              return;
            }
            let uid = cell.value["uid"];
            const relationship: Relationship = me.props.projectService.findModelRelationshipById(me.currentModel, uid);
            if (!relationship) {
              return;
            }
            relationship.points = [];
            if (change.geometry.points) {
              for (let i = 0; i < change.geometry.points.length; i++) {
                const p = cell.geometry.points[i];
                relationship.points.push(new Point(p.x, p.y))
              }
            }
          }
        }
      }
    } catch (error) {
      me.processException(error);
    }
  }

  loadModel(model: Model) {
    setTimeout(() => {
      let me = this;
      this.currentModel = model;
      if (!model) {
        this.setState({
          currentModelConstraints: null
        })
      } else {
        this.setState({
          currentModelConstraints: model.constraints
        });
        if (model.inconsistent) {
          this.showMessageModal("Inconsistent model", model.consistencyError);
        }
      }
      this.setState({
        showContextMenuElement: false
      });

      let graph: VariaMosGraph | undefined = this.graph;
      if (graph) {
        graph.getModel().beginUpdate();
        try {
          graph.removeCells(graph.getChildVertices(graph.getDefaultParent()));
          if (model) {
            let languageDefinition: any = this.props.projectService.getLanguageDefinition("" + model.type);
            let orden = [];
            for (let i = 0; i < model.elements.length; i++) {
              let element: any = model.elements[i];
              if (element.parentId) {
                this.pushIfNotExist(orden, element.parentId);
              }
              this.pushIfNotExist(orden, element.id);
            }

            let vertices = [];

            let shapeDraws = [];
            let stencils = [];

            for (let i = 0; i < orden.length; i++) {
              console.log(i);
              let element: any = this.props.projectService.findModelElementById(model, orden[i]);

              let shape = null;
              if (languageDefinition.concreteSyntax.elements[element.type].styles) {
                let styles = languageDefinition.concreteSyntax.elements[element.type].styles;
                for (let s = 0; s < styles.length; s++) {
                  const styleDef = styles[s];
                  if (!styleDef.linked_property) {
                    shape = atob(styleDef.style);
                  } else {
                    for (let p = 0; p < element.properties.length; p++) {
                      const property = element.properties[p];
                      if (property.name == styleDef.linked_property && '' + property.value == styleDef.linked_value) {
                        shape = atob(styleDef.style);
                        s = styles.length;
                        break;
                      }
                    }
                  }
                }
              }
              else if (languageDefinition.concreteSyntax.elements[element.type].draw) {
                if (shapeDraws[element.type]) {
                  shape = shapeDraws[element.type];
                } else {
                  shape = atob(
                    languageDefinition.concreteSyntax.elements[element.type].draw
                  );
                  shapeDraws[element.type] = shape;
                }
              }

              if (shape) {
                if (!stencils[element.type]) { 
                  VxgraphUtils.modifyShape(element.type, shape);
                  let stencil = new vxStencil(element.type, shape);
                  graph.addStencil(element.type, stencil);
                  stencils[element.type] = true;
                }
              }

              let parent = graph.getDefaultParent();
              if (element.parentId) {
                parent = vertices[element.parentId];
              }

              var value = {
                "uid": element.id,
                "label": element.name,
                "Name": element.name,
                "type": element.type,
              }        
 
              for (let i = 0; i < element.properties.length; i++) {
                const p = element.properties[i];
                value[p.name]= p.value;
              }
              let fontcolor = "";
              if (shape) {
                let color = this.getFontColorFromShape(shape);
                if (color) {
                  fontcolor = "fontColor=" + color + ";"
                }
              }
              let design = languageDefinition.concreteSyntax.elements[element.type].design;
              let styleShape = "shape=" + element.type + ";whiteSpace=wrap;" + fontcolor + design;
              let resizable = languageDefinition.concreteSyntax.elements[element.type].resizable;
              if ("" + resizable == "false") {
                styleShape += ";resizable=0;";
              }
              styleShape += fontcolor + design;
              var vertex = graph.insertVertex(
                parent,
                null,
                value,
                element.x,
                element.y,
                element.width,
                element.height,
                styleShape
              );
              this.refreshVertexLabel(vertex);
              this.createOverlays(element, vertex);
              vertices[element.id] = vertex;
            }

            let parent = graph.getDefaultParent();

            for (let i = 0; i < model.relationships.length; i++) {
              const relationship: Relationship = model.relationships[i];
              let source = VxgraphUtils.findVerticeById(graph, relationship.sourceId, null);
              let target = VxgraphUtils.findVerticeById(graph, relationship.targetId, null); 
              let value = {
                "noteType": "relationship",
                "uid": relationship.id,
                "label": relationship.name,
                "type": relationship.type
              }
              var cell = this.graph?.insertEdge(parent, null, value, source, target, 'strokeColor=#69b630;strokeWidth=3;endArrow=block;endSize=8;edgeStyle=elbowEdgeStyle;');
              cell.geometry.points = [];
              if (relationship.points) {
                for (let k = 0; k < relationship.points.length; k++) {
                  const p = relationship.points[k];
                  cell.geometry.points.push(new GeometryPoint(p.x, p.y));
                }
              }
              this.createRelationshipOverlays(relationship, cell);
            }
          }
        } finally {
          graph.getModel().endUpdate();
        }
      }
    }, 250);
  }

  getFontColorFromShape(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const shapeElement = xmlDoc.querySelector("shape");
    const aspectValue = shapeElement ? shapeElement.getAttribute("fontcolor") : null;
    return aspectValue;
  }

  //sacar esto en una libreria

  createRelationshipOverlays(relationship: any, cell: any) {
    this.graph.removeCellOverlays(cell);
    this.createRelationshipSelectionOverlay(relationship, cell);
  }

  createRelationshipSelectionOverlay(relationship: any, cell: any) {
    let me = this;
    for (let i = 0; i < relationship.properties.length; i++) {
      const property = relationship.properties[i];
      if (property.name == "Selected") {
        let icon = 'images/models/' + property.value + '.png'
        let overlayFrame = new vxCellOverlay(new vxImage(icon, 24, 24), 'Overlay tooltip');
        overlayFrame.align = vxConstants.ALIGN_RIGHT;
        overlayFrame.verticalAlign = vxConstants.ALIGN_TOP;
        overlayFrame.offset = new GeometryPoint(0, 0);

        overlayFrame.addListener(vxEvent.CLICK, function (sender, evt) {
          try {
            evt.consume();
            let parentCell = evt.properties.cell;
            let uid = parentCell.value.attributes.uid.value;
            let relationship = me.props.projectService.findModelRelationshipById(me.currentModel, uid);
            for (let i = 0; i < relationship.properties.length; i++) {
              const property = relationship.properties[i];
              if (property.name == "Selected") {
                switch (property.value) {
                  case "Selected": property.value = "Unselected"; break;
                  case "Unselected": property.value = "Undefined"; break;
                  case "Undefined": property.value = "Selected"; break;
                  default: property.value = "Unselected"; break;
                }
              }
            }
            me.createRelationshipOverlays(relationship, parentCell);
          } catch (error) { }
        });

        this.graph.addCellOverlay(cell, overlayFrame);
        this.graph.refresh();
      }
    }
  }


  createOverlays(element: any, cell: any) {
    this.graph.removeCellOverlays(cell);
    this.createSelectionOverlay(element, cell);
    this.createCustomOverlays(element, cell);
  }

  createSelectionOverlay(element: any, cell: any) {
    let me = this;
    for (let i = 0; i < element.properties.length; i++) {
      const property = element.properties[i];
      if (property.name == "Selected") {
        let icon = 'images/models/' + property.value + '.png'
        let overlayFrame = new vxCellOverlay(new vxImage(icon, 24, 24), 'Overlay tooltip');
        overlayFrame.align = vxConstants.ALIGN_RIGHT;
        overlayFrame.verticalAlign = vxConstants.ALIGN_TOP;
        overlayFrame.offset = new GeometryPoint(0, 0);

        overlayFrame.addListener(vxEvent.CLICK, function (sender, evt) {
          try {
            evt.consume();
            let parentCell = evt.properties.cell;
            let uid = parentCell.value.attributes.uid.value;
            let element = me.props.projectService.findModelElementById(me.currentModel, uid);
            for (let i = 0; i < element.properties.length; i++) {
              const property = element.properties[i];
              if (property.name == "Selected") {
                switch (property.value) {
                  case "Selected": property.value = "Unselected"; break;
                  case "Unselected": property.value = "Undefined"; break;
                  case "Undefined": property.value = "Selected"; break;
                  default: property.value = "Unselected"; break;
                }
              }
            }
            me.createOverlays(element, parentCell);
          } catch (error) { }
        });

        this.graph.addCellOverlay(cell, overlayFrame);
        this.graph.refresh();
      }
    }
  }

  createCustomOverlays(element: any, cell: any) {
    let me = this;
    let languageDefinition: any =
      me.props.projectService.getLanguageDefinition(
        "" + me.currentModel.type
      );

    if (languageDefinition.concreteSyntax.elements) {
      if (languageDefinition.concreteSyntax.elements[element.type]) {
        if (languageDefinition.concreteSyntax.elements[element.type].overlays) {
          let overs = [];
          for (let i = 0; i < languageDefinition.concreteSyntax.elements[element.type].overlays.length; i++) {
            let overlayDef = languageDefinition.concreteSyntax.elements[element.type].overlays[i];
            if (!overlayDef.linked_property) {
              overs[overlayDef.align] = overlayDef;
            }
          }
          for (let i = 0; i < languageDefinition.concreteSyntax.elements[element.type].overlays.length; i++) {
            let overlayDef = languageDefinition.concreteSyntax.elements[element.type].overlays[i];
            if (overlayDef.linked_property) {
              for (let p = 0; p < element.properties.length; p++) {
                const property = element.properties[p];
                if (property.name == overlayDef.linked_property && property.value == overlayDef.linked_value) {
                  overs[overlayDef.align] = overlayDef;
                }
              }
            }
          }
          for (let key in overs) {
            let overlayDef = overs[key];
            this.createCustomOverlay(cell, overlayDef.icon, overlayDef.align, overlayDef.width, overlayDef.height, overlayDef.offset_x, overlayDef.offset_y);
          }
        }
      }
    }
  }

  createCustomOverlay(cell: any, base64Icon: any, align: any, width: any, height: any, offset_x: any, offset_y: any) {
    let me = this;
    let url = "data:image/png;base64," + base64Icon;
    //let icon=this.DecodeImage(base64Icon);
    //icon=icon.substring(5);
    //icon='images/models/Undefined.png';
    if (!width) {
      width = 24;
    }
    if (!height) {
      height = 24;
    }
    let overlayFrame = new vxCellOverlay(new vxImage(url, width, height), 'Overlay tooltip');
    overlayFrame.verticalAlign = vxConstants.ALIGN_BOTTOM;
    overlayFrame.align = vxConstants.ALIGN_LEFT;
    switch (align) {
      case "top-left":
        overlayFrame.verticalAlign = vxConstants.ALIGN_TOP;
        overlayFrame.align = vxConstants.ALIGN_LEFT;
        break;
      case "top-right":
        overlayFrame.verticalAlign = vxConstants.ALIGN_TOP;
        overlayFrame.align = vxConstants.ALIGN_RIGHT;
        break;
      case "bottom-left":
        overlayFrame.verticalAlign = vxConstants.ALIGN_BOTTOM;
        overlayFrame.align = vxConstants.ALIGN_LEFT;
        break;
      case "bottom-right":
        overlayFrame.verticalAlign = vxConstants.ALIGN_BOTTOM;
        overlayFrame.align = vxConstants.ALIGN_RIGHT;
        break;
      case "middle":
        overlayFrame.verticalAlign = vxConstants.ALIGN_MIDDLE;
        overlayFrame.align = vxConstants.ALIGN_CENTER;
        break;
      case "middle-left":
        overlayFrame.verticalAlign = vxConstants.ALIGN_MIDDLE;
        overlayFrame.align = vxConstants.ALIGN_LEFT;
        break;
      case "middle-right":
        overlayFrame.verticalAlign = vxConstants.ALIGN_MIDDLE;
        overlayFrame.align = vxConstants.ALIGN_RIGHT;
        break;
      case "middle-top":
        overlayFrame.verticalAlign = vxConstants.ALIGN_TOP;
        overlayFrame.align = vxConstants.ALIGN_CENTER;
        break;
      case "middle-bottom":
        overlayFrame.verticalAlign = vxConstants.ALIGN_BOTTOM;
        overlayFrame.align = vxConstants.ALIGN_CENTER;
        break;



    }
    let offx = 0;
    let offy = 0;
    if (offset_x) {
      offx = offset_x;
    }
    if (offset_y) {
      offy = offset_y;
    }
    overlayFrame.offset = new GeometryPoint(offx, offy);
    this.graph.addCellOverlay(cell, overlayFrame);
    this.graph.refresh();
  }

  DecodeImage(imageBase64: any) {
    let contentType = "image/png";
    let blob = this.b64toBlob(imageBase64, contentType);
    let iconUrl = URL.createObjectURL(blob);
    return iconUrl;
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

  test() {
    return "hello world...";
  }

  zoomIn() {
    this.graph.zoomIn();
  }

  zoomOut() {
    this.graph.zoomOut();
  }

  saveConfiguration() {
    this.props.projectService.raiseEventRequestSaveConfigurationListener(this.props.projectService.project, this.currentModel.id);
  }

  openConfiguration() {
    this.props.projectService.raiseEventRequestOpenConfigurationListener(this.props.projectService.project, this.currentModel.id);
  }

  resetConfiguration() {
    this.props.projectService.resetConfiguration(this.currentModel);
  }

  checkConsistency() {
    this.props.projectService.checkConsistency(this.currentModel);
  }

  copyModelConfiguration() {
    this.props.projectService.copyModelConfiguration(this.currentModel);
  }

  drawCoreFeatureTree() {
    this.props.projectService.drawCoreFeatureTree();
  }

  downloadImage() {
    // VxgraphUtils.exportFile(this.graph, "png");
  }

  processException(ex) {
    alert(JSON.stringify(ex));
  }

  btnZoomIn_onClick(e) {
    try {
      this.zoomIn();
    } catch (ex) {
      this.processException(ex);
    }
  }

  btnZoomOut_onClick(e) {
    try {
      this.zoomOut();
    } catch (ex) {
      this.processException(ex);
    }
  }

  btnDownloadImage_onClick(e) {
    try {
      this.downloadImage();
    } catch (ex) {
      this.processException(ex);
    }
  }

  btnSaveConfiguration_onClick(e) {
    try {
      this.saveConfiguration();
    } catch (ex) {
      this.processException(ex);
    }
  }

  btnOpenConfiguration_onClick(e) {
    try {
      this.openConfiguration();
    } catch (ex) {
      this.processException(ex);
    }
  }

  btnResetConfiguration_onClick(e) {
    try {
      if (window.confirm("Do you really want to reset the configuration?")) {
        this.resetConfiguration();
      }
    } catch (ex) {
      this.processException(ex);
    }
  }

  btnCheckConsistency_onClick(e) {
    try {
      this.checkConsistency();
    } catch (ex) {
      this.processException(ex);
    }
  }

  btnCopyModelConfiguration_onClick(e) {
    try {
      this.copyModelConfiguration();
    } catch (ex) {
      this.processException(ex);
    }
  }

  btnDrawCoreFeatureTree_onClick(e) {
    try {
      this.drawCoreFeatureTree();
    } catch (ex) {
      this.processException(ex);
    }
  }

  contexMenuElement_onClick(e) {
    try {
      e.preventDefault();
      this.setState({ showContextMenuElement: false });
      let command = e.target.attributes['data-command'].value;
      switch (command) {
        case "Delete":
          this.deleteSelection();
          break;
        case "Properties":
          this.showPropertiesModal();
          break;
        default:
          this.callExternalFuntion(command);
          break;
      }
    } catch (ex) {
      this.processException(ex);
    }
  }

  callExternalFuntion(index: number): void {
    let selectedElementsIds = VxgraphUtils.GetSelectedElementsIds(this.graph, this.currentModel);
    let selectedRelationshipsIds = VxgraphUtils.GetSelectedRelationshipsIds(this.graph, this.currentModel);
    this.callExternalFuntionFromIndex(index, selectedElementsIds, selectedRelationshipsIds);
  }

  callExternalFuntionFromIndex(index: number, selectedElementsIds: any, selectedRelationshipsIds: any): void {
    let efunction = this.props.projectService.externalFunctions[index];
    let query = null;
    this.props.projectService.callExternalFuntion(efunction, query, selectedElementsIds, selectedRelationshipsIds);
  }

  showConstraintModal() {
    if (this.currentModel) {
      if (this.currentModel.constraints !== "") {
        this.setState({ currentModelConstraints: this.currentModel.constraints })
      }
      this.setState({ showConstraintModal: true })
    } else {
      alertify.error("You have not opened a model")
    }
  }

  hideConstraintModal() {
    this.setState({ showConstraintModal: false })
  }

  saveConstraints() {
    if (this.currentModel) {
      // TODO: Everything we are doing with respect to
      // the model management is an anti pattern
      this.currentModel.constraints = this.state.currentModelConstraints;
    }
    //this.hideConstraintModal();
  }

  showPropertiesModal() {
    // if (this.currentModel) {
    //   if (this.currentModel.constraints !== "") {
    //     this.setState({ currentModelConstraints: this.currentModel.constraints })
    //   }
    //   this.setState({ showConstraintModal: true })
    // } else {
    //   alertify.error("You have not opened a model")
    // }
    this.setState({ showPropertiesModal: true });
  }

  hidePropertiesModal() {
    this.setState({ showPropertiesModal: false });
    // for (let i = 0; i < this.props.projectService.externalFunctions.length; i++) {
    //   const efunction = this.props.projectService.externalFunctions[i];
    //   if (efunction.id == 510 || efunction.id == 511) { //todo: validar por el campo call_on_properties_changed
    //     let selectedElementsIds = [this.state.selectedObject.id];
    //     this.callExternalFuntionFromIndex(i, selectedElementsIds, null);
    //   }
    // }
  }

  savePropertiesModal() {
    // if (this.currentModel) {
    //   // TODO: Everything we are doing with respect to
    //   // the model management is an anti pattern
    //   this.currentModel.constraints = this.state.currentModelConstraints;
    // }
    // //this.hideConstraintModal();
  }

  showMessageModal(title, message) {
    this.setState({
      showMessageModal: true,
      messageModalTitle: title,
      messageModalContent: message
    });
  }

  hideMessageModal() {
    this.setState({ showMessageModal: false });
  }

  showContexMenu(e) {
    let mx = e.clientX;
    let my = e.clientY;
    this.setState({ showContextMenuElement: true, contextMenuX: mx, contextMenuY: my });
  }

  hideContexMenu() {
    this.setState({ showContextMenuElement: false });
  }

  renderContexMenu() {
    if (!this.graph || !this.currentModel) {
      return;
    }

    let items = [];

    let selectedElementsIds = VxgraphUtils.GetSelectedElementsIds(this.graph, this.currentModel);
    let selectedRelationshipsIds = VxgraphUtils.GetSelectedRelationshipsIds(this.graph, this.currentModel);

    if (selectedElementsIds.length > 0 || selectedRelationshipsIds.length > 0) {
      items.push(<Dropdown.Item href="#" onClick={this.contexMenuElement_onClick.bind(this)} data-command="Delete">Delete</Dropdown.Item>);
      items.push(<Dropdown.Item href="#" onClick={this.contexMenuElement_onClick.bind(this)} data-command="Properties">Properties</Dropdown.Item>);
    }

    if (this.props.projectService.externalFunctions) {
      for (let i = 0; i < this.props.projectService.externalFunctions.length; i++) {
        const externalFunction = this.props.projectService.externalFunctions[i];
        items.push(<Dropdown.Item href="#" onClick={this.contexMenuElement_onClick.bind(this)} data-command={i}>{externalFunction.label}</Dropdown.Item>);
      }
    }

    let left = this.state.contextMenuX + "px";
    let top = this.state.contextMenuY + "px";

    return (
      <Dropdown.Menu
        show={this.state.showContextMenuElement}
        style={{ left: left, top: top }}>
        {items}
      </Dropdown.Menu>
    );
  }

  render() {
    return (
      <div ref={this.containerRef} className="MxGEditor">
        <div className="header">
          <a title="Edit properties" onClick={this.showPropertiesModal}><span><BsFillPencilFill /></span></a>{" "}
          <a title="Zoom in" onClick={this.btnZoomIn_onClick.bind(this)}><span><ImZoomIn /></span></a>{" "}
          <a title="Zoom out" onClick={this.btnZoomOut_onClick.bind(this)}><span><ImZoomOut /></span></a>
          <a title="Download image" onClick={this.btnDownloadImage_onClick.bind(this)} style={{ display: 'none' }}><i className="bi bi-card-image"></i></a>
          <a title="Save configuration" onClick={this.btnSaveConfiguration_onClick.bind(this)}><span><RiSave3Fill /></span></a>
          <a title="Load configuration" onClick={this.btnOpenConfiguration_onClick.bind(this)}><span><FaRegFolderOpen /></span></a>
          <a title="Reset configuration" onClick={this.btnResetConfiguration_onClick.bind(this)}><span><FaBolt /></span></a>
          <a title="Check consistency" onClick={this.btnCheckConsistency_onClick.bind(this)}><span><IoMdAlert /></span></a>
          <a title="Draw core" onClick={this.btnDrawCoreFeatureTree_onClick.bind(this)}><span>C</span></a>
          <a title="Copy model configuration" onClick={this.btnCopyModelConfiguration_onClick.bind(this)}><span><BsFillClipboardFill /></span></a>
        </div>
        {this.renderContexMenu()}
        <div ref={this.graphContainerRef} className="GraphContainer"></div>
        <div>
          <VariaMosGraph ref={this.variaMosGraphRef} />
        </div>
        <div>
          <Modal
            show={this.state.showPropertiesModal}
            onHide={this.hidePropertiesModal}
            size="lg"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>
                Properties
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={{ maxHeight: "65vh", overflow: "auto" }}>
                <MxProperties projectService={this.props.projectService} model={this.currentModel} item={this.state.selectedObject} />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="primary"
                onClick={this.hidePropertiesModal}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
        <div>
          <Modal
            show={this.state.showMessageModal}
            onHide={this.hideMessageModal}
            size="lg"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {this.state.messageModalTitle}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={{ maxHeight: "65vh", overflow: "auto" }}>
                <p>{this.state.messageModalContent}</p>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={this.hideMessageModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  }
}
