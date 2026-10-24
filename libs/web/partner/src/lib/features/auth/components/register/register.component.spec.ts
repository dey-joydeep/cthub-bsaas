import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { REGISTER_API, RegisterApiPort } from '../../tokens/password.tokens';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockRegisterApi: jest.Mocked<RegisterApiPort>;

  beforeEach(async () => {
    mockRegisterApi = {
      register: jest.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RegisterComponent],
      providers: [{ provide: REGISTER_API, useValue: mockRegisterApi }],
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
    expect(mockRegisterApi.register).not.toHaveBeenCalled();
  });

  it('should call REGISTER_API.register on valid submit', async () => {
    component.registerForm.setValue({ name: 'Test', email: 'test@example.com', password: '123456' });
    await component.onSubmit();
    expect(mockRegisterApi.register).toHaveBeenCalled();
    expect(component.success).toBe(true);
  });

  it('should show error on failed registration', async () => {
    component.registerForm.setValue({ name: 'Test', email: 'fail@example.com', password: '123456' });
    mockRegisterApi.register.mockRejectedValue({ error: { message: 'Email exists' } });
    await component.onSubmit();
    expect(component.error).toBe('Email exists');
    expect(component.success).toBe(false);
  });
});
