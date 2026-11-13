import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true,
})
export class SafeUrlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(url: string | null | undefined): SafeResourceUrl {
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      return '';
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
