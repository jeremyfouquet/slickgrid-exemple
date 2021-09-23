import { Indc, Break } from '.';

export class DataEntry {
    id_break?: Break;
    id_session?: number;
    id_hld: number;
    cd_cip13: number;
    id_indc?: Indc;
    id_indic?: number;
    cd_stat_entry?: string;
    id_usr_crt?: number;
    id_usr_vld?: number;
    ts_crt?: Date;
    ts_lst_upd?: Date;
    val_indc?: number;
    ts_vld?: string;
    dt_grnlr?: string;
    fl_indc_mdty?: number;
    start_periode?: string;
    end_periode?: string;
    next_dt_grnlr?: string;
}
