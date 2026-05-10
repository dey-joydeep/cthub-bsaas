import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from './portfolio.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import { PortfolioItem } from './models/portfolio.model';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss'],
})
export class PortfolioComponent extends AbstractBaseComponent {
  portfolioItems: PortfolioItem[] = [];
  addForm: FormGroup;
  editIndex: number | null = null;
  editForm: FormGroup;
  selectedImage: File | null = null;
  editSelectedImage: File | null = null;

  constructor(
    public portfolioService: PortfolioService,
    private fb: FormBuilder,
  ) {
    super();
    this.addForm = this.fb.group({
      tenantId: ['', Validators.required],
      userId: ['', Validators.required],
      imagePath: ['', Validators.required],
      description: ['', Validators.required],
    });
    this.editForm = this.fb.group({
      imagePath: ['', Validators.required],
      description: ['', Validators.required],
    });

    // Subscribe to error state changes
    this.errorService.error$.subscribe((errorState) => {
      if (errorState) {
        this.loading = false;
        this.error = errorState.message;
        // Clear error after 5 seconds
        setTimeout(() => {
          this.error = null;
        }, 5000);
      }
    });
  }

  public override ngOnInit(): void {
    this.fetchPortfolio();
  }

  fetchPortfolio() {
    this.loading = true;
    this.error = null;
    const tenantId = this.addForm.value.tenantId;
    this.portfolioService.getPortfolioItems(tenantId).subscribe({
      next: (items) => {
        this.portfolioItems = items;
        this.loading = false;
      },
      error: (err) => {
        this.handleError(err);
      },
    });
  }

  onImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
    }
  }

  onEditImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editSelectedImage = input.files[0];
    }
  }

  addPortfolioItem() {
    if (this.addForm.invalid || !this.selectedImage) return;
    this.loading = true;
    this.error = null;
    const tenantId = this.addForm.value.tenantId;
    const userId = this.addForm.value.userId;
    const imagePath = this.addForm.value.imagePath;
    const formData = new FormData();
    formData.append('tenant_id', tenantId);
    formData.append('user_id', userId);
    formData.append('image_path', imagePath);
    formData.append('description', this.addForm.value.description);
    formData.append('image', this.selectedImage);
    this.portfolioService.createPortfolioItem(formData).subscribe({
      next: () => {
        this.fetchPortfolio();
        this.addForm.reset();
        this.selectedImage = null;
        this.loading = false;
      },
      error: (err) => {
        this.handleError(err);
      },
    });
  }

  startEdit(index: number) {
    this.editIndex = index;
    const item = this.portfolioItems[index];
    this.editForm.setValue({
      imagePath: item.imagePath,
      description: item.description,
    });
    this.editSelectedImage = null;
  }

  saveEdit(index: number) {
    if (this.editForm.invalid) return;
    this.loading = true;
    this.error = null;
    const id = this.portfolioItems[index].id!;
    const formData = new FormData();
    formData.append('image_path', this.editForm.value.imagePath);
    formData.append('description', this.editForm.value.description);
    if (this.editSelectedImage) {
      formData.append('image', this.editSelectedImage);
    }
    this.portfolioService.updatePortfolioItem(id, formData).subscribe({
      next: (item) => {
        this.portfolioItems[index] = { ...this.portfolioItems[index], ...item };
        this.editIndex = null;
        this.editSelectedImage = null;
        this.loading = false;
      },
      error: (err) => {
        this.handleError(err);
      },
    });
  }

  cancelEdit() {
    this.editIndex = null;
    this.editSelectedImage = null;
  }

  deletePortfolioItem(index: number) {
    this.loading = true;
    this.error = null;
    const id = this.portfolioItems[index].id!;
    this.portfolioService.deletePortfolioItem(id).subscribe({
      next: () => {
        this.portfolioItems.splice(index, 1);
        this.loading = false;
      },
      error: (err) => {
        this.handleError(err);
      },
    });
  }

  getPortfolioImagePath(item: PortfolioItem): string {
    // Use camelCase for TypeScript, but map from snake_case API
    return item.imagePath || 'assets/default-portfolio.png';
  }
}
