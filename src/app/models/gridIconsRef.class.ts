import { GridDataType } from './gridDataType.enum';

export class GridIconsRef {
    public [GridDataType.RECURRENT]: string;
    public [GridDataType.STARTING]: string;

    private _baseIconPath: string = 'ansm_icons/';

    constructor() {
        this[GridDataType.RECURRENT] = `${this._baseIconPath}recurrent.svg`;
        this[GridDataType.STARTING] = `${this._baseIconPath}starting.svg`;
    }
}
