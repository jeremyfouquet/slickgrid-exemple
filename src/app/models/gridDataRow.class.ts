import { PdctHldSubst } from './PdctHldSubst';
import { GridDataType } from './gridDataType.enum';
import { DataEntry } from './dataEntry';
import { GridCellToSave } from './gridCellToSave.class';
import { GridCellToValidate } from './gridCellToValidate.class';
import { GridCellToCreate } from './gridCellToCreate.class';
import { IndcTypes } from './indcTypes.enum';

export class GridDataRow {
    public id: number;
    public cd_cip13: number;
    public nm_medic: string;
    public ll_prest: string;
    public idUser: number;

    private _dataType: GridDataType;
    private _rowOrigin: PdctHldSubst;

    constructor(_: PdctHldSubst, dataType: GridDataType, idUser: number) {
        this.id = _.cd_cip13;
        this.cd_cip13 = _.cd_cip13;
        this.nm_medic = _.nm_medic;
        this.ll_prest = _.ll_prest;
        this._rowOrigin = _;
        this._dataType = dataType;
        this.idUser = idUser;
        _.data[dataType].forEach(d => this[d.id_indc.cd_indc] = d.val_indc);
    }

    get canValidate(): boolean {
        let canValidate = true;
        this._rowOrigin.data[this._dataType].forEach(d => {
            if (d.id_indc.fl_indc_mdty === 1
            && (this._hasValueChanged(d) || d.cd_stat_entry !== 'toValidated')) {
                canValidate = false;
            }
        });
        return canValidate;
    }

    get nbEmptyValue(): number {
        return this._rowOrigin.data[this._dataType].reduce((count, d) => {
            const val: string | number = this[d.id_indc.cd_indc];
            if (d.id_indc.fl_indc_mdty === 1 && (val === null || val === '')) {
                count++;
            }
            return count;
        }, 0);
    }

    get dataToSave(): Array<GridCellToSave> {
        return this._rowOrigin.data[this._dataType]
            .filter(this._hasValueChanged.bind(this))
            .map(d => new GridCellToSave(d, this));
    }

    get dataToValidate(): Array<GridCellToValidate> {
        return this._rowOrigin.data[this._dataType]
            .map(d => new GridCellToValidate(d, this));
    }

    get dataToCreate(): Array<GridCellToCreate> {
        return this._rowOrigin.data[this._dataType]
            .map(d => new GridCellToCreate(d, this));
    }

    private _hasValueChanged(d: DataEntry): boolean {
        const currVal: string|number = this[d.id_indc.cd_indc];
        const origVal: string|number = d.val_indc;
        const typeVal: string = d.id_indc.cd_indc_typ;
        if (currVal === origVal) {
            return false;
        } else if (currVal === null || currVal === '') {
            return origVal !== null;
        } else if (origVal === null) {
            return currVal !== null && currVal !== '';
        } else if (typeVal === IndcTypes.TEXT) {
            return currVal !== origVal;
        } else if (typeVal === IndcTypes.NUMBER) {
            return parseInt(currVal as string, 10) !== parseInt(origVal.toString(), 10)
            && currVal !== origVal;
        }
    }
}
