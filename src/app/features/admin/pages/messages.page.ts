import { Component, inject, signal } from '@angular/core';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { ContactMessage } from '../../../core/models/models';

@Component({
  selector: 'app-messages-page', standalone: true,
  template: `
  <div class="adm-head"><h2>Messages</h2><span class="adm-note">{{ items().length }} total</span></div>
  <div class="adm-card adm-scroll">
    @if (items().length) {
      <table class="adm-table">
        <tr><th>Received</th><th>Name</th><th>Email</th><th>Phone</th><th>Message</th></tr>
        @for (c of items(); track c._id) {
          <tr><td>{{ c.createdAt.slice(0, 10) }}</td><td>{{ c.name }}</td><td>{{ c.email || '-' }}</td><td>{{ c.phone || '-' }}</td><td>{{ c.message }}</td></tr>
        }
      </table>
    } @else { <div class="adm-empty">No messages yet.</div> }
  </div>`
})
export class MessagesPage {
  items = signal<ContactMessage[]>([]);
  constructor() { inject(SalonApiService).getContacts().subscribe(l => this.items.set(l)); }
}
