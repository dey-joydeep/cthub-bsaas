import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { RegisterPayload } from './models/register.model';

@Injectable({ providedIn: 'root' })
export class RegisterService {
  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Promise<void> {
    // Simulate API call
    return Promise.resolve();
  }
}
