import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OrderUtils {
  private _orderName;
  public reverse = false;

  constructor() { }

  get getOrder(): string {
    return this._orderName;
  }
  set setOrder(name: string) {
    this._orderName = name;
  }
  // Ordonner les produits dans la vue
  public setOrderName(value: string) {
    if (this.getOrder === value) {
      this.reverse = !this.reverse;
    }
    this.setOrder = value;
  }
}
