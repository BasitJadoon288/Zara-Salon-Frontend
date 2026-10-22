import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { Appointment, AppointmentPayload, AppointmentStatus, ContactMessage, ContactPayload, NewsletterPayload, Promo, SalonService } from '../models/models';
import { FALLBACK_SERVICES } from '../config/salon.config';

@Injectable({ providedIn: 'root' })
export class SalonApiService {
  private http = inject(HttpClient);
  private base = '/api';

  readonly services$: Observable<SalonService[]> = this.http.get<SalonService[]>(`${this.base}/services`).pipe(
    map(list => (list.length ? list : FALLBACK_SERVICES)),
    catchError(() => of(FALLBACK_SERVICES)),
    shareReplay(1)
  );

  bookAppointment(data: AppointmentPayload) { return this.http.post(`${this.base}/appointments`, data); }
  sendContact(data: ContactPayload) { return this.http.post(`${this.base}/contacts`, data); }
  subscribe(data: NewsletterPayload) { return this.http.post(`${this.base}/subscribe`, data); }

  // Rate list ad (popup)
  getPromo() { return this.http.get<{ image: string } | null>(`${this.base}/promo`); }
  getPromoAdmin() { return this.http.get<Promo | null>(`${this.base}/promo/admin`); }
  savePromo(data: { image?: string; active?: boolean }) { return this.http.put<Promo>(`${this.base}/promo`, data); }
  deletePromo() { return this.http.delete(`${this.base}/promo`); }

  // Admin
  adminLogin(email: string, password: string) { return this.http.post<{ token: string }>(`${this.base}/admin/login`, { email, password }); }
  getAppointments() { return this.http.get<Appointment[]>(`${this.base}/appointments`); }
  updateStatus(id: string, status: AppointmentStatus) { return this.http.patch(`${this.base}/appointments/${id}`, { status }); }
  getContacts() { return this.http.get<ContactMessage[]>(`${this.base}/contacts`); }
}