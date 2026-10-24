import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { Role } from "../models/models";

// Login ke baghair admin pages nahi khulenge
export const authGuard: CanActivateFn = () =>
  inject(AuthService).token() ? true : inject(Router).createUrlTree(["/admin/login"]);

// Sirf di gayi roles ko page milega, baaqi appointments page par wapas
export const roleGuard = (roles: Role[]): CanActivateFn => () => {
  const role = inject(AuthService).role();
  return role && roles.includes(role) ? true : inject(Router).createUrlTree(["/admin/appointments"]);
};
