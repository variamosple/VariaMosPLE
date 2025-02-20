import React, { Component } from "react";
import "./MxGEditor.css";

import mx from "./mxgraph";
import { mxGraph } from "mxgraph";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
import { Point } from "../../Domain/ProductLineEngineering/Entities/Point";
import MxgraphUtils from "../../Infraestructure/Mxgraph/MxgraphUtils";
import { isLabeledStatement } from "typescript";
import SuggestionInput from "../SuggestionInput/SuggestionInput";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FaGears } from "react-icons/fa6";

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Dropdown from 'react-bootstrap/Dropdown';
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
// import {Element}   from "../../Domain/ProductLineEngineering/Entities/Element";
import MxProperties from "../MxProperties/MxProperties";
import * as alertify from "alertifyjs";
import { RiSave3Fill } from "react-icons/ri";
import { LuSheet } from "react-icons/lu";
import { FaBook } from "react-icons/fa";
import { FaRegFolderOpen } from "react-icons/fa6";
import { ImZoomIn } from "react-icons/im";
import { ImZoomOut } from "react-icons/im";
import { BsFillPencilFill } from "react-icons/bs";
import { FaBolt } from "react-icons/fa";
import { IoMdAlert } from "react-icons/io";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { FaBan } from "react-icons/fa";
import { BsFillClipboardFill } from "react-icons/bs";
import { FcHighPriority, FcMediumPriority, FcLowPriority } from 'react-icons/fc';
import { Accordion, AccordionBody, AccordionHeader, AccordionItem } from "reactstrap";

interface Props {
  projectService: ProjectService;

}
interface State {
  showCatalogModal: boolean;
  showDomainCatalogModal: boolean;
  isBillOfMaterials: boolean;
  allScopeConfigurations: Array<Record<string, any>>;
  catalogData: Array<{ Element: string; Property: string; Type: string }> | null;
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
  openAccordion: string[];
  showRequirementsReportModal: boolean;
}

