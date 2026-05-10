import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PortfolioManagementComponent } from './portfolio-management.component';
import { PortfolioService } from './portfolio.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('PortfolioManagementComponent', () => {
  let component: PortfolioManagementComponent;
  let fixture: ComponentFixture<PortfolioManagementComponent>;
  let portfolioService: jest.Mocked<PortfolioService>;

  beforeEach(async () => {
    portfolioService = {
      savePortfolio: jest.fn(),
    } as unknown as jest.Mocked<PortfolioService>;
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [PortfolioManagementComponent],
      providers: [{ provide: PortfolioService, useValue: portfolioService }],
    }).compileComponents();
    fixture = TestBed.createComponent(PortfolioManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display error on failed portfolio save', fakeAsync(() => {
    portfolioService.savePortfolio.mockReturnValue(throwError(() => ({ userMessage: 'Failed to save portfolio.' })));
    component.portfolioForm.setValue({ title: 'Title', description: 'Desc', image: null });
    component.onSubmit();
    tick();
    expect(component.error).toBe('Failed to save portfolio.');
  }));

  it('should display error if required fields missing', () => {
    component.portfolioForm.setValue({ title: '', description: '', image: null });
    component.onSubmit();
    expect(component.error).toBe('Title and description are required.');
  });

  it('should call savePortfolio on valid submit', fakeAsync(() => {
    portfolioService.savePortfolio.mockReturnValue(of({ success: true }));
    component.portfolioForm.setValue({ title: 'Title', description: 'Desc', image: null });
    component.onSubmit();
    tick();
    expect(portfolioService.savePortfolio).toHaveBeenCalled();
  }));
});
