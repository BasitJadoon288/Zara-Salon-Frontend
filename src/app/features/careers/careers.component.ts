import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../core/services/salon-api.service';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { ApplyPayload, Job } from '../../core/models/models';
import { SectionTitleComponent } from '../../shared/components/section-title.component';

const MAX_CV = 2 * 1024 * 1024;
const ALLOWED = /\.(pdf|docx?|jpe?g|png)$/i;
const blank = (): ApplyPayload => ({ jobId: '', name: '', phone: '', email: '', city: '', experience: '', expectedSalary: '', message: '', website: '' });

// Career page: khuli jobs dekhna aur apply karna (CV optional)
@Component({
  selector: 'app-careers', standalone: true, imports: [FormsModule, SectionTitleComponent, RevealDirective],
  template: `<section class="container"><app-section-title eyebrow="Join our team" title="Careers" /><br>
    <p class="intro">We are always happy to meet talented people. See our open positions below, or send a general application.</p>

    @if (jobs === null) { <p class="state">Loading positions...</p> }
    @else if (!jobs.length) { <p class="state">There are no open positions right now. You can still send a general application below.</p> }
    @else {
      <div class="jobs">
        @for (j of jobs; track j._id; let i = $index) {
          <article class="job" reveal [revealDelay]="(i % 3) * 90">
            <div class="head"><h3>{{ j.title }}</h3><span class="tag">{{ j.type }}</span></div>
            <p class="meta">
              @if (j.department) { <span>{{ j.department }}</span> }
              <span>{{ j.branch || 'Any branch' }}</span>
              <span>{{ j.openings }} opening{{ j.openings === 1 ? '' : 's' }}</span>
              @if (j.salaryText) { <span>{{ j.salaryText }}</span> }
              @if (j.closingDate) { <span>Apply by {{ j.closingDate }}</span> }
            </p>
            @if (open === j._id) {
              @if (j.description) { <h4>About the job</h4><p class="txt">{{ j.description }}</p> }
              @if (j.requirements) { <h4>Requirements</h4><p class="txt">{{ j.requirements }}</p> }
            }
            <div class="actions">
              @if (j.description || j.requirements) { <button type="button" class="btn ghost" (click)="open = open === j._id ? '' : j._id!">{{ open === j._id ? 'Show less' : 'Read more' }}</button> }
              <button type="button" class="btn" (click)="apply(j._id!)">Apply now</button>
            </div>
          </article>
        }
      </div>
    }

    <div class="form" #formBox reveal>
      <h3>Apply now</h3>
      @if (done) { <div class="msg">Thank you! Your application was sent. We will contact you if you are shortlisted.</div>
        <button class="btn" type="button" (click)="done = false">Send another application</button>
      } @else {
        @if (message) { <div class="msg err">{{ message }}</div> }
        <label>Position</label>
        <select [(ngModel)]="form.jobId">
          <option value="">General application (no specific position)</option>
          @for (j of jobs ?? []; track j._id) { <option [value]="j._id">{{ j.title }}{{ j.branch ? ' - ' + j.branch : '' }}</option> }
        </select>
        <input placeholder="Full name *" [(ngModel)]="form.name" maxlength="80">
        <input placeholder="Phone *" [(ngModel)]="form.phone">
        <input placeholder="Email" [(ngModel)]="form.email">
        <input placeholder="City" [(ngModel)]="form.city" maxlength="60">
        <input placeholder="Experience (for example: 3 years)" [(ngModel)]="form.experience" maxlength="60">
        <input placeholder="Expected salary (optional)" [(ngModel)]="form.expectedSalary" maxlength="40">
        <textarea rows="4" placeholder="Tell us about yourself (optional)" [(ngModel)]="form.message" maxlength="1000"></textarea>
        <label>CV (optional): PDF, Word, JPG or PNG, up to 2 MB</label>
        <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" (change)="onFile($event)">
        @if (cvName) { <p class="fine">Selected: {{ cvName }}</p> }
        <input class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" [(ngModel)]="form.website" name="website">
        <button class="btn" type="button" (click)="submit()" [disabled]="sending">{{ sending ? 'Sending...' : 'Submit application' }}</button>
      }
    </div>
  </section>`,
  styles: [`
  .intro{text-align:center;max-width:620px;margin:0 auto 26px;color:var(--muted)}
  .state{text-align:center;color:var(--muted);padding:20px 0 30px}
  .jobs{display:grid;gap:16px;max-width:820px;margin:0 auto 40px}
  .job{background:var(--surface);box-shadow:0 0 0 1px var(--card-ring);border-radius:14px;padding:20px}
  .head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
  .head h3{margin:0}
  .tag{font-size:12px;padding:3px 12px;border-radius:20px;background:var(--soft);color:var(--rose-ink)}
  .meta{display:flex;flex-wrap:wrap;gap:6px 16px;color:var(--muted);font-size:13px;margin:8px 0 12px}
  .job h4{margin:14px 0 4px;font-size:14px}.txt{white-space:pre-line;font-size:14px;margin:0}
  .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
  .btn.ghost{background:transparent;color:var(--rose-ink);border:1px solid var(--rose-ink)}
  .form{max-width:560px;margin:0 auto;background:var(--surface);box-shadow:0 0 0 1px var(--card-ring);border-radius:14px;padding:26px}
  .form h3{margin-bottom:14px}.form label{display:block;font-size:13px;color:var(--muted);margin:2px 0 6px}
  .fine{font-size:13px;color:var(--muted);margin:-4px 0 12px}
  .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
  .btn[disabled]{opacity:.6;cursor:default}`]
})
export class CareersComponent {
  private api = inject(SalonApiService);
  @ViewChild('formBox') formBox?: ElementRef<HTMLElement>;
  jobs: Job[] | null = null; open = '';
  form = blank(); cv: { name: string; data: string } | null = null; cvName = '';
  sending = false; done = false; message = '';

  constructor() { this.api.getJobs().subscribe({ next: j => this.jobs = j, error: () => this.jobs = [] }); }

  apply(id: string) { this.form.jobId = id; this.done = false; this.message = ''; setTimeout(() => this.formBox?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' })); }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement; const f = input.files?.[0];
    this.cv = null; this.cvName = ''; this.message = '';
    if (!f) return;
    if (!ALLOWED.test(f.name)) { this.message = 'The CV must be a PDF, Word, JPG or PNG file.'; input.value = ''; return; }
    if (f.size > MAX_CV) { this.message = 'The CV must be smaller than 2 MB.'; input.value = ''; return; }
    const r = new FileReader();
    r.onload = () => { this.cv = { name: f.name, data: r.result as string }; this.cvName = `${f.name} (${Math.max(1, Math.round(f.size / 1024))} KB)`; };
    r.onerror = () => { this.message = 'Could not read the file. Please choose it again.'; };
    r.readAsDataURL(f);
  }

  submit() {
    const f = this.form;
    if (!f.name.trim() || !f.phone.trim()) { this.message = 'Please enter your name and phone number.'; return; }
    this.sending = true; this.message = '';
    const payload: ApplyPayload = { ...f, jobId: f.jobId || undefined, cv: this.cv || undefined };
    this.api.applyForJob(payload).subscribe({
      next: () => { this.sending = false; this.done = true; const jobId = f.jobId; this.form = { ...blank(), jobId }; this.cv = null; this.cvName = ''; },
      error: e => { this.sending = false; this.message = e.error?.error || 'Something went wrong. Please try again.'; }
    });
  }
}
