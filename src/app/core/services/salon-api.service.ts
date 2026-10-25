import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, defer, map, of, tap } from "rxjs";
import {
  AboutInfo, AboutPayload, Appointment, AppointmentPayload, AppointmentStatus, ContactMessage, ContactPayload,
  LoginResponse, NewsletterPayload, Promo, Review, SalonService, ServicePayload, Slide, SlidePayload, StaffUser
} from "../models/models";
import { FALLBACK_SERVICES } from "../config/salon.config";

@Injectable({ providedIn: "root" })
export class SalonApiService {
  private http = inject(HttpClient);
  private base = "/api";

  // ---------- Public ----------
  // Har baar naya data aata hai (purani list yaad nahi rehti). API fail ho to console mein warning aur default services.
  readonly services$: Observable<SalonService[]> = defer(() =>
    this.http.get<SalonService[]>(`${this.base}/services`).pipe(
      map(list => (list.length ? list : FALLBACK_SERVICES)),
      catchError(err => { console.warn("Could not load services, showing defaults.", err); return of(FALLBACK_SERVICES); })
    ));
  getReviews() {
    return this.http.get<Review[]>(`${this.base}/reviews`).pipe(tap({ error: e => console.warn("Could not load reviews", e) }));
  }
  getAbout() {
    return this.http.get<AboutInfo | null>(`${this.base}/about`).pipe(tap({ error: e => console.warn("Could not load about", e) }));
  }
  bookAppointment(data: AppointmentPayload) { return this.http.post(`${this.base}/appointments`, data); }
  sendContact(data: ContactPayload) { return this.http.post(`${this.base}/contacts`, data); }
  subscribe(data: NewsletterPayload) { return this.http.post(`${this.base}/subscribe`, data); }
  getPromo() { return this.http.get<{ image: string } | null>(`${this.base}/promo`); }

  getSlides() {
    return this.http.get<Slide[]>(`${this.base}/slides`).pipe(tap({ error: e => console.warn("Could not load slides", e) }));
  }

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
  getServicesAdmin() { return this.http.get<SalonService[]>(`${this.base}/admin/services`); } // chhupi hui bhi
  saveService(s: ServicePayload) {
    return s._id ? this.http.put<SalonService>(`${this.base}/services/${s._id}`, s) : this.http.post<SalonService>(`${this.base}/services`, s);
  }
  deleteService(id: string) { return this.http.delete(`${this.base}/services/${id}`); }

  // ---------- Home slider (admin) ----------
  getSlidesAdmin() { return this.http.get<Slide[]>(`${this.base}/admin/slides`); } // chhupi hui bhi
  saveSlide(s: SlidePayload) {
    return s._id ? this.http.put<Slide>(`${this.base}/slides/${s._id}`, s) : this.http.post<Slide>(`${this.base}/slides`, s);
  }
  deleteSlide(id: string) { return this.http.delete(`${this.base}/slides/${id}`); }
  reorderSlides(ids: string[]) { return this.http.put<Slide[]>(`${this.base}/slides/order`, { ids }); }

  // ---------- About (admin) ----------
  saveAbout(a: AboutPayload) { return this.http.put<AboutInfo>(`${this.base}/about`, a); }

  // ---------- Rate list popup (admin) ----------
  getPromoAdmin() { return this.http.get<Promo | null>(`${this.base}/promo/admin`); }
  savePromo(data: { image?: string; active?: boolean }) { return this.http.put<Promo>(`${this.base}/promo`, data); }
  deletePromo() { return this.http.delete(`${this.base}/promo`); }

  // ---------- Staff accounts (admin) ----------
  getUsers() { return this.http.get<StaffUser[]>(`${this.base}/admin/users`); }
  addUser(u: { name: string; email: string; password: string; role: "staff" }) { return this.http.post<StaffUser>(`${this.base}/admin/users`, u); }
  deleteUser(id: string) { return this.http.delete(`${this.base}/admin/users/${id}`); }
}
