export default class GeometryPoint{
   private _x: number;
    public get x(): number {
        return this._x;
    }
    public set x(value: number) {
        this._x = value;
    }

    private _y: number;
    public get y(): number {
        return this._y;
    }
    public set y(value: number) {
        this._y = value;
    }

    constructor(x, y){
        this.x=x;
        this.y=y;
    }
}