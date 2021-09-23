import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Data, DataBreak, DataEntry, DatesBySessionModel } from 'src/app/models';
import { DataEntryService } from 'src/app/services';

@Component({
  selector: 'app-data-entry',
  templateUrl: './dataEntry.component.html',
  styleUrls: ['./dataEntry.component.scss']
})
export class DataEntryComponent implements OnInit {

  private idHld: number;
  public isAdmin: boolean;
  public currentUser;
  public data: Array<DataBreak>;
  public archivedData: Array<DataBreak>;
  public allDatesGrnlrBySession: Array<DatesBySessionModel>;
  constructor(
    private readonly _dataEntryService: DataEntryService,
    private readonly _datePipe: DatePipe
  ) {
    this.isAdmin = this._dataEntryService.isAdmin;
    if(this.isAdmin) {
      this.currentUser = require('src/app/mocks/userMocks.app.json');
    } else {
      this.currentUser = require('src/app/mocks/userMocksAdmin.app.json');
    }
    this.idHld = this.currentUser.labo;
    this.getDataEntry(this.idHld);
  }

  ngOnInit() {
  }
  public handleIsValidateOrSave(e) {
    this.getDataEntry(this.idHld);
  }
  // recupere toutes les dataEntry à valider et archivé à mettre à jours avant de les trier
  private getDataEntry(id: number) {
    const callbacks = {
        archived: this._getArchivedData.bind(this),
        toValidated: this._getToValidatedData.bind(this)
    };

    let data: Array<DataEntry>;
    data = require('src/app/mocks/dataMocks.app.json');
    this.data = [];
    this.archivedData = [];
    if (this.isAdmin) {
      data.forEach(element => callbacks['archived'](element, data)
      );
    } else {
      data.forEach(element => callbacks[element.cd_stat_entry](element, data)
      );
    }
    this._getAllDates(data);
    if (this.isAdmin) {
      this._checkedVueForAdmin(this.data, this.archivedData);
    }
  }

  private _checkedVueForAdmin(lastToValidatedData: Array<DataBreak>, archivedData: Array<DataBreak>) {
    archivedData.forEach( (x: DataBreak) => {
      const newData: Data = x.archivedDataByDate[x.archivedDataByDate.length - 1];
      const newDataBreak = new DataBreak;
      newDataBreak.break = x.break;
      newDataBreak.data = newData;
      lastToValidatedData.push(
        newDataBreak
      );
      x.archivedDataByDate = x.archivedDataByDate.filter((y, i) => i !== x.archivedDataByDate.length - 1);
    });
  }

  private _calculeMinOrMaxGrnlr(data: Array<DataEntry>, id: number, s: string): string {
    const allGrnlr: Array<string> = [];
    const datesGrnlr: Array<Date> = [];
    data.forEach( (grnlr: DataEntry) => {
      if (
        !allGrnlr.find(x => x === grnlr.dt_grnlr) &&
        grnlr.id_break.id_break === id &&
        grnlr.cd_stat_entry === 'toValidated'
      ) {
        allGrnlr.push(grnlr.dt_grnlr);
      }
    });
    allGrnlr.forEach( (element: string) => {
      const date: Date = new Date(element);
      datesGrnlr.push(date);
    });
    datesGrnlr.sort((a, b) => {
      if (s === 'min') {
        return a.getTime() - b.getTime();
      } else {
        return b.getTime() - a.getTime();
      }
    });
    if (datesGrnlr.length > 0) {
      return this._datePipe.transform(new Date(datesGrnlr[0]), 'yyyy-MM-dd');
    } else {
      return;
    }
  }

