import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuditLogsService, AuditLog } from '../../../core/services/audit-logs.service';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './audit-logs.html',
  styleUrls: ['./audit-logs.css']
})
export class AdminAuditLogsComponent implements OnInit {
  private auditLogsService = inject(AuditLogsService);
  private cdr = inject(ChangeDetectorRef);

  logs: AuditLog[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    this.auditLogsService.getLogs().subscribe({
      next: (data) => {
        this.logs = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load audit logs:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
