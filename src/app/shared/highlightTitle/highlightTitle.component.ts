import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-highlight-title',
  templateUrl: './highlightTitle.component.html',
  styleUrls: ['./highlightTitle.component.scss']
})
export class HighlightTitleComponent implements OnInit {
  @Input() title: string;
  @Input() text: string;
  @Input() highlight: Array<string>;

  constructor() { }

  ngOnInit() {
    this.highlight.forEach(element => {
      this.title = this.title.replace(element, '<span class="highlight">' + element + '</span>');
    });
  }

}