  private _getArchivedData(element: DataEntry, data: Array<DataEntry>) {
    let archiveByBreakId: DataBreak = this.archivedData.find(x => x.break.id_break === element.id_break.id_break);
    const date: string = element.dt_grnlr;
    if (!archiveByBreakId) {
      const dataBreak = new DataBreak;
      dataBreak.break = element.id_break;
      dataBreak.archivedDataByDate = [];
      this.archivedData.push(
        dataBreak
      );
      archiveByBreakId = this.archivedData.find(x => x.break.id_break === element.id_break.id_break);
    }
    if (!archiveByBreakId.archivedDataByDate.find(x => x.date === element.dt_grnlr)) {
      const newData = new Data;
      newData.date = element.dt_grnlr;
      newData.startDate = element.start_periode;
      newData.endDate = element.end_periode;
      newData.nextDtGrnlr = element.next_dt_grnlr;
      newData.recurrentData = data.filter(x =>
        x.id_indc.cd_indc_faml.includes('IE') &&
        x.id_break.id_break === element.id_break.id_break &&
        x.dt_grnlr === date &&
        (this.isAdmin || (!this.isAdmin && x.cd_stat_entry === element.cd_stat_entry))
        );
      newData.startingData = data.filter(x =>
        x.id_indc.cd_indc_faml.includes('IR') &&
        x.id_break.id_break === element.id_break.id_break &&
        x.dt_grnlr === date &&
        (this.isAdmin || (!this.isAdmin && x.cd_stat_entry === element.cd_stat_entry))
        );
      archiveByBreakId.archivedDataByDate.push(
        newData
      );
    }
  }

  private _getToValidatedData(element: DataEntry, data: Array<DataEntry>) {
    if (!this.data.find (x => x.break.id_break === element.id_break.id_break)) {
      const newData = new Data;
      newData.date = element.dt_grnlr;
      newData.startDate = element.start_periode;
      newData.endDate = element.end_periode;
      newData.nextDtGrnlr = element.next_dt_grnlr;
      newData.recurrentData = data.filter(x =>
        x.id_indc.cd_indc_faml.includes('IE') &&
        x.id_break.id_break === element.id_break.id_break &&
        x.cd_stat_entry === 'toValidated' &&
        x.dt_grnlr === this._calculeMinOrMaxGrnlr(data, element.id_break.id_break, 'min')
        );
      newData.startingData = data.filter(x =>
        x.id_indc.cd_indc_faml.includes('IR') &&
        x.id_break.id_break === element.id_break.id_break &&
        x.cd_stat_entry === 'toValidated' &&
        x.dt_grnlr === this._calculeMinOrMaxGrnlr(data, element.id_break.id_break, 'min')
        );
      const newDataBreak = new DataBreak;
      newDataBreak.break = element.id_break;
      newDataBreak.data = newData;
      this.data.push(
        newDataBreak
      );
    }
  }

  private _getAllDates(data: Array<DataEntry>) {
    const datesGrnlr: Array<DatesBySessionModel> = [];
    data.forEach( dataEntry => {
      if (!datesGrnlr.find(x => x.id_break === dataEntry.id_break.id_break)) {
        const newDatesBySession = new DatesBySessionModel;
        newDatesBySession.id_break = dataEntry.id_break.id_break;
        newDatesBySession.dates = [];
        datesGrnlr.push(
          newDatesBySession
        );
      }
    });
    datesGrnlr.forEach( (element: DatesBySessionModel) => {
      const grnlrByIdBreak: DataBreak = this.archivedData.length > 0 ?
        this.archivedData.find(x => x.break.id_break === element.id_break) : null;
      let dateToValidate: string;
      if (!this.isAdmin) {
        dateToValidate = this._calculeMinOrMaxGrnlr(data, element.id_break, 'min');
      }
      if (grnlrByIdBreak) {
        grnlrByIdBreak.archivedDataByDate.forEach(date => {
          element.dates.push(date.date);
        });
        if (dateToValidate) {
          element.dates.push(dateToValidate);
        }
      } else {
        if (dateToValidate) {
          element.dates.push(dateToValidate);
        }
      }
    });
    this.allDatesGrnlrBySession = datesGrnlr;
  }
}
