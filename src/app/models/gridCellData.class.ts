import { GridDataRow } from './gridDataRow.class';
import { DataEntry } from './dataEntry';
import { IndcTypes } from './indcTypes.enum';

export class GridCellData {
    public cd_cip13: number;
    public cd_stat_entry: string;
    public dt_grnlr: string;
    public id_break: number;
    public id_hld: number;
    public id_indc: number;
    public id_usr_crt: number;
    public id_usr_vld: number;
    public ts_crt: Date;
    public ts_lst_upd: Date;
    public ts_vld: Date | string;
    public val_indc: number | string;
    public cd_indc_typ: string;

    constructor(_: DataEntry, dataRow: GridDataRow) {
        this.cd_cip13 = _.cd_cip13;
        this.cd_stat_entry = _.cd_stat_entry;
        this.dt_grnlr = _.dt_grnlr;
        this.id_break = _.id_break.id_break;
        this.id_hld = _.id_hld;
        this.id_indc = _.id_indc.id_indc;
        this.ts_lst_upd = new Date();
        this.ts_crt = new Date(_.ts_crt);
        this.val_indc = dataRow[_.id_indc.cd_indc];
        this.cd_indc_typ = _.id_indc.cd_indc_typ;
        if (_.id_indc.cd_indc_typ === IndcTypes.NUMBER) {
            const val: number = parseInt(dataRow[_.id_indc.cd_indc], 10);
            this.val_indc = isNaN(val) ? null : val;
        }
    }
}
