import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
import { first, map, switchMap, tap } from 'rxjs/operators';
import { Data, DataBreak, DataEntry, GridDataType, IndcTypes, PdctHldSubst } from 'src/app/models';
import { DataEntryService, GridDataService, LoaderService } from 'src/app/services';

enum DisplayStyle {
    FORM,
    GRID
}

interface DataEntryError {
    cd_cip13: number;
    indc: number;
    error: boolean;
}

@Component({
    selector: 'app-data-entry-form',
    templateUrl: './dataEntryForm.component.html',
    styleUrls: ['./dataEntryForm.component.scss']
})
export class DataEntryFormComponent implements OnInit, OnChanges, OnDestroy {

    @Input() data: Array<DataBreak>;
    @Input() listDataFound: Array<DataBreak>;
    @Input() archive: Array<DataBreak>;
    @Input() isAdmin: boolean;
    @Input() currentUser: any;

    @Output() emitIsValidateOrSave: EventEmitter<boolean> = new EventEmitter();
    public dataEntryForm: FormGroup;
    public label: string;
    public stratingData: boolean;
    public presentationData: Array<PdctHldSubst>;
    public saveSuccess: boolean;
    public validateSuccess: boolean;
    public controlError: number;
    public isLabo = false;
    public isValidator = false;
    public errorData = [];
    public gridDataType: typeof GridDataType = GridDataType;
    public displayStyle: typeof DisplayStyle = DisplayStyle;
    public displayFlag: DisplayStyle = DisplayStyle.GRID;
    public dialogValidateGrid: boolean;
    public dialogValidateForm: boolean;
    public dialogDisplayViewChange: boolean;
    public error: boolean;
    public nullValueToSave = [];
    public archiveIdx: number = 0;
    public dataBreak: DataBreak;
    public archivedData: DataBreak;
    public warningStockBiggest: boolean = false;
    public warningStockError: boolean = false;

    private _subsriptions: Subscription = new Subscription();
    private _subscriptionsSave: Subscription = new Subscription();
    private nbChecked: number = 0;
    private afterChecked: boolean;



    constructor(
        public loader: LoaderService,
        public gridData: GridDataService,
        public dataEntryService: DataEntryService,
        private readonly _formBuilder: FormBuilder
    ) {
        if (!this.isAdmin) {
            this.isValidator = true;
        }
        if (!this.isAdmin) {
            this.isLabo = true;
        }
    }

    ngOnInit(): void {
        this.dataEntryForm = this._formBuilder.group({
            session: ['', Validators.required],
            dataToUpdate: this._formBuilder.array([], [Validators.required]),
            dataToCreate: this._formBuilder.array([], [Validators.required]),
        });
        const sub: Subscription = this.gridData.validated.subscribe(this._afterValidate.bind(this));
        const subSave: Subscription = this.gridData.saved.subscribe(this._afterSave.bind(this));
        this._subsriptions.add(sub);
        this._subscriptionsSave.add(subSave);
    }

    ngOnChanges(): void {
        if (this.data && this.dataBreak) {
            const dataBreak = this.data.find(x => x.break.id_break === this.dataBreak.break.id_break);
            this._initSelectSessionAfterReloadData(dataBreak);
        }
    }

    ngOnDestroy(): void {
        this._subsriptions.unsubscribe();
        this._subscriptionsSave.unsubscribe();
    }

    get formControls(): {[key: string]: AbstractControl }  {
        return this.dataEntryForm.controls;
    }

    get canSave(): boolean {
        return (this.formControls.dataToUpdate.valid || this.nullValueToSave.length > 0)
        && this.submitSaveIsActive
        && !this.readOnly;
    }

    get canValidate(): boolean {
        let canValidate = true;
        const dataToUpdate = this.formControls.dataToUpdate.value;
        const dataToCreate = this.formControls.dataToCreate.value;
        this.presentationData.forEach(data => {
            data.data.startingData.forEach(row => {
                if (row.id_indc.fl_indc_mdty === 1
                && !dataToUpdate.find(d => d.id_indc === row.id_indc.id_indc && d.cd_cip13 === row.cd_cip13)) {
                    canValidate = false;
                }
            });
            data.data.recurrentData.forEach(row => {
                if (row.id_indc.fl_indc_mdty === 1
                && (!dataToUpdate.find(d => d.id_indc === row.id_indc.id_indc && d.cd_cip13 === row.cd_cip13)
                    || !dataToCreate.find(d => d.id_indc === row.id_indc.id_indc && d.cd_cip13 === row.cd_cip13))) {
                    canValidate = false;
                }
            });
        });
        return canValidate && !this.hasPendingModif;
    }

