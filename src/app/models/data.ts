import { DataEntry } from '.';

export class Data {
    date?: string;
    startDate?: string;
    endDate?: string;
    nextDtGrnlr?: string;
    recurrentData: Array<DataEntry>;
    startingData: Array<DataEntry>;
}
