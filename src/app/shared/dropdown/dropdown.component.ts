import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { Subst } from 'src/app/models';
import { LoaderService } from 'src/app/services';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent implements OnInit, OnChanges {
  @ViewChild('searchSession') searchElement: ElementRef;
  @Input() active: boolean;
  @Input() search: boolean;
  @Input() title: string;
  @Input() pendding: boolean;
  @Input() data: any;
  @Input() colorDisable: string;
  @Input() typeOfData: string;
  @Input() typeOfList: string;
  @Input() dropdownToggleLabel: string;
  @Input() dropdownToggleLabels: Array<any>;
  @Output() presentData: EventEmitter<any> = new EventEmitter();
  @Output() dataDeleted: EventEmitter<any> = new EventEmitter();
  @Output() keyUpEvent: EventEmitter<any> = new EventEmitter();
  @Output() checkEvent: EventEmitter<any> = new EventEmitter();

  public isSubmitted: boolean;
  private searchIsEmpty: Array<any> = [
    {
      typeOfData : 'data-entry',
      field: '_Form_field_data_entry_empty_',
    },
    {
      typeOfData : 'data-entry-admin',
      field: '_Form_field_session_empty_',
    },
    {
      typeOfData : 'session-dashboard',
      field: '_Form_field_session_empty_',
    },
    {
      typeOfData : 'dci',
      field: '_Form_field_dci_empty_',
    },
    {
      typeOfData : 'unit',
      field: '_Form_field_unit_empty_',
    },
    {
      typeOfData : 'user',
      field: '_Form_field_user_empty_',
    },
    {
      typeOfData : 'data-entry-not-matche',
      field: '_Form_field_session_not_matche_',
    },
    {
      typeOfData : 'user-not-matche',
      field: '_Form_field_user_not_matche_',
    },
    {
      typeOfData : 'dci-not-matche',
      field: '_Form_field_dci_not_matche_',
    },
    {
      typeOfData : 'unit-not-matche',
      field: '_Form_field_unit_not_matche_',
    }
  ];
  constructor(
    public loader: LoaderService,
  ) {
  }

  ngOnInit(): void {
  }

  ngOnChanges() {
  }

  public dropdownEmpty(s: string): string {
    const field = this.searchIsEmpty.find(x => x.typeOfData === s).field;
    return field;
  }
  public dropdownNotMatche(s: string): string {
    let field: string;
    let typeOfData: string;
    switch (s) {
      case 'data-entry':
        typeOfData = 'data-entry-not-matche';
        break;
      case 'data-entry-admin':
        typeOfData = 'data-entry-not-matche';
        break;
      case 'session-dashboard':
        typeOfData = 'data-entry-not-matche';
        break;
      case 'user':
        typeOfData = 'user-not-matche';
        break;
      case 'dci':
        typeOfData = 'dci-not-matche';
        break;
      case 'unit':
        typeOfData = 'unit-not-matche';
    }
    field = this.searchIsEmpty.find(x => x.typeOfData === typeOfData).field;
    return field;
  }
  public onClickToggle() {
    const search = this.searchElement;
    if (search) {
      setTimeout(() => {
        this.searchElement.nativeElement.focus();
      }, 300);
    } else {
      return;
    }
  }
  public onClick(e, data: any) {
    if (
      this.typeOfData === 'data-entry-admin' || this.typeOfData === 'user' || this.typeOfData === 'session-dashboard' || this.typeOfData === 'group' || this.typeOfData === 'data-entry'
    ) {
      this.isSubmitted = true;
    } else if (this.typeOfData === 'gran') {
      this.dropdownToggleLabel = data.text;
    } else if (this.typeOfData === 'dci' || this.typeOfData === 'unit') {
      e.stopPropagation();
    } else {
      return;
    }
    this.presentData.emit(data);
  }
  public onChecked(e) {
    this.isSubmitted = true;
    this.checkEvent.emit(e);
  }
  public onCheckedUnit(e, item) {
    const emit = {
      checked: e.target.checked,
      value: item
    };
    this.isSubmitted = true;
    this.checkEvent.emit(emit);
  }
  public onClickDelete(e, data: Subst) {
    e.stopPropagation();
    this.dataDeleted.emit(data);
  }
  public onSearch(e) {
    this.keyUpEvent.emit(e);
  }
  public isChecked(data: string): boolean {
    if (this.dropdownToggleLabels.find(x => x.nm_subst === data)) {
      return true;
    } else {
      return false;
    }
  }
  public unitIsChecked(item): boolean {
    if (this.dropdownToggleLabels.find(x => x.cip === item.cip)) {
      return true;
    } else {
      return false;
    }
  }
}
