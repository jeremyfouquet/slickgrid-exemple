import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class LoaderService {
    public showSpinner = false;

    constructor(
    ) {}

    public startingDataLoading() {
        this.showSpinner = true;
    }
    public endingDataLoading() {
        this.showSpinner = false;
    }
}





