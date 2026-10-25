export interface SalonService { _id?: string; title: string; description: string; icon: string; visible?: boolean; imageUrl?: string | null; }
// Service save karte waqt: image = nayi picture, removeImage = picture hatao, kuch nahi = picture waisi hi
export interface ServicePayload { _id?: string; title: string; description: string; icon: string; visible?: boolean; image?: string; removeImage?: boolean; }
export type AppointmentStatus = "pending" | "confirmed" | "cancelled";
export interface AppointmentPayload { name: string; phone: string; email: string; branch: string; service: string; date: string; time: string; }
export interface Appointment extends AppointmentPayload { _id: string; status: AppointmentStatus; createdAt: string; statusChangedBy?: string; statusChangedAt?: string; }
export interface ContactPayload { name: string; email: string; phone: string; message: string; }
export interface ContactMessage extends ContactPayload { _id: string; createdAt: string; }
export interface NewsletterPayload { email: string; gender: "Female" | "Male"; }
export interface Promo { image: string; active: boolean; }

export type Role = "admin" | "staff";
export interface LoginResponse { token: string; role?: Role; name?: string; }
export interface Review { _id?: string; name: string; text: string; rating: number; visible: boolean; }
export interface AboutInfo { title: string; text: string; imageUrl?: string | null; }
export interface AboutPayload { title: string; text: string; image?: string; removeImage?: boolean; }
export interface StaffUser { _id: string; name: string; email: string; role: Role; }

export interface Slide { _id?: string; title: string; text: string; visible?: boolean; order?: number; imageUrl?: string | null; }
// Slide save karte waqt: image = nayi picture (naye slide ke liye zaroori), na bhejein = picture waisi hi
export interface SlidePayload { _id?: string; title: string; text: string; visible?: boolean; image?: string; }
