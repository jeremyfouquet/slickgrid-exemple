export class SimulateurMedicamModel {
    labo: string;
    idlabo: number;
    nmgrp: number;
    data: SimulateurMedicamStock;
    consoDataMissing: boolean;
    lastDt: string;
}

export class SimulateurMedicamStock {
    date_stock: Array<string>;
    stck_reel: Array<number>;
    stk_medicam_prev: Array<number>;
    ventes_medicam: Array<number>;
    Stock_moins_ventes_medicam: Array<number>;
    approvisionnement: Array<number>;
}


