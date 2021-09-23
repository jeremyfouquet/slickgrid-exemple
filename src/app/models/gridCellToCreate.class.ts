import { GridCellData } from './gridCellData.class';
import { DataEntry } from './dataEntry';
import { GridDataRow } from './gridDataRow.class';

export class GridCellToCreate extends GridCellData {

    constructor(_: DataEntry, dataRow: GridDataRow) {
        super(_, dataRow);
        this.cd_stat_entry = 'toValidated';
        this.id_usr_crt = dataRow.idUser;
        this.id_usr_crt = -1;
        this.id_usr_vld = -1;
        this.ts_crt = new Date();
        this.ts_lst_upd = new Date();
        this.ts_vld = 'null';
        this.val_indc = -1;
    }
}
