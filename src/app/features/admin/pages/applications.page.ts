import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { Application, ApplicationStatus, ApplicationsPage, Job } from '../../../core/models/models';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { SALON } from '../../../core/config/salon.config';

const STATUSES: { v: ApplicationStatus; label: string }[] = [
  { v: 'new', label: 'New' }, { v: 'shortlisted', label: 'Shortlisted' }, { v: 'interview', label: 'Interview' },
  { v: 'rejected', label: 'Rejected' }, { v: 'hired', label: 'Hired' }
];

@Component({
  selector: 'app-applications-page', standalone: true, imports: [FormsModule, DatePipe, PaginationComponent],
  template: `
  <div class="adm-head"><h2>Applications</h2><span class="adm-note">{{ data()?.total ?? 0 }} found @if (data()?.newCount) { &middot; {{ data()!.newCount }} new }</span></div>
  @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }

  <div class="adm-card adm-filters">
    <input placeholder="Search name, phone or email" [ngModel]="q" (ngModelChange)="q = $event" (keyup.enter)="search()">
    <select [ngModel]="job" (ngModelChange)="job = $event; search()">
      <option value="">All positions</option><option value="general">General applications</option>
      @for (j of jobs(); track j._id) { <option [value]="j._id">{{ j.title }}</option> }
    </select>
    <select [ngModel]="status" (ngModelChange)="status = $event; search()">
      <option value="">All statuses</option>@for (s of statuses; track s.v) { <option [value]="s.v">{{ s.label }}</option> }
    </select>
    <button class="adm-btn" (click)="search()">Search</button>
    <button class="adm-btn ghost" (click)="clear()">Clear filters</button>
  </div>

  <div class="adm-card adm-scroll">
    @if (data(); as d) {
      @if (d.items.length) {
        <table class="adm-table">
          <tr><th>Applied</th><th>Name</th><th>Phone</th><th>Position</th><th>Experience</th><th>CV</th><th>Status</th><th></th></tr>
          @for (a of d.items; track a._id) {
            <tr>
              <td>{{ a.createdAt | date:'mediumDate' }}</td>
              <td><b>{{ a.name }}</b>@if (a.city) { <div class="adm-note">{{ a.city }}</div> }</td>
              <td>{{ a.phone }}</td><td>{{ a.jobTitle }}</td><td>{{ a.experience || '-' }}</td>
              <td>{{ a.hasCv ? 'Yes' : 'No' }}</td>
              <td>
                <select [ngModel]="a.status" (ngModelChange)="setStatus(a, $event)">@for (s of statuses; track s.v) { <option [value]="s.v">{{ s.label }}</option> }</select>
                @if (a.statusChangedBy) { <div class="adm-note small">changed by {{ a.statusChangedBy }}</div> }
              </td>
              <td><button class="adm-btn ghost sm" (click)="open.set(open() === a._id ? '' : a._id); notes = a.notes">{{ open() === a._id ? 'Close' : 'Details' }}</button></td>
            </tr>
            @if (open() === a._id) {
              <tr><td colspan="8">
                <div class="adm-form">
                  <div><b>Email:</b> {{ a.email || '-' }} &nbsp; <b>Expected salary:</b> {{ a.expectedSalary || '-' }}</div>
                  <div><b>Message:</b> <span class="msgtxt">{{ a.message || '-' }}</span></div>
                  <label>Your private notes (the applicant never sees this)</label>
                  <textarea rows="3" [(ngModel)]="notes" maxlength="500"></textarea>
                  <div class="adm-row">
                    <button class="adm-btn sm" (click)="saveNotes(a)">Save notes</button>
                    @if (a.hasCv) { <button class="adm-btn ghost sm" (click)="cv(a)"><i class="fa-solid fa-download"></i>Download CV ({{ size(a.cvSize) }})</button> }
                    <a class="adm-wa" [href]="wa(a)" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i>WhatsApp</a>
                    <button class="adm-btn danger sm" (click)="remove(a)">Delete</button>
                  </div>
                </div>
              </td></tr>
            }
          }
        </table>
        <app-pagination [page]="d.page" [pages]="d.pages" (pageChange)="load($event)" />
      } @else { <div class="adm-empty">No applications match these filters.</div> }
    } @else { <div class="adm-empty">Loading...</div> }
  </div>`,
  styles: [`.small{font-size:12px;margin-top:4px}.msgtxt{white-space:pre-line}`]
})
export class ApplicationsAdminPage {
  private api = inject(SalonApiService); private route = inject(ActivatedRoute);
  statuses = STATUSES;
  data = signal<ApplicationsPage | null>(null); jobs = signal<Job[]>([]);
  q = ''; job = ''; status = ''; notes = '';
  open = signal(''); msg = signal(''); isErr = signal(false);
  private page = 1;

  constructor() {
    this.job = this.route.snapshot.queryParamMap.get('job') || '';
    this.api.getJobsAdmin().subscribe(l => this.jobs.set(l));
    this.load(1);
  }
  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  load(page = this.page) {
    this.api.getApplications({ job: this.job, status: this.status, q: this.q.trim(), page }).subscribe({
      next: d => { this.page = d.page; this.data.set(d); this.open.set(''); },
      error: e => this.show(e.error?.error || 'Could not load the applications.', true)
    });
  }
  search() { this.load(1); }
  clear() { this.q = ''; this.job = ''; this.status = ''; this.load(1); }

  setStatus(a: Application, status: ApplicationStatus) {
    this.api.updateApplication(a._id, { status }).subscribe({
      next: () => this.load(), error: e => { this.show(e.error?.error || 'Could not update the status.', true); this.load(); }
    });
  }
  saveNotes(a: Application) {
    this.api.updateApplication(a._id, { notes: this.notes }).subscribe({
      next: () => { this.show('Notes saved.'); this.load(); }, error: e => this.show(e.error?.error || 'Could not save the notes.', true)
    });
  }
  cv(a: Application) {
    this.api.downloadCv(a._id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob); const link = document.createElement('a');
        link.href = url; link.download = a.cvName || 'cv'; document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      },
      error: () => this.show('Could not download the CV.', true)
    });
  }
  remove(a: Application) {
    if (!confirm(`Delete ${a.name}'s application? This also deletes the CV.`)) return;
    this.api.deleteApplication(a._id).subscribe({ next: () => { this.show('Application deleted.'); this.load(); }, error: e => this.show(e.error?.error || 'Could not delete.', true) });
  }

  size(b: number) { return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  wa(a: Application) {
    let n = a.phone.replace(/\D/g, ''); if (n.startsWith('0')) n = '92' + n.slice(1);
    return `https://wa.me/${n}?text=${encodeURIComponent(`Assalam o Alaikum ${a.name}, thank you for applying for ${a.jobTitle} at ${SALON.name}.`)}`;
  }
}
