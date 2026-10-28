import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { StaticContentService } from './static-content.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'lib-privacy',
  standalone: true,
  imports: [AsyncPipe, MarkdownModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<markdown [data]="content$ | async"></markdown>`,
})
export class PrivacyComponent implements OnInit {
  content$!: Observable<string>;
  private readonly staticContentService = inject(StaticContentService);

  ngOnInit() {
    this.content$ = this.staticContentService.getContent('privacy');
  }
}
