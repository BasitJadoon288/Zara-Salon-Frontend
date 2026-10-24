import { Injectable, computed, signal } from "@angular/core";
import { Role } from "../models/models";

export interface SessionUser { name: string; role: Role; }

const KEY = "adminToken";
const USER_KEY = "adminUser";
const LAST_KEY = "adminLastActive";
const IDLE_MS = 2 * 60 * 1000; // 2 minutes of inactivity
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

function readUser(): SessionUser | null {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}

@Injectable({ providedIn: "root" })
export class AuthService {
  readonly token = signal<string>(sessionStorage.getItem(KEY) ?? "");
  readonly user = signal<SessionUser | null>(readUser());
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);
  readonly expired = signal(false);

  private timer?: ReturnType<typeof setTimeout>;
  private lastWrite = 0;
  private onActivity = () => {
    const now = Date.now();
    if (now - this.lastWrite < 1000) return;
    this.lastWrite = now;
    sessionStorage.setItem(LAST_KEY, String(now));
    this.resetTimer();
  };

  constructor() {
    if (!this.token()) return;
    const last = Number(sessionStorage.getItem(LAST_KEY) || 0);
    if (!this.user() || !last || Date.now() - last >= IDLE_MS) this.logout(true);
    else this.startWatching();
  }

  setSession(token: string, user: SessionUser) {
    sessionStorage.setItem(KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(LAST_KEY, String(Date.now()));
    this.token.set(token);
    this.user.set(user);
    this.expired.set(false);
    this.startWatching();
  }

  logout(expired = false) {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(LAST_KEY);
    this.token.set("");
    this.user.set(null);
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
