import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RegisterPayload } from './models/register.model';

@Injectable({ providedIn: 'root' })
export class RegisterService {
  private readonly http = inject(HttpClient);


  register(payload: RegisterPayload): Promise<void> {
    return firstValueFrom(this.http.post<void>('/api/auth/register', payload));
  }
}
