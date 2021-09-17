import React, { Component } from "react";
import "./MxGEditor.css";

import mx from "./mxgraph";
import { mxGraph } from "mxgraph";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
// import {Element}   from "../../Domain/ProductLineEngineering/Entities/Element";

interface Props {
  projectService: ProjectService;
}
interface State {}

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
  }

  projectService_addNewProductLineListener(e: any) {
    this.forceUpdate();
  }

  projectService_addSelectedModelListener(e: any) {
    this.currentModel = e.model;
    this.loadModel(e.model);
    this.forceUpdate();
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
  }

  LoadGraph(graph: mxGraph) {
    let me = this;
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
    graph.getStylesheet().getDefaultEdgeStyle()["edgeStyle"] =
      "orthogonalEdgeStyle";
    graph.convertValueToString = function (cell) {
      try {
        return cell.getAttribute("label", "");
      } catch (error) {
        return "nose";
      }
    };
    graph.addListener(mx.mxEvent.CELLS_MOVED, function (sender, evt) {
      evt.consume();
      if (evt.properties.cells) {
        let cell = evt.properties.cells[0];
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
          let uid = evt.properties.cell.value.getAttribute("uid");
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
          }
        }
      } catch (error) {}
    });

    graph.addListener(mx.mxEvent.CELL_CONNECTED, function (sender, evt) {
      try {
        evt.consume();
        let edge = evt.getProperty("edge");
        let source = edge.source;
        let target = edge.target;
        let name = source.value.tagName + "_" + target.value.tagName;
        let relationshipType =
          source.value.tagName + "_" + target.value.tagName;

        edge.style = "strokeColor=#446E79;strokeWidth=2;";
        let languageDefinition: any =
          me.props.projectService.getLanguageDefinition(
            "" + me.currentModel.name
          );
        if (languageDefinition.concreteSyntax.relationships) {
          if (
            languageDefinition.concreteSyntax.relationships[relationshipType]
          ) {
            edge.style =
              languageDefinition.concreteSyntax.relationships[
                relationshipType
              ].style;
          }
        }
        if (!edge.value) {
          var doc = mx.mxUtils.createXmlDocument();
          var node = doc.createElement("relationship");
          node.setAttribute("label", relationshipType);
          edge.value = node;
          let points = [];
          let min = 0;
          let max = 1;
          let properties = [];
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          let relationship = me.props.projectService.createRelationship(
            me.currentModel,
            name,
            source.value.getAttribute("uid"),
            target.value.getAttribute("uid"),
            points,
            min,
            max,
            properties
          );

          // var style = graph.getCellStyle(edge);
          // var sourcePortId = style[mx.mxConstants.STYLE_SOURCE_PORT];
          // var targetPortId = style[mx.mxConstants.STYLE_TARGET_PORT];

          // mxLog.show();
          // mxLog.debug('connect', edge, source.id, target.id, sourcePortId, targetPortId);
        }
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
  }

  loadModel(model: Model) {
    let languageDefinition: any =
      this.props.projectService.getLanguageDefinition("" + model.name);

    let graph: mxGraph | undefined = this.graph;
    if (graph) {
      graph.getModel().beginUpdate();
      try {
        graph.removeCells(graph.getChildVertices(graph.getDefaultParent()));
        let parent = graph.getDefaultParent();
        for (let i = 0; i < model.elements.length; i++) {
          let element: any = model.elements[i];

          if (languageDefinition.concreteSyntax.elements[element.type].draw) {
            let shape = atob(
              languageDefinition.concreteSyntax.elements[element.type].draw
            );
            let ne: any = mx.mxUtils.parseXml(shape).documentElement;
            ne.setAttribute("name", element.type);
            let stencil = new mx.mxStencil(ne);
            mx.mxStencilRegistry.addStencil(element.type, stencil);
          }

          var doc = mx.mxUtils.createXmlDocument();
          var node = doc.createElement(element.type);
          node.setAttribute("uid", element.id);
          node.setAttribute("label", element.name);
          var vx = graph.insertVertex(
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
          console.log(vx);
        }

        for (let i = 0; i < model.relationships.length; i++) {
          const relationship = model.relationships[i];
          let source = this.findElementById(graph, relationship.sourceId);
          let target = this.findElementById(graph, relationship.targetId);
          let name = source.value.tagName + "_" + target.value.tagName;
          let relationshipType =
            source.value.tagName + "_" + target.value.tagName;
          let doc = mx.mxUtils.createXmlDocument();
          let node = doc.createElement("relationship");
          node.setAttribute("label", name);
          node.setAttribute("type", relationshipType);

          //var cell = new mx.mxCell(node, new mx.mxGeometry(0, 0, 50, 50), 'curved=1;endArrow=classic;html=1;');
          var cell = new mx.mxCell(
            node,
            new mx.mxGeometry(0, 0, 50, 50),
            "strokeColor=#446E79;strokeWidth=2;"
          );
          cell.geometry.setTerminalPoint(new mx.mxPoint(50, 150), true);
          cell.geometry.setTerminalPoint(new mx.mxPoint(150, 50), false);
          cell.geometry.relative = true;
          cell.edge = true;

          //cell = this.graph?.addCell(cell);

          let index = null;
          this.graph?.addEdge(cell, parent, source, target, index);

          //this.graph?.fireEvent(new mx.mxEventObject('cellsInserted', 'cells', [cell]));
        }
      } finally {
        this.graph?.getModel().endUpdate();
      }
    }
  }

  //sacar esto en una libreria
  findElementById(graph, uid) {
    let vertices = graph.getChildVertices(graph.getDefaultParent());
    for (let i = 0; i < vertices.length; i++) {
      const vertice = vertices[i];
      try {
        let vuid = vertice.value.getAttribute("uid");
        if (vuid === uid) {
          return vertice;
        }
      } catch (error) {}
    }
    return null;
  }

  render() {
    return (
      <div ref={this.containerRef} className="MxGEditor">
        <div ref={this.graphContainerRef} className="GraphContainer"></div>
      </div>
    );
  }
}
