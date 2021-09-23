import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataEntryService } from 'src/app/services';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public active = false;
  currentUserValue = require('src/app/mocks/userMocks.app.json')
  constructor(
    private _router: Router,
    private _dataEntryService: DataEntryService
  ) {
   }

  ngOnInit(): void {
  }
  public activeToggle() {
    if (this.active === false) {
      this.active = true;
    } else {
      this.active = false;
    }
  }

  public onClick(s: string) {
    switch (s) {
      case 'logout':
        break;
    }
  }
  public onClickHome() {
    this._dataEntryService.changeIsAdmin = this._dataEntryService.isAdmin;
    console.log(this._dataEntryService.isAdmin)
    this._router.navigate(['/view/home']);
  }
  public onClickProfil() {
    this._router.navigate(['/view/profil']);
  }

}
