import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {
    DataEntryComponent, HomeComponent
} from './view';


const appRoutes: Routes = [
    {
        path: 'view/home',
        component: HomeComponent,
    },
    {
        path: 'view/dataEntry',
        component: DataEntryComponent,
    },
    {
        path: '**',
        redirectTo: '/view/dataEntry'
    },
];

export const RoutingModule: ModuleWithProviders = RouterModule.forRoot(appRoutes, { useHash: true });
