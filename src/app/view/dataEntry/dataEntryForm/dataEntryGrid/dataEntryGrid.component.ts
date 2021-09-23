import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AngularGridInstance, Column, Editors, EditorValidatorOutput, FieldType, GridOption, HeaderButtonItem, OnEventArgs } from 'angular-slickgrid';
import { DataBreak, DataEntry, GridCallbackArgs, GridDataRow, GridDataType, GridIconsRef, IndcTypes, PdctHldSubst } from 'src/app/models';
import { GridDataService } from 'src/app/services';
import { v4 as uuid } from 'uuid';

enum GridError {
    INVALID_NUMBER_VALUE
}

@Component({
    selector: 'app-data-entry-grid',
    templateUrl: './dataEntryGrid.component.html',
    styleUrls: ['./dataEntryGrid.component.scss']
})
export class DataEntryGridComponent implements OnInit {
    @Input() data: Array<PdctHldSubst>;
    // DIFF
    @Input() archivedData: DataBreak;
    // DIFF
    @Input() dataType: GridDataType;
    @Input() gridTitle: string;
    @Input() readOnly: boolean;

    public containerId: string = uuid();
    public columnDefinitions: Column[];
    public gridOptions: GridOption;
    public grid: AngularGridInstance;
    public gridIcons: GridIconsRef = new GridIconsRef();
    public error: GridError;
    public gridErrors: typeof GridError = GridError;
    _validateNumberPattern: RegExp = /(?=^.{0,12}$)^\d*$/;

    private _rowHeight: number = 100;
    private _collapsable: Array<string> = ['nm_medic', 'll_prest'];
    private _nbFrozenCol: number = 2;

    constructor(
        public gridData: GridDataService,
        private _transalte: TranslateService) {}

    get hasData(): boolean { return this.data.find(x => x.data[this.dataType].length > 0) ? true : false; }

    get gridHeight(): number {
        const bodyHeight = this._rowHeight * this.gridData.getData(this.dataType).length;
        const headerPadding = 5;
        const scrollbarSize = 20;
        const headerHeight = this._rowHeight + (2 * headerPadding);
        return bodyHeight + headerHeight + scrollbarSize;
    }

    ngOnInit(): void {
        this._initGridData();
        this._initColumnDefinitions();
        this._initGridOptions();

    }

    // DIFF
    private _controlSendedMoreThanStock(dataContext: any): boolean {
        // si indc 22 de data > (indc 7 de prevData + indc 8 de data)
        // alors warning "Unités expédiée par le laboratoire trop importantes"
        // Unités expédiées supérieur à : Stock indiqué lors de la dernière saisie + Approvisionnement sur la periode de saisie
        const DataToDtGrnlr = dataContext['_rowOrigin'].data[GridDataType.RECURRENT][0];
        const prevData = this.archivedData && DataToDtGrnlr ?
            this.archivedData.archivedDataByDate.find(x => x.nextDtGrnlr === DataToDtGrnlr.dt_grnlr) : null;
        let prevDataForIndcToVerifiesExiste: DataEntry;
        if (prevData) {
            prevDataForIndcToVerifiesExiste = prevData.recurrentData.find((x: DataEntry) =>
            x.cd_cip13 === dataContext.cd_cip13 && x.id_indc.cd_indc === 'IE-1');
        }
        const valuesExistAndDataNotValidated: boolean = (
            this.data[0].data.recurrentData[0].cd_stat_entry === 'toValidated'
            && !this.readOnly
            && prevDataForIndcToVerifiesExiste
            && dataContext['IE-1'] !== undefined
            && dataContext['IE-2'] !== undefined
        );
        if (valuesExistAndDataNotValidated) {
            const valueSended: number = dataContext['IE-16'] !== null ? Number(dataContext['IE-16']) : null;
            const valueSupply: number = dataContext['IE-2'] !== null ? Number(dataContext['IE-2']) : null;
            const valuePrevStock = Number(prevData.recurrentData.find((x: DataEntry) =>
                x.cd_cip13 === dataContext.cd_cip13 && x.id_indc.cd_indc === 'IE-1'
            ).val_indc);
            return (valueSended && valueSupply) !== null ? valueSended > (valuePrevStock + valueSupply) : false;
        } else {
            return false;
        }
    }

