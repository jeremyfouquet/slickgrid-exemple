import { Column, HeaderButtonItem } from 'angular-slickgrid';

export interface GridCallbackArgs {
    column: Column;
    button?: HeaderButtonItem;
    command?: string;
}