    get submitSaveIsActive(): boolean {
        return !this.errorData.find(x => x.error === true);
    }

    get readOnly(): boolean {
        return !this.isLabo || (typeof this.archivedData !== 'undefined' && typeof this.archivedData.data !== 'undefined');
    }

    get areFooterButtonsShown(): boolean {
        return !this.readOnly && this.presentationData && this.archiveIdx === 0;
    }

    get canPrevDate(): boolean {
        return typeof this.archivedData !== 'undefined' && this.archiveIdx < this.archivedData.archivedDataByDate.length;
    }

    get canNextDate(): boolean {
        return typeof this.archivedData !== 'undefined' && this.archiveIdx > 0;
    }

    get hasPendingModif(): boolean {
        if (!this.dataBreak) {
            return false;
        }
        let nbModif = this.dataBreak.data.recurrentData.filter(this._findModifs.bind(this)).length;
        nbModif += this.dataBreak.data.startingData.filter(this._findModifs.bind(this)).length;
        return nbModif > 0;
    }

    public switchDisplayFlag(): void {
        const checkPendingModif: {[key: string]: boolean} = {
            [DisplayStyle.FORM]: this.hasPendingModif,
            [DisplayStyle.GRID]: this.gridData.hasPendingModif
        };
        if (!this.readOnly && checkPendingModif[this.displayFlag] && this.presentationData) {
            this.dialogDisplayViewChange = true;
        } else {
            this.toggleDisplayFlag();
        }
    }

    public toggleDisplayFlag(): void {
        this.nbChecked = 0;
        this.displayFlag = this.displayFlag === DisplayStyle.FORM ? DisplayStyle.GRID : DisplayStyle.FORM;
    }

    public closeDisplayDialog(): void {
        this.dialogDisplayViewChange = false;
    }

    public presentationHasError(presentation: PdctHldSubst): boolean {
        const error = this.errorData.find(x => x.cd_cip13 === presentation.cd_cip13 && x.error === true);
        return typeof error !== 'undefined';
    }

    public presentationIsValid(presentation: PdctHldSubst): boolean {
        const data = presentation.data;
        const nbDataExpected = data.startingData.length + data.recurrentData.length;
        const nbDataResponseFind = this.formControls.dataToUpdate.value.filter(x => x.cd_cip13 === presentation.cd_cip13).length;
        return !this.presentationHasError(presentation) && (nbDataExpected === nbDataResponseFind);
    }

    public prevDate(): void {
        this.archiveIdx++;
        this.archivedData.data = this.archivedData.archivedDataByDate[this.archiveIdx - 1];
        this.selectSession(this.archivedData);
    }

    public nextDate(): void {
        this.archiveIdx--;
        this.archivedData.data = this.archivedData.archivedDataByDate[this.archiveIdx - 1];
        let dataBreak: DataBreak = this.archivedData;
        if (this.archiveIdx === 0) {
            delete this.archivedData.data;
            dataBreak = this.dataBreak;
        }
        this.selectSession(dataBreak);
    }

    public dataEntryHasError(dataEntry: DataEntry): boolean {
        const error: DataEntryError = this.errorData.find(err =>
            (err.cd_cip13 === dataEntry.cd_cip13)
            && (err.indc === dataEntry.id_indc.id_indc)
            && (err.error === true)
        );
        return typeof error !== 'undefined';
    }

    public dataEntryIsValid(dataEntry: DataEntry): boolean {
        const updated: DataEntry = this.formControls.dataToUpdate.value.find(updt =>
            (updt.cd_cip13 === dataEntry.cd_cip13)
            && (updt.id_indc === dataEntry.id_indc.id_indc)
        );
        return typeof updated !== 'undefined';
    }

