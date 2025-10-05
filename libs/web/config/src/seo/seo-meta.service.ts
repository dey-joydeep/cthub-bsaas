import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoMetaService {

  constructor(private title: Title, private meta: Meta) { }

  setTitle(title: string) {
    this.title.setTitle(title);
  }

  updateMetaTag(name: string, content: string) {
    this.meta.updateTag({ name, content });
  }
}