    private _controlErreurStock(dataContext: any) {
        // si
        // indc 7 de prevData - indc 22 de data + indc 8 de data < indc 7 de data - 5% de indc 7 de data
        // ||
        // indc 7 de prevData - indc 22 de data + indc 8 de data > indc 7 de data + 5% de indc 7 de data
        // alors warning "Stock à date incohérent"
        // Le stock ne correspond pas à : Stock indiqué à la dernière saisie + Appro sur la periode de saisie - Unités expédiées
        const DataToDtGrnlr = dataContext['_rowOrigin'].data[GridDataType.RECURRENT][0];
        const prevData = this.archivedData && DataToDtGrnlr ?
            this.archivedData.archivedDataByDate.find(x => x.nextDtGrnlr === DataToDtGrnlr.dt_grnlr) : null;
        let prevDataForIndcToVerifiesExiste: DataEntry;
        if (prevData) {
            prevDataForIndcToVerifiesExiste = prevData.recurrentData.find((x: DataEntry) =>
            x.cd_cip13 === dataContext.cd_cip13 && x.id_indc.cd_indc === 'IE-1');
        }
        const valuesExistAndDataNotValidated: boolean = (
            this.data[0].data.recurrentData[0].cd_stat_entry === 'toValidated'
            && !this.readOnly
            && prevDataForIndcToVerifiesExiste
            && dataContext['IE-2'] !== undefined
            && dataContext['IE-16'] !== undefined
        );
        if (valuesExistAndDataNotValidated) {
            const valueSended: number = dataContext['IE-16'] !== null ? Number(dataContext['IE-16']) : null;
            const valueSupply: number = dataContext['IE-2'] !== null ? Number(dataContext['IE-2']) : null;
            const prevNumber = prevData.recurrentData.find((x: DataEntry) =>
                x.cd_cip13 === dataContext.cd_cip13 && x.id_indc.cd_indc === 'IE-1'
            );
            const valuePrevStock = prevNumber && prevNumber.val_indc ? Number(prevNumber.val_indc) : 0;
            const stockTotal = valuePrevStock - valueSended + valueSupply;
            const stockMin = stockTotal - Math.abs(stockTotal * 0.05);
            const stockMax = stockTotal + Math.abs(stockTotal * 0.05) < 0 ? 0 : stockTotal + Math.abs(stockTotal * 0.05);
            const valueStock: number = dataContext['IE-1'] !== null ? Number(dataContext['IE-1']) : null;
            return (valueSended && valueSupply && valueStock) !== null ?
                (valueStock < stockMin || valueStock > stockMax) : false;
        } else {
            return false;
        }
    }
    // DIFF

    public gridReady(angularGrid: AngularGridInstance): void {
        console.log('GRID IS READY', angularGrid);
        this.grid = angularGrid;
        this.grid.dataView.fastSort('cd_cip13', true);
        window.onresize = () => this.grid.resizerService.resizeGrid();
        this.grid.slickGrid.onActiveCellChanged.subscribe(function(e, args) {
            console.log('ON CELL ACTIVED HAS CHANGED !!!!!');
            console.log('args', args);
            console.log('cellActive', args.grid.getActiveCell());
            console.log('selection rows', args.grid.getSelectedRows());
            console.log('selection model ranges', args.grid.getSelectionModel().getSelectedRanges());
        });
    }

    public cellClicked(): void {
        console.log('CELL CLICKED !!!!!');
        this.grid.slickGrid.getEditorLock().commitCurrentEdit();
    }

    private _makeEditable(column: Column): void {
        column.editor = { model: Editors.text };
        // console.log('column !!!!!!', column);
        column.onCellClick = (e: Event, args: OnEventArgs) => {
            console.log('ARGS ON CLICK', args);
            const row = args.row;
            const cell = args.cell;
            const cellActive = this.grid.slickGrid.getActiveCell();
            if (cellActive.row !== row && cellActive.cell !== cell) {
                this.grid.slickGrid.setActiveCell(row, cell);
            }
        };
        if (column.type === FieldType.number) {
            column.onCellChange = (e: Event, args: OnEventArgs) => this._trimValue(args);
            column.editor.validator = this._validateCellValue.bind(this);
        }
    }

