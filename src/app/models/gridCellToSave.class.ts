import { GridCellData } from './gridCellData.class';
import { DataEntry } from './dataEntry';
import { GridDataRow } from './gridDataRow.class';

export class GridCellToSave extends GridCellData {

    constructor(_: DataEntry, dataRow: GridDataRow) {
        super(_, dataRow);
        this.id_usr_crt = dataRow.idUser;
        this.id_usr_vld = -1;
    }
}
