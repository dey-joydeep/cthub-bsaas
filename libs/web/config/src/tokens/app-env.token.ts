import { InjectionToken } from '@angular/core';
import type { Env } from '../types/env';

export const APP_ENV = new InjectionToken<Env>('APP_ENV');