    public handleOnSearch(e) {
        const value = e.target.value.toUpperCase();
        this.listDataFound = [];
        if (!e.target.value) {
          this.listDataFound = this.data;
          return;
        } else {
          const listDataFound =
            this.data.filter( x =>
              x.break.nm_break.toUpperCase().includes(value)
            );
          listDataFound.forEach(element => {
            if (!this.listDataFound.find(x => x.break.nm_break === element.break.nm_break)) {
              this.listDataFound.push(element);
            }
          });
        }
    }
    public save(): void {
        if (this.displayFlag === this.displayStyle.FORM && !this.canSave) {
            return;
        }
        const saveFuncs: {[key: string]: () => Observable<void>} = {
            [DisplayStyle.FORM]: this.onClickSubmitSave.bind(this),
            [DisplayStyle.GRID]: this.gridData.save.bind(this.gridData)
        };
        saveFuncs[this.displayFlag]()
            .pipe(first())
            .subscribe(this.toggleDisplayFlag.bind(this));
        this.closeDisplayDialog();
    }

    public initSelectSession(dataBreak: DataBreak) {
        this.archiveIdx = 0;
        this.emitIsValidateOrSave.emit(true);
        this.dataBreak = dataBreak;
    }

    public selectSession(dataBreak: DataBreak) {
        this._resetData(dataBreak);
        this._fetchProducts(dataBreak);
        this.archivedData = this._initd(dataBreak);
        this.dataEntryService.nextDtGrnlr = dataBreak.data.nextDtGrnlr;
        this._setDateStart(dataBreak);
        this.dataEntryService.dataBreak = dataBreak;
    }

    public handleResponse(e) {
        this.nbChecked ++;
        this._registerNullValueToUpdate(e);
        this._handleErrorDataToActiveOrErrorClass(e);
        let form: FormArray;
        let dataCreate: DataEntry;
        // Enregistrement des données pour dataUpdate et dataCreate
        if (e.dataForm || e.dataForm === 0 || e.data.id_indc.fl_indc_mdty === 0) {
            let dataUpdate = new DataEntry;
            dataUpdate = {
                id_break: e.data.id_break.id_break,
                id_hld: e.data.id_hld,
                cd_cip13: e.data.cd_cip13,
                id_indc: e.data.id_indc.id_indc,
                fl_indc_mdty: e.data.id_indc.fl_indc_mdty,
                cd_stat_entry: e.data.cd_stat_entry,
                id_usr_crt: e.data.id_usr_crt,
                id_usr_vld: -1,
                ts_crt: new Date(e.data.ts_crt),
                ts_lst_upd: new Date(),
                val_indc: e.data.id_indc.cd_indc_typ === IndcTypes.NUMBER ? parseInt(e.dataForm, 10) : e.dataForm,
                dt_grnlr: e.data.dt_grnlr
            };
            if (e.data.id_indc.cd_indc_faml.includes('IE')) {
                dataCreate = {
                    id_break: e.data.id_break.id_break,
                    id_hld: e.data.id_hld,
                    cd_cip13: e.data.cd_cip13,
                    id_indc: e.data.id_indc.id_indc,
                    fl_indc_mdty: e.data.id_indc.fl_indc_mdty,
                    cd_stat_entry: 'toValidated',
                    id_usr_crt: -1,
                    id_usr_vld: -1,
                    ts_crt: new Date(),
                    ts_lst_upd: new Date(),
                    val_indc: -1,
                    ts_vld: 'null',
                    dt_grnlr: this.dataEntryService.nextDtGrnlr
                };
            }
            // Enregistrement des data precedentes dans le formulaire
            form = this.dataEntryForm.get('dataToUpdate') as FormArray;
            let data = form.controls.find( x => (x.value.id_indc === dataUpdate.id_indc) && (x.value.cd_cip13 === dataUpdate.cd_cip13));
            if (!data) {
                form.push(new FormControl(dataUpdate));
            } else {
                form.controls.forEach((item: FormControl) => {
                    if ((item.value.id_indc === dataUpdate.id_indc) && (item.value.cd_cip13 === dataUpdate.cd_cip13)) {
                        item.value.val_indc = dataUpdate.val_indc;
                    }
                });
            }
            if (dataCreate) {
                form = this.dataEntryForm.get('dataToCreate') as FormArray;
                data = form.controls.find( x => (x.value.id_indc === dataCreate.id_indc) && (x.value.cd_cip13 === dataCreate.cd_cip13));
                if (!data) {
                    form.push(new FormControl(dataCreate));
                } else {
                    form.controls.forEach((item: FormControl) => {
                        if ((item.value.id_indc === dataCreate.id_indc) && (item.value.cd_cip13 === dataCreate.cd_cip13)) {
                            item.value.val_indc = dataCreate.val_indc;
                        }
                    });
                }
            }
        // Si le input est vide alors suppression de la data déjà présente dans le formulaire
        } else {
            let i = 0;
            form = this.dataEntryForm.get('dataToUpdate') as FormArray;
            form.controls.forEach((item: FormControl) => {
                if ((item.value.id_indc === e.data.id_indc.id_indc) && (item.value.cd_cip13 === e.data.cd_cip13)) {
                    form.removeAt(i);
                    return;
                }
                i++;
            });
            i = 0;
            form = this.dataEntryForm.get('dataToCreate') as FormArray;
            form.controls.forEach((item: FormControl) => {
                if ((item.value.id_indc === e.data.id_indc.id_indc) && (item.value.cd_cip13 === e.data.cd_cip13)) {
                    form.removeAt(i);
                    return;
                }
                i++;
            });
        }
    }

