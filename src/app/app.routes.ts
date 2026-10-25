import { Routes } from "@angular/router";
import { authGuard, roleGuard } from "./core/guards/auth.guard";

const adminOnly = [roleGuard(["admin"])];
const admin = () => import("./features/admin/admin-pages");

export const routes: Routes = [
  { path: "", loadComponent: () => import("./features/home/home.component").then(m => m.HomeComponent) },
  { path: "about", loadComponent: () => import("./features/about/about.component").then(m => m.AboutComponent) },
  { path: "services", loadComponent: () => import("./features/services/services.component").then(m => m.ServicesComponent) },
  { path: "contact", loadComponent: () => import("./features/contact/contact.component").then(m => m.ContactComponent) },

  // ----- Admin portal -----
  { path: "admin/login", loadComponent: () => import("./features/admin/admin-login.component").then(m => m.AdminLoginComponent) },
  {
    path: "admin", canActivate: [authGuard],
    loadComponent: () => import("./features/admin/admin-layout.component").then(m => m.AdminLayoutComponent),
    children: [
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
      { path: "dashboard", canActivate: adminOnly, loadComponent: () => admin().then(m => m.DashboardPage) },
      { path: "appointments", loadComponent: () => admin().then(m => m.AppointmentsPage) },
      { path: "reviews", canActivate: adminOnly, loadComponent: () => admin().then(m => m.ReviewsPage) },
      { path: "services", canActivate: adminOnly, loadComponent: () => admin().then(m => m.ServicesPage) },
      { path: "slider", canActivate: adminOnly, loadComponent: () => admin().then(m => m.SliderPage) },
      { path: "about", canActivate: adminOnly, loadComponent: () => admin().then(m => m.AboutPage) },
      { path: "rate-list", canActivate: adminOnly, loadComponent: () => admin().then(m => m.RateListPage) },
      { path: "messages", canActivate: adminOnly, loadComponent: () => admin().then(m => m.MessagesPage) },
      { path: "staff", canActivate: adminOnly, loadComponent: () => admin().then(m => m.StaffPage) }
    ]
  },
  { path: "**", redirectTo: "" }
];
