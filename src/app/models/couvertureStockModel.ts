export class CouvertureStockModel {
    labo: string;
    idlabo: number;
    nmgrp: number;
    data: DataCouvertureStock;
    consoDataMissing: boolean;
    lastDt: string;
}

export class DataCouvertureStock {
    date_stock: Array<string>;
    valeur: Array<number>;
    conso_moyenne_hebdo_medicam: Array<number>;
    conso_moyenne_hebdo_gers: Array<number>;
    ecart_stock_besoins_medicam: Array<number>;
}


