import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  public sessionSucces: boolean = false;
  constructor(
  ) { }

  public sessionCreatedSuccess() {
    this.sessionSucces = true;
    setTimeout(() =>
      this.sessionSucces = false, 4000
    );
  }
}
