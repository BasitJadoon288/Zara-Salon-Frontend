import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, defer, map, of, tap } from "rxjs";
import {
  AboutInfo, AboutPayload, Application, ApplicationsPage, ApplicationStatus, ApplyPayload, GalleryItem, GalleryPage, Job, Appointment, Availability, AppointmentPayload, BookingResult, BookingRules, ManageAppointment, Stylist, StylistLite, AppointmentStatus, ContactMessage, ContactPayload,
  LoginResponse, NewsletterPayload, TimingSettings, Promo, Review, SalonService, ServicePayload, Slide, SlidePayload, StaffUser
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
  // Is branch / service / date ke time slots. stylist = khaas stylist, exclude = booking code (reschedule mein apni purani booking khali ginne ke liye)
  getAvailability(branch: string, service: string, date: string, stylist = '', exclude = '') {
    const params: Record<string, string> = { branch, service, date };
    if (stylist) params['stylist'] = stylist;
    if (exclude) params['exclude'] = exclude;
    return this.http.get<Availability>(`${this.base}/appointments/availability`, { params });
  }
  getRules() { return this.http.get<BookingRules>(`${this.base}/appointments/rules`); }
  requestOtp(email: string) { return this.http.post<{ ok: boolean; resendIn: number }>(`${this.base}/appointments/otp`, { email }); }
  getStylists(branch: string, service: string) { return this.http.get<StylistLite[]>(`${this.base}/stylists`, { params: { branch, service } }); }
  bookAppointment(data: AppointmentPayload) { return this.http.post<BookingResult>(`${this.base}/appointments`, data); }

  // ---------- Customer: booking code se dekhna / badalna / cancel ----------
  getManage(code: string) { return this.http.get<ManageAppointment>(`${this.base}/appointments/manage/${encodeURIComponent(code)}`); }
  manageReschedule(code: string, date: string, time: string) { return this.http.post<ManageAppointment>(`${this.base}/appointments/manage/${encodeURIComponent(code)}/reschedule`, { date, time }); }
  manageCancel(code: string) { return this.http.post<ManageAppointment>(`${this.base}/appointments/manage/${encodeURIComponent(code)}/cancel`, {}); }

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
  createAppointmentAdmin(data: AppointmentPayload) { return this.http.post<Appointment>(`${this.base}/appointments/admin`, data); }
  rescheduleAppointment(id: string, body: { date: string; time: string; stylistId: string }) { return this.http.patch<Appointment>(`${this.base}/appointments/${id}/reschedule`, body); }
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

  // ---------- Salon timing (admin) ----------
  getTiming() { return this.http.get<TimingSettings>(`${this.base}/admin/timing`); }
  saveTiming(t: TimingSettings) {
    const { openTime, closeTime, slotStep, chairs, closedDays, branches, breaks, closures, holdHours, maxActivePerPhone, requireEmailOtp, customerChanges, changeCutoffHours } = t;
    return this.http.put<TimingSettings>(`${this.base}/admin/timing`, { openTime, closeTime, slotStep, chairs, closedDays, branches, breaks, closures, holdHours, maxActivePerPhone, requireEmailOtp, customerChanges, changeCutoffHours });
  }

  // ---------- Team (stylists) - admin ----------
  getStylistsAdmin() { return this.http.get<Stylist[]>(`${this.base}/admin/stylists`); }
  saveStylist(s: Stylist) { return s._id ? this.http.put<Stylist>(`${this.base}/admin/stylists/${s._id}`, s) : this.http.post<Stylist>(`${this.base}/admin/stylists`, s); }
  deleteStylist(id: string) { return this.http.delete(`${this.base}/admin/stylists/${id}`); }

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

  // ---------- Gallery ----------
  getGallery(page = 1) { return this.http.get<GalleryPage>(`${this.base}/gallery`, { params: { page } }); }
  getGalleryAdmin(page = 1) { return this.http.get<GalleryPage>(`${this.base}/admin/gallery`, { params: { page } }); }
  uploadPhoto(p: { caption: string; image: string; thumb: string }) { return this.http.post<GalleryItem>(`${this.base}/gallery`, p); }
  updatePhoto(id: string, body: { caption?: string; visible?: boolean }) { return this.http.put<GalleryItem>(`${this.base}/gallery/${id}`, body); }
  deletePhoto(id: string) { return this.http.delete(`${this.base}/gallery/${id}`); }
  bulkPhotos(action: 'delete' | 'hide' | 'show', ids: string[]) { return this.http.post(`${this.base}/gallery/bulk`, { action, ids }); }

  // ---------- Careers ----------
  getJobs() { return this.http.get<Job[]>(`${this.base}/careers/jobs`); }
  applyForJob(p: ApplyPayload) { return this.http.post<{ ok: boolean }>(`${this.base}/careers/apply`, p); }
  getJobsAdmin() { return this.http.get<Job[]>(`${this.base}/admin/careers/jobs`); }
  saveJob(j: Job) { return j._id ? this.http.put<Job>(`${this.base}/admin/careers/jobs/${j._id}`, j) : this.http.post<Job>(`${this.base}/admin/careers/jobs`, j); }
  deleteJob(id: string) { return this.http.delete(`${this.base}/admin/careers/jobs/${id}`); }
  getApplications(q: { job?: string; status?: string; q?: string; page?: number }) {
    const params: Record<string, string> = {};
    if (q.job) params['job'] = q.job; if (q.status) params['status'] = q.status; if (q.q) params['q'] = q.q; if (q.page) params['page'] = String(q.page);
    return this.http.get<ApplicationsPage>(`${this.base}/admin/careers/applications`, { params });
  }
  updateApplication(id: string, body: { status?: ApplicationStatus; notes?: string }) { return this.http.patch<Application>(`${this.base}/admin/careers/applications/${id}`, body); }
  deleteApplication(id: string) { return this.http.delete(`${this.base}/admin/careers/applications/${id}`); }
  downloadCv(id: string) { return this.http.get(`${this.base}/admin/careers/applications/${id}/cv`, { responseType: 'blob' }); }
}
