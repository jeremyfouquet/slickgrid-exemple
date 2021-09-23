export class EtatDuMarcheModel {
    labo: string;
    idlabo: number;
    nmgrp: number;
    data: Array<DataEtatDuMarche>;
    consoDataMissing: boolean;
}

export class DataEtatDuMarche {
    name: string;
    courbe: string;
    color: string;
    dataByDate: Array<DataByDate>;
}

export class DataByDate {
    iddate: string;
    date: string;
    etat_marche: number;
}

export class Params {
    id_break: number;
    id_hld: Array<number>;
    cd_cip13: Array<number>;
    lb_grp: string;
    dt_grnlr: string;
    cd_grnlr: string;
    total: boolean;
    allHld: Array<number>;
    indc: Array<number>;
}


