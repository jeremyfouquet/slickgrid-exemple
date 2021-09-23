export class PrevisionnelMedicamModel {
    labo: string;
    idlabo: number;
    nmgrp: number;
    data: PrevisionnelMedicamStock;
    consoDataMissing: boolean;
    lastDt: string;
}

export class PrevisionnelMedicamStock {
    date_stock: Array<string>;
    stk_medicam_affich: Array<number>;
    stk_affich: Array<number>;
    ventes_medicam: Array<number>;
    stk_medicam_color: string;
}


