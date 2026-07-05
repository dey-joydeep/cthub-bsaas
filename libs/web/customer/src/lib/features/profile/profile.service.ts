import { Injectable } from '@angular/core';
import { CurrentUserService } from '@cthub-bsaas/web-core/auth';
import { Observable, of } from 'rxjs';
import { User } from './model/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private currentUserService: CurrentUserService) {}

  getProfile(): Observable<User | null> {
    return of(this.currentUserService.currentUser as unknown as User | null);
  }

  updateProfile(formData: FormData): Observable<any> {
    // In a real app, this would make an HTTP POST request
    // For now, we'll just simulate the update
    const updatedUser = {
      firstName: formData.get('name') as string,
      lastName: '', // Assuming name is full name
      email: formData.get('email') as string,
      phone: formData.get('contact') as string,
    };
    void updatedUser;
    // this.currentUserService.updateUser(updatedUser);
    return of({ success: true });
  }
}
