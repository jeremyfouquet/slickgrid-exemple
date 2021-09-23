import { GridCellData } from './gridCellData.class';
import { DataEntry } from './dataEntry';
import { GridDataRow } from './gridDataRow.class';

export class GridCellToValidate extends GridCellData {

    constructor(_: DataEntry, dataRow: GridDataRow) {
        super(_, dataRow);
        this.id_usr_crt = (_.id_usr_crt === null ? dataRow.idUser : _.id_usr_crt);
        this.id_usr_vld = dataRow.idUser;
        this.cd_stat_entry = 'validated';
        this.ts_vld = new Date();
    }
}
