import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  // Only spy on the 'register' method, not the whole AuthService
  let authServiceSpy: { register: jasmine.Spy };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RegisterComponent, HttpClientTestingModule, TranslateModule.forRoot(), FormsModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if form is invalid', async () => {
    component.registerForm.setValue({ name: '', email: '', password: '' });
    await component.onSubmit();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should call AuthService.register on valid submit', async () => {
    component.registerForm.setValue({ name: 'Test', email: 'test@example.com', password: '123456' });
    authServiceSpy.register.and.returnValue(Promise.resolve());
    await component.onSubmit();
    expect(authServiceSpy.register).toHaveBeenCalled();
    expect(component.success).toBeTrue();
  });

  it('should show error on failed registration', async () => {
    component.registerForm.setValue({ name: 'Test', email: 'fail@example.com', password: '123456' });
    authServiceSpy.register.and.returnValue(Promise.reject({ error: { message: 'Email exists' } }));
    await component.onSubmit();
    expect(component.error).toBe('Email exists');
    expect(component.success).toBeFalse();
  });
});
