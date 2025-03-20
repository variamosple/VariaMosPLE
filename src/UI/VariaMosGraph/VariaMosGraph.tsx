import React, { Component } from "react";
import Model from "./logic/entities/model";
import Cell from "./logic/entities/cell";
import { VariamosGraphView } from "./VariamosGraphView";
import vxStencil from "./vxStencil";

interface Props { 
}
interface State { 
}

export class VariaMosGraph extends Component<Props, State> {
  model:Model; //el modelo interno que contiente los elementos y las relaciones (flechas)
  convertValueToString;
  enabled=true;

  constructor(props: Props) {
    super(props); 
  }

  getModel(){
    return this.model;
  }

  refresh() {
    // volver a pintar el diagrama
  }
  setGridSize(size) {
    // tamaño del grid y del redimensionado. prioridad baja-media
  }
  setPanning(active) {
    // permitir que se pueda arrastrar
  };
  setTooltips(active) {
    // que mueste los mensajitos sobre los objetos
  };
  setConnectable(active) {
    // que los elementos se puedan relacionar con flechas
  };
  setEnabled(active) {
    // que se pueda editar el modelo
    this.enabled=active;
  };
  isEnabled(){
    // está enabled o no?
    return this.enabled;
  }
  setEdgeLabelsMovable(active) {
    //
  };
  setVertexLabelsMovable(active) {
    //
  };
  setGridEnabled(active) {
    // que se muestre el grid
  };
  setAllowDanglingEdges(active) {
    //
  };
  setAllowLoops(active) {
    // permitir que una flecha salga de un elemento hacia si mismo
  };

  setDropEnabled(active){
    // permitir arrastrar un elemento dentro de otro elemento
  };
  setSplitEnabled(active){
    // no se
  };

  setHtmlLabels(active){
    //permite qu a los textos de los elementos se les aplique clases css para cambiarles el color o que se ajusten al contenedor
  };

  addListener(e,callback){
    //
  }

  addKeyListener(callback) {
    //se dispara cuando se presiona una tecla y el evento debe ser evt.keyCode=tecla presionada
  };

  clearSelection(){
    //deseleccionar los elementos seleccionados
  }

  getSelectionCells():Cell[]{
    //retornar celdas (elementos) seleccionadas
    return null;
  }

  removeCells(cells:Cell[], includeEdges?: boolean){
    // quita los elementos seleccionados y las flechas
  }

  getView():VariamosGraphView{
    //no creo que se deba implementar algo
     return;
  }

  insertVertex(
    parent: any,
    id: string | null,
    value: any,
    x: number,
    y: number,
    width: number,
    height: number,
    style?: string,
    relative?: boolean
  ):Cell{
    // insertar elementos
    //se instancia la celda en el modelo etc...
    let cell=new Cell();
    cell.value=value;
    return value;
  }

  insertEdge(parent: Cell, id: string | null, value: any, source: Cell, target: Cell, style?: string): Cell{
    //inserta las celdas de tipo flecha  
    return null;
  }

  getDefaultParent():Cell{ 
   return this.model.RootCell;
  }

  getChildVertices(parentCell:Cell){
    //retorna las celdas contenidas en la parentCell
    return null;
  }

  zoomIn(){

  }

  zoomOut(){

  }

  updateCellSize(cell:Cell){
    //no se que hace
  }

  removeCellOverlays(cell:Cell){
      //quita los overlays :)
  }

  addCellOverlay(cell, overlayFrame){
 
  }

  disableContextMenu(){

  }

  addStencil(type:string, stencil:vxStencil){
   // los stencil son los que se encargan de dibujar los cell (cajas) de acuerdo al tipo
  }

  render(){
    return  (
      <div>Soy VariaMosGraph</div>
    )
  }

}