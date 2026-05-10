import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { ProductService } from './product.service';
import { ProductParams, ProductCategoryParams, ProductImageParams } from '../../models/product-params.model';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatCardModule,
    MatTabsModule,
    TranslateModule,
  ],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss'],
})
export class ProductManagementComponent implements OnInit {
  productForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  selectedTabIndex = 0;

  // Mock data
  categories: ProductCategoryParams[] = [
    { id: '1', name: 'Hair Care' },
    { id: '2', name: 'Skincare' },
    { id: '3', name: 'Makeup' },
  ];

  private salonId = 'salon-123';
  private currentUserId = 'user-123';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
  ) {
    this.productForm = this.fb.group({
      // Basic Info
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(1000)],
      sku: [''],
      barcode: [''],

      // Pricing
      price: [0, [Validators.required, Validators.min(0)]],
      compareAtPrice: [0, Validators.min(0)],
      costPerItem: [0, Validators.min(0)],

      // Inventory
      quantity: [0, [Validators.required, Validators.min(0)]],
      trackQuantity: [true],
      continueSellingWhenOutOfStock: [false],

      // Organization
      categories: [[]],
      tags: [''],

      // Status
      isActive: [true],
      isFeatured: [false],

      // Images
      images: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.addNewImage();
  }

  get images() {
    return this.productForm.get('images') as FormArray;
  }

  addNewImage(image: Partial<ProductImageParams> = {}) {
    this.images.push(
      this.fb.group({
        url: [image.url || '', Validators.required],
        altText: [image.altText || ''],
        isDefault: [image.isDefault || false],
      }),
    );
  }

  removeImage(index: number) {
    this.images.removeAt(index);
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      this.error = 'Please fill in all required fields.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const formValue = this.productForm.value;

    const productData: any = {
      name: formValue.name,
      description: formValue.description,
      price: parseFloat(formValue.price),
      compareAtPrice: formValue.compareAtPrice ? parseFloat(formValue.compareAtPrice) : undefined,
      costPerItem: formValue.costPerItem ? parseFloat(formValue.costPerItem) : undefined,
      sku: formValue.sku || undefined,
      barcode: formValue.barcode || undefined,
      quantity: parseInt(formValue.quantity, 10),
      trackQuantity: formValue.trackQuantity,
      continueSellingWhenOutOfStock: formValue.continueSellingWhenOutOfStock,
      categories: formValue.categories || [],
      tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()) : [],
      isActive: formValue.isActive,
      isFeatured: formValue.isFeatured,
      images: formValue.images || [],
      salonId: this.salonId,
      createdBy: this.currentUserId,
    };

    const saveOperation = productData.id
      ? this.productService.updateProduct({ ...productData, id: productData.id, updatedBy: this.currentUserId })
      : this.productService.createProduct(productData);

    saveOperation.subscribe({
      next: (res: { success: boolean }) => {
        this.loading = false;
        if (res.success) {
          this.success = productData.id ? 'Product updated!' : 'Product created!';
          if (!productData.id) {
            this.productForm.reset({
              price: 0,
              compareAtPrice: 0,
              costPerItem: 0,
              quantity: 0,
              trackQuantity: true,
              continueSellingWhenOutOfStock: false,
              categories: [],
              isActive: true,
              isFeatured: false,
            });
            this.images.clear();
            this.addNewImage();
          }
        } else {
          this.error = 'Failed to save product.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.userMessage || 'Error saving product.';
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
