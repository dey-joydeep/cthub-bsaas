import { Observable, of } from 'rxjs';
import { TranslateLoader } from '@ngx-translate/core';
import { makeStateKey, StateKey, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export class TranslateServerLoader implements TranslateLoader {
  private readonly defaultPrefix = './assets/i18n/';
  private readonly defaultSuffix = '.json';

  constructor(
    private readonly transferState: TransferState,
    private readonly http: HttpClient,
    private readonly prefix: string = './assets/i18n/',
    private readonly suffix: string = '.json',
  ) {}

  public getTranslation(lang: string): Observable<any> {
    const key: StateKey<any> = makeStateKey<any>(`transfer-translate-${lang}`);
    const cached = this.transferState.get(key, null);

    if (cached) {
      return of(cached);
    }

    return this.http.get(`${this.prefix ?? this.defaultPrefix}${lang}${this.suffix ?? this.defaultSuffix}`);
  }
}

export function translateServerLoaderFactory(httpClient: HttpClient, transferState: TransferState) {
  return new TranslateServerLoader(transferState, httpClient);
}
