import Cell from "./cell" 

export default class Model{
    RootCell: Cell;
    Cells:Cell[] 

    //indice de parents (celdapadre_id, celdahija_id) "apuntador"

    beginUpdate(){
        //creo que no es necesario implementar nada
    }

    endUpdate(){
        //creo que no es necesario implementar nada
    }

    addListener(eventType, callback){
       //disparar este evento en caso por ejemplo de que se modifique una celda o algo del modelo
       //esperar que coco  revise si es necesario implementar o la prioridad
    }
}