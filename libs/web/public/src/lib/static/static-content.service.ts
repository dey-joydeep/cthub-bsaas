import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StaticContentService {
  getContent(slug: string): Observable<string> {
    switch (slug) {
      case 'terms':
        return of('# Terms of Service\n\nThis is the placeholder for the terms of service.');
      case 'privacy':
        return of('# Privacy Policy\n\nThis is the placeholder for the privacy policy.');
      case 'faq':
        return of('# FAQ\n\nThis is the placeholder for the FAQ.');
      default:
        return of('# Page Not Found\n\nCould not find the requested content.');
    }
  }
}
