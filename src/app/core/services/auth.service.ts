import { Injectable, signal } from "@angular/core";
const KEY = "adminKey";
@Injectable({ providedIn: "root" })
export class AuthService {
  readonly adminKey = signal<string>(sessionStorage.getItem(KEY) ?? "");
  login(key: string) { sessionStorage.setItem(KEY, key); this.adminKey.set(key); }
  logout() { sessionStorage.removeItem(KEY); this.adminKey.set(""); }
}
