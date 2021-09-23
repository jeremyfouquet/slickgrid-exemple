import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DataBreak, DataEntry } from 'src/app/models';
@Injectable({
  providedIn: 'root'
})
export class DataEntryService {
  private _results: Array<any>;
  private _dateStart: Date;
  private _dataBreak: DataBreak;
  private _dateEnd: Date;
  private _nextDtGrnlr: string;
  private _isAdmin: boolean = false;

  get nextDtGrnlr(): string { return this._nextDtGrnlr; }
  set nextDtGrnlr(dt: string) { this._nextDtGrnlr = dt; }
  get dateEnd(): Date { return this._dateEnd; }
  set dateEnd(de: Date) { this._dateEnd = de; }
  get dateStart(): Date { return this._dateStart; }
  set dateStart(ds: Date) { this._dateStart = ds; }
  get dataBreak(): DataBreak { return this._dataBreak; }
  set dataBreak(data: DataBreak) { this._dataBreak = data; }

  get isAdmin(): boolean {
    return this._isAdmin;
  }
  set changeIsAdmin(change: boolean) {
    this._isAdmin = change;
  }
  constructor(
  ) { }



  public controlDataEntry(data: DataEntry): Observable<any> {
    const params = {
      id_break: data.id_break,
      id_hld: data.id_hld,
      dt_grnlr: data.dt_grnlr
    };
    return of()
  }
  // Creation d'une session de rupture et renvoi l'id de la rupture créée
  public createDataEntry(data: Array<any>): Observable<any> {
    const params = {
      'results': data
    };
    return of()
  }

  // get next work date
  public getPdcts(id: Array<number>): Observable<any> {
    const set: Set<number> = new Set(id);
    const newId = Array.from(set.values());
    const params = {
      'cd_cip13': newId
    };
    const prdct = []
    return of(prdct)
  }
  // update dataEntry
  public updateDataEntry(data: Array<DataEntry>): Observable<any> {
    data.forEach((element: any) => {
      if (element.id_indc === 999 && element.val_indc) {
        element.val_indc = element.val_indc.replaceAll('\'', '\"');
      }
    }
    );
    const params = {
      'id_break': data[0].id_break,
      'id_hld': data[0].id_hld,
      'dt_grnlr': data[0].dt_grnlr,
      'results': data
    };
    return of()
  }

  public getResults() {
    return this._results;
  }
}
