import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SubscriptionsAdminService, Invoice } from '../../../core/services/subscriptions-admin.service';

@Component({
  selector: 'app-admin-invoices',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './invoices.html',
  styleUrls: ['./invoices.css']
})
export class AdminInvoicesComponent implements OnInit {
  private svc = inject(SubscriptionsAdminService);
  private cdr = inject(ChangeDetectorRef);

  invoices: Invoice[] = [];
  isLoading = true;

  statusLabels: Record<string, string> = {
    'PENDING': 'รอชำระ',
    'PAID': 'ชำระแล้ว',
    'CANCELLED': 'ยกเลิก'
  };

  statusColors: Record<string, string> = {
    'PENDING': 'bg-warning text-dark',
    'PAID': 'bg-success',
    'CANCELLED': 'bg-danger'
  };

  ngOnInit() { this.loadInvoices(); }

  loadInvoices() {
    this.isLoading = true;
    this.svc.getInvoices().subscribe({
      next: (data) => { this.invoices = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  // Update status to PAID
  markAsPaid(id: number) {
    if (!confirm('ยืนยันการตั้งค่าสถานะเป็น "ชำระแล้ว"?')) return;
    this.svc.updateInvoiceStatus(id, 'PAID').subscribe({ next: () => this.loadInvoices() });
  }

  cancel(id: number) {
    if (!confirm('ยืนยันการยกเลิกรายการนี้?')) return;
    this.svc.updateInvoiceStatus(id, 'CANCELLED').subscribe({ next: () => this.loadInvoices() });
  }
}
