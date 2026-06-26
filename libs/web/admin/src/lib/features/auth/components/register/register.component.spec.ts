import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { REGISTER_API } from '../../tokens/password.tokens';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let registerApi: { register: jest.Mock<Promise<void>, [unknown]> };

  beforeEach(async () => {
    registerApi = {
      register: jest.fn<Promise<void>, [unknown]>(),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RegisterComponent],
      providers: [{ provide: REGISTER_API, useValue: registerApi }],
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

    expect(registerApi.register).not.toHaveBeenCalled();
  });

  it('should call REGISTER_API on valid submit', async () => {
    registerApi.register.mockResolvedValue(undefined);
    component.registerForm.setValue({ name: 'Test', email: 'test@example.com', password: '123456' });

    await component.onSubmit();

    expect(registerApi.register).toHaveBeenCalledWith({
      name: 'Test',
      email: 'test@example.com',
      password: '123456',
    });
    expect(component.success).toBe(true);
  });

  it('should show error on failed registration', async () => {
    registerApi.register.mockRejectedValue({ error: { message: 'Email exists' } });
    component.registerForm.setValue({ name: 'Test', email: 'fail@example.com', password: '123456' });

    await component.onSubmit();

    expect(component.error).toBe('Email exists');
    expect(component.success).toBe(false);
  });
});
