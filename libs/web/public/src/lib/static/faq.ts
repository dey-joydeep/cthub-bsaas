import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { StaticContentService } from '../static-content.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'lib-faq',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  template: `<markdown [data]="content$ | async"></markdown>`,
})
export class FaqComponent implements OnInit {
  content$!: Observable<string>;

  constructor(private staticContentService: StaticContentService) {}

  ngOnInit() {
    this.content$ = this.staticContentService.getContent('faq');
  }
}
