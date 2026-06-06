import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, type AbstractControl, type ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Observable, forkJoin } from 'rxjs';

import { BranchProfile } from '../salon-owner-settings/models/salon-owner-settings.models';
import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import { BranchStock, Product, ProductStatus, ProductUnit, StockMovementReason } from './models/pos-inventory.models';
import { PosInventoryApi } from './pos-inventory.api';

function nonZeroQuantity(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value.trim();
  if (!/^-?\d+(\.\d{1,3})?$/.test(value)) {
    return null;
  }
  return Number(value) === 0 ? { nonZeroQuantity: true } : null;
}

@Component({
  selector: 'lib-owner-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsApi = inject(SalonOwnerSettingsApi);
  private readonly inventoryApi = inject(PosInventoryApi);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly branches = signal<readonly BranchProfile[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly branchStock = signal<readonly BranchStock[]>([]);
  protected readonly lowStock = signal<readonly BranchStock[]>([]);
  protected readonly selectedProduct = signal<Product | null>(null);

  protected readonly units: readonly ProductUnit[] = ['PIECE', 'ML', 'GRAM', 'PACK'];
  protected readonly statuses: readonly ProductStatus[] = ['ACTIVE', 'INACTIVE'];
  protected readonly reasons: readonly StockMovementReason[] = ['PURCHASE', 'SALE', 'ADJUSTMENT', 'DAMAGE', 'RETURN'];

  protected readonly branchForm = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    q: [''],
    lowOnly: [false],
  });

  protected readonly productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    sku: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    unit: this.fb.nonNullable.control<ProductUnit>('PIECE', Validators.required),
    retailPrice: ['0.00', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    reorderPoint: ['', Validators.pattern(/^\d+(\.\d{1,3})?$/)],
    status: this.fb.nonNullable.control<ProductStatus>('ACTIVE', Validators.required),
  });

  protected readonly movementForm = this.fb.nonNullable.group({
    productId: ['', Validators.required],
    quantity: ['1', [Validators.required, Validators.pattern(/^-?\d+(\.\d{1,3})?$/), nonZeroQuantity]],
    reason: this.fb.nonNullable.control<StockMovementReason>('PURCHASE', Validators.required),
    note: [''],
  });

  constructor() {
    this.loadInitialData();
  }

  protected selectProduct(product: Product): void {
    this.selectedProduct.set(product);
    this.productForm.reset({
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      retailPrice: product.retailPrice,
      reorderPoint: product.reorderPoint ?? '',
      status: product.status,
    });
    this.movementForm.patchValue({ productId: product.id });
  }

  protected newProduct(): void {
    this.selectedProduct.set(null);
    this.productForm.reset({
      name: '',
      sku: '',
      unit: 'PIECE',
      retailPrice: '0.00',
      reorderPoint: '',
      status: 'ACTIVE',
    });
  }

  protected saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    const value = this.productForm.getRawValue();
    const input = {
      name: value.name,
      sku: value.sku,
      unit: value.unit,
      retailPrice: value.retailPrice,
      reorderPoint: value.reorderPoint || undefined,
      status: value.status,
    };
    const selected = this.selectedProduct();
    const request = selected ? this.inventoryApi.updateProduct(selected.id, input) : this.inventoryApi.createProduct(input);
    this.persist(request, (product) => {
      this.selectedProduct.set(product);
      this.reloadProducts();
    });
  }

  protected recordMovement(): void {
    if (this.branchForm.invalid || this.movementForm.invalid) {
      this.error.set('Select a branch, product, quantity, and reason.');
      this.branchForm.markAllAsTouched();
      this.movementForm.markAllAsTouched();
      return;
    }
    const branch = this.branchForm.getRawValue();
    const movement = this.movementForm.getRawValue();
    this.persist(
      this.inventoryApi.createStockMovement({
        branchId: branch.branchId,
        productId: movement.productId,
        quantity: movement.quantity,
        reason: movement.reason,
        note: movement.note || undefined,
      }),
      () => this.reloadStock(),
    );
  }

  protected reloadStock(): void {
    const branchId = this.branchForm.controls.branchId.value;
    if (!branchId) {
      return;
    }
    forkJoin({
      stock: this.inventoryApi.listBranchStock(branchId),
      low: this.inventoryApi.listLowStockAlerts(branchId),
    }).subscribe({
      next: ({ stock, low }) => {
        this.branchStock.set(stock.items);
        this.lowStock.set(low.items);
      },
      error: () => this.error.set('Branch stock could not be loaded.'),
    });
  }

  protected visibleStock(): readonly BranchStock[] {
    return this.branchForm.controls.lowOnly.value ? this.lowStock() : this.branchStock();
  }

  private loadInitialData(): void {
    this.loading.set(true);
    forkJoin({
      branches: this.settingsApi.listBranches(),
      products: this.inventoryApi.listProducts(),
    }).subscribe({
      next: ({ branches, products }) => {
        this.branches.set(branches.items);
        this.products.set(products.items);
        this.branchForm.patchValue({ branchId: branches.items[0]?.id ?? '' });
        this.newProduct();
        this.reloadStock();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Inventory references could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  protected reloadProducts(): void {
    this.inventoryApi.listProducts(this.branchForm.controls.q.value).subscribe({
      next: (result) => this.products.set(result.items),
      error: () => this.error.set('Products could not be loaded.'),
    });
  }

  private persist<T>(request: Observable<T>, onSuccess: (value: T) => void): void {
    this.saving.set(true);
    this.message.set(null);
    this.error.set(null);
    request.subscribe({
      next: (value) => {
        onSuccess(value);
        this.message.set('Inventory updated.');
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Inventory action could not be completed.');
        this.saving.set(false);
      },
    });
  }
}
