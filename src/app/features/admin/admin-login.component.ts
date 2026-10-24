import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalonApiService } from '../../core/services/salon-api.service';
import { AuthService } from '../../core/services/auth.service';
import { SALON } from '../../core/config/salon.config';
import { Role } from '../../core/models/models';

@Component({
  selector: 'app-admin-login', standalone: true, imports: [FormsModule],
  template: `<div class="wrap"><div class="box">
    <h1>{{ salon }}</h1>
    <p class="sub">Sign in to the admin portal</p>
    @if (error) { <div class="msg err">{{ error }}</div> }
    <label>Email</label>
    <input type="email" [(ngModel)]="email" autocomplete="username">
    <label>Password</label>
    <input type="password" [(ngModel)]="password" autocomplete="current-password" (keyup.enter)="login()">
    <button class="btn" (click)="login()" [disabled]="loading">{{ loading ? 'Signing in...' : 'Sign in' }}</button>
  </div></div>`,
  styles: [`
    .wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  background-image:
    linear-gradient(
      rgba(43, 22, 32, 0.55),
      rgba(90, 29, 58, 0.65)
    ),
    url('/assets/images/background.jpg');

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
  .box{background:#fff;border-radius:16px;padding:34px;width:100%;max-width:400px}
  h1{font-size:26px;color:var(--rose)}
  .sub{margin:4px 0 22px;color:#777}
  label{display:block;font-size:13px;margin-bottom:6px;color:#555}
  .btn{width:100%;margin-top:6px;text-transform:none;letter-spacing:0;font-size:15px}`]
})
export class AdminLoginComponent {
  private api = inject(SalonApiService);
  private router = inject(Router);
  auth = inject(AuthService);
  salon = SALON.name;
  email = ''; password = ''; error = ''; loading = false;

  constructor() { if (this.auth.token()) this.router.navigateByUrl('/admin'); }

  login() {
    if (!this.email || !this.password) { this.error = 'Enter your email and password.'; return; }
    this.error = ''; this.loading = true;
    this.api.adminLogin(this.email, this.password).subscribe({
      next: r => {
        const role: Role = r.role ?? 'admin';
        this.auth.setSession(r.token, { name: r.name ?? 'Admin', role });
        this.router.navigateByUrl(role === 'admin' ? '/admin/dashboard' : '/admin/appointments');
      },
      error: e => { this.loading = false; this.error = e.error?.error || 'Could not sign in. Is the backend running?'; }
    });
  }
}
