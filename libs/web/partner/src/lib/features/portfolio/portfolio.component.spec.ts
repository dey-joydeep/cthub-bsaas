import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { PortfolioComponent } from './portfolio.component';
import { PortfolioService } from './portfolio.service';

class MockPortfolioService {
  getPortfolioItems = jest.fn().mockReturnValue(of([]));
  createPortfolioItem = jest.fn().mockReturnValue(of({}));
  updatePortfolioItem = jest.fn().mockReturnValue(of({}));
  deletePortfolioItem = jest.fn().mockReturnValue(of({}));
}

describe('PortfolioComponent', () => {
  let component: PortfolioComponent;
  let fixture: ComponentFixture<PortfolioComponent>;
  let service: MockPortfolioService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, ReactiveFormsModule, PortfolioComponent, TranslateModule.forRoot()],
      providers: [
        { provide: PortfolioService, useClass: MockPortfolioService },
        provideHttpClient(),
        provideRouter([]),
        provideAnimations(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PortfolioComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(PortfolioService) as any;
    component.ngOnInit(); // Ensure form is initialized before tests
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load portfolio items on init', () => {
    expect(service.getPortfolioItems).toHaveBeenCalled();
  });

  it('should handle load failure', () => {
    const error = new Error('Failed to load portfolio items');
    service.getPortfolioItems.mockReturnValue(throwError(() => error));
    component.ngOnInit();
    expect(service.getPortfolioItems).toHaveBeenCalled();
    // Verify error handling through the component's public API
    expect(component.portfolioItems).toEqual([]);
  });

  it('should add a portfolio item', () => {
    component.addForm.setValue({
      tenantId: 't',
      userId: 'u',
      imagePath: 'some/path.jpg',
      description: 'desc',
    });
    component.selectedImage = new File([''], 'test.jpg', { type: 'image/jpeg' });
    service.createPortfolioItem.mockReturnValue(
      of({ id: '1', imagePath: 'some/path.jpg', description: 'desc', tenantId: 't', userId: 'u' }),
    );
    component.addPortfolioItem();
    expect(service.createPortfolioItem).toHaveBeenCalled();
  });

  it('should handle add error', () => {
    const error = new Error('Failed to add portfolio item');
    component.addForm.setValue({
      tenantId: 't',
      userId: 'u',
      imagePath: 'some/path.jpg',
      description: 'desc',
    });
    component.selectedImage = new File([''], 'test.jpg', { type: 'image/jpeg' });
    service.createPortfolioItem.mockReturnValue(throwError(() => error));

    // Store the initial state
    const initialItems = [...component.portfolioItems];

    component.addPortfolioItem();

    // Verify the service was called
    expect(service.createPortfolioItem).toHaveBeenCalled();

    // Verify the items array wasn't modified on error
    expect(component.portfolioItems).toEqual(initialItems);
  });
});
