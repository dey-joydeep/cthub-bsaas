import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoMetaService {

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  setTitle(title: string) {
    this.title.setTitle(title);
  }

  updateMetaTag(name: string, content: string) {
    this.meta.updateTag({ name, content });
  }
}