    private _initColumnDefinitions(): void {
        this.columnDefinitions = [
            this._buildColDef('CIP 13', 'cd_cip13', 130),
            this._buildColDef('_DataEntry_specialy_', 'nm_medic', 350),
            this._buildColDef('_DataEntry_presentation_', 'll_prest', 260)
        ];
        this._fixWidth(this.columnDefinitions[0]);
        this._collapsable.forEach(this._makeCollapsable.bind(this));
        this._protectFrozenColCells();
        this.data
        .sort((a: PdctHldSubst, b: PdctHldSubst) => a.data[this.dataType].length > b.data[this.dataType].length ? -1 : 1)
        .forEach(row =>
            row.data[this.dataType]
                .sort((a: DataEntry, b: DataEntry) => a.id_indc.nb_ord > b.id_indc.nb_ord ? 1 : -1)
                .forEach(this._addColDef.bind(this))
        );
    }

    private _fixWidth(col: Column): void {
        col.width = col.minWidth;
        col.maxWidth = col.minWidth;
        col.resizable = false;
    }

    private _protectFrozenColCells(): void {
        for (let i = 0; i <= this._nbFrozenCol; i++) {
            this._makeNonEditable(this.columnDefinitions[i]);
        }
    }

    private _initGridData(): void {
        this.gridData.setData(this.data, this.dataType);
    }

    private _initGridOptions(): void {
        this.gridOptions = {
            rowHeight: this._rowHeight,
            frozenColumn: this._nbFrozenCol,
            alwaysShowVerticalScroll: false,
            enableAutoResize: true,
            autoResize: {
                containerId: this.containerId,
            },
            enableSorting: false,
            enableGridMenu: false,
            enableColumnReorder: false,
            enableColumnPicker: false,
            enableHeaderMenu: false,
            enableHeaderButton: true,
            enableCellNavigation: true
        };
        if (!this.readOnly) {
            this._editableGridOptions();
        }
    }

    private _editableGridOptions(): void {
        this.gridOptions.enableExcelCopyBuffer = true;
        this.gridOptions.excelCopyBufferOptions = {
            newRowCreator: count => {}
        };
        this.gridOptions.editable = true;
        this.gridOptions.autoCommitEdit = true;
    }

    private _addColDef(entry: DataEntry): void {
        if (!this.columnDefinitions.find(col => col.id === entry.id_indc.cd_indc)) {
            const newCol: Column = this._buildColDef(entry.id_indc.sl_indc, entry.id_indc.cd_indc, 200);
            newCol.formatter = this._formatter.bind(this);
            if (entry.id_indc['lb_date'] && entry.id_indc['lb_date'].length > 0) {
                newCol.name = `<p class="col-name">${this._transalte.instant(entry.id_indc.sl_indc)}</p><p class="indc-date">${entry.id_indc['lb_date']}</p>`;
            }
            this._setColumnType(newCol, entry);
            this._makeEditable(newCol);
            this._addHelp(newCol, entry);
            this.columnDefinitions.push(newCol);
        }
    }

    private _buildColDef(name: string, field: string, minWidth: number): Column {
        const colDef: Column = {
            id: field,
            name: this._transalte.instant(name),
            field: field,
            sortable: false,
            minWidth: minWidth
        };
        return colDef;
    }

    private _setColumnType(newCol: Column, entry: DataEntry): void {
        const slickTypes = {
            [IndcTypes.TEXT]: FieldType.string,
            [IndcTypes.NUMBER]: FieldType.number
        };
        newCol.type = slickTypes[entry.id_indc.cd_indc_typ];
    }

    private _addHelp(newCol: Column, entry: DataEntry): void {
        this._addButtonToColumnHeader(newCol, {
            cssClass: 'i-help',
            command: 'help',
            tooltip: entry.id_indc.ll_indc
        });
    }

    private _makeCollapsable(columnId: string): void {
        this._addButtonToColumnHeader(columnId, {
            cssClass: 'i-hide',
            command: 'collapse',
            itemVisibilityOverride: (args) => (args.column.cssClass !== 'collapsed'),
            action: this._expandCollapseColumn.bind(this)
        });
        this._addButtonToColumnHeader(columnId, {
            cssClass: 'i-show',
            command: 'expand',
            itemVisibilityOverride: (args) => (args.column.cssClass === 'collapsed'),
            action: this._expandCollapseColumn.bind(this)
        });
    }

    private _makeNonEditable(column: Column): void {
        column.onCellChange = this._rollbackCellChange.bind(this);
        column.cannotTriggerInsert = true;
    }

    private _validateCellValue(value: string): EditorValidatorOutput {
        value = value.replace(/[,\.\s]/g, '');
        const isValid: boolean = (this._validateNumberPattern.test(value) || value.length === 0);
        if (!isValid) {
            this._setError(GridError.INVALID_NUMBER_VALUE);
        }
        return {valid: isValid};
    }

