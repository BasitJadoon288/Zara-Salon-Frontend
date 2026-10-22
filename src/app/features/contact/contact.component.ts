import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../core/services/salon-api.service';
import { ContactPayload } from '../../core/models/models';
import { SALON } from '../../core/config/salon.config';
import { SectionTitleComponent } from '../../shared/components/section-title.component';
const empty = (): ContactPayload => ({ name: '', email: '', phone: '', message: '' });
@Component({
  selector: 'app-contact', standalone: true, imports: [FormsModule, SectionTitleComponent],
  template: `<section class="container"><app-section-title eyebrow="Contact" title="Get in touch" /><br>
    <div class="wrap"><div><p>📞 {{ salon.phone }}</p><p>✉ {{ salon.email }}</p><p>📍 {{ salon.address }}</p></div>
    <div>@if (message) { <div class="msg" [class.err]="isError">{{ message }}</div> }
      <input placeholder="Name *" [(ngModel)]="form.name"><input placeholder="Email" [(ngModel)]="form.email">
      <input placeholder="Phone" [(ngModel)]="form.phone"><textarea rows="5" placeholder="Message *" [(ngModel)]="form.message"></textarea>
      <button class="btn" (click)="send()">Send</button></div></div></section>`,
  styles: [`.wrap{display:grid;grid-template-columns:1fr 1fr;gap:40px}@media(max-width:760px){.wrap{grid-template-columns:1fr}}`]
})
export class ContactComponent {
  private api = inject(SalonApiService);
  salon = SALON; form = empty(); message = ''; isError = false;
  send() {
    if (!this.form.name || !this.form.message) return this.show('Name and message are required.', true);
    this.api.sendContact(this.form).subscribe({
      next: () => { this.form = empty(); this.show('Message sent. Thank you!', false); },
      error: () => this.show('Error, try again.', true)
    });
  }
  private show(m: string, err: boolean) { this.message = m; this.isError = err; }
}
