import { Component, HostListener, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { SALON } from '../../core/config/salon.config';
import { Role } from '../../core/models/models';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle.component';

interface NavItem { label: string; path: string; icon: string; roles: Role[]; }

const NAV: NavItem[] = [
  { label: 'Dashboard', path: 'dashboard', icon: 'fa-solid fa-gauge', roles: ['admin'] },
  { label: 'Appointments', path: 'appointments', icon: 'fa-solid fa-calendar-check', roles: ['admin', 'staff'] },
  { label: 'Reviews', path: 'reviews', icon: 'fa-solid fa-star', roles: ['admin'] },
  { label: 'Services', path: 'services', icon: 'fa-solid fa-spa', roles: ['admin'] },
  { label: 'Team', path: 'team', icon: 'fa-solid fa-users', roles: ['admin'] },
  { label: 'Timing', path: 'timing', icon: 'fa-solid fa-clock', roles: ['admin'] },
  { label: 'Home slider', path: 'slider', icon: 'fa-solid fa-images', roles: ['admin'] },
  { label: 'Gallery', path: 'gallery', icon: 'fa-solid fa-photo-film', roles: ['admin'] },
  { label: 'Careers', path: 'careers', icon: 'fa-solid fa-briefcase', roles: ['admin'] },
  { label: 'Applications', path: 'applications', icon: 'fa-solid fa-file-lines', roles: ['admin'] },
  { label: 'About page', path: 'about', icon: 'fa-solid fa-circle-info', roles: ['admin'] },
  { label: 'Rate list popup', path: 'rate-list', icon: 'fa-solid fa-tags', roles: ['admin'] },
  { label: 'Messages', path: 'messages', icon: 'fa-solid fa-envelope', roles: ['admin'] },
  { label: 'Staff accounts', path: 'staff', icon: 'fa-solid fa-user-group', roles: ['admin'] }
];

@Component({
  selector: 'app-admin-layout', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent],
  encapsulation: ViewEncapsulation.None, // is file ki styles poore admin portal par lagti hain
  template: `<div class="adm">
    <aside class="adm-side" [class.open]="open()">
      <div class="adm-brand">{{ salon }}<small>Admin portal</small></div>
      <nav>
        @for (i of items(); track i.path) {
          <a [routerLink]="i.path" routerLinkActive="on" (click)="open.set(false)"><i [class]="i.icon"></i>{{ i.label }}</a>
        }
      </nav>
      <div class="adm-user">
        <div class="adm-user-row">
          <div class="adm-who"><b>{{ auth.user()?.name }}</b><span>{{ auth.user()?.role }}</span></div>
          <button type="button" class="adm-gear" (click)="toggleMenu($event)" aria-label="Settings" aria-haspopup="menu" [attr.aria-expanded]="menu()" title="Settings"><i class="fa-solid fa-gear"></i></button>
        </div>
        @if (menu()) {
          <div class="adm-pop" role="menu" (click)="$event.stopPropagation()">
            <button type="button" role="menuitem" class="adm-pop-item" (click)="theme.toggle(); menu.set(false)">
              <i [class]="theme.isDark() ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>{{ theme.isDark() ? 'Light mode' : 'Dark mode' }}</button>
            <button type="button" role="menuitem" class="adm-pop-item out" (click)="menu.set(false); auth.logout()">
              <i class="fa-solid fa-right-from-bracket"></i>Log out</button>
          </div>
        }
      </div>
    </aside>
    @if (open()) { <div class="adm-shade" (click)="open.set(false)"></div> }
    <div class="adm-main">
      <header class="adm-top"><button class="adm-btn ghost" (click)="open.set(true)" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button>{{ salon }}<app-theme-toggle class="adm-top-theme" /></header>
      <main class="adm-page"><router-outlet /></main>
    </div>
  </div>`,
  styles: [`
  app-admin-layout{display:block;flex:1}
  .adm{display:flex;min-height:100vh;background:var(--adm-bg);color:var(--adm-text);font-size:14px}
  .adm-side{width:240px;flex:none;background:var(--dark);color:#e9d6de;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;box-shadow:1px 0 0 var(--card-ring)}
  .adm-brand{padding:22px 20px;font:700 20px 'Playfair Display',serif;color:#fff;line-height:1.2}
  .adm-brand small{display:block;font:400 12px Poppins,sans-serif;color:#c9a9b6;margin-top:4px}
  /* Menu scroll hota rahega (mouse wheel / touch se) lekin scroll bar nazar nahi aayega */
  .adm-side nav{flex:1;padding:8px 10px;overflow:auto;scrollbar-width:none;-ms-overflow-style:none}
  .adm-side nav::-webkit-scrollbar{display:none;width:0;height:0}
  .adm-side nav a{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;color:#e9d6de;margin-bottom:2px}
  .adm-side nav a i{width:18px;text-align:center;opacity:.85}
  .adm-side nav a:hover{background:#ffffff14}
  .adm-side nav a.on{background:var(--rose);color:#fff}
  .adm-user{padding:16px;border-top:1px solid #ffffff1f}
  .adm-user b{display:block;color:#fff}
  .adm-user span{font-size:12px;color:#c9a9b6;text-transform:capitalize}
  /* Settings (gear) button: dabane par Light / Dark mode aur Log out ka chhota menu khulta hai */
  .adm-user{position:relative}
  .adm-user-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .adm-who{min-width:0}.adm-who b,.adm-who span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .adm-gear{flex:none;width:38px;height:38px;border-radius:50%;border:1px solid #ffffff40;background:#ffffff14;color:#fff;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:background .2s,transform .3s}
  .adm-gear:hover,.adm-gear[aria-expanded="true"]{background:var(--rose);border-color:var(--rose)}
  .adm-gear[aria-expanded="true"] i{transform:rotate(60deg)}
  .adm-pop{position:absolute;left:12px;right:12px;bottom:calc(100% - 6px);background:#2b1b24;border:1px solid #ffffff26;border-radius:10px;box-shadow:0 10px 28px #000a;padding:6px;display:grid;gap:2px;z-index:5}
  .adm-pop-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:0;border-radius:8px;background:none;color:#f3e6ec;font:500 13px 'Poppins',sans-serif;text-align:left;cursor:pointer}
  .adm-pop-item i{width:16px;text-align:center}
  .adm-pop-item:hover,.adm-pop-item:focus-visible{background:#ffffff1a;outline:none}
  .adm-pop-item.out:hover,.adm-pop-item.out:focus-visible{background:#a12222;color:#fff}
  .adm-main{flex:1;min-width:0}
  .adm-top{display:none}
  .adm-page{padding:28px 32px;max-width:1200px}
  .adm-shade{display:none}

  .adm h2{font-size:26px}
  .adm h3{font-size:18px;margin-bottom:12px}
  .adm input,.adm select,.adm textarea{margin:0}
  .adm-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px}
  .adm-inline{display:flex;align-items:center;gap:10px}
  .adm-inline input{width:auto}
  .adm-note{color:var(--adm-muted)}
  .adm-card{background:var(--surface);border:1px solid var(--adm-line);border-radius:12px;padding:20px;margin-bottom:20px}
  .adm-form{display:grid;gap:12px;max-width:560px}
  .adm-form label{font-size:13px;color:var(--adm-label);margin-bottom:-6px}
  .adm-row{display:flex;gap:10px;flex-wrap:wrap}
  .adm-filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;align-items:center}
  .adm-scroll{overflow:auto}
  .adm-empty{padding:26px;text-align:center;color:var(--adm-muted)}

  .adm-btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:8px;padding:9px 16px;background:var(--rose);color:#fff;font:500 13px Poppins,sans-serif;cursor:pointer}
  .adm-btn:disabled{opacity:.6;cursor:default}
  .adm-btn.ghost{background:transparent;color:var(--rose-ink);border:1px solid var(--adm-ghost-line)}
  .adm-btn.danger{background:#a12222}
  .adm-btn.sm{padding:6px 12px}
  .adm-wa{display:inline-flex;align-items:center;gap:6px;background:#25d366;color:#fff;padding:6px 12px;border-radius:8px;font-size:13px;white-space:nowrap}

  .adm-table{width:100%;border-collapse:collapse}
  .adm-table th,.adm-table td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--adm-line-2);vertical-align:top}
  .adm-table th{font-weight:600;color:var(--adm-th-ink);background:var(--adm-th-bg);white-space:nowrap}
  .adm-table td select{width:auto}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500;text-transform:capitalize}
  .badge.pending{background:var(--bd-pend-bg);color:var(--bd-pend-ink)}
  .badge.confirmed{background:var(--bd-ok-bg);color:var(--bd-ok-ink)}
  .badge.cancelled{background:var(--bd-bad-bg);color:var(--bd-bad-ink)}

  .adm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
  .st{border-left:4px solid var(--adm-stat-line);padding:4px 14px}
  .st b{display:block;font:600 34px 'Playfair Display',serif;line-height:1.15;color:var(--heading)}
  .st span{color:var(--adm-muted)}
  .st.warn{border-color:#e0a21b}.st.ok{border-color:#2f9e5a}.st.bad{border-color:#c0392b}
  .adm-bars{display:flex;gap:10px;align-items:flex-end;height:170px;padding-top:10px}
  .adm-bars .bar{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px}
  .adm-bars .bar i{display:block;width:100%;max-width:46px;background:var(--rose);border-radius:6px 6px 0 0;min-height:3px}
  .adm-bars .bar span{font-size:12px;color:var(--adm-muted);text-align:center}
  .adm-stars{color:#e0a21b;letter-spacing:2px}
  .adm-preview{width:220px;max-height:320px;object-fit:contain;border:1px solid var(--adm-line);border-radius:10px;background:var(--adm-photo-bg)}
  .adm-chk{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--adm-text)}
  .adm-chk input{width:auto}

  @media(max-width:860px){
    .adm-side{position:fixed;left:0;top:0;z-index:70;transform:translateX(-100%);transition:transform .2s}
    .adm-side.open{transform:none}
    .adm-shade{display:block;position:fixed;inset:0;background:#0006;z-index:60}
    .adm-top{display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--surface);border-bottom:1px solid var(--adm-line);font:700 17px 'Playfair Display',serif;color:var(--rose-ink)}
    .adm-top-theme{margin-left:auto}
    .adm-page{padding:20px 16px}
  }`]
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  private router = inject(Router);
  salon = SALON.name;
  open = signal(false);
  menu = signal(false);   // Settings (gear) ka menu khula hai ya nahi
  items = computed(() => { const r = this.auth.role(); return r ? NAV.filter(n => n.roles.includes(r)) : []; });

  toggleMenu(e: Event) { e.stopPropagation(); this.menu.update(v => !v); }
  // Menu ke bahar click ya Esc dabane par band ho jaye
  @HostListener('document:click') closeMenu() { this.menu.set(false); }
  @HostListener('document:keydown.escape') closeOnEsc() { this.menu.set(false); }

  constructor() {
    // Logout ya session khatam hone par khud login page par
    effect(() => { if (!this.auth.token()) this.router.navigateByUrl('/admin/login'); });
  }
}
