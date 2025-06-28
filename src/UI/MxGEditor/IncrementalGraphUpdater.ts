import mx from "./mxgraph";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
import { ModelDiff } from "../../DataProvider/Services/incrementalSyncService";
import MxgraphUtils from "../../Infraestructure/Mxgraph/MxgraphUtils";
import ProjectService from "../../Application/Project/ProjectService";

export class IncrementalGraphUpdater {
  private graph: any;
  private projectService: ProjectService;
  private vertices: { [key: string]: any } = {};

  constructor(graph: any, projectService: ProjectService) {
    this.graph = graph;
    this.projectService = projectService;
  }

  /**
   * Aplica cambios incrementales al grafo basado en un diff
   */
  public applyIncrementalChanges(
    model: Model,
    diff: ModelDiff,
    refreshCallbacks?: {
      refreshVertexLabel?: (vertex: any) => void;
      refreshEdgeLabel?: (edge: any) => void;
      refreshEdgeStyle?: (edge: any) => void;
      createOverlays?: (element: Element, vertex: any) => void;
      getFontColorFromShape?: (shape: string) => string | null;
    }
  ): void {
    if (!this.graph) return;

    this.graph.getModel().beginUpdate();
    try {
      // Actualizar el mapa de vértices existentes
      this.updateVerticesMap();

      // Procesar elementos removidos primero
      this.removeElements(diff.elementsRemoved);

      // Procesar relaciones removidas
      this.removeRelationships(diff.relationshipsRemoved);

      // Procesar elementos añadidos
      this.addElements(model, diff.elementsAdded, refreshCallbacks);

      // Procesar elementos actualizados
      this.updateElements(model, diff.elementsUpdated, refreshCallbacks);

      // Procesar relaciones añadidas
      this.addRelationships(model, diff.relationshipsAdded, refreshCallbacks);

      // Procesar relaciones actualizadas
      this.updateRelationships(model, diff.relationshipsUpdated, refreshCallbacks);

    } finally {
      this.graph.getModel().endUpdate();
    }
  }

  /**
   * Actualiza el mapa interno de vértices
   */
  private updateVerticesMap(): void {
    this.vertices = {};
    const parent = this.graph.getDefaultParent();
    const childCount = this.graph.getModel().getChildCount(parent);

    for (let i = 0; i < childCount; i++) {
      const cell = this.graph.getModel().getChildAt(parent, i);
      if (this.graph.getModel().isVertex(cell)) {
        const uid = cell.value?.getAttribute?.('uid');
        if (uid) {
          this.vertices[uid] = cell;
        }
      }
    }
  }

  /**
   * Remueve elementos del grafo
   */
  private removeElements(elementIds: string[]): void {
    elementIds.forEach(elementId => {
      const vertex = this.vertices[elementId];
      if (vertex) {
        this.graph.getModel().remove(vertex);
        delete this.vertices[elementId];
      }
    });
  }

  /**
   * Remueve relaciones del grafo
   */
  private removeRelationships(relationshipIds: string[]): void {
    const parent = this.graph.getDefaultParent();
    const childCount = this.graph.getModel().getChildCount(parent);

    for (let i = childCount - 1; i >= 0; i--) {
      const cell = this.graph.getModel().getChildAt(parent, i);
      if (this.graph.getModel().isEdge(cell)) {
        const uid = cell.value?.getAttribute?.('uid');
        if (uid && relationshipIds.includes(uid)) {
          this.graph.getModel().remove(cell);
        }
      }
    }
  }

  /**
   * Añade nuevos elementos al grafo
   */
  private addElements(
    model: Model,
    elements: Element[],
    callbacks?: any
  ): void {
    const languageDefinition = this.projectService.getLanguageDefinition(model.type);
    if (!languageDefinition) return;

    elements.forEach(element => {
      this.createVertex(element, languageDefinition, callbacks);
    });
  }

  /**
   * Actualiza elementos existentes en el grafo
   */
  private updateElements(
    model: Model,
    elements: Element[],
    callbacks?: any
  ): void {
    elements.forEach(element => {
      const vertex = this.vertices[element.id];
      if (vertex) {
        // Actualizar posición
        const geometry = this.graph.getModel().getGeometry(vertex);
        if (geometry) {
          geometry.x = element.x;
          geometry.y = element.y;
          geometry.width = element.width;
          geometry.height = element.height;
        }

        // Actualizar propiedades del nodo
        const node = vertex.value;
        if (node) {
          node.setAttribute("label", element.name);
          node.setAttribute("Name", element.name);
          
          element.properties.forEach(p => {
            node.setAttribute(p.name, p.value);
          });
        }

        // Refrescar etiqueta si hay callback
        if (callbacks?.refreshVertexLabel) {
          callbacks.refreshVertexLabel(vertex);
        }

        // Recrear overlays si hay callback
        if (callbacks?.createOverlays) {
          callbacks.createOverlays(element, vertex);
        }
      }
    });
  }

