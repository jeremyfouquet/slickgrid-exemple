import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { RoutingModule } from './app.routing';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderModule } from 'ngx-order-pipe';
import { DatePipe } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { AngularSlickgridModule } from 'angular-slickgrid';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { NgSelectModule } from '@ng-select/ng-select';

registerLocaleData(localeFr);
import {
    OrderUtils
} from './utils';
import {
    LanguageService,
    DataEntryService,
    LoaderService,
    GridDataService,
    HomeService
} from './services';
import {
    ViewComponent,
    HomeComponent,
    DataEntryComponent,
    DataEntryFormComponent,
    DataEntryFormInputComponent,
    DataEntryGridComponent
} from './view';
import {
    HighlightTitleComponent,
    IconTextComponent,
    DropdownComponent,
    NavbarComponent
} from './shared';

@NgModule({
    imports: [
        AngularSlickgridModule.forRoot(),
        BrowserModule,
        RoutingModule,
        HttpClientModule,
        TranslateModule.forRoot(),
        ReactiveFormsModule,
        FormsModule,
        BrowserAnimationsModule,
        DragDropModule,
        MatProgressSpinnerModule,
        OrderModule,
        MatDialogModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        NgSelectModule
    ],
    declarations: [
        /**
         * VIEWS
         */
        AppComponent,
        ViewComponent,
        HomeComponent,
        DataEntryComponent,
        DataEntryFormComponent,
        DataEntryFormInputComponent,
        DataEntryGridComponent,
        /**
         * SHARED
         */
        HighlightTitleComponent,
        IconTextComponent,
        DropdownComponent,
        NavbarComponent,
    ],
    providers: [
        /**
         * SHARED
         */
        LanguageService,
        DataEntryService,
        LoaderService,
        DatePipe,
        GridDataService,
        HomeService,
        /**
         * UTILS
         */
        OrderUtils,
        {
            provide: MAT_DATE_LOCALE,
            useValue: 'fr-FR'
        },
        {
            provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
            useValue: {
                appearance: 'fill'
            }
        },
        {
            provide: LOCALE_ID,
            useValue: 'fr-FR'
        }
    ],
    bootstrap: [
        AppComponent
    ]
})

export class AppModule { }
