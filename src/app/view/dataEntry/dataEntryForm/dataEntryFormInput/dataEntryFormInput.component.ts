import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { DataEntry, IndcTypes } from 'src/app/models';

type InputValueType = string | number;
interface FormOptions {
    displayValue: (InputValueType | ValidatorFn)[];
    dataForm: (InputValueType | ValidatorFn)[];
    data: DataEntry;
    type: string;
    error: boolean;
    null: boolean;
}

@Component({
    selector: 'app-data-entry-form-input',
    templateUrl: './dataEntryFormInput.component.html',
    styleUrls: ['./dataEntryFormInput.component.scss']
})
export class DataEntryFormInputComponent implements OnInit {

    @Input() disabled: boolean;
    @Input() dataEntry: DataEntry;
    @Input() warningStockBiggest: boolean;
    @Input() warningStockError: boolean;

    @Output() valueChanged: EventEmitter<string|number> = new EventEmitter();

    _validateNumberPattern: RegExp = /(?=^.{0,12}$)^\d*$/;
    public form: FormGroup;

    constructor(
        private readonly _formBuilder: FormBuilder) {}

    ngOnInit(): void {
        this._init();
    }

    get isValid(): boolean { return !this.form.controls.dataForm.invalid; }
    get value(): InputValueType { return this.form.controls.displayValue.value; }
    get dataEntryType(): string { return this.dataEntry.id_indc.cd_indc_typ; }
    get lowerType(): string { return this.dataEntryType.toLocaleLowerCase(); }
    get placeholder(): string { return `_Form_field_${this.lowerType}_placeholder_`; }

    public emitChangedValue() {
        const emitFuncs: {[type: string]: () => void} = {
            [IndcTypes.NUMBER]: this._emitNumber.bind(this),
            [IndcTypes.TEXT]: this._emitText.bind(this)
        };
        emitFuncs[this.dataEntryType]();
    }

    private _init() {
        const formGroupOptions: FormOptions = {
            displayValue: [this._separateThousands(this.dataEntry.val_indc)],
            dataForm: [this.dataEntry.val_indc],
            data: this.dataEntry,
            type: 'text',
            error: false,
            null: false
        };
        if (this.dataEntryType === IndcTypes.NUMBER) {
            formGroupOptions.dataForm.push(Validators.pattern(this._validateNumberPattern));
        }
        this.form = this._formBuilder.group(formGroupOptions);
        this.valueChanged.emit(this.form.value);
    }

    private _emitText() {
        this.form.value.null = false;
        this.form.controls.dataForm.setValue(this.value);
        if (!this.value) {
            this.form.value.null = true;
        }
        this.valueChanged.emit(this.form.value);
    }

    private _separateThousands(value: number|string): number|string {
        if (['string', 'number'].includes(typeof value)) {
            value = value.toString();
            const thousandSeparatorPattern: RegExp = /(\d)(?=(\d{3})+(?!\d))/g;
            const split: string[] = value.split('.');
            value = split[0].replace(thousandSeparatorPattern, '$1 ');
            if (split.length === 2) {
                value += `.${split[1]}`;
            }
        }
        return value;
    }

    private _emitNumber() {
        this.form.value.null = false;
        this.form.value.error = false;
        let formattedValue: string = '';
        if (this.form.value.displayValue) {
            formattedValue = this.form.value.displayValue
                .toString()
                .replace(/[,\.\s]/g, '');
        }
        this.form.controls.dataForm.setValue(formattedValue);
        this.form.controls.displayValue.setValue(this._separateThousands(formattedValue));
        if (this.isValid && !this.value) {
            this.form.value.dataForm = '';
            this.form.value.null = true;
        } else if (!this.isValid) {
            this.form.value.dataForm = '';
            this.form.value.displayValue = '';
            this.form.value.error = true;
        }
        this.valueChanged.emit(this.form.value);
    }
}