  /**
   * Añade nuevas relaciones al grafo
   */
  private addRelationships(
    model: Model,
    relationships: Relationship[],
    callbacks?: any
  ): void {
    const parent = this.graph.getDefaultParent();

    relationships.forEach(relationship => {
      const source = this.vertices[relationship.sourceId];
      const target = this.vertices[relationship.targetId];

      if (source && target) {
        const doc = mx.mxUtils.createXmlDocument();
        const node = doc.createElement("relationship");
        node.setAttribute("uid", relationship.id);
        node.setAttribute("label", relationship.name);
        node.setAttribute("type", relationship.type);

        const cell = this.graph.insertEdge(
          parent,
          null,
          node,
          source,
          target,
          'strokeColor=#69b630;strokeWidth=3;endArrow=block;endSize=8;edgeStyle=elbowEdgeStyle;'
        );

        // Configurar puntos de la relación
        if (relationship.points && cell.geometry) {
          cell.geometry.points = [];
          relationship.points.forEach(p => {
            cell.geometry.points.push(new mx.mxPoint(p.x, p.y));
          });
        }

        // Refrescar estilo y etiqueta si hay callbacks
        if (callbacks?.refreshEdgeLabel) {
          callbacks.refreshEdgeLabel(cell);
        }
        if (callbacks?.refreshEdgeStyle) {
          callbacks.refreshEdgeStyle(cell);
        }
      }
    });
  }

  /**
   * Actualiza relaciones existentes en el grafo
   */
  private updateRelationships(
    model: Model,
    relationships: Relationship[],
    callbacks?: any
  ): void {
    const parent = this.graph.getDefaultParent();
    const childCount = this.graph.getModel().getChildCount(parent);

    relationships.forEach(relationship => {
      // Buscar la relación existente
      for (let i = 0; i < childCount; i++) {
        const cell = this.graph.getModel().getChildAt(parent, i);
        if (this.graph.getModel().isEdge(cell)) {
          const uid = cell.value?.getAttribute?.('uid');
          if (uid === relationship.id) {
            // Actualizar propiedades
            const node = cell.value;
            if (node) {
              node.setAttribute("label", relationship.name);
              node.setAttribute("type", relationship.type);
            }

            // Actualizar puntos si es necesario
            if (relationship.points && cell.geometry) {
              cell.geometry.points = [];
              relationship.points.forEach(p => {
                cell.geometry.points.push(new mx.mxPoint(p.x, p.y));
              });
            }

            // Refrescar callbacks
            if (callbacks?.refreshEdgeLabel) {
              callbacks.refreshEdgeLabel(cell);
            }
            if (callbacks?.refreshEdgeStyle) {
              callbacks.refreshEdgeStyle(cell);
            }
            break;
          }
        }
      }
    });
  }

  /**
   * Crea un vértice individual
   */
  private createVertex(element: Element, languageDefinition: any, callbacks?: any): void {
    // Lógica similar a la del loadModel original pero para un solo elemento
    let shape = null;
    
    if (languageDefinition.concreteSyntax.elements[element.type].styles) {
      const styles = languageDefinition.concreteSyntax.elements[element.type].styles;
      for (let s = 0; s < styles.length; s++) {
        const styleDef = styles[s];
        if (!styleDef.linked_property) {
          shape = atob(styleDef.style);
        } else {
          for (let p = 0; p < element.properties.length; p++) {
            const property = element.properties[p];
            if (property.name === styleDef.linked_property && 
                String(property.value) === styleDef.linked_value) {
              shape = atob(styleDef.style);
              break;
            }
          }
        }
      }
    } else if (languageDefinition.concreteSyntax.elements[element.type].draw) {
      shape = atob(languageDefinition.concreteSyntax.elements[element.type].draw);
    }

    if (shape) {
      const ne = mx.mxUtils.parseXml(shape).documentElement;
      ne.setAttribute("name", element.type);
      MxgraphUtils.modifyShape(ne);
      const stencil = new mx.mxStencil(ne);
      mx.mxStencilRegistry.addStencil(element.type, stencil);
    }

    let parent = this.graph.getDefaultParent();
    if (element.parentId && this.vertices[element.parentId]) {
      parent = this.vertices[element.parentId];
    }

    const doc = mx.mxUtils.createXmlDocument();
    const node = doc.createElement(element.type);
    node.setAttribute("uid", element.id);
    node.setAttribute("label", element.name);
    node.setAttribute("Name", element.name);
    node.setAttribute("type", element.type);
    
    element.properties.forEach(p => {
      node.setAttribute(p.name, p.value);
    });

    let fontcolor = "";
    if (shape && callbacks?.getFontColorFromShape) {
      const color = callbacks.getFontColorFromShape(shape);
      if (color) {
        fontcolor = "fontColor=" + color + ";";
      }
    }

    const design = languageDefinition.concreteSyntax.elements[element.type].design;
    let styleShape = "shape=" + element.type + ";whiteSpace=wrap;" + fontcolor + design;
    const resizable = languageDefinition.concreteSyntax.elements[element.type].resizable;
    
    if (String(resizable) === "false") {
      styleShape += ";resizable=0;";
    }

    const vertex = this.graph.insertVertex(
      parent,
      null,
      node,
      element.x,
      element.y,
      element.width,
      element.height,
      styleShape
    );

    if (callbacks?.refreshVertexLabel) {
      callbacks.refreshVertexLabel(vertex);
    }
    
    if (callbacks?.createOverlays) {
      callbacks.createOverlays(element, vertex);
    }

    this.vertices[element.id] = vertex;
  }
}