    public controlSendedMoreThanStock(dataEntry: DataEntry): boolean {
        this._checkedIfInputFieldUsePresentationOrUpdateData();
        const prevData = this.archivedData ? this.archivedData.archivedDataByDate.find(x => x.nextDtGrnlr === dataEntry.dt_grnlr) : null;
        let prevDataForIndcToVerifiesExiste: DataEntry;
        if (prevData) {
            prevDataForIndcToVerifiesExiste = prevData.recurrentData.find((x: DataEntry) =>
            x.cd_cip13 === dataEntry.cd_cip13 && x.id_indc.cd_indc === 'IE-1');
        }
        const dataToUpdate = this.formControls.dataToUpdate.value.length > 0 ?
        this.formControls.dataToUpdate.value.filter(x => x.cd_cip13 === dataEntry.cd_cip13) : null;
        let valuesExistAndDataNotValidated;
        if (this.afterChecked) {
            valuesExistAndDataNotValidated = (
                dataEntry.cd_stat_entry === 'toValidated'
                && prevData !== null
                && prevDataForIndcToVerifiesExiste
                && dataToUpdate !== null
                && dataToUpdate.find(x =>
                    x.id_indc === 7
                ) !== undefined
                && dataToUpdate.find(x =>
                    x.id_indc === 8
                ) !== undefined
                && dataToUpdate.find(x =>
                    x.id_indc === 22
                ) !== undefined
            );
        } else {
            valuesExistAndDataNotValidated = (
                dataEntry.cd_stat_entry === 'toValidated'
                && prevData !== null
                && prevDataForIndcToVerifiesExiste
                && this.presentationData.find(x =>
                    x.cd_cip13 === dataEntry.cd_cip13
                ).data.recurrentData.find(el =>
                    el.id_indc.cd_indc === 'IE-1'
                ) !== undefined
                && this.presentationData.find(x =>
                    x.cd_cip13 === dataEntry.cd_cip13
                ).data.recurrentData.find(el =>
                    el.id_indc.cd_indc === 'IE-2'
                ) !== undefined
            );
        }
        if (valuesExistAndDataNotValidated && this.afterChecked) {
            const valueSended: number = dataToUpdate.find(x =>
                x.id_indc === 22
            ).val_indc;
            const valueSupply: number = dataToUpdate.find(x =>
                x.id_indc === 8
            ).val_indc;
            const valuePrevStock: number = Number(prevData.recurrentData.find((x: DataEntry) =>
                x.cd_cip13 === dataEntry.cd_cip13 && x.id_indc.cd_indc === 'IE-1'
            ).val_indc);
            return (valueSended && valueSupply) !== null ? valueSended > (valuePrevStock + valueSupply) : false;
        } else if (valuesExistAndDataNotValidated && !this.afterChecked) {
            const valueSended = this.presentationData.find(x =>
                x.cd_cip13 === dataEntry.cd_cip13
            ).data.recurrentData.find(el =>
                el.id_indc.cd_indc === 'IE-16'
            ).val_indc;
            const valueSupply = this.presentationData.find(x =>
                x.cd_cip13 === dataEntry.cd_cip13
            ).data.recurrentData.find(el =>
                el.id_indc.cd_indc === 'IE-2'
            ).val_indc;
            const valuePrevStock: number = Number(prevData.recurrentData.find((x: DataEntry) =>
                x.cd_cip13 === dataEntry.cd_cip13 && x.id_indc.cd_indc === 'IE-1'
            ).val_indc);
            return (valueSended && valueSupply) !== null ? Number(valueSended) > (valuePrevStock + Number(valueSupply)) : false;
        } else {
            return false;
        }
    }

