import { Component } from '@angular/core';

import { LanguageService } from './services/language/language.service';
import { version } from '../../package.json';

@Component({
    selector: 'app-leem',
    template: `
    <router-outlet></router-outlet>
    <div class="copyright">{{copyright}}</div>
    `
})

export class AppComponent {
    public copyright;
    constructor(
        private languageService: LanguageService
    ) {
        this.languageService.init();
        this._copyright();
    }

    private _copyright() {
        this.copyright = `${new Date().getUTCFullYear()} | version ${version} | Tous droits réservés`;

    }
}
