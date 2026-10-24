import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, map, of, shareReplay } from "rxjs";
import {
  AboutInfo, Appointment, AppointmentPayload, AppointmentStatus, ContactMessage, ContactPayload,
  LoginResponse, NewsletterPayload, Promo, Review, SalonService, StaffUser
} from "../models/models";
import { FALLBACK_SERVICES } from "../config/salon.config";

@Injectable({ providedIn: "root" })
export class SalonApiService {
  private http = inject(HttpClient);
  private base = "/api";

  // ---------- Public ----------
  readonly services$: Observable<SalonService[]> = this.http.get<SalonService[]>(`${this.base}/services`).pipe(
    map(list => (list.length ? list : FALLBACK_SERVICES)),
    catchError(() => of(FALLBACK_SERVICES)),
    shareReplay(1)
  );
  getReviews() { return this.http.get<Review[]>(`${this.base}/reviews`); }
  getAbout() { return this.http.get<AboutInfo | null>(`${this.base}/about`); }
  bookAppointment(data: AppointmentPayload) { return this.http.post(`${this.base}/appointments`, data); }
  sendContact(data: ContactPayload) { return this.http.post(`${this.base}/contacts`, data); }
  subscribe(data: NewsletterPayload) { return this.http.post(`${this.base}/subscribe`, data); }
  getPromo() { return this.http.get<{ image: string } | null>(`${this.base}/promo`); }

  // ---------- Auth ----------
  adminLogin(email: string, password: string) { return this.http.post<LoginResponse>(`${this.base}/admin/login`, { email, password }); }

  // ---------- Appointments & messages ----------
  getAppointments() { return this.http.get<Appointment[]>(`${this.base}/appointments`); }
  updateStatus(id: string, status: AppointmentStatus) { return this.http.patch(`${this.base}/appointments/${id}`, { status }); }
  getContacts() { return this.http.get<ContactMessage[]>(`${this.base}/contacts`); }

  // ---------- Reviews (admin) ----------
  getReviewsAdmin() { return this.http.get<Review[]>(`${this.base}/admin/reviews`); }
  saveReview(r: Review) {
    return r._id ? this.http.put<Review>(`${this.base}/reviews/${r._id}`, r) : this.http.post<Review>(`${this.base}/reviews`, r);
  }
  deleteReview(id: string) { return this.http.delete(`${this.base}/reviews/${id}`); }

  // ---------- Services (admin) ----------
  getServicesFresh() { return this.http.get<SalonService[]>(`${this.base}/services`); }
  saveService(s: SalonService) {
    return s._id ? this.http.put<SalonService>(`${this.base}/services/${s._id}`, s) : this.http.post<SalonService>(`${this.base}/services`, s);
  }
  deleteService(id: string) { return this.http.delete(`${this.base}/services/${id}`); }

  // ---------- About (admin) ----------
  saveAbout(a: AboutInfo) { return this.http.put<AboutInfo>(`${this.base}/about`, a); }

  // ---------- Rate list popup (admin) ----------
  getPromoAdmin() { return this.http.get<Promo | null>(`${this.base}/promo/admin`); }
  savePromo(data: { image?: string; active?: boolean }) { return this.http.put<Promo>(`${this.base}/promo`, data); }
  deletePromo() { return this.http.delete(`${this.base}/promo`); }

  // ---------- Staff accounts (admin) ----------
  getUsers() { return this.http.get<StaffUser[]>(`${this.base}/admin/users`); }
  addUser(u: { name: string; email: string; password: string; role: "staff" }) { return this.http.post<StaffUser>(`${this.base}/admin/users`, u); }
  deleteUser(id: string) { return this.http.delete(`${this.base}/admin/users/${id}`); }
}
