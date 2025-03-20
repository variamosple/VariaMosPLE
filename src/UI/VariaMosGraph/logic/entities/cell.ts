import Geometry from "./geometry";

export default class Cell{ 
    private _id: String; //esto va a reemplazar a value.getAttribute("uid")
    public get id(): String {
        return this._id;
    }
    public set id(value: String) {
        this._id = value;
    } 

    private _value: any;
    public get value(): any {
        return this._value;
    }
    public set value(value: any) {
        this._value = value;
    }

    private _edge: Boolean; //define si la celda es un edge(flecha) o un vertex(caja)
    public get edge(): Boolean {
        return this._edge;
    }
    public set edge(value: Boolean) {
        this._edge = value;
    }

    private _geometry: Geometry;
    public get geometry(): Geometry {
        return this._geometry;
    }
    public set geometry(value: Geometry) {
        this._geometry = value;
    }

    setConnectable(active){
        //establece si se pueden tirar flechas a o deste esta celda
    }
}