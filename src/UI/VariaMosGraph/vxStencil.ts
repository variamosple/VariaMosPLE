export default class vxStencil {
    private _type: string;
    private _xmlShape: string;

    constructor(type: string, xmlShape: string) {
        this._type = type;
        this._xmlShape = xmlShape;
    }

    // Getter y Setter para type
    get type(): string {
        return this._type;
    }

    set type(value: string) {
        this._type = value;
    }

    // Getter y Setter para xmlShape
    get xmlShape(): string {
        return this._xmlShape;
    }

    set xmlShape(value: string) {
        this._xmlShape = value;
    }
}
