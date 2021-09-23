export class PrevisionnelGersModel {
    labo: string;
    idlabo: number;
    nmgrp: number;
    data: PrevisionnelGersStock;
    consoDataMissing: boolean;
    lastDt: string;
}

export class PrevisionnelGersStock {
    date_stock: Array<string>;
    stk_gers_affich: Array<number>;
    stk_affich: Array<number>;
    ventes_gers: Array<number>;
    stk_gers_color: string;
}


