import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { StaticContentService } from '../static-content.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'lib-privacy',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  template: `<markdown [data]="content$ | async"></markdown>`,
})
export class PrivacyComponent implements OnInit {
  content$!: Observable<string>;

  constructor(private staticContentService: StaticContentService) {}

  ngOnInit() {
    this.content$ = this.staticContentService.getContent('privacy');
  }
}