import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../core/services/salon-api.service';
import { AuthService } from '../../core/services/auth.service';
import { Appointment, AppointmentStatus, ContactMessage, Promo } from '../../core/models/models';

const SALON_NAME = 'Zara Beauty Studio'; // used in WhatsApp messages

@Component({
  selector: 'app-admin', standalone: true, imports: [FormsModule],
  template: `<section class="container"><h1>Admin Panel</h1><br>
  @if (!auth.token()) {
    <div style="max-width:340px">
      @if (auth.expired()) {
        <div class="msg err" style="margin-bottom:10px">You were logged out after 2 minutes of inactivity. Please log in again.</div>
      }
      <input type="email" placeholder="Admin email" [(ngModel)]="email" autocomplete="username">
      <input type="password" placeholder="Password" [(ngModel)]="password" autocomplete="current-password" (keyup.enter)="login()">
      <button class="btn" (click)="login()" [disabled]="loading">{{ loading ? 'Please wait...' : 'Login' }}</button>
      @if (error) { <div class="msg err" style="margin-top:10px">{{ error }}</div> }
    </div>
  } @else {
    <button class="btn" (click)="logout()">Logout</button><br><br>

    <h3>Rate List Ad (shown as a popup when the website opens)</h3>
    <div class="promo">
      @if (newImage || promo?.image) {
        <img class="preview" [src]="newImage || promo?.image" alt="Rate list preview">
      } @else {
        <p>No rate list uploaded yet.</p>
      }
      <div>
        <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFile($event)">
        <label class="chk"><input type="checkbox" [(ngModel)]="active"> Show to customers (ON)</label>
        @if (promoMsg) { <div class="msg" [class.err]="promoErr">{{ promoMsg }}</div> }
        <button class="btn" (click)="savePromo()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        @if (promo?.image) { <button class="btn grey" (click)="removePromo()">Remove image</button> }
      </div>
    </div>
    <br>

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
  .wa{background:#25d366;color:#fff;padding:6px 12px;border-radius:20px;font-size:13px;white-space:nowrap}
  .promo{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;margin-top:10px}
  .promo > div{flex:1;min-width:260px}
  .preview{width:220px;max-height:320px;object-fit:contain;border:1px solid #eee;border-radius:10px;background:#fafafa}
  .chk{display:flex;align-items:center;margin-bottom:12px;font-size:14px}
  .chk input{width:auto;margin:0 8px 0 0}
  .grey{background:#999;margin-left:8px}`]
})
export class AdminComponent implements OnInit {
  private api = inject(SalonApiService);
  auth = inject(AuthService);
  email = ''; password = ''; error = ''; loading = false;
  appointments: Appointment[] = []; messages: ContactMessage[] = [];

  promo: Promo | null = null; newImage = ''; active = true;
  promoMsg = ''; promoErr = false; saving = false;

  ngOnInit() { if (this.auth.token()) this.load(); }

  login() {
    if (!this.email || !this.password) { this.error = 'Please enter your email and password.'; return; }
    this.error = ''; this.loading = true;
    this.api.adminLogin(this.email, this.password).subscribe({
      next: r => { this.auth.setToken(r.token); this.password = ''; this.loading = false; this.load(); },
      error: e => { this.loading = false; this.error = e.error?.error || 'Could not log in. Is the backend running?'; }
    });
  }

  logout() {
    this.auth.logout(); this.appointments = []; this.messages = []; this.promo = null; this.newImage = '';
    this.email = ''; this.password = '';
  }

  setStatus(a: Appointment, s: AppointmentStatus) {
    this.api.updateStatus(a._id, s).subscribe(() => (a.status = s));
  }

  // ----- Rate list ad -----
  onFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.showPromo('Please choose an image file.', true); return; }
    this.compress(file).then(url => { this.newImage = url; this.promoMsg = ''; })
      .catch(() => this.showPromo('Could not read the image.', true));
  }

  savePromo() {
    if (!this.newImage && !this.promo?.image) { this.showPromo('Please choose an image first.', true); return; }
    this.saving = true;
    this.api.savePromo({ image: this.newImage || undefined, active: this.active }).subscribe({
      next: p => { this.promo = p; this.newImage = ''; this.saving = false; this.showPromo('Saved successfully.', false); },
      error: e => { this.saving = false; this.showPromo(e.error?.error || 'Could not save.', true); }
    });
  }

  removePromo() {
    if (!confirm('Remove the rate list image?')) return;
    this.api.deletePromo().subscribe(() => { this.promo = null; this.newImage = ''; this.showPromo('Image removed.', false); });
  }

  private showPromo(m: string, err: boolean) { this.promoMsg = m; this.promoErr = err; }

  // Shrinks the image (max 1400px, JPG) so the database and website stay light
  private compress(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  waLink(a: Appointment): string {
    let n = a.phone.replace(/\D/g, '');
    if (n.startsWith('0')) n = '92' + n.slice(1);
    const detail = `${a.service} at ${a.branch} on ${a.date} at ${a.time}`;
    const text = a.status === 'confirmed'
      ? `Assalam o Alaikum ${a.name}, your appointment for ${detail} is confirmed. - ${SALON_NAME}`
      : a.status === 'cancelled'
        ? `Assalam o Alaikum ${a.name}, we are sorry, your appointment for ${detail} has been cancelled. Please contact us to reschedule. - ${SALON_NAME}`
        : `Assalam o Alaikum ${a.name}, we received your appointment request for ${detail}. - ${SALON_NAME}`;
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  }

  private load() {
    this.api.getAppointments().subscribe(a => (this.appointments = a));
    this.api.getContacts().subscribe(c => (this.messages = c));
    this.api.getPromoAdmin().subscribe(p => { this.promo = p; this.active = p?.active ?? true; });
  }
}