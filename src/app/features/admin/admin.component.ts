import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../core/services/salon-api.service';
import { AuthService } from '../../core/services/auth.service';
import { Appointment, AppointmentStatus, ContactMessage } from '../../core/models/models';

@Component({
  selector: 'app-admin', standalone: true, imports: [FormsModule],
  template: `<section class="container"><h1>Admin Panel</h1><br>
  @if (!loggedIn) {
    <div style="max-width:320px">
      <input type="password" placeholder="Admin key" [(ngModel)]="key">
      <button class="btn" (click)="login()">Login</button>
      @if (error) { <div class="msg err" style="margin-top:10px">{{ error }}</div> }
    </div>
  } @else {
    <button class="btn" (click)="logout()">Logout</button><br><br>
    <h3>Appointments</h3>
    <div class="scroll"><table>
      <tr><th>Name</th><th>Phone</th><th>Email</th><th>Service</th><th>Branch</th><th>Date</th><th>Time</th><th>Status</th><th>Contact</th></tr>
      @for (a of appointments; track a._id) {
        <tr>
          <td>{{ a.name }}</td><td>{{ a.phone }}</td><td>{{ a.email }}</td><td>{{ a.service }}</td>
          <td>{{ a.branch }}</td><td>{{ a.date }}</td><td>{{ a.time }}</td>
          <td><select [ngModel]="a.status" (ngModelChange)="setStatus(a, $event)">
            <option>pending</option><option>confirmed</option><option>cancelled</option></select></td>
          <td><a class="wa" [href]="waLink(a)" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a></td>
        </tr>
      }
    </table></div>
    <br><h3>Messages</h3>
    <div class="scroll"><table>
      <tr><th>Name</th><th>Email</th><th>Phone</th><th>Message</th></tr>
      @for (c of messages; track c._id) { <tr><td>{{ c.name }}</td><td>{{ c.email }}</td><td>{{ c.phone }}</td><td>{{ c.message }}</td></tr> }
    </table></div>
  }</section>`,
  styles: [`
  .scroll{overflow:auto}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{border:1px solid #eee;padding:8px;text-align:left}
  th{background:var(--soft)}td select{margin:0}
  .wa{background:#25d366;color:#fff;padding:6px 12px;border-radius:20px;font-size:13px;white-space:nowrap}`]
})
export class AdminComponent implements OnInit {
  private api = inject(SalonApiService);
  private auth = inject(AuthService);
  key = ''; error = ''; loggedIn = false;
  appointments: Appointment[] = []; messages: ContactMessage[] = [];

  ngOnInit() { if (this.auth.adminKey()) this.load(); }
  login() { this.auth.login(this.key); this.load(); }
  logout() { this.auth.logout(); this.loggedIn = false; this.key = ''; }

  setStatus(a: Appointment, s: AppointmentStatus) {
    this.api.updateStatus(a._id, s).subscribe(() => (a.status = s));
  }

  waLink(a: Appointment): string {
    let n = a.phone.replace(/\D/g, '');
    if (n.startsWith('0')) n = '92' + n.slice(1);
    const detail = `${a.service} at ${a.branch} on ${a.date} at ${a.time}`;
    const text = a.status === 'confirmed'
      ? `Assalam o Alaikum ${a.name}, your appointment for ${detail} is confirmed. - Zara Beauty Studio`
      : a.status === 'cancelled'
        ? `Assalam o Alaikum ${a.name}, we are sorry, your appointment for ${detail} has been cancelled. Please contact us to reschedule. - Zara Beauty Studio`
        : `Assalam o Alaikum ${a.name}, we received your appointment request for ${detail}. - Zara Beauty Studio`;
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  }

  private load() {
    this.api.getAppointments().subscribe({
      next: a => { this.appointments = a; this.loggedIn = true; this.error = ''; this.api.getContacts().subscribe(c => (this.messages = c)); },
      error: () => { this.auth.logout(); this.loggedIn = false; this.error = 'Wrong admin key.'; }
    });
  }
}