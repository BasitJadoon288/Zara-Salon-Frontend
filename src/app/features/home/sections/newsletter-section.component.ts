import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
@Component({
  selector: 'app-newsletter-section', standalone: true, imports: [FormsModule],
  template: `<section class="news center"><div class="container"><h2>Want to be kept in the know?</h2><p>Sign up for latest news, offers and events</p><br>
    @if (message) { <div class="msg">{{ message }}</div> }
    <div class="row"><input type="email" placeholder="Your email" [(ngModel)]="email">
    <select [(ngModel)]="gender"><option>Female</option><option>Male</option></select>
    <button class="btn" (click)="submit()">Yes please</button></div></div></section>`,
  styles: [`.news{background:var(--dark);color:#fff}.news h2{color:#fff}.row{display:flex;gap:10px;max-width:640px;margin:auto;flex-wrap:wrap}
  .row input,.row select{flex:1;margin:0;min-width:160px}`]
})
export class NewsletterSectionComponent {
  private api = inject(SalonApiService);
  email = ''; gender: 'Female' | 'Male' = 'Female'; message = '';
  submit() {
    if (!this.email) return;
    this.api.subscribe({ email: this.email, gender: this.gender }).subscribe({
      next: () => { this.message = 'Thank you for subscribing!'; this.email = ''; },
      error: () => (this.message = 'Error, try again.')
    });
  }
}
