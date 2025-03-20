export default class vxImage {
    private _url: string;  //let url = "data:image/png;base64," + base64Icon;
    private _width: number;
    private _height: number;

    constructor(url: string, width: number, height: number) {
        this._url = url;
        this._width = width;
        this._height = height;
    }

    // Getter y Setter para url
    get url(): string {
        return this._url;
    }

    set url(value: string) {
        this._url = value;
    }

    // Getter y Setter para width
    get width(): number {
        return this._width;
    }

    set width(value: number) {
        this._width = value;
    }

    // Getter y Setter para height
    get height(): number {
        return this._height;
    }

    set height(value: number) {
        this._height = value;
    }
}