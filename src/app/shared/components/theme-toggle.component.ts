import { Component, Input, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

// Dark / light ka button. Header, admin sidebar aur login page mein istemal hota hai.
@Component({
  selector: 'app-theme-toggle', standalone: true,
  template: `<button type="button" class="tt" [class.on-dark]="onDark" [class.with-label]="label"
      (click)="theme.toggle()" [attr.aria-pressed]="theme.isDark()"
      [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [title]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
      <i [class]="theme.isDark() ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" aria-hidden="true"></i>
      @if (label) { <span>{{ theme.isDark() ? 'Light mode' : 'Dark mode' }}</span> }
    </button>`,
  styles: [`
    :host { display: inline-flex; }
    .tt {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      width: 40px; height: 40px; padding: 0; border-radius: 50%;
      border: 1px solid var(--line); background: transparent; color: var(--text-strong);
      font-size: 16px; cursor: pointer; transition: background .2s, color .2s, border-color .2s;
    }
    .tt:hover { background: var(--rose); border-color: var(--rose); color: #fff; }
    .tt.on-dark { border-color: #ffffff40; background: #ffffff14; color: #fff; }
    .tt.on-dark:hover { background: var(--rose); border-color: var(--rose); }
    .tt.with-label { width: 100%; height: auto; padding: 9px 16px; border-radius: 8px; font: 500 13px 'Poppins', sans-serif; }
  `]
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);
  @Input() onDark = false;   // gehre background (sidebar, login) ke liye
  @Input() label = false;    // button par likha hua naam bhi dikhaye
}
