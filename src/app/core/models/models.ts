export interface SalonService { _id?: string; title: string; description: string; icon: string; }
export type AppointmentStatus = "pending" | "confirmed" | "cancelled";
export interface AppointmentPayload { name: string; phone: string; email: string; branch: string; service: string; date: string; time: string; }
export interface Appointment extends AppointmentPayload { _id: string; status: AppointmentStatus; createdAt: string; }
export interface ContactPayload { name: string; email: string; phone: string; message: string; }
export interface ContactMessage extends ContactPayload { _id: string; createdAt: string; }
export interface NewsletterPayload { email: string; gender: "Female" | "Male"; }
