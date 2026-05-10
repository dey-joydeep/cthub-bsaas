import { Component, Input, OnInit } from '@angular/core';
import { StaffRequestService, StaffRequest } from '../../services/staff-request.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-staff-request-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-request-list.component.html',
})
export class StaffRequestListComponent implements OnInit {
  @Input() staffId: string = '';
  requests: StaffRequest[] = [];
  loading = false;
  error: string | null = null;

  constructor(private staffRequestService: StaffRequestService) {}

  ngOnInit() {
    this.fetchRequests();
  }

  fetchRequests() {
    if (!this.staffId) return;
    this.loading = true;
    this.error = null;
    this.staffRequestService.getRequestsForStaff(this.staffId).subscribe({
      next: (data) => {
        this.requests = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load requests.';
        this.loading = false;
      },
    });
  }
}
