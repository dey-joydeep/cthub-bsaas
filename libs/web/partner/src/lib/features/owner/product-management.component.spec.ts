import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductManagementComponent } from './product-management.component';
import { ProductService } from './product.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('ProductManagementComponent', () => {
  let component: ProductManagementComponent;
  let fixture: ComponentFixture<ProductManagementComponent>;
  let productService: vi.Mocked<ProductService>;

  beforeEach(async () => {
    productService = {
      saveProduct: vi.fn(),
      getProducts: vi.fn(),
      updateProduct: vi.fn(),
      createProduct: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ProductManagementComponent],
      providers: [{ provide: ProductService, useValue: productService }],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display error on failed product save', fakeAsync(() => {
    productService.createProduct.mockReturnValue(
      throwError(() => ({
        userMessage: 'Failed to save product.',
      })),
    );
    component.productForm.patchValue({ name: 'Test', description: 'Desc', price: 10, quantity: 5 });
    component.onSubmit();
    tick();
    expect(component.error).toBe('Failed to save product.');
  }));

  it('should display error if required fields missing', () => {
    component.productForm.patchValue({ name: '', description: '', price: null, quantity: null });
    component.onSubmit();
    expect(component.productForm.invalid).toBe(true);
  });

  it('should call saveProduct on valid submit', fakeAsync(() => {
    const mockProduct = {
      id: '1',
      name: 'Shampoo',
      description: 'Test shampoo',
      price: 10,
      quantity: 5,
      isActive: true,
    };

    productService.createProduct.mockReturnValue(
      of({
        success: true,
        data: { ...mockProduct, id: '1' },
        message: 'Product saved successfully',
      }),
    );

    component.productForm.patchValue({
      name: 'Shampoo',
      description: 'Test shampoo',
      price: 10,
      quantity: 5,
    });

    component.onSubmit();
    tick();

    expect(productService.createProduct).toHaveBeenCalled();
  }));
});
