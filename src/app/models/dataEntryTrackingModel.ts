export class DataEntryTrackingModel {
    idsession: number;
    idlabo: number;
    namelabo: string;
    navindex: number;
    info: Array<Info>;
    selectedCurrentDate?: Date;
    selectedLastDate?: Date;
}

class Info {
    dtgrnlr: string;
    periodecourante: Date;
    lastupdate: Date;
    totalindc: number;
    savedindc: number;
    validatedindc: number;
    archivedindc: number;
    rejectedindc: number;
    failedindc: number;
}


