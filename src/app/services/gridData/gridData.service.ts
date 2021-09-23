import { Injectable, EventEmitter } from '@angular/core';
import { DataEntry, GridDataRow, GridDataType, PdctHldSubst, DataBreak } from 'src/app/models';
import { first, switchMap, map } from 'rxjs/operators';
import { DataEntryService } from '../dataEntry';
import { of, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GridDataService {

    public saveSuccess: boolean = false;
    public error: boolean = false;
    public validated: EventEmitter<number> = new EventEmitter();
    public saved: EventEmitter<boolean> = new EventEmitter();

    private _dataOrigin: Array<PdctHldSubst>;
    private _data: {[key: string]: Array<GridDataRow>} = {
        [GridDataType.RECURRENT]: [],
        [GridDataType.STARTING]: []
    };

    constructor(
        private _dataEntry: DataEntryService) {}

    get canValidate(): boolean {
        const hasEmptyValues: boolean = (
            this._data[GridDataType.RECURRENT].reduce((c, d) => c += d.nbEmptyValue, 0) +
            this._data[GridDataType.STARTING].reduce((c, d) => c += d.nbEmptyValue, 0)
        ) > 0;
        return this._canValidate(GridDataType.RECURRENT)
            && this._canValidate(GridDataType.STARTING)
            && !hasEmptyValues;
    }

    get hasPendingModif(): boolean {
        return [
            ...this._getDataToSave(GridDataType.RECURRENT),
            ...this._getDataToSave(GridDataType.STARTING)
        ].length > 0;
    }

    public setData(data: Array<PdctHldSubst>, type: GridDataType): void {
        const idUser: number = require('src/app/mocks/userMocks.app.json').id;
        let newData = data;
        newData = data.filter(x => x.data[type].length > 0);
        this._dataOrigin = newData;
        this._data[type] = newData.map(row => new GridDataRow(row, type, idUser));
    }

    public getData(type: GridDataType): Array<GridDataRow> {
        return this._data[type];
    }

    public controlStockError(archives: DataBreak): boolean {
        let errorStock = false;
        const dataToValidate: Array<any> = [
        ...this._getDataToValidate(GridDataType.RECURRENT),
        ...this._getDataToValidate(GridDataType.STARTING)
        ];
        const prevData = archives ? archives.archivedDataByDate.find(x => x.nextDtGrnlr === dataToValidate[0].dt_grnlr) : null;
        const originData = archives ? archives.archivedDataByDate.find(x => x.date === dataToValidate[0].dt_grnlr) : null;
        let valuesPrevStock: Array<DataEntry>;
        let valuesStockOrigin: Array<DataEntry> = new Array;
        let valuesSupplyOrigin: Array<DataEntry> = new Array;
        let valuesSendedOrigin: Array<DataEntry> = new Array;
        if (prevData) {
            valuesPrevStock = prevData.recurrentData.filter((x: DataEntry) =>
            x.id_indc.cd_indc === 'IE-1');
        }
        if (originData) {
            valuesStockOrigin = originData.recurrentData.filter(x => x.id_indc.id_indc === 7);
            valuesSupplyOrigin = originData.recurrentData.filter(x => x.id_indc.id_indc === 8);
            valuesSendedOrigin = originData.recurrentData.filter(x => x.id_indc.id_indc === 22);
        }
        const valuesStock = dataToValidate.filter(x => x.id_indc === 7).concat(valuesStockOrigin);
        const valuesSupply = dataToValidate.filter(x => x.id_indc === 8).concat(valuesSupplyOrigin);
        const valuesSended = dataToValidate.filter(x => x.id_indc === 22).concat(valuesSendedOrigin);
        if (
            valuesPrevStock
            &&
            valuesStock.length > 0
            &&
            valuesSupply.length > 0
            &&
            valuesSended.length > 0
        ) {
            valuesSended.forEach(element => {
                const dataPrevStock = valuesPrevStock.find((x: DataEntry) =>
                    x.cd_cip13 === element.cd_cip13
                );
                const valuePrevStock = dataPrevStock ? Number(dataPrevStock.val_indc) : null;
                const datavaluesSupply = valuesSupply.find(x =>
                    x.cd_cip13 === element.cd_cip13
                );
                const valueSupply = datavaluesSupply ? Number(datavaluesSupply.val_indc) : null;
                const dataStock = valuesStock.find((x: DataEntry) =>
                    x.cd_cip13 === element.cd_cip13
                );
                const valueStock = dataStock ? Number(dataStock.val_indc) : null;
                const stockTotal = valuePrevStock !== null && valueSupply !== null ?
                    valuePrevStock - Number(element.val_indc) + valueSupply : null;
                const stockMin = stockTotal !== null ?
                    stockTotal - Math.abs(stockTotal * 0.05) : null;
                const stockMax = stockTotal !== null ?
                    stockTotal + Math.abs(stockTotal * 0.05) < 0 ? 0 : stockTotal + Math.abs(stockTotal * 0.05) : null;
                errorStock = valueStock !== null && stockTotal !== null && (valueStock < stockMin || valueStock > stockMax) ?
                    true : errorStock;
            });
        }
        return errorStock;
    }

    public controlStockBiggest(archives: DataBreak): boolean {
        let errorSended = false;
        const dataToValidate: Array<any> = [
        ...this._getDataToValidate(GridDataType.RECURRENT),
        ...this._getDataToValidate(GridDataType.STARTING)
        ];
        const prevData = archives ? archives.archivedDataByDate.find(x => x.nextDtGrnlr === dataToValidate[0].dt_grnlr) : null;
        const originData = archives ? archives.archivedDataByDate.find(x => x.date === dataToValidate[0].dt_grnlr) : null;
        let valuesPrevStock: Array<DataEntry>;
        let valuesStockOrigin: Array<DataEntry> = new Array;
        let valuesSupplyOrigin: Array<DataEntry> = new Array;
        let valuesSendedOrigin: Array<DataEntry> = new Array;
        if (prevData) {
            valuesPrevStock = prevData.recurrentData.filter((x: DataEntry) =>
            x.id_indc.cd_indc === 'IE-1');
        }
        if (originData) {
            valuesStockOrigin = originData.recurrentData.filter(x => x.id_indc.id_indc === 7);
            valuesSupplyOrigin = originData.recurrentData.filter(x => x.id_indc.id_indc === 8);
            valuesSendedOrigin = originData.recurrentData.filter(x => x.id_indc.id_indc === 22);
        }
        const valuesStock = dataToValidate.filter(x => x.id_indc === 7).concat(valuesStockOrigin);
        const valuesSupply = dataToValidate.filter(x => x.id_indc === 8).concat(valuesSupplyOrigin);
        const valuesSended = dataToValidate.filter(x => x.id_indc === 22).concat(valuesSendedOrigin);
        if (
            valuesPrevStock
            &&
            valuesStock.length > 0
            &&
            valuesSupply.length > 0
            &&
            valuesSended.length > 0
        ) {
            valuesSended.forEach(element => {
                const dataPrevStock = valuesPrevStock.find((x: DataEntry) =>
                    x.cd_cip13 === element.cd_cip13
                );
                const valuePrevStock = dataPrevStock ? Number(dataPrevStock.val_indc) : null;
                const datavaluesSupply = valuesSupply.find(x =>
                    x.cd_cip13 === element.cd_cip13
                );
                const valueSupply = datavaluesSupply ? Number(datavaluesSupply.val_indc) : null;
                errorSended = valuePrevStock !== null && valueSupply !== null && Number(element.val_indc) > (valuePrevStock + valueSupply) ?
                    true : errorSended;
            });
        }
        return errorSended;
    }

    public save(): Observable<void> {
        const dataToSave: Array<DataEntry> = [
            ...this._getDataToSave(GridDataType.RECURRENT),
            ...this._getDataToSave(GridDataType.STARTING)
        ];
        if (dataToSave.length === 0) {
            return of(null);
        }
        const obs: Observable<void> = this._dataEntry.updateDataEntry(dataToSave);
        obs.pipe(
            first())
            .subscribe(
                () => {
                this._updateValues(GridDataType.STARTING);
                this._updateValues(GridDataType.RECURRENT);
                this.saved.emit(true);
                this._saveSuccess();
                },
                this._onError.bind(this));
        return obs;
    }

    public validate(): void {
        const dataToCreate: Array<DataEntry> = this._getDataToCreate(GridDataType.RECURRENT);
        const dataToValidate: Array<DataEntry> = [
            ...this._getDataToValidate(GridDataType.RECURRENT),
            ...this._getDataToValidate(GridDataType.STARTING)
        ];
        if (dataToValidate.length === 0) {
            return;
        }
        this._dataEntry.updateDataEntry(dataToValidate)
        .pipe(
            first(),
            switchMap(d => this._setNextDate(dataToCreate, this._dataEntry.nextDtGrnlr)),
            switchMap(toCreate => this._createDataEntry(toCreate)),
            switchMap(created => this._dataEntry.controlDataEntry(dataToValidate[0])),
        )
        .subscribe(
            (resp) => {
                this.validated.emit(resp);
            },
            this._onError.bind(this)
        );
    }

    private _getDataToSave(type: GridDataType): Array<DataEntry> {
        return this._data[type].reduce((acc, dataRow) =>
            acc = [...acc, ...dataRow.dataToSave]
        , []) as Array<DataEntry>;
    }

    private _getDataToValidate(type: GridDataType): Array<DataEntry> {
        return this._data[type].reduce((acc, dataRow) =>
            acc = [...acc, ...dataRow.dataToValidate]
        , []) as Array<DataEntry>;
    }

    private _getDataToCreate(type: GridDataType): Array<DataEntry> {
        return this._data[type].reduce((acc, dataRow) =>
            acc = [...acc, ...dataRow.dataToCreate]
        , []) as Array<DataEntry>;
    }

    private _canValidate(type: GridDataType): boolean {
        let canValidate = true;
        this._data[type].forEach(d => {
            if (!d.canValidate) {
                canValidate = false;
            }
        });
        return canValidate;
    }

    private _saveSuccess(): void {
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 4000);
    }

    private _updateValues(type: GridDataType): void {
        this._getDataToSave(type).forEach(d => {
            const rowOrig: PdctHldSubst = this._dataOrigin.find(row => row.cd_cip13 === d.cd_cip13);
            const indc: DataEntry = rowOrig.data[type].find(entry => entry.id_indc.id_indc === (d.id_indc as unknown));
            indc.val_indc = d.val_indc;
        });
    }

    private _onError(): void {
        this.error = true;
        setTimeout(() => this.error = false, 4000);
    }

    private _setNextDate(dataToCreate: Array<any>, nextDate: string): Observable<Array<DataEntry>> {
        const newDataEntries = [];
        dataToCreate.forEach(d => {
                d.dt_grnlr = nextDate;
                newDataEntries.push(d);
        });
        return of(newDataEntries);
    }

    private _createDataEntry(newDataEntries: Array<any>): Observable<any> {
        if (newDataEntries.length < 1) {
            return of(true);
          } else {
              return this._dataEntry.createDataEntry(newDataEntries)
              .pipe(map(
                (resp) => {
                  return true;
                },
                (err) => {
                  return err;
              }));
          }
    }
}
