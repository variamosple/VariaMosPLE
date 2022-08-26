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
// import {Element}   from "../../Domain/ProductLineEngineering/Entities/Element";

interface Props {
  projectService: ProjectService;
}
interface State { }

export default class MxGEditor extends Component<Props, State> {
  state = {};
  containerRef: any;
  graphContainerRef: any;
  graph?: mxGraph;
  currentModel?: Model;

  constructor(props: Props) {
    super(props);
    this.containerRef = React.createRef();
    this.graphContainerRef = React.createRef();
    this.projectService_addNewProductLineListener =
      this.projectService_addNewProductLineListener.bind(this);
    this.projectService_addSelectedModelListener =
      this.projectService_addSelectedModelListener.bind(this);
    this.projectService_addUpdatedElementListener =
      this.projectService_addUpdatedElementListener.bind(this);
  }

  projectService_addNewProductLineListener(e: any) {
    this.forceUpdate();
  }

  projectService_addSelectedModelListener(e: any) {
    this.currentModel = e.model;
    this.loadModel(e.model);
    this.forceUpdate();
  }

  projectService_addUpdatedElementListener(e: any) {
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
    me.props.projectService.addUpdatedElementListener(
      this.projectService_addUpdatedElementListener
    );
  }

  LoadGraph(graph: mxGraph) {
    let me = this;
    let ae = mx.mxStencil.prototype.allowEval;
    mx.mxStencil.prototype.allowEval = true;

    mx.mxEvent.disableContextMenu(this.graphContainerRef.current);
    new mx.mxRubberband(graph);
    // var parent = graph.getDefaultParent();
    graph.setPanning(true);
    graph.setTooltips(true);
    graph.setConnectable(true);
    graph.setEnabled(true);
    graph.setEdgeLabelsMovable(false);
    graph.setVertexLabelsMovable(false);
    graph.setGridEnabled(true);
    graph.setAllowDanglingEdges(false);

    // Allows dropping cells into new lanes and
    // lanes into new pools, but disallows dropping
    // cells on edges to split edges
    graph.setDropEnabled(true);
    graph.setSplitEnabled(false);

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

    graph.addListener(mx.mxEvent.CLICK, function (sender, evt) {
      try {
        evt.consume();
        if (evt.properties.cell) {
          let cell = evt.properties.cell;
          if (!cell.value.attributes) {
            return;
          }
          let uid = cell.value.getAttribute("uid");
          if (me.currentModel) {
            for (let i = 0; i < me.currentModel.elements.length; i++) {
              const element: any = me.currentModel.elements[i];
              if (element.id === uid) {
                me.props.projectService.raiseEventSelectedElement(
                  me.currentModel,
                  element
                );
              }
            }
            for (let i = 0; i < me.currentModel.relationships.length; i++) {
              const relationship: any = me.currentModel.relationships[i];
              if (relationship.id === uid) {
                me.props.projectService.raiseEventSelectedElement(
                  me.currentModel,
                  relationship
                );
              }
            }
          }
        }
        else {
          me.graph.clearSelection();
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
            "" + me.currentModel.name
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
              const property = new Property(p.name, p.value, p.type, p.options, p.linked_property, p.linked_value, false, true, p.comment, p.possibleValues);
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
        "" + me.currentModel.name
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
            let label = "";
            if (def.label_fixed) {
              label = def.label_fixed;
            } else if (def.label_property) {
              for (let p = 0; p < relationship.properties.length; p++) {
                const property = relationship.properties[p];
                if (property.name == def.label_property) {
                  if (property.value) {
                    label = "" + property.value;
                  }
                }
              }
            }
            if (label != "") {
              let x = 0;
              let y = 0;
              let offx = 0; //-edge.geometry.width / 2;
              let offy = 0; //-edge.geometry.height / 2;
              switch (def.align) {
                case "top-left":
                  x = -0.75;
                  offy = -edge.geometry.height / 2;
                  break;
                case "top-right":
                  x = +0.75;
                  offy = -edge.geometry.height / 2;
                  break;
                case "bottom-left":
                  x = -0.75;
                  break;
                case "bottom-right":
                  x = +0.75;
                  break;
              }
              var e21 = this.graph.insertVertex(edge, null, label, x, y, 1, 1, style, true);
              e21.setConnectable(false);
              this.graph.updateCellSize(e21);
              // Adds padding (labelPadding not working...)
              e21.geometry.width += 2;
              e21.geometry.height += 2;


              // switch (def.align) {
              //   case "top-left": 
              //     offx=0;
              //     offy=-edge.geometry.height / 2;
              //     break;
              //   case "top-right": 
              //     offx=-e21.geometry.width;
              //     offy=-edge.geometry.height / 2;
              //     break;
              // }


              e21.geometry.offset = new mx.mxPoint(offx, offy);
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
        "" + me.currentModel.name
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
        "" + me.currentModel.name
      );
    let label_property = null;
    let element = me.props.projectService.findModelElementById(me.currentModel, vertice.value.getAttribute("uid"));
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

    vertice.value.setAttribute("Name", element.name);
    for (let i = 0; i < element.properties.length; i++) {
      const p = element.properties[i];
      vertice.value.setAttribute(p.name, p.value);
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
    let me = this;
    let languageDefinition: any =
      this.props.projectService.getLanguageDefinition("" + model.name);

    let graph: mxGraph | undefined = this.graph;
    if (graph) {
      graph.getModel().beginUpdate();
      try {
        graph.removeCells(graph.getChildVertices(graph.getDefaultParent()));

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

          if (languageDefinition.concreteSyntax.elements[element.type].draw) {
            let shape = atob(
              languageDefinition.concreteSyntax.elements[element.type].draw
            );
            let ne: any = mx.mxUtils.parseXml(shape).documentElement;
            ne.setAttribute("name", element.type);
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
          for (let i = 0; i < element.properties.length; i++) {
            const p = element.properties[i];
            node.setAttribute(p.name, p.value);
          }
          var vertex = graph.insertVertex(
            parent,
            null,
            node,
            element.x,
            element.y,
            element.width,
            element.height,
            "shape=" +
            element.type +
            ";" +
            languageDefinition.concreteSyntax.elements[element.type].design
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
      } finally {
        this.graph?.getModel().endUpdate();
      }
    }
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
        "" + me.currentModel.name
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

  render() {
    return (
      <div ref={this.containerRef} className="MxGEditor">
        <div>
          <a title="Zoom in" onClick={this.btnZoomIn_onClick.bind(this)}><i className="bi bi-zoom-in"></i></a>{" "}
          <a title="Zoom out" onClick={this.btnZoomOut_onClick.bind(this)}><i className="bi bi-zoom-out"></i></a>{" "}
          {/* <a title="Download image" onClick={this.btnDownloadImage_onClick.bind(this)}><i className="bi bi-card-image"></i></a> */}
        </div>
        <div ref={this.graphContainerRef} className="GraphContainer"></div>
      </div>
    );
  }
}
