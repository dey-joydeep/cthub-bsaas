import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfileSettingsComponent } from './profile-settings.component';
import { UserService } from './user.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('ProfileSettingsComponent', () => {
  let component: ProfileSettingsComponent;
  let fixture: ComponentFixture<ProfileSettingsComponent>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    userService = {
      updateProfile: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    // Provide the mock service
    TestBed.overrideProvider(UserService, { useValue: userService });
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ProfileSettingsComponent],
      providers: [{ provide: UserService, useValue: userService }],
    }).compileComponents();
    fixture = TestBed.createComponent(ProfileSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display error on failed profile update', fakeAsync(() => {
    userService.updateProfile.mockReturnValue(throwError(() => new Error('Failed to update')));
    component.profileForm.setValue({
      name: 'Test',
      email: 'test@test.com',
      contact: '123',
      password: '',
      profilePicture: null,
    });
    component.onSubmit();
    tick();
    expect(component.error).toBe('Failed to update profile.');
  }));

  it('should display error if required fields missing', () => {
    component.profileForm.setValue({
      name: '',
      email: '',
      contact: '',
      password: '',
      profilePicture: null,
    });
    component.onSubmit();
    expect(component.error).toBe('All fields are required.');
  });

  it('should call updateProfile on valid submit', fakeAsync(() => {
    userService.updateProfile.mockReturnValueOnce(of({ success: true }));
    component.profileForm.setValue({
      name: 'Test',
      email: 'test@test.com',
      contact: '123',
      password: '',
      profilePicture: null,
    });
    component.onSubmit();
    tick();
    expect(userService.updateProfile).toHaveBeenCalled();
  }));
});
