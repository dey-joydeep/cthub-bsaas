import { Observable, of } from 'rxjs';
import { TranslateLoader } from '@ngx-translate/core';
import { makeStateKey, StateKey, TransferState } from '@angular/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

export class TranslateServerLoader implements TranslateLoader {
  private readonly httpLoader: TranslateHttpLoader;
  private readonly defaultPrefix = './assets/i18n/';
  private readonly defaultSuffix = '.json';

  constructor(
    private readonly transferState: TransferState,
    http: HttpClient,
    prefix: string = './assets/i18n/',
    suffix: string = '.json',
  ) {
    this.httpLoader = new TranslateHttpLoader(http, prefix ?? this.defaultPrefix, suffix ?? this.defaultSuffix);
  }

  public getTranslation(lang: string): Observable<Record<string, unknown>> {
    const key: StateKey<Record<string, unknown> | null> = makeStateKey<Record<string, unknown> | null>(
      `transfer-translate-${lang}`,
    );
    const cached = this.transferState.get(key, null);

    if (cached) {
      return of(cached);
    }

    return this.httpLoader.getTranslation(lang) as Observable<Record<string, unknown>>;
  }
}

export function translateServerLoaderFactory(httpClient: HttpClient, transferState: TransferState) {
  return new TranslateServerLoader(transferState, httpClient);
}
