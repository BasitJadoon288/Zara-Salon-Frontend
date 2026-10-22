import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
export const adminKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const key = inject(AuthService).adminKey();
  return next(key ? req.clone({ setHeaders: { "x-admin-key": key } }) : req);
};
