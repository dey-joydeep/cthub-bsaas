import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
})
export class ConfirmDialogComponent {
  public readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  public readonly data = inject(MAT_DIALOG_DATA) as ConfirmDialogData;
}

export interface ConfirmDialogData {
  readonly title: string;
  readonly message: string;
}
