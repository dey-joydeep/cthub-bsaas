export interface Env {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly logLevel?: 'debug' | 'info' | 'warn' | 'error';
  readonly featureFlags?: Readonly<Record<string, boolean>>;
}
