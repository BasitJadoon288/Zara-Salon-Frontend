import { Injectable, signal } from '@angular/core';

const KEY = 'adminToken';
const LAST_KEY = 'adminLastActive';
const IDLE_MS = 2 * 60 * 1000; // 2 minutes of inactivity (change the number to adjust)
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly token = signal<string>(sessionStorage.getItem(KEY) ?? '');
  readonly expired = signal(false); // true = show "session expired" message on the login form

  private timer?: ReturnType<typeof setTimeout>;
  private lastWrite = 0;
  private onActivity = () => {
    const now = Date.now();
    if (now - this.lastWrite < 1000) return; // write at most once per second
    this.lastWrite = now;
    sessionStorage.setItem(LAST_KEY, String(now));
    this.resetTimer();
  };

  constructor() {
    if (!this.token()) return;
    const last = Number(sessionStorage.getItem(LAST_KEY) || 0);
    if (!last || Date.now() - last >= IDLE_MS) this.logout(true); // also checked on page refresh
    else this.startWatching();
  }

  setToken(token: string) {
    sessionStorage.setItem(KEY, token);
    sessionStorage.setItem(LAST_KEY, String(Date.now()));
    this.token.set(token);
    this.expired.set(false);
    this.startWatching();
  }

  logout(expired = false) {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(LAST_KEY);
    this.token.set('');
    this.expired.set(expired);
    this.stopWatching();
  }

  private startWatching() {
    this.stopWatching();
    EVENTS.forEach(e => document.addEventListener(e, this.onActivity, { passive: true }));
    this.resetTimer();
  }

  private stopWatching() {
    EVENTS.forEach(e => document.removeEventListener(e, this.onActivity));
    clearTimeout(this.timer);
  }

  private resetTimer() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.logout(true), IDLE_MS);
  }
}