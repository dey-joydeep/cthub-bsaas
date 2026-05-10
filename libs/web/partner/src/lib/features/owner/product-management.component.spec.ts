import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductManagementComponent } from './product-management.component';
import { ProductService } from './product.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('ProductManagementComponent', () => {
  let component: ProductManagementComponent;
  let fixture: ComponentFixture<ProductManagementComponent>;
  let productService: jest.Mocked<ProductService>;

  beforeEach(async () => {
    productService = {
      saveProduct: jest.fn(),
      getProducts: jest.fn(),
      updateProduct: jest.fn(),
    } as unknown as jest.Mocked<ProductService>;
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ProductManagementComponent],
      providers: [{ provide: ProductService, useValue: productService }],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display error on failed product save', fakeAsync(() => {
    productService.saveProduct.mockReturnValue(
      throwError(() => ({
        error: { userMessage: 'Failed to save product.' },
      })),
    );
    component.productForm.setValue({ name: 'Test', description: 'Desc', price: 10, stock: 5 });
    component.onSubmit();
    tick();
    expect(component.error).toBe('Failed to save product.');
  }));

  it('should display error if required fields missing', () => {
    component.productForm.setValue({ name: '', description: '', price: '', stock: '' });
    component.onSubmit();
    expect(component.error).toBe('All fields are required.');
  });

  it('should call saveProduct on valid submit', fakeAsync(() => {
    const mockProduct = {
      id: '1',
      name: 'Shampoo',
      description: 'Test shampoo',
      price: 10,
      stock: 5,
      isActive: true,
    };

    // productService.getProducts.mockReturnValue(of({
    //   success: true,
    //   data: [mockProduct],
    //   message: 'Products retrieved successfully'
    // }));

    productService.saveProduct.mockReturnValue(
      of({
        success: true,
        data: { ...mockProduct, id: '1' },
        message: 'Product saved successfully',
      }),
    );

    component.productForm.setValue({
      name: 'Shampoo',
      description: 'Test shampoo',
      price: 10,
      stock: 5,
    });

    component.onSubmit();
    tick();

    expect(productService.saveProduct).toHaveBeenCalledWith({
      name: 'Shampoo',
      description: 'Test shampoo',
      price: 10,
      stock: 5,
      isActive: true,
    });
  }));
});
