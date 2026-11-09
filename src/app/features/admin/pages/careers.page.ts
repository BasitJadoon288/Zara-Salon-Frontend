import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { Job } from '../../../core/models/models';
import { BRANCHES } from '../../../core/config/salon.config';

const blank = (): Job => ({ title: '', department: '', branch: '', type: 'Full-time', description: '', requirements: '', salaryText: '', openings: 1, closingDate: '', active: true });
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

@Component({
  selector: 'app-careers-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>Careers</h2><button class="adm-btn" (click)="start()"><i class="fa-solid fa-plus"></i>Add job</button></div>
  <div class="adm-card"><p class="adm-note">Jobs you add here appear on the website's Careers page. People apply there, and you see their applications on the <b>Applications</b> page.</p></div>
  @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }

  @if (form(); as f) {
    <div class="adm-card">
      <h3>{{ f._id ? 'Edit job' : 'New job' }}</h3>
      <div class="adm-form">
        <label>Job title *</label><input [(ngModel)]="f.title" maxlength="80" placeholder="e.g. Hair Stylist">
        <label>Department (optional)</label><input [(ngModel)]="f.department" maxlength="60" placeholder="e.g. Hair, Makeup, Reception">
        <div class="two">
          <div><label>Branch</label><select [(ngModel)]="f.branch"><option value="">Any branch</option>@for (b of branches; track b) { <option>{{ b }}</option> }</select></div>
          <div><label>Job type</label><select [(ngModel)]="f.type">@for (t of types; track t) { <option>{{ t }}</option> }</select></div>
        </div>
        <div class="two">
          <div><label>Number of openings</label><input type="number" min="1" max="99" step="1" [(ngModel)]="f.openings"></div>
          <div><label>Apply by (optional)</label><input type="date" [min]="today" [(ngModel)]="f.closingDate"></div>
        </div>
        <label>Salary (optional, shown on the website)</label><input [(ngModel)]="f.salaryText" maxlength="60" placeholder="e.g. PKR 40,000 - 60,000">
        <label>About the job</label><textarea rows="5" [(ngModel)]="f.description" maxlength="3000"></textarea>
        <label>Requirements</label><textarea rows="4" [(ngModel)]="f.requirements" maxlength="2000" placeholder="One point per line"></textarea>
        <label class="adm-chk"><input type="checkbox" [(ngModel)]="f.active">Show on the website (people can apply)</label>
        <div class="adm-row"><button class="adm-btn" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save job' }}</button><button class="adm-btn ghost" (click)="form.set(null)">Cancel</button></div>
      </div>
    </div>
  }

  <div class="adm-card adm-scroll">
    @if (list().length) {
      <table class="adm-table">
        <tr><th>Job</th><th>Branch</th><th>Type</th><th>Openings</th><th>Apply by</th><th>Status</th><th>Applications</th><th></th></tr>
        @for (j of list(); track j._id) {
          <tr>
            <td><b>{{ j.title }}</b><div class="adm-note">{{ j.department }}</div></td>
            <td>{{ j.branch || 'Any' }}</td><td>{{ j.type }}</td><td>{{ j.openings }}</td><td>{{ j.closingDate || '-' }}</td>
            <td><span [class]="'badge ' + (isOpen(j) ? 'confirmed' : 'cancelled')">{{ !j.active ? 'Hidden' : isOpen(j) ? 'Open' : 'Closed' }}</span></td>
            <td><button class="adm-btn ghost sm" (click)="view(j)">{{ j.applications || 0 }} view</button></td>
            <td class="adm-row"><button class="adm-btn ghost sm" (click)="edit(j)">Edit</button><button class="adm-btn danger sm" (click)="remove(j)">Delete</button></td>
          </tr>
        }
      </table>
    } @else { <div class="adm-empty">No jobs yet. People can still send a general application from the Careers page.</div> }
  </div>`,
  styles: [`.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.two label{display:block;margin-bottom:6px}`]
})
export class CareersAdminPage {
  private api = inject(SalonApiService); private router = inject(Router);
  branches = BRANCHES; types = ['Full-time', 'Part-time', 'Internship', 'Contract']; today = todayStr();
  list = signal<Job[]>([]); form = signal<Job | null>(null); saving = signal(false);
  msg = signal(''); isErr = signal(false);

  constructor() { this.load(); }
  private load() { this.api.getJobsAdmin().subscribe(l => this.list.set(l)); }
  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  isOpen(j: Job) { return j.active && (!j.closingDate || j.closingDate >= this.today); }
  start() { this.form.set(blank()); this.msg.set(''); }
  edit(j: Job) { this.form.set({ ...j }); this.msg.set(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  view(j: Job) { this.router.navigate(['/admin/applications'], { queryParams: { job: j._id } }); }

  save() {
    const f = this.form(); if (!f) return;
    if (!f.title.trim()) return this.show('Job title is required.', true);
    const n = Number(f.openings);
    if (!Number.isInteger(n) || n < 1 || n > 99) return this.show('Openings must be a whole number between 1 and 99.', true);
    this.saving.set(true);
    this.api.saveJob({ ...f, title: f.title.trim(), openings: n }).subscribe({
      next: () => { this.saving.set(false); this.form.set(null); this.show('Job saved.'); this.load(); },
      error: e => { this.saving.set(false); this.show(e.error?.error || 'Could not save the job.', true); }
    });
  }
  remove(j: Job) {
    if (!j._id || !confirm(`Delete "${j.title}"? Applications already received are kept. To only stop new applications, untick "Show on the website" instead.`)) return;
    this.api.deleteJob(j._id).subscribe({ next: () => { this.show('Job deleted.'); this.load(); }, error: e => this.show(e.error?.error || 'Could not delete.', true) });
  }
}
