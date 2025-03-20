import GeometryPoint from "./logic/entities/geometryPoint";
import vxImage from "./vxImage";

export default class vxCellOverlay {
    private _verticalAlign: vxConstants;
    public get verticalAlign(): vxConstants {
        return this._verticalAlign;
    }
    public set verticalAlign(value: vxConstants) {
        this._verticalAlign = value;
    }
    private _align: vxConstants;
    public get align(): vxConstants {
        return this._align;
    }
    public set align(value: vxConstants) {
        this._align = value;
    }
    private _offset: GeometryPoint;
    public get offset(): GeometryPoint {
        return this._offset;
    }
    public set offset(value: GeometryPoint) {
        this._offset = value;
    }


    constructor(image: vxImage, tooltip: string) {
        //continuar...
    }

    addListener( event:vxEvent ,callback:any){

    }
}