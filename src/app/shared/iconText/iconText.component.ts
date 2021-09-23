import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-icon-text',
  templateUrl: './iconText.component.html',
  styleUrls: ['./iconText.component.scss']
})
export class IconTextComponent implements OnInit {
  @Input() fontLineHeight: string;
  @Input() fontSize: string;
  @Input() colorInactive: string;
  @Input() active: boolean;
  @Input() srcActive: string;
  @Input() srcInactive: string;
  @Input() altText: string;
  @Input() label: string;
  @Input() afterLabel: string;
  @Input() lblUrl: Array<any>;
  @Input() noIcon: boolean;
  @Input() noMargin: boolean;

  private baseDir: string = '../../../assets/images/';

  constructor() { }

  ngOnInit() {
    this.srcActive = this.baseDir + this.srcActive;
    this.srcInactive = this.baseDir + this.srcInactive;
  }

}
