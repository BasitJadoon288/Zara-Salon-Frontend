import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { Review } from '../../../core/models/models';

const blank = (): Review => ({ name: '', text: '', rating: 5, visible: true });

@Component({
  selector: 'app-reviews-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>Reviews</h2></div>

  <div class="adm-card">
    <h3>{{ form._id ? 'Edit review' : 'Add a review' }}</h3>
    @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }
    <div class="adm-form">
      <label>Customer name</label><input [(ngModel)]="form.name" maxlength="60">
      <label>Rating</label>
      <select [(ngModel)]="form.rating"><option [ngValue]="5">5 stars</option><option [ngValue]="4">4 stars</option><option [ngValue]="3">3 stars</option><option [ngValue]="2">2 stars</option><option [ngValue]="1">1 star</option></select>
      <label>Review</label><textarea rows="4" [(ngModel)]="form.text" maxlength="500"></textarea>
      <label class="adm-chk"><input type="checkbox" [(ngModel)]="form.visible"> Show on the website</label>
      <div class="adm-row">
        <button class="adm-btn" (click)="save()">{{ form._id ? 'Save changes' : 'Add review' }}</button>
        @if (form._id) { <button class="adm-btn ghost" (click)="form = blank()">Cancel</button> }
      </div>
    </div>
  </div>

  <div class="adm-card adm-scroll">
    @if (items().length) {
      <table class="adm-table">
        <tr><th>Customer</th><th>Rating</th><th>Review</th><th>On website</th><th></th></tr>
        @for (r of items(); track r._id) {
          <tr>
            <td>{{ r.name }}</td>
            <td><span class="adm-stars">{{ '★'.repeat(r.rating) }}</span></td>
            <td>{{ r.text }}</td>
            <td><span [class]="'badge ' + (r.visible ? 'confirmed' : 'cancelled')">{{ r.visible ? 'Visible' : 'Hidden' }}</span></td>
            <td class="adm-row">
              <button class="adm-btn ghost sm" (click)="toggle(r)">{{ r.visible ? 'Hide' : 'Show' }}</button>
              <button class="adm-btn ghost sm" (click)="edit(r)">Edit</button>
              <button class="adm-btn danger sm" (click)="remove(r)">Delete</button>
            </td>
          </tr>
        }
      </table>
    } @else { <div class="adm-empty">No reviews yet. Add the first one above.</div> }
  </div>`
})
export class ReviewsPage {
  private api = inject(SalonApiService);
  items = signal<Review[]>([]);
  form: Review = blank();
  msg = signal(''); isErr = signal(false);
  blank = blank;

  constructor() { this.load(); }
  private load() { this.api.getReviewsAdmin().subscribe(l => this.items.set(l)); }
  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  save() {
    if (!this.form.name.trim() || !this.form.text.trim()) { this.show('Enter the customer name and the review.', true); return; }
    const wasEdit = !!this.form._id;
    this.api.saveReview(this.form).subscribe({
      next: () => { this.form = blank(); this.load(); this.show(wasEdit ? 'Review updated.' : 'Review added.'); },
      error: e => this.show(e.error?.error || 'Could not save the review.', true)
    });
  }
  edit(r: Review) { this.form = { ...r }; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  toggle(r: Review) { this.api.saveReview({ ...r, visible: !r.visible }).subscribe(() => this.load()); }
  remove(r: Review) {
    if (!confirm(`Delete the review from ${r.name}?`)) return;
    this.api.deleteReview(r._id!).subscribe(() => { this.load(); this.show('Review deleted.'); });
  }
}
