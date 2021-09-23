export class DataHldDashboardAModel {
    dates: string[];
    dataHld: DataHld[];
}

export class DataHld {
    name: string;
    cip7: number;
    cip13: number;
    cis: number;
    subst: string;
    lib: string;
    presentation: string;
    form: string;
    dose: string;
    unit: string;
    valgers: number;
    valmedicam: number;
    sales: Sales[];
    salesAverage: Sales[];
    namecolumn: string;
    stock: string;
    dtstockstart: string;
    dtstockend: string;
}

export class Sales {
    name: string;
    sale: number;
}
