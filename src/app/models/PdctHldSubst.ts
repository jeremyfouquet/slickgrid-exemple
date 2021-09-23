import { Data } from '.';

export class PdctHldSubst {
    cd_cis?: number;
    cd_cip7?: number;
    cd_cip13: number;
    nm_medic?: string;
    id_hld?: number;
    nm_hld?: string;
    cd_subst?: number;
    cd_hld_typ?: string;
    nm_subst?: string;
    ll_prest?: string;
    data?: Data;
    error?: boolean;
    class?: string;
    form?: string;
    dose?: string;
    unit?: string;
    coef?: number;
    commercialise?: boolean;
    listGrp?: Array<any>;
}