    private _addButtonToColumnHeader(column: string|Column, button: HeaderButtonItem): void {
        if (typeof column === 'string') {
            column = this.columnDefinitions.find(c => c.id === column);
        }
        if (typeof column.header === 'undefined') {
            column.header = {};
        }
        if (typeof column.header.buttons === 'undefined') {
            column.header.buttons = [];
        }
        column.header.buttons.push(button);
    }

    private _expandCollapseColumn(e: Event, args: GridCallbackArgs): void {
        const column: Column = this.columnDefinitions.find(c => c.id === args.column.id);
        const callbacks: {[cmd: string]: (Column) => void} = {
            collapse: this._collapseColumn.bind(this),
            expand: this._expandColumn.bind(this)
        };
        callbacks[args.command](column);
        this._refreshColumnDefinitions();
        this.grid.resizerService.resizeGrid();
    }

    private _collapseColumn(column: Column): void {
        column.maxWidth = 30;
        column.cssClass = 'collapsed';
        column.headerCssClass = 'collapsed';
    }

    private _expandColumn(column: Column): void {
        delete column.maxWidth;
        delete column.cssClass;
        delete column.headerCssClass;
    }

    private _rollbackCellChange(e: Event, args: OnEventArgs): void {
        const dataRowOrig = this.data.find(d => d.cd_cip13 === args.dataContext.id);
        if (typeof dataRowOrig !== 'undefined') {
            this.gridData.getData(this.dataType)[args.row][args.columnDef.field] = dataRowOrig[args.columnDef.field];
            this.grid.gridService.renderGrid();
        }
    }

    private _refreshColumnDefinitions(): void {
        this.columnDefinitions = [...this.columnDefinitions];
    }

    private _trimValue(args: OnEventArgs): void {
        const gridData: GridDataRow[] = this.gridData.getData(this.dataType);
        const newValue: string = args.dataContext[args.columnDef.field].replace(/[,\.\s]/g, '');
        gridData[args.row][args.columnDef.field] = newValue.length > 0 ? parseInt(newValue, 10) : newValue;
        this.grid.gridService.renderGrid();
    }

    private _setError(err: GridError): void {
        this.error = err;
        setTimeout(() => this.error = undefined, 4000);
    }

    private _formatter(row: number, cell: number, value: number|string, columnDef, dataContext): number|string {
        const notExpected = this._controlIndcExpected(columnDef.field, dataContext['_rowOrigin']);
        if (notExpected) {
            return notExpected;
        }
        const valueToReturn = this._separateThousands(value);
        if ( columnDef.field === 'IE-16' ) {
            return this._controlSendedMoreThanStock(dataContext) ? `<span class='warning-control'> ${valueToReturn} </span> <small class='warning-control'>Unités expédiées supérieur au stock indiqué lors de la dernière saisie.</small>` : valueToReturn;
        } else if (columnDef.field === 'IE-1') {
            return this._controlErreurStock(dataContext) ? `<span class='warning-control'> ${valueToReturn} </span> <small class='warning-control'>Le stock ne correspond pas avec les unités expédiées et l'approvisionnement.</small>` : valueToReturn;
        } else {
            return valueToReturn;
        }
    }

    private _controlIndcExpected(indc: string, entry: PdctHldSubst): string {
        const existe = entry.data[this.dataType].find((x: DataEntry) => x.id_indc.cd_indc === indc);
        let value: string;
        if (!existe) {
            value = `<span class='archive-value'>Déjà Validé</span>`;
            const archives = this.archivedData['archivedDataByDate'].find( x => x.date === entry.data[this.dataType][0].dt_grnlr);
            const archive = archives ?
                archives[this.dataType].find((x: DataEntry) => x.cd_cip13 === entry.cd_cip13 && x.id_indc.cd_indc === indc) : null;
            value = archive && archive.val_indc !== null ?
                `<span class='archive-value'> ${archive.val_indc}</span> <small class='archive-value'>Déjà Validé</small>` : value;
        }
        return value;
    }

    private _separateThousands(value: number|string): number|string {
        if (['number', 'string'].includes(typeof value)) {
            value = value.toString();
            const thousandSeparatorPattern: RegExp = /(\d)(?=(\d{3})+(?!\d))/g;
            const split: string[] = value.split('.');
            value = split[0].replace(thousandSeparatorPattern, '$1 ');
            if (split.length === 2) {
                value += `.${split[1]}`;
            }
        }
        return value;
    }
}
