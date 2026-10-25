import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { StaticContentService } from './static-content.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'lib-faq',
  standalone: true,
  imports: [AsyncPipe, MarkdownModule],
  template: `<markdown [data]="content$ | async"></markdown>`,
})
export class FaqComponent implements OnInit {
  content$!: Observable<string>;
  private readonly staticContentService = inject(StaticContentService);

  ngOnInit() {
    this.content$ = this.staticContentService.getContent('faq');
  }
}