    public controlErreurStock(dataEntry: DataEntry): boolean {
        this._checkedIfInputFieldUsePresentationOrUpdateData();
        const prevData = this.archivedData ? this.archivedData.archivedDataByDate.find(x => x.nextDtGrnlr === dataEntry.dt_grnlr) : null;
        let prevDataForIndcToVerifiesExiste: DataEntry;
        if (prevData) {
            prevDataForIndcToVerifiesExiste = prevData.recurrentData.find((x: DataEntry) =>
            x.cd_cip13 === dataEntry.cd_cip13 && x.id_indc.cd_indc === 'IE-1');
        }
        const dataToUpdate = this.formControls.dataToUpdate.value.length > 0 ?
        this.formControls.dataToUpdate.value.filter(x => x.cd_cip13 === dataEntry.cd_cip13) : null;
        let valuesExistAndDataNotValidated;
        if (this.afterChecked) {
            valuesExistAndDataNotValidated = (
                dataEntry.cd_stat_entry === 'toValidated'
                && prevData !== null
                &&
                prevDataForIndcToVerifiesExiste
                && dataToUpdate !== null
                && dataToUpdate.find(x =>
                    x.id_indc === 7
                ) !== undefined
                && dataToUpdate.find(x =>
                    x.id_indc === 8
                ) !== undefined
                && dataToUpdate.find(x =>
                    x.id_indc === 22
                ) !== undefined
            );
        } else {
            valuesExistAndDataNotValidated = (
                dataEntry.cd_stat_entry === 'toValidated'
                && prevData !== null
                && prevDataForIndcToVerifiesExiste
                && this.presentationData.find(x =>
                    x.cd_cip13 === dataEntry.cd_cip13
                ).data.recurrentData.find(el =>
                    el.id_indc.cd_indc === 'IE-2'
                ) !== undefined
                && this.presentationData.find(x =>
                    x.cd_cip13 === dataEntry.cd_cip13
                ).data.recurrentData.find(el =>
                    el.id_indc.cd_indc === 'IE-16'
                ) !== undefined
            );
        }
        if (valuesExistAndDataNotValidated && this.afterChecked) {
            const valueSended: number = dataToUpdate.find(x =>
                x.id_indc === 22
            ).val_indc;
            const valueSupply: number = dataToUpdate.find(x =>
                x.id_indc === 8
            ).val_indc;
            const valuePrevStock = Number(prevData.recurrentData.find((x: DataEntry) =>
                x.cd_cip13 === dataEntry.cd_cip13 && x.id_indc.cd_indc === 'IE-1'
            ).val_indc);
            const stockTotal = valuePrevStock - valueSended + valueSupply < 0 ? 0 : valuePrevStock - valueSended + valueSupply;
            const valueStock: number = dataToUpdate.find(x =>
                x.id_indc === 7
            ).val_indc;
            return (valueSended && valueSupply && valueStock) !== null ?
                (stockTotal < (valueStock - (valueStock * 0.05)) || stockTotal > (valueStock * 1.05)) : false;
        } else if (valuesExistAndDataNotValidated && !this.afterChecked) {
            const valueSended = this.presentationData.find(x =>
                x.cd_cip13 === dataEntry.cd_cip13
            ).data.recurrentData.find(el =>
                el.id_indc.cd_indc === 'IE-16'
            ).val_indc;
            const valueSupply = this.presentationData.find(x =>
                x.cd_cip13 === dataEntry.cd_cip13
            ).data.recurrentData.find(el =>
                el.id_indc.cd_indc === 'IE-2'
            ).val_indc;
            const valuePrevStock: number = Number(prevData.recurrentData.find((x: DataEntry) =>
                x.cd_cip13 === dataEntry.cd_cip13 && x.id_indc.cd_indc === 'IE-1'
            ).val_indc);
            const stockTotal = (valueSended && valueSupply) !== null ? valuePrevStock - Number(valueSended) + Number(valueSupply) : null;
            const stockMin = stockTotal - Math.abs(stockTotal * 0.05);
            const stockMax = stockTotal + Math.abs(stockTotal * 0.05) < 0 ? 0 : stockTotal + Math.abs(stockTotal * 0.05);
            const valueStock: number = dataEntry.val_indc;
            return (stockTotal && valueStock) !== null ?
                (valueStock < stockMin || valueStock > stockMax) : false;
        } else {
            return false;
        }
    }