export default class MxGEditor extends Component<Props, State> {
  //state = {};
  containerRef: any;
  graphContainerRef: any;
  graph?: mxGraph;
  currentModel?: Model;

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
      messageModalTitle: null,
      showCatalogModal: false,
      showDomainCatalogModal: false,
      isBillOfMaterials: false,
      catalogData: null,
      allScopeConfigurations: [] as Array<Record<string, any>>,
      openAccordion: [],
      showRequirementsReportModal: false,
    }
    this.getMaterialsFromConfig = this.getMaterialsFromConfig.bind(this);
    this.getRequirementsReport = this.getRequirementsReport.bind(this);
    this.renderRequirementsReport = this.renderRequirementsReport.bind(this);
    this.showCatalogModal = this.showCatalogModal.bind(this);
    this.hideCatalogModal = this.hideCatalogModal.bind(this);
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
  }

  projectService_addNewProductLineListener(e: any) {
    this.forceUpdate();
  }

  projectService_addSelectedModelListener(e: any) {
    this.loadModel(e.model);
    console.log("Model Type:", e.model?.type);
    // Verificar si el modelo es "Bill of Materials"
    if (e.model && e.model.type === "Bill of materials model") {
      this.setState({ isBillOfMaterials: true });
    } else {
      this.setState({ isBillOfMaterials: false });
    }
    this.forceUpdate();

  }

  projectService_addCreatedElementListener(e: any) {
    let me = this;
    let vertice = MxgraphUtils.findVerticeById(this.graph, e.element.id, null);
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
      let edge = MxgraphUtils.findEdgeById(this.graph, e.element.id, null);
      if (edge) {
        // this.refreshEdgeLabel(edge);
        // this.refreshEdgeStyle(edge);
      }
    }
  }

  projectService_addUpdatedElementListener(e: any) {
    try {
      let vertice = MxgraphUtils.findVerticeById(this.graph, e.element.id, null);
      if (vertice) {
        this.refreshVertexLabel(vertice);
        this.createOverlays(e.element, vertice);
      } else {
        let edge = MxgraphUtils.findEdgeById(this.graph, e.element.id, null);
        if (edge) {
          this.refreshEdgeLabel(edge);
          this.refreshEdgeStyle(edge);
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
    this.graph = new mx.mxGraph(this.graphContainerRef.current);
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
    // Carga inicial del modelo actual
    const initialModelId = this.props.projectService.getTreeIdItemSelected();
    if (initialModelId) {
      const model = this.props.projectService.findModelById(
        this.props.projectService.project,
        initialModelId
      );
      if (model) {
        this.loadModel(model);

        // Verifica si el modelo inicial es "Bill of Materials"
        if (model.type === "Bill of materials model") {
          this.setState({ isBillOfMaterials: true });
        } else {
          this.setState({ isBillOfMaterials: false });
        }
      } else {
        this.setState({ isBillOfMaterials: false });
      }
    } else {
      this.setState({ isBillOfMaterials: false });
    }
    this.logAccordionContents();
  }

  LoadGraph(graph: mxGraph) {
    let me = this;
    let ae = mx.mxStencil.prototype.allowEval;
    mx.mxStencil.prototype.allowEval = true;

    mx.mxEvent.disableContextMenu(this.graphContainerRef.current);
    const rubber = new mx.mxRubberband(graph);
    //@ts-ignore
    rubber.setEnabled(true);
    // var parent = graph.getDefaultParent();
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


    //graph.getStylesheet().getDefaultEdgeStyle()["edgeStyle"] = "orthogonalEdgeStyle"; 

    graph.convertValueToString = function (cell) {
      try {
        if (cell.value) {
          if (cell.value.attributes) {
            return cell.value.getAttribute("label", "");
          } else {
            return cell.value;
          }
        }
        else if (cell.attributes) {
          return cell.getAttribute("label", "");
        } else {
          return "";
        }
      } catch (error) {
        return "";
      }
    };
    graph.addListener(mx.mxEvent.CELLS_MOVED, function (sender, evt) {
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
        let uid = cell.value.getAttribute("uid");
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

    graph.addListener(mx.mxEvent.CELLS_ADDED, function (sender, evt) {
      try {
        //evt.consume(); 
        if (evt.properties.cells) {
          let parentId = null;
          if (evt.properties.parent) {
            if (evt.properties.parent.value) {
              parentId = evt.properties.parent.value.getAttribute("uid");
            }
          }
          for (let i = 0; i < evt.properties.cells.length; i++) {
            const cell = evt.properties.cells[i];
            if (!cell.value.attributes) {
              return;
            }
            let uid = cell.value.getAttribute("uid");
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


    graph.addListener(mx.mxEvent.CELLS_RESIZED, function (sender, evt) {
      evt.consume();
      if (evt.properties.cells) {
        let cell = evt.properties.cells[0];
        if (!cell.value.attributes) {
          return;
        }
        let uid = cell.value.getAttribute("uid");
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

    graph.addListener(mx.mxEvent.SELECT, function (sender, evt) {
      evt.consume();
    });

    graph.addListener(mx.mxEvent.DOUBLE_CLICK, function (sender, evt) {
      evt.consume();
      if (me.state.selectedObject) {
        me.showPropertiesModal();
      }
    });

    graph.addListener(mx.mxEvent.CLICK, function (sender, evt) {
      try {
        evt.consume();
        if (!me.currentModel) {
          return;
        }
        if (evt.properties.cell) {
          let cell = evt.properties.cell;
          if (cell.value.attributes) {
            let uid = cell.value.getAttribute("uid");
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



    graph.addListener(mx.mxEvent.CELL_CONNECTED, function (sender, evt) {
      try {
        evt.consume();
        let edge = evt.getProperty("edge");
        let source = edge.source;
        let target = edge.target;
        let name = source.value.getAttribute("label") + "_" + target.value.getAttribute("label");
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
          var doc = mx.mxUtils.createXmlDocument();
          var node = doc.createElement("relationship");
          node.setAttribute("label", name);
          edge.value = node;
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
            source.value.getAttribute("uid"),
            target.value.getAttribute("uid"),
            points,
            rel.min,
            rel.max,
            properties
          );

          node.setAttribute("uid", relationship.id);
          edge.style = "strokeColor=#446E79;strokeWidth=2;";
        }
        me.refreshEdgeLabel(edge);
        me.refreshEdgeStyle(edge);
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let m = error;
        console.error("something went wrong: ", error)
      }
    });

    // graph.connectionHandler.addListener(mx.mxEvent.CONNECT, function(sender, evt)
    // {
    //   var edge = evt.getProperty('cell');
    //   var source = graph.getModel().getTerminal(edge, true);
    //   var target = graph.getModel().getTerminal(edge, false);
    // });

    graph.addListener(mx.mxEvent.REMOVE_CELLS, function (sender, evt) {
      try {
        evt.consume();
      } catch (error) {
        alert(error);
      }
    });

    graph.addListener(mx.mxEvent.LABEL_CHANGED, function (sender, evt) {
      let t = 0;
      let name = evt.properties.value;
      evt.properties.value = evt.properties.old;
      evt.properties.cell.value = evt.properties.old;
      evt.consume();

      let cell = evt.properties.cell;
      let uid = cell.value.getAttribute("uid");
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

    graph.addListener(mx.mxEvent.CHANGE, function (sender, evt) {
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

    let gmodel = graph.model;
    gmodel.addListener(mx.mxEvent.CHANGE, function (sender, evt) {
      me.graphModel_onChange(sender, evt);
    });


    graph.getView().setAllowEval(true);


    let keyHandler = new mx.mxKeyHandler(graph);
    keyHandler.bindKey(46, function (evt) {
      me.deleteSelection();
    });

    keyHandler.bindKey(8, function (evt) {
      me.deleteSelection();
    });
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
        if (cell.value) {
          let uid = cell.value.getAttribute("uid");
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
    //MxgraphUtils.deleteSelection(this.graph, this.currentModel);
  }

  refreshEdgeStyle(edge: any) {
    let me = this;
    let languageDefinition: any =
      me.props.projectService.getLanguageDefinition(
        "" + me.currentModel.type
      );
    let relationship = me.props.projectService.findModelRelationshipById(me.currentModel, edge.value.getAttribute("uid"));
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
              e21.geometry.offset = new mx.mxPoint(offx, offy); //offsetx aqui no funciona correctamente cuando la dirección se invierte
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
    let relationship = me.props.projectService.findModelRelationshipById(me.currentModel, edge.value.getAttribute("uid"));
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
    let uid = vertice.value.getAttribute("uid");
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
            let uid = cell.value.getAttribute("uid");
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

      let graph: mxGraph | undefined = this.graph;
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

            for (let i = 0; i < orden.length; i++) {
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
                shape = atob(
                  languageDefinition.concreteSyntax.elements[element.type].draw
                );
              }

              if (shape) {
                let ne: any = mx.mxUtils.parseXml(shape).documentElement;
                ne.setAttribute("name", element.type);
                MxgraphUtils.modifyShape(ne);
                let stencil = new mx.mxStencil(ne);
                mx.mxStencilRegistry.addStencil(element.type, stencil);
              }

              let parent = graph.getDefaultParent();
              if (element.parentId) {
                parent = vertices[element.parentId];
              }

              var doc = mx.mxUtils.createXmlDocument();
              var node = doc.createElement(element.type);
              node.setAttribute("uid", element.id);
              node.setAttribute("label", element.name);
              node.setAttribute("Name", element.name);
              node.setAttribute("type", element.type);
              for (let i = 0; i < element.properties.length; i++) {
                const p = element.properties[i];
                node.setAttribute(p.name, p.value);
              }
              let fontcolor = "";
              if (shape) {
                let color = this.getFontColorFromShape(shape);
                if (color) {
                  fontcolor = "fontColor=" + color + ";"
                }
              }
              let design = languageDefinition.concreteSyntax.elements[element.type].design;
              let styleShape="shape=" + element.type + ";whiteSpace=wrap;" + fontcolor + design; 
              let resizable=languageDefinition.concreteSyntax.elements[element.type].resizable;
              if ("" + resizable == "false") {
                styleShape += ";resizable=0;";
              }
              styleShape+=fontcolor + design; 
              var vertex = graph.insertVertex(
                parent,
                null,
                node,
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
              let source = MxgraphUtils.findVerticeById(graph, relationship.sourceId, null);
              let target = MxgraphUtils.findVerticeById(graph, relationship.targetId, null);
              let doc = mx.mxUtils.createXmlDocument();
              let node = doc.createElement("relationship");
              node.setAttribute("uid", relationship.id);
              node.setAttribute("label", relationship.name);
              node.setAttribute("type", relationship.type);

              var cell = this.graph?.insertEdge(parent, null, node, source, target, 'strokeColor=#69b630;strokeWidth=3;endArrow=block;endSize=8;edgeStyle=elbowEdgeStyle;');
              cell.geometry.points = [];
              if (relationship.points) {
                for (let k = 0; k < relationship.points.length; k++) {
                  const p = relationship.points[k];
                  cell.geometry.points.push(new mx.mxPoint(p.x, p.y));
                }
              }
            }
          }
        } finally {
          graph.getModel().endUpdate();
        }
      }
    }, 2500);
  }

  getFontColorFromShape(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const shapeElement = xmlDoc.querySelector("shape");
    const aspectValue = shapeElement ? shapeElement.getAttribute("fontcolor") : null;
    return aspectValue;
  }

  //sacar esto en una libreria


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
        let overlayFrame = new mx.mxCellOverlay(new mx.mxImage(icon, 24, 24), 'Overlay tooltip');
        overlayFrame.align = mx.mxConstants.ALIGN_RIGHT;
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_TOP;
        overlayFrame.offset = new mx.mxPoint(0, 0);

        overlayFrame.addListener(mx.mxEvent.CLICK, function (sender, evt) {
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
    let overlayFrame = new mx.mxCellOverlay(new mx.mxImage(url, width, height), 'Overlay tooltip');
    overlayFrame.verticalAlign = mx.mxConstants.ALIGN_BOTTOM;
    overlayFrame.align = mx.mxConstants.ALIGN_LEFT;
    switch (align) {
      case "top-left":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_TOP;
        overlayFrame.align = mx.mxConstants.ALIGN_LEFT;
        break;
      case "top-right":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_TOP;
        overlayFrame.align = mx.mxConstants.ALIGN_RIGHT;
        break;
      case "bottom-left":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_BOTTOM;
        overlayFrame.align = mx.mxConstants.ALIGN_LEFT;
        break;
      case "bottom-right":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_BOTTOM;
        overlayFrame.align = mx.mxConstants.ALIGN_RIGHT;
        break;
      case "middle":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_MIDDLE;
        overlayFrame.align = mx.mxConstants.ALIGN_CENTER;
        break;
      case "middle-left":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_MIDDLE;
        overlayFrame.align = mx.mxConstants.ALIGN_LEFT;
        break;
      case "middle-right":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_MIDDLE;
        overlayFrame.align = mx.mxConstants.ALIGN_RIGHT;
        break;
      case "middle-top":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_TOP;
        overlayFrame.align = mx.mxConstants.ALIGN_CENTER;
        break;
      case "middle-bottom":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_BOTTOM;
        overlayFrame.align = mx.mxConstants.ALIGN_CENTER;
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
    overlayFrame.offset = new mx.mxPoint(offx, offy);
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

  updateCurrentModel(model: Model) {
    this.currentModel = model;
    const isBillOfMaterials = model?.name === "Bill of Materials";
    this.setState({ isBillOfMaterials });
  }



  saveConfiguration() {
    this.props.projectService.raiseEventRequestSaveConfigurationListener(this.props.projectService.project, this.currentModel.id);
  }

  openConfiguration() {
    this.props.projectService.raiseEventRequestOpenConfigurationListener(this.props.projectService.project, this.currentModel.id);
  }
  openCatalog() {
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
    MxgraphUtils.exportFile(this.graph, "png");
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
  btnViewCatalog_onClick(e) {
    try {
      this.openCatalog();
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

  showCatalogModal = async () => {
    try {
      // Asegúrate de que el modelo y la definición del lenguaje estén disponibles.
      if (!this.currentModel || !this.currentModel.type) {
        console.error("No model or language definition available.");
        return;
      }

      const languageDefinition = this.props.projectService.getLanguageDefinition(
        this.currentModel.type
      );
      const abstractSyntax = typeof languageDefinition?.abstractSyntax === "string"
        ? JSON.parse(languageDefinition.abstractSyntax)
        : languageDefinition?.abstractSyntax ?? {};

      // Obtén los elementos y propiedades desde la sintaxis abstracta.
      const elements = abstractSyntax?.elements || {};
      const catalogData = [];

      // Recorremos los elementos del modelo actual.
      this.currentModel.elements.forEach((element) => {
        const elementType = element.type;

        // Identificamos las propiedades del tipo de elemento desde la sintaxis abstracta.
        const elementProperties = elements[elementType]?.properties || [];
        const rowData = {
          Name: element.name || "Unnamed", // Incluye el atributo "name"
          Element: elementType,
        };

        // Mapeamos las propiedades del elemento actual al formato requerido.
        elementProperties.forEach((property) => {
          const propertyName = property.name;
          rowData[propertyName] = element.properties.find(
            (p) => p.name === propertyName
          )?.value || "Undefined";
        });

        catalogData.push(rowData);
      });

      this.setState({ showCatalogModal: true, catalogData });
    } catch (error) {
      console.error("Error loading catalog data:", error);
    }
  };

  handleShowDomainCatalog = async () => {
    try {
      const selectedScope = this.props.projectService.getSelectedScope();
      if (!selectedScope) {
        alert("No scope is selected or available.");
        return;
      }

      // Cargar todas las configuraciones del scope
      this.props.projectService.getAllConfigurations(
        (configurations) => {
          // Éxito: Guardar todas las configuraciones en el state
          this.setState({
            allScopeConfigurations: configurations.map((config) => ({
              ...config, // Propiedades dinámicas
            })),
            showDomainCatalogModal: true,
          });
        },
        (error) => {
          console.error("Error fetching configurations:", error);
          alert("Failed to fetch configurations. Please try again.");
        }
      );
    } catch (error) {
      console.error("Error loading domain catalog:", error);
    }
  };


  /*
  handleShowDomainCatalog = async () => {
    try {
      const selectedScope = this.props.projectService.getSelectedScope();
      if (!selectedScope) {
        alert("No scope is selected or available.");
        return;
      }

      // Obtener el modelo completo del scope
      const elements = selectedScope.elements || [];
      const relationships = selectedScope.relationships || [];

      // Cargar las configuraciones del scope
      this.props.projectService.getAllConfigurations(
        (configurations) => {
          // Guardar configuraciones y datos del modelo en el estado
          this.setState({
            allScopeConfigurations: configurations.map((config) => ({
              ...config,
              elements,
              relationships,
            })),
            showDomainCatalogModal: true,
          });
        },
        (error) => {
          console.error("Error fetching configurations:", error);
          alert("Failed to fetch configurations. Please try again.");
        }
      );
    } catch (error) {
      console.error("Error loading domain catalog:", error);
    }
  };
*/
  // Renderizar el modal con las tarjetas
  toggleCatalogModal = () => {
    this.setState({ showDomainCatalogModal: !this.state.showDomainCatalogModal });
  };

  toggleAccordion(id) {
    this.setState((prevState) => {
      const isOpen = prevState.openAccordion.includes(id);
      const newOpenAccordion = isOpen
        ? prevState.openAccordion.filter((accordionId) => accordionId !== id)
        : [...prevState.openAccordion, id];

      console.log(`Toggling accordion: ${id}`);
      console.log(`Updated openAccordion state:`, newOpenAccordion);

      return { openAccordion: newOpenAccordion };
    });
  }










  logAccordionContents() {
    const structure = this.props.projectService.getStructureAndRelationships();
    const { elements, relationships } = structure;

    const logContents = (featureId, level = 0) => {
      const feature = elements.find((el) => el.id === featureId);
      if (!feature) return;

      console.log(`${' '.repeat(level * 2)}- Feature: ${feature.name || "Unnamed"} (ID: ${feature.id})`);
      feature.properties.forEach((prop) => {
        console.log(`${' '.repeat(level * 2 + 2)}Property: ${prop.name} = ${prop.value || "N/A"}`);
      });

      // Encuentra hijos de este feature
      const childRelationships = relationships.filter((rel) => rel.sourceId === featureId);
      childRelationships.forEach((rel) => logContents(rel.targetId, level + 1));
    };

    // Log de elementos raíz
    const rootElements = elements.filter(
      (element) => !relationships.some((rel) => rel.targetId === element.id)
    );
    rootElements.forEach((rootFeature) => {
      console.log(`Root Feature: ${rootFeature.name || "Unnamed"} (ID: ${rootFeature.id})`);
      logContents(rootFeature.id, 1);
    });
  }

























  hideCatalogModal = () => {
    this.setState({ showCatalogModal: false, catalogData: null });
  };

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
    let selectedElementsIds = MxgraphUtils.GetSelectedElementsIds(this.graph, this.currentModel);
    let selectedRelationshipsIds = MxgraphUtils.GetSelectedRelationshipsIds(this.graph, this.currentModel);
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

  /*
  renderMaterialsRecursively(configId) {
    const { elements, relationships } = this.props.projectService.getStructureAndRelationships();
  
    const rootElements = elements.filter(
      (element) => !relationships.some((rel) => rel.targetId === element.id)
    );
  
    console.log(`Root elements for config: ${configId}`, rootElements);
  
    return rootElements.map((rootFeature) => this.renderFeatureAccordion(rootFeature, configId));
  }
  
  
  renderFeatureAccordion(feature, configId, parentId = null) {
    const accordionId = `${configId}-${parentId || "root"}-${feature.id}`;
  
    console.log(`Rendering accordion ID: ${accordionId}`);
  
    return (
      <AccordionItem key={accordionId}>
        <AccordionHeader targetId={accordionId}>
          {feature.name || "Unnamed Feature"}
        </AccordionHeader>
        <AccordionBody accordionId={accordionId}>
          <ul>
            {feature.properties.map((prop, index) => (
              <li key={index}>
                <strong>{prop.name}:</strong> {prop.value || "N/A"}
              </li>
            ))}
          </ul>
          {this.renderChildrenRecursively(feature.id, configId)}
        </AccordionBody>
      </AccordionItem>
    );
  }
  
  


  renderChildrenRecursively(parentId, configId) {
    const { elements, relationships } = this.props.projectService.getStructureAndRelationships();
  
    const childFeatures = elements.filter((element) =>
      relationships.some((rel) => rel.sourceId === parentId && rel.targetId === element.id)
    );
  
    return childFeatures.map((childFeature) => this.renderFeatureAccordion(childFeature, configId, parentId));
  }
  */
  renderMaterialsRecursively(config) {
    const { elements, relationships } = this.props.projectService.getStructureAndRelationships();

    // Filtrar materiales raíz según la estructura general
    const rootMaterials = elements.filter(
      (element) => !relationships.some((rel) => rel.targetId === element.id)
    );

    console.log(`Materiales raíz para config ${config.id}:`, rootMaterials);

    return rootMaterials.map((rootMaterial) =>
      this.renderMaterialAccordion(rootMaterial, config)
    );
  }

  renderMaterialAccordion(material, config, parentId = null) {
    const accordionId = `${config.id}-${parentId || "root"}-${material.id}`;

    // Obtener valores específicos de la configuración actual
    const materialWithValues = this.getMaterialWithConfigValues(material, config);

    const quantityProperty = materialWithValues.properties?.find(
      (prop) => prop.name === "Quantity"
    );

    // Si no hay propiedad "Quantity" o su valor no es "1", no renderizar el acordeón
    if (!quantityProperty || quantityProperty.value !== "1") {
      console.log(`Material ${materialWithValues.name} no cumple la condición de Quantity == "1". No se renderiza.`);
      return null;
    }

    console.log(`Renderizando material ID: ${accordionId}`, materialWithValues);

    return (
      <AccordionItem key={accordionId}>
        <AccordionHeader targetId={accordionId}>
          {materialWithValues.name || "Unnamed Material"}
        </AccordionHeader>
        <AccordionBody accordionId={accordionId}>
          <ul>
            {materialWithValues.properties?.map((prop, index) => (
              <li key={index}>
                <strong>{prop.name}:</strong> {prop.value || "N/A"}
              </li>
            ))}
          </ul>
          {/* Renderizar materiales hijos si existen */}
          {this.renderChildMaterials(material.id, config)}
        </AccordionBody>
      </AccordionItem>
    );
  }

  renderChildMaterials(parentId, config) {
    const { elements, relationships } = this.props.projectService.getStructureAndRelationships();

    // Filtrar materiales hijos según la estructura general
    const childMaterials = elements.filter((element) =>
      relationships.some((rel) => rel.sourceId === parentId && rel.targetId === element.id)
    );

    console.log(`Materiales hijos de ${parentId} en config ${config.id}:`, childMaterials);

    return childMaterials.map((childMaterial) =>
      this.renderMaterialAccordion(childMaterial, config, parentId)
    );
  }

  getMaterialWithConfigValues(material, config) {
    // Buscar el material en la configuración actual
    const configuredMaterial = config.features.find((f) => f.id === material.id);

    if (configuredMaterial) {
      return {
        ...material, // Mantener estructura
        properties: configuredMaterial.properties || material.properties, // Usar propiedades configuradas
      };
    }

    return material; // Si no tiene valores configurados, devolver el original
  }

  renderPotentialProducts() {
    return this.state.allScopeConfigurations.map((config) => (
      <div key={config.id} className="potential-product-card">
        {/* Título del producto con clase sticky */}
        <div className="potential-product-title-container">
          <h5 className="potential-product-title">{config.name || "N/A"}</h5>
        </div>
        {/* Descripción del producto */}
        <p className="potential-product-description">
          {/* Aquí puedes agregar contenido adicional si es necesario */}
        </p>
        {/* Contenido del Accordion */}
        <Accordion
          flush
          open={this.state.openAccordion}
          toggle={(id) => this.toggleAccordion(id)}
        >
          {this.renderMaterialsRecursively(config)}
        </Accordion>
      </div>
    ));
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

    let selectedElementsIds = MxgraphUtils.GetSelectedElementsIds(this.graph, this.currentModel);
    let selectedRelationshipsIds = MxgraphUtils.GetSelectedRelationshipsIds(this.graph, this.currentModel);

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

  /**
   * Recorre recursivamente una configuración para extraer todos los materiales
   * que tienen la propiedad "Quantity" con valor mayor o igual a 1.
   * Se asume que las características están en config.features y que, si existen,
   * los hijos de un material están en feature.children.
   */
  getMaterialsFromConfig(config: any): any[] {
    const allMaterials: any[] = [];
    function traverse(features: any[]) {
      features.forEach((feature) => {
        const quantityProp = feature.properties?.find((p: any) => p.name === "Quantity");
        if (quantityProp && Number(quantityProp.value) >= 1) {
          allMaterials.push(feature);
        }
        // Si existen hijos, se recorre recursivamente
        if (feature.children && feature.children.length > 0) {
          traverse(feature.children);
        }
      });
    }
    traverse(config.features || []);
    return allMaterials;
  }

  getBoMLevel(material: any): number {
    const bomProp = material.properties?.find((p: any) => p.name === "BoM_level");
    if (bomProp && bomProp.value) {
      const match = bomProp.value.match(/level\s*(\d+)/i);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    return 99;
  }


  getBoMLabel(mat: any): string {
    // Buscar la propiedad BoM_level
    const bomProp = mat.properties?.find((p: any) => p.name === "BoM_level");
    if (!bomProp || !bomProp.value) {
      return "component/sub-assemblie";
    }
    // Extraer la parte textual antes del "(level X)" si existe
    // por ejemplo, "Component (level 1)" => "component"
    const value = bomProp.value.toLowerCase(); // "component (level 1)"
    let label = value.split("(level")[0]?.trim();
    // si no se puede extraer, default
    if (!label) label = "component/sub-assemblie";
    return label;
  }


  // Dentro de tu clase MxGEditor, agrega la siguiente función:

  renderMaterialsGrouped(materials: any[]): JSX.Element {
    // Agrupar los materiales por BoM_level usando la función getBoMLevel (ya definida previamente)
    const groups: { [level: number]: any[] } = {};
    materials.forEach((mat) => {
      const level = this.getBoMLevel(mat); // Se espera que retorne un número (0, 1, 2, etc.)
      if (!groups[level]) {
        groups[level] = [];
      }
      groups[level].push(mat);
    });
    // Obtener los niveles ordenados ascendentemente
    const sortedLevels = Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b);
    // Mapeo de nivel a etiqueta
    const levelLabels: { [key: number]: string } = {
      0: "Product",
      1: "Components",
      2: "Sub-assemblies",
    };
    return (
      <div>
        {sortedLevels.map((level) => (
          <div key={level} style={{ marginBottom: "10px" }}>
            <strong style={{ color: "#444", fontSize: "14px" }}>
              {levelLabels[level] || `Level ${level}`}
            </strong>
            <ul style={{ listStyle: "none", paddingLeft: "15px", margin: 0 }}>
              {groups[level].map((mat, index) => (
                <li key={mat.id + index} style={{ padding: "3px 0", fontSize: "13px" }}>
                  {mat.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }


  /**
   * Procesa todas las configuraciones en state.allScopeConfigurations para generar
   * un reporte que clasifica los materiales en tres categorías:
   *  - "Must Have": Material presente en todas las configuraciones.
   *  - "Should Have": Material presente en al menos el 50% de las configuraciones.
   *  - "Could Have": Material presente en menos del 50%.
   *
   * El reporte se construye de forma dinámica sin almacenarlo en el state.
   */
  getRequirementsReport() {
    const totalConfigs = this.state.allScopeConfigurations.length;
    const materialStats: {
      [id: string]: {
        id: string;
        name: string;
        count: number;
        quantities: number[];
        properties: any[];
      };
    } = {};

    this.state.allScopeConfigurations.forEach((config: any) => {
      const materials = this.getMaterialsFromConfig(config);
      const uniqueMaterialIds = new Set<string>();

      materials.forEach((mat) => {
        const quantityProp = mat.properties?.find((p: any) => p.name === "Quantity");
        const quantity = quantityProp ? Number(quantityProp.value) : 0;
        if (!materialStats[mat.id]) {
          materialStats[mat.id] = {
            id: mat.id,
            name: mat.name || "Unnamed",
            count: 0,
            quantities: [],
            properties: mat.properties || [],
          };
        }
        materialStats[mat.id].quantities.push(quantity);
        uniqueMaterialIds.add(mat.id);
      });

      uniqueMaterialIds.forEach((matId) => {
        materialStats[matId].count += 1;
      });
    });

    const requiredMaterials: any[] = [];
    const recommendedMaterials: any[] = [];
    const optionalMaterials: any[] = [];

    for (const matId in materialStats) {
      const stat = materialStats[matId];
      const minQuantity = Math.min(...stat.quantities);
      const materialInfo = {
        id: stat.id,
        name: stat.name,
        count: stat.count,
        quantities: stat.quantities,
        minQuantity: minQuantity,
        properties: stat.properties,
      };

      if (stat.count === totalConfigs) {
        requiredMaterials.push(materialInfo);
      } else if (stat.count >= totalConfigs * 0.5) {
        recommendedMaterials.push(materialInfo);
      } else {
        optionalMaterials.push(materialInfo);
      }
    }

    // Ordenamos cada grupo por el nivel BoM (menor nivel primero)
    requiredMaterials.sort((a, b) => this.getBoMLevel(a) - this.getBoMLevel(b));
    recommendedMaterials.sort((a, b) => this.getBoMLevel(a) - this.getBoMLevel(b));
    optionalMaterials.sort((a, b) => this.getBoMLevel(a) - this.getBoMLevel(b));

    return {
      requiredMaterials,
      recommendedMaterials,
      optionalMaterials,
      totalConfigs,
    };
  }

  /**
 * Verifica si un material (identificado por mat.id) está presente en la configuración (config).
 * Se considera presente si la propiedad "Quantity" >= 1.
 */
  isMaterialPresentInConfig(config: any, material: any): boolean {
    if (!config.features) return false;
    const feature = config.features.find((f: any) => f.id === material.id);
    if (!feature) return false;
    const qProp = feature.properties?.find((p: any) => p.name === "Quantity");
    return qProp && Number(qProp.value) >= 1;
  }

  /**
   * Recorre todas las configuraciones (state.allScopeConfigurations) e infiere
   * restricciones simples del tipo: "Si A está presente, B no está presente",
   * siempre y cuando, en todos los productos donde A aparece, B NO aparece.
   *
   * Devuelve un array de strings con la forma:
   *  ["If <A> then not <B>", "If <X> then not <Y>", ...]
   */

  getPartialExclusions(threshold_exc: number = 1.0, minOccurrence: number = 2) {
    const exclusions = [];
    const totalConfigs = this.state.allScopeConfigurations.length;
    if (totalConfigs === 0) return exclusions;
  
    // 1. Recolectar materiales, contar apariciones y coocurrencias
    const allMaterialsMap = new Map();
    const appearCount = new Map<string, number>();       // Número de configuraciones en que aparece cada material
    const pairCooccurrence = new Map<string, number>();    // Número de configuraciones en que dos materiales aparecen juntos
  
    this.state.allScopeConfigurations.forEach((config: any) => {
      const mats = this.getMaterialsFromConfig(config);
      // Filtrar para omitir materiales de tipo "Product (level 0)"
      const filteredMats = mats.filter((m: any) => {
        const bomProp = m.properties?.find((p: any) => p.name === "BoM_level");
        return !(bomProp && bomProp.value && bomProp.value.includes("Product (level 0)"));
      });
      const matIds = filteredMats.map((m: any) => m.id);
      const localSet = new Set<string>();
      filteredMats.forEach((m: any) => {
        localSet.add(m.id);
        if (!allMaterialsMap.has(m.id)) {
          allMaterialsMap.set(m.id, m);
        }
      });
      localSet.forEach((id) => {
        appearCount.set(id, (appearCount.get(id) || 0) + 1);
      });
      for (let i = 0; i < matIds.length; i++) {
        for (let j = i + 1; j < matIds.length; j++) {
          const key = matIds[i] + "," + matIds[j];
          pairCooccurrence.set(key, (pairCooccurrence.get(key) || 0) + 1);
          // Guardar de forma simétrica
          pairCooccurrence.set(matIds[j] + "," + matIds[i], (pairCooccurrence.get(matIds[j] + "," + matIds[i]) || 0) + 1);
        }
      }
    });
  
    const allMaterials = Array.from(allMaterialsMap.values());
    const coreIds = this.getCoreMaterialIds();
  
    // 2. Recorrer pares (A, B) (evitando duplicados, i < j)
    for (let i = 0; i < allMaterials.length; i++) {
      for (let j = i + 1; j < allMaterials.length; j++) {
        const matA = allMaterials[i];
        const matB = allMaterials[j];
  
        // Excluir el par si alguno es core (para evitar relaciones triviales)
        if (coreIds.has(matA.id) || coreIds.has(matB.id)) {
          continue;
        }
        // Excluir pares que ya tengan una relación estructural "Contains"
        if (this.hasStructuralRelationship(matA, matB)) {
          continue;
        }
  
        const countA = appearCount.get(matA.id) || 0;
        const countB = appearCount.get(matB.id) || 0;
        const coAB = pairCooccurrence.get(matA.id + "," + matB.id) || 0;
  
        // Calcular la fracción de veces que A aparece sin B:
        const ratioA_notB = countA > 0 ? ((countA - coAB) / countA) : 0;
        // De B hacia A:
        const ratioB_notA = countB > 0 ? ((countB - coAB) / countB) : 0;
  
        let aExcludesB = false;  // "If A is selected, then B is absent"
        let bExcludesA = false;  // "If B is selected, then A is absent"
  
        // Solo considerar la relación si el material de origen aparece en al menos minOccurrence configuraciones
        if (countA >= minOccurrence && ratioA_notB >= threshold_exc) {
          aExcludesB = true;
        }
        if (countB >= minOccurrence && ratioB_notA >= threshold_exc) {
          bExcludesA = true;
        }
  
        if (aExcludesB || bExcludesA) {
          exclusions.push({
            matA,
            matB,
            aExcludesB,
            bExcludesA,
            ratioA_notB,
            ratioB_notA,
            countA,
            countB
          });
        }
      }
    }
  
    return exclusions;
  }
  
  
  
  renderPartialExclusionsTable(exclusions: any[]) {
    if (!exclusions || exclusions.length === 0) {
      return <p>No potential exclusions found.</p>;
    }
  
    const getLabel = (mat: any) => this.getBoMLabel(mat);
  
    return (
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f8f8f8", border: "1px solid #ccc" }}>
            <th
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                fontWeight: "bold",
                textAlign: "left",
              }}
            >
              Material Exclusions (Threshold-based)
            </th>
          </tr>
        </thead>
        <tbody>
          {exclusions.map((pair: any, idx: number) => {
            const labelA = getLabel(pair.matA);
            const labelB = getLabel(pair.matB);
            if (pair.aExcludesB && pair.bExcludesA) {
              return (
                <tr key={idx} style={{ border: "1px solid #ccc" }}>
                  <td style={{ padding: "8px" }}>
                    {`${labelA} "${pair.matA.name}" ⇔ not ${labelB} "${pair.matB.name}" (mutual exclusion)`}
                  </td>
                </tr>
              );
            } else if (pair.aExcludesB) {
              return (
                <tr key={idx} style={{ border: "1px solid #ccc" }}>
                  <td style={{ padding: "8px" }}>
                    {`If ${labelA} "${pair.matA.name}" is selected ⇒ not ${labelB} "${pair.matB.name}".`}
                  </td>
                </tr>
              );
            } else if (pair.bExcludesA) {
              return (
                <tr key={idx} style={{ border: "1px solid #ccc" }}>
                  <td style={{ padding: "8px" }}>
                    {`If ${labelB} "${pair.matB.name}" is selected ⇒ not ${labelA} "${pair.matA.name}".`}
                  </td>
                </tr>
              );
            }
            return null;
          })}
        </tbody>
      </table>
    );
  }
  
  
  




  getPotentialConstraints(): string[] {
    const constraints: string[] = [];

    // 1. Recolectar todos los materiales que aparecen en las configuraciones
    const allMaterialsMap = new Map<string, any>();
    this.state.allScopeConfigurations.forEach((config) => {
      const mats = this.getMaterialsFromConfig(config);
      mats.forEach((m) => {
        if (!allMaterialsMap.has(m.id)) {
          allMaterialsMap.set(m.id, m);
        }
      });
    });
    const allMaterials = Array.from(allMaterialsMap.values());

    // 2. Recorremos pares (A, B)
    for (let i = 0; i < allMaterials.length; i++) {
      for (let j = i + 1; j < allMaterials.length; j++) {
        const matA = allMaterials[i];
        const matB = allMaterials[j];

        let conditionAExcludesB = true;
        let conditionBExcludesA = true;

        for (const config of this.state.allScopeConfigurations) {
          const aPresent = this.isMaterialPresentInConfig(config, matA);
          const bPresent = this.isMaterialPresentInConfig(config, matB);
          if (aPresent && bPresent) {
            conditionAExcludesB = false;
          }
          if (bPresent && aPresent) {
            conditionBExcludesA = false;
          }
          if (!conditionAExcludesB && !conditionBExcludesA) {
            break;
          }
        }

        // Etiquetas descriptivas para matA y matB:
        const labelA = this.getBoMLabel(matA);   // "component" o "sub-assemblie"
        const labelB = this.getBoMLabel(matB);

        if (conditionAExcludesB) {
          constraints.push(
            `If ${labelA} "${matA.name}" is selected, then ${labelB} "${matB.name}" must not be selected.`
          );
        }
        if (conditionBExcludesA) {
          constraints.push(
            `If ${labelB} "${matB.name}" is selected, then ${labelA} "${matA.name}" must not be selected.`
          );
        }
      }
    }

    return constraints;
  }

  /**
 * Retorna un Set con los IDs de materiales core 
 * (materiales presentes en el 100% de las configuraciones).
 */
getCoreMaterialIds(): Set<string> {
  const coreIds = new Set<string>();
  const totalConfigs = this.state.allScopeConfigurations.length;
  if (totalConfigs === 0) return coreIds;

  // 1. Contamos en cuántas configuraciones aparece cada material
  const appearCount = new Map<string, number>();

  this.state.allScopeConfigurations.forEach((config) => {
    const mats = this.getMaterialsFromConfig(config);
    // Usamos un Set local para no duplicar en la misma config
    const localSet = new Set<string>();
    mats.forEach((m) => localSet.add(m.id));
    // Incr. el contador para cada material presente
    localSet.forEach((id) => {
      appearCount.set(id, (appearCount.get(id) || 0) + 1);
    });
  });

  // 2. Verificar quién está en todas las configs
  for (let [matId, count] of appearCount) {
    if (count === totalConfigs) {
      coreIds.add(matId);
    }
  }
  
  return coreIds;
}

renderMaterialDependenciesPartition() {
  // Obtenemos todas las dependencias según la lógica (por ejemplo, con threshold 1.0)
  const deps = this.getPartialDependencies(1.0);

  // Particionamos en bidireccionales y unidireccionales
  const bidirectional = deps.filter(dep => dep.aImpliesB && dep.bImpliesA);
  const unidirectional = deps.filter(dep => (dep.aImpliesB && !dep.bImpliesA) || (!dep.aImpliesB && dep.bImpliesA));

  return (
    <div>
      <h5>Potential component dependencies</h5>
      {/* Texto introductorio */}
      <p style={{ fontStyle: "italic", color: "#666", marginBottom: "10px" }}>
      The following dependencies indicate that one material requires another to function properly. Symbols: “⇔” for both ways, “⇒” or “⇐” for one-way.</p>

      <p style={{ fontStyle: "italic", color: "#666", marginBottom: "10px" }}>
      These dependencies exclude any pairs where at least one component is core or already linked through structural relationships. 
      Also, each dependency only appears if the source material appears in multiple configurations and always (or above a threshold) co-occurs with the target, ensuring meaningful associations.
      </p>

      {/* Sección de Dependencias Bidireccionales */}
      <h6>Bidirectional Dependencies (Always appear together under threshold)</h6>
      {bidirectional.length === 0 ? (
        <p>No bidirectional dependencies found.</p>
      ) : (
        this.renderPartialDependenciesTable(bidirectional)
      )}

      {/* Sección de Dependencias Unidireccionales */}
      <h6>Unidirectional Dependencies</h6>
      {unidirectional.length === 0 ? (
        <p>No unidirectional dependencies found.</p>
      ) : (
        this.renderPartialDependenciesTable(unidirectional)
      )}
    </div>
  );
}


getPartialDependencies(threshold_dep: number = 1.0, minOccurrence: number = 2) {
  const dependencies = [];
  const totalConfigs = this.state.allScopeConfigurations.length;
  if (totalConfigs === 0) return dependencies;

  // 1. Recolectar materiales, contar apariciones y coocurrencias
  const allMaterialsMap = new Map();
  const appearCount = new Map<string, number>();  // Número de configuraciones donde aparece cada material
  const pairCooccurrence = new Map<string, number>();  // Número de configuraciones donde dos materiales aparecen juntos

  this.state.allScopeConfigurations.forEach((config: any) => {
    const mats = this.getMaterialsFromConfig(config);
    // Filtrar para omitir materiales con BoM_level "Product (level 0)"
    const filteredMats = mats.filter((m: any) => {
      const bomProp = m.properties?.find((p: any) => p.name === "BoM_level");
      return !(bomProp && bomProp.value && bomProp.value.includes("Product (level 0)"));
    });
    const matIds = filteredMats.map((m: any) => m.id);
    const localSet = new Set<string>();
    filteredMats.forEach((m: any) => {
      localSet.add(m.id);
      if (!allMaterialsMap.has(m.id)) {
        allMaterialsMap.set(m.id, m);
      }
    });
    localSet.forEach((id) => {
      appearCount.set(id, (appearCount.get(id) || 0) + 1);
    });
    for (let i = 0; i < matIds.length; i++) {
      for (let j = i + 1; j < matIds.length; j++) {
        const key = matIds[i] + "," + matIds[j];
        pairCooccurrence.set(key, (pairCooccurrence.get(key) || 0) + 1);
        // Guardar de forma simétrica
        pairCooccurrence.set(matIds[j] + "," + matIds[i], (pairCooccurrence.get(matIds[j] + "," + matIds[i]) || 0) + 1);
      }
    }
  });

  const allMaterials = Array.from(allMaterialsMap.values());
  const coreIds = this.getCoreMaterialIds();

  // 2. Recorrer pares (A, B) (evitando duplicados, i < j)
  for (let i = 0; i < allMaterials.length; i++) {
    for (let j = i + 1; j < allMaterials.length; j++) {
      const matA = allMaterials[i];
      const matB = allMaterials[j];

      // Excluir el par si alguno es core (para evitar relaciones triviales)
      if (coreIds.has(matA.id) || coreIds.has(matB.id)) {
        continue;
      }
      // Excluir pares que ya tengan una relación estructural "Contains"
      if (this.hasStructuralRelationship(matA, matB)) {
        continue;
      }

      const countA = appearCount.get(matA.id) || 0;
      const countB = appearCount.get(matB.id) || 0;
      const coAB = pairCooccurrence.get(matA.id + "," + matB.id) || 0;

      // Calcula el ratio: de las configuraciones en que A aparece, cuántas veces aparece B
      const ratioAtoB = countA > 0 ? (coAB / countA) : 0;
      // De B hacia A
      const ratioBtoA = countB > 0 ? (coAB / countB) : 0;

      // Solo se consideran relaciones si el material de origen aparece al menos minOccurrence veces
      let aImpliesB = (ratioAtoB >= threshold_dep) && (countA >= minOccurrence);
      let bImpliesA = (ratioBtoA >= threshold_dep) && (countB >= minOccurrence);

      if (aImpliesB || bImpliesA) {
        dependencies.push({
          matA,
          matB,
          aImpliesB,
          bImpliesA,
          ratioAtoB,
          ratioBtoA,
          countA,
          countB
        });
      }
    }
  }

  return dependencies;
}


limitDependencies(dependencies: any[], limitPerMaterial: number = 3) {
  const grouped = new Map();
  // Agrupar por matA.id (puedes elegir otra forma de agrupar, según el contexto)
  dependencies.forEach((dep) => {
    const key = dep.matA.id;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(dep);
  });
  const limitedDeps = [];
  grouped.forEach((depsGroup, key) => {
    // Ordenar el grupo por la "fuerza" de la asociación, por ejemplo,
    // usando la suma de ratioAtoB y ratioBtoA.
    depsGroup.sort((a, b) => {
      const strengthA = (a.aImpliesB ? a.ratioAtoB : 0) + (a.bImpliesA ? a.ratioBtoA : 0);
      const strengthB = (b.aImpliesB ? b.ratioAtoB : 0) + (b.bImpliesA ? b.ratioBtoA : 0);
      return strengthB - strengthA;
    });
    limitedDeps.push(...depsGroup.slice(0, limitPerMaterial));
  });
  return limitedDeps;
}





hasStructuralRelationship(matA: any, matB: any): boolean {
  const structure = this.props.projectService.getStructureAndRelationships();
  const rels = structure.relationships || [];
  return rels.some((rel: any) => {
    // Se asume que la propiedad "Type" en rel.properties determina el tipo de relación.
    const typeProp = rel.properties?.find((p: any) => p.name === "Type");
    if (!typeProp || typeProp.value !== "Contains") {
      return false;
    }
    return (
      (rel.sourceId === matA.id && rel.targetId === matB.id) ||
      (rel.sourceId === matB.id && rel.targetId === matA.id)
    );
  });
}




renderPartialDependenciesTable(deps: any[]) {
  if (!deps || deps.length === 0) {
    return <p>No dependencies found.</p>;
  }

  const getLabel = (mat: any) => this.getBoMLabel(mat);

  return (
    <table
      style={{
        borderCollapse: "collapse",
        width: "100%",
        marginTop: "10px",
      }}
    >
      <thead>
        <tr style={{ backgroundColor: "#f8f8f8", border: "1px solid #ccc" }}>
          <th
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              fontWeight: "bold",
              textAlign: "left",
            }}
          >
            Material Dependencies (Threshold-based)
          </th>
        </tr>
      </thead>
      <tbody>
        {deps.map((pair: any, idx: number) => {
          const labelA = getLabel(pair.matA);
          const labelB = getLabel(pair.matB);
          if (pair.aImpliesB && pair.bImpliesA) {
            return (
              <tr key={idx} style={{ border: "1px solid #ccc" }}>
                <td style={{ padding: "8px" }}>
                  {`${labelA} "${pair.matA.name}" ⇔ ${labelB} "${pair.matB.name}" (always appear together under threshold)`}
                </td>
              </tr>
            );
          } else if (pair.aImpliesB) {
            return (
              <tr key={idx} style={{ border: "1px solid #ccc" }}>
                <td style={{ padding: "8px" }}>
                  {`If ${labelA} "${pair.matA.name}" is selected ⇒ ${labelB} "${pair.matB.name}" must also be selected.`}
                </td>
              </tr>
            );
          } else if (pair.bImpliesA) {
            return (
              <tr key={idx} style={{ border: "1px solid #ccc" }}>
                <td style={{ padding: "8px" }}>
                  {`If ${labelB} "${pair.matB.name}" is selected ⇒ ${labelA} "${pair.matA.name}" must also be selected.`}
                </td>
                </tr>
            );
          }
          return null;
        })}
      </tbody>
    </table>
  );
}


/**
 * Calcula el ratio promedio de funcionalidades avanzadas en todas las configuraciones.
 * Se consideran avanzadas aquellas funcionalidades que NO sean core (según getCoreMaterialIds).
 */
calculateAverageAdvancedRatio(): number {
  let totalRatios = 0;
  let countConfigs = 0;
  const coreIds = this.getCoreMaterialIds();
  this.state.allScopeConfigurations.forEach((config: any) => {
    const materials = this.getMaterialsFromConfig(config);
    const totalCount = materials.length;
    if (totalCount > 0) {
      const advancedCount = materials.filter((m: any) => !coreIds.has(m.id)).length;
      totalRatios += advancedCount / totalCount;
      countConfigs += 1;
    }
  });
  return countConfigs > 0 ? totalRatios / countConfigs : 0;
}

/**
 * Analiza las métricas del scope global comparando los valores esperados (calculados
 * a partir del promedio de funcionalidades avanzadas) con los valores definidos en el scope.
 * Se generan mensajes que muestran tanto el valor esperado como el real, junto con advertencias
 * si la discrepancia es significativa.
 */

convertComplexity(num: number): string {
  if (num <= 2) return "Low";
  if (num === 3) return "Medium";
  return "High";
}


analyzeScopeMetrics(): string[] {
  const messages: string[] = [];
  // Se calcula el ratio promedio de funcionalidades avanzadas
  const avgAdvancedRatio = this.calculateAverageAdvancedRatio();
  const foundTC_numeric = Math.round(1 + 4 * avgAdvancedRatio);
  const foundTechnicalComplexity = this.convertComplexity(foundTC_numeric);
  const foundMarketImpact = Math.round(100 * avgAdvancedRatio); // Escala de 0 a 100
  let foundRisk = "Low";
  if (avgAdvancedRatio > 0.7) {
    foundRisk = "High";
  } else if (avgAdvancedRatio > 0.3) {
    foundRisk = "Medium";
  }

  // Se obtiene el scope global (los valores ingresados por el usuario)
  const currentScope = this.props.projectService.getScope();
  if (currentScope) {
    const expectedTechnicalComplexity = currentScope.technicalComplexity || "Low";
    const expectedMarketImpact = currentScope.marketImpact || 0;
    const expectedRisk = currentScope.risk || "Medium";
    const expectedStrategicPriority = currentScope.strategicPriority || "Medium";

    // Mostrar siempre los valores del scope (Expected) y los calculados (Found)
    messages.push(`Technical Complexity: Expected ≈ ${expectedTechnicalComplexity}, Found ${foundTechnicalComplexity}.`);
    messages.push(`Market Impact: Expected ≈ ${expectedMarketImpact}, Found ${foundMarketImpact}.`);
    messages.push(`Risk: Expected "${expectedRisk}", Found "${foundRisk}".`);

    const mapCat = { "Low": 1, "Medium": 2, "High": 3 };
    if (Math.abs(mapCat[foundTechnicalComplexity] - mapCat[expectedTechnicalComplexity]) >= 1) {
      messages.push(`Warning: Technical Complexity discrepancy is high.`);
    }
    if (Math.abs(foundMarketImpact - expectedMarketImpact) >= 20) {
      messages.push(`Warning: Market Impact discrepancy is high.`);
    }
    if (expectedRisk !== foundRisk) {
      messages.push(`Warning: Risk level discrepancy detected.`);
    }
  } else {
    messages.push("No scope metrics found in the current product line.");
  }
  return messages;
}

// DENTRO de tu componente, EJEMPLO:
renderScopeMetricsAnalysis(scopeWarnings: string[]) {
  // 1) Dividir en líneas principales vs warnings
  const mainLines: string[] = [];
  const warningLines: string[] = [];

  scopeWarnings.forEach((line) => {
    if (
      line.startsWith("Technical Complexity") ||
      line.startsWith("Market Impact") ||
      line.startsWith("Risk")
    ) {
      mainLines.push(line);
    } else if (line.startsWith("Warning:")) {
      warningLines.push(line);
    } else {
      // o ignorar / meter en un fallback
    }
  });

  // 2) Función de parseo, parecido a la de per-product
  const parseScopeLine = (line: string) => {
    // Ejemplo: "Technical Complexity: Expected ≈ 3, Found 1."
    const colonIndex = line.indexOf(":");
    const metricName = (colonIndex > 0) ? line.substring(0, colonIndex).trim() : "Unknown Metric";

    const regex = /Expected.*?([\w\d".]+).*?Found.*?([\w\d".]+)/i;
    let expected = "N/A";
    let found = "N/A";
    const match = line.match(regex);
    if (match && match[1] && match[2]) {
      expected = match[1].replace(/[".]/g, "");
      found = match[2].replace(/[".]/g, "");
    }

    return { metricName, expected, found };
  };

  const checkStatusIcon = (expected: string, found: string) => {
    if (expected === found) {
      return <span style={{ color: "green" }}>✓</span>;
    }
    return <span style={{ color: "red" }}>⚠</span>;
  };

  // 3) Parsear las 4 líneas principales
  const parsedMetrics = mainLines.map((ml) => parseScopeLine(ml));

  // 4) Renderizar
  return (
    <div>
      {/* Tabla de métricas (si las hay) */}
      {parsedMetrics.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            marginBottom: "10px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ border: "1px solid #ddd", padding: "6px" }}>Metric</th>
              <th style={{ border: "1px solid #ddd", padding: "6px" }}>Expected</th>
              <th style={{ border: "1px solid #ddd", padding: "6px" }}>Found</th>
              <th style={{ border: "1px solid #ddd", padding: "6px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {parsedMetrics.map((pm, idx) => {
              const statusIcon = checkStatusIcon(pm.expected, pm.found);
              return (
                <tr key={idx}>
                  <td style={{ border: "1px solid #ddd", padding: "6px" }}>{pm.metricName}</td>
                  <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                    {pm.expected}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                    {pm.found}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "6px" }}>
                    {statusIcon}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Lista de warnings (si hay) */}
      {warningLines.length > 0 && (
        <ul style={{ paddingLeft: "20px", margin: 0, color: "red", fontSize: "13px" }}>
          {warningLines.map((w, i) => (
            <li key={i}>{w.replace("Warning: ", "")}</li>
          ))}
        </ul>
      )}
      {parsedMetrics.length === 0 && warningLines.length === 0 && (
        <p>No scope metric warnings found.</p>
      )}
    </div>
  );
}

/**
 * Analiza las métricas de cada producto potencial (configuración) individualmente.
 * Para cada configuración, calcula los valores esperados en función del ratio de funcionalidades avanzadas
 * y los compara con los valores reales definidos en la configuración.
 * Retorna un arreglo de objetos con el nombre del producto y los mensajes resultantes.
 */
analyzeScopeMetricsByProduct(): { productName: string; warnings: string[] }[] {
  const results: { productName: string; warnings: string[] }[] = [];
  const coreIds = this.getCoreMaterialIds();

  this.state.allScopeConfigurations.forEach((config: any) => {
    const productName = config.name || "Unnamed Product";
    const materials = this.getMaterialsFromConfig(config);
    const totalCount = materials.length;
    const advancedCount = materials.filter((m: any) => !coreIds.has(m.id)).length;
    const ratio = totalCount > 0 ? advancedCount / totalCount : 0;

    // Valores esperados basados en el ratio
    const foundTC_numeric = Math.round(1 + 4 * ratio);
    const actualTechnicalComplexity = this.convertComplexity(foundTC_numeric);
    const actualMarketImpact = Math.round(100 * ratio); // Escala 0-100
    let actualRisk = "Low";
    if (ratio > 0.7) {
      actualRisk = "High";
    } else if (ratio > 0.3) {
      actualRisk = "Medium";
    }

    // Se extraen los valores reales asignados a la configuración


    const currentScope = this.props.projectService.getScope();
    const expectedTechnicalComplexity = currentScope.technicalComplexity || 1;
    const expectedMarketImpact = currentScope.marketImpact || 0;
    const expectedRisk = currentScope.risk || "Medium";
    


    const warnings: string[] = [];
    warnings.push(`Technical Complexity: Expected ≈ ${expectedTechnicalComplexity}, Found ${actualTechnicalComplexity}.`);
    warnings.push(`Market Impact: Expected ≈ ${expectedMarketImpact}, Found ${actualMarketImpact}.`);
    warnings.push(`Risk: Expected "${expectedRisk}", Found "${actualRisk}".`);

    const mapCat = { "Low": 1, "Medium": 2, "High": 3 };
    if (Math.abs(mapCat[expectedTechnicalComplexity] - mapCat[actualTechnicalComplexity]) >= 2) {
      warnings.push(`Warning: Technical Complexity discrepancy is high.`);
    }
    if (Math.abs(expectedMarketImpact - actualMarketImpact) >= 20) {
      warnings.push(`Warning: Market Impact discrepancy is high.`);
    }
    if (actualRisk !== expectedRisk) {
      warnings.push(`Warning: Risk level discrepancy detected.`);
    }

    results.push({ productName, warnings });
  });

  return results;
}


// ... dentro de tu clase o componente ...

renderPerProductMetricsAnalysis() {
  const analysisResults = this.analyzeScopeMetricsByProduct();

  // Función local: identifica si la línea es de una métrica principal o una advertencia
  // y extrae datos de "Expected" y "Found"
  const parseMetricLine = (line: string) => {
    const colonIndex = line.indexOf(":");
    const metricName = (colonIndex > 0)
      ? line.substring(0, colonIndex).trim() // "Technical Complexity" por ej.
      : "Unknown Metric";

    const regex = /Expected.*?([\w\d".]+).*?Found.*?([\w\d".]+)/i;
    const match = line.match(regex);
    let expected = "N/A";
    let found = "N/A";
    if (match && match[1] && match[2]) {
      expected = match[1].replace(/[".]/g, ""); // quita comillas o punto final
      found = match[2].replace(/[".]/g, "");
    }
    return { metricName, expected, found };
  };

  // Para ver si hay "OK" o "Warning"
  const checkStatusIcon = (expected: string, found: string) => {
    // Heurística super sencilla:
    // Si son números y difieren un "poco", o si son strings distintos...
    if (expected === found) {
      return (
        <span style={{ color: "green" }}>
          <FaCheckCircle style={{ marginRight: "4px" }} />
          OK
        </span>
      );
    }
    // Caso contrario, discrepancia
    return (
      <span style={{ color: "red" }}>
        <FaExclamationTriangle style={{ marginRight: "4px" }} />
        Discrepancy
      </span>
    );
  };

  return (
    <AccordionItem>
      <AccordionHeader targetId="perProductMetrics">
        Per-Product Metrics Analysis
      </AccordionHeader>
      <AccordionBody accordionId="perProductMetrics">
        {analysisResults.length === 0 ? (
          <p>No individual product metric warnings found.</p>
        ) : (
          analysisResults.map((result, idx) => {
            // Separamos las líneas en "principales" y "warnings"
            const mainLines: string[] = [];
            const warningLines: string[] = [];

            // Clasificar las líneas
            result.warnings.forEach((line) => {
              if (
                line.startsWith("Technical Complexity") ||
                line.startsWith("Market Impact") ||
                line.startsWith("Risk")
              ) {
                mainLines.push(line);
              } else if (line.startsWith("Warning:")) {
                warningLines.push(line);
              }
              else {
                // Si hubiera otras líneas sueltas, podrías agregarlo a un fallback
                // o ignorarlas
              }
            });

            // Parsea los 4 mainLines
            // (En tu caso, siempre deberían ser 4, pero podrías no asumirlo)
            const parsedMetrics = mainLines.map((ml) => parseMetricLine(ml));

            return (
              <div key={idx} style={{ marginBottom: "20px" }}>
                <h5 style={{ marginBottom: "8px" }}>{result.productName}</h5>

                {/* Tabla con las 4 líneas principales */}
                {parsedMetrics.length > 0 && (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "14px",
                      marginBottom: "10px",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f2f2f2" }}>
                        <th style={{ border: "1px solid #ddd", padding: "6px" }}>Metric</th>
                        <th style={{ border: "1px solid #ddd", padding: "6px" }}>Expected</th>
                        <th style={{ border: "1px solid #ddd", padding: "6px" }}>Found</th>
                        <th style={{ border: "1px solid #ddd", padding: "6px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedMetrics.map((pm, i) => {
                        const statusIcon = checkStatusIcon(pm.expected, pm.found);
                        return (
                          <tr key={i}>
                            <td style={{ border: "1px solid #ddd", padding: "6px" }}>{pm.metricName}</td>
                            <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                              {pm.expected}
                            </td>
                            <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                              {pm.found}
                            </td>
                            <td style={{ border: "1px solid #ddd", padding: "6px" }}>
                              {statusIcon}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Lista de Warnings (si existen) */}
                {warningLines.length > 0 && (
                  <ul style={{ marginLeft: "15px", fontSize: "13px", color: "red" }}>
                    {warningLines.map((wl, indexWL) => (
                      <li key={indexWL}>
                        <FaExclamationTriangle style={{ marginRight: "5px" }} />
                        {wl.replace("Warning: ", "")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </AccordionBody>
    </AccordionItem>
  );
}












 



renderRequirementsReport() {
  const report = this.getRequirementsReport();

  // Se prepara el array de datos para el gráfico
  const allMaterials = [
    ...report.requiredMaterials,
    ...report.recommendedMaterials,
    ...report.optionalMaterials,
  ];
  const chartData = allMaterials.map((mat: any) => ({
    name: mat.name,
    percentage:
      report.totalConfigs > 0
        ? Math.round((mat.count / report.totalConfigs) * 100)
        : 0,
  }));
  const allDeps = this.getPartialDependencies(1.0); // Umbral de 1.0 (100% de coincidencia)
  const limitedDeps = this.limitDependencies(allDeps, 3); // Limitar a 3 asociaciones por material
  
  // Obtén las advertencias del análisis de scope basadas en las métricas definidas en el scope
  const scopeWarnings = this.analyzeScopeMetrics();

  return (
    <div className="requirements-report" style={{ padding: "20px" }}>
      <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
        Requirements Report
      </h3>

      {/* Acordeón principal */}
      <Accordion
        flush
        open={this.state.openAccordion}
        toggle={this.toggleAccordion.bind(this)}
      >
        {/* Acordeón mayor: "Component Prioritization" */}
        <AccordionItem>
          <AccordionHeader targetId="componentPrioritization">
            Component Prioritization
          </AccordionHeader>
          <AccordionBody accordionId="componentPrioritization">
            {/* Acordeón interno con 3 secciones: High, Medium, Low Priority */}
            <Accordion
              flush
              open={this.state.openAccordion}
              toggle={this.toggleAccordion.bind(this)}
            >
              {/* Alta prioridad */}
              <AccordionItem>
                <AccordionHeader targetId="highPriority">
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <FcHighPriority style={{ marginRight: "8px" }} />
                    High Priority
                  </span>
                </AccordionHeader>
                <AccordionBody accordionId="highPriority">
                  <p style={{ fontStyle: "italic", color: "#666", fontSize: "13px", marginBottom: "10px" }}>
                    These materials are present in the entire product line.
                  </p>
                  {this.renderMaterialsGrouped(report.requiredMaterials)}
                </AccordionBody>
              </AccordionItem>

              {/* Prioridad media */}
              <AccordionItem>
                <AccordionHeader targetId="mediumPriority">
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <FcMediumPriority style={{ marginRight: "8px" }} />
                    Medium Priority
                  </span>
                </AccordionHeader>
                <AccordionBody accordionId="mediumPriority">
                  <p style={{ fontStyle: "italic", color: "#666", fontSize: "13px", marginBottom: "10px" }}>
                    These materials are present in at least 50% of potential products.
                  </p>
                  {this.renderMaterialsGrouped(report.recommendedMaterials)}
                </AccordionBody>
              </AccordionItem>

              {/* Baja prioridad */}
              <AccordionItem>
                <AccordionHeader targetId="lowPriority">
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <FcLowPriority style={{ marginRight: "8px" }} />
                    Low Priority
                  </span>
                </AccordionHeader>
                <AccordionBody accordionId="lowPriority">
                  <p style={{ fontStyle: "italic", color: "#666", fontSize: "13px", marginBottom: "10px" }}>
                    These materials specialize a particular product and do not belong to all potential products.
                  </p>
                  {this.renderMaterialsGrouped(report.optionalMaterials)}
                </AccordionBody>
              </AccordionItem>
            </Accordion>

            {/* Contenido del gráfico, SIN acordeón adicional */}
            <div style={{ marginTop: "20px" }}>
              <p style={{ fontStyle: "italic", color: "#666", fontSize: "13px", marginBottom: "10px" }}>
                Below is a graph that summarizes the usage of each material in potential products.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={(props) => {
                      const { x, y, payload } = props;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-45)" style={{ fontSize: 12 }}>
                            {payload.value}
                          </text>
                        </g>
                      );
                    }}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AccordionBody>
        </AccordionItem>

        {/* Acordeón para Potential Model Constraints */}
        <AccordionItem>
          <AccordionHeader targetId="modelConstraints">
            Potential Model Constraints
          </AccordionHeader>
          <AccordionBody accordionId="modelConstraints">
            <h5>Potential component exclusions</h5>
            <p style={{ fontStyle: "italic", color: "#666", marginBottom: "10px" }}>
              The following restrictions indicate unidirectional or mutual exclusivity between certain materials. Symbols: “⇔” for mutual, “⇒” or “⇐” for one-way.
            </p>
            <p style={{ fontStyle: "italic", color: "#666", marginBottom: "10px" }}>
              These exclusions have been filtered to remove trivial cases involving core features or existing structural relationships (e.g., “Contains”). Additionally, each exclusion only appears if the source material is present in at least two configurations, ensuring that the restriction is consistently observed.
            </p>
            {this.renderPartialExclusionsTable(this.getPartialExclusions(1))}

            {/* Nueva sección para Dependencies */}
            <hr style={{ margin: "20px 0" }} />
            {this.renderMaterialDependenciesPartition()}
          </AccordionBody>
        </AccordionItem>

        {/* Nuevo acordeón: Scope Metrics Analysis */}
        <AccordionItem>
          <AccordionHeader targetId="scopeMetricsAnalysis">
            Scope Metrics Analysis
          </AccordionHeader>
          <AccordionBody accordionId="scopeMetricsAnalysis">
            <p style={{ fontStyle: "italic", color: "#666", marginBottom: "10px" }}>
              This section compares the expected Technical Complexity and Market Impact derived from the advanced functionalities with the values defined in the scope.
            </p>
            {this.renderScopeMetricsAnalysis(scopeWarnings)}
            {this.renderPerProductMetricsAnalysis()}
          </AccordionBody>
        </AccordionItem>
      </Accordion>
    </div>
  );
}







  toggleRequirementsReportModal = () => {
    if (!this.state.showRequirementsReportModal) {
      const selectedScope = this.props.projectService.getSelectedScope();
      if (!selectedScope) {
        alert("No scope is selected or available.");
        return;
      }
      this.props.projectService.getAllConfigurations(
        (configurations: any[]) => {
          this.setState({
            allScopeConfigurations: configurations.map((config) => ({ ...config })),
            showRequirementsReportModal: true,
          });
        },
        (error: any) => {
          console.error("Error fetching configurations:", error);
          alert("Failed to fetch configurations. Please try again.");
        }
      );
    } else {
      this.setState({ showRequirementsReportModal: false });
    }
  };

  render() {
    return (
      <div ref={this.containerRef} className="MxGEditor">
        <div className="header">
          <a title="Edit properties" onClick={this.showPropertiesModal}><span><BsFillPencilFill /></span></a>{" "}
          <a title="Zoom in" onClick={this.btnZoomIn_onClick.bind(this)}><span><ImZoomIn /></span></a>{" "}
          <a title="Zoom out" onClick={this.btnZoomOut_onClick.bind(this)}><span><ImZoomOut /></span></a>
          {this.state.isBillOfMaterials && (
            <a title="View Catalog" onClick={this.showCatalogModal}>
              <span><LuSheet /></span>
            </a>
          )}
          {this.state.isBillOfMaterials && (
            <a title="Show Domain Catalog" onClick={this.handleShowDomainCatalog.bind(this)}>
              <span><FaBook /></span>
            </a>
          )}
          {this.state.isBillOfMaterials && (
            // Botón para abrir el modal del Requirements Report.
            <a
              title="Scope analysis"
              onClick={this.toggleRequirementsReportModal}
            >
              <span> <FaGears /></span>
            </a>
          )}
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
          <Modal
            show={this.state.showCatalogModal}
            onHide={this.hideCatalogModal}
            size="lg"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Catalog</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {this.state.catalogData ? (
                <div style={{ maxHeight: "65vh", overflow: "auto" }}>
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        {/* Renderizado dinámico de encabezados */}
                        {Object.keys(this.state.catalogData[0] || {}).map((key, index) => (
                          <th key={index}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.catalogData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {/* Renderizado dinámico de celdas */}
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Loading data...</p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={this.hideCatalogModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>


        </div>
        <div>
          <Modal
            show={this.state.showDomainCatalogModal}
            onHide={this.toggleCatalogModal}
            size="lg"
            centered
            className="domain-catalog-modal-custom"
          >
            <Modal.Header closeButton>
              <Modal.Title>Potential products to be implemented in the product line</Modal.Title>
            </Modal.Header>
            <Modal.Body className="domain-catalog-body">
              {this.renderPotentialProducts()}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={this.toggleCatalogModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>



        </div>
        {/* Modal Requirements Report */}
        <div>
          <Modal
            show={this.state.showRequirementsReportModal}
            onHide={this.toggleRequirementsReportModal}
            size="lg"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Scope analysis</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: "65vh", overflow: "auto" }}>
              {this.renderRequirementsReport()}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={this.toggleRequirementsReportModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
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
