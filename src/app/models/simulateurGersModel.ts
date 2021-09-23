export class SimulateurGersModel {
    labo: string;
    idlabo: number;
    nmgrp: number;
    data: SimulateurGersStock;
    consoDataMissing: boolean;
    lastDt: string;
}

export class SimulateurGersStock {
    date_stock: Array<string>;
    stck_reel: Array<number>;
    stk_gers_prev: Array<number>;
    ventes_gers: Array<number>;
    Stock_moins_ventes_gers: Array<number>;
    approvisionnement: Array<number>;
}