    public consistencyCheck(archives: DataBreak) {
        let errorStock = false;
        let errorSended = false;
        const dataToValidate: Array<any> = this.formControls.dataToUpdate.value;
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
                const stockMin = stockTotal !== null ? stockTotal - Math.abs(stockTotal * 0.05) : null;
                const stockMax = stockTotal !== null ?
                    stockTotal + Math.abs(stockTotal * 0.05) < 0 ? 0 : stockTotal + Math.abs(stockTotal * 0.05) : null;
                errorStock = valueStock !== null && stockTotal !== null && (valueStock < stockMin || valueStock > stockMax) ?
                    true : errorStock;
                errorSended = valuePrevStock !== null && valueSupply !== null && Number(element.val_indc) > (valuePrevStock + valueSupply) ?
                    true : errorSended;
            });
        }
        this.warningStockError = errorStock;
        this.warningStockBiggest = errorSended;
    }

    public onClickValidate() {
        if (!this.canValidate || !this.isValidator) {
            return;
        }
        this.formControls.dataToUpdate.value.forEach(element => {
            if (element.id_usr_crt === null) {
                element.id_usr_crt = this.currentUser.id;
            }
            element.id_usr_vld = this.currentUser.id;
            element.cd_stat_entry = 'validated';
            element.ts_vld = new Date();
        });
        this.dataEntryService.updateDataEntry(this.formControls.dataToUpdate.value).pipe(
            first(),
            switchMap(d =>
                this._createDataEntry(this.formControls.dataToCreate.value)),
            switchMap(d =>
                this.dataEntryService.controlDataEntry(this.formControls.dataToUpdate.value[0])),
        )
        .subscribe(
            (resp) => this._afterValidate(resp),
            () => this._onError()
        );
    }

    public onClickSubmitSave(): Observable<boolean> {
        if (!this.canSave) {
            return;
        }
        this.presentationData.forEach(x => {
            x.data.startingData.forEach(startingData => {
                const data = this.formControls.dataToUpdate.value.find(dataToUpdate =>
                    dataToUpdate.cd_cip13 === startingData.cd_cip13 &&
                    dataToUpdate.id_indc === startingData.id_indc.id_indc &&
                    // tslint:disable-next-line: triple-equals
                    dataToUpdate.val_indc != startingData.val_indc
                );
                if (data) {
                    data.id_usr_crt = this.currentUser.id;
                }
            });
            x.data.recurrentData.forEach(recurrentData => {
                const data = this.formControls.dataToUpdate.value.find(dataToUpdate =>
                    dataToUpdate.cd_cip13 === recurrentData.cd_cip13 &&
                    dataToUpdate.id_indc === recurrentData.id_indc.id_indc &&
                    // tslint:disable-next-line: triple-equals
                    dataToUpdate.val_indc != recurrentData.val_indc
                );
                if (data) {
                    data.id_usr_crt = this.currentUser.id;
                }
            });
        });
        this.formControls.dataToUpdate.value.forEach(element => {
            if (element.id_usr_crt === null) {
                element.id_usr_crt = -1;
            }
        });
        // Si btn fonctionel
        const dataToUpdateWithNullValue: DataEntry[] = [];
        this.nullValueToSave.forEach(e => {
            const dataUpdate = {
                id_break: e.id_break.id_break,
                id_hld: e.id_hld,
                cd_cip13: e.cd_cip13,
                id_indc: e.id_indc.id_indc,
                cd_stat_entry: e.cd_stat_entry,
                id_usr_crt: this.currentUser.id,
                id_usr_vld: -1,
                ts_crt: new Date(e.ts_crt),
                ts_lst_upd: new Date(),
                dt_grnlr: e.dt_grnlr
            };
            dataToUpdateWithNullValue.push(dataUpdate);
        });
        if (dataToUpdateWithNullValue.length > 0) {
            this.formControls.dataToUpdate.value.forEach(element => dataToUpdateWithNullValue.push(element));
            return this._saveDataEntries(dataToUpdateWithNullValue);
        }
        return this._saveDataEntries(this.formControls.dataToUpdate.value);
    }

    private _checkedIfInputFieldUsePresentationOrUpdateData() {
        let nbCheked: number = 0;
        this.presentationData.forEach(x => x.data.recurrentData.forEach(el => {
            nbCheked ++;
        }));
        this.presentationData.forEach(x => x.data.startingData.forEach(el => {
            nbCheked ++;
        }));
        if (this.nbChecked > nbCheked) {
            this.afterChecked = true;
        } else {
            this.afterChecked = false;
        }
    }

    private _initSelectSessionAfterReloadData(dataBreak: DataBreak) {
        this.dataBreak = dataBreak;
        this.selectSession(dataBreak);
    }

    private _saveDataEntries(dataToSave: Array<DataEntry>): Observable<boolean> {
        let obs: Observable<boolean>;
        obs = this._updateDataEntry(dataToSave).pipe(
            first(),
            tap(resp => this._applyData(dataToSave))
        );
        obs.subscribe(
            resp => this._afterSave(resp),
            this._onError.bind(this)
        );
        return obs;
    }

    private _resetData(data?: DataBreak) {
        this.warningStockBiggest = false;
        this.warningStockError = false;
        this.nbChecked = 0;
        this.nullValueToSave = [];
        this.errorData = [];
        this.label = undefined;
        this.archivedData = undefined;
        this.dataEntryService.dateStart = undefined;
        this.dataEntryService.dateEnd = undefined;
        this.presentationData = undefined;
        if (data) {
            this.dataEntryForm = this._formBuilder.group({
                session: ['', Validators.required],
                dataToUpdate: this._formBuilder.array([], [Validators.required]),
                dataToCreate: this._formBuilder.array([], [Validators.required]),
            });
            this.formControls.session.setValue(data);
            this.label = data.break.nm_break;
        }
    }

    private _fetchProducts(dataBreak: DataBreak) {
        const id: number[] = this._getUniqueCdCip13List(dataBreak);
        const resp = require('src/app/mocks/pdctMocks.app.json')
        this.presentationData = [];
        resp.forEach(element => {
            this.presentationData.push(element);
        });
        this._sortData();
    }

    private _getUniqueCdCip13List(dataBreak: DataBreak): Array<number> {
        return [
            ...new Set([
                ...dataBreak.data.startingData.map(d => d.cd_cip13),
                ...dataBreak.data.recurrentData.map(d => d.cd_cip13)
            ])
        ];
    }

    private _setDateStart(dataBreak: DataBreak): void {
        this.dataEntryService.dateEnd = new Date(dataBreak.data.endDate);
        this.dataEntryService.dateStart = new Date(dataBreak.data.startDate);
    }

    // Compte et trie les datas à afficher en fonction du produit
    private _sortData() {
        const startingData = this.formControls.session.value.data.startingData;
        const recurrentData = this.formControls.session.value.data.recurrentData;
        this.presentationData.forEach(elem => {
            elem.data = new Data;
            elem.data.startingData = startingData
                .filter(x => (x.cd_cip13 === elem.cd_cip13))
                .sort((a: DataEntry, b: DataEntry) => a.id_indc.nb_ord > b.id_indc.nb_ord ? 1 : -1);
            elem.data.recurrentData = recurrentData
                .filter(x => (x.cd_cip13 === elem.cd_cip13))
                .sort((a: DataEntry, b: DataEntry) => a.id_indc.nb_ord > b.id_indc.nb_ord ? 1 : -1);
        });
        this.presentationData.sort(function(a: PdctHldSubst, b: PdctHldSubst) {
            const cipA = a.cd_cip13;
            const cipB = b.cd_cip13;
            if (cipA < cipB) {
                return -1;
            } else if (cipA > cipB) {
                return 1;
            } else {
                const nA = a.nm_medic.toLowerCase();
                const nB = b.nm_medic.toLowerCase();
                if (nA < nB) {
                    return -1;
                } else if (nA > nB) {
                    return 1;
                } else {
                    const lA = a.ll_prest.toLowerCase();
                    const lB = b.ll_prest.toLowerCase();
                    if (lA < lB) {
                        return -1;
                    } else if (lA > lB) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            }
        });
        // this.presentationData.sort(function(a: PdctHldSubst, b: PdctHldSubst) {
        //     const nA = a.ll_prest.toLowerCase();
        //     const nB = b.ll_prest.toLowerCase();
        //     if (nA < nB) {
        //         return -1;
        //     } else if (nA > nB) {
        //         return 1;
        //     } else {
        //         return 0;
        //     }
        // });
    }

    private _updateDataEntry(results: Array<DataEntry>): Observable<boolean> {
        return this.dataEntryService.updateDataEntry(results)
        .pipe(map(
          (resp) => {
              return resp;
            },
          (err) => {
            return err;
          }
        ));
    }

    private _createDataEntry(results: Array<any>): Observable<boolean> {
        const newDataEntries = [];
        results.forEach(element => {
            newDataEntries.push(element);
        });
        if (newDataEntries.length < 1) {
          return of(true);
        } else {
            return this.dataEntryService.createDataEntry(newDataEntries)
            .pipe(map(
              (resp) => {
                return true;
              },
              (err) => {
                return err;
            }));
        }
    }

    private _handleErrorDataToActiveOrErrorClass(e) {
        const data = this.errorData.find(x => x.cd_cip13 === e.data.cd_cip13 && x.indc === e.data.id_indc.id_indc);
        if (data) {
            data.error = e.error;
        } else {
            this.errorData.push({
                cd_cip13: e.data.cd_cip13,
                indc: e.data.id_indc.id_indc,
                error: e.error
            });
        }
    }

    // Si btn null fonctionel
    private _registerNullValueToUpdate(data) {
        const dataToRegister = data.data;
        const dataAlreadyRegister = this.nullValueToSave.find(x =>
            x.cd_cip13 === dataToRegister.cd_cip13 && x.id_indc.id_indc === dataToRegister.id_indc.id_indc
        );
        if (dataAlreadyRegister && !data.null) {
            let i = 0;
            this.nullValueToSave.forEach((element) => {
                if (element.cd_cip13 === dataToRegister.cd_cip13 && element.id_indc.id_indc === dataToRegister.id_indc.id_indc) {
                    this.nullValueToSave.splice(i, 1);
                    return;
                }
                i++;
            });
        } else if (!dataAlreadyRegister && data.null) {
            this.nullValueToSave.push(dataToRegister);
        }
    }

    private _afterSave(response: boolean): void {
        if (!response) {
            return;
        }
        this.emitIsValidateOrSave.emit(true);
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 4000);
    }

    private _afterValidate(resp: number): void {
        if (resp === 0) {
          this.validateSuccess = true;
          setTimeout(() => this.validateSuccess = false, 4000);
        } else {
          this.controlError = resp;
          setTimeout(() => this.controlError = undefined, 4000);
        }
        this._resetData();
        this.dataBreak = undefined;
        this.emitIsValidateOrSave.emit(true);
    }

    private _onError(): void {
        this.error = true;
        setTimeout(() => this.error = false, 4000);
    }

    private _applyData(dataSaved: Array<DataEntry>): void {
        dataSaved.forEach(d => {
            const rowOrig: PdctHldSubst = this.presentationData.find(row => row.cd_cip13 === d.cd_cip13);
            let indc: DataEntry = rowOrig.data.recurrentData.find(entry => entry.id_indc.id_indc === (d.id_indc as unknown));
            if (typeof indc === 'undefined') {
                indc = rowOrig.data.startingData.find(entry => entry.id_indc.id_indc === (d.id_indc as unknown));
            }
            if (typeof indc !== 'undefined') {
                indc.val_indc = d.val_indc;
            }
        });
    }

    private _initd(dataBreak: DataBreak): DataBreak {
        const archives: DataBreak =  this.archive.find(d => d.break.id_break === dataBreak.break.id_break);
        if (archives) {
            archives.archivedDataByDate.sort((a: Data, b: Data) => a.date < b.date ? 1 : -1);
        }
        return archives;
    }

    private _findModifs(valOrigin: DataEntry): boolean {

        const getModifData = (data) => {
            return data.value.find(row =>
                row.id_indc === valOrigin.id_indc.id_indc
                && row.cd_cip13 === valOrigin.cd_cip13
            );
        };

        let modif = getModifData(this.formControls.dataToUpdate);
        if (!modif) {
            modif = getModifData(this.formControls.dataToCreate);
        }
        if (modif &&
        (valOrigin.id_indc.cd_indc_typ === IndcTypes.TEXT
        || valOrigin.val_indc === null
        || modif.val_indc == null)) {
            return valOrigin.val_indc !== modif.val_indc;
        } else if (modif && valOrigin.id_indc.cd_indc_typ === IndcTypes.NUMBER) {
            return parseInt(valOrigin.val_indc.toString(), 10) !== modif.val_indc;
        }
        return !modif && valOrigin.val_indc !== null;
    }
}
